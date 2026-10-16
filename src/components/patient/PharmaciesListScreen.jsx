import React from 'react';
import { ArrowRight, Phone, Navigation, Clock } from 'lucide-react';
import { db } from '../../services/db';
import { formatDistance } from '../../services/pharmacySearch';

export default function PharmaciesListScreen({ pharmacies = [], onBack, onCallPharmacy, onOpenItinerary }) {
  const currentList = pharmacies && pharmacies.length > 0 ? pharmacies : db.getPharmacies();
  // Sort pharmacies by distance to ensure the nearest one is first
  const sortedPharmacies = [...currentList].sort(
    (a, b) => (a.calculatedDistanceKm ?? a.distanceKm ?? 999) - (b.calculatedDistanceKm ?? b.distanceKm ?? 999)
  );
  const closestPharmacy = sortedPharmacies[0] || currentList[0];
  const otherPharmacies = sortedPharmacies.slice(1);

  return (
    <div
      className="pg-content-scroll"
      style={{
        flex: 1,
        width: '100%',
        height: '100%',
        minHeight: 0,
        overflowY: 'auto',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-y',
        padding: '16px 20px 80px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        backgroundColor: '#F8F9FA'
      }}
    >
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', paddingTop: '4px' }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            backgroundColor: '#FFFFFF',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            color: '#1A332E',
            flexShrink: 0,
            transition: 'transform 0.15s ease, background-color 0.15s ease'
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.92)')}
          onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          aria-label="Quitter le menu des pharmacies"
          title="Fermer le menu des pharmacies"
        >
          <ArrowRight size={20} strokeWidth={2.4} />
        </button>

        <div>
          <h1
            style={{
              fontSize: '22px',
              fontWeight: 700,
              color: 'var(--color-primary-dark, #004740)',
              margin: 0,
              lineHeight: 1.2
            }}
          >
            Pharmacies
          </h1>
          <div style={{ fontSize: '12px', color: 'var(--color-primary, #005F56)', marginTop: '2px', fontWeight: 600 }}>
            📍 Keur Massar Sud · À proximité
          </div>
        </div>
      </div>

      {/* Pharmacies List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Nearest Pharmacy - Featured in a larger, prominent block with very light green background and strong relief */}
        {closestPharmacy && (
          <div
            key={closestPharmacy.id}
            style={{
              background: 'linear-gradient(165deg, #F3FBF8 0%, #E6F7F1 100%)',
              border: '1.5px solid rgba(0, 95, 86, 0.24)',
              borderRadius: '20px',
              padding: '22px 18px',
              boxShadow: '0 12px 32px -4px rgba(0, 71, 64, 0.16), 0 4px 12px rgba(0, 0, 0, 0.05)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              position: 'relative'
            }}
          >
            {/* Pharmacy header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
              <div>
                <h2
                  style={{
                    fontSize: '18px',
                    fontWeight: 700,
                    color: 'var(--color-primary-dark, #004740)',
                    margin: '0 0 4px',
                    lineHeight: 1.3
                  }}
                >
                  {closestPharmacy.name}
                </h2>
                <div style={{ fontSize: '13.5px', color: 'var(--color-text-muted, #526E6A)', lineHeight: 1.4 }}>
                  {closestPharmacy.address}
                </div>
              </div>

              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  color: 'var(--color-primary, #005F56)',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid rgba(0, 95, 86, 0.18)',
                  boxShadow: '0 1px 4px rgba(0, 0, 0, 0.05)',
                  padding: '5px 12px',
                  borderRadius: '999px',
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}
              >
                {closestPharmacy.formattedDistance || formatDistance(closestPharmacy.calculatedDistanceKm ?? closestPharmacy.distanceKm)}
              </span>
            </div>

            {/* Badges / Hours */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12.5px', flexWrap: 'wrap' }}>
              {closestPharmacy.isDuty24h ? (
                <span className="badge-duty" style={{ padding: '4px 10px', fontSize: '12px' }}>
                  ● De garde
                </span>
              ) : (
                <span
                  style={{
                    color: 'var(--color-text-muted, #526E6A)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <Clock size={14} />
                  <span>{closestPharmacy.openingHours || '08h - 23h'}</span>
                </span>
              )}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
              <button
                className="btn-call"
                onClick={() => onCallPharmacy && onCallPharmacy(closestPharmacy)}
                style={{
                  flex: 1,
                  padding: '11px 16px',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  borderRadius: '9999px'
                }}
              >
                <Phone size={15} />
                <span>Appeler</span>
              </button>
              <button
                className="btn-itinerary"
                onClick={() => onOpenItinerary && onOpenItinerary(closestPharmacy)}
                style={{
                  flex: 1,
                  padding: '11px 16px',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  borderRadius: '9999px'
                }}
              >
                <Navigation size={15} />
                <span>Itinéraire</span>
              </button>
            </div>
          </div>
        )}

        {/* Other Pharmacies */}
        {otherPharmacies.map((pharmacy) => (
          <div
            key={pharmacy.id}
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--color-border, #E5EBEA)',
              borderRadius: '14px',
              padding: '14px 16px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            {/* Pharmacy header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
              <div>
                <h3
                  style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    color: 'var(--color-text-main, #0B2421)',
                    margin: '0 0 2px'
                  }}
                >
                  {pharmacy.name}
                </h3>
                <div style={{ fontSize: '12.5px', color: 'var(--color-text-muted, #526E6A)' }}>
                  {pharmacy.address}
                </div>
              </div>

              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: 'var(--color-primary, #005F56)',
                  backgroundColor: 'var(--color-mint-light, #E6FAF5)',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  whiteSpace: 'nowrap'
                }}
              >
                {pharmacy.formattedDistance || formatDistance(pharmacy.calculatedDistanceKm ?? pharmacy.distanceKm)}
              </span>
            </div>

            {/* Badges / Hours */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px' }}>
              {pharmacy.isDuty24h ? (
                <span className="badge-duty">
                  ● De garde
                </span>
              ) : (
                <span
                  style={{
                    color: 'var(--color-text-muted, #526E6A)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Clock size={12} />
                  <span>{pharmacy.openingHours || '08h - 23h'}</span>
                </span>
              )}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '8px', paddingTop: '2px' }}>
              <button
                className="btn-call"
                onClick={() => onCallPharmacy && onCallPharmacy(pharmacy)}
                style={{ flex: 1, padding: '8px 12px', fontSize: '12.5px', borderRadius: '9999px' }}
              >
                <Phone size={13} />
                <span>Appeler</span>
              </button>
              <button
                className="btn-itinerary"
                onClick={() => onOpenItinerary && onOpenItinerary(pharmacy)}
                style={{ flex: 1, padding: '8px 12px', fontSize: '12.5px', borderRadius: '9999px' }}
              >
                <Navigation size={13} />
                <span>Itinéraire</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
