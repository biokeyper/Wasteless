import { useAuth } from "@/context/AuthContext";
import { LocationProvider } from "@/context/LocationContext";
import { Redirect, Stack } from "expo-router";
import React from "react";
import { useTheme } from "react-native-paper";
const HomeLayout = () => {
  const { colors } = useTheme();
  const { session, initializing } = useAuth();

  // Signed out (or the session was rejected on refresh): back to login
  if (!initializing && !session) {
    return <Redirect href="/login" />;
  }

  return (
    <LocationProvider>
      <Stack
        screenOptions={{
          headerTitleStyle: { fontFamily: "OutFitBold" },
          headerStyle: { backgroundColor: colors.background },
          animation: "ios_from_right",
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="profile" options={{ headerShown: false }} />
        <Stack.Screen name="my-requests" options={{ headerShown: false }} />
        <Stack.Screen
          name="request-details"
          options={{ headerShown: true, title: "Request Details" }}
        />
        <Stack.Screen name="my-items" options={{ headerShown: false }} />
        <Stack.Screen
          name="share_item"
          options={{ headerShown: false, animation: "slide_from_bottom" }}
        />
        <Stack.Screen name="edit_item" options={{ headerShown: false }} />
        <Stack.Screen
          name="request_item"
          options={{ headerShown: false, animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="settings"
          options={{ headerShown: true, title: "Settings" }}
        />
      </Stack>
    </LocationProvider>
  );
};

export default HomeLayout;
