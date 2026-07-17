interface SkeletonProps {
  className?: string;
  count?: number;
  variant?: 'page' | 'block';
}

export function Skeleton({ className = '', count = 1, variant = 'block' }: SkeletonProps) {
  const items = Array.from({ length: count }, (_, i) => i);

  if (variant === 'page') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)]">
        <div className="h-8 w-8 rounded-full border-2 border-[var(--accent-primary)] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (count === 1) {
    return <div className={`shimmer ${className}`} />;
  }

  return (
    <>
      {items.map((i) => (
        <div key={i} className={`shimmer ${className}`} />
      ))}
    </>
  );
}

export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <tr className="hover:bg-dark-600/30">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="table-cell">
          <div className="h-4 shimmer bg-dark-600" style={{ width: `${60 + Math.random() * 40}%` }} />
        </td>
      ))}
    </tr>
  );
}

export function CardSkeleton() {
  return (
    <div className="card animate-pulse">
      <div className="h-40 shimmer bg-dark-600 -mx-6 -mt-6 mb-4" />
      <div className="h-4 shimmer bg-dark-600 w-3/4 mb-2" />
      <div className="h-3 shimmer bg-dark-600 w-1/2 mb-4" />
      <div className="h-3 shimmer bg-dark-600 w-full mb-1" />
      <div className="h-3 shimmer bg-dark-600 w-2/3" />
    </div>
  );
}

export function StatSkeleton() {
  return (
    <div className="stat-card">
      <div className="w-10 h-10 shimmer bg-dark-600 border border-dark-300" />
      <div className="h-7 shimmer bg-dark-600 w-1/3" />
      <div className="h-3 shimmer bg-dark-600 w-1/2" />
    </div>
  );
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-14 shimmer shimmer bg-dark-600" />
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, columns = 6 }: { rows?: number; columns?: number }) {
  return (
    <div className="border border-dark-300">
      <table className="w-full">
        <thead>
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="table-header">
                <div className="h-3 shimmer bg-dark-500 w-1/2" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRowSkeleton key={i} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
