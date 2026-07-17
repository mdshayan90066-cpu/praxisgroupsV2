import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// Generate idempotency key from Razorpay payment ID
function generateIdempotencyKey(paymentId: string): string {
  return `razorpay_payment_${paymentId}`;
}

// Send notification to user
async function sendNotification(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  title: string,
  message: string,
  type: "success" | "error" | "info" | "warning"
) {
  try {
    await supabase.from("notifications").insert({
      user_id: userId,
      title,
      message,
      type,
    });
  } catch (err) {
    console.error("Failed to send notification:", err);
  }
}

// Send email notification
async function sendEmail(
  supabase: ReturnType<typeof createClient>,
  to: string,
  subject: string,
  htmlBody: string,
  textBody: string,
  userId?: string
) {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !anonKey) return;

    await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${anonKey}`,
      },
      body: JSON.stringify({
        to,
        subject,
        html_body: htmlBody,
        text_body: textBody,
        recipient_user_id: userId,
        idempotency_key: `email_${generateIdempotencyKey(Date.now().toString())}`,
      }),
    });
  } catch (err) {
    console.error("Failed to send email:", err);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const webhookSecret = Deno.env.get("RAZORPAY_WEBHOOK_SECRET");
    if (!webhookSecret) {
      console.error("Webhook secret not configured");
      return new Response(
        JSON.stringify({ error: "Webhook not configured" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rawBody = await req.text();
    const signature = req.headers.get("X-Razorpay-Signature");

    if (!signature) {
      console.error("Missing signature header");
      return new Response(
        JSON.stringify({ error: "Missing signature" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify webhook signature
    const crypto = globalThis.crypto;
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(webhookSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const computedSig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
    const computedHex = Array.from(new Uint8Array(computedSig))
      .map((b: number) => b.toString(16).padStart(2, "0"))
      .join("");

    if (computedHex !== signature) {
      console.error("Webhook signature verification failed");
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const event = JSON.parse(rawBody);
    const paymentEntity = event.payload?.payment?.entity;

    if (!paymentEntity) {
      return new Response(
        JSON.stringify({ error: "Invalid payload structure" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const orderId = paymentEntity.order_id;
    const paymentId = paymentEntity.id;
    const paySignature = paymentEntity.signature || "";
    const status = paymentEntity.status;
    const idempotencyKey = generateIdempotencyKey(paymentId);

    console.log(`Processing webhook: order=${orderId}, payment=${paymentId}, status=${status}`);

    // Find the payment by order ID
    const { data: payment, error: payErr } = await supabase
      .from("payments")
      .select("id, workshop_application_id, student_id, webhook_processed, idempotency_key, status")
      .eq("razorpay_order_id", orderId)
      .maybeSingle();

    if (payErr) {
      console.error("Database error finding payment:", payErr.message);
      return new Response(
        JSON.stringify({ error: "Database error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!payment) {
      console.error("Payment not found for order:", orderId);
      return new Response(
        JSON.stringify({ error: "Payment not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // IDEMPOTENCY CHECK: Skip if already processed
    if (payment.webhook_processed) {
      console.log(`Payment ${payment.id} already processed, skipping duplicate webhook`);
      return new Response(
        JSON.stringify({ received: true, message: "Already processed" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check for duplicate using idempotency key
    if (payment.idempotency_key && payment.idempotency_key === idempotencyKey) {
      console.log(`Payment ${payment.id} already processed with same idempotency key`);
      return new Response(
        JSON.stringify({ received: true, message: "Duplicate request" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get student info for notifications
    const { data: studentData } = await supabase
      .from("students")
      .select("id, full_name, email, user_id")
      .eq("id", payment.student_id)
      .maybeSingle();

    // Get workshop info
    let workshopData: { name: string } | null = null;
    if (payment.workshop_application_id) {
      const { data: appData } = await supabase
        .from("workshop_applications")
        .select("workshops(name)")
        .eq("id", payment.workshop_application_id)
        .maybeSingle();
      workshopData = (appData as { workshops: { name: string } } | null)?.workshops ?? null;
    }

    // Handle different payment statuses
    if (status === "captured") {
      // Update payment record
      const { error: updateErr } = await supabase
        .from("payments")
        .update({
          status: "successful",
          razorpay_payment_id: paymentId,
          razorpay_signature: paySignature,
          idempotency_key: idempotencyKey,
          webhook_processed: true,
          webhook_processed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", payment.id);

      if (updateErr) {
        console.error("Failed to update payment:", updateErr.message);
        // Log but don't fail - we can retry
        return new Response(
          JSON.stringify({ error: "Update failed, will retry" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update workshop application status
      if (payment.workshop_application_id) {
        const { error: appErr } = await supabase
          .from("workshop_applications")
          .update({
            status: "paid",
            payment_status: "successful",
            updated_at: new Date().toISOString(),
          })
          .eq("id", payment.workshop_application_id);

        if (appErr) {
          console.error("Failed to update application:", appErr.message);
          // Payment is marked successful, log the inconsistency
        }
      }

      // Send notifications
      if (studentData?.user_id) {
        await sendNotification(
          supabase,
          studentData.user_id,
          "Payment Successful",
          `Your payment for ${workshopData?.name || "workshop"} has been confirmed.`,
          "success"
        );
      }

      // Send email
      if (studentData?.email) {
        await sendEmail(
          supabase,
          studentData.email,
          "Payment Successful - Praxis Group",
          `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: #C9A84C; color: #000; padding: 20px; text-align: center;">
                <h1>Payment Confirmed</h1>
              </div>
              <div style="padding: 20px; background: #f9f9f9;">
                <p>Dear ${studentData.full_name || "Student"},</p>
                <p>Your payment has been successfully processed.</p>
                <p><strong>Workshop:</strong> ${workshopData?.name || "N/A"}</p>
                <p><strong>Payment ID:</strong> ${paymentId}</p>
                <p>You will receive further instructions about the workshop soon.</p>
              </div>
            </div>
          `,
          `Dear ${studentData.full_name || "Student"},\n\nYour payment has been successfully processed.\n\nWorkshop: ${workshopData?.name || "N/A"}\nPayment ID: ${paymentId}\n\nYou will receive further instructions about the workshop soon.`,
          studentData.user_id
        );
      }

      console.log(`Payment ${payment.id} processed successfully`);

    } else if (status === "failed") {
      // Update payment record
      await supabase
        .from("payments")
        .update({
          status: "failed",
          razorpay_payment_id: paymentId,
          idempotency_key: idempotencyKey,
          webhook_processed: true,
          webhook_processed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", payment.id);

      // Update workshop application
      if (payment.workshop_application_id) {
        await supabase
          .from("workshop_applications")
          .update({
            payment_status: "failed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", payment.workshop_application_id);
      }

      // Send notification
      if (studentData?.user_id) {
        await sendNotification(
          supabase,
          studentData.user_id,
          "Payment Failed",
          `Your payment for ${workshopData?.name || "workshop"} could not be processed. Please try again.`,
          "error"
        );
      }

      console.log(`Payment ${payment.id} marked as failed`);

    } else if (status === "refunded") {
      // Handle refund
      const refundAmount = paymentEntity.refund_amount || paymentEntity.amount;

      await supabase
        .from("payments")
        .update({
          status: "refunded",
          idempotency_key: idempotencyKey,
          webhook_processed: true,
          webhook_processed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", payment.id);

      // Update workshop application
      if (payment.workshop_application_id) {
        await supabase
          .from("workshop_applications")
          .update({
            payment_status: "refunded",
            updated_at: new Date().toISOString(),
          })
          .eq("id", payment.workshop_application_id);
      }

      // Create refund record
      await supabase
        .from("refunds")
        .insert({
          payment_id: payment.id,
          amount: refundAmount,
          reason: "Razorpay webhook – refund initiated",
          status: "processed",
          razorpay_refund_id: paymentEntity.refund_id,
        });

      // Send notification
      if (studentData?.user_id) {
        await sendNotification(
          supabase,
          studentData.user_id,
          "Payment Refunded",
          `Your payment for ${workshopData?.name || "workshop"} has been refunded.`,
          "info"
        );
      }

      console.log(`Payment ${payment.id} marked as refunded`);

    } else {
      // Unknown status - log but acknowledge
      console.log(`Unknown payment status: ${status}`);

      await supabase
        .from("payments")
        .update({
          webhook_processed: true,
          webhook_processed_at: new Date().toISOString(),
        })
        .eq("id", payment.id);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
