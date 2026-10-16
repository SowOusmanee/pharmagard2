import React from 'react';
import { X, Phone, Navigation, Clock, MapPin, CheckCircle2, XCircle, AlertCircle, ShieldCheck } from 'lucide-react';
import { formatDistance } from '../../services/pharmacySearch';

export default function PharmacyDetailModal({
  pharmacy,
  medicinesBreakdown,
  onClose,
  onCall,
  onOpenItinerary
}) {
  if (!pharmacy) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {pharmacy.isDuty24h && <span className="badge-duty">DE GARDE</span>}
              <span style={{ fontSize: '12px', color: 'var(--color-primary)', fontWeight: 800 }}>
                {pharmacy.calculatedDistanceKm || pharmacy.distanceKm ? formatDistance(pharmacy.calculatedDistanceKm ?? pharmacy.distanceKm) : 'Proche'}
              </span>
            </div>
            <h2 style={{ fontSize: '20px', color: 'var(--color-text-main)', marginTop: '4px' }}>
              {pharmacy.name}
            </h2>
          </div>

          <button
            onClick={onClose}
            style={{
              background: '#F1F5F9',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748B'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Address and Info */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            marginTop: '14px',
            fontSize: '13px',
            color: 'var(--color-text-muted)',
            background: '#F8FAFA',
            padding: '12px 14px',
            borderRadius: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={16} color="var(--color-primary)" style={{ flexShrink: 0 }} />
            <span>{pharmacy.address} ({pharmacy.landmark})</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={16} color="var(--color-primary)" style={{ flexShrink: 0 }} />
            <span>Horaires : <strong>{pharmacy.openingHours}</strong></span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={16} color="var(--color-accent-green)" style={{ flexShrink: 0 }} />
            <span>Pharmacien titulaire : {pharmacy.pharmacistName}</span>
          </div>
        </div>

        {/* Medicines Availability Breakdown */}
        {medicinesBreakdown && medicinesBreakdown.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--color-text-main)', marginBottom: '8px' }}>
              Disponibilité des médicaments prescrits
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {medicinesBreakdown.map((item, idx) => {
                const isAvail = item.status === 'AVAILABLE';
                const isUnavail = item.status === 'UNAVAILABLE';
                return (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: isAvail ? '#ECFDF5' : isUnavail ? '#FEF2F2' : '#FFFBEB',
                      border: `1px solid ${isAvail ? '#A7F3D0' : isUnavail ? '#FECACA' : '#FDE68A'}`
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>
                        {item.dosage}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 800, color: isAvail ? '#047857' : isUnavail ? '#DC2626' : '#D97706' }}>
                      {isAvail ? <CheckCircle2 size={16} /> : isUnavail ? <XCircle size={16} /> : <AlertCircle size={16} />}
                      <span>{isAvail ? 'Disponible' : isUnavail ? 'Non disponible' : 'En attente'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button
            className="btn-call"
            onClick={() => onCall(pharmacy)}
            style={{ padding: '14px' }}
          >
            <Phone size={16} />
            <span>Appeler</span>
          </button>

          <button
            className="btn-itinerary"
            onClick={() => {
              onClose();
              onOpenItinerary(pharmacy);
            }}
            style={{ padding: '14px' }}
          >
            <Navigation size={16} />
            <span>Voir l'itinéraire</span>
          </button>
        </div>
      </div>
    </div>
  );
}
