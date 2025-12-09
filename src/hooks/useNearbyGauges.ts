import { useQuery } from "@tanstack/react-query";
import { fetchUSGSByBoundingBox } from "../services/usgsApi";
import { CACHE_TIMES } from "../utils/constants";

export function useNearbyGauges(
  lat: number | null,
  lon: number | null,
  radiusKm = 50
) {
  return useQuery({
    queryKey: ["gauges", "nearby", lat, lon, radiusKm],
    queryFn: () => fetchUSGSByBoundingBox(lat!, lon!, radiusKm),
    enabled: lat !== null && lon !== null,
    staleTime: CACHE_TIMES.GAUGES_STALE,
    gcTime: CACHE_TIMES.GAUGES_GC,
  });
}
