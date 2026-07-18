// supabase/functions/razorpay-create-order/index.ts
//
// Creates a Razorpay order for a workshop registration.
// IMPORTANT: the amount is looked up server-side from the `workshops` table using
// workshopId — we never trust a client-supplied amount. This closes two issues:
//   1. The frontend (ApplicationFormModal.tsx) was never sending `amount` at all,
//      which caused every payment attempt to fail with "Amount must be >= 100 paise".
//   2. Trusting a client-sent amount would let someone tamper with dev tools and
//      pay far less than the real workshop price.

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { workshopId, studentId, applicationId } = await req.json();

    if (!workshopId || !studentId || !applicationId) {
      return new Response(
        JSON.stringify({ error: "Missing workshopId, studentId, or applicationId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Service-role client — server-side only, safe to use here since this runs in
    // the Edge Function, never in the browser.
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "https://supabase.co";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6em9oY2ZueWd2Z2h4amp4dWp5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDExMzM1NywiZXhwIjoyMDk5Njg5MzU3fQ.XeJj37ovyRF3TD8O3jmX-H3jfZC5naFUqxi3pxlFC8c";
    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Server not configured (missing Supabase service credentials)" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Look up the real price directly from the database — never trust a client-sent amount.
    const { data: workshop, error: workshopErr } = await supabase
      .from("workshops")
      .select("id, name, price, price_type, currency")
      .eq("id", workshopId)
      .maybeSingle();

    if (workshopErr || !workshop) {
      return new Response(
        JSON.stringify({ error: "Workshop not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (workshop.price_type !== "paid" || !workshop.price || workshop.price <= 0) {
      return new Response(
        JSON.stringify({ error: "This workshop does not require payment" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const amountInPaise = Math.round(Number(workshop.price) * 100);
    if (amountInPaise < 100) {
      return new Response(
        JSON.stringify({ error: "Workshop price is below the minimum payable amount (₹1)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const keyId = Deno.env.get("RAZORPAY_KEY_ID") || "rzp_live_TEcApCcyhTptHt";
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET") || "gIoJYUZ97YPNKTvlUBm2O5UF";
    if (!keyId || !keySecret) {
      return new Response(
        JSON.stringify({ error: "Razorpay credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const auth = btoa(`${keyId}:${keySecret}`);

    const razorpayRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: workshop.currency || "INR",
        receipt: `application_${applicationId}`,
        notes: {
          workshopId,
          studentId,
          applicationId,
        },
      }),
    });

    if (razorpayRes.status === 401) {
      return new Response(
        JSON.stringify({ error: "Razorpay authentication failed — check your keys" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!razorpayRes.ok) {
      const errBody = await razorpayRes.text();
      return new Response(
        JSON.stringify({ error: "Razorpay order creation failed", details: errBody }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const order = await razorpayRes.json();

    return new Response(
      JSON.stringify({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: keyId,
        workshopName: workshop.name || "Workshop Registration",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Unexpected server error", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
