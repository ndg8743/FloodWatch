import { create } from "zustand";
import { persist } from "zustand/middleware";

type ThemeMode = "light" | "dark" | "system";

interface SettingsState {
  theme: ThemeMode;
  notificationsEnabled: boolean;
  setTheme: (theme: ThemeMode) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: "system",
      notificationsEnabled: false,

      setTheme: (theme) => {
        set({ theme });
        applyTheme(theme);
      },

      setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
    }),
    {
      name: "floodwatch-settings",
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyTheme(state.theme);
        }
      },
    }
  )
);

function applyTheme(theme: ThemeMode) {
  const root = document.documentElement;
  const isDark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  if (isDark) {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

// Listen for system theme changes
if (typeof window !== "undefined") {
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    const { theme } = useSettingsStore.getState();
    if (theme === "system") {
      applyTheme("system");
    }
  });
}
