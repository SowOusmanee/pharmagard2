import React, { useState, useEffect } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Volume2, ShieldCheck, Copy, Check } from 'lucide-react';

export default function CallSimulatorModal({ pharmacy, onClose }) {
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleCopy = () => {
    if (pharmacy?.phone) {
      navigator.clipboard?.writeText(pharmacy.phone);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!pharmacy) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-sheet"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#041715',
          color: '#FFFFFF',
          textAlign: 'center',
          padding: '30px 24px 40px'
        }}
      >
        <div style={{ fontSize: '12px', color: 'var(--color-mint)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          APPEL DIRECT SÉCURISÉ
        </div>

        <h2 style={{ fontSize: '22px', color: '#FFFFFF', marginTop: '6px' }}>
          {pharmacy.name}
        </h2>
        <div style={{ fontSize: '14px', color: '#A3E8D8', marginTop: '2px' }}>
          {pharmacy.phone}
        </div>

        <div style={{ fontSize: '13px', color: '#94A3B8', marginTop: '12px' }}>
          {pharmacy.pharmacistName} · {pharmacy.landmark}
        </div>

        {/* Call Timer */}
        <div
          style={{
            fontSize: '28px',
            fontFamily: 'monospace',
            color: 'var(--color-mint)',
            fontWeight: 800,
            margin: '20px 0'
          }}
        >
          {formatTimer(callDuration)}
        </div>

        {/* Copy phone button */}
        <button
          onClick={handleCopy}
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            color: '#FFFFFF',
            border: '1px solid #113833',
            borderRadius: '999px',
            padding: '6px 14px',
            fontSize: '12px',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '28px'
          }}
        >
          {copied ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
          <span>{copied ? 'Numéro copié !' : 'Copier le numéro'}</span>
        </button>

        {/* Call Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px' }}>
          <button
            onClick={() => setIsMuted(!isMuted)}
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: isMuted ? 'var(--color-mint)' : '#143834',
              color: isMuted ? 'var(--color-primary-dark)' : '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
          </button>

          {/* Hang Up Button */}
          <button
            onClick={onClose}
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#EF4444',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)'
            }}
          >
            <PhoneOff size={26} />
          </button>

          <button
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: '#143834',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Volume2 size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
