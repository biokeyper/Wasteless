import ErrorBanner from "@/components/alerts/ErrorBanner";
import { useAuth } from "@/context/AuthContext";
import { signOut } from "@/lib/auth";
import { useRouter } from "expo-router";
import moment from "moment";
import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import {
  ActivityIndicator,
  Appbar,
  Avatar,
  Button,
  Card,
  Dialog,
  Divider,
  Icon,
  List,
  Portal,
  Text,
  useTheme,
} from "react-native-paper";

const ProfileScreen = () => {
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const { user } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await signOut();
      router.replace("/login");
    } catch (error) {
      setError((error as Error)?.message ?? "Something went wrong");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content
          title="Profile"
          titleStyle={{ fontFamily: "OutFitBold" }}
        />
        <Appbar.Action icon="cog" onPress={() => router.push("/settings")} />
        <Appbar.Action
          icon="logout"
          onPress={() => setShowLogoutDialog(true)}
        />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {user?.avatarUrl ? (
              <Avatar.Image
                source={{ uri: user.avatarUrl }}
                size={100}
              />
            ) : (
              <Avatar.Icon size={100} icon="account" color="#fff" />
            )}
            <View style={styles.verificationBadge}>
              {user?.emailVerified ? (
                <Icon
                  source="check-decagram"
                  size={20}
                  color={colors.primary}
                />
              ) : (
                <Icon source="alert-circle" size={20} color={colors.error} />
              )}
            </View>
          </View>
          <Text variant="titleLarge" style={styles.name}>
            {user?.displayName || "No name provided"}
          </Text>
          <Text style={styles.handle}>
            @{user?.username || "username"}
          </Text>
        </View>

        {/* Action Links */}
        <Card
          style={[styles.actionCard, { backgroundColor: colors.surface }]}
          mode="contained"
        >
          <Card.Title
            title="Your Activities"
            titleStyle={styles.sectionTitle}
          />
          <Card.Content>
            <Pressable onPress={() => router.push("/my-items")}>
              <List.Item
                title="My Items"
                description="Manage your items"
                titleStyle={{ fontFamily: "OutFitMedium" }}
                descriptionStyle={{ fontFamily: "OutFitRegular" }}
                left={() => <List.Icon icon="package-variant" />}
                right={() => <List.Icon icon="chevron-right" />}
              />
            </Pressable>
            <Divider />
            <Pressable onPress={() => router.push("/my-requests")}>
              <List.Item
                title="My Requests"
                description="View your incoming and outgoing requests"
                titleStyle={styles.itemTitle}
                descriptionStyle={styles.itemDescription}
                left={() => <List.Icon icon="clipboard-list-outline" />}
                right={() => <List.Icon icon="chevron-right" />}
              />
            </Pressable>
          </Card.Content>
        </Card>

        {/* Account Info */}
        <Card
          style={[styles.actionCard, { backgroundColor: colors.surface }]}
          mode="contained"
        >
          <Card.Title
            title="Account Information"
            titleStyle={styles.sectionTitle}
          />
          <Card.Content>
            <List.Item
              title="Email"
              description={user?.email || "Not provided"}
              left={() => <List.Icon icon="email" />}
              titleStyle={styles.itemTitle}
              descriptionStyle={styles.itemDescription}
            />
            <Divider />
            <List.Item
              title="Account Created"
              description={moment(user?.createdAt).format(
                "DD MMM, YYYY HH:mm A"
              )}
              titleStyle={styles.itemTitle}
              descriptionStyle={styles.itemDescription}
              left={() => <List.Icon icon="calendar" />}
            />
            <Divider />
            <List.Item
              title="Last Sign In"
              description={moment(user?.lastSignInAt ?? undefined).fromNow()}
              left={() => <List.Icon icon="clock" />}
            />
            <Divider />
            <List.Item
              title="Auth Provider"
              description={
                user?.provider?.toUpperCase() || "EMAIL"
              }
              titleStyle={styles.itemTitle}
              descriptionStyle={styles.itemDescription}
              left={() => <List.Icon icon="shield-account" />}
            />
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Logout Dialog */}
      <Portal>
        <Dialog
          visible={showLogoutDialog}
          onDismiss={() => !loggingOut && setShowLogoutDialog(false)}
          style={{ borderRadius: 12 }}
        >
          <Dialog.Icon icon="logout-variant" size={36} color={colors.error} />
          <Dialog.Title style={{ textAlign: "center", fontWeight: "bold" }}>
            Log out
          </Dialog.Title>
          <Dialog.Content>
            {loggingOut ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator animating size="small" />
                <Text variant="bodyMedium">Signing you out…</Text>
              </View>
            ) : (
              <Text variant="bodyMedium">
                Are you sure you want to log out?
              </Text>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => setShowLogoutDialog(false)}
              disabled={loggingOut}
            >
              Cancel
            </Button>
            <Button
              onPress={handleLogout}
              loading={loggingOut}
              disabled={loggingOut}
              labelStyle={{ color: colors.error }}
            >
              Log out
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <ErrorBanner error={error} setError={setError} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  profileHeader: {
    alignItems: "center",
  },
  avatarContainer: {
    position: "relative",
  },
  verificationBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 2,
  },
  name: {
    marginTop: 8,
    fontFamily: "OutFitBold",
    fontSize: 22,
  },
  handle: {
    fontSize: 16,
    fontFamily: "OutFitRegular",
  },
  sectionTitle: {
    fontFamily: "OutFitBold",
    fontSize: 16,
  },
  infoCard: {
    borderRadius: 12,
  },
  actionCard: {
    borderRadius: 12,
  },
  itemTitle: {
    fontFamily: "OutFitMedium",
  },
  itemDescription: {
    fontFamily: "OutFitRegular",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
  },
});

export default ProfileScreen;
