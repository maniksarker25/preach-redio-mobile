import * as Location from 'expo-location';
import type { GeoPoint } from '@/types/models';

export interface ResolvedPlace {
  address: string;
  location: GeoPoint;
}

const point = (longitude: number, latitude: number): GeoPoint => ({ type: 'Point', coordinates: [longitude, latitude] });

/** "Lagos, Nigeria" from a reverse-geocoded address (falls back to coordinates). */
const label = (a: Location.LocationGeocodedAddress | undefined, lat: number, lng: number) => {
  const parts = [a?.city ?? a?.subregion ?? a?.district, a?.country].filter(Boolean);
  return parts.length ? parts.join(', ') : `${lat.toFixed(3)}, ${lng.toFixed(3)}`;
};

export class LocationPermissionError extends Error {
  constructor() {
    super('Allow location access, or type the city and country.');
    this.name = 'LocationPermissionError';
  }
}

/** The device's current place. Throws `LocationPermissionError` when access is denied. */
export const currentPlace = async (): Promise<ResolvedPlace> => {
  const { granted } = await Location.requestForegroundPermissionsAsync();
  if (!granted) throw new LocationPermissionError();
  // City-level accuracy is all a message's location needs, and it's much faster.
  const pos = (await Location.getLastKnownPositionAsync({ maxAge: 10 * 60_000 })) ?? (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
  const { latitude, longitude } = pos.coords;
  let address: Location.LocationGeocodedAddress | undefined;
  try {
    [address] = await Location.reverseGeocodeAsync({ latitude, longitude });
  } catch {
    // Geocoding is best-effort; coordinates alone are enough for the API.
  }
  return { address: label(address, latitude, longitude), location: point(longitude, latitude) };
};

/** Coordinates for a typed place ("Accra, Ghana"); undefined when it can't be found. */
export const geocodePlace = async (address: string): Promise<GeoPoint | undefined> => {
  try {
    // Android's geocoder needs location permission too.
    await Location.requestForegroundPermissionsAsync();
    const [hit] = await Location.geocodeAsync(address);
    return hit ? point(hit.longitude, hit.latitude) : undefined;
  } catch {
    return undefined;
  }
};
