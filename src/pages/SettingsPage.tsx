import { Moon, Sun, Monitor, Bell, Info } from "lucide-react";
import { Card } from "../components/ui/Card";
import { useSettingsStore } from "../stores/settingsStore";
import { clsx } from "clsx";

type ThemeMode = "light" | "dark" | "system";

const themeOptions: { value: ThemeMode; label: string; icon: typeof Moon }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export function SettingsPage() {
  const { theme, setTheme, notificationsEnabled, setNotificationsEnabled } = useSettingsStore();

  const handleNotificationToggle = async () => {
    if (!notificationsEnabled) {
      if ("Notification" in window) {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          setNotificationsEnabled(true);
        }
      }
    } else {
      setNotificationsEnabled(false);
    }
  };

  return (
    <div className="pb-20">
      <header className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 z-10">
        <div className="px-4 py-3">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Settings
          </h1>
        </div>
      </header>

      <main className="p-4 space-y-4">
        <Card>
          <div className="flex items-center gap-3 mb-3">
            <Moon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <p className="font-medium text-gray-900 dark:text-white">Appearance</p>
          </div>
          <div className="flex gap-2">
            {themeOptions.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={clsx(
                  "flex-1 flex flex-col items-center gap-1.5 py-3 px-2 rounded-lg border-2 transition-colors",
                  theme === value
                    ? "border-risk-safe bg-emerald-50 dark:bg-emerald-900/20"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                )}
              >
                <Icon className={clsx(
                  "w-5 h-5",
                  theme === value ? "text-risk-safe" : "text-gray-500"
                )} />
                <span className={clsx(
                  "text-sm",
                  theme === value ? "text-risk-safe font-medium" : "text-gray-600 dark:text-gray-400"
                )}>
                  {label}
                </span>
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Push Notifications</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Get alerts for watched gauges</p>
              </div>
            </div>
            <button
              onClick={handleNotificationToggle}
              className={clsx(
                "w-12 h-6 rounded-full transition-colors relative",
                notificationsEnabled ? "bg-risk-safe" : "bg-gray-300"
              )}
            >
              <span
                className={clsx(
                  "absolute top-1 w-4 h-4 bg-white rounded-full transition-transform",
                  notificationsEnabled ? "right-1" : "left-1"
                )}
              />
            </button>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <Info className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <div className="flex-1">
              <p className="font-medium text-gray-900 dark:text-white">About</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">FloodWatch v1.0.0</p>
            </div>
          </div>
        </Card>

        <div className="text-center text-xs text-gray-400 mt-8">
          <p>Data sources: USGS, Open-Meteo</p>
          <p className="mt-1">Made with care for flood awareness</p>
        </div>
      </main>
    </div>
  );
}
