import { useEffect } from "react";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";
import type { Toast as ToastType, ToastType as ToastTypeEnum } from "@/shared/toast";

interface ToastProps {
  toast: ToastType;
  onRemove: (id: string) => void;
}

const TOAST_STYLES: Record<ToastTypeEnum, string> = {
  success:
    "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800",
  error:
    "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
  info: "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  warning:
    "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
};

const TOAST_ICONS: Record<ToastTypeEnum, React.ReactNode> = {
  success: <CheckCircle className="w-4 h-4" />,
  error: <AlertCircle className="w-4 h-4" />,
  info: <Info className="w-4 h-4" />,
  warning: <AlertTriangle className="w-4 h-4" />,
};

export function Toast({ toast, onRemove }: ToastProps) {
  useEffect(() => {
    if (toast.duration) {
      const timer = setTimeout(() => {
        onRemove(toast.id);
      }, toast.duration);
      return () => clearTimeout(timer);
    }
  }, [toast.id, toast.duration, onRemove]);

  return (
    <div
      className={`
        flex items-center gap-2 px-3 py-2 rounded-lg border shadow-lg
        animate-in slide-in-from-top-2 fade-in duration-200
        ${TOAST_STYLES[toast.type]}
      `}
    >
      {TOAST_ICONS[toast.type]}
      <span className="flex-1 text-sm">{toast.message}</span>
      <button
        onClick={() => onRemove(toast.id)}
        className="p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: ToastType[];
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast toast={toast} onRemove={onRemove} />
        </div>
      ))}
    </div>
  );
}
