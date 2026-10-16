import React, { useState } from 'react';
import { Clock, Check, X } from 'lucide-react';

export default function AvailabilityRequestCard({
  group,
  request,
  isHiding = false,
  onRespond
}) {
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  // Support either grouped requests or a single request
  const actualGroup = group || {
    groupId: request?.prescriptionId || request?.requestId,
    createdAt: request?.createdAt,
    expiresAt: request?.expiresAt,
    prescriptionPhoto: request?.prescriptionPhoto,
    items: [request]
  };

  const items = actualGroup.items || [];
  const isAnyPending = items.some((it) => it.status === 'PENDING');
  const isAllExpired = items.every((it) => it.status === 'EXPIRED');
  const timeAgoMinutes = Math.floor((Date.now() - (actualGroup.createdAt || Date.now())) / 60000);

  return (
    <div
      className="pg-card"
      style={{
        border: isAnyPending ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
        boxShadow: isAnyPending ? '0 4px 16px rgba(0, 95, 86, 0.12)' : 'none',
        background: '#FFFFFF',
        padding: '14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        opacity: isHiding ? 0 : 1,
        transform: isHiding ? 'scale(0.96) translateY(-10px)' : 'scale(1) translateY(0)',
        transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        pointerEvents: isHiding ? 'none' : 'auto'
      }}
    >
      {/* Top Banner */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 800,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color: isAnyPending ? 'var(--color-primary)' : '#64748B'
          }}
        >
          {isAllExpired ? 'DEMANDE EXPIRÉE' : 'DEMANDE DE DISPONIBILITÉ'}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#64748B' }}>
          <Clock size={12} />
          <span>{timeAgoMinutes < 1 ? "À l'instant" : `Il y a ${timeAgoMinutes} min`}</span>
        </div>
      </div>

      {/* Ordonnance Photo Thumbnail */}
      {actualGroup.prescriptionPhoto && (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img
            src={actualGroup.prescriptionPhoto}
            alt=""
            onClick={() => setIsZoomOpen(true)}
            style={{
              width: '54px',
              height: '54px',
              objectFit: 'cover',
              borderRadius: '10px',
              border: '1.5px solid #CBD5E1',
              cursor: 'pointer',
              transition: 'transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.06)';
              e.currentTarget.style.borderColor = 'var(--color-primary)';
              e.currentTarget.style.boxShadow = '0 3px 10px rgba(0, 95, 86, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.borderColor = '#CBD5E1';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </div>
      )}

      {/* Liste des médicaments en ligne avec bouton validation vert et croix rouge */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {items.map((med) => {
          const isAvail = med.status === 'AVAILABLE';
          const isUnavail = med.status === 'UNAVAILABLE';

          return (
            <div
              key={med.requestId}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '9px 12px',
                borderRadius: '10px',
                background: isAvail ? '#ECFDF5' : isUnavail ? '#FEF2F2' : '#F8FAFC',
                border: isAvail
                  ? '1.5px solid #10B981'
                  : isUnavail
                  ? '1.5px solid #EF4444'
                  : '1px solid #E2E8F0',
                transition: 'all 0.15s ease'
              }}
            >
              {/* Médicament et dosage */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '6px',
                  minWidth: 0,
                  flex: 1,
                  paddingRight: '10px'
                }}
              >
                <span
                  style={{
                    fontSize: '15px',
                    fontWeight: 700,
                    color: '#0F172A',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {med.medicineName}
                </span>
                {med.dosage && (
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#64748B',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {med.dosage}
                  </span>
                )}
              </div>

              {/* Bouton de validation vert et croix rouge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                {/* Validation vert */}
                <button
                  type="button"
                  onClick={() => onRespond(med.requestId, 'AVAILABLE')}
                  title="Disponible"
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: 'none',
                    cursor: 'pointer',
                    background: isAvail ? '#059669' : '#D1FAE5',
                    color: isAvail ? '#FFFFFF' : '#059669',
                    boxShadow: isAvail ? '0 2px 6px rgba(5, 150, 105, 0.35)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Check size={20} strokeWidth={2.8} />
                </button>

                {/* Croix rouge */}
                <button
                  type="button"
                  onClick={() => onRespond(med.requestId, 'UNAVAILABLE')}
                  title="Indisponible"
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: 'none',
                    cursor: 'pointer',
                    background: isUnavail ? '#DC2626' : '#FEE2E2',
                    color: isUnavail ? '#FFFFFF' : '#DC2626',
                    boxShadow: isUnavail ? '0 2px 6px rgba(220, 38, 38, 0.35)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <X size={20} strokeWidth={2.8} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pure Photo Zoom Modal (Same style and animation as camera preview - Zero text) */}
      {isZoomOpen && actualGroup.prescriptionPhoto && (
        <div
          onClick={() => setIsZoomOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 18, 15, 0.72)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 1000,
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
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
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <img
              src={actualGroup.prescriptionPhoto}
              alt=""
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain'
              }}
            />

            <button
              type="button"
              onClick={() => setIsZoomOpen(false)}
              style={{
                width: '44px',
                height: '44px',
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
                transition: 'transform 0.15s ease',
                position: 'absolute',
                top: '16px',
                right: '16px'
              }}
              aria-label="Fermer"
            >
              <X size={22} strokeWidth={2.4} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
