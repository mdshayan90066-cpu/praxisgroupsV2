import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Authorization is bypassed because this allows public users to pay for workshops.
    // Ensure that only valid combinations are processed.

    const { workshopId, studentId, applicationId } = await req.json();
    if (!workshopId || !studentId || !applicationId) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: workshop, error: wsErr } = await supabase
      .from("workshops")
      .select("name, price, currency")
      .eq("id", workshopId)
      .maybeSingle();
    if (wsErr || !workshop) {
      return new Response(JSON.stringify({ error: "Workshop not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const amount = Math.round((workshop.price ?? 0) * 1.18 * 100);
    if (amount <= 0) {
      return new Response(JSON.stringify({ error: "Invalid amount" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const keyId = Deno.env.get("RAZORPAY_KEY_ID");
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!keyId || !keySecret) {
      return new Response(JSON.stringify({ error: "Payment gateway not configured" }), {
        status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const orderPayload = {
      amount,
      currency: workshop.currency ?? "INR",
      receipt: `ws_${applicationId.slice(0, 30)}`,
      notes: {
        workshop_id: workshopId,
        student_id: studentId,
        application_id: applicationId,
      },
    };

    const rzpRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${btoa(`${keyId}:${keySecret}`)}`,
      },
      body: JSON.stringify(orderPayload),
    });

    if (!rzpRes.ok) {
      const errBody = await rzpRes.text();
      console.error("Razorpay order creation failed:", errBody);
      return new Response(JSON.stringify({ error: "Failed to create payment order" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const order = await rzpRes.json();

    const { error: payErr } = await supabase.from("payments").insert({
      student_id: studentId,
      workshop_application_id: applicationId,
      amount: (workshop.price ?? 0) * 1.18,
      currency: workshop.currency ?? "INR",
      status: "pending",
      razorpay_order_id: order.id,
    });

    if (payErr) {
      console.error("Failed to insert payment record:", payErr.message);
    }

    return new Response(JSON.stringify({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId,
      workshopName: workshop.name,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
