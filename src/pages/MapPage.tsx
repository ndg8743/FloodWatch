import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import { Navigation, Plus } from "lucide-react";
import { useGeolocation } from "../hooks/useGeolocation";
import { useNearbyGauges } from "../hooks/useNearbyGauges";
import { useWatchlist } from "../hooks/useWatchlist";
import { riskColors } from "../utils/riskColors";
import { formatLevel } from "../utils/formatters";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { DEFAULT_MAP_CENTER } from "../utils/constants";
import "leaflet/dist/leaflet.css";

function LocationButton() {
  const map = useMap();
  const { latitude, longitude } = useGeolocation();

  const handleClick = () => {
    if (latitude && longitude) {
      map.flyTo([latitude, longitude], 10);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="absolute bottom-24 right-4 z-[1000] bg-white dark:bg-gray-800 p-3 rounded-full shadow-lg"
    >
      <Navigation className="w-5 h-5 text-gray-700 dark:text-gray-300" />
    </button>
  );
}

export function MapPage() {
  const navigate = useNavigate();
  const { latitude, longitude } = useGeolocation();
  const { data: gauges } = useNearbyGauges(latitude, longitude, 100);
  const { addToWatchlist, isInWatchlist } = useWatchlist();

  const center = latitude && longitude
    ? [latitude, longitude] as [number, number]
    : [DEFAULT_MAP_CENTER.lat, DEFAULT_MAP_CENTER.lng] as [number, number];

  return (
    <div className="h-screen pb-16">
      <MapContainer
        center={center}
        zoom={latitude ? 9 : DEFAULT_MAP_CENTER.zoom}
        className="h-full w-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {gauges?.map((gauge) => (
          <CircleMarker
            key={gauge.id}
            center={[gauge.latitude, gauge.longitude]}
            radius={8}
            pathOptions={{
              fillColor: riskColors[gauge.riskLevel].hex,
              fillOpacity: 0.9,
              color: "#fff",
              weight: 2,
            }}
          >
            <Popup>
              <div className="min-w-[200px]">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-sm">{gauge.name}</h3>
                  <Badge level={gauge.riskLevel} size="sm" />
                </div>
                <p className="text-lg font-bold mb-2">
                  {formatLevel(gauge.currentLevel)}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => navigate(`/detail/${gauge.id}`)}
                  >
                    Details
                  </Button>
                  {!isInWatchlist(gauge.id) && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => addToWatchlist(gauge.id)}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Watch
                    </Button>
                  )}
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}

        <LocationButton />
      </MapContainer>
    </div>
  );
}
