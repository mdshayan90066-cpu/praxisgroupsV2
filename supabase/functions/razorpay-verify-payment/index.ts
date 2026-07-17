import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

interface VerifyPaymentRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

// Helper function to generate HMAC-SHA256 signature
async function generateSignature(
  message: string,
  secret: string
): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(message)
  );
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Only allow POST
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: corsHeaders }
      );
    }

    const body: VerifyPaymentRequest = await req.json();

    // Validate required fields
    if (
      !body.razorpay_order_id ||
      !body.razorpay_payment_id ||
      !body.razorpay_signature
    ) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields',
          required: [
            'razorpay_order_id',
            'razorpay_payment_id',
            'razorpay_signature',
          ],
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Get Razorpay secret from environment
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET');

    if (!keySecret) {
      console.error('Missing RAZORPAY_KEY_SECRET in environment');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Generate signature according to Razorpay algorithm
    // Algorithm: HMAC-SHA256(order_id|payment_id, KEY_SECRET)
    const message = `${body.razorpay_order_id}|${body.razorpay_payment_id}`;
    const expectedSignature = await generateSignature(message, keySecret);

    // Compare signatures (case-insensitive)
    const isValid =
      expectedSignature.toLowerCase() ===
      body.razorpay_signature.toLowerCase();

    if (!isValid) {
      console.warn('Signature mismatch:', {
        expected: expectedSignature,
        received: body.razorpay_signature,
      });
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Signature verification failed',
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Signature is valid — payment is confirmed
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Payment verified successfully',
        order_id: body.razorpay_order_id,
        payment_id: body.razorpay_payment_id,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Unexpected error in razorpay-verify-payment:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});
