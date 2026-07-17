import { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-red-600/10 border border-red-600/20 flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={32} className="text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
            <p className="text-gray-400 text-sm mb-6">
              {this.state.error?.message || 'An unexpected error occurred. Please try again.'}
            </p>
            <button
              onClick={this.handleRetry}
              className="btn-secondary px-5 py-2.5 text-sm inline-flex items-center gap-2"
            >
              <RefreshCw size={14} />
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export function ErrorFallback({
  error,
  onRetry,
}: {
  error?: string | null;
  onRetry?: () => void;
}) {
  return (
    <div className="min-h-[200px] flex items-center justify-center p-8">
      <div className="text-center">
        <AlertTriangle size={32} className="text-red-400 mx-auto mb-4" />
        <h3 className="text-white font-semibold mb-2">Failed to Load</h3>
        <p className="text-gray-500 text-sm mb-4">{error || 'Something went wrong'}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="btn-ghost text-sm inline-flex items-center gap-2"
          >
            <RefreshCw size={14} />
            Retry
          </button>
        )}
      </div>
    </div>
  );
}

export function NetworkError({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="min-h-[200px] flex items-center justify-center p-8">
      <div className="text-center">
        <div className="w-12 h-12 bg-orange-600/10 border border-orange-600/20 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={24} className="text-orange-400" />
        </div>
        <h3 className="text-white font-semibold mb-2">Connection Problem</h3>
        <p className="text-gray-500 text-sm mb-4">
          Unable to connect. Please check your connection and try again.
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="btn-secondary text-sm inline-flex items-center gap-2"
          >
            <RefreshCw size={14} />
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
