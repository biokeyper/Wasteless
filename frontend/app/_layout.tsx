import { AuthProvider } from "@/context/AuthContext";
import {
  ThemePreferenceProvider,
  useThemePreference,
} from "@/context/ThemeContext";
import { useFonts } from "expo-font";
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import {
  MD3DarkTheme,
  DefaultTheme as PaperDefaultTheme,
  PaperProvider,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

const AppLightTheme = {
  ...PaperDefaultTheme,
  colors: {
    ...PaperDefaultTheme.colors,
    primary: "#617AFA",
  },
};

const AppDarkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: "#617AFA",
    background: "#0C0C1E",
    surface: "#0C0C1E",
  },
};

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    SpaceMonoBold: require("../assets/fonts/SpaceMono-Bold.ttf"),
    OutFitBold: require("../assets/fonts/Outfit-Bold.ttf"),
    OutFitRegular: require("../assets/fonts/Outfit-Regular.ttf"),
    OutFitMedium: require("../assets/fonts/Outfit-Medium.ttf"),
    OutFitLight: require("../assets/fonts/Outfit-Light.ttf"),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <ThemePreferenceProvider>
      <App />
    </ThemePreferenceProvider>
  );
}

function App() {
  const { scheme, ready } = useThemePreference();

  // Waiting on the saved theme, so the app never flashes in the one it isn't set to
  if (!ready) {
    return null;
  }

  const dark = scheme === "dark";
  const paperTheme = dark ? AppDarkTheme : AppLightTheme;

  return (
    <PaperProvider theme={paperTheme}>
      <ThemeProvider value={dark ? DarkTheme : DefaultTheme}>
        <AuthProvider>
          {/* Android draws behind the navigation bar, so screens are inset to clear it */}
          <SafeAreaView
            style={{ flex: 1, backgroundColor: paperTheme.colors.background }}
            edges={["bottom"]}
          >
            <Stack>
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(home)" options={{ headerShown: false }} />
              <Stack.Screen name="+not-found" />
            </Stack>
          </SafeAreaView>
        </AuthProvider>
        <StatusBar style={dark ? "light" : "dark"} />
      </ThemeProvider>
    </PaperProvider>
  );
}
