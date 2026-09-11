import React, { createContext, useContext, useEffect, useState } from "react";
import { getDistance } from "geolib";

type Coords = {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number | null;
};
interface LocationData {
  timestamp;
  coords: Coords | null;
}

type LocationContextType = {
  currentLocation: LocationData | null;
  locationError: string | null;
  gettingLocation: boolean;
  getDistanceFromLatLonInMeters: (
    lat2: number,
    lon2: number
  ) => number | undefined | null;
};

const LocationContext = createContext<LocationContextType | undefined>(
  undefined
);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentLocation, setCurrentLocation] = useState<LocationData>({
    timestamp: null,
    coords: null,
  });
  const [locationError, setLocationError] = useState<string | null>(null);
  const [gettingLocation, setGettingLocation] = useState<boolean>(false);

  useEffect(() => {
    if (!navigator.geolocation) {
      setCurrentLocation({
        coords: null,
        timestamp: null,
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation({
          coords: position.coords,
          timestamp: position.timestamp,
        });
      },
      (error) => {
        setCurrentLocation({
          coords: null,
          timestamp: null,
        });
      }
    );
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
        currentLocation,
        locationError,
        gettingLocation,
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
