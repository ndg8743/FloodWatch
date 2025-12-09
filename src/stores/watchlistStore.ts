import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { WatchlistItem } from "../types";

interface WatchlistState {
  items: WatchlistItem[];
  pushSubscription: PushSubscription | null;

  addToWatchlist: (gaugeId: string) => void;
  removeFromWatchlist: (gaugeId: string) => void;
  toggleAlerts: (gaugeId: string) => void;
  updateThreshold: (
    gaugeId: string,
    thresholds: Partial<WatchlistItem["thresholds"]>
  ) => void;
  isInWatchlist: (gaugeId: string) => boolean;
  setPushSubscription: (sub: PushSubscription | null) => void;
}

export const useWatchlistStore = create<WatchlistState>()(
  persist(
    (set, get) => ({
      items: [],
      pushSubscription: null,

      addToWatchlist: (gaugeId) =>
        set((state) => {
          if (state.items.some((item) => item.gaugeId === gaugeId)) {
            return state;
          }
          return {
            items: [
              ...state.items,
              {
                gaugeId,
                addedAt: new Date(),
                alertsEnabled: true,
                thresholds: {},
              },
            ],
          };
        }),

      removeFromWatchlist: (gaugeId) =>
        set((state) => ({
          items: state.items.filter((item) => item.gaugeId !== gaugeId),
        })),

      toggleAlerts: (gaugeId) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.gaugeId === gaugeId
              ? { ...item, alertsEnabled: !item.alertsEnabled }
              : item
          ),
        })),

      updateThreshold: (gaugeId, thresholds) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.gaugeId === gaugeId
              ? { ...item, thresholds: { ...item.thresholds, ...thresholds } }
              : item
          ),
        })),

      isInWatchlist: (gaugeId) =>
        get().items.some((item) => item.gaugeId === gaugeId),

      setPushSubscription: (sub) => set({ pushSubscription: sub }),
    }),
    {
      name: "floodwatch-watchlist",
    }
  )
);
