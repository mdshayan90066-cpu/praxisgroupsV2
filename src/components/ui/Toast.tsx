import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);

    const duration = toast.duration ?? 5000;
    if (duration > 0) {
      setTimeout(() => removeToast(id), duration);
    }
  }, [removeToast]);

  const success = useCallback((title: string, message?: string) => {
    addToast({ type: 'success', title, message });
  }, [addToast]);

  const error = useCallback((title: string, message?: string) => {
    addToast({ type: 'error', title, message, duration: 7000 });
  }, [addToast]);

  const warning = useCallback((title: string, message?: string) => {
    addToast({ type: 'warning', title, message, duration: 6000 });
  }, [addToast]);

  const info = useCallback((title: string, message?: string) => {
    addToast({ type: 'info', title, message });
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, warning, info }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-md">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

const toastStyles: Record<ToastType, { icon: typeof CheckCircle; bg: string; border: string; iconColor: string }> = {
  success: { icon: CheckCircle, bg: 'bg-forest-600/10', border: 'border-forest-600/30', iconColor: 'text-forest-400' },
  error: { icon: XCircle, bg: 'bg-red-600/10', border: 'border-red-600/30', iconColor: 'text-red-400' },
  warning: { icon: AlertTriangle, bg: 'bg-orange-600/10', border: 'border-orange-600/30', iconColor: 'text-orange-400' },
  info: { icon: Info, bg: 'bg-blue-600/10', border: 'border-blue-600/30', iconColor: 'text-blue-400' },
};

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const style = toastStyles[toast.type];
  const Icon = style.icon;

  return (
    <div
      className={`${style.bg} ${style.border} border p-4 flex items-start gap-3 animate-slide-up backdrop-blur-sm`}
      role="alert"
    >
      <Icon size={18} className={`${style.iconColor} shrink-0 mt-0.5`} />
      <div className="flex-1 min-w-0">
        <div className="text-white text-sm font-medium">{toast.title}</div>
        {toast.message && (
          <div className="text-gray-400 text-xs mt-0.5">{toast.message}</div>
        )}
      </div>
      <button
        onClick={onClose}
        className="text-gray-500 hover:text-white transition-colors shrink-0"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}
