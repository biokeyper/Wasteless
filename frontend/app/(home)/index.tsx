import { apiClient } from "@/api/api_client";
import ItemCard from "@/components/items/ItemCard";
import VerticalItemCard from "@/components/items/VeritcalItemCard";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "@/context/LocationContext";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {
  ActivityIndicator,
  Appbar,
  Avatar,
  Button,
  FAB,
  Text,
  useTheme,
} from "react-native-paper";

const MemoizedItemCard = React.memo(ItemCard);
const MemoizedVerticalItemCard = React.memo(VerticalItemCard);

const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const errorHandler = (error: Error) => {
      console.error("Error caught in boundary:", error);
      setHasError(true);
    };

    // Add global error handlers if needed
    return () => {
      // Cleanup
    };
  }, []);

  return hasError ? null : children;
};

export default function GiveawayScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [layout, setLayout] = useState<"grid" | "list">("list");
  const [limit] = useState(10);
  const [page, setPage] = useState(0);
  const { currentLocation } = useLocation();

  const url = currentLocation
    ? `/items/location/${currentLocation?.coords.latitude}/${currentLocation?.coords.longitude}/${page}/${limit}`
    : "/items";

  const handleFetchItems = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const fetchUrl = currentLocation
        ? `/items/location/${currentLocation.coords.latitude}/${currentLocation.coords.longitude}/0/${limit}`
        : `/items`;

      const { data } = await apiClient.get(fetchUrl);
      setItems(data);
      setPage(1); // set to 1 for next page
    } catch (error) {
      setError((error as Error)?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [currentLocation, limit]);

  const handleLoadMore = useCallback(async () => {
    if (loading || items.length <= 0 || items.length % limit !== 0) return;

    try {
      setLoading(true);
      const fetchUrl = currentLocation
        ? `/items/location/${currentLocation.coords.latitude}/${currentLocation.coords.longitude}/${items.length}/${limit}`
        : `/items`;

      const { data } = await apiClient.get(fetchUrl);

      // Only append if there are new items
      if (data.length > 0) {
        setItems((prevItems) => [...prevItems, ...data]);
        if (data.length === limit) {
          setPage((prevPage) => prevPage + 1);
        }
      }
    } catch (error) {
      setError((error as Error)?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [loading, items.length, limit, page, currentLocation]);

  const handleRefresh = useCallback(() => {
    setPage(0);
    handleFetchItems();
  }, [handleFetchItems]);

  const handleChangeLayout = useCallback(() => {
    setLayout((prev) => (prev === "grid" ? "list" : "grid"));
  }, []);

  const RenderListEmpty = useCallback(
    () => (
      <View style={styles.ListEmptyContainer}>
        <View style={{ alignItems: "center", maxWidth: 300 }}>
          {error ? (
            <>
              <MaterialIcons name="error-outline" size={48} color="#ccc" />
              <Text style={styles.listEmptyText}>No items found</Text>
              <Text style={styles.listEmptySubtext}>
                We couldn&apos;t find what you&apos;re looking for.
              </Text>
              <Text style={[styles.listEmptySubtext, { color: colors.error }]}>
                Reason: {error}
              </Text>
            </>
          ) : (
            <>
              <MaterialIcons name="location-off" size={48} color="#ccc" />
              <Text style={styles.listEmptyText}>No items near you</Text>
              <Text style={styles.listEmptySubtext}>
                There are currently no items posted in your area.
              </Text>
              <Text style={styles.listEmptySubtext}>
                Check back later or be the first to share something!
              </Text>
            </>
          )}
          <Button
            onPress={handleRefresh}
            contentStyle={styles.listEmptyButtonContent}
            style={{ borderRadius: 80 }}
            mode="contained"
            labelStyle={{
              color: "#fff",
              fontFamily: "OutFitBold",
            }}
            icon="refresh"
          >
            Try Again
          </Button>
        </View>
      </View>
    ),
    [error, colors.error, handleRefresh]
  );

  useEffect(() => {
    handleFetchItems();
  }, [handleFetchItems]);

  return (
    <View style={{ flex: 1 }}>
      <Appbar.Header>
        <Appbar.Content
          title="WasteLess"
          titleStyle={{ fontFamily: "OutFitBold" }}
        />
        {/* <Appbar.Action icon="map-marker-distance" onPress={() => {}} /> */}
        <Appbar.Action
          icon={layout === "list" ? "view-grid" : "view-list"}
          onPress={handleChangeLayout}
        />
        <TouchableOpacity onPress={() => router.navigate("/(home)/profile")}>
          <Avatar.Text
            size={40}
            label={user?.displayName?.[0]?.toUpperCase() ?? "U"}
            color="#fff"
          />
        </TouchableOpacity>
      </Appbar.Header>

      <ErrorBoundary>
        <FlatList
          key={`flatlist-${layout}`}
          data={items}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item }) =>
            layout === "list" ? (
              <MemoizedItemCard item={item} />
            ) : (
              <MemoizedVerticalItemCard item={item} />
            )
          }
          numColumns={layout === "grid" ? 2 : 1}
          keyExtractor={(item) => item?.id}
          contentContainerStyle={[
            styles.container,
            items.length === 0 && { flex: 1 },
          ]}
          ListEmptyComponent={RenderListEmpty}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          windowSize={21}
          removeClippedSubviews={true}
          onEndReached={handleLoadMore}
          //onTouchEnd={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loading ? (
              <View style={styles.listFooter}>
                <ActivityIndicator />
              </View>
            ) : null
          }
          // getItemLayout={(data, index) => ({
          //   length: layout === "grid" ? 180 : 250,
          //   offset: (layout === "grid" ? 180 : 250) * index,
          //   index,
          // })}
        />
      </ErrorBoundary>

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => router.navigate("/(home)/share_item")}
        color="white"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  listFooter: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 12,
  },
  container: {
    padding: 0,
    paddingBottom: 100,
  },
  ListEmptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    alignSelf: "center",
    alignContent: "center",
  },
  listEmptyText: {
    fontSize: 18,
    marginVertical: 10,
    textAlign: "center",
    fontFamily: "OutFitBold",
  },
  listEmptySubtext: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: "center",
    fontFamily: "OutFitRegular",
  },
  listEmptyButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
    paddingHorizontal: 20,
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 24,
    borderRadius: 100,
  },
});
