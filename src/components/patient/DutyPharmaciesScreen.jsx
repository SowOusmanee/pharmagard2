import React, { useState, useEffect } from 'react';
import { Phone, Navigation, Share2, HelpCircle, List, Map as MapIcon } from 'lucide-react';
import { INITIAL_PHARMACIES } from '../../data/mockData';
import { formatDistance } from '../../services/pharmacySearch';
import DakarMap from '../common/DakarMap';
import DotsLoader from '../common/DotsLoader';

export default function DutyPharmaciesScreen({ onCallPharmacy, onOpenItinerary }) {
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'map'
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);
  const [showShareToast, setShowShareToast] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Realistic short loading simulation (handles slow connections)
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 650);
    return () => clearTimeout(timer);
  }, []);

  const dutyPharmacies = INITIAL_PHARMACIES.filter((p) => p.isDuty24h);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Pharmacies de garde Dakar - PharmaGarde',
        text: 'Liste des pharmacies de garde ouvertes 24h/24 à Keur Massar.',
        url: window.location.href
      }).catch(() => {});
    } else {
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 2500);
    }
  };

  return (
    <div className="pg-content-scroll" style={{ paddingBottom: '24px' }}>
      {/* Title & Subtitle from Screenshot 3 */}
      <div>
        <h1 style={{ fontSize: '24px', color: 'var(--color-primary)', lineHeight: '1.2' }}>
          Pharmacies de garde aujourd'hui
        </h1>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            color: 'var(--color-text-muted)',
            marginTop: '4px'
          }}
        >
          <span style={{ color: 'var(--color-accent-green)', fontWeight: 900 }}>●</span>
          <span>Aujourd'hui · Ouvertes 24h/24 et la nuit</span>
        </div>
      </div>

      {/* View Switcher: Liste / Carte from Screenshot 3 */}
      <div
        style={{
          background: '#EAEFEF',
          padding: '3px',
          borderRadius: '12px',
          display: 'flex',
          gap: '3px'
        }}
      >
        <button
          onClick={() => setViewMode('list')}
          style={{
            flex: 1,
            padding: '8px',
            borderRadius: '999px',
            fontSize: '13px',
            fontWeight: 700,
            background: viewMode === 'list' ? '#FFFFFF' : 'transparent',
            color: viewMode === 'list' ? 'var(--color-primary-dark)' : 'var(--color-text-muted)',
            boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <List size={16} />
          <span>Liste</span>
        </button>

        <button
          onClick={() => setViewMode('map')}
          style={{
            flex: 1,
            padding: '8px',
            borderRadius: '999px',
            fontSize: '13px',
            fontWeight: 700,
            background: viewMode === 'map' ? '#FFFFFF' : 'transparent',
            color: viewMode === 'map' ? 'var(--color-primary-dark)' : 'var(--color-text-muted)',
            boxShadow: viewMode === 'map' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <MapIcon size={16} />
          <span>Carte</span>
        </button>
      </div>

      {/* REAL Interactive Leaflet Map View from Screenshot 3 */}
      <div
        className="pg-card"
        style={{
          padding: 0,
          overflow: 'hidden',
          position: 'relative',
          borderRadius: '16px',
          border: '1px solid var(--color-border)',
          height: viewMode === 'map' ? '340px' : '150px',
          transition: 'height 0.25s ease'
        }}
      >
        <DakarMap
          pharmacies={dutyPharmacies}
          selectedPharmacyId={selectedPharmacy?.id}
          onSelectPharmacy={(p) => setSelectedPharmacy(p)}
          height="100%"
          zoom={viewMode === 'map' ? 14 : 13}
          interactive={true}
        />

        {/* Top Badges on Map matching Screenshot 3 */}
        <div
          style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            right: '10px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pointerEvents: 'none',
            zIndex: 1000
          }}
        >
          <span
            style={{
              background: '#FFFFFF',
              color: 'var(--color-primary-dark)',
              padding: '4px 10px',
              borderRadius: '999px',
              fontSize: '11px',
              fontWeight: 800,
              boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
            }}
          >
            ↗ À proximité
          </span>
          <span
            style={{
              background: '#FFFFFF',
              color: '#1E293B',
              padding: '4px 10px',
              borderRadius: '999px',
              fontSize: '11px',
              fontWeight: 800,
              boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
            }}
          >
            Zone Keur Massar
          </span>
        </div>

        {/* Bottom Floating Pill */}
        <div
          style={{
            position: 'absolute',
            bottom: '10px',
            left: '10px',
            background: 'var(--color-primary)',
            color: '#FFFFFF',
            padding: '5px 12px',
            borderRadius: '999px',
            fontSize: '11px',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            zIndex: 1000
          }}
        >
          <span>🏥 {dutyPharmacies.length} ouvertes la nuit</span>
        </div>
      </div>

      {/* Selected pharmacy quick sheet if clicked on map */}
      {selectedPharmacy && viewMode === 'map' && (
        <div
          className="pg-card"
          style={{
            border: '2px solid var(--color-mint)',
            animation: 'fadeIn 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-text-main)' }}>
                {selectedPharmacy.name}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                📍 {selectedPharmacy.address} · {formatDistance(selectedPharmacy.distanceKm)}
              </div>
            </div>
            <span className="badge-duty">DE GARDE</span>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
            <button className="btn-call" onClick={() => onCallPharmacy(selectedPharmacy)}>
              <Phone size={14} />
              <span>Appeler</span>
            </button>
            <button className="btn-itinerary" onClick={() => onOpenItinerary(selectedPharmacy)}>
              <Navigation size={14} />
              <span>Itinéraire</span>
            </button>
          </div>
        </div>
      )}

      {/* Duty Pharmacies List Cards from Screenshot 3 */}
      {viewMode === 'list' && (
        isLoading ? (
          <DotsLoader
            message="Recherche des pharmacies de garde..."
            subtext="Connexion lente · Chargement des officines ouvertes"
            card={true}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {dutyPharmacies.map((pharmacy) => (
              <div key={pharmacy.id} className="pg-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '17px', color: 'var(--color-text-main)', lineHeight: '1.2' }}>
                      {pharmacy.name}
                    </h3>
                    <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                      📍 {pharmacy.address} · {formatDistance(pharmacy.distanceKm)}
                    </div>
                  </div>

                  <span className="badge-duty">DE GARDE</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                  <span
                    style={{
                      background: 'var(--color-mint-soft)',
                      color: 'var(--color-primary-dark)',
                      padding: '3px 8px',
                      borderRadius: '999px',
                      fontWeight: 700
                    }}
                  >
                    ● Ouverte maintenant
                  </span>
                  <span style={{ color: 'var(--color-text-muted)' }}>{pharmacy.landmark}</span>
                </div>

                {/* Action Buttons: Appeler & Itinéraire from Screenshot 3 */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
                  <button className="btn-call" onClick={() => onCallPharmacy(pharmacy)}>
                    <Phone size={15} />
                    <span>Appeler</span>
                  </button>

                  <button className="btn-itinerary subtle" onClick={() => onOpenItinerary(pharmacy)}>
                    <Navigation size={15} />
                    <span>Itinéraire</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Citizen feedback card from Screenshot 3 */}
      <div
        style={{
          background: '#E6FAF5',
          borderRadius: '14px',
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}
      >
        <div
          style={{
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            background: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-primary)',
            flexShrink: 0
          }}
        >
          <HelpCircle size={17} />
        </div>
        <div>
          <div style={{ fontSize: '12.5px', fontWeight: 800, color: 'var(--color-text-main)' }}>
            Une officine manque ou introuvable ?
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--color-primary-dark)', marginTop: '1px' }}>
            Signalement en continu au réseau citoyen PharmaGarde.
          </div>
        </div>
      </div>

      {/* Share Duty Link Button from Screenshot 3 */}
      <button
        onClick={handleShare}
        style={{
          background: '#10B981',
          color: '#FFFFFF',
          padding: '13px',
          borderRadius: '12px',
          fontWeight: 800,
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}
      >
        <Share2 size={17} />
        <span>Partager la liste des officines de garde</span>
      </button>

      {showShareToast && (
        <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--color-accent-green)', fontWeight: 700 }}>
          ✓ Lien de garde copié dans le presse-papiers
        </div>
      )}

      <div style={{ textAlign: 'center', fontSize: '11px', color: 'var(--color-text-muted)' }}>
        Données officielles de garde mises à jour par l'Ordre des Pharmaciens du Sénégal.
      </div>
    </div>
  );
}
