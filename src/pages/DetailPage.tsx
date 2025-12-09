import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Star, Bell, MapPin } from "lucide-react";
import { useGaugeDetail } from "../hooks/useGaugeDetail";
import { useNearbyGauges } from "../hooks/useNearbyGauges";
import { useGeolocation } from "../hooks/useGeolocation";
import { useWatchlist } from "../hooks/useWatchlist";
import { Badge } from "../components/ui/Badge";
import { Card } from "../components/ui/Card";
import { Spinner } from "../components/ui/Spinner";
import { LiveChart } from "../components/LiveChart";
import { formatLevel, formatDischarge, formatRelativeTime } from "../utils/formatters";
import { riskColors } from "../utils/riskColors";
import { clsx } from "clsx";

export function DetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { latitude, longitude } = useGeolocation();
  const { data: gauges } = useNearbyGauges(latitude, longitude, 100);
  const { data: history, isLoading } = useGaugeDetail(id);
  const { addToWatchlist, removeFromWatchlist, isInWatchlist, toggleAlerts, items } = useWatchlist();

  const gauge = gauges?.find((g) => g.id === id);
  const watchlistItem = items.find((item) => item.gaugeId === id);
  const inWatchlist = isInWatchlist(id || "");

  if (!gauge) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner />
      </div>
    );
  }

  const colors = riskColors[gauge.riskLevel];

  return (
    <div className="pb-20">
      <header className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 z-10">
        <div className="px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1 -ml-1 text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white truncate flex-1">
            {gauge.name}
          </h1>
          <button
            onClick={() =>
              inWatchlist ? removeFromWatchlist(id!) : addToWatchlist(id!)
            }
            className={clsx(
              "p-2 rounded-full transition-colors",
              inWatchlist
                ? "text-yellow-500 bg-yellow-50"
                : "text-gray-400 hover:text-yellow-500"
            )}
          >
            <Star className={clsx("w-5 h-5", inWatchlist && "fill-current")} />
          </button>
        </div>
      </header>

      <main className="p-4 space-y-4">
        <Card className="text-center">
          <Badge level={gauge.riskLevel} />
          <div className={clsx("text-4xl font-bold mt-3", colors.text)}>
            {formatLevel(gauge.currentLevel)}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {gauge.trend === "rising" && "Rising"}
            {gauge.trend === "falling" && "Falling"}
            {gauge.trend === "stable" && "Stable"}
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Updated {formatRelativeTime(gauge.lastUpdated)}
          </p>
        </Card>

        <Card>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
            Statistics
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase">Discharge</p>
              <p className="text-lg font-medium">
                {formatDischarge(gauge.currentDischarge)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Risk Score</p>
              <p className="text-lg font-medium">{gauge.riskScore.toFixed(0)}/100</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Source</p>
              <p className="text-lg font-medium uppercase">{gauge.source}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Site Code</p>
              <p className="text-lg font-medium">{gauge.usgsCode || "--"}</p>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
            7-Day History
          </h3>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : (
            <LiveChart readings={history || []} height={180} />
          )}
        </Card>

        {inWatchlist && (
          <Card>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-gray-500" />
                <span className="font-medium">Push Alerts</span>
              </div>
              <button
                onClick={() => toggleAlerts(id!)}
                className={clsx(
                  "w-12 h-6 rounded-full transition-colors relative",
                  watchlistItem?.alertsEnabled ? "bg-risk-safe" : "bg-gray-300"
                )}
              >
                <span
                  className={clsx(
                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-transform",
                    watchlistItem?.alertsEnabled ? "right-1" : "left-1"
                  )}
                />
              </button>
            </div>
          </Card>
        )}

        <Card onClick={() => window.open(`https://maps.google.com/?q=${gauge.latitude},${gauge.longitude}`, "_blank")}>
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm font-medium">View on Map</p>
              <p className="text-xs text-gray-500">
                {gauge.latitude.toFixed(4)}, {gauge.longitude.toFixed(4)}
              </p>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
