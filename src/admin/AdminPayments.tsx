import { useEffect, useState, useCallback } from 'react';
import { Search, RefreshCw, TrendingUp, CreditCard, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useDebounce } from '../lib/hooks';
import { useToast } from '../components/ui/Toast';

const PAGE_SIZE = 20;

interface PaymentRow {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'successful' | 'failed' | 'refunded';
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  created_at: string;
  students?: { full_name: string; email: string } | null;
}

export default function AdminPayments() {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({ successful: 0, revenue: 0, pending: 0, failed: 0, refunded: 0 });

  const debouncedSearch = useDebounce(search, 300);
  const toast = useToast();
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const { data: allPayments } = await supabase.from('payments').select('amount, status');
      const allData = allPayments ?? [];
      const successful = allData.filter(p => p.status === 'successful');
      
      setStats({
        successful: successful.length,
        revenue: successful.reduce((s, p) => s + Number(p.amount), 0),
        pending: allData.filter(p => p.status === 'pending').length,
        failed: allData.filter(p => p.status === 'failed').length,
        refunded: allData.filter(p => p.status === 'refunded').length,
      });

      let countQuery = supabase.from('payments').select('*', { count: 'exact', head: true });
      let dataQuery = supabase
        .from('payments')
        .select('*, students(full_name, email)')
        .order('created_at', { ascending: false })
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

      if (debouncedSearch) {
        const pattern = `%${debouncedSearch}%`;
        countQuery = countQuery.or(`razorpay_payment_id.ilike.${pattern}`);
        dataQuery = dataQuery.or(`razorpay_payment_id.ilike.${pattern}`);
      }

      if (statusFilter) {
        countQuery = countQuery.eq('status', statusFilter);
        dataQuery = dataQuery.eq('status', statusFilter);
      }

      const { count } = await countQuery;
      setTotal(count ?? 0);

      const { data } = await dataQuery;
      setPayments((data ?? []) as PaymentRow[]);
    } catch {
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter, toast]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);
  useEffect(() => { setPage(1); }, [debouncedSearch, statusFilter]);

  const cards = [
    { label: 'Total Revenue', value: `Rs ${stats.revenue.toLocaleString()}`, icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-600/10 border-green-600/20' },
    { label: 'Successful', value: stats.successful, icon: CreditCard, color: 'text-emerald-400', bg: 'bg-emerald-600/10 border-emerald-600/20' },
    { label: 'Pending', value: stats.pending, icon: AlertCircle, color: 'text-orange-400', bg: 'bg-orange-600/10 border-orange-600/20' },
    { label: 'Failed / Refunded', value: `${stats.failed} / ${stats.refunded}`, icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-600/10 border-red-600/20' },
  ];

  const statusColors: Record<string, string> = { pending: 'bg-zinc-800 text-zinc-400', successful: 'bg-emerald-500/10 text-emerald-400', failed: 'bg-rose-500/10 text-rose-400', refunded: 'bg-amber-500/10 text-amber-400' };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Payments</h1>
          <p className="text-gray-400 text-sm">{total} total transactions</p>
        </div>
        <button onClick={fetchPayments} disabled={loading} className="p-2.5 rounded-lg border border-zinc-800 text-white"><RefreshCw size={15} /></button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className={`w-10 h-10 ${bg} border rounded-lg flex items-center justify-center mb-3`}><Icon size={18} className={color} /></div>
            <div className="text-xl font-bold text-white">{loading ? '—' : value}</div>
            <div className="text-gray-500 text-xs mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input type="text" placeholder="Search transactions..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white outline-none" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 text-xs text-white outline-none">
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="successful">Successful</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-14 bg-zinc-900 border border-zinc-800 rounded-xl animate-pulse" />)}
        </div>
      ) : payments.length === 0 ? (
        <div className="text-center py-16 border border-zinc-800 rounded-xl bg-black text-gray-500 text-xs">No payment records located.</div>
      ) : (
        <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-2 divide-y divide-zinc-800">
          {payments.map((p) => (
            <div key={p.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <div className="text-white font-medium">{p.students?.full_name || 'Platform Learner'}</div>
                <div className="text-gray-500 text-[11px] mt-0.5">{p.students?.email || '-'}</div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-white font-medium capitalize">{p.currency} {p.amount}</div>
                  <div className="text-gray-500 font-mono text-[10px] mt-0.5">{p.razorpay_payment_id || p.id.substring(0, 12)}</div>
                </div>
                <span className={`px-2.5 py-0.5 font-medium rounded-full border border-white/5 ${statusColors[p.status] || 'bg-zinc-800'}`}>
                  {p.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-gray-500 pt-2">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white disabled:opacity-30"><ChevronLeft size={14} /></button>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white disabled:opacity-30"><ChevronRight size={14} /></button>
          </div>
        </div>
      )}
    </div>
  );
}
