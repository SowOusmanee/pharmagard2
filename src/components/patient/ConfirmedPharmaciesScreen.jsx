import React, { useState, useEffect } from 'react';
import { Phone, Navigation, CheckCircle2, AlertCircle, FileText, XCircle, ChevronDown } from 'lucide-react';
import { checkAvailability, formatDistance } from '../../services/pharmacySearch';
import { db } from '../../services/db';
import { progressiveSearchService } from '../../services/progressiveSearchService';

export default function ConfirmedPharmaciesScreen({
  medicines = [],
  pharmacies = [],
  userLocation = null,
  prescriptionId,
  prescriptionPhoto,
  onCallPharmacy,
  onOpenItinerary,
  onNewScan
}) {
  const [showPrescriptionDetails, setShowPrescriptionDetails] = useState(false);
  const [expandedPharmacies, setExpandedPharmacies] = useState({});
  const [progressiveState, setProgressiveState] = useState(null);
  const [, setDbVersion] = useState(0);

  useEffect(() => {
    // Ne relancer la recherche que si elle n'est pas déjà active pour cette ordonnance
    const currentState = progressiveSearchService.getState();
    const alreadyActive = currentState.isActive &&
      progressiveSearchService.currentSearch?.prescriptionId === prescriptionId;

    if (medicines && medicines.length > 0 && !alreadyActive) {
      progressiveSearchService.startSearch({
        medicines,
        prescriptionId,
        prescriptionPhoto,
        userLocation: userLocation || undefined
      });
    }

    const unsubscribeProgressive = progressiveSearchService.subscribe((state) => {
      setProgressiveState(state);
    });

    const unsubscribeDb = db.subscribe(() => {
      setDbVersion((v) => v + 1);
    });

    return () => {
      unsubscribeProgressive();
      unsubscribeDb();
    };
  }, [prescriptionId]);

  const togglePharmacyExpand = (pharmacyId) => {
    setExpandedPharmacies((prev) => ({
      ...prev,
      [pharmacyId]: !prev[pharmacyId]
    }));
  };

  // Rank pharmacies strictly:
  // 1. Avoir TOUTE l'ordonnance (100% available meds first)
  // 2. Distance (closest first)
  const ranked = checkAvailability(medicines, pharmacies, {
    autoTriggerRequests: true,
    prescriptionId
  }).sort((a, b) => {
    // 1. Plus grand nombre de médicaments disponibles d'abord
    if (a.availableCount !== b.availableCount) {
      return b.availableCount - a.availableCount;
    }
    // 2. Si même stock, la plus proche l'emporte
    return a.pharmacy.calculatedDistanceKm - b.pharmacy.calculatedDistanceKm;
  });

  return (
    <div
      className="pg-content-scroll"
      style={{
        padding: '12px 16px 28px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        animation: 'resultsSlideFadeIn 0.38s cubic-bezier(0.16, 1, 0.3, 1) both',
        backgroundColor: '#F8F9FA'
      }}
    >
      <style>{`
        @keyframes resultsSlideFadeIn {
          0% {
            opacity: 0;
            transform: translateY(18px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes itemFadeUp {
          0% {
            opacity: 0;
            transform: translateY(12px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      {/* 1. Slim Discreet Prescription Strip (Reduced, non-intrusive) */}
      {medicines.length > 0 && (
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '14px',
            border: '1px solid #E5EBEA',
            padding: '9px 14px',
            boxShadow: '0 1px 4px rgba(0, 0, 0, 0.02)',
            display: 'flex',
            flexDirection: 'column',
            transition: 'all 0.2s ease',
            animation: 'itemFadeUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) both'
          }}
        >
          <div
            onClick={() => setShowPrescriptionDetails(!showPrescriptionDetails)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              userSelect: 'none'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '6px',
                  backgroundColor: '#E6FAF5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <FileText size={14} color="#005F56" />
              </div>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#1F2937' }}>
                Ordonnance ({medicines.length} médicament{medicines.length > 1 ? 's' : ''})
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#005F56', fontSize: '12px', fontWeight: 600 }}>
              <span>{showPrescriptionDetails ? 'Masquer' : 'Détails'}</span>
              <ChevronDown
                size={14}
                style={{
                  transform: showPrescriptionDetails ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.28s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              />
            </div>
          </div>

          {/* Déroulé fluide des médicaments de l'ordonnance */}
          <div
            style={{
              display: 'grid',
              gridTemplateRows: showPrescriptionDetails ? '1fr' : '0fr',
              transition: 'grid-template-rows 0.28s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <div style={{ overflow: 'hidden' }}>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '6px',
                  paddingTop: showPrescriptionDetails ? '9px' : '0px',
                  paddingBottom: showPrescriptionDetails ? '2px' : '0px',
                  marginTop: showPrescriptionDetails ? '8px' : '0px',
                  borderTop: showPrescriptionDetails ? '1px solid #F0F2F2' : '1px solid transparent',
                  opacity: showPrescriptionDetails ? 1 : 0,
                  transform: showPrescriptionDetails ? 'translateY(0)' : 'translateY(-4px)',
                  transition: 'opacity 0.22s ease, transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), padding 0.28s cubic-bezier(0.16, 1, 0.3, 1), margin 0.28s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s ease'
                }}
              >
                {medicines.map((m, idx) => {
                  const label = m.dosage ? `${m.name} ${m.dosage}` : m.name;
                  return (
                    <span
                      key={idx}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        backgroundColor: '#F9FAFB',
                        border: '1px solid #E5E7EB',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '11.5px',
                        fontWeight: 500,
                        color: '#4B5563'
                      }}
                    >
                      {label}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* État de l'envoi par rayon progressif */}
      {progressiveState?.statusText && (
        <div
          style={{
            backgroundColor: progressiveState.noResponse ? '#FEF2F2' : '#E6FAF5',
            border: `1px solid ${progressiveState.noResponse ? '#FECACA' : '#A7F3D0'}`,
            borderRadius: '12px',
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            animation: 'itemFadeUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) both'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                display: 'inline-block',
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: progressiveState.noResponse
                  ? '#DC2626'
                  : progressiveState.hasAvailableResponse
                  ? '#059669'
                  : '#005F56',
                flexShrink: 0
              }}
            />
            <span
              style={{
                fontSize: '12.5px',
                fontWeight: 600,
                color: progressiveState.noResponse ? '#991B1B' : '#005F56'
              }}
            >
              {progressiveState.statusText}
            </span>
          </div>

          {progressiveState.hasAvailableResponse && (
            <button
              onClick={() => progressiveSearchService.expandToMoreOptions()}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#005F56',
                fontSize: '11px',
                fontWeight: 700,
                textDecoration: 'underline',
                cursor: 'pointer',
                padding: 0,
                whiteSpace: 'nowrap'
              }}
            >
              Voir plus d'options
            </button>
          )}
        </div>
      )}

      {/* List of pharmacies */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '11px', marginTop: '2px' }}>
        {ranked.map(({ pharmacy, medicinesBreakdown, availableCount, totalRequested, isComplete }, idx) => {
          const isBest = idx === 0;
          const isExpanded = !!expandedPharmacies[pharmacy.id];
          const isDuty = !!(pharmacy.isDuty24h || pharmacy.isDuty || pharmacy.duty || pharmacy.status === 'DUTY_24H');

          return (
            <div
              key={pharmacy.id}
              style={{
                backgroundColor: isBest ? '#F4FBF9' : '#FFFFFF',
                borderRadius: '16px',
                border: isBest ? '2px solid #005F56' : '1px solid #E5EBEA',
                padding: isBest ? '13px 14px' : '11px 13px',
                boxShadow: isBest
                  ? '0 6px 20px -3px rgba(0, 95, 86, 0.20), 0 2px 6px rgba(0, 0, 0, 0.04)'
                  : '0 1px 6px rgba(0, 0, 0, 0.03)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                position: 'relative',
                animation: 'itemFadeUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) both',
                animationDelay: `${0.06 + Math.min(idx * 0.04, 0.2)}s`
              }}
            >
              {/* Badge de mise en avant pour la pharmacie avec le meilleur stock */}
              {isBest && (
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '-3px' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      backgroundColor: '#005F56',
                      color: '#FFFFFF',
                      fontSize: '9.5px',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '999px',
                      letterSpacing: '0.3px',
                      textTransform: 'uppercase'
                    }}
                  >
                    <CheckCircle2 size={11} color="#5CE1B6" />
                    <span>Meilleur stock · Recommandée</span>
                  </span>
                </div>
              )}

              {/* Header: Name, Address & Distance Badge */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                <div>
                  <h3
                    style={{
                      fontSize: isBest ? '17px' : '16px',
                      fontWeight: 700,
                      color: '#0B2421',
                      fontFamily: 'Playfair Display, Georgia, serif',
                      margin: '0 0 2px',
                      lineHeight: 1.18
                    }}
                  >
                    {pharmacy.name}
                  </h3>
                  <div style={{ fontSize: '11.5px', color: '#6B7280', lineHeight: 1.25 }}>
                    {pharmacy.address}
                  </div>
                </div>

                <div style={{ flexShrink: 0 }}>
                  <span
                    style={{
                      fontSize: '11.5px',
                      fontWeight: 700,
                      color: '#005F56',
                      backgroundColor: '#E6FAF5',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      display: 'inline-block'
                    }}
                  >
                    {formatDistance(pharmacy.calculatedDistanceKm ?? pharmacy.distanceKm)}
                  </span>
                </div>
              </div>

              {/* Badge de garde éventuel */}
              {isDuty && (
                <div style={{ display: 'flex', marginTop: '-2px' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      backgroundColor: '#005F56',
                      color: '#FFFFFF',
                      fontSize: '10px',
                      fontWeight: 800,
                      padding: '2px 7px',
                      borderRadius: '4px',
                      letterSpacing: '0.3px'
                    }}
                  >
                    ● DE GARDE
                  </span>
                </div>
              )}

              {/* Flèche alignée à gauche avec compte des médicaments (strictement: disponible / total) */}
              <div style={{ display: 'flex', justifyContent: 'flex-start', margin: '2px 0' }}>
                <button
                  type="button"
                  onClick={() => togglePharmacyExpand(pharmacy.id)}
                  aria-expanded={isExpanded}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    backgroundColor: isComplete ? '#ECFDF5' : '#FDF2F4',
                    border: 'none',
                    color: isComplete ? '#047857' : '#BE123C',
                    borderRadius: '999px',
                    padding: '4px 12px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)',
                    transition: 'all 0.2s ease',
                    outline: 'none',
                    userSelect: 'none'
                  }}
                  onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.96)')}
                  onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  <span>{availableCount}/{totalRequested}</span>
                  <ChevronDown
                    size={14}
                    color={isComplete ? '#047857' : '#BE123C'}
                    style={{
                      transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.28s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}
                  />
                </button>
              </div>

              {/* Déroulé fluide de la liste des médicaments sous la flèche */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateRows: isExpanded ? '1fr' : '0fr',
                  transition: 'grid-template-rows 0.28s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              >
                <div style={{ overflow: 'hidden' }}>
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      justifyContent: 'flex-start',
                      gap: '6px',
                      paddingTop: isExpanded ? '4px' : '0px',
                      paddingBottom: isExpanded ? '4px' : '0px',
                      opacity: isExpanded ? 1 : 0,
                      transform: isExpanded ? 'translateY(0)' : 'translateY(-4px)',
                      transition: 'opacity 0.22s ease, transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), padding 0.28s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}
                  >
                    {medicinesBreakdown.map((m, i) => {
                      const isAvail = m.status === 'AVAILABLE';
                      return (
                        <span
                          key={i}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            backgroundColor: isAvail ? '#ECFDF5' : '#FFE4E6',
                            color: isAvail ? '#047857' : '#BE123C',
                            borderRadius: '999px',
                            padding: '4px 10px',
                            fontSize: '11px',
                            fontWeight: 600
                          }}
                        >
                          {isAvail ? (
                            <CheckCircle2 size={12} color="#059669" />
                          ) : (
                            <XCircle size={12} color="#E11D48" />
                          )}
                          <span>{m.name}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Actions: Call & Itinerary - Boutons compacts (Appeler foncé, Itinéraire menthe claire) */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
                <button
                  className="btn-call"
                  onClick={() => onCallPharmacy && onCallPharmacy(pharmacy)}
                  style={{
                    flex: 1,
                    padding: '9px 12px',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: 700,
                    backgroundColor: '#0B4D3C',
                    border: 'none',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    boxShadow: '0 1px 3px rgba(11, 77, 60, 0.25)',
                    transition: 'transform 0.15s ease, background-color 0.15s ease'
                  }}
                  onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.97)')}
                  onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  <Phone size={15} color="#FFFFFF" />
                  <span>Appeler</span>
                </button>
                <button
                  className="btn-itinerary"
                  onClick={() => onOpenItinerary && onOpenItinerary(pharmacy)}
                  style={{
                    flex: 1,
                    padding: '9px 12px',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: 700,
                    backgroundColor: '#E6FAF5',
                    border: 'none',
                    color: '#0B4D3C',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    boxShadow: '0 1px 3px rgba(0, 95, 86, 0.08)',
                    transition: 'transform 0.15s ease, background-color 0.15s ease'
                  }}
                  onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.97)')}
                  onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  <Navigation size={15} color="#0B4D3C" />
                  <span>Itinéraire</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
