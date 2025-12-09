import { useWatchlistStore } from "../stores/watchlistStore";

export function useWatchlist() {
  const {
    items,
    addToWatchlist,
    removeFromWatchlist,
    toggleAlerts,
    updateThreshold,
    isInWatchlist,
  } = useWatchlistStore();

  return {
    items,
    addToWatchlist,
    removeFromWatchlist,
    toggleAlerts,
    updateThreshold,
    isInWatchlist,
  };
}
