import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useToast } from './ToastContext';
import type { ToastType } from '../components/Toast';

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

interface DialogContextType {
  alert: (message: string, type?: ToastType) => void;
  confirm: (options: string | ConfirmOptions) => Promise<boolean>;
}

interface PendingConfirm {
  options: ConfirmOptions;
  resolve: (result: boolean) => void;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export const useDialog = () => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within DialogProvider');
  }
  return context;
};

export const DialogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { showToast } = useToast();
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null);

  const alert = useCallback((message: string, type: ToastType = 'info') => {
    showToast(String(message), type);
  }, [showToast]);

  const confirm = useCallback((options: string | ConfirmOptions) => {
    const normalized: ConfirmOptions = typeof options === 'string'
      ? { message: options }
      : options;

    return new Promise<boolean>((resolve) => {
      setPendingConfirm({
        options: {
          title: normalized.title || 'Confirmar acción',
          message: normalized.message,
          confirmText: normalized.confirmText || 'Confirmar',
          cancelText: normalized.cancelText || 'Cancelar',
          danger: normalized.danger ?? false,
        },
        resolve,
      });
    });
  }, []);

  useEffect(() => {
    const originalAlert = window.alert;
    window.alert = (message?: string) => {
      alert(String(message ?? ''));
    };

    return () => {
      window.alert = originalAlert;
    };
  }, [alert]);

  const closeConfirm = (result: boolean) => {
    if (!pendingConfirm) return;
    pendingConfirm.resolve(result);
    setPendingConfirm(null);
  };

  const value = useMemo(() => ({ alert, confirm }), [alert, confirm]);

  return (
    <DialogContext.Provider value={value}>
      {children}

      {pendingConfirm && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="px-6 py-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                  <AlertTriangle size={20} />
                </span>
                <h3 className="text-lg font-semibold text-slate-900">{pendingConfirm.options.title}</h3>
              </div>
            </div>

            <div className="px-6 py-5">
              <p className="text-sm text-slate-600 whitespace-pre-line">{pendingConfirm.options.message}</p>
            </div>

            <div className="px-6 pb-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => closeConfirm(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
              >
                {pendingConfirm.options.cancelText}
              </button>
              <button
                type="button"
                onClick={() => closeConfirm(true)}
                className={`px-4 py-2 rounded-lg text-white transition-colors ${pendingConfirm.options.danger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {pendingConfirm.options.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
};
