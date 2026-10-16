import React from 'react';
import { WifiOff } from 'lucide-react';

export default function DotsLoader({
  message = "Chargement des disponibilités...",
  subtext = "Connexion lente · Recherche en cours...",
  card = false,
  showWifiHint = false,
  style = {}
}) {
  const content = (
    <>
      <div className="dots-container" style={{ height: '36px', width: 'auto', marginBottom: '8px' }}>
        <div className="dot"></div>
        <div className="dot"></div>
        <div className="dot"></div>
      </div>

      {message && (
        <div
          style={{
            fontSize: '14.5px',
            fontWeight: 700,
            color: 'var(--color-primary-dark, #004740)',
            marginBottom: '4px'
          }}
        >
          {message}
        </div>
      )}

      {subtext && (
        <div
          style={{
            fontSize: '12px',
            color: 'var(--color-text-muted, #526E6A)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          {showWifiHint && <WifiOff size={13} color="var(--color-alert-amber, #D97706)" />}
          <span>{subtext}</span>
        </div>
      )}
    </>
  );

  if (card) {
    return (
      <div className="slow-connection-card" style={style}>
        {content}
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        textAlign: 'center',
        width: '100%',
        ...style
      }}
    >
      {content}
    </div>
  );
}
