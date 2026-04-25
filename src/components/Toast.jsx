import { useState, useEffect, useCallback } from 'react';

/**
 * Toast notification system.
 * Returns { toasts, addToast } — render <ToastContainer> in your JSX.
 */
let toastIdCounter = 0;

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 5000) => {
    const id = ++toastIdCounter;
    setToasts((prev) => [...prev, { id, message, type, duration }]);

    // Auto-dismiss after duration
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
}

/* ── Style maps ── */
const TYPE_STYLES = {
  info:    'from-indigo-500/20 to-purple-500/20 border-indigo-500/40',
  warning: 'from-amber-500/20 to-orange-500/20 border-amber-500/40',
  success: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/40',
};

const TYPE_ICONS = {
  info:    '🔔',
  warning: '⚡',
  success: '🎉',
};

const TYPE_ACCENT = {
  info:    'bg-indigo-500',
  warning: 'bg-amber-500',
  success: 'bg-emerald-500',
};

/**
 * Renders floating toast notifications in the top-right corner.
 */
export function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="fixed top-20 right-4 z-[100] flex flex-col gap-3 w-80 sm:w-96 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onClose }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => setIsVisible(true));

    // Trigger exit animation before removal
    const exitTimer = setTimeout(() => setIsVisible(false), toast.duration - 400);
    return () => clearTimeout(exitTimer);
  }, [toast.duration]);

  return (
    <div
      className={`
        pointer-events-auto rounded-xl border p-4
        bg-gradient-to-r ${TYPE_STYLES[toast.type]}
        backdrop-blur-xl shadow-2xl shadow-black/30
        transition-all duration-400 ease-out
        ${isVisible
          ? 'opacity-100 translate-x-0'
          : 'opacity-0 translate-x-8'}
      `}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 text-2xl mt-0.5">
          {TYPE_ICONS[toast.type]}
        </div>

        {/* Message */}
        <div className="flex-1 min-w-0">
          <p className="text-white font-medium text-sm leading-relaxed">
            {toast.message}
          </p>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="flex-shrink-0 text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Progress bar */}
      <div className="mt-3 h-1 rounded-full bg-white/10 overflow-hidden">
        <div
          className={`h-full rounded-full ${TYPE_ACCENT[toast.type]}`}
          style={{
            animation: `shrink ${toast.duration}ms linear forwards`,
          }}
        />
      </div>

      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}
