import { useColorScheme } from "@/hooks/useColorScheme";
import * as SecureStore from "expo-secure-store";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

// "system" follows the device setting; the other two override it
export type ThemePreference = "system" | "light" | "dark";

const STORAGE_KEY = "wasteless.theme";

type ThemeContextType = {
  preference: ThemePreference;
  // The scheme actually in use, once the preference is applied to the device setting
  scheme: "light" | "dark";
  setPreference: (preference: ThemePreference) => void;
  // False until the saved preference has been read, so nothing renders in the wrong theme first
  ready: boolean;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const isPreference = (value: string | null): value is ThemePreference =>
  value === "system" || value === "light" || value === "dark";

export const ThemePreferenceProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const deviceScheme = useColorScheme();
  const [preference, setStoredPreference] = useState<ThemePreference>("system");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync(STORAGE_KEY)
      .then((saved) => {
        if (isPreference(saved)) setStoredPreference(saved);
      })
      // A preference we can't read just means the device setting wins
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const setPreference = useCallback((next: ThemePreference) => {
    setStoredPreference(next);
    SecureStore.setItemAsync(STORAGE_KEY, next).catch(() => {});
  }, []);

  const value = useMemo(
    () => ({
      preference,
      scheme: preference === "system" ? deviceScheme : preference,
      setPreference,
      ready,
    }),
    [preference, deviceScheme, setPreference, ready]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useThemePreference = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error(
      "useThemePreference must be used within a ThemePreferenceProvider"
    );
  }
  return context;
};
