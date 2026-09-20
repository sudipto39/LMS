// src/context/ToastContext.tsx
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";

interface ToastContextValue {
  showToast: (message: string) => void;
  toast: string | null;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  return (
    <ToastContext.Provider value={{ showToast, toast }}>
      {children}
      {toast && (
        <div className="fixed bottom-4 right-4 z-[80] rounded-full bg-[#0f2a33] text-white px-5 py-2.5 text-[12px] font-medium shadow-xl flex items-center gap-2 border border-white/10 animate-bounce">
          <CheckCircle2 size={14} className="text-[#22d3ee]" />
          <span>{toast}</span>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): (message: string) => void {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx.showToast;
}
