import { useQuery } from "@tanstack/react-query";
import { fetchRiverDischarge, fetchPrecipitation } from "../services/openMeteoApi";
import { CACHE_TIMES } from "../utils/constants";

export function useRiverDischarge(lat: number | null, lon: number | null) {
  return useQuery({
    queryKey: ["discharge", lat, lon],
    queryFn: () => fetchRiverDischarge(lat!, lon!),
    enabled: lat !== null && lon !== null,
    staleTime: CACHE_TIMES.FLOOD_FORECAST_STALE,
    gcTime: CACHE_TIMES.FLOOD_FORECAST_GC,
  });
}

export function usePrecipitation(lat: number | null, lon: number | null) {
  return useQuery({
    queryKey: ["precipitation", lat, lon],
    queryFn: () => fetchPrecipitation(lat!, lon!),
    enabled: lat !== null && lon !== null,
    staleTime: CACHE_TIMES.FLOOD_FORECAST_STALE,
    gcTime: CACHE_TIMES.FLOOD_FORECAST_GC,
  });
}
