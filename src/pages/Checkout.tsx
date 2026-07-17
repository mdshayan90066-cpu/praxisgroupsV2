import { useEffect, useState } from 'react';
import { ArrowLeft, Lock, CheckCircle, ShieldCheck, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useParams } from '../router';
import Logo from '../components/ui/Logo';
import type { Workshop } from '../lib/types';

type Step = 'loading' | 'checkout' | 'processing' | 'success' | 'failed';

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
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/razorpay-create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          workshopId,
          studentId: student.id,
          applicationId,
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
        handler: () => {
          setStep('success');
        },
        modal: {
          ondismiss: () => {
            setStep('checkout');
            setError('Payment was cancelled. You can try again.');
          },
        },
      });

      rzp.on('payment.failed', (response) => {
        setStep('failed');
        setError(response.error?.description || 'Payment failed. Please try again.');
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
  const gst = Math.round(amount * 0.18);
  const total = amount + gst;

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
                <h1 className="text-2xl font-bold text-white mb-2">Payment Initiated!</h1>
                <p className="text-gray-400 text-sm mb-1">Your payment is being verified.</p>
                <p className="text-gold-500 font-semibold text-lg mb-6">{workshop.name}</p>
                <p className="text-gray-500 text-xs mb-8 max-w-sm mx-auto">
                  You will receive a confirmation once the payment is verified. You can check your dashboard for the updated status.
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
                <div className="w-8 h-8 border-2 border-gold-600/30 border-t-gold-600 rounded-full animate-spin mx-auto mb-6" />
                <h2 className="text-white font-semibold text-lg mb-2">Preparing Secure Checkout...</h2>
                <p className="text-gray-500 text-sm">You will be redirected to Razorpay's secure payment page.</p>
              </div>
            ) : (
              <div className="card space-y-6">
                <div>
                  <h1 className="text-xl font-bold text-white mb-1">Secure Payment</h1>
                  <p className="text-gray-500 text-sm">You will be redirected to Razorpay's secure checkout to complete your payment.</p>
                </div>

                {error && (
                  <div className="px-4 py-3 bg-red-600/10 border border-red-600/30 text-red-400 text-sm flex items-center gap-2">
                    <AlertCircle size={16} /> {error}
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-4 border border-dark-300 bg-dark-600">
                    <ShieldCheck size={20} className="text-forest-400" />
                    <div>
                      <div className="text-white text-sm font-medium">Razorpay Secure Checkout</div>
                      <div className="text-gray-500 text-xs">100+ payment methods including cards, UPI, net banking, wallets</div>
                    </div>
                  </div>
                </div>

                <button onClick={handlePay} className="btn-primary w-full py-3.5 text-sm flex items-center justify-center gap-2">
                  <Lock size={15} /> Pay ₹{total.toLocaleString()} Securely
                </button>
                <p className="text-gray-500 text-xs text-center">You will be redirected to Razorpay's secure payment page.</p>
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            <div className="card sticky top-8">
              <h2 className="text-white font-semibold mb-4">Order Summary</h2>
              <div className="flex gap-3 pb-4 border-b border-dark-300">
                <div className="w-16 h-16 bg-dark-600 overflow-hidden shrink-0">
                  {workshop.thumbnail_url ? (
                    <img src={workshop.thumbnail_url} alt={workshop.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-dark-600 to-dark-700" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-medium line-clamp-2">{workshop.name}</div>
                  <div className="text-gray-500 text-xs mt-1">{workshop.workshop_type} · {workshop.duration ?? 'Self-paced'}</div>
                </div>
              </div>

              <div className="space-y-2.5 py-4 border-b border-dark-300">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Base Price</span>
                  <span className="text-white">₹{amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">GST (18%)</span>
                  <span className="text-white">₹{gst.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4">
                <span className="text-white font-semibold">Total Payable</span>
                <span className="text-2xl font-bold text-gold-500">₹{total.toLocaleString()}</span>
              </div>

              <div className="mt-6 pt-4 border-t border-dark-300 space-y-2">
                <div className="flex items-center gap-2 text-gray-500 text-xs">
                  <ShieldCheck size={13} className="text-forest-400" /> 256-bit SSL encrypted checkout
                </div>
                <div className="flex items-center gap-2 text-gray-500 text-xs">
                  <CheckCircle size={13} className="text-forest-400" /> Payment verified via webhook
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
