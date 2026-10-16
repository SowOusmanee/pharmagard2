import React from 'react';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

export default function TopBar({
  role,
  onLogoClick,
  onProfileClick,
  showBack = false,
  onBack
}) {
  if (role === 'pharmacist') {
    return (
      <header className="pg-topbar">
        <div className="pg-logo-group" onClick={onLogoClick} style={{ cursor: 'pointer' }}>
          <div className="pg-logo-icon">
            <div className="pg-logo-cross" />
            <div className="pg-logo-dot" />
          </div>
          <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-primary)' }}>PharmaGarde Pro</span>
        </div>
        <button
          className="pg-avatar-btn"
          onClick={onProfileClick}
          aria-label="Profil pharmacien"
        >
          <ShieldCheck size={18} />
        </button>
      </header>
    );
  }

  // Patient: Circular back button
  return (
    <header
      className="pg-topbar"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        position: 'relative',
        padding: '16px 20px',
        backgroundColor: '#F8F9FA',
        borderBottom: 'none',
        animation: 'topBarFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) both'
      }}
    >
      <style>{`
        @keyframes topBarFadeIn {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      {showBack && (
        <button
          onClick={onBack}
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            backgroundColor: '#FFFFFF',
            border: '1px solid #E5EBEA',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
            color: '#0B2421',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.15s ease'
          }}
          aria-label="Retour"
        >
          <ArrowLeft size={18} />
        </button>
      )}
    </header>
  );
}
