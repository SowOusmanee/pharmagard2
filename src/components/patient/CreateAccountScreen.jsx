import React, { useState } from 'react';
import { ArrowLeft, Mail, Lock, Eye, EyeOff, User, Phone, MapPin, CheckCircle2, AlertCircle } from 'lucide-react';
import { authService } from '../../services/authService';

const DAKAR_COMMUNES = [
  'Keur Massar',
  'Pikine',
  'Guédiawaye',
  'Rufisque',
  'Parcelles Assainies',
  'Grand Yoff',
  'Dakar Plateau',
  'Médina',
  'Almadies / Ngor / Ouakam',
  'Yoff',
  'Mermoz / Sacré-Cœur',
  'Autre commune'
];

export default function CreateAccountScreen({ onBack, onSuccess }) {
  // Mode par défaut : 'login' (Se connecter) comme demandé par l'utilisateur
  // Peut basculer vers 'register' via l'option "Créer un compte"
  const [mode, setMode] = useState('login'); // 'login' | 'register'

  // État Login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // État Register
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPhone, setRegisterPhone] = useState('+221 ');
  const [registerCommune, setRegisterCommune] = useState('Keur Massar');
  const [registerPassword, setRegisterPassword] = useState('');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  // États génériques
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Gestion de la connexion par Email & Mot de passe
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setError('');

    const cleanIdent = (loginEmail || '').trim().toLowerCase();
    const cleanPass = (loginPassword || '').trim();
    const isAdmin =
      (cleanIdent === 'admin' || cleanIdent === 'admin@pharmagarde.sn' || cleanIdent === 'admin@gmail.com') &&
      cleanPass === 'admin';

    if (!isAdmin) {
      if (!loginEmail.trim() || !loginEmail.includes('@')) {
        setError('Veuillez saisir une adresse email valide ou identifiant admin.');
        return;
      }
      if (!loginPassword || loginPassword.length < 4) {
        setError('Veuillez saisir votre mot de passe (au moins 4 caractères).');
        return;
      }
    }

    setLoading(true);
    setTimeout(() => {
      const res = authService.loginWithEmail({
        email: loginEmail.trim(),
        password: loginPassword
      });
      setLoading(false);

      if (res && res.success) {
        setSuccessMessage(res.role === 'pharmacist' ? 'Connexion Pharmacie réussie !' : 'Connexion réussie !');
        setTimeout(() => {
          onSuccess ? onSuccess(res.user) : onBack();
        }, 700);
      } else {
        setError('Identifiants incorrects. Veuillez réessayer.');
      }
    }, 500);
  };

  // Gestion de la connexion avec Google
  const handleGoogleLogin = () => {
    setError('');
    setLoading(true);
    setTimeout(() => {
      const res = authService.loginWithGoogle();
      setLoading(false);
      if (res && res.success) {
        setSuccessMessage('Connexion Google réussie !');
        setTimeout(() => {
          onSuccess ? onSuccess(res.user) : onBack();
        }, 800);
      }
    }, 450);
  };

  // Gestion de la connexion avec Apple
  const handleAppleLogin = () => {
    setError('');
    setLoading(true);
    setTimeout(() => {
      const res = authService.loginWithApple();
      setLoading(false);
      if (res && res.success) {
        setSuccessMessage('Connexion Apple réussie !');
        setTimeout(() => {
          onSuccess ? onSuccess(res.user) : onBack();
        }, 800);
      }
    }, 450);
  };

  // Gestion de la création de compte
  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!registerName.trim() || registerName.trim().length < 2) {
      setError('Veuillez renseigner votre nom complet.');
      return;
    }
    if (!registerEmail.trim() || !registerEmail.includes('@')) {
      setError('Veuillez renseigner une adresse email valide.');
      return;
    }
    if (!registerPassword || registerPassword.length < 4) {
      setError('Le mot de passe doit comporter au moins 4 caractères.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const res = authService.registerPatient({
        fullName: registerName.trim(),
        email: registerEmail.trim(),
        phone: registerPhone.trim(),
        commune: registerCommune,
        password: registerPassword
      });
      setLoading(false);

      if (res && res.success) {
        setSuccessMessage('Compte créé avec succès !');
        setTimeout(() => {
          onSuccess ? onSuccess(res.user) : onBack();
        }, 800);
      } else {
        setError('Impossible de créer le compte. Veuillez réessayer.');
      }
    }, 600);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: '100%',
        backgroundColor: '#FFFFFF',
        boxSizing: 'border-box',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        position: 'relative'
      }}
    >
      <style>{`
        @keyframes fadeInSlide {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .social-btn {
          display: flex;
          align-items: center;
          justifyContent: center;
          gap: 12px;
          width: 100%;
          padding: 13px 16px;
          border-radius: 14px;
          font-size: 14.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.18s ease;
          box-sizing: border-box;
          font-family: inherit;
        }
        .social-btn:active {
          transform: scale(0.985);
        }
      `}</style>

      {/* Barre supérieure avec bouton Retour */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px 8px',
          backgroundColor: '#FFFFFF',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}
      >
        <button
          type="button"
          onClick={onBack}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: '#F3F4F6',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#1F2937',
            transition: 'background-color 0.15s ease'
          }}
          aria-label="Retour"
        >
          <ArrowLeft size={19} strokeWidth={2.4} />
        </button>

        <span style={{ fontSize: '13px', fontWeight: 600, color: '#9CA3AF' }}>
          PharmaGarde
        </span>
      </div>

      <div style={{ padding: '8px 24px 32px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        {/* Titre & Sous-titre */}
        <div style={{ marginBottom: '22px' }}>
          <h1
            style={{
              fontSize: '25px',
              fontWeight: 800,
              color: '#0F172A',
              margin: '0 0 6px 0',
              letterSpacing: '-0.4px'
            }}
          >
            {mode === 'login' ? 'Se connecter' : 'Créer un compte'}
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: '#64748B', lineHeight: '1.45' }}>
            {mode === 'login'
              ? 'Entrez vos identifiants pour accéder à votre compte'
              : 'Remplissez les informations pour créer votre profil santé'}
          </p>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              backgroundColor: '#FEF2F2',
              border: '1px solid #FEE2E2',
              color: '#DC2626',
              borderRadius: '12px',
              padding: '11px 14px',
              fontSize: '13.5px',
              marginBottom: '16px',
              animation: 'fadeInSlide 0.2s ease'
            }}
          >
            <AlertCircle size={17} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Message de succès */}
        {successMessage && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              backgroundColor: '#ECFDF5',
              border: '1px solid #D1FAE5',
              color: '#059669',
              borderRadius: '12px',
              padding: '12px 14px',
              fontSize: '14px',
              fontWeight: 600,
              marginBottom: '16px',
              animation: 'fadeInSlide 0.2s ease'
            }}
          >
            <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* VUE 1 : SE CONNECTER (EMAIL + MOT DE PASSE) */}
        {mode === 'login' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, animation: 'fadeInSlide 0.22s ease' }}>
            <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {/* Champ Email */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#334155',
                    marginBottom: '6px'
                  }}
                >
                  Email ou identifiant
                </label>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: '#F8FAFC',
                    border: '1.5px solid #E2E8F0',
                    borderRadius: '14px',
                    padding: '0 14px',
                    height: '48px',
                    transition: 'border-color 0.15s ease'
                  }}
                >
                  <Mail size={18} color="#94A3B8" style={{ marginRight: '10px', flexShrink: 0 }} />
                  <input
                    type="text"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="Email ou identifiant (ex: admin)"
                    autoComplete="username"
                    required
                    style={{
                      border: 'none',
                      outline: 'none',
                      backgroundColor: 'transparent',
                      width: '100%',
                      fontSize: '14.5px',
                      color: '#0F172A'
                    }}
                  />
                </div>
              </div>

              {/* Champ Mot de passe */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#334155'
                    }}
                  >
                    Mot de passe
                  </label>
                  <button
                    type="button"
                    onClick={() => setError('Fonctionnalité de réinitialisation bientôt disponible.')}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      color: '#005F56',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Mot de passe oublié ?
                  </button>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: '#F8FAFC',
                    border: '1.5px solid #E2E8F0',
                    borderRadius: '14px',
                    padding: '0 14px',
                    height: '48px',
                    transition: 'border-color 0.15s ease'
                  }}
                >
                  <Lock size={18} color="#94A3B8" style={{ marginRight: '10px', flexShrink: 0 }} />
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                    style={{
                      border: 'none',
                      outline: 'none',
                      backgroundColor: 'transparent',
                      width: '100%',
                      fontSize: '14.5px',
                      color: '#0F172A'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      color: '#94A3B8',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    {showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Bouton de connexion */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  marginTop: '6px',
                  height: '48px',
                  borderRadius: '14px',
                  backgroundColor: '#005F56',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '15px',
                  fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 14px rgba(0, 95, 86, 0.28)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'transform 0.15s ease, background-color 0.15s ease',
                  opacity: loading ? 0.75 : 1
                }}
              >
                {loading ? 'Connexion en cours...' : 'Se connecter'}
              </button>
            </form>

            {/* Séparateur */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                margin: '22px 0 18px',
                gap: '12px'
              }}
            >
              <div style={{ flex: 1, height: '1px', backgroundColor: '#E2E8F0' }} />
              <span style={{ fontSize: '12.5px', color: '#94A3B8', fontWeight: 500, textTransform: 'lowercase' }}>
                ou
              </span>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#E2E8F0' }} />
            </div>

            {/* Boutons Sociaux : Google & Apple */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '11px', marginBottom: '24px' }}>
              {/* Bouton Google */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="social-btn"
                style={{
                  backgroundColor: '#FFFFFF',
                  color: '#1F2937',
                  border: '1.5px solid #E2E8F0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                }}
              >
                <svg width="19" height="19" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>Se connecter avec Google</span>
              </button>

              {/* Bouton Apple */}
              <button
                type="button"
                onClick={handleAppleLogin}
                disabled={loading}
                className="social-btn"
                style={{
                  backgroundColor: '#000000',
                  color: '#FFFFFF',
                  border: 'none',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.14)'
                }}
              >
                <svg width="19" height="19" viewBox="0 0 24 24" fill="#FFFFFF">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.38c.62-.75 1.04-1.8 0.93-2.85-.9.04-1.99.6-2.64 1.36-.58.67-1.09 1.74-.95 2.77 1 .08 2.04-.53 2.66-1.28z" />
                </svg>
                <span>Se connecter avec Apple</span>
              </button>
            </div>

            {/* Option Créer un compte */}
            <div
              style={{
                marginTop: 'auto',
                paddingTop: '16px',
                textAlign: 'center',
                borderTop: '1px solid #F1F5F9'
              }}
            >
              <p style={{ margin: 0, fontSize: '14px', color: '#64748B' }}>
                Vous n'avez pas de compte ?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setMode('register');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    color: '#005F56',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Créer un compte
                </button>
              </p>
            </div>
          </div>
        )}

        {/* VUE 2 : CRÉER UN COMPTE (FORMULAIRE D'INSCRIPTION) */}
        {mode === 'register' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, animation: 'fadeInSlide 0.22s ease' }}>
            <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Nom complet */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '5px' }}>
                  Nom complet
                </label>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: '#F8FAFC',
                    border: '1.5px solid #E2E8F0',
                    borderRadius: '14px',
                    padding: '0 14px',
                    height: '46px'
                  }}
                >
                  <User size={18} color="#94A3B8" style={{ marginRight: '10px' }} />
                  <input
                    type="text"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    placeholder="Ex: Aminata Diallo"
                    required
                    style={{ border: 'none', outline: 'none', backgroundColor: 'transparent', width: '100%', fontSize: '14px', color: '#0F172A' }}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '5px' }}>
                  Email
                </label>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: '#F8FAFC',
                    border: '1.5px solid #E2E8F0',
                    borderRadius: '14px',
                    padding: '0 14px',
                    height: '46px'
                  }}
                >
                  <Mail size={18} color="#94A3B8" style={{ marginRight: '10px' }} />
                  <input
                    type="email"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    placeholder="aminata@exemple.com"
                    required
                    style={{ border: 'none', outline: 'none', backgroundColor: 'transparent', width: '100%', fontSize: '14px', color: '#0F172A' }}
                  />
                </div>
              </div>

              {/* Téléphone */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '5px' }}>
                  Téléphone (Sénégal)
                </label>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: '#F8FAFC',
                    border: '1.5px solid #E2E8F0',
                    borderRadius: '14px',
                    padding: '0 14px',
                    height: '46px'
                  }}
                >
                  <Phone size={18} color="#94A3B8" style={{ marginRight: '10px' }} />
                  <input
                    type="tel"
                    value={registerPhone}
                    onChange={(e) => setRegisterPhone(e.target.value)}
                    placeholder="+221 77 123 45 67"
                    style={{ border: 'none', outline: 'none', backgroundColor: 'transparent', width: '100%', fontSize: '14px', color: '#0F172A' }}
                  />
                </div>
              </div>

              {/* Commune */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '5px' }}>
                  Commune de résidence
                </label>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: '#F8FAFC',
                    border: '1.5px solid #E2E8F0',
                    borderRadius: '14px',
                    padding: '0 14px',
                    height: '46px'
                  }}
                >
                  <MapPin size={18} color="#94A3B8" style={{ marginRight: '10px' }} />
                  <select
                    value={registerCommune}
                    onChange={(e) => setRegisterCommune(e.target.value)}
                    style={{
                      border: 'none',
                      outline: 'none',
                      backgroundColor: 'transparent',
                      width: '100%',
                      fontSize: '14px',
                      color: '#0F172A',
                      cursor: 'pointer'
                    }}
                  >
                    {DAKAR_COMMUNES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Mot de passe */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '5px' }}>
                  Mot de passe
                </label>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: '#F8FAFC',
                    border: '1.5px solid #E2E8F0',
                    borderRadius: '14px',
                    padding: '0 14px',
                    height: '46px'
                  }}
                >
                  <Lock size={18} color="#94A3B8" style={{ marginRight: '10px' }} />
                  <input
                    type={showRegisterPassword ? 'text' : 'password'}
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    placeholder="Au moins 4 caractères"
                    required
                    style={{ border: 'none', outline: 'none', backgroundColor: 'transparent', width: '100%', fontSize: '14px', color: '#0F172A' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#94A3B8' }}
                  >
                    {showRegisterPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Bouton d'inscription */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  marginTop: '8px',
                  height: '48px',
                  borderRadius: '14px',
                  backgroundColor: '#005F56',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '15px',
                  fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 14px rgba(0, 95, 86, 0.28)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: loading ? 0.75 : 1
                }}
              >
                {loading ? 'Création du compte...' : 'Créer mon compte'}
              </button>
            </form>

            {/* Lien pour retourner à la connexion */}
            <div
              style={{
                marginTop: 'auto',
                paddingTop: '18px',
                textAlign: 'center',
                borderTop: '1px solid #F1F5F9'
              }}
            >
              <p style={{ margin: 0, fontSize: '14px', color: '#64748B' }}>
                Vous avez déjà un compte ?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setMode('login');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    color: '#005F56',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Se connecter
                </button>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
