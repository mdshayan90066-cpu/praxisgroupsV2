import { useEffect, useState, useCallback } from 'react';
import { Search, RefreshCw, ChevronLeft, ChevronRight, ClipboardList } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useDebounce } from '../lib/hooks';
import { useToast } from '../components/ui/Toast';

const PAGE_SIZE = 20;

export default function AdminApplications() {
  const [workshopApps, setWorkshopApps] = useState<Array<Record<string, unknown>>>([]);
  const [internshipApps, setInternshipApps] = useState<Array<Record<string, unknown>>>([]);
  const [workshopTotal, setWorkshopTotal] = useState(0);
  const [internshipTotal, setInternshipTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'workshop' | 'internship'>('workshop');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [updating, setUpdating] = useState(false);

  const debouncedSearch = useDebounce(search, 300);
  const toast = useToast();

  const workshopStatuses = ['pending', 'accepted', 'rejected', 'completed', 'payment_pending', 'paid'];
  const internshipStatuses = ['pending', 'accepted', 'rejected', 'completed', 'interview_scheduled'];

  const fetchWorkshopApps = useCallback(async () => {
    try {
      let countQuery = supabase
        .from('workshop_applications')
        .select('*', { count: 'exact', head: true });

      let dataQuery = supabase
        .from('workshop_applications')
        .select('id, status, applied_at, workshops(name), students(full_name, email)')
        .order('applied_at', { ascending: false })
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

      if (debouncedSearch) {
        const pattern = `%${debouncedSearch}%`;
        countQuery = countQuery.or(`students.full_name.ilike.${pattern},students.email.ilike.${pattern}`);
        dataQuery = dataQuery.or(`students.full_name.ilike.${pattern},students.email.ilike.${pattern}`);
      }

      if (statusFilter) {
        countQuery = countQuery.eq('status', statusFilter);
        dataQuery = dataQuery.eq('status', statusFilter);
      }

      const { count } = await countQuery;
      setWorkshopTotal(count ?? 0);

      const { data } = await dataQuery;
      setWorkshopApps((data as Array<Record<string, unknown>>) ?? []);
    } catch {
      toast.error('Failed to load workshop applications');
    }
  }, [page, debouncedSearch, statusFilter, toast]);

  const fetchInternshipApps = useCallback(async () => {
    try {
      let countQuery = supabase
        .from('internship_applications')
        .select('*', { count: 'exact', head: true });

      let dataQuery = supabase
        .from('internship_applications')
        .select('id, status, applied_at, internships(name, partner_company_name), students(full_name, email)')
        .order('applied_at', { ascending: false })
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

      if (debouncedSearch) {
        const pattern = `%${debouncedSearch}%`;
        countQuery = countQuery.or(`students.full_name.ilike.${pattern},students.email.ilike.${pattern}`);
        dataQuery = dataQuery.or(`students.full_name.ilike.${pattern},students.email.ilike.${pattern}`);
      }

      if (statusFilter) {
        countQuery = countQuery.eq('status', statusFilter);
        dataQuery = dataQuery.eq('status', statusFilter);
      }

      const { count } = await countQuery;
      setInternshipTotal(count ?? 0);

      const { data } = await dataQuery;
      setInternshipApps((data as Array<Record<string, unknown>>) ?? []);
    } catch {
      toast.error('Failed to load internship applications');
    }
  }, [page, debouncedSearch, statusFilter, toast]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchWorkshopApps(), fetchInternshipApps()]);
    setLoading(false);
  }, [fetchWorkshopApps, fetchInternshipApps]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setPage(1);
  }, [tab, debouncedSearch, statusFilter]);

  const updateWorkshopStatus = async (id: string, status: string) => {
    if (updating) return;
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('workshop_applications')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      toast.success('Status updated');
      fetchWorkshopApps();
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const updateInternshipStatus = async (id: string, status: string) => {
    if (updating) return;
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('internship_applications')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      toast.success('Status updated');
      fetchInternshipApps();
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const apps = tab === 'workshop' ? workshopApps : internshipApps;
  const total = tab === 'workshop' ? workshopTotal : internshipTotal;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const statuses = tab === 'workshop' ? workshopStatuses : internshipStatuses;

  const statusColors: Record<string, string> = {
    pending: 'badge-gray',
    accepted: 'badge-green',
    rejected: 'badge-red',
    completed: 'badge-gold',
    payment_pending: 'badge-red',
    paid: 'badge-green',
    interview_scheduled: 'badge-gold',
  };

  return (
    <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Applications</h1>
            <p className="text-gray-400 text-sm">{workshopTotal} workshop + {internshipTotal} internship applications</p>
          </div>
          <button onClick={fetchData} disabled={loading} className="btn-ghost px-4 py-2 text-sm flex items-center gap-2">
            <RefreshCw size={15} /> Refresh
          </button>
        </div>

        <div className="flex gap-1 border-b border-dark-300">
          <button
            onClick={() => { setTab('workshop'); setStatusFilter(''); }}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === 'workshop'
                ? 'border-gold-600 text-gold-500'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            Workshop ({workshopTotal})
          </button>
          <button
            onClick={() => { setTab('internship'); setStatusFilter(''); }}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === 'internship'
                ? 'border-gold-600 text-gold-500'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            Internship ({internshipTotal})
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search by student name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input w-auto text-sm"
          >
            <option value="">All Status</option>
            {statuses.map((s) => (
              <option key={s} value={s}>{s.replace('_', ' ')}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <TableSkeleton rows={10} columns={5} />
        ) : apps.length === 0 ? (
          <div className="text-center py-16 border border-dark-300">
            <ClipboardList size={48} className="text-gray-600 mx-auto mb-4" />
            <h3 className="text-white font-semibold mb-2">No Applications Found</h3>
            <p className="text-gray-500 text-sm">
              {search || statusFilter ? 'Try adjusting your filters.' : 'Applications will appear here.'}
            </p>
          </div>
        ) : (
          <>
            <div className="border border-dark-300 overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    {['Student', 'Program', 'Applied', 'Status', 'Change Status'].map((h) => (
                      <th key={h} className="table-header">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {apps.map((app) => {
                    const student = app.students as { full_name: string; email: string } | null;
                    const program = tab === 'workshop'
                      ? (app.workshops as { name: string } | null)?.name
                      : (app.internships as { name: string; partner_company_name: string } | null)?.name;
                    return (
                      <tr key={app.id as string} className="hover:bg-dark-600/30 transition-colors">
                        <td className="table-cell">
                          <div className="text-white text-sm">{student?.full_name}</div>
                          <div className="text-gray-500 text-xs">{student?.email}</div>
                        </td>
                        <td className="table-cell text-sm text-gray-300 max-w-xs">
                          <div className="line-clamp-1">{program}</div>
                        </td>
                        <td className="table-cell text-xs text-gray-500">
                          {new Date(app.applied_at as string).toLocaleDateString('en-IN')}
                        </td>
                        <td className="table-cell">
                          <span className={`badge ${statusColors[app.status as string] || 'badge-gray'}`}>
                            {String(app.status).replace('_', ' ')}
                          </span>
                        </td>
                        <td className="table-cell">
                          <select
                            value={app.status as string}
                            onChange={(e) => {
                              if (tab === 'workshop') {
                                updateWorkshopStatus(app.id as string, e.target.value);
                              } else {
                                updateInternshipStatus(app.id as string, e.target.value);
                              }
                            }}
                            disabled={updating}
                            className="input py-1 text-xs w-full max-w-[150px] disabled:opacity-50"
                          >
                            {statuses.map((s) => (
                              <option key={s} value={s}>{s.replace('_', ' ')}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
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
