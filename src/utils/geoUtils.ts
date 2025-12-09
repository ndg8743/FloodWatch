export interface BoundingBox {
  west: number;
  south: number;
  east: number;
  north: number;
}

export function calculateBoundingBox(
  lat: number,
  lon: number,
  radiusKm: number
): BoundingBox {
  const latDelta = radiusKm / 111;
  const lonDelta = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));

  return {
    west: lon - lonDelta,
    south: lat - latDelta,
    east: lon + lonDelta,
    north: lat + latDelta,
  };
}

export function formatBoundingBox(bbox: BoundingBox): string {
  return `${bbox.west.toFixed(4)},${bbox.south.toFixed(4)},${bbox.east.toFixed(4)},${bbox.north.toFixed(4)}`;
}

export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
