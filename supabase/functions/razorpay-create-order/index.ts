import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

interface CreateOrderRequest {
  amount: number; // in paise (e.g., 50000 = ₹500)
  currency?: string;
  receipt?: string;
  description?: string;
  customer_notify?: number;
  notes?: Record<string, string>;
}

interface RazorpayOrder {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: string;
  attempts: number;
  notes: Record<string, string>;
  created_at: number;
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

    const body: CreateOrderRequest = await req.json();

    // Validate amount (minimum 100 paise = ₹1)
    if (!body.amount || body.amount < 100) {
      return new Response(
        JSON.stringify({
          error: 'Invalid amount. Minimum is 100 paise (₹1)',
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Get Razorpay credentials from environment
    const keyId = Deno.env.get('RAZORPAY_KEY_ID');
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET');

    if (!keyId || !keySecret) {
      console.error('Missing Razorpay credentials in environment');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Prepare Razorpay API request
    const razorpayRequestBody = {
      amount: Math.round(body.amount),
      currency: body.currency || 'INR',
      receipt: body.receipt || `receipt_${Date.now()}`,
      description: body.description || 'Payment',
      customer_notify: body.customer_notify || 1,
      notes: body.notes || {},
    };

    // Call Razorpay API to create order
    const basicAuth = btoa(`${keyId}:${keySecret}`);
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${basicAuth}`,
      },
      body: JSON.stringify(razorpayRequestBody),
    });

    // Handle Razorpay API errors
    if (!response.ok) {
      const errorData = await response.text();
      console.error('Razorpay API error:', response.status, errorData);
      return new Response(
        JSON.stringify({
          error: 'Failed to create order',
          details: errorData,
        }),
        { status: response.status || 500, headers: corsHeaders }
      );
    }

    const order: RazorpayOrder = await response.json();

    // FIXED: Variables renamed here to perfectly match what your frontend destructures
    return new Response(
      JSON.stringify({
        success: true,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: keyId,
        workshopName: body.description || 'Workshop Payment',
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
    console.error('Unexpected error in razorpay-create-order:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});
