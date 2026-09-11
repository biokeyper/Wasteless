import { apiClient } from "@/api/api_client";
import ErrorBanner from "@/components/alerts/ErrorBanner";
import FormButton from "@/components/forms/FormButton";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "@/context/LocationContext";
import { itemMapsUrl, locationLabel } from "@/lib/itemLocation";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import moment from "moment";
import React, { useMemo, useState } from "react";
import { Alert, Linking, ScrollView, StyleSheet, View } from "react-native";
import {
  Appbar,
  Banner,
  Icon,
  IconButton,
  Surface,
  Text,
  TouchableRipple,
  useTheme,
} from "react-native-paper";

const RequestItemScreen = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const { getDistanceFromLatLonInMeters, currentLocation } = useLocation();
  const [showConfirmDelete, setShowConfirmDelete] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [requesting, setRequesting] = useState<boolean>(false);
  const blurhash =
    "|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[";

  const { data } = useLocalSearchParams();

  const item: any = useMemo(() => {
    try {
      return data ? JSON.parse(data.toString()) : {};
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong");
      return {};
    }
  }, [data]);

  const distance = getDistanceFromLatLonInMeters(
    item?.location?.latitude,
    item?.location?.longitude
  );
  const mapsUrl = itemMapsUrl(item?.location);

  const handleDeleteItem = async () => {
    setIsDeleting(true);
    try {
      await apiClient.delete(`/items/${item.id}`);
      Alert.alert("Success", "Item deleted successfully!");
      router.replace("/(home)");
    } catch (err: any) {
      setError(err.response.data.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleImageSwipe = (direction: "left" | "right") => {
    if (!item.images || item.images.length <= 1) return;

    if (direction === "left") {
      setActiveImageIndex((prev) =>
        prev === item.images.length - 1 ? 0 : prev + 1
      );
    } else {
      setActiveImageIndex((prev) =>
        prev === 0 ? item.images.length - 1 : prev - 1
      );
    }
  };

  const handleItemRequest = async () => {
    setRequesting(true);
    try {
      await apiClient.post(`/requests`, {
        itemId: item.id,
        userId: user?.id,
        notes: "",
        location: {
          latitude: currentLocation?.coords?.latitude,
          longitude: currentLocation?.coords?.longitude,
          accuracy: currentLocation?.coords?.accuracy,
          address: "",
          city: "",
        },
      });
      Alert.alert("Success", "Item requested successfully!");
      router.back();
    } catch (err: any) {
      if (err.status === 409) {
        setError(
          "You have already sent a request for this item, you can not request it again!"
        );
      } else {
        setError(err.message);
      }
    } finally {
      setRequesting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content
          title={item.title}
          titleStyle={{ fontFamily: "OutFitBold", fontSize: 18 }}
        />
        <Appbar.Action icon="share-variant" onPress={() => {}} />
      </Appbar.Header>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.imageContainer}>
          <Image
            source={item?.images?.[activeImageIndex]?.url}
            style={styles.image}
            placeholder={{ blurhash }}
            contentFit="cover"
            transition={1000}
          />

          {item.images?.length > 1 && (
            <>
              <View style={styles.imageNavigation}>
                <TouchableRipple
                  style={styles.navButton}
                  onPress={() => handleImageSwipe("right")}
                  borderless
                >
                  <IconButton icon="chevron-left" size={24} />
                </TouchableRipple>
                <TouchableRipple
                  style={styles.navButton}
                  onPress={() => handleImageSwipe("left")}
                  borderless
                >
                  <IconButton icon="chevron-right" size={24} />
                </TouchableRipple>
              </View>

              {/* <View style={styles.dotIndicatorContainer}>
                {item.images.map((_, index) => (
                  <DotIndicator
                    key={index}
                    size={8}
                    selected={index === activeImageIndex}
                    selectedColor={colors.primary}
                    unselectedColor={colors.onSurfaceDisabled}
                  />
                ))}
              </View> */}
            </>
          )}
        </View>

        <Surface
          style={[styles.details, { backgroundColor: colors.background }]}
          elevation={2}
        >
          <View style={styles.detailsContent}>
            <Text variant="titleMedium" style={styles.title}>
              {item.title}
            </Text>
            <Text style={styles.description}>{item.description}</Text>

            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Icon source="map-marker" size={20} />
                <Text
                  style={styles.metaText}
                  // Without the viewer's location, tapping shows the item on a map
                  onPress={
                    distance == null && mapsUrl
                      ? () => Linking.openURL(mapsUrl)
                      : undefined
                  }
                >
                  {locationLabel(item?.location, distance)}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Icon source="tag" size={20} />
                <Text style={styles.metaText}>
                  {item?.category.replace(/_/g, " ")}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Icon source="clock-outline" size={20} />
                <Text style={styles.metaText}>
                  Posted {moment(item.createdAt).fromNow()}
                </Text>
              </View>
            </View>

            {item.userId === user?.id ? (
              <View style={styles.buttonContainer}>
                <FormButton
                  mode="outlined"
                  icon={"pencil"}
                  onPress={() => {
                    router.push({
                      pathname: "/(home)/edit_item",
                      params: { data: JSON.stringify(item) },
                    });
                  }}
                  style={styles.button}
                >
                  Edit Item
                </FormButton>
                <FormButton
                  mode="outlined"
                  icon={"delete"}
                  style={styles.button}
                  onPress={() => setShowConfirmDelete(true)}
                  loading={isDeleting}
                >
                  Delete Item
                </FormButton>
              </View>
            ) : (
              <FormButton
                onPress={handleItemRequest}
                disabled={requesting}
                loading={requesting}
                style={styles.button}
              >
                Request This Item
              </FormButton>
            )}
          </View>
        </Surface>
      </ScrollView>
      <Banner
        visible={showConfirmDelete}
        actions={[
          {
            label: "Cancel",
            onPress: () => setShowConfirmDelete(false),
          },
          {
            label: "Delete Forever",
            onPress: handleDeleteItem,
            labelStyle: { color: colors.error },
            loading: isDeleting,
          },
        ]}
        icon={({ size }) => (
          <Icon
            source="alert-circle-outline"
            size={size}
            color={colors.error}
          />
        )}
        style={{ backgroundColor: colors.elevation.level0 }} // Light yellow background
      >
        <Text style={{ fontFamily: "OutFitBold" }}>
          Delete this shoe from your collection?
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: "#616161",
            marginTop: 4,
            fontFamily: "OutFitMedium",
          }}
        >
          All associated data will be permanently removed.
        </Text>
      </Banner>

      <ErrorBanner error={error} setError={setError} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 24,
  },
  imageContainer: {
    position: "relative",
  },
  image: {
    width: "100%",
    height: 300,
  },
  imageNavigation: {
    position: "absolute",
    width: "100%",
    height: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  navButton: {
    borderRadius: 50,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
  },
  dotIndicatorContainer: {
    position: "absolute",
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  details: {
    padding: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    elevation: 0,
    minHeight: "100%",
  },
  detailsContent: {
    flex: 1,
    padding: 8,
  },
  title: {
    fontFamily: "OutFitBold",
    marginBottom: 16,
    fontSize: 22,
    lineHeight: 28,
  },
  description: {
    marginBottom: 24,
    fontFamily: "OutFitRegular",
    lineHeight: 22,
    fontSize: 16,
  },
  metaRow: {
    //flexDirection: "row",
    justifyContent: "flex-start",
    gap: 2,
    marginBottom: 32,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    margin: 2,
  },
  metaText: {
    marginLeft: -8,
    fontFamily: "OutFitMedium",
    lineHeight: 22,
    fontSize: 16,
  },
  button: {
    marginTop: 16,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-evenly",
  },
});

export default RequestItemScreen;
