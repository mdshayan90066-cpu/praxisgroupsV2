import { supabase } from './supabaseClient';

/**
 * Razorpay Checkout Configuration
 */
export interface RazorpayCheckoutOptions {
  amount: number; // in paise (e.g., 50000 = ₹500)
  description?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  onSuccess?: (response: RazorpaySuccessResponse) => void;
  onError?: (error: RazorpayErrorResponse) => void;
  onDismiss?: () => void;
}

interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayErrorResponse {
  code: string;
  description: string;
  source: string;
  step: string;
  reason: string;
  metadata: {
    order_id: string;
    payment_id: string;
  };
}

interface CreateOrderResponse {
  success: boolean;
  order_id: string;
  amount: number;
  currency: string;
}

interface VerifyPaymentResponse {
  success: boolean;
  message?: string;
  error?: string;
  order_id?: string;
  payment_id?: string;
}

/**
 * Create an order via Supabase Edge Function
 */
export async function createRazorpayOrder(
  amount: number,
  description?: string,
  receipt?: string,
  notes?: Record<string, string>
): Promise<CreateOrderResponse> {
  try {
    const { data, error } = await supabase.functions.invoke(
      'razorpay-create-order',
      {
        body: {
          amount, // in paise
          currency: 'INR',
          receipt: receipt || `receipt_${Date.now()}`,
          description: description || 'Payment',
          notes: notes || {},
        },
      }
    );

    if (error) {
      throw new Error(`Order creation failed: ${error.message}`);
    }

    if (!data?.success) {
      throw new Error(data?.error || 'Failed to create order');
    }

    return data;
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    throw error;
  }
}

/**
 * Verify payment signature via Supabase Edge Function
 */
export async function verifyRazorpayPayment(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
): Promise<VerifyPaymentResponse> {
  try {
    const { data, error } = await supabase.functions.invoke(
      'razorpay-verify-payment',
      {
        body: {
          razorpay_order_id: razorpayOrderId,
          razorpay_payment_id: razorpayPaymentId,
          razorpay_signature: razorpaySignature,
        },
      }
    );

    if (error) {
      throw new Error(`Payment verification failed: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error verifying Razorpay payment:', error);
    throw error;
  }
}

/**
 * Initialize Razorpay checkout modal
 * Assumes checkout.js is already loaded in HTML
 */
export function openRazorpayCheckout(
  options: RazorpayCheckoutOptions
): Promise<RazorpaySuccessResponse> {
  return new Promise(async (resolve, reject) => {
    try {
      // Check if Razorpay script is loaded
      if (typeof (window as any).Razorpay === 'undefined') {
        throw new Error('Razorpay checkout script not loaded');
      }

      // Create order first
      let orderResponse: CreateOrderResponse;
      try {
        orderResponse = await createRazorpayOrder(
          options.amount,
          options.description,
          undefined,
          options.notes
        );
      } catch (error) {
        options.onError?.({
          code: 'ORDER_CREATION_FAILED',
          description: 'Failed to create payment order',
          source: 'order',
          step: 'submit',
          reason: 'server_error',
          metadata: { order_id: '', payment_id: '' },
        });
        reject(error);
        return;
      }

      // Initialize Razorpay instance
      const razorpay = new (window as any).Razorpay({
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        order_id: orderResponse.order_id,
        amount: orderResponse.amount,
        currency: orderResponse.currency,
        description: options.description || 'Payment',
        prefill: options.prefill || {},
        notes: options.notes || {},
        handler: async (response: RazorpaySuccessResponse) => {
          try {
            // Verify payment on backend
            const verifyResponse = await verifyRazorpayPayment(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature
            );

            if (verifyResponse.success) {
              options.onSuccess?.(response);
              resolve(response);
            } else {
              throw new Error(
                verifyResponse.error || 'Payment verification failed'
              );
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            options.onError?.({
              code: 'VERIFICATION_FAILED',
              description: 'Failed to verify payment',
              source: 'server',
              step: 'verify',
              reason: 'server_error',
              metadata: {
                order_id: response.razorpay_order_id,
                payment_id: response.razorpay_payment_id,
              },
            });
            reject(error);
          }
        },
        modal: {
          ondismiss: () => {
            options.onDismiss?.();
            reject(new Error('Payment cancelled by user'));
          },
        },
      });

      razorpay.open();
    } catch (error) {
      console.error('Error opening Razorpay checkout:', error);
      options.onError?.({
        code: 'CHECKOUT_OPEN_FAILED',
        description: 'Failed to open payment modal',
        source: 'client',
        step: 'submit',
        reason: 'network_error',
        metadata: { order_id: '', payment_id: '' },
      });
      reject(error);
    }
  });
}

/**
 * Format amount for display (paise to rupees)
 */
export function formatAmount(paise: number): string {
  const rupees = (paise / 100).toFixed(2);
  return `₹${rupees}`;
}

/**
 * Convert rupees to paise
 */
export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}
