import React, { useState, useRef, useEffect } from 'react';
import { Camera, Image, RefreshCw, Check, ArrowLeft, Upload } from 'lucide-react';
import { SAMPLE_PRESCRIPTIONS } from '../../data/mockData';

export default function ScanScreen({ onBack, onConfirmPhoto }) {
  const [capturedImage, setCapturedImage] = useState(null);
  const [selectedPreset, setSelectedPreset] = useState(SAMPLE_PRESCRIPTIONS[0]);
  const [isLiveCameraActive, setIsLiveCameraActive] = useState(false);
  const [showDemoPresets, setShowDemoPresets] = useState(false);

  const videoRef = useRef(null);
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  // Initialize live camera if supported (localhost or HTTPS)
  useEffect(() => {
    let stream = null;
    async function startCamera() {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' }
          });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            setIsLiveCameraActive(true);
          }
        }
      } catch (err) {
        setIsLiveCameraActive(false);
      }
    }

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleCapture = () => {
    if (isLiveCameraActive && videoRef.current) {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth || 1280;
        canvas.height = videoRef.current.videoHeight || 720;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage({ dataUrl, type: 'real', isRealPhoto: true });
        return;
      } catch {
        // Fallback to native camera input
      }
    }

    // On mobile or when live camera is unavailable, trigger native device camera
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCapturedImage({
          dataUrl: event.target?.result,
          type: 'real',
          isRealPhoto: true
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onConfirmPhoto(capturedImage);
    } else {
      onConfirmPhoto({
        dataUrl: null,
        type: 'preset',
        preset: selectedPreset,
        isRealPhoto: false
      });
    }
  };

  const handleSelectPreset = (preset) => {
    setSelectedPreset(preset);
    setCapturedImage({
      dataUrl: null,
      type: 'preset',
      preset,
      isRealPhoto: false
    });
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: '100vh',
        background: '#041715',
        color: '#FFFFFF'
      }}
    >
      {/* Hidden file inputs: one for native camera, one for photo gallery */}
      <input
        type="file"
        ref={cameraInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
      />
      <input
        type="file"
        ref={galleryInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        style={{ display: 'none' }}
      />

      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid #113833'
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: 'rgba(255,255,255,0.1)',
            color: '#FFFFFF',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          <ArrowLeft size={20} />
        </button>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-mint)' }}>
            Scanner l'ordonnance
          </div>
          <div style={{ fontSize: '11px', color: '#94A3B8' }}>
            Prenez en photo votre ordonnance médicale
          </div>
        </div>

        <button
          onClick={() => galleryInputRef.current?.click()}
          style={{
            background: 'rgba(255,255,255,0.1)',
            color: '#FFFFFF',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            cursor: 'pointer'
          }}
          title="Importer depuis la galerie"
        >
          <Upload size={18} />
        </button>
      </div>

      {/* Main Viewfinder Frame */}
      <div
        style={{
          flex: 1,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '360px',
            height: '420px',
            borderRadius: '20px',
            border: '2px solid rgba(149, 236, 216, 0.6)',
            position: 'relative',
            overflow: 'hidden',
            backgroundColor: '#0c2623',
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.65)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {/* Corner brackets */}
          <div style={{ position: 'absolute', top: 10, left: 10, width: 24, height: 24, borderTop: '4px solid var(--color-mint)', borderLeft: '4px solid var(--color-mint)', zIndex: 10 }} />
          <div style={{ position: 'absolute', top: 10, right: 10, width: 24, height: 24, borderTop: '4px solid var(--color-mint)', borderRight: '4px solid var(--color-mint)', zIndex: 10 }} />
          <div style={{ position: 'absolute', bottom: 10, left: 10, width: 24, height: 24, borderBottom: '4px solid var(--color-mint)', borderLeft: '4px solid var(--color-mint)', zIndex: 10 }} />
          <div style={{ position: 'absolute', bottom: 10, right: 10, width: 24, height: 24, borderBottom: '4px solid var(--color-mint)', borderRight: '4px solid var(--color-mint)', zIndex: 10 }} />

          {/* 1. Captured Photo Preview (Real Image) */}
          {capturedImage?.dataUrl ? (
            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
              <img
                src={capturedImage.dataUrl}
                alt="Ordonnance capturée"
                style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: '14px',
                  left: '14px',
                  background: 'var(--color-primary)',
                  color: 'white',
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '4px 10px',
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <Check size={13} color="var(--color-mint)" /> Photo prête
              </div>
            </div>
          ) : capturedImage?.type === 'preset' ? (
            /* 2. Demo Preset selected explicitly */
            <div
              style={{
                width: '100%',
                height: '100%',
                background: '#FFFFFF',
                color: '#0A2521',
                padding: '24px 20px',
                display: 'flex',
                flexDirection: 'column',
                fontFamily: 'serif'
              }}
            >
              <div style={{ borderBottom: '2px solid #005F56', paddingBottom: '8px', marginBottom: '14px' }}>
                <div style={{ fontSize: '13px', fontWeight: 900, color: '#005F56' }}>
                  EXEMPLE DE DÉMONSTRATION
                </div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#334155' }}>
                  {capturedImage.preset?.doctor}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                {capturedImage.preset?.medicines.map((m, idx) => (
                  <div key={idx} style={{ padding: '6px 8px', background: '#F8FAFC', borderRadius: '6px', borderLeft: '3px solid #005F56' }}>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A' }}>
                      {idx + 1}. {m.name} {m.dosage}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : isLiveCameraActive ? (
            /* 3. Live Camera View */
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            /* 4. Standby Viewfinder with clear action buttons for mobile */
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
                textAlign: 'center',
                gap: '16px'
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'rgba(149, 236, 216, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-mint)'
                }}
              >
                <Camera size={32} />
              </div>

              <div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF', marginBottom: '4px' }}>
                  Prenez une photo nette
                </div>
                <div style={{ fontSize: '12px', color: '#94A3B8', maxWidth: '240px' }}>
                  Cadrez bien les lignes de médicaments et assurez-vous d'un bon éclairage.
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', maxWidth: '240px' }}>
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  style={{
                    background: 'var(--color-mint)',
                    color: '#041715',
                    border: 'none',
                    borderRadius: '999px',
                    padding: '12px 16px',
                    fontSize: '13px',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer'
                  }}
                >
                  <Camera size={18} /> Prendre la photo
                </button>

                <button
                  onClick={() => galleryInputRef.current?.click()}
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    color: '#FFFFFF',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '999px',
                    padding: '10px 16px',
                    fontSize: '13px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer'
                  }}
                >
                  <Image size={18} /> Choisir une image
                </button>
              </div>
            </div>
          )}

          {/* Animated Scanning Laser Line when live or standby */}
          {!capturedImage && (
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                height: '2px',
                background: 'var(--color-mint)',
                boxShadow: '0 0 10px #95ECD8',
                animation: 'scanLaser 2.2s infinite ease-in-out'
              }}
            />
          )}
        </div>
      </div>

      <style>{`
        @keyframes scanLaser {
          0% { top: 15%; }
          50% { top: 85%; }
          100% { top: 15%; }
        }
      `}</style>

      {/* Demo sample toggle (small & discreet for quick testing) */}
      <div style={{ padding: '0 20px 8px', textAlign: 'center' }}>
        <button
          onClick={() => setShowDemoPresets(!showDemoPresets)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#64748B',
            fontSize: '11px',
            textDecoration: 'underline',
            cursor: 'pointer'
          }}
        >
          {showDemoPresets ? 'Masquer les exemples de test' : 'Ou tester avec un exemple type'}
        </button>

        {showDemoPresets && (
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '8px', overflowX: 'auto' }}>
            {SAMPLE_PRESCRIPTIONS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset)}
                style={{
                  background: selectedPreset.id === preset.id ? 'var(--color-primary)' : '#143834',
                  color: '#FFFFFF',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  fontSize: '11px',
                  border: '1px solid #1a4741',
                  cursor: 'pointer'
                }}
              >
                {preset.title.split('(')[0]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Action Controls */}
      <div
        style={{
          background: '#031210',
          padding: '16px 24px 28px',
          borderTop: '1px solid #113833',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around'
        }}
      >
        {!capturedImage ? (
          <>
            <button
              onClick={() => galleryInputRef.current?.click()}
              style={{
                background: 'transparent',
                color: '#94A3B8',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <Image size={24} />
              <span>Galerie</span>
            </button>

            {/* Main Shutter Button */}
            <button
              onClick={handleCapture}
              style={{
                width: '68px',
                height: '68px',
                borderRadius: '50%',
                background: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '4px solid var(--color-mint)',
                boxShadow: '0 0 20px rgba(149, 236, 216, 0.4)',
                cursor: 'pointer'
              }}
              aria-label="Prendre la photo"
            >
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  background: 'var(--color-primary)'
                }}
              />
            </button>

            <button
              onClick={() => cameraInputRef.current?.click()}
              style={{
                background: 'transparent',
                color: '#94A3B8',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <Camera size={24} />
              <span>Caméra</span>
            </button>
          </>
        ) : (
          /* Confirm / Retake Buttons */
          <div style={{ display: 'flex', width: '100%', gap: '14px' }}>
            <button
              onClick={handleRetake}
              style={{
                flex: 1,
                background: '#143834',
                color: '#FFFFFF',
                padding: '14px',
                borderRadius: '999px',
                fontWeight: 700,
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={16} />
              <span>Reprendre</span>
            </button>

            <button
              onClick={handleConfirm}
              style={{
                flex: 1.5,
                background: 'var(--color-mint)',
                color: '#041715',
                padding: '14px',
                borderRadius: '999px',
                fontWeight: 800,
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 0 16px rgba(149, 236, 216, 0.4)'
              }}
            >
              <Check size={18} />
              <span>Analyser l'ordonnance</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
