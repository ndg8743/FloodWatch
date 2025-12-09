import { useQuery } from "@tanstack/react-query";
import { fetchUSGSGaugeHistory } from "../services/usgsApi";
import { CACHE_TIMES } from "../utils/constants";

export function useGaugeDetail(siteId: string | undefined, days = 7) {
  return useQuery({
    queryKey: ["gauge", "history", siteId, days],
    queryFn: () => fetchUSGSGaugeHistory(siteId!, days),
    enabled: !!siteId,
    staleTime: CACHE_TIMES.GAUGES_STALE,
    gcTime: CACHE_TIMES.GAUGES_GC,
  });
}
