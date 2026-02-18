
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface Toast {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
}

interface ToastContextType {
    toasts: Toast[];
    showToast: (type: Toast['type'], message: string) => void;
    dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((type: Toast['type'], message: string) => {
        const id = Math.random().toString(36).slice(2);
        setToasts(prev => [...prev, { id, type, message }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
    }, []);

    const dismissToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const colors: Record<Toast['type'], string> = {
        success: 'bg-success text-white',
        error: 'bg-danger text-white',
        warning: 'bg-warning text-slate-900',
        info: 'bg-primary text-white',
    };

    const icons: Record<Toast['type'], string> = {
        success: '✓', error: '✕', warning: '⚠', info: 'ℹ',
    };

    return (
        <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
            {children}
            <div className="fixed bottom-6 right-6 z-[9999] flex flex-col-reverse gap-3 pointer-events-none">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`pointer-events-auto flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl text-sm font-bold animate-in slide-in-from-right duration-300 ${colors[toast.type]}`}
                    >
                        <span className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center text-xs font-black">{icons[toast.type]}</span>
                        <span className="flex-1">{toast.message}</span>
                        <button onClick={() => dismissToast(toast.id)} className="ml-2 opacity-60 hover:opacity-100 text-xs font-black">✕</button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within ToastProvider');
    return ctx;
};
