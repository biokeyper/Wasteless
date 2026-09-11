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
