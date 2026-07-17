import { useEffect, useState, useCallback } from 'react';
import { Search, Filter, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Workshop, WorkshopCategory } from '../lib/types';
import SEO from '../components/ui/SEO';
import WorkshopCard from '../components/workshop/WorkshopCard';
import PublicLayout from '../components/layout/PublicLayout';
import { useDebounce } from '../lib/hooks';

const PAGE_SIZE = 12;

export default function Workshops() {
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [categories, setCategories] = useState<WorkshopCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedPrice, setSelectedPrice] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const debouncedSearch = useDebounce(search, 300);
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch categories
      const { data: cats } = await supabase
        .from('workshop_categories')
        .select('*')
        .order('name');
      setCategories(cats ?? []);

      // Build query with filters
      let countQuery = supabase
        .from('workshops')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      let dataQuery = supabase
        .from('workshops')
        .select('*, workshop_categories!workshops_category_id_fkey(*)')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

      if (debouncedSearch) {
        const pattern = `%${debouncedSearch}%`;
        countQuery = countQuery.or(`name.ilike.${pattern},description.ilike.${pattern}`);
        dataQuery = dataQuery.or(`name.ilike.${pattern},description.ilike.${pattern}`);
      }

      if (selectedCategory) {
        countQuery = countQuery.eq('category_id', selectedCategory);
        dataQuery = dataQuery.eq('category_id', selectedCategory);
      }

      if (selectedType) {
        countQuery = countQuery.eq('workshop_type', selectedType);
        dataQuery = dataQuery.eq('workshop_type', selectedType);
      }

      if (selectedPrice) {
        countQuery = countQuery.eq('price_type', selectedPrice);
        dataQuery = dataQuery.eq('price_type', selectedPrice);
      }

      const { count } = await countQuery;
      setTotal(count ?? 0);

      const { data } = await dataQuery;
      setWorkshops(data ?? []);
    } catch (err) {
      console.error('Failed to load workshops:', err);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, selectedCategory, selectedType, selectedPrice]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, selectedCategory, selectedType, selectedPrice]);

  return (
    <PublicLayout>
      <SEO
        title="Workshops - Praxis Group"
        description="Browse industry-led workshops in technology, business, design, marketing, finance, and leadership. Learn from experts and earn verified certificates."
      />
      {/* Header */}
      <div className="pt-24 pb-12 px-4 sm:px-6 bg-[var(--bg-muted)] border-b border-[var(--surface-border)]">
        <div className="max-w-7xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--accent-primary-muted)] text-[var(--accent-primary)] text-sm font-semibold uppercase tracking-wider mb-4">
            <BookOpen size={14} />
            Programs
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-4">Workshops</h1>
          <p className="text-[var(--text-secondary)] text-lg max-w-2xl">
            Explore our industry-led workshops designed to give you practical skills and professional certifications.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-10">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search workshops..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Filter size={15} className="text-[var(--text-muted)]" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input w-auto py-2.5 text-sm"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="input w-auto py-2.5 text-sm"
            >
              <option value="">All Modes</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
              <option value="hybrid">Hybrid</option>
            </select>
            <select
              value={selectedPrice}
              onChange={(e) => setSelectedPrice(e.target.value)}
              className="input w-auto py-2.5 text-sm"
            >
              <option value="">All Prices</option>
              <option value="free">Free</option>
              <option value="paid">Paid</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-80 rounded-2xl shimmer" />
            ))}
          </div>
        ) : workshops.length > 0 ? (
          <>
            <p className="text-[var(--text-muted)] text-sm mb-6">{total} workshop{total !== 1 ? 's' : ''} found</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workshops.map((w) => (
                <WorkshopCard key={w.id} workshop={w} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 py-8">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-interactive)] rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(page - 2 + i, totalPages - 4 + i));
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-10 h-10 text-sm rounded-lg transition-colors ${
                        page === pageNum
                          ? 'bg-[var(--accent-primary)] text-[var(--accent-on)] font-medium'
                          : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-interactive)]'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-interactive)] rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 bg-[var(--card-bg)] border border-[var(--surface-border)] rounded-2xl">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--bg-interactive)] flex items-center justify-center">
              <BookOpen size={32} className="text-[var(--text-muted)]" />
            </div>
            <h3 className="text-[var(--text-primary)] font-semibold mb-2">No Workshops Found</h3>
            <p className="text-[var(--text-muted)] text-sm">Try adjusting your filters or check back soon for new workshops.</p>
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
