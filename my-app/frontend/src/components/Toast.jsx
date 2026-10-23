import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(({ title, message, type = 'error', duration = 4500 }) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 7);
    const newToast = { id, title, message, type };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    return id;
  }, [removeToast]);

  const showError = useCallback((message, title = 'ACCESS DENIED') => {
    return addToast({ title, message, type: 'error' });
  }, [addToast]);

  const showSuccess = useCallback((message, title = 'SUCCESS') => {
    return addToast({ title, message, type: 'success' });
  }, [addToast]);

  const showInfo = useCallback((message, title = 'SYSTEM NOTICE') => {
    return addToast({ title, message, type: 'info' });
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ addToast, showError, showSuccess, showInfo, removeToast }}>
      {children}
      <div className="toast-container" aria-live="polite">
        {toasts.map((toast) => {
          let typeClass = 'toast-error';
          let prefix = '[ACCESS DENIED]';

          if (toast.type === 'success') {
            typeClass = 'toast-success';
            prefix = '[SUCCESS]';
          } else if (toast.type === 'info') {
            typeClass = 'toast-info';
            prefix = '[SYSTEM]';
          }

          return (
            <div key={toast.id} className={`toast ${typeClass}`} role="alert">
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '4px', letterSpacing: '0.05em' }} className="toast-title">
                  {prefix} {toast.title || ''}
                </div>
                <div style={{ color: 'var(--text-main)', fontSize: '0.82rem', lineHeight: '1.4' }}>
                  {toast.message}
                </div>
              </div>
              <button
                type="button"
                className="toast-close"
                onClick={() => removeToast(toast.id)}
                title="Dismiss"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
