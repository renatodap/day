'use client';

import { useEffect, useState, createContext, useContext, useCallback } from 'react';

interface ToastContextType {
  showToast: (message: string, type?: 'info' | 'error' | 'success') => void;
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

interface Toast {
  id: number;
  message: string;
  type: 'info' | 'error' | 'success';
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: 'info' | 'error' | 'success' = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-0 left-0 right-0 flex flex-col items-center gap-2 p-4 pointer-events-none z-50">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast }: { toast: Toast }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  const colors = {
    info: 'bg-surface border-border',
    error: 'bg-danger/10 border-danger/30 text-danger',
    success: 'bg-win/10 border-win/30 text-win',
  };

  return (
    <div
      className={`toast pointer-events-auto ${colors[toast.type]} ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{
        transition: 'opacity 200ms ease-out',
      }}
    >
      {toast.message}
    </div>
  );
}
