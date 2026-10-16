import { calculateDistanceKm, calculateRoadDistance, formatDistance } from './pharmacySearch.js';
import { db } from './db.js';
import { INITIAL_PHARMACIES } from '../data/mockData.js';

// Position réelle de l'utilisateur : Keur Massar Sud (Avenue Sotrac)
export const DEFAULT_FALLBACK_LOCATION = {
  latitude: 14.77906,
  longitude: -17.30422,
  name: 'Avenue Sotrac, Keur Massar Sud, Dakar',
  accuracy: 10
};

// 1. Détection de la position réelle de l'utilisateur via le GPS de l'appareil
export async function getRealUserLocation() {
  if (typeof navigator !== 'undefined' && navigator.geolocation) {
    try {
      const pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          { enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 }
        );
      });

      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      const accuracy = pos.coords.accuracy || 10;

      // Utilise directement la position GPS réelle retournée par l'appareil
      let locName = 'Position GPS actuelle';
      try {
        const revRes = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
          { headers: { 'Accept': 'application/json', 'User-Agent': 'PharmaGarde/1.0' } }
        );
        if (revRes.ok) {
          const revData = await revRes.json();
          const road = revData.address?.road || revData.address?.pedestrian || '';
          const sub = revData.address?.suburb || revData.address?.neighbourhood || revData.address?.town || revData.address?.city;
          if (road || sub) {
            locName = [road, sub].filter(Boolean).join(', ') + ', Dakar';
          }
        }
      } catch {}

      return {
        latitude: lat,
        longitude: lon,
        name: locName,
        accuracy: accuracy,
        isReal: true
      };
    } catch (err) {
      console.warn('GPS navigateur refusé ou indisponible:', err.message);
    }
  }

  // Fallback si l'utilisateur refuse l'accès GPS
  return { ...DEFAULT_FALLBACK_LOCATION, isReal: false };
}

// 2. Calcul synchrone rapide (avec facteur de détour routier réel de Dakar)
export function fetchNearbyPharmacies(userLocation = DEFAULT_FALLBACK_LOCATION) {
  const { latitude: lat, longitude: lon } = userLocation;
  const basePharmacies = INITIAL_PHARMACIES;

  const calculated = basePharmacies.map((pharmacy) => {
    const straight = calculateDistanceKm(lat, lon, pharmacy.latitude, pharmacy.longitude);
    const roadEst = Math.round(straight * 1.25 * 10) / 10;
    return {
      ...pharmacy,
      distanceKm: roadEst,
      calculatedDistanceKm: roadEst,
      formattedDistance: formatDistance(roadEst)
    };
  });

  calculated.sort((a, b) => a.calculatedDistanceKm - b.calculatedDistanceKm);
  return calculated;
}

// 3. Calcul exact par l'itinéraire routier GPS (OSRM Road Network)
export async function fetchNearbyPharmaciesRoad(userLocation = DEFAULT_FALLBACK_LOCATION) {
  const { latitude: lat, longitude: lon } = userLocation;
  const basePharmacies = INITIAL_PHARMACIES;

  const withRoads = await Promise.all(
    basePharmacies.map(async (pharmacy) => {
      const road = await calculateRoadDistance(lat, lon, pharmacy.latitude, pharmacy.longitude);
      return {
        ...pharmacy,
        distanceKm: road.distanceKm,
        calculatedDistanceKm: road.distanceKm,
        formattedDistance: road.formattedDistance,
        durationMin: road.durationMin,
        travelTimeText: road.travelTimeText
      };
    })
  );

  withRoads.sort((a, b) => a.calculatedDistanceKm - b.calculatedDistanceKm);
  return withRoads;
}

// 4. Initialisation complète avec calcul d'itinéraire routier réel
export async function initRealLocationAndPharmacies() {
  const location = await getRealUserLocation();
  // Calcule les vraies distances par la route GPS
  const pharmacies = await fetchNearbyPharmaciesRoad(location);

  // Mettre à jour la base de données avec les distances réelles
  db.setPharmacies(pharmacies);

  // L'officine la plus proche par la route
  const closest = pharmacies[0] || null;

  return {
    userLocation: location,
    pharmacies,
    activePharmacy: closest
  };
}

