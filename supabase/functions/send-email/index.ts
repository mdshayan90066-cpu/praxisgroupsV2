import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface EmailPayload {
  to: string | string[];
  subject: string;
  html_body: string;
  text_body?: string;
  template_type?: 'registration' | 'payment_success' | 'application_status' | 'certificate' | 'custom';
  template_data?: Record<string, unknown>;
  recipient_user_id?: string;
  idempotency_key?: string;
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

    const payload: EmailPayload = await req.json();

    // Validate required fields
    if (!payload.to || !payload.subject || !payload.html_body) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, subject, html_body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check idempotency to prevent duplicate sends
    if (payload.idempotency_key) {
      const { data: existingLog } = await supabase
        .from("email_logs")
        .select("id, status")
        .eq("id", payload.idempotency_key)
        .maybeSingle();

      if (existingLog && existingLog.status === "sent") {
        return new Response(
          JSON.stringify({ message: "Email already sent", id: existingLog.id }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Get SMTP configuration from environment
    const smtpHost = Deno.env.get("SMTP_HOST");
    const smtpUser = Deno.env.get("SMTP_USER");
    const smtpPass = Deno.env.get("SMTP_PASS");
    const fromEmail = Deno.env.get("SMTP_FROM_EMAIL") || "noreply@praxisgroup.online";
    const fromName = Deno.env.get("SMTP_FROM_NAME") || "Praxis Group";

    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    // If neither SMTP nor Resend is configured, log the email for debugging
    if ((!smtpHost || !smtpUser || !smtpPass) && !resendApiKey) {
      console.log("No Email provider configured. Logging email instead:");
      console.log("To:", payload.to);
      console.log("Subject:", payload.subject);
      console.log("Body:", payload.html_body.substring(0, 200) + "...");

      // Log the attempt
      const recipientCount = Array.isArray(payload.to) ? payload.to.length : 1;
      await supabase.from("email_logs").insert({
        id: payload.idempotency_key,
        subject: payload.subject,
        body: payload.html_body,
        audience: "custom",
        recipient_count: recipientCount,
        status: "logged",
      });

      return new Response(
        JSON.stringify({
          message: "Email logged (SMTP not configured)",
          simulated: true
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Recipient list
    const recipients = Array.isArray(payload.to) ? payload.to : [payload.to];
    const recipientCount = recipients.length;

    // Determine the correct "from" address for Resend
    // Resend free tier requires using "onboarding@resend.dev"
    // If a custom verified domain is configured via SMTP_FROM_EMAIL, use that instead
    const resendFrom = resendApiKey
      ? (fromEmail !== "noreply@praxisgroup.online" ? `${fromName} <${fromEmail}>` : `Praxis Group <onboarding@resend.dev>`)
      : `"${fromName}" <${fromEmail}>`;

    // Try to send via configured email service
    let sendSuccess = false;
    let sendError: string | null = null;

    try {
      if (resendApiKey) {
        // Send via Resend API (free tier: 100 emails/day)
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: resendFrom,
            to: recipients,
            subject: payload.subject,
            html: payload.html_body,
            text: payload.text_body,
          }),
        });

        if (response.ok) {
          sendSuccess = true;
        } else {
          const errorData = await response.json();
          sendError = errorData.message || "Failed to send via Resend";
          console.error("Resend API error:", errorData);
        }
      } else {
        // No email provider configured at all
        console.error("No email provider configured (need RESEND_API_KEY).");
        sendError = "No email provider configured. Please set RESEND_API_KEY.";
      }
    } catch (err) {
      sendError = err instanceof Error ? err.message : "Unknown error";
    }

    // Log the email
    await supabase.from("email_logs").insert({
      id: payload.idempotency_key,
      subject: payload.subject,
      body: payload.html_body,
      audience: "custom",
      recipient_count: recipientCount,
      status: sendSuccess ? "sent" : "failed",
      sent_by: payload.recipient_user_id,
    });

    if (!sendSuccess) {
      return new Response(
        JSON.stringify({ error: sendError || "Failed to send email" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create notification for the user
    if (payload.recipient_user_id) {
      await supabase.from("notifications").insert({
        user_id: payload.recipient_user_id,
        title: payload.subject,
        message: `You have a new message: ${payload.subject}`,
        type: "info",
      });
    }

    return new Response(
      JSON.stringify({ message: "Email sent successfully", recipient_count: recipientCount }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("Email function error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Helper function to generate email templates
export function generateRegistrationEmail(studentName: string): EmailPayload {
  return {
    subject: "Welcome to Praxis Group!",
    html_body: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #C9A84C; color: #000; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Praxis Group</h1>
          </div>
          <div class="content">
            <p>Dear ${studentName},</p>
            <p>Thank you for registering with Praxis Group! Your account has been successfully created.</p>
            <p>You can now explore our workshops and internship opportunities to enhance your skills and career prospects.</p>
            <p>Best regards,<br>The Praxis Group Team</p>
          </div>
          <div class="footer">
            <p>Praxis Group - Where Learning Meets Opportunity</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text_body: `Dear ${studentName},\n\nThank you for registering with Praxis Group! Your account has been successfully created.\n\nYou can now explore our workshops and internship opportunities to enhance your skills and career prospects.\n\nBest regards,\nThe Praxis Group Team`,
    template_type: "registration",
  };
}

export function generatePaymentSuccessEmail(studentName: string, workshopName: string, amount: number): EmailPayload {
  return {
    subject: "Payment Successful - Praxis Group",
    html_body: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2D6A4F; color: #fff; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; }
          .amount { font-size: 24px; font-weight: bold; color: #2D6A4F; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Payment Successful</h1>
          </div>
          <div class="content">
            <p>Dear ${studentName},</p>
            <p>Your payment has been successfully processed.</p>
            <p><strong>Workshop:</strong> ${workshopName}</p>
            <p><strong>Amount Paid:</strong> <span class="amount">INR ${amount.toLocaleString()}</span></p>
            <p>You will receive further instructions about the workshop via email.</p>
            <p>Best regards,<br>The Praxis Group Team</p>
          </div>
          <div class="footer">
            <p>Praxis Group - Where Learning Meets Opportunity</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text_body: `Dear ${studentName},\n\nYour payment has been successfully processed.\n\nWorkshop: ${workshopName}\nAmount Paid: INR ${amount.toLocaleString()}\n\nYou will receive further instructions about the workshop via email.\n\nBest regards,\nThe Praxis Group Team`,
    template_type: "payment_success",
  };
}

export function generateCertificateEmail(studentName: string, programName: string, certificateNumber: string): EmailPayload {
  return {
    subject: "Your Certificate is Ready - Praxis Group",
    html_body: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #C9A84C; color: #000; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; }
          .cert-id { font-family: monospace; background: #e9e9e9; padding: 8px 16px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Certificate Issued</h1>
          </div>
          <div class="content">
            <p>Dear ${studentName},</p>
            <p>Congratulations! You have successfully completed the program and your certificate has been issued.</p>
            <p><strong>Program:</strong> ${programName}</p>
            <p><strong>Certificate ID:</strong> <span class="cert-id">${certificateNumber}</span></p>
            <p>You can verify your certificate anytime at our verification portal.</p>
            <p>Best regards,<br>The Praxis Group Team</p>
          </div>
          <div class="footer">
            <p>Praxis Group - Where Learning Meets Opportunity</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text_body: `Dear ${studentName},\n\nCongratulations! You have successfully completed the program and your certificate has been issued.\n\nProgram: ${programName}\nCertificate ID: ${certificateNumber}\n\nYou can verify your certificate anytime at our verification portal.\n\nBest regards,\nThe Praxis Group Team`,
    template_type: "certificate",
  };
}
