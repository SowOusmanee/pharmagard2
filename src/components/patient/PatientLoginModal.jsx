import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { X, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { authService } from '../../services/authService';

export default function PatientLoginModal({ isOpen, originRef, onClose, onSuccess }) {
  const cardRef = useRef(null);
  const [isClosing, setIsClosing] = useState(false);
  const [vector, setVector] = useState({ x: -140, y: -260 });
  const [isMeasured, setIsMeasured] = useState(false);

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Registration fields
  const [registerName, setRegisterName] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Mesure le vecteur exact entre le centre du bouton profil et le centre de la carte au milieu de l'écran
  useLayoutEffect(() => {
    if (isOpen && cardRef.current) {
      let dx = -140;
      let dy = -260;
      if (originRef?.current) {
        const originRect = originRef.current.getBoundingClientRect();
        const cardRect = cardRef.current.getBoundingClientRect();

        const originCenterX = originRect.left + originRect.width / 2;
        const originCenterY = originRect.top + originRect.height / 2;

        const cardCenterX = cardRect.left + cardRect.width / 2;
        const cardCenterY = cardRect.top + cardRect.height / 2;

        dx = originCenterX - cardCenterX;
        dy = originCenterY - cardCenterY;
      }
      setVector({ x: Math.round(dx), y: Math.round(dy) });
      setIsMeasured(true);
    } else {
      setIsMeasured(false);
    }
  }, [isOpen, originRef]);

  // Réinitialiser les états lors de l'ouverture
  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
      setError('');
      setSuccess('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Fermeture animée fluide : la bulle au milieu quitte le centre et se rétracte vers le logo bonhomme
  const handleCloseAnimated = (e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault?.();
    }
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 280);
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setError('');

    const cleanInput = (email || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();
    const isAdmin =
      (cleanInput === 'admin' || cleanInput === 'admin@pharmagarde.sn' || cleanInput === 'admin@gmail.com') &&
      cleanPass === 'admin';

    if (!isAdmin) {
      if (!email.trim() || !email.includes('@')) {
        setError('Veuillez renseigner une adresse email valide ou identifiant admin.');
        return;
      }
      if (!password || password.length < 4) {
        setError('Le mot de passe doit comporter au moins 4 caractères.');
        return;
      }
    }

    setLoading(true);
    setTimeout(() => {
      const res = authService.loginWithEmail({ email, password });
      setLoading(false);
      if (res.success) {
        setSuccess(res.role === 'pharmacist' ? 'Connexion Pharmacie réussie !' : 'Connexion réussie !');
        setTimeout(() => {
          handleCloseAnimated();
          setTimeout(() => {
            onSuccess?.(res.user);
          }, 290);
        }, 500);
      } else {
        setError('Identifiants incorrects.');
      }
    }, 450);
  };

  const handleInstallPwa = () => {
    if (window.deferredInstallPrompt) {
      window.deferredInstallPrompt.prompt();
      window.deferredInstallPrompt.userChoice.then((choice) => {
        if (choice && choice.outcome === 'accepted') {
          setSuccess('Application installée avec succès !');
        }
        window.deferredInstallPrompt = null;
      });
    } else {
      alert(
        "Pour télécharger l'application sur votre écran Android :\n\n" +
        "1. Appuyez sur les 3 points verticaux (⋮) en haut à droite de Chrome.\n" +
        "2. Cliquez sur « Installer l'application » ou « Ajouter à l'écran d'accueil ».\n" +
        "3. L'icône PharmaGarde apparaîtra dans votre menu d'applications !"
      );
    }
  };

  const handleSocialLogin = (provider) => {
    setError('');
    setLoading(true);
    setTimeout(() => {
      let res;
      if (provider === 'google') res = authService.loginWithGoogle();
      else if (provider === 'apple') res = authService.loginWithApple();
      else {
        authService.session.user = {
          id: `user_${provider}_${Date.now()}`,
          name: `Utilisateur ${provider.charAt(0).toUpperCase() + provider.slice(1)}`,
          email: `user@${provider}.com`,
          role: 'patient',
          authProvider: provider
        };
        authService.session.role = 'patient';
        authService.saveSession();
        res = { success: true, user: authService.session.user };
      }
      setLoading(false);
      if (res && res.success) {
        setSuccess(`Connexion avec ${provider.charAt(0).toUpperCase() + provider.slice(1)} réussie !`);
        setTimeout(() => {
          handleCloseAnimated();
          setTimeout(() => {
            onSuccess?.(res.user);
          }, 290);
        }, 500);
      }
    }, 400);
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!registerName.trim() || registerName.trim().length < 2) {
      setError('Veuillez saisir votre nom complet.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Veuillez renseigner une adresse email valide.');
      return;
    }
    if (!password || password.length < 4) {
      setError('Le mot de passe doit comporter au moins 4 caractères.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const res = authService.registerPatient({
        fullName: registerName.trim(),
        email: email.trim(),
        password
      });
      setLoading(false);
      if (res.success) {
        setSuccess('Compte créé avec succès !');
        setTimeout(() => {
          handleCloseAnimated();
          setTimeout(() => {
            onSuccess?.(res.user);
          }, 290);
        }, 500);
      } else {
        setError('Impossible de créer le compte.');
      }
    }, 500);
  };

  return (
    <div
      onClick={handleCloseAnimated}
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: 'rgba(5, 25, 22, 0.48)',
        backdropFilter: 'blur(5px)',
        WebkitBackdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center', // Parfaitement au milieu verticalement
        justifyContent: 'center', // Parfaitement au milieu horizontalement
        zIndex: 2000,
        padding: '16px',
        overflowY: 'auto',
        boxSizing: 'border-box',
        cursor: 'pointer', // Clique n'importe où en dehors pour fermer
        animation: isClosing
          ? 'backdropFadeOut 0.28s ease-in forwards'
          : 'backdropFadeIn 0.28s ease-out forwards'
      }}
    >
      <style>{`
        @keyframes backdropFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes backdropFadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes expandFromAvatarToCenter {
          0% {
            opacity: 0.3;
            transform: translate3d(${vector.x}px, ${vector.y}px, 0) scale(0.06);
            border-radius: 50%;
          }
          40% {
            opacity: 1;
            border-radius: 46px;
          }
          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
            border-radius: 28px;
          }
        }
        @keyframes collapseFromCenterToAvatar {
          0% {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
            border-radius: 28px;
          }
          60% {
            opacity: 0.85;
            border-radius: 46px;
          }
          100% {
            opacity: 0;
            transform: translate3d(${vector.x}px, ${vector.y}px, 0) scale(0.06);
            border-radius: 50%;
          }
        }
        @keyframes modalContentFadeIn {
          0% { opacity: 0; }
          45% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes modalContentFadeOut {
          0% { opacity: 1; }
          25% { opacity: 0; }
          100% { opacity: 0; }
        }
        .social-circle-btn {
          width: 56px !important;
          height: 56px !important;
          min-width: 56px !important;
          min-height: 56px !important;
          border-radius: 50% !important;
          border: none !important;
          padding: 0 !important;
          margin: 0 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          cursor: pointer !important;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
          box-sizing: border-box !important;
          overflow: hidden !important;
          line-height: 0 !important;
        }
        .social-circle-btn:active {
          transform: scale(0.92);
        }
        .close-circle-btn {
          position: absolute;
          top: 14px;
          right: 14px;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #F1F5F9;
          border: 1px solid rgba(226, 232, 240, 0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #64748B;
          z-index: 100;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .close-circle-btn:hover {
          background: #E2E8F0;
          color: #0F172A;
          transform: scale(1.05);
        }
        .close-circle-btn:active {
          transform: scale(0.92);
        }
      `}</style>

      {/* Carte qui naît au logo bonhomme et se déploie au MILIEU de l'écran */}
      <div
        ref={cardRef}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '365px',
          backgroundColor: '#FFFFFF',
          borderRadius: '28px',
          padding: '52px 22px 22px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.22), 0 4px 16px rgba(0, 0, 0, 0.08)',
          animation: isClosing
            ? 'collapseFromCenterToAvatar 0.28s cubic-bezier(0.35, 0, 0.25, 1) forwards'
            : 'expandFromAvatarToCenter 0.34s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
          cursor: 'default'
        }}
      >
        {/* Bouton Fermer (Croix) ultra réactif et ergonomique */}
        <button
          type="button"
          onClick={handleCloseAnimated}
          onTouchEnd={handleCloseAnimated}
          className="close-circle-btn"
          aria-label="Fermer le menu"
          title="Fermer"
        >
          <X size={18} strokeWidth={2.4} />
        </button>

        {/* Contenu intérieur */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            animation: isClosing
              ? 'modalContentFadeOut 0.14s ease forwards'
              : 'modalContentFadeIn 0.32s ease forwards'
          }}
        >
          {/* Message d'erreur */}
          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#FEF2F2',
                color: '#DC2626',
                padding: '9px 12px',
                borderRadius: '12px',
                fontSize: '13px',
                marginBottom: '12px'
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Message de succès */}
          {success && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#ECFDF5',
                color: '#059669',
                padding: '9px 12px',
                borderRadius: '12px',
                fontSize: '13.5px',
                fontWeight: 600,
                marginBottom: '12px'
              }}
            >
              <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
              <span>{success}</span>
            </div>
          )}

          {mode === 'login' ? (
            <div>
              {/* Formulaire de connexion (Email + Mot de passe) */}
              <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Champ Email */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13.5px',
                      fontWeight: 600,
                      color: '#475569',
                      marginBottom: '7px',
                      textAlign: 'left'
                    }}
                  >
                    Email ou identifiant
                  </label>
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email ou identifiant (ex: admin)"
                    autoComplete="username"
                    required
                    style={{
                      width: '100%',
                      height: '46px',
                      borderRadius: '12px',
                      border: '1.5px solid #CBD5E1',
                      backgroundColor: '#F8FAFC',
                      padding: '0 14px',
                      fontSize: '14.5px',
                      color: '#0F172A',
                      boxSizing: 'border-box',
                      outline: 'none',
                      transition: 'border-color 0.15s ease'
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#005F56')}
                    onBlur={(e) => (e.target.style.borderColor = '#CBD5E1')}
                  />
                </div>

                {/* Champ Mot de passe */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13.5px',
                      fontWeight: 600,
                      color: '#475569',
                      marginBottom: '7px',
                      textAlign: 'left'
                    }}
                  >
                    Mot de passe
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      required
                      style={{
                        width: '100%',
                        height: '46px',
                        borderRadius: '12px',
                        border: '1.5px solid #CBD5E1',
                        backgroundColor: '#F8FAFC',
                        padding: '0 44px 0 14px',
                        fontSize: '14.5px',
                        color: '#0F172A',
                        boxSizing: 'border-box',
                        outline: 'none',
                        transition: 'border-color 0.15s ease'
                      }}
                      onFocus={(e) => (e.target.style.borderColor = '#005F56')}
                      onBlur={(e) => (e.target.style.borderColor = '#CBD5E1')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                        color: '#94A3B8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    >
                      {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                    </button>
                  </div>
                </div>

                {/* Mot de passe oublié ? */}
                <div style={{ textAlign: 'right', marginTop: '-4px' }}>
                  <button
                    type="button"
                    onClick={() => setError('Option de réinitialisation envoyée par email.')}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      color: '#4A6984',
                      fontSize: '13px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      textUnderlineOffset: '2px'
                    }}
                  >
                    Mot de passe oublié ?
                  </button>
                </div>

                {/* Bouton Log In adapté en VERT */}
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    height: '48px',
                    borderRadius: '12px',
                    backgroundColor: '#005F56',
                    color: '#FFFFFF',
                    border: 'none',
                    fontSize: '15.5px',
                    fontWeight: 700,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 14px rgba(0, 95, 86, 0.32)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    letterSpacing: '0.2px',
                    marginTop: '4px',
                    transition: 'background-color 0.15s ease, transform 0.1s ease',
                    opacity: loading ? 0.75 : 1
                  }}
                  onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
                  onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  {loading ? 'Connexion...' : 'Se connecter'}
                </button>
              </form>

              {/* Séparateur en tirets comme la photo */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  margin: '18px 0 14px',
                  gap: '10px'
                }}
              >
                <div style={{ flex: 1, borderTop: '1.5px dashed #CBD5E1' }} />
                <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 700, letterSpacing: '0.8px' }}>
                  OU
                </span>
                <div style={{ flex: 1, borderTop: '1.5px dashed #CBD5E1' }} />
              </div>

              {/* Texte social media en français */}
              <p
                style={{
                  fontSize: '12.5px',
                  color: '#475569',
                  margin: '0 0 14px 0',
                  lineHeight: '1.4',
                  textAlign: 'left'
                }}
              >
                Connectez-vous avec votre compte social :
              </p>

              {/* 3 Boutons sociaux ronds pastel : Google, Facebook, Apple */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-around',
                  alignItems: 'center',
                  width: '100%',
                  maxWidth: '280px',
                  margin: '0 auto 18px',
                  padding: '0 6px'
                }}
              >
                {/* Google */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => handleSocialLogin('google')}
                    className="social-circle-btn"
                    style={{
                      backgroundColor: '#FEEAE7',
                      padding: 0,
                      margin: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Google"
                    aria-label="Google"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" style={{ display: 'block', margin: '0 auto' }}>
                      <path
                        fill="#EA4335"
                        d="M21.35 11.1H12v2.8h5.35c-.45 2.25-2.3 3.9-5.35 3.9-3.2 0-5.8-2.6-5.8-5.8s2.6-5.8 5.8-5.8c1.45 0 2.75.55 3.75 1.45l2.1-2.1C17.9 3.8 15.15 2.8 12 2.8 6.9 2.8 2.8 6.9 2.8 12s4.1 9.2 9.2 9.2c5.3 0 8.8-3.7 8.8-8.95 0-.7-.05-1.4-.15-2.05z"
                      />
                    </svg>
                  </button>
                  <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#EA4335' }}>Google</span>
                </div>

                {/* Facebook */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => handleSocialLogin('facebook')}
                    className="social-circle-btn"
                    style={{
                      backgroundColor: '#EDF2F9',
                      padding: 0,
                      margin: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Facebook"
                    aria-label="Facebook"
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="#1877F2" style={{ display: 'block', margin: '0 auto' }}>
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </button>
                  <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#1877F2' }}>Facebook</span>
                </div>

                {/* Apple */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => handleSocialLogin('apple')}
                    className="social-circle-btn"
                    style={{
                      backgroundColor: '#EBECEE',
                      padding: 0,
                      margin: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Apple"
                    aria-label="Apple"
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="#111827" style={{ display: 'block', margin: '0 auto' }}>
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.38c.62-.75 1.04-1.8 0.93-2.85-.9.04-1.99.6-2.64 1.36-.58.67-1.09 1.74-.95 2.77 1 .08 2.04-.53 2.66-1.28z" />
                    </svg>
                  </button>
                  <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#111827' }}>Apple</span>
                </div>
              </div>

              {/* Option Créer un compte */}
              <div style={{ textAlign: 'center', paddingTop: '10px', borderTop: '1px solid #F1F5F9' }}>
                <p style={{ margin: 0, fontSize: '13.5px', color: '#64748B' }}>
                  Pas encore de compte ?{' '}
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
                      fontSize: '13.5px'
                    }}
                  >
                    Créer un compte
                  </button>
                </p>
              </div>

              {/* Bouton direct pour installer l'application sur Android */}
              <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid #F1F5F9' }}>
                <button
                  type="button"
                  onClick={handleInstallPwa}
                  style={{
                    width: '100%',
                    padding: '11px 12px',
                    borderRadius: '12px',
                    backgroundColor: '#E6FAF5',
                    border: '1.5px solid #95ECD8',
                    color: '#005F56',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  📲 Télécharger / Installer l'app
                </button>
              </div>
            </div>
          ) : (
            /* Formulaire de Création de compte */
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgba(241, 245, 249, 0.85) 0%, rgba(226, 232, 240, 0.55) 100%)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255, 255, 255, 0.9)',
                    padding: 0,
                    cursor: 'pointer',
                    color: '#005F56',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04), inset 0 1px 1.5px rgba(255, 255, 255, 0.95)',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                  onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.92)')}
                  onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                  aria-label="Retour"
                  title="Retour"
                >
                  <ArrowLeft size={17} strokeWidth={2.4} />
                </button>
                <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#0F172A' }}>
                  Créer un compte
                </h2>
              </div>

              <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Champ Nom complet */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13.5px',
                      fontWeight: 600,
                      color: '#475569',
                      marginBottom: '7px',
                      textAlign: 'left'
                    }}
                  >
                    Nom complet
                  </label>
                  <input
                    type="text"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    placeholder="Ex: Fatou Ndiaye"
                    required
                    style={{
                      width: '100%',
                      height: '46px',
                      borderRadius: '12px',
                      border: '1.5px solid #CBD5E1',
                      backgroundColor: '#F8FAFC',
                      padding: '0 14px',
                      fontSize: '14.5px',
                      color: '#0F172A',
                      boxSizing: 'border-box',
                      outline: 'none',
                      transition: 'border-color 0.15s ease'
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#005F56')}
                    onBlur={(e) => (e.target.style.borderColor = '#CBD5E1')}
                  />
                </div>

                {/* Champ Email */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13.5px',
                      fontWeight: 600,
                      color: '#475569',
                      marginBottom: '7px',
                      textAlign: 'left'
                    }}
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="fatou@exemple.com"
                    autoComplete="email"
                    required
                    style={{
                      width: '100%',
                      height: '46px',
                      borderRadius: '12px',
                      border: '1.5px solid #CBD5E1',
                      backgroundColor: '#F8FAFC',
                      padding: '0 14px',
                      fontSize: '14.5px',
                      color: '#0F172A',
                      boxSizing: 'border-box',
                      outline: 'none',
                      transition: 'border-color 0.15s ease'
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#005F56')}
                    onBlur={(e) => (e.target.style.borderColor = '#CBD5E1')}
                  />
                </div>

                {/* Champ Mot de passe */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13.5px',
                      fontWeight: 600,
                      color: '#475569',
                      marginBottom: '7px',
                      textAlign: 'left'
                    }}
                  >
                    Mot de passe
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Au moins 4 caractères"
                      autoComplete="new-password"
                      required
                      style={{
                        width: '100%',
                        height: '46px',
                        borderRadius: '12px',
                        border: '1.5px solid #CBD5E1',
                        backgroundColor: '#F8FAFC',
                        padding: '0 44px 0 14px',
                        fontSize: '14.5px',
                        color: '#0F172A',
                        boxSizing: 'border-box',
                        outline: 'none',
                        transition: 'border-color 0.15s ease'
                      }}
                      onFocus={(e) => (e.target.style.borderColor = '#005F56')}
                      onBlur={(e) => (e.target.style.borderColor = '#CBD5E1')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                        color: '#94A3B8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    >
                      {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                    </button>
                  </div>
                </div>

                {/* Bouton de validation Créer mon compte */}
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    height: '48px',
                    borderRadius: '12px',
                    backgroundColor: '#005F56',
                    color: '#FFFFFF',
                    border: 'none',
                    fontSize: '15.5px',
                    fontWeight: 700,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 14px rgba(0, 95, 86, 0.32)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    letterSpacing: '0.2px',
                    marginTop: '6px',
                    transition: 'background-color 0.15s ease, transform 0.1s ease',
                    opacity: loading ? 0.75 : 1
                  }}
                  onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
                  onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  {loading ? 'Création en cours...' : 'Créer mon compte'}
                </button>
              </form>

              <div style={{ textAlign: 'center', marginTop: '16px', paddingTop: '10px', borderTop: '1px solid #F1F5F9' }}>
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#005F56',
                    fontSize: '13.5px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Déjà inscrit ? Se connecter
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
