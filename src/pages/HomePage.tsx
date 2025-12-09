import { useNavigate } from "react-router-dom";
import { MapPin, TrendingUp, Radio } from "lucide-react";
import { useGeolocation } from "../hooks/useGeolocation";
import { useNearbyGauges } from "../hooks/useNearbyGauges";
import { useBluetoothSensors } from "../hooks/useBluetoothSensors";
import { SensorCard } from "../components/SensorCard";
import { Spinner } from "../components/ui/Spinner";
import { Card } from "../components/ui/Card";

export function HomePage() {
  const navigate = useNavigate();
  const { latitude, longitude, loading: geoLoading } = useGeolocation();
  const { data: gauges, isLoading, error } = useNearbyGauges(latitude, longitude);
  const { devices: connectedSensors } = useBluetoothSensors();

  const risingGauges = gauges
    ?.filter((g) => g.trend === "rising" || g.riskLevel !== "safe")
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 5);

  return (
    <div className="pb-20">
      <header className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 z-10">
        <div className="px-4 py-3">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            FloodWatch
          </h1>
        </div>
      </header>

      <main className="p-4 space-y-6">
        <Card
          onClick={() => navigate("/map")}
          className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white"
        >
          <div className="flex items-center gap-3">
            <MapPin className="w-8 h-8 opacity-80" />
            <div>
              <h2 className="font-semibold">Explore Map</h2>
              <p className="text-sm text-emerald-100">
                View gauges worldwide
              </p>
            </div>
          </div>
        </Card>

        <section>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-risk-warning" />
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Rising Near You
            </h2>
          </div>

          {geoLoading || isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : error ? (
            <Card className="text-center py-6 text-gray-500">
              <p>Unable to load nearby gauges</p>
              <p className="text-sm mt-1">{String(error)}</p>
            </Card>
          ) : risingGauges?.length === 0 ? (
            <Card className="text-center py-6 text-gray-500">
              <p>No rising gauges nearby</p>
              <p className="text-sm mt-1">All clear in your area</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {risingGauges?.map((gauge) => (
                <SensorCard
                  key={gauge.id}
                  gauge={gauge}
                  onClick={() => navigate(`/detail/${gauge.id}`)}
                />
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center gap-2 mb-3">
            <Radio className="w-5 h-5 text-risk-safe" />
            <h2 className="font-semibold text-gray-900 dark:text-white">
              My Sensors
            </h2>
          </div>
          {connectedSensors.length === 0 ? (
            <Card
              onClick={() => navigate("/sensors")}
              className="text-center py-6 text-gray-500 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <p>No ESP32 sensors connected</p>
              <p className="text-sm mt-1">Tap to connect a sensor</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {connectedSensors.map((sensor) => (
                <SensorCard
                  key={sensor.id}
                  gauge={sensor}
                  onClick={() => navigate(`/detail/${sensor.id}`)}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
