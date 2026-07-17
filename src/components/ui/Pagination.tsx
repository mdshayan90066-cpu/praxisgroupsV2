import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  showPageSize?: boolean;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  showPageSize = true,
}: PaginationProps) {
  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  const pages = getPageNumbers(currentPage, totalPages);

  if (totalPages <= 1 && totalItems <= pageSize) {
    return null;
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
      <div className="text-sm text-gray-500">
        {totalItems > 0 ? (
          <>
            Showing <span className="text-white">{start}</span> to <span className="text-white">{end}</span> of{' '}
            <span className="text-white">{totalItems}</span> results
          </>
        ) : (
          'No results'
        )}
      </div>

      <div className="flex items-center gap-2">
        {showPageSize && onPageSizeChange && (
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="input py-1 text-xs w-auto"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size} / page
              </option>
            ))}
          </select>
        )}

        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className="p-1.5 text-gray-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="First page"
          >
            <ChevronsLeft size={14} />
          </button>
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-1.5 text-gray-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Previous page"
          >
            <ChevronLeft size={14} />
          </button>

          {pages.map((page, i) =>
            page === '...' ? (
              <span key={`ellipsis-${i}`} className="px-2 text-gray-500">
                ...
              </span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange(page as number)}
                className={`w-8 h-8 text-sm transition-colors ${
                  currentPage === page
                    ? 'bg-gold-600 text-dark-800 font-medium'
                    : 'text-gray-400 hover:text-white hover:bg-dark-600'
                }`}
              >
                {page}
              </button>
            )
          )}

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-1.5 text-gray-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Next page"
          >
            <ChevronRight size={14} />
          </button>
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="p-1.5 text-gray-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Last page"
          >
            <ChevronsRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

function getPageNumbers(current: number, total: number): (number | string)[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  if (current <= 3) {
    return [1, 2, 3, 4, '...', total];
  }

  if (current >= total - 2) {
    return [1, '...', total - 3, total - 2, total - 1, total];
  }

  return [1, '...', current - 1, current, current + 1, '...', total];
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 bg-dark-600 border border-dark-300 flex items-center justify-center mx-auto mb-4">
        <Icon size={28} className="text-gray-500" />
      </div>
      <h3 className="text-white font-semibold mb-2">{title}</h3>
      <p className="text-gray-500 text-sm mb-4 max-w-md mx-auto">{description}</p>
      {action && (
        <button onClick={action.onClick} className="btn-secondary text-sm">
          {action.label}
        </button>
      )}
    </div>
  );
}
