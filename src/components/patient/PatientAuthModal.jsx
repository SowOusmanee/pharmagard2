import React, { useState } from 'react';
import { X, Phone, KeyRound, CheckCircle2, ShieldCheck, User } from 'lucide-react';
import { authService } from '../../services/authService';

export default function PatientAuthModal({ session, onClose }) {
  const [step, setStep] = useState('phone'); // 'phone' | 'otp' | 'success'
  const [phone, setPhone] = useState('+221 77 ');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (phone.length < 9) {
      setError('Veuillez entrer un numéro valide (ex: +221 77 123 45 67)');
      return;
    }
    setError('');
    setLoading(true);
    await authService.sendOtp(phone);
    setLoading(false);
    setStep('otp');
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await authService.verifyOtp(phone, otp);
    setLoading(false);
    if (res.success) {
      setStep('success');
      setTimeout(() => {
        onClose();
      }, 1200);
    } else {
      setError(res.error || 'Code invalide');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'var(--color-mint-light)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <User size={18} />
            </div>
            <h2 style={{ fontSize: '18px', color: 'var(--color-primary)' }}>
              Espace Patient PharmaGarde
            </h2>
          </div>

          <button
            onClick={onClose}
            style={{
              background: '#F1F5F9',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748B'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {step === 'phone' && (
          <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
              Connectez-vous avec votre numéro mobile pour retrouver vos ordonnances et recherches sauvegardées.
            </p>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-main)' }}>
                Numéro de téléphone (Sénégal)
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'var(--color-bg-input)',
                  borderRadius: '12px',
                  border: '1px solid #C2EBE2',
                  padding: '12px',
                  gap: '8px',
                  marginTop: '4px'
                }}
              >
                <Phone size={18} color="var(--color-primary)" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+221 77 000 00 00"
                  style={{
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    fontSize: '15px',
                    fontWeight: 600,
                    width: '100%'
                  }}
                />
              </div>
            </div>

            {error && <div style={{ fontSize: '12px', color: '#DC2626' }}>{error}</div>}

            <button type="submit" className="btn-primary" disabled={loading}>
              <span>{loading ? 'Envoi...' : 'Recevoir le code SMS (OTP)'}</span>
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
              Entrez le code à 4 chiffres envoyé au <strong>{phone}</strong>.
              <br />
              <span style={{ fontSize: '11px', color: 'var(--color-primary)' }}>
                (Code de démo : <strong>1234</strong>)
              </span>
            </p>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-main)' }}>
                Code de vérification (4 chiffres)
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'var(--color-bg-input)',
                  borderRadius: '12px',
                  border: '1px solid #C2EBE2',
                  padding: '12px',
                  gap: '8px',
                  marginTop: '4px'
                }}
              >
                <KeyRound size={18} color="var(--color-primary)" />
                <input
                  type="text"
                  maxLength={4}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="1234"
                  style={{
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    fontSize: '18px',
                    letterSpacing: '8px',
                    fontWeight: 800,
                    textAlign: 'center',
                    width: '100%'
                  }}
                />
              </div>
            </div>

            {error && <div style={{ fontSize: '12px', color: '#DC2626' }}>{error}</div>}

            <button type="submit" className="btn-primary" disabled={loading}>
              <span>{loading ? 'Vérification...' : 'Valider la connexion'}</span>
            </button>
          </form>
        )}

        {step === 'success' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <CheckCircle2 size={48} color="#10B981" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '18px', color: 'var(--color-primary)' }}>
              Connexion réussie !
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
              Bienvenue sur PharmaGarde
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
