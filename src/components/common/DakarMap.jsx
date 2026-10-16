import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { DEFAULT_USER_LOCATION } from '../../data/mockData';
import { formatDistance } from '../../services/pharmacySearch';

function generateRoutePoints(start, end, numPoints = 35) {
  // Fallback curvature
  const midLat = (start[0] + end[0]) / 2 + 0.0012;
  const midLng = (start[1] + end[1]) / 2 - 0.0010;
  const p0 = start;
  const p1 = [midLat, midLng];
  const p2 = end;

  const points = [];
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const lat = (1 - t) * (1 - t) * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0];
    const lng = (1 - t) * (1 - t) * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1];
    points.push([lat, lng]);
  }
  return points;
}

const routeCache = new Map();

async function fetchRoadRoute(start, end, mode = 'car') {
  const cacheKey = `${mode}_${start[0].toFixed(5)},${start[1].toFixed(5)}_${end[0].toFixed(5)},${end[1].toFixed(5)}`;
  if (routeCache.has(cacheKey)) {
    return routeCache.get(cacheKey);
  }

  try {
    const profile = mode === 'walk' ? 'foot' : 'driving';
    // OSRM expects coordinates in lng,lat format
    const url = `https://router.project-osrm.org/route/v1/${profile}/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`OSRM HTTP error: ${res.status}`);
    const data = await res.json();
    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      const bestRoute = data.routes[0];
      const coords = bestRoute.geometry.coordinates;
      // Convert GeoJSON [lng, lat] to Leaflet [lat, lng]
      const points = coords.map(([lng, lat]) => [lat, lng]);
      const distanceKm = bestRoute.distance / 1000;
      const durationMinutes = Math.max(1, Math.round(bestRoute.duration / 60));
      const result = { points, distanceKm, durationMinutes };
      routeCache.set(cacheKey, result);
      return result;
    }
  } catch (err) {
    console.warn('Erreur lors du calcul de la route réelle OSRM, fallback courbe:', err);
  }

  const fallbackPoints = generateRoutePoints(start, end, 35);
  return { points: fallbackPoints, distanceKm: 0.8, durationMinutes: mode === 'walk' ? 10 : 3 };
}

export default function DakarMap({
  pharmacies = [],
  selectedPharmacyId = null,
  onSelectPharmacy = null,
  height = '240px',
  interactive = true,
  zoom = 14,
  center = null,
  userLocation = null,
  routeToPharmacy = null,
  transportMode = 'car',
  showPopups = !routeToPharmacy,
  onRouteLoaded = null
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const routeLayerRef = useRef(null);
  const routePolylineRef = useRef(null);
  const hasDrawnRouteRef = useRef(false);
  const lastPharmacyIdRef = useRef(null);
  const routeAnimTimerRef = useRef(null);

  const activeUserLoc = userLocation || DEFAULT_USER_LOCATION;
  const defaultCenter = center || [activeUserLoc.latitude, activeUserLoc.longitude];

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize Map
    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: zoom,
      zoomControl: interactive,
      dragging: interactive,
      touchZoom: interactive,
      scrollWheelZoom: false,
      attributionControl: false
    });

    // Tuiles OpenStreetMap officielles (100% gratuites, sans clé API requise)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      subdomains: ['a', 'b', 'c'],
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Layer groups
    markersLayerRef.current = L.layerGroup().addTo(map);
    routeLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    // Add User location pulsating marker
    const userIcon = L.divIcon({
      className: 'user-location-marker',
      html: `
        <div style="position: relative; width: 22px; height: 22px;">
          <div style="position: absolute; inset: -4px; border-radius: 50%; background: rgba(14, 165, 233, 0.35); animation: userPulse 2s infinite;"></div>
          <div style="position: absolute; inset: 0; border-radius: 50%; background: #0284C7; border: 2.5px solid #FFFFFF; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>
        </div>
      `,
      iconSize: [22, 22],
      iconAnchor: [11, 11]
    });

    L.marker([activeUserLoc.latitude, activeUserLoc.longitude], { icon: userIcon })
      .bindTooltip(activeUserLoc.name ? `Votre position (${activeUserLoc.name})` : 'Votre position', { direction: 'top', offset: [0, -10] })
      .addTo(map);

    // Ensure tiles render completely once container finishes modal animation
    const resizeTimer = setTimeout(() => {
      map.invalidateSize();
    }, 280);

    return () => {
      clearTimeout(resizeTimer);
      if (routeAnimTimerRef.current) {
        clearInterval(routeAnimTimerRef.current);
        routeAnimTimerRef.current = null;
      }
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update markers when pharmacies or selection change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    // Add Pharmacy Markers
    pharmacies.forEach((pharmacy) => {
      const isSelected = selectedPharmacyId === pharmacy.id;
      const isDuty = pharmacy.isDuty24h;

      const markerHtml = `
        <div style="
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: ${isSelected ? '#005F56' : isDuty ? '#065F46' : '#047857'};
          border: 2.5px solid #FFFFFF;
          box-shadow: 0 3px 8px rgba(0, 0, 0, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          cursor: pointer;
          transform: ${isSelected ? 'scale(1.2)' : 'scale(1)'};
          transition: transform 0.2s ease;
        ">
          <!-- Pharmacy Cross -->
          <div style="position: relative; width: 14px; height: 14px;">
            <div style="position: absolute; left: 4.5px; top: 0; width: 5px; height: 14px; background: #FFFFFF; border-radius: 1px;"></div>
            <div style="position: absolute; left: 0; top: 4.5px; width: 14px; height: 5px; background: #FFFFFF; border-radius: 1px;"></div>
          </div>
          ${isDuty ? '<div style="position: absolute; top: -2px; right: -2px; width: 9px; height: 9px; border-radius: 50%; background: #10B981; border: 1.5px solid #FFFFFF;"></div>' : ''}
        </div>
      `;

      const icon = L.divIcon({
        className: 'pharmacy-marker-icon',
        html: markerHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -18]
      });

      const marker = L.marker([pharmacy.latitude, pharmacy.longitude], { icon })
        .addTo(markersLayerRef.current);

      // Popup Content (only if showPopups is explicitly true)
      if (showPopups) {
        const popupHtml = `
          <div style="font-family: system-ui, -apple-system, sans-serif; padding: 4px; min-width: 170px;">
            <div style="font-weight: 800; font-size: 13px; color: #005F56; line-height: 1.2;">
              ${pharmacy.name}
            </div>
            <div style="font-size: 11px; color: #64748B; margin: 2px 0 6px;">
              📍 ${pharmacy.address} (${pharmacy.calculatedDistanceKm || pharmacy.distanceKm ? formatDistance(pharmacy.calculatedDistanceKm ?? pharmacy.distanceKm) : ''})
            </div>
            <div style="display: flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 700; color: ${pharmacy.isDuty24h ? '#059669' : '#0284C7'};">
              ${pharmacy.isDuty24h ? '● De garde' : '● Ouvert'}
            </div>
          </div>
        `;

        marker.bindPopup(popupHtml);

        if (isSelected) {
          marker.openPopup();
        }
      }

      if (onSelectPharmacy) {
        marker.on('click', () => {
          onSelectPharmacy(pharmacy);
        });
      }
    });
  }, [pharmacies, selectedPharmacyId, onSelectPharmacy, showPopups]);

  // Route drawing & progressive animation effect
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !routeLayerRef.current) return;

    if (!routeToPharmacy) {
      if (routeAnimTimerRef.current) {
        clearInterval(routeAnimTimerRef.current);
        routeAnimTimerRef.current = null;
      }
      routeLayerRef.current.clearLayers();
      routePolylineRef.current = null;
      hasDrawnRouteRef.current = false;
      lastPharmacyIdRef.current = null;
      return;
    }

    const isWalk = transportMode === 'walk';
    const lineStyle = {
      color: '#005F56',
      weight: 5,
      opacity: 0.9,
      dashArray: isWalk ? '8, 8' : null,
      lineCap: 'round',
      lineJoin: 'round'
    };

    let isCancelled = false;
    const userLatLng = [activeUserLoc.latitude, activeUserLoc.longitude];
    const targetLatLng = [routeToPharmacy.latitude, routeToPharmacy.longitude];

    fetchRoadRoute(userLatLng, targetLatLng, transportMode).then((routeData) => {
      if (isCancelled) return;
      const fullPoints = routeData.points;
      onRouteLoaded?.(routeData);

      // If target pharmacy changed, reset drawing flag so it animates for the new pharmacy
      if (lastPharmacyIdRef.current !== routeToPharmacy.id) {
        lastPharmacyIdRef.current = routeToPharmacy.id;
        hasDrawnRouteRef.current = false;
        if (routeAnimTimerRef.current) {
          clearInterval(routeAnimTimerRef.current);
          routeAnimTimerRef.current = null;
        }
        routeLayerRef.current.clearLayers();
        routePolylineRef.current = null;
      }

      // CASE 1: Already drawn -> Do NOT re-animate! Switch style (solid vs dashed) immediately
      if (hasDrawnRouteRef.current) {
        if (routePolylineRef.current) {
          routePolylineRef.current.setStyle(lineStyle);
          routePolylineRef.current.setLatLngs(fullPoints);
        } else {
          routeLayerRef.current.clearLayers();
          routePolylineRef.current = L.polyline(fullPoints, lineStyle).addTo(routeLayerRef.current);
        }
        map.fitBounds(L.latLngBounds(fullPoints), { paddingBottomLeft: [30, 52], paddingTopRight: [30, 30] });
        return;
      }

      // CASE 2: First time opening itinerary -> Progressive drawing animation!
      routeLayerRef.current.clearLayers();
      if (routeAnimTimerRef.current) {
        clearInterval(routeAnimTimerRef.current);
        routeAnimTimerRef.current = null;
      }

      if (fullPoints.length < 2) return;

      const initialPoints = [fullPoints[0], fullPoints[1]];
      const polyline = L.polyline(initialPoints, lineStyle).addTo(routeLayerRef.current);
      routePolylineRef.current = polyline;

      map.fitBounds(L.latLngBounds(fullPoints), { paddingBottomLeft: [30, 52], paddingTopRight: [30, 30] });

      let step = 1;
      const stepDuration = Math.max(10, Math.floor(650 / fullPoints.length));
      routeAnimTimerRef.current = setInterval(() => {
        step++;
        if (step >= fullPoints.length) {
          polyline.setLatLngs(fullPoints);
          if (routeAnimTimerRef.current) {
            clearInterval(routeAnimTimerRef.current);
            routeAnimTimerRef.current = null;
          }
          hasDrawnRouteRef.current = true;
        } else {
          polyline.setLatLngs(fullPoints.slice(0, step + 1));
        }
      }, stepDuration);
    });

    return () => {
      isCancelled = true;
      if (routeAnimTimerRef.current) {
        clearInterval(routeAnimTimerRef.current);
        routeAnimTimerRef.current = null;
      }
    };
  }, [routeToPharmacy, transportMode, onRouteLoaded]);

  return (
    <div style={{ position: 'relative', width: '100%', height: height, borderRadius: '16px', overflow: 'hidden' }}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%', zIndex: 1 }} />
      <style>{`
        @keyframes userPulse {
          0% { transform: scale(1); opacity: 0.8; }
          70% { transform: scale(2.2); opacity: 0; }
          100% { transform: scale(1); opacity: 0; }
        }
        .leaflet-popup-content-wrapper {
          border-radius: 12px !important;
          box-shadow: 0 4px 16px rgba(0, 40, 35, 0.18) !important;
          padding: 4px 6px !important;
        }
        .leaflet-popup-tip {
          box-shadow: 0 4px 16px rgba(0, 40, 35, 0.18) !important;
        }
      `}</style>
    </div>
  );
}
