import { useNavigate } from "react-router-dom";
import { Star, Bell, Trash2 } from "lucide-react";
import { useWatchlist } from "../hooks/useWatchlist";
import { useNearbyGauges } from "../hooks/useNearbyGauges";
import { useGeolocation } from "../hooks/useGeolocation";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { formatLevel } from "../utils/formatters";
import { clsx } from "clsx";

export function WatchlistPage() {
  const navigate = useNavigate();
  const { items, removeFromWatchlist, toggleAlerts } = useWatchlist();
  const { latitude, longitude } = useGeolocation();
  const { data: gauges } = useNearbyGauges(latitude, longitude, 200);

  const watchedGauges = items
    .map((item) => ({
      ...item,
      gauge: gauges?.find((g) => g.id === item.gaugeId),
    }))
    .filter((item) => item.gauge);

  return (
    <div className="pb-20">
      <header className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 z-10">
        <div className="px-4 py-3">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Watchlist
          </h1>
        </div>
      </header>

      <main className="p-4">
        {watchedGauges.length === 0 ? (
          <Card className="text-center py-12">
            <Star className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No gauges in watchlist</p>
            <p className="text-sm text-gray-400 mt-1">
              Add gauges from the map or sensors page
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {watchedGauges.map(({ gauge, alertsEnabled, gaugeId }) => (
              <Card
                key={gaugeId}
                onClick={() => navigate(`/detail/${gaugeId}`)}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                        {gauge!.name}
                      </h3>
                      <Badge level={gauge!.riskLevel} size="sm" />
                    </div>
                    <p className="text-2xl font-bold mt-1">
                      {formatLevel(gauge!.currentLevel)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleAlerts(gaugeId);
                    }}
                    className={clsx(
                      "flex items-center gap-1.5 text-sm",
                      alertsEnabled ? "text-risk-safe" : "text-gray-400"
                    )}
                  >
                    <Bell className="w-4 h-4" />
                    {alertsEnabled ? "Alerts On" : "Alerts Off"}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromWatchlist(gaugeId);
                    }}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
