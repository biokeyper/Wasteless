import { AuthProvider } from "@/context/AuthContext";
import { useFonts } from "expo-font";
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/useColorScheme";
import {
  MD3DarkTheme,
  DefaultTheme as PaperDefaultTheme,
  PaperProvider,
} from "react-native-paper";
export default function RootLayout() {
  const colorScheme = useColorScheme();
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

  return (
    <PaperProvider
      theme={colorScheme === "dark" ? AppDarkTheme : AppLightTheme}
    >
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <AuthProvider>
          <Stack>
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(home)" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
          </Stack>
        </AuthProvider>
        <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      </ThemeProvider>
    </PaperProvider>
  );
}
