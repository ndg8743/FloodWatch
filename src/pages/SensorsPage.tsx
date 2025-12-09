import { useNavigate } from "react-router-dom";
import { Activity } from "lucide-react";
import { useGeolocation } from "../hooks/useGeolocation";
import { useNearbyGauges } from "../hooks/useNearbyGauges";
import { SensorCard } from "../components/SensorCard";
import { BluetoothConnect } from "../components/BluetoothConnect";
import { Spinner } from "../components/ui/Spinner";
import { Card } from "../components/ui/Card";

export function SensorsPage() {
  const navigate = useNavigate();
  const { latitude, longitude } = useGeolocation();
  const { data: gauges, isLoading } = useNearbyGauges(latitude, longitude);

  return (
    <div className="pb-20">
      <header className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 z-10">
        <div className="px-4 py-3">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Sensors
          </h1>
        </div>
      </header>

      <main className="p-4 space-y-6">
        <section>
          <BluetoothConnect
            onDeviceClick={(id) => navigate(`/detail/${id}`)}
          />
        </section>

        <section>
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-5 h-5 text-risk-safe" />
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Nearby Public Gauges
            </h2>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : !gauges?.length ? (
            <Card className="text-center py-6 text-gray-500">
              No gauges found nearby
            </Card>
          ) : (
            <div className="space-y-3">
              {gauges.slice(0, 10).map((gauge) => (
                <SensorCard
                  key={gauge.id}
                  gauge={gauge}
                  onClick={() => navigate(`/detail/${gauge.id}`)}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
