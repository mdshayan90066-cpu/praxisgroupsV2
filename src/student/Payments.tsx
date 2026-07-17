import { useEffect, useState } from 'react';
import { CreditCard, AlertCircle, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Payment } from '../lib/types';

interface PaymentRow extends Payment {
  workshop_applications?: { workshops?: { name: string } | null } | null;
}

const statusColors: Record<string, string> = {
  pending: 'badge-gray', successful: 'badge-green', failed: 'badge-red', refunded: 'badge-gold',
};

export default function Payments() {
  const { student } = useAuth();
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!student) return;
    supabase
      .from('payments')
      .select('*, workshop_applications(workshops(name))')
      .eq('student_id', student.id)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setPayments((data ?? []) as PaymentRow[]);
        setLoading(false);
      });
  }, [student]);

  const totalPaid = payments.filter(p => p.status === 'successful').reduce((s, p) => s + Number(p.amount), 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Payment History</h1>
        <p className="text-gray-400 text-sm">View your transaction history and payment status.</p>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-600/10 border border-red-600/30 text-red-400 text-sm flex items-center gap-2">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {!loading && !error && payments.length > 0 && (
        <div className="stat-card">
          <div className="w-10 h-10 bg-gold-600/10 border border-gold-600/20 flex items-center justify-center">
            <TrendingUp size={18} className="text-gold-500" />
          </div>
          <div className="text-2xl font-bold text-white">₹{totalPaid.toLocaleString()}</div>
          <div className="text-gray-500 text-xs">Total Successful Payments</div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[1, 2, 3, 4].map(i => <div key={i} className="h-16 shimmer" />)}</div>
      ) : payments.length > 0 ? (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr>{['Workshop', 'Amount', 'Status', 'Payment ID', 'Date'].map(h => <th key={h} className="table-header">{h}</th>)}</tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-dark-600/30 transition-colors">
                    <td className="table-cell text-sm text-gray-300 max-w-xs">
                      <div className="line-clamp-1">{p.workshop_applications?.workshops?.name ?? '—'}</div>
                    </td>
                    <td className="table-cell text-sm font-medium text-white">₹{Number(p.amount).toLocaleString()} <span className="text-gray-500 text-xs">{p.currency}</span></td>
                    <td className="table-cell"><span className={`badge ${statusColors[p.status] || 'badge-gray'}`}>{p.status}</span></td>
                    <td className="table-cell font-mono text-xs text-gray-400">{p.razorpay_payment_id ?? '—'}</td>
                    <td className="table-cell text-xs text-gray-500">{new Date(p.created_at).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card text-center py-16">
          <CreditCard size={48} className="text-gray-600 mx-auto mb-4" />
          <h3 className="text-white font-semibold mb-2">No Payment History</h3>
          <p className="text-gray-500 text-sm">Your payment transactions will appear here once you enroll in a paid workshop.</p>
        </div>
      )}
    </div>
  );
}
