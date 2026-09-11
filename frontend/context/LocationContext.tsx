import * as Location from "expo-location";
import { getDistance } from "geolib";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

type LocationContextType = {
  currentLocation: Location.LocationObject | null;
  locationError: string | null;
  gettingLocation: boolean;
  getCurrentLocation: () => Promise<void>;
  getDistanceFromLatLonInMeters: (
    lat2: number,
    lon2: number
  ) => number | undefined | null;
};

const LocationContext = createContext<LocationContextType | undefined>(
  undefined
);

// Update interval in milliseconds (10 minutes)
const LOCATION_UPDATE_INTERVAL = 10 * 60 * 1000;

export const LocationProvider = ({ children }: { children: ReactNode }) => {
  const [currentLocation, setCurrentLocation] =
    useState<Location.LocationObject | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [gettingLocation, setGettingLocation] = useState<boolean>(false);
  const [updateInterval, setUpdateInterval] = useState<
    ReturnType<typeof setInterval> | null
  >(null);

  const getCurrentLocation = async () => {
    setGettingLocation(true);
    setLocationError(null);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationError(
          "Permission to access location was denied. Please enable it in your device settings."
        );
        return;
      }

      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setCurrentLocation(location);
    } catch (error: any) {
      setLocationError(
        `Failed to get location: ${
          error.message || "An unknown error occurred."
        }`
      );
    } finally {
      setGettingLocation(false);
    }
  };

  // Setup location updates and interval
  useEffect(() => {
    // Get initial location
    getCurrentLocation();

    // Set up periodic updates
    const interval = setInterval(() => {
      getCurrentLocation();
    }, LOCATION_UPDATE_INTERVAL);

    setUpdateInterval(interval);

    // Cleanup on unmount
    return () => {
      if (updateInterval) {
        clearInterval(updateInterval);
      }
    };
  }, []);

  // Optional: Add background location updates for better accuracy
  useEffect(() => {
    let subscription: Location.LocationSubscription;

    const startBackgroundUpdates = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 60000, // Update every minute
          distanceInterval: 50, // Update every 50 meters
        },
        (location) => {
          setCurrentLocation(location);
        }
      );
    };

    startBackgroundUpdates();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  function getDistanceFromLatLonInMeters(
    itemLatitude: number,
    itemLongitude: number
  ): number | undefined | null {
    if (
      !currentLocation?.coords ||
      !Number.isFinite(itemLatitude) ||
      !Number.isFinite(itemLongitude)
    ) {
      return null;
    }

    const distance = getDistance(
      { latitude: itemLatitude, longitude: itemLongitude },
      {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      }
    );

    return distance;
  }

  return (
    <LocationContext.Provider
      value={{
        locationError,
        currentLocation,
        gettingLocation,
        getCurrentLocation,
        getDistanceFromLatLonInMeters,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error("useLocation must be used within a LocationProvider");
  }
  return context;
};
