import * as Location from "expo-location";
import numbro from "numbro";

type ItemLocation =
  | { latitude?: number | null; longitude?: number | null; city?: string | null; address?: string | null }
  | null
  | undefined;

export const hasCoords = (location: ItemLocation) =>
  Number.isFinite(location?.latitude) && Number.isFinite(location?.longitude);

// The area name the item was posted with (e.g. "Kololo, Kampala"); never a street address
export const itemPlace = (location: ItemLocation) =>
  location?.city?.trim() || location?.address?.trim() || null;

export const itemMapsUrl = (location: ItemLocation) =>
  hasCoords(location)
    ? `https://www.google.com/maps/search/?api=1&query=${location!.latitude},${location!.longitude}`
    : null;

export const formatDistance = (meters: number) =>
  meters < 1000
    ? `${numbro(meters).format({ thousandSeparated: true })} m away`
    : `${numbro(meters / 1000).format({ mantissa: 2 })} km away`;

// Distance when the viewer's location is known; otherwise where the item is
export const locationLabel = (location: ItemLocation, distance: number | null | undefined) =>
  distance != null
    ? formatDistance(distance)
    : itemPlace(location) ?? (hasCoords(location) ? "View on map" : "Location not shared");

// Neighbourhood and city for a point, e.g. "Kololo, Kampala". Street-level detail is left out
// so a listing doesn't reveal where the giver lives. Returns "" if the lookup fails or is slow.
export async function areaName(latitude: number, longitude: number): Promise<string> {
  try {
    const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000));
    const places = await Promise.race([Location.reverseGeocodeAsync({ latitude, longitude }), timeout]);
    const place = places?.[0];
    if (!place) return "";
    const parts = [place.district, place.city ?? place.subregion ?? place.region];
    return [...new Set(parts.filter((part): part is string => !!part))].join(", ");
  } catch {
    return "";
  }
}
