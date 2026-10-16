import React, { useState } from 'react';
import { X, Navigation, ExternalLink, Car, Footprints, MapPin } from 'lucide-react';
import DakarMap from '../common/DakarMap';
import { formatDistance } from '../../services/pharmacySearch';

export default function ItineraryModal({ pharmacy, userLocation, onClose }) {
  const [transportMode, setTransportMode] = useState('car'); // 'car' | 'walk'
  const [isNavigating, setIsNavigating] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [routeInfo, setRouteInfo] = useState(null);

  if (!pharmacy) return null;

  const distanceKm = routeInfo ? routeInfo.distanceKm : (pharmacy.calculatedDistanceKm || 0.8);
  const carMinutes = routeInfo && transportMode === 'car' ? routeInfo.durationMinutes : Math.max(2, Math.round(distanceKm * 3.5));
  const walkMinutes = routeInfo && transportMode === 'walk' ? routeInfo.durationMinutes : Math.max(5, Math.round(distanceKm * 12));

  const handleClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 280);
  };

  const handleExternalMaps = (service = 'google') => {
    const travelMode = transportMode === 'walk' ? 'walking' : 'driving';
    if (service === 'waze') {
      const wazeUrl = `https://waze.com/ul?ll=${pharmacy.latitude},${pharmacy.longitude}&navigate=yes`;
      window.open(wazeUrl, '_blank');
      return;
    }

    // Google Maps:
    // Important: we specify the exact pharmacy name and address/zone in destination so Google Maps sets the destination to the PHARMACY,
    // avoiding reverse-geocoding coordinates to random adjacent shops/businesses (e.g. Mondial Business Xlp)
    const cleanAddress = pharmacy.address || '';
    const destQuery = `${pharmacy.name}, ${cleanAddress}, Keur Massar, Dakar`;
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destQuery)}&travelmode=${travelMode}&dir_action=navigate`;
    window.open(googleMapsUrl, '_blank');
  };

  const handleOpenGpsPin = () => {
    // Exact GPS pin with pharmacy name label
    const pinUrl = `https://www.google.com/maps?q=${pharmacy.latitude},${pharmacy.longitude}+(${encodeURIComponent(pharmacy.name)})`;
    window.open(pinUrl, '_blank');
  };

  return (
    <div
      onClick={handleClose}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 120,
        backgroundColor: 'rgba(10, 30, 26, 0.55)',
        backdropFilter: 'blur(3px)',
        WebkitBackdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        borderRadius: 'inherit',
        overflow: 'hidden',
        transition: 'opacity 0.28s cubic-bezier(0.32, 0, 0.67, 0)',
        opacity: isClosing ? 0 : 1,
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#FFFFFF',
          width: '100%',
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          padding: '20px 20px 24px',
          maxHeight: '92%',
          overflowY: 'auto',
          boxShadow: '0 -10px 30px rgba(0, 0, 0, 0.15)',
          transform: isClosing ? 'translateY(100%)' : 'translateY(0)',
          transition: isClosing
            ? 'transform 0.28s cubic-bezier(0.32, 0, 0.67, 0)'
            : 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          animation: isClosing ? 'none' : 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              ITINÉRAIRE EN TEMPS RÉEL
            </div>
            <h2 style={{ fontSize: '19px', color: 'var(--color-text-main)', marginTop: '2px', lineHeight: 1.25 }}>
              {pharmacy.name}
            </h2>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              📍 {pharmacy.address}
            </div>
          </div>

          <button
            onClick={handleClose}
            aria-label="Fermer l'itinéraire"
            style={{
              background: '#F1F5F9',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748B',
              border: 'none',
              cursor: 'pointer',
              flexShrink: 0
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Transport Mode Switcher (Icons previously used: Car & Footprints) */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            background: '#F1F5F5',
            padding: '4px',
            borderRadius: '999px',
            marginTop: '12px'
          }}
        >
          <button
            type="button"
            onClick={() => setTransportMode('car')}
            title="Voiture / Taxi"
            aria-label="Voiture ou Taxi"
            style={{
              flex: 1,
              padding: '10px 0',
              borderRadius: '999px',
              background: transportMode === 'car' ? '#FFFFFF' : 'transparent',
              color: transportMode === 'car' ? 'var(--color-primary-dark, #005F56)' : '#64748B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: transportMode === 'car' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <Car size={20} strokeWidth={2.2} />
          </button>

          <button
            type="button"
            onClick={() => setTransportMode('walk')}
            title="À pied"
            aria-label="À pied"
            style={{
              flex: 1,
              padding: '10px 0',
              borderRadius: '999px',
              background: transportMode === 'walk' ? '#FFFFFF' : 'transparent',
              color: transportMode === 'walk' ? 'var(--color-primary-dark, #005F56)' : '#64748B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: transportMode === 'walk' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <Footprints size={20} strokeWidth={2.2} />
          </button>
        </div>

        {/* Route Visual Map Canvas */}
        <div
          style={{
            height: '210px',
            borderRadius: '16px',
            marginTop: '14px',
            position: 'relative',
            overflow: 'hidden',
            border: '1px solid var(--color-border)'
          }}
        >
          <DakarMap
            pharmacies={[pharmacy]}
            selectedPharmacyId={pharmacy.id}
            routeToPharmacy={pharmacy}
            userLocation={userLocation}
            transportMode={transportMode}
            showPopups={false}
            height="210px"
            zoom={14}
            interactive={true}
            onRouteLoaded={(data) => setRouteInfo(data)}
          />

          {/* ETA Floating badge */}
          <div
            style={{
              position: 'absolute',
              bottom: '10px',
              left: '12px',
              background: '#042723',
              color: '#FFFFFF',
              padding: '6px 12px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              zIndex: 10
            }}
          >
            <Navigation size={13} color="var(--color-mint)" />
            <span>
              {transportMode === 'car' ? `${carMinutes} min (${formatDistance(distanceKm)})` : `${walkMinutes} min à pied`}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
          <button
            className="btn-primary"
            onClick={() => setIsNavigating(!isNavigating)}
            style={{
              borderRadius: '999px',
              padding: '13px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: 700
            }}
          >
            <Navigation size={18} />
            <span>{isNavigating ? 'Guidage en cours...' : 'Démarrer le guidage PharmaGarde'}</span>
          </button>

          <button
            onClick={() => handleExternalMaps('google')}
            style={{
              background: '#007A6C',
              color: '#FFFFFF',
              border: 'none',
              padding: '13px 18px',
              borderRadius: '999px',
              fontSize: '13px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0, 122, 108, 0.25)'
            }}
          >
            <ExternalLink size={16} />
            <span>Itinéraire Google Maps ({pharmacy.name})</span>
          </button>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => handleExternalMaps('waze')}
              style={{
                flex: 1,
                background: '#F1F5F9',
                color: 'var(--color-primary-dark)',
                border: '1px solid var(--color-border)',
                padding: '10px',
                borderRadius: '999px',
                fontSize: '12px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                cursor: 'pointer'
              }}
            >
              <Navigation size={13} />
              <span>Ouvrir Waze</span>
            </button>

            <button
              type="button"
              onClick={handleOpenGpsPin}
              style={{
                flex: 1,
                background: '#F1F5F9',
                color: 'var(--color-primary-dark)',
                border: '1px solid var(--color-border)',
                padding: '10px',
                borderRadius: '999px',
                fontSize: '12px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                cursor: 'pointer'
              }}
            >
              <MapPin size={13} />
              <span>Repère GPS direct</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
