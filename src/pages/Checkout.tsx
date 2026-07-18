import { useEffect, useState } from 'react';
import { ArrowLeft, Lock, CheckCircle, ShieldCheck, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useParams } from '../router';
import Logo from '../components/ui/Logo';
import type { Workshop } from '../lib/types';

type Step = 'loading' | 'checkout' | 'processing' | 'verifying' | 'success' | 'failed';

interface RazorpayInstance {
  open: () => void;
  on: (event: 'payment.failed', handler: (response: { error?: { description?: string } }) => void) => void;
}
interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: { name: string; email: string };
  theme: { color: string };
  handler: (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => void;
  modal: { ondismiss: () => void };
}
declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

export default function Checkout() {
  const { _path } = useParams();
  const workshopId = _path.split('/').pop() ?? '';
  const navigate = useNavigate();
  const { user } = useAuth();

  const [workshop, setWorkshop] = useState<Workshop | null>(null);
  const [student, setStudent] = useState<{ id: string; full_name: string; email: string } | null>(null);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<Step>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    const init = async () => {
      if (!user) { navigate('/login'); return; }

      const { data: ws, error: wsErr } = await supabase.from('workshops').select('*').eq('id', workshopId).maybeSingle();
      if (wsErr || !ws) { navigate('/workshops'); return; }
      setWorkshop(ws as Workshop);

      const { data: stu, error: stuErr } = await supabase.from('students').select('id, full_name, email').eq('user_id', user.id).maybeSingle();
      if (stuErr || !stu) { navigate('/login'); return; }
      setStudent(stu as { id: string; full_name: string; email: string });

      const { data: existing } = await supabase
        .from('workshop_applications')
        .select('id, status')
        .eq('workshop_id', workshopId)
        .eq('student_id', (stu as { id: string }).id)
        .maybeSingle();

      if (existing) {
        setApplicationId((existing as { id: string }).id);
      } else {
        const { data: created, error: createErr } = await supabase
          .from('workshop_applications')
          .insert({
            workshop_id: workshopId,
            student_id: (stu as { id: string }).id,
            status: 'payment_pending',
            payment_status: 'pending',
          })
          .select('id')
          .single();
        if (createErr || !created) {
          setError('Failed to create application. Please try again.');
          setLoading(false);
          return;
        }
        setApplicationId((created as { id: string }).id);
      }
      setLoading(false);
      setStep('checkout');
    };
    init();
  }, [workshopId, user, navigate]);

  const handlePay = async () => {
    if (!student || !workshop || !applicationId) {
      setError('Missing required information. Please refresh and try again.');
      return;
    }

    setStep('processing');
    setError('');

    try {
      const basePrice = workshop.price && workshop.price > 0 ? workshop.price : 499;
      const cleanAmountInPaise = Math.round(basePrice * 1.18 * 100);

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/razorpay-create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${anonKey}`,
        },
        body: JSON.stringify({
          workshopId,
          studentId: student.id,
          applicationId,
          amount: cleanAmountInPaise,
          currency: 'INR',
          description: `Registration for ${workshop.name}`,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to create payment order');
      }

      const { orderId, amount, currency, keyId, workshopName } = await response.json();

      const rzp = new window.Razorpay({
        key: keyId,
        amount,
        currency,
        name: 'Praxis Group',
        description: workshopName,
        order_id: orderId,
        prefill: {
          name: student.full_name,
          email: student.email,
        },
        theme: { color: '#C9A84C' },
        handler: async (paymentResponse) => {
          setStep('verifying');
          try {
            const verifyRes = await fetch(`${supabaseUrl}/functions/v1/razorpay-verify-payment`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${anonKey}`,
              },
              body: JSON.stringify({
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                razorpay_order_id: paymentResponse.razorpay_order_id,
                razorpay_signature: paymentResponse.razorpay_signature,
                applicationId,
              }),
            });

            if (!verifyRes.ok) {
              const errData = await verifyRes.json().catch(() => ({}));
              throw new Error(errData.error || 'Payment verification failed');
            }

            setStep('success');
          } catch (err) {
            setStep('failed');
            setError(
              err instanceof Error
                ? err.message
                : 'Payment verification failed. If you were charged, please contact support.'
            );
          }
        },
        modal: {
          ondismiss: () => {
            setStep('checkout');
            setError('Payment was cancelled. You can try again.');
          },
        },
      });

      rzp.on('payment.failed', (failResponse) => {
        setStep('failed');
        setError(failResponse.error?.description || 'Payment failed. Please try again.');
      });

      rzp.open();
    } catch (err) {
      setStep('failed');
      setError(err instanceof Error ? err.message : 'Payment initialization failed.');
    }
  };

  if (loading || step === 'loading') {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold-600/30 border-t-gold-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!workshop) return null;

  const amount = workshop.price ?? 0;
  const convenienceFee = 3;
  const total = amount + convenienceFee;

  return (
    <div className="min-h-screen bg-dark-900">
      <header className="border-b border-dark-300 bg-dark-800">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Logo size="sm" linkTo="" />
          <div className="flex items-center gap-2 text-forest-400 text-sm">
            <Lock size={14} />
            <span>Secure Checkout</span>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <button onClick={() => navigate(`/workshops/${workshop.slug}`)} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-6 transition-colors">
          <ArrowLeft size={15} /> Back to Workshop
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3">
            {step === 'success' ? (
              <div className="card text-center py-12 animate-fade-in">
                <div className="w-20 h-20 bg-forest-600/20 border border-forest-600/30 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle size={40} className="text-forest-400" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Payment Successful!</h1>
                <p className="text-gray-400 text-sm mb-1">Your registration is confirmed.</p>
                <p className="text-gold-500 font-semibold text-lg mb-6">{workshop.name}</p>
                <p className="text-gray-500 text-xs mb-8 max-w-sm mx-auto">
                  You will receive a confirmation email shortly. You can also check your dashboard for the updated status.
                </p>
                <button onClick={() => navigate('/student/dashboard')} className="btn-primary px-8 py-3 text-sm">Go to Dashboard</button>
              </div>
            ) : step === 'failed' ? (
              <div className="card text-center py-12 animate-fade-in">
                <div className="w-20 h-20 bg-red-600/20 border border-red-600/30 flex items-center justify-center mx-auto mb-6">
                  <AlertCircle size={40} className="text-red-400" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Payment Failed</h1>
                <p className="text-gray-400 text-sm mb-6">{error || 'Something went wrong. Please try again.'}</p>
                <button onClick={() => setStep('checkout')} className="btn-primary px-8 py-3 text-sm">Try Again</button>
              </div>
            ) : step === 'processing' ? (
              <div className="card py-16 text-center animate-fade-in">
                <div className="w-8 h-8 border-2 border-gold-600/30 border-t-gold-600 rounded-full animate-spin mx-auto mb-4" />
                <h2 className="text-lg font-medium text-white mb-1">Preparing Payment Gateway...</h2>
                <p className="text-gray-400 text-sm">Please do not close or refresh this page.</p>
              </div>
            ) : step === 'verifying' ? (
              <div className="card py-16 text-center animate-fade-in">
                <div className="w-8 h-8 border-2 border-gold-600/30 border-t-gold-600 rounded-full animate-spin mx-auto mb-4" />
                <h2 className="text-lg font-medium text-white mb-1">Verifying Payment...</h2>
                <p className="text-gray-400 text-sm">Please do not close or refresh this page.</p>
              </div>
            ) : (
              <div className="card p-6">
                <h2 className="text-xl font-bold text-white mb-6">Review & Pay</h2>
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between pb-4 border-b border-dark-300">
                    <div>
                      <h3 className="text-white font-medium">{workshop.name}</h3>
                      <p className="text-gray-400 text-xs mt-1">Live Online Workshop</p>
                    </div>
                    <span className="text-white font-medium">₹{amount}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>GST (18%)</span>
                    <span>₹{gst}</span>
                  </div>
                  <div className="flex justify-between pt-4 border-t border-dark-300 font-bold text-lg text-white">
                    <span>Total Amount</span>
                    <span className="text-gold-500">₹{total}</span>
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-2 bg-red-600/10 border border-red-600/30 rounded px-3 py-2 mb-4 text-sm text-red-400">
                    <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  onClick={handlePay}
                  className="btn-primary w-full py-3 text-sm font-semibold flex items-center justify-center gap-2"
                >
                  <Lock size={14} />
                  Pay ₹{total} Securely
                </button>
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            <div className="card p-6 sticky top-6">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <ShieldCheck size={18} className="text-forest-400" />
                Secure Payment
              </h3>
              <ul className="space-y-3 text-sm text-gray-400">
                <li className="flex items-start gap-2">
                  <CheckCircle size={14} className="text-forest-400 mt-0.5 flex-shrink-0" />
                  <span>Payments processed securely via Razorpay</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle size={14} className="text-forest-400 mt-0.5 flex-shrink-0" />
                  <span>Your card and bank details are never stored on our servers</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle size={14} className="text-forest-400 mt-0.5 flex-shrink-0" />
                  <span>Instant confirmation email after successful payment</span>
                </li>
              </ul>
              {student && (
                <div className="mt-6 pt-6 border-t border-dark-300 text-sm">
                  <p className="text-gray-500 text-xs mb-1">Registering as</p>
                  <p className="text-white font-medium">{student.full_name}</p>
                  <p className="text-gray-400">{student.email}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
