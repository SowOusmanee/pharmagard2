import React, { useEffect, useState } from 'react';
import { FileSearch, CheckCircle2, AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';
import { analyzePrescription, OCR_STAGES } from '../../services/analyzer';

export default function ProcessingScreen({ photoPayload, onAnalysisComplete, onRetake }) {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [progressPercent, setProgressPercent] = useState(15);
  const [detectedItemsCount, setDetectedItemsCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function runProcessing() {
      try {
        setErrorMessage(null);
        const isReal = Boolean(photoPayload?.isRealPhoto || photoPayload?.dataUrl);

        const result = await analyzePrescription(photoPayload?.dataUrl, {
          samplePresetId: photoPayload?.preset?.previewSvg,
          isRealPhoto: isReal,
          onProgress: ({ stage, percent }) => {
            if (!isMounted) return;
            const idx = OCR_STAGES.findIndex((s) => s.id === stage.id);
            if (idx >= 0) setCurrentStageIndex(idx);
            setProgressPercent(percent);

            if (idx === 1) {
              setDetectedItemsCount(3);
            }
          }
        });

        if (isMounted) {
          setTimeout(() => {
            onAnalysisComplete(result);
          }, 400);
        }
      } catch (err) {
        console.error('OCR processing error:', err);
        if (isMounted) {
          setErrorMessage(err.message || "Impossible de lire l'ordonnance");
        }
      }
    }

    runProcessing();

    return () => {
      isMounted = false;
    };
  }, [photoPayload, onAnalysisComplete]);

  // Error view if extraction failed
  if (errorMessage) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: '#041715',
          color: '#FFFFFF',
          padding: '30px 24px',
          textAlign: 'center'
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.15)',
            color: '#EF4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px'
          }}
        >
          <AlertTriangle size={32} />
        </div>

        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#FFFFFF', marginBottom: '8px' }}>
          Analyse incomplète
        </h2>

        <p style={{ fontSize: '13px', color: '#CBD5E1', marginBottom: '24px', maxWidth: '300px' }}>
          {errorMessage}
        </p>

        <button
          onClick={onRetake}
          style={{
            background: 'var(--color-mint)',
            color: '#041715',
            padding: '12px 24px',
            borderRadius: '12px',
            fontWeight: 800,
            fontSize: '14px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          <RefreshCw size={16} /> Reprendre la photo
        </button>
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
        height: '100%',
        minHeight: '100%',
        flex: 1,
        background: '#041715',
        color: '#FFFFFF',
        padding: '24px 20px',
        textAlign: 'center',
        position: 'relative',
        boxSizing: 'border-box'
      }}
    >
      {/* Floating Spherical Back Bubble */}
      <button
        onClick={onRetake}
        style={{
          position: 'absolute',
          top: '18px',
          left: '18px',
          width: '42px',
          height: '42px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.12)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.22)',
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 6px 20px rgba(0, 0, 0, 0.35)',
          transition: 'all 0.2s ease',
          zIndex: 60
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.08)';
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
        }}
        title="Retour"
        aria-label="Retour"
      >
        <ArrowLeft size={20} strokeWidth={2.5} />
      </button>

      {/* Scanning Target Visual Animation */}
      <div
        style={{
          width: '180px',
          height: '240px',
          borderRadius: '16px',
          background: '#0A2623',
          border: '2px solid rgba(149, 236, 216, 0.4)',
          position: 'relative',
          overflow: 'hidden',
          marginBottom: '32px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 30px rgba(0, 95, 86, 0.4)'
        }}
      >
        <FileSearch size={48} color="var(--color-mint)" opacity={0.8} />

        {/* Animated Scanning Laser Line */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            height: '3px',
            background: 'var(--color-mint)',
            boxShadow: '0 0 15px #95ECD8',
            animation: 'scanLaser 1.8s infinite ease-in-out'
          }}
        />

        {detectedItemsCount > 0 && (
          <div
            style={{
              position: 'absolute',
              bottom: '16px',
              background: 'rgba(0, 95, 86, 0.9)',
              color: 'var(--color-mint)',
              fontSize: '11px',
              fontWeight: 800,
              padding: '3px 8px',
              borderRadius: '6px'
            }}
          >
            ✓ Analyse en cours
          </div>
        )}
      </div>

      <style>{`
        @keyframes scanLaser {
          0% { top: 10%; }
          50% { top: 90%; }
          100% { top: 10%; }
        }
      `}</style>

      {/* Title */}
      <h2
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '24px',
          color: '#FFFFFF',
          marginBottom: '8px'
        }}
      >
        Traitement de l'ordonnance
      </h2>

      <p style={{ fontSize: '13px', color: '#A3E8D8', marginBottom: '18px', maxWidth: '300px' }}>
        Lecture optique et détection des molécules et dosages prescrits.
      </p>

      {/* Progress Bar */}
      <div
        style={{
          width: '100%',
          maxWidth: '300px',
          height: '6px',
          background: '#0D3833',
          borderRadius: '999px',
          overflow: 'hidden',
          marginBottom: '24px'
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progressPercent}%`,
            background: 'var(--color-mint)',
            transition: 'width 0.4s ease'
          }}
        />
      </div>

      {/* 3 OCR Stages Checklist */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          width: '100%',
          maxWidth: '300px',
          textAlign: 'left'
        }}
      >
        {OCR_STAGES.map((stage, idx) => {
          const isDone = currentStageIndex > idx;
          const isCurrent = currentStageIndex === idx;

          return (
            <div
              key={stage.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                borderRadius: '12px',
                background: isCurrent ? 'rgba(0, 95, 86, 0.4)' : 'rgba(255, 255, 255, 0.03)',
                border: isCurrent ? '1px solid var(--color-mint)' : '1px solid transparent'
              }}
            >
              {isDone ? (
                <CheckCircle2 size={18} color="var(--color-mint)" />
              ) : isCurrent ? (
                <div
                  style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    border: '2px solid var(--color-mint)',
                    borderTopColor: 'transparent',
                    animation: 'spin 0.8s linear infinite'
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    border: '2px solid #335954'
                  }}
                />
              )}

              <span
                style={{
                  fontSize: '13px',
                  fontWeight: isCurrent ? 800 : 500,
                  color: isCurrent ? '#FFFFFF' : isDone ? '#A3E8D8' : '#648580'
                }}
              >
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
