import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Phone,
  Navigation,
  Clock,
  Zap,
  MapPin,
  Map as MapIcon,
  ShieldAlert,
  Check
} from 'lucide-react';
import { checkAvailability, formatDistance } from '../../services/pharmacySearch';
import { db } from '../../services/db';
import DakarMap from '../common/DakarMap';
import DotsLoader from '../common/DotsLoader';

export default function SearchResultsScreen({
  medicines,
  pharmacies,
  userLocation,
  prescriptionId,
  onBack,
  onCallPharmacy,
  onOpenItinerary,
  onOpenDetails
}) {
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'in_stock' | 'duty'
  const [results, setResults] = useState([]);
  const [showSectorMap, setShowSectorMap] = useState(false);
  const [selectedMapPharmacy, setSelectedMapPharmacy] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshResults = () => {
    const ranked = checkAvailability(medicines, pharmacies, {
      autoTriggerRequests: false,
      prescriptionId
    });
    setResults(ranked);
  };

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      refreshResults();
      setIsLoading(false);
    }, 700);

    const unsubscribe = db.subscribe((event) => {
      if (
        event.type === 'REQUEST_RESPONDED' ||
        event.type === 'STOCK_UPDATED' ||
        event.type === 'RESET'
      ) {
        refreshResults();
      }
    });

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, [medicines, pharmacies]);

  const filteredResults = results.filter((item) => {
    if (filterMode === 'in_stock') {
      return item.availableCount > 0;
    }
    if (filterMode === 'duty') {
      return item.pharmacy.isDuty24h;
    }
    return true;
  });

  const titleMedText = medicines.map((m) => m.name).join(', ');
  const mapPharmaciesList = filteredResults.map((r) => r.pharmacy);

  return (
    <div className="pg-content-scroll" style={{ paddingBottom: '70px' }}>
      {/* Top Header matching Screenshot 4 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <button
          onClick={onBack}
          style={{
            background: '#F1F5F5',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-primary-dark)'
          }}
        >
          <ArrowLeft size={19} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: 'var(--color-text-muted)' }}>
          <MapPin size={14} color="var(--color-primary)" />
          <span style={{ fontWeight: 600 }}>Keur Massar & environs</span>
        </div>

        <span
          style={{
            background: '#EAEFEF',
            color: '#1E293B',
            fontSize: '11px',
            fontWeight: 800,
            padding: '3px 9px',
            borderRadius: '999px'
          }}
        >
          {filteredResults.length} répertoriées
        </span>
      </div>

      {/* Main Title matching Screenshot 4 */}
      <div>
        <div
          style={{
            fontSize: '11px',
            fontWeight: 800,
            color: 'var(--color-primary)',
            letterSpacing: '0.04em',
            textTransform: 'uppercase'
          }}
        >
          {medicines.length > 1 ? 'Ordonnance Complète' : 'Médicament Ciblé'}
        </div>
        <h1
          style={{
            fontSize: '22px',
            color: 'var(--color-primary)',
            lineHeight: '1.2',
            marginTop: '2px',
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            whiteSpace: 'nowrap'
          }}
        >
          Résultats pour {titleMedText}
        </h1>
      </div>

      {/* Conseil d'urgence box matching Screenshot 4 */}
      <div className="emergency-advice-box">
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: 'var(--color-mint)',
            color: 'var(--color-primary-dark)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <Phone size={13} />
        </div>
        <div style={{ fontSize: '12px', color: 'var(--color-primary-dark)', lineHeight: '1.35' }}>
          <strong>Conseil d'urgence :</strong> Appelez toujours l'officine avant tout déplacement nocturne pour sécuriser le stock.
        </div>
      </div>

      {/* Filter Badges matching Screenshot 4 */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '2px' }}>
        <button
          onClick={() => setFilterMode('all')}
          style={{
            background: filterMode === 'all' ? 'var(--color-primary)' : '#EAEFEF',
            color: filterMode === 'all' ? '#FFFFFF' : '#2D3748',
            padding: '6px 14px',
            borderRadius: '999px',
            fontSize: '12px',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}
        >
          {filterMode === 'all' && <Check size={13} />}
          <span>Tout afficher</span>
        </button>

        <button
          onClick={() => setFilterMode('in_stock')}
          style={{
            background: filterMode === 'in_stock' ? 'var(--color-primary)' : '#EAEFEF',
            color: filterMode === 'in_stock' ? '#FFFFFF' : '#2D3748',
            padding: '6px 14px',
            borderRadius: '999px',
            fontSize: '12px',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}
        >
          <span style={{ color: '#10B981', fontWeight: 900 }}>●</span>
          <span>En stock uniquement</span>
        </button>

        <button
          onClick={() => setFilterMode('duty')}
          style={{
            background: filterMode === 'duty' ? 'var(--color-primary)' : '#EAEFEF',
            color: filterMode === 'duty' ? '#FFFFFF' : '#2D3748',
            padding: '6px 14px',
            borderRadius: '999px',
            fontSize: '12px',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}
        >
          <span>✳ De garde</span>
        </button>
      </div>

      {/* REAL Interactive Leaflet Map for the Sector */}
      {showSectorMap && (
        <div
          className="pg-card"
          style={{
            padding: 0,
            overflow: 'hidden',
            borderRadius: '16px',
            border: '1.5px solid var(--color-mint)',
            animation: 'fadeIn 0.2s ease'
          }}
        >
          <DakarMap
            pharmacies={mapPharmaciesList}
            selectedPharmacyId={selectedMapPharmacy?.id}
            onSelectPharmacy={(p) => setSelectedMapPharmacy(p)}
            height="260px"
            zoom={13}
            interactive={true}
          />
        </div>
      )}

      {/* Ranked Pharmacies List matching Screenshot 4 */}
      {isLoading ? (
        <DotsLoader
          message="Recherche des stocks en temps réel..."
          subtext="Connexion lente · Interrogation des officines du secteur"
          card={true}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredResults.map(({ pharmacy, medicinesBreakdown, availableCount, totalRequested, isComplete, isPartial, confirmationText }) => {
          const isPending = medicinesBreakdown.some((m) => m.status === 'PENDING_REQUEST');
          const isDuty = pharmacy.isDuty24h;
          const isPriority = pharmacy.isPriority;

          return (
            <div
              key={pharmacy.id}
              className="pg-card"
              style={{
                border: isComplete ? '1.5px solid var(--color-mint)' : '1px solid var(--color-border)',
                cursor: 'pointer'
              }}
              onClick={() => onOpenDetails(pharmacy, medicinesBreakdown)}
            >
              {/* Badges row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {isDuty && <span className="badge-duty">● DE GARDE</span>}
                  {isPriority && (
                    <span className="badge-priority">
                      <Zap size={11} style={{ display: 'inline', marginRight: '2px' }} />
                      Prioritaire
                    </span>
                  )}
                </div>

                {totalRequested > 1 && (
                  <span className={isComplete ? 'badge-complete' : isPartial ? 'badge-partial' : 'badge-stock out'}>
                    {availableCount} / {totalRequested} {isComplete ? 'Ordonnance complète' : 'Ordonnance incomplète'}
                  </span>
                )}
              </div>

              {/* Name & Address */}
              <div>
                <h3 style={{ fontSize: '17px', color: 'var(--color-text-main)', lineHeight: '1.2' }}>
                  {pharmacy.name}
                </h3>
                <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                  {pharmacy.address} · <strong style={{ color: 'var(--color-primary)' }}>{formatDistance(pharmacy.calculatedDistanceKm ?? pharmacy.distanceKm)}</strong>
                </div>
              </div>

              {/* Medicines breakdown chips */}
              {totalRequested > 1 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {medicinesBreakdown.map((m, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: '11px',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background:
                          m.status === 'AVAILABLE'
                            ? '#D1FAE5'
                            : m.status === 'UNAVAILABLE'
                            ? '#FEE2E2'
                            : '#FEF3C7',
                        color:
                          m.status === 'AVAILABLE'
                            ? '#065F46'
                            : m.status === 'UNAVAILABLE'
                            ? '#991B1B'
                            : '#92400E',
                        fontWeight: 700
                      }}
                    >
                      {m.status === 'AVAILABLE' ? '✓' : m.status === 'UNAVAILABLE' ? '✕' : '⏳'} {m.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Stock status bar matching Screenshot 4 */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', background: '#F8FAFA', padding: '7px 10px', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {availableCount > 0 ? (
                    <span style={{ color: '#059669', fontWeight: 800 }}>
                      ● En stock {isComplete ? '' : `(${availableCount}/${totalRequested})`}
                    </span>
                  ) : (
                    <span style={{ color: '#DC2626', fontWeight: 800 }}>
                      ⓧ Rupture temporaire
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-text-muted)' }}>
                  <Clock size={12} />
                  <span>{confirmationText}</span>
                </div>
              </div>

              {/* Action Buttons matching Screenshot 4 */}
              <div
                style={{ display: 'flex', gap: '8px', marginTop: '2px' }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className="btn-call"
                  onClick={() => onCallPharmacy(pharmacy)}
                >
                  <Phone size={14} />
                  <span>Appeler</span>
                </button>

                <button
                  className="btn-itinerary"
                  onClick={() => onOpenItinerary(pharmacy)}
                >
                  <Navigation size={14} />
                  <span>Itinéraire</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Floating Map Preview Button matching Screenshot 4 */}
      <div style={{ position: 'sticky', bottom: '16px', display: 'flex', justifyContent: 'center', zIndex: 30 }}>
        <button
          onClick={() => setShowSectorMap(!showSectorMap)}
          style={{
            background: '#FFFFFF',
            color: 'var(--color-primary)',
            border: '1.5px solid var(--color-mint)',
            borderRadius: '999px',
            padding: '10px 20px',
            fontSize: '13px',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 16px rgba(0, 95, 86, 0.16)'
          }}
        >
          <MapIcon size={16} color="var(--color-primary)" />
          <span>{showSectorMap ? 'Masquer la carte' : 'Voir sur la carte du secteur'}</span>
        </button>
      </div>

      {/* Footer disclaimer matching Screenshot 4 */}
      <div
        style={{
          textAlign: 'center',
          fontSize: '11px',
          color: 'var(--color-text-muted)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '3px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--color-primary)', fontWeight: 700 }}>
          <ShieldAlert size={13} />
          <span>Appelez avant de vous déplacer.</span>
        </div>
        <span>Données déclaratives transmises en continu par les officines de Dakar.</span>
      </div>
    </div>
  );
}
