import React from 'react';
import { AlertTriangle, Bell, CheckCircle2, X } from 'lucide-react';

export default function ToastAlert({ toast, onClose, onAction }) {
  if (!toast) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '64px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - 32px)',
        maxWidth: '400px',
        background: '#042723',
        color: '#FFFFFF',
        borderRadius: '16px',
        padding: '12px 16px',
        boxShadow: '0 10px 25px rgba(0, 30, 26, 0.45)',
        zIndex: 9999,
        border: '1px solid #134e48',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        animation: 'slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: toast.type === 'error' ? '#EF4444' : 'var(--color-mint)',
            color: toast.type === 'error' ? '#FFFFFF' : 'var(--color-primary-dark)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          {toast.type === 'confirmed' ? <CheckCircle2 size={18} /> : toast.type === 'error' ? <AlertTriangle size={18} /> : <Bell size={18} />}
        </div>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#A3E8D8' }}>
            {toast.title}
          </div>
          <div style={{ fontSize: '12px', color: '#E2E8F0', marginTop: '1px' }}>
            {toast.message}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {toast.actionText && (
          <button
            onClick={onAction}
            style={{
              background: 'var(--color-mint)',
              color: 'var(--color-primary-dark)',
              fontSize: '11px',
              fontWeight: 800,
              padding: '6px 10px',
              borderRadius: '8px'
            }}
          >
            {toast.actionText}
          </button>
        )}
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            color: '#94A3B8',
            padding: '4px'
          }}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
