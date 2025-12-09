import { NavLink } from "react-router-dom";
import { clsx } from "clsx";
import { Home, Map, Activity, Star, Settings } from "lucide-react";

const navItems = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/map", icon: Map, label: "Map" },
  { to: "/sensors", icon: Activity, label: "Sensors" },
  { to: "/watchlist", icon: Star, label: "Watchlist" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 safe-area-bottom">
      <div className="flex justify-around items-center h-16">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx(
                "flex flex-col items-center justify-center w-full h-full gap-1 text-xs transition-colors",
                isActive
                  ? "text-risk-safe"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              )
            }
          >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
