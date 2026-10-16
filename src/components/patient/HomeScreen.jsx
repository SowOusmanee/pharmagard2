import React, { useRef, useState, useEffect } from 'react';
import { Camera, ArrowLeft, Upload, Plus, ArrowUp, X, CheckCircle2, RefreshCw, User } from 'lucide-react';
import { SAMPLE_PRESCRIPTIONS } from '../../data/mockData';
import PatientLoginModal from './PatientLoginModal';

export default function HomeScreen({ onStartScan, onNavigateToPharmacies, onSearchText, autoOpenCamera, onCameraClosed, isScanning, scanSuccess, scanStatusText, isExiting, onBack, onOpenAccount, onOpenAccountSuccess }) {
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const searchInputRef = useRef(null);
  const inlineVideoRef = useRef(null);
  const streamRef = useRef(null);
  const profileBtnRef = useRef(null);

  const [showScanModal, setShowScanModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isInlineCameraOpen, setIsInlineCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [isFlashing, setIsFlashing] = useState(false);
  const [facingMode, setFacingMode] = useState('environment');

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (inlineVideoRef.current) {
      inlineVideoRef.current.srcObject = null;
    }
  };

  const startCameraStream = async (mode = 'environment') => {
    stopCameraStream();
    setCameraError(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: mode } },
          audio: false
        });
        streamRef.current = stream;
        if (inlineVideoRef.current) {
          inlineVideoRef.current.srcObject = stream;
          inlineVideoRef.current.play?.().catch(() => {});
        }
      } else {
        setCameraError("Caméra non supportée par votre navigateur.");
      }
    } catch (err) {
      console.warn("Camera stream error:", err);
      setCameraError("Impossible d'accéder à la caméra. Vérifiez les autorisations.");
    }
  };

  const openInlineCamera = () => {
    setShowScanModal(false);
    setIsInlineCameraOpen(true);
    startCameraStream(facingMode);
  };

  const closeInlineCamera = () => {
    stopCameraStream();
    setIsInlineCameraOpen(false);
    onCameraClosed?.();
  };

  useEffect(() => {
    if (autoOpenCamera) {
      openInlineCamera();
    }
  }, [autoOpenCamera]);

  const flipCamera = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCameraStream(nextMode);
  };

  const handleInlineCapture = () => {
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 180);

    if (inlineVideoRef.current && streamRef.current) {
      try {
        const video = inlineVideoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

        stopCameraStream();
        setIsInlineCameraOpen(false);
        onCameraClosed?.();

        onStartScan?.({
          dataUrl,
          type: 'camera',
          preset: SAMPLE_PRESCRIPTIONS[0]
        });
        return;
      } catch (e) {
        console.error("Capture error:", e);
      }
    }

    // Fallback: use demo preset
    stopCameraStream();
    setIsInlineCameraOpen(false);
    onCameraClosed?.();
    onStartScan?.({
      dataUrl: null,
      type: 'camera',
      preset: SAMPLE_PRESCRIPTIONS[0]
    });
  };

  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  const handleFormSubmit = (e) => {
    e?.preventDefault();
    if (searchQuery.trim()) {
      onSearchText?.(searchQuery.trim());
    }
  };

  const handleFileChange = (e, source = 'upload') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onStartScan?.({
          dataUrl: event.target?.result,
          type: source,
          preset: SAMPLE_PRESCRIPTIONS[0]
        });
      };
      reader.readAsDataURL(file);
    }
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleCameraOption = () => {
    setShowScanModal(false);
    openInlineCamera();
  };

  const handleUploadOption = () => {
    setShowScanModal(false);
    fileInputRef.current?.click();
  };



  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '100%',
        minHeight: '100%',
        maxHeight: '100%',
        width: '100%',
        boxSizing: 'border-box',
        padding: 'max(14px, env(safe-area-inset-top, 14px)) 20px max(18px, env(safe-area-inset-bottom, 18px))',
        textAlign: 'center',
        background: 'radial-gradient(ellipse 100% 55% at 50% 100%, rgba(92, 225, 182, 0.45) 0%, rgba(149, 236, 216, 0.22) 40%, rgba(255, 255, 255, 0) 80%), #FFFFFF',
        overflow: 'hidden',
        opacity: isExiting ? 0 : 1,
        transform: isExiting ? 'scale(0.97) translateY(-10px)' : 'scale(1) translateY(0)',
        transition: 'opacity 0.24s cubic-bezier(0.16, 1, 0.3, 1), transform 0.24s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      {/* Top Bar: Button on the LEFT (Person / Créer compte) and button on the RIGHT (Pharmacies) */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '44px' }}>
        {/* Left button: Person logo avec effet glassmorphism style Apple */}
        <button
          ref={profileBtnRef}
          type="button"
          onClick={() => {
            setShowLoginModal(true);
          }}
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.78) 0%, rgba(255, 255, 255, 0.48) 100%)',
            backdropFilter: 'blur(20px) saturate(190%)',
            WebkitBackdropFilter: 'blur(20px) saturate(190%)',
            border: '1px solid rgba(255, 255, 255, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 6px 18px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.03), inset 0 1px 1.5px rgba(255, 255, 255, 0.95)',
            color: '#005F56',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.92)')}
          onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.65) 100%)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.09), inset 0 1px 2px rgba(255, 255, 255, 1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.78) 0%, rgba(255, 255, 255, 0.48) 100%)';
            e.currentTarget.style.boxShadow = '0 6px 18px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.03), inset 0 1px 1.5px rgba(255, 255, 255, 0.95)';
          }}
          aria-label="Créer un compte / Mon profil"
          title="Créer un compte / Mon profil"
        >
          <User size={21} strokeWidth={2.3} />
        </button>

        {/* Right button: Arrow pointing to the left for pharmacies avec effet glassmorphism style Apple */}
        <button
          type="button"
          onClick={() => {
            if (isInlineCameraOpen) {
              closeInlineCamera();
            } else {
              onNavigateToPharmacies?.();
            }
          }}
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.78) 0%, rgba(255, 255, 255, 0.48) 100%)',
            backdropFilter: 'blur(20px) saturate(190%)',
            WebkitBackdropFilter: 'blur(20px) saturate(190%)',
            border: '1px solid rgba(255, 255, 255, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 6px 18px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.03), inset 0 1px 1.5px rgba(255, 255, 255, 0.95)',
            color: '#005F56',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.92)')}
          onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.65) 100%)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.09), inset 0 1px 2px rgba(255, 255, 255, 1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.78) 0%, rgba(255, 255, 255, 0.48) 100%)';
            e.currentTarget.style.boxShadow = '0 6px 18px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.03), inset 0 1px 1.5px rgba(255, 255, 255, 0.95)';
          }}
          aria-label="Voir les pharmacies proches"
          title="Pharmacies proches"
        >
          <ArrowLeft size={21} strokeWidth={2.4} />
        </button>
      </div>

      <style>{`
        @keyframes modalSlideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes inlineCameraEnter {
          0% {
            opacity: 0;
            transform: scale(0.93) translateY(18px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes inlineCameraSlideUp {
          0% {
            opacity: 0;
            transform: translateY(50px) scale(0.96);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes pulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 10px 30px rgba(0, 40, 35, 0.25); }
          50% { box-shadow: 0 10px 35px rgba(92, 225, 182, 0.35); }
        }
        @keyframes letterBounceIn {
          0% {
            opacity: 0;
            transform: translateY(-32px) scale(0.6) rotate(-3deg);
          }
          60% {
            opacity: 1;
            transform: translateY(6px) scale(1.12) rotate(1deg);
          }
          80% {
            transform: translateY(-2px) scale(0.97);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1) rotate(0deg);
          }
        }
        @keyframes crossPopIn {
          0% {
            opacity: 0;
            transform: scale(0.3) rotate(-15deg);
          }
          65% {
            opacity: 1;
            transform: scale(1.18) rotate(3deg);
          }
          100% {
            opacity: 1;
            transform: scale(1) rotate(0deg);
          }
        }
        @keyframes scaleBounce {
          0% {
            transform: scale(0.92);
          }
          60% {
            transform: scale(1.05);
          }
          100% {
            transform: scale(1);
          }
        }
      `}</style>

      {/* Hidden inputs: Camera and File Upload */}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={cameraInputRef}
        onChange={(e) => handleFileChange(e, 'camera')}
        style={{ display: 'none' }}
      />
      <input
        type="file"
        accept="image/*,application/pdf"
        ref={fileInputRef}
        onChange={(e) => handleFileChange(e, 'upload')}
        style={{ display: 'none' }}
      />

      {/* CENTER: Pharmacy Cross & Title (Always rendered in background) */}
          <div
            style={{
              flex: 1,
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '10px 0'
            }}
          >
            {/* Pure green pharmacy cross */}
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              style={{
                marginBottom: '20px',
                display: 'block',
                animation: 'crossPopIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both'
              }}
              aria-hidden="true"
            >
              <rect x="9" y="2" width="6" height="20" rx="2.5" fill="var(--color-primary, #005F56)" />
              <rect x="2" y="9" width="20" height="6" rx="2.5" fill="var(--color-primary, #005F56)" />
            </svg>

            {/* Hero Title with bouncing letters */}
            <h1
              style={{
                fontSize: '27px',
                fontWeight: 600,
                color: 'var(--color-primary-dark, #004740)',
                lineHeight: 1.3,
                letterSpacing: '-0.02em',
                maxWidth: '310px',
                margin: 0
              }}
            >
              {(() => {
                const words = "Trouvez votre médicament au plus proche".split(' ');
                let globalCharIndex = 0;
                return words.map((word, wIdx) => (
                  <span
                    key={wIdx}
                    style={{
                      display: 'inline-block',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {word.split('').map((char, cIdx) => {
                      const delay = 0.12 + globalCharIndex * 0.035;
                      globalCharIndex++;
                      return (
                        <span
                          key={cIdx}
                          style={{
                            display: 'inline-block',
                            animation: `letterBounceIn 0.65s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}s both`
                          }}
                        >
                          {char}
                        </span>
                      );
                    })}
                    {wIdx < words.length - 1 && (
                      <span style={{ display: 'inline-block' }}>&nbsp;</span>
                    )}
                  </span>
                ));
              })()}
            </h1>
          </div>

          <div style={{ width: '100%', display: 'flex', justifyContent: 'center', zIndex: 20, paddingBottom: '4px' }}>
            {isScanning ? (
              <div
                style={{
                  width: '100%',
                  maxWidth: '375px',
                  backgroundColor: scanSuccess ? '#004740' : '#0F2421',
                  borderRadius: '999px',
                  padding: '12px 22px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  boxShadow: scanSuccess
                    ? '0 10px 30px rgba(0, 71, 64, 0.4), 0 2px 8px rgba(0, 0, 0, 0.1)'
                    : '0 10px 30px rgba(0, 40, 35, 0.25), 0 2px 8px rgba(0, 0, 0, 0.1)',
                  border: scanSuccess
                    ? '1.5px solid #5CE1B6'
                    : '1px solid rgba(92, 225, 182, 0.4)',
                  transition: 'background-color 0.3s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s ease, box-shadow 0.3s ease',
                  animation: scanSuccess ? 'scaleBounce 0.35s ease-out' : 'pulseGlow 2s infinite ease-in-out'
                }}
              >
                {scanSuccess ? (
                  <CheckCircle2
                    size={20}
                    color="#5CE1B6"
                    style={{
                      flexShrink: 0,
                      animation: 'scaleBounce 0.35s ease-out'
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '18px',
                      height: '18px',
                      border: '2.5px solid rgba(92, 225, 182, 0.2)',
                      borderTopColor: '#5CE1B6',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                      flexShrink: 0
                    }}
                  />
                )}
                <span
                  style={{
                    color: '#FFFFFF',
                    fontSize: '15px',
                    fontWeight: 600,
                    letterSpacing: '0.2px',
                    transition: 'opacity 0.2s ease'
                  }}
                >
                  {scanSuccess ? (scanStatusText || 'Pharmacie trouvée !') : (scanStatusText || 'Scan en cours...')}
                </span>
              </div>
            ) : (
              <div
                style={{
                  width: '100%',
                  maxWidth: '375px',
                  backgroundColor: '#0F2421',
                  borderRadius: '999px',
                  padding: '6px 7px 6px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                  boxShadow: '0 10px 30px rgba(0, 40, 35, 0.25), 0 2px 8px rgba(0, 0, 0, 0.1)',
                  border: '1px solid rgba(149, 236, 216, 0.25)',
                  transition: 'border 0.2s ease, box-shadow 0.2s ease'
                }}
              >
                {/* Left: Plus button (Photo / File scan modal) */}
                <button
                  type="button"
                  onClick={() => setShowScanModal(true)}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#5CE1B6',
                    flexShrink: 0,
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease'
                  }}
                  title="Prendre une photo ou importer une ordonnance"
                  aria-label="Ajouter une photo ou fichier"
                >
                  <Plus size={19} strokeWidth={2.5} />
                </button>

                {/* Middle: Interactive Text input */}
                <form
                  onSubmit={handleFormSubmit}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    minWidth: 0,
                    margin: 0
                  }}
                >
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher un médicament..."
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: '#FFFFFF',
                      fontSize: '15px',
                      fontWeight: 500,
                      padding: '6px 2px',
                      fontFamily: 'inherit'
                    }}
                  />
                </form>

                {/* Right Action button: Send when text is typed, or Camera when empty */}
                <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                  {searchQuery.trim().length > 0 ? (
                    <button
                      type="button"
                      onClick={handleFormSubmit}
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        backgroundColor: '#5CE1B6',
                        color: '#004740',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(92, 225, 182, 0.35)',
                        transition: 'transform 0.15s ease'
                      }}
                      title="Lancer la recherche"
                      aria-label="Envoyer la recherche"
                    >
                      <ArrowUp size={20} strokeWidth={2.5} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={openInlineCamera}
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        backgroundColor: '#5CE1B6',
                        color: '#004740',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(92, 225, 182, 0.35)',
                        transition: 'transform 0.15s ease'
                      }}
                      title="Ouvrir la caméra intégrée"
                      aria-label="Scanner avec la caméra intégrée"
                    >
                      <Camera size={19} strokeWidth={2.3} />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

      {/* CAMERA OVERLAY LAYER: Appears as an overlay layer on top so background & search bar remain visible */}
      {isInlineCameraOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeInlineCamera();
            }
          }}
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 60,
            backgroundColor: 'rgba(0, 20, 16, 0.40)',
            backdropFilter: 'blur(3px)',
            WebkitBackdropFilter: 'blur(3px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px 16px 20px',
            animation: 'fadeIn 0.22s ease-out'
          }}
        >
          {/* PURE INLINE CAMERA FRAME (Rounded camera viewport + bottom controls inspired by photo) */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '360px',
              height: '460px',
              maxHeight: '68vh',
              borderRadius: '28px',
              overflow: 'hidden',
              backgroundColor: '#000000',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.12)',
              animation: 'inlineCameraSlideUp 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end'
            }}
          >
                        {/* Live Video Preview (edge to edge inside the frame) */}
            <video
              ref={inlineVideoRef}
              autoPlay
              playsInline
              muted
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />

            {/* Flash animation on shutter */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: '#FFFFFF',
                opacity: isFlashing ? 0.95 : 0,
                pointerEvents: 'none',
                transition: 'opacity 0.15s ease-out',
                zIndex: 30
              }}
            />

            {/* Bottom Controls Bar: Close (X) | Shutter Capture | Flip Camera (RefreshCw) */}
            <div
              style={{
                position: 'relative',
                zIndex: 20,
                padding: '0 28px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                boxSizing: 'border-box'
              }}
            >
              {/* Left: Close Button (X in frosted circular badge) */}
              <button
                type="button"
                onClick={closeInlineCamera}
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.28)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255, 255, 255, 0.35)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
                  transition: 'transform 0.15s ease, background-color 0.15s ease'
                }}
                onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.92)')}
                onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                onTouchStart={(e) => (e.currentTarget.style.transform = 'scale(0.92)')}
                onTouchEnd={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                title="Fermer la caméra"
                aria-label="Fermer"
              >
                <X size={24} strokeWidth={2.4} />
              </button>

              {/* Center: Double-ring Shutter Capture Button */}
              <button
                type="button"
                onClick={handleInlineCapture}
                style={{
                  width: '74px',
                  height: '74px',
                  borderRadius: '50%',
                  backgroundColor: 'transparent',
                  border: '4px solid rgba(255, 255, 255, 0.95)',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'transform 0.12s ease',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.35)'
                }}
                onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.92)')}
                onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                onTouchStart={(e) => (e.currentTarget.style.transform = 'scale(0.92)')}
                onTouchEnd={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                title="Prendre la photo"
                aria-label="Prendre la photo"
              >
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    backgroundColor: '#FFFFFF',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
                  }}
                />
              </button>

              {/* Right: Flip Camera Button (Circular arrows in frosted circular badge) */}
              <button
                type="button"
                onClick={flipCamera}
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.28)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255, 255, 255, 0.35)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
                  transition: 'transform 0.15s ease, background-color 0.15s ease'
                }}
                onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.92)')}
                onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                onTouchStart={(e) => (e.currentTarget.style.transform = 'scale(0.92)')}
                onTouchEnd={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                title="Changer de caméra"
                aria-label="Changer de caméra"
              >
                <RefreshCw size={22} strokeWidth={2.4} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal proposing the 2 options without extra text */}
      {showScanModal && (
        <div
          onClick={() => setShowScanModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 30, 26, 0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            zIndex: 1000,
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '420px',
              backgroundColor: '#FFFFFF',
              borderRadius: '24px 24px 0 0',
              padding: '20px 20px 28px',
              boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.2)',
              animation: 'modalSlideUp 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            {/* Grab handle */}
            <div
              style={{
                width: '36px',
                height: '4px',
                backgroundColor: '#CBD5E1',
                borderRadius: '2px',
                margin: '0 auto 8px'
              }}
            />

            {/* Option 1: Direct camera scan */}
            <button
              onClick={handleCameraOption}
              style={{
                width: '100%',
                padding: '16px 18px',
                backgroundColor: '#F0FAF7',
                border: '1.5px solid #C8ECE3',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#E2F7F1';
                e.currentTarget.style.borderColor = '#5CE1B6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#F0FAF7';
                e.currentTarget.style.borderColor = '#C8ECE3';
              }}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  backgroundColor: '#5CE1B6',
                  color: '#004740',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Camera size={22} strokeWidth={2.2} />
              </div>
              <span
                style={{
                  fontSize: '15px',
                  fontWeight: 700,
                  color: '#004740'
                }}
              >
                Scanner avec l'appareil photo
              </span>
            </button>

            {/* Option 2: Upload file */}
            <button
              onClick={handleUploadOption}
              style={{
                width: '100%',
                padding: '16px 18px',
                backgroundColor: '#F8FAFC',
                border: '1.5px solid #E2E8F0',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#F1F5F9';
                e.currentTarget.style.borderColor = '#CBD5E1';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#F8FAFC';
                e.currentTarget.style.borderColor = '#E2E8F0';
              }}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  backgroundColor: '#E2E8F0',
                  color: '#1E293B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Upload size={22} strokeWidth={2.2} />
              </div>
              <span
                style={{
                  fontSize: '15px',
                  fontWeight: 700,
                  color: '#1E293B'
                }}
              >
                Téléverser un fichier
              </span>
            </button>

            {/* Cancel Button */}
            <button
              onClick={() => setShowScanModal(false)}
              style={{
                width: '100%',
                marginTop: '4px',
                padding: '12px',
                background: 'transparent',
                border: 'none',
                color: '#64748B',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                borderRadius: '10px'
              }}
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Floating Login Menu Modal */}
      <PatientLoginModal
        isOpen={showLoginModal}
        originRef={profileBtnRef}
        onClose={() => setShowLoginModal(false)}
        onSuccess={(user) => {
          setShowLoginModal(false);
          onOpenAccountSuccess?.(user);
        }}
      />
    </div>
  );
}
