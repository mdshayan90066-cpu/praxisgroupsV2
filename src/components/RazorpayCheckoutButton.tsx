import { useState } from 'react';
import {
  openRazorpayCheckout,
  RazorpayCheckoutOptions,
  formatAmount,
} from '../lib/razorpay';
import { AlertCircle, CheckCircle, Loader } from 'lucide-react';

interface RazorpayCheckoutButtonProps {
  amount: number; // in paise
  description?: string;
  receipt?: string;
  notes?: Record<string, string>;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  onPaymentSuccess?: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
  onPaymentError?: (error: Error) => void;
  buttonText?: string;
  disabled?: boolean;
  className?: string;
}

export function RazorpayCheckoutButton({
  amount,
  description = 'Payment',
  receipt,
  notes,
  prefill,
  onPaymentSuccess,
  onPaymentError,
  buttonText = `Pay ${formatAmount(amount)}`,
  disabled = false,
  className = '',
}: RazorpayCheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleClick = async () => {
    setLoading(true);
    setStatus('idle');
    setMessage('');

    try {
      const options: RazorpayCheckoutOptions = {
        amount,
        description,
        prefill: prefill || {},
        notes: notes || {},
        onSuccess: (response) => {
          setStatus('success');
          setMessage('Payment completed successfully!');
          onPaymentSuccess?.(response);
          setLoading(false);
        },
        onError: (error) => {
          setStatus('error');
          setMessage(
            `Payment failed: ${error.description || 'Unknown error'}`
          );
          onPaymentError?.(
            new Error(error.description || 'Payment failed')
          );
          setLoading(false);
        },
        onDismiss: () => {
          setStatus('idle');
          setMessage('');
          setLoading(false);
        },
      };

      await openRazorpayCheckout(options);
    } catch (error) {
      setStatus('error');
      setMessage(
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred'
      );
      onPaymentError?.(
        error instanceof Error
          ? error
          : new Error('An unexpected error occurred')
      );
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={handleClick}
        disabled={disabled || loading}
        className={`
          px-6 py-3 rounded-lg font-semibold
          transition-all duration-200
          flex items-center justify-center gap-2
          ${
            disabled || loading
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:shadow-lg active:scale-95'
          }
          ${
            status === 'success'
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : status === 'error'
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
          }
          ${className}
        `}
      >
        {loading && <Loader className="w-4 h-4 animate-spin" />}
        {status === 'success' && <CheckCircle className="w-4 h-4" />}
        {status === 'error' && <AlertCircle className="w-4 h-4" />}
        <span>
          {status === 'success'
            ? 'Payment Successful'
            : status === 'error'
              ? 'Payment Failed'
              : buttonText}
        </span>
      </button>

      {message && (
        <div
          className={`
            p-3 rounded-lg text-sm
            ${
              status === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : status === 'error'
                  ? 'bg-red-50 text-red-800 border border-red-200'
                  : 'bg-blue-50 text-blue-800 border border-blue-200'
            }
          `}
        >
          {message}
        </div>
      )}

      {/* Note about Razorpay script requirement */}
      <div className="text-xs text-gray-500">
        Payment powered by Razorpay
      </div>
    </div>
  );
}
