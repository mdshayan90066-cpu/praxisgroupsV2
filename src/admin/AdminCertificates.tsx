import { useEffect, useState, useCallback } from 'react';
import { Award, Plus, Search, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Certificate } from '../lib/types';
import { useDebounce } from '../lib/hooks';
import { useToast } from '../components/ui/Toast';

const PAGE_SIZE = 20;

const generateCertNumber = () => {
  const year = new Date().getFullYear();
  const num = Math.floor(10000 + Math.random() * 90000);
  return `PRX-${year}-${num}`;
};

export default function AdminCertificates() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    student_name: '',
    program_name: '',
    program_type: 'workshop' as 'workshop' | 'internship',
    issue_date: new Date().toISOString().split('T')[0],
    certificate_number: '',
  });
  const [saving, setSaving] = useState(false);

  const debouncedSearch = useDebounce(search, 300);
  const toast = useToast();
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const fetchCerts = useCallback(async () => {
    setLoading(true);
    try {
      let countQuery = supabase
        .from('certificates')
        .select('*', { count: 'exact', head: true });

      let dataQuery = supabase
        .from('certificates')
        .select('*')
        .order('created_at', { ascending: false })
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

      if (debouncedSearch) {
        const pattern = `%${debouncedSearch}%`;
        countQuery = countQuery.or(`student_name.ilike.${pattern},certificate_number.ilike.${pattern},program_name.ilike.${pattern}`);
        dataQuery = dataQuery.or(`student_name.ilike.${pattern},certificate_number.ilike.${pattern},program_name.ilike.${pattern}`);
      }

      const { count } = await countQuery;
      setTotal(count ?? 0);

      const { data } = await dataQuery;
      setCertificates(data ?? []);
    } catch {
      toast.error('Failed to load certificates');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, toast]);

  useEffect(() => {
    fetchCerts();
  }, [fetchCerts]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase.from('certificates').insert({
        ...form,
        certificate_number: form.certificate_number || generateCertNumber(),
        status: 'active',
      });
      if (error) throw error;
      toast.success('Certificate issued successfully');
      setShowForm(false);
      setForm({
        student_name: '',
        program_name: '',
        program_type: 'workshop',
        issue_date: new Date().toISOString().split('T')[0],
        certificate_number: '',
      });
      fetchCerts();
    } catch {
      toast.error('Failed to issue certificate');
    } finally {
      setSaving(false);
    }
  };

  const revokeOrActivate = async (id: string, status: 'active' | 'revoked') => {
    try {
      const { error } = await supabase.from('certificates').update({ status }).eq('id', id);
      if (error) throw error;
      toast.success(`Certificate ${status === 'revoked' ? 'revoked' : 'restored'}`);
      fetchCerts();
    } catch {
      toast.error('Failed to update certificate');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Certificates</h1>
          <p className="text-gray-400 text-sm">{total} total certificates</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary px-5 py-2.5 text-sm flex items-center gap-2">
          <Plus size={16} /> Issue Certificate
        </button>
      </div>

      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          placeholder="Search by student name, certificate ID, or program..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-10"
        />
      </div>

      {loading ? (
        <TableSkeleton rows={10} columns={7} />
      ) : certificates.length === 0 ? (
        <div className="text-center py-16 border border-dark-300">
          <Award size={48} className="text-gray-600 mx-auto mb-4" />
          <h3 className="text-white font-semibold mb-2">No Certificates Found</h3>
          <p className="text-gray-500 text-sm">
            {search ? 'Try a different search term.' : 'Certificates will appear here once issued.'}
          </p>
        </div>
      ) : (
        <>
          <div className="border border-dark-300 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  {['Certificate ID', 'Student', 'Program', 'Type', 'Issue Date', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="table-header">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {certificates.map((c) => (
                  <tr key={c.id} className="hover:bg-dark-600/30 transition-colors">
                    <td className="table-cell font-mono text-xs text-gold-500">{c.certificate_number}</td>
                    <td className="table-cell text-sm text-white">{c.student_name}</td>
                    <td className="table-cell text-sm text-gray-300 max-w-xs">
                      <div className="line-clamp-1">{c.program_name}</div>
                    </td>
                    <td className="table-cell">
                      <span className="badge badge-gray capitalize">{c.program_type}</span>
                    </td>
                    <td className="table-cell text-xs text-gray-500">
                      {new Date(c.issue_date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${c.status === 'active' ? 'badge-green' : 'badge-red'}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="table-cell">
                      <button
                        onClick={() => revokeOrActivate(c.id, c.status === 'active' ? 'revoked' : 'active')}
                        className={`text-xs px-2 py-1 border transition-colors ${
                          c.status === 'active'
                            ? 'border-red-600/40 text-red-400 hover:bg-red-600/10'
                            : 'border-forest-600/40 text-forest-400 hover:bg-forest-600/10'
                        }`}
                      >
                        {c.status === 'active' ? 'Revoke' : 'Restore'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between py-4">
              <div className="text-sm text-gray-500">
                Showing {(page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, total)} of {total}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 text-gray-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={14} />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(page - 2 + i, totalPages - 4 + i));
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-8 h-8 text-sm transition-colors ${
                        page === pageNum
                          ? 'bg-gold-600 text-dark-800 font-medium'
                          : 'text-gray-400 hover:text-white hover:bg-dark-600'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 text-gray-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Issue Certificate Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-dark-900/80 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="bg-dark-700 border border-dark-300 w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-dark-300">
              <h3 className="text-white font-semibold">Issue New Certificate</h3>
              <button onClick={() => setShowForm(false)}>
                <X size={18} className="text-gray-400 hover:text-white" />
              </button>
            </div>
            <form onSubmit={handleIssue} className="p-5 space-y-4">
              <div>
                <label className="label">Student Full Name *</label>
                <input
                  required
                  className="input"
                  value={form.student_name}
                  onChange={(e) => setForm({ ...form, student_name: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Program Name *</label>
                <input
                  required
                  className="input"
                  value={form.program_name}
                  onChange={(e) => setForm({ ...form, program_name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Program Type</label>
                  <select
                    className="input"
                    value={form.program_type}
                    onChange={(e) => setForm({ ...form, program_type: e.target.value as 'workshop' | 'internship' })}
                  >
                    <option value="workshop">Workshop</option>
                    <option value="internship">Internship</option>
                  </select>
                </div>
                <div>
                  <label className="label">Issue Date</label>
                  <input
                    type="date"
                    className="input"
                    value={form.issue_date}
                    onChange={(e) => setForm({ ...form, issue_date: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="label">Certificate ID (auto-generated if blank)</label>
                <input
                  className="input font-mono text-sm"
                  placeholder="PRX-2024-XXXXX"
                  value={form.certificate_number}
                  onChange={(e) => setForm({ ...form, certificate_number: e.target.value.toUpperCase() })}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-ghost px-4 py-2.5 text-sm flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-primary px-4 py-2.5 text-sm flex-1 flex items-center justify-center gap-2">
                  <Award size={14} /> Issue Certificate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function TableSkeleton({ rows, columns }: { rows: number; columns: number }) {
  return (
    <div className="border border-dark-300">
      <table className="w-full">
        <thead>
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="table-header"><div className="h-3 shimmer bg-dark-500 w-1/2" /></th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i} className="hover:bg-dark-600/30">
              {Array.from({ length: columns }).map((_, j) => (
                <td key={j} className="table-cell">
                  <div className="h-4 shimmer bg-dark-600" style={{ width: `${40 + Math.random() * 40}%` }} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
