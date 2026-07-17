// supabase/functions/razorpay-create-order/index.ts

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { workshopId, studentId, applicationId, amount, currency, description } = await req.json();

    if (!workshopId || !studentId || !applicationId) {
      return new Response(
        JSON.stringify({ error: "Missing workshopId, studentId, or applicationId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!amount || typeof amount !== "number" || amount < 100) {
      return new Response(
        JSON.stringify({ error: "Amount must be a number >= 100 paise (₹1)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const keyId = Deno.env.get("RAZORPAY_KEY_ID");
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");

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
        amount,
        currency: currency || "INR",
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
        workshopName: description || "Workshop Registration",
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
