import ErrorBanner from "@/components/alerts/ErrorBanner";
import SuccessBanner from "@/components/alerts/SuccessBanner";
import { HELP_URL } from "@/constants/contact";
import { useAuth } from "@/context/AuthContext";
import { useThemePreference } from "@/context/ThemeContext";
import { apiErrorMessage, deleteAccount, exportAccountData } from "@/lib/account";
import { useRouter } from "expo-router";
import { openBrowserAsync } from "expo-web-browser";
import React, { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import {
  Button,
  Dialog,
  Divider,
  Icon,
  List,
  Portal,
  Switch,
  Text,
  TouchableRipple,
  useTheme,
} from "react-native-paper";

type SettingsItem = {
  title: string;
  description?: string;
  icon: string;
  action?: React.ReactNode;
  onPress?: () => void;
};

const Settings = () => {
  const { colors } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { preference, scheme, setPreference } = useThemePreference();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // Google accounts have no password on this side to change
  const hasPassword = user?.provider === "email";

  const handleExport = async () => {
    setExporting(true);
    setError(null);
    try {
      const { shared } = await exportAccountData();
      if (!shared) {
        setSuccess("Your data was saved to this device.");
      }
    } catch (e) {
      setError(apiErrorMessage(e, "Couldn't export your data. Please try again."));
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    setConfirmingDelete(false);
    setDeleting(true);
    setError(null);
    try {
      // Signing out leaves no session, and the home layout sends the user back to login
      await deleteAccount();
    } catch (e) {
      setError(apiErrorMessage(e, "Couldn't delete your account. Please try again."));
      setDeleting(false);
    }
  };

  const settingsSections: { title: string; icon: string; items: SettingsItem[] }[] = [
    {
      title: "Preferences",
      icon: "tune",
      items: [
        {
          title: "Dark Mode",
          icon: "weather-night",
          action: (
            <Switch
              value={scheme === "dark"}
              onValueChange={(on) => setPreference(on ? "dark" : "light")}
            />
          ),
        },
        {
          title: "Match device theme",
          description:
            preference === "system"
              ? "Following your device's light or dark setting"
              : "Using the app's own setting",
          icon: "cellphone-cog",
          action: (
            <Switch
              value={preference === "system"}
              onValueChange={(on) => setPreference(on ? "system" : scheme)}
            />
          ),
        },
      ],
    },
    {
      title: "Account",
      icon: "shield-lock",
      items: [
        hasPassword
          ? {
              title: "Change Password",
              icon: "key",
              action: <Icon source="chevron-right" size={20} />,
              onPress: () => router.push("/change_password"),
            }
          : {
              title: "Sign-in method",
              description: "You sign in with Google, so there's no password to change",
              icon: "google",
            },
        {
          title: "Signed in as",
          description: user?.email ?? undefined,
          icon: "account",
        },
      ],
    },
    {
      title: "Support",
      icon: "help-circle",
      items: [
        {
          title: "Help Center",
          icon: "help",
          action: <Icon source="open-in-new" size={20} />,
          onPress: () => openBrowserAsync(HELP_URL),
        },
        {
          title: "Contact Us",
          icon: "email",
          action: <Icon source="chevron-right" size={20} />,
          onPress: () => router.push("/contact"),
        },
        {
          title: "About App",
          icon: "information",
          action: <Icon source="chevron-right" size={20} />,
          onPress: () => router.push("/about"),
        },
      ],
    },
  ];

  return (
    <>
      <ErrorBanner error={error} setError={setError} />
      <SuccessBanner success={success} setSuccess={setSuccess} />
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { backgroundColor: colors.background },
        ]}
      >
        {settingsSections.map((section) => (
          <View key={section.title} style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Icon source={section.icon} size={20} color={colors.primary} />
              <Text
                variant="titleSmall"
                style={[styles.sectionTitle, { color: colors.primary }]}
              >
                {section.title}
              </Text>
            </View>

            <View
              style={[
                styles.sectionCard,
                { backgroundColor: colors.elevation.level1 },
              ]}
            >
              {section.items.map((item, itemIndex) => (
                <React.Fragment key={item.title}>
                  <TouchableRipple onPress={item.onPress} disabled={!item.onPress}>
                    <List.Item
                      title={item.title}
                      description={item.description}
                      descriptionNumberOfLines={3}
                      left={(props) => <List.Icon {...props} icon={item.icon} />}
                      right={() => item.action}
                      titleStyle={styles.titleStyle}
                      descriptionStyle={styles.descriptionStyle}
                    />
                  </TouchableRipple>
                  {itemIndex < section.items.length - 1 && (
                    <Divider style={styles.divider} />
                  )}
                </React.Fragment>
              ))}
            </View>
          </View>
        ))}

        <View style={styles.bottomActions}>
          <Button
            mode="outlined"
            icon="export"
            style={styles.exportButton}
            loading={exporting}
            disabled={exporting || deleting}
            onPress={handleExport}
          >
            Export Data
          </Button>
          <Button
            mode="outlined"
            icon="delete"
            style={styles.deleteButton}
            textColor={colors.error}
            loading={deleting}
            disabled={exporting || deleting}
            onPress={() => setConfirmingDelete(true)}
          >
            Delete Account
          </Button>
        </View>
      </ScrollView>

      <Portal>
        <Dialog
          visible={confirmingDelete}
          onDismiss={() => setConfirmingDelete(false)}
        >
          <Dialog.Title style={styles.titleStyle}>Delete your account?</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.dialogText}>
              This permanently removes your account, the items you&apos;ve posted and the
              requests you&apos;ve made. It can&apos;t be undone.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => setConfirmingDelete(false)}
              labelStyle={styles.titleStyle}
            >
              Cancel
            </Button>
            <Button
              onPress={handleDelete}
              textColor={colors.error}
              labelStyle={styles.titleStyle}
            >
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 32,
    flexGrow: 1,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    paddingLeft: 8,
  },
  sectionTitle: {
    marginLeft: 8,
    fontFamily: "OutFitBold",
  },
  sectionCard: {
    borderRadius: 12,
    overflow: "hidden",
    elevation: 1,
  },
  divider: {
    marginHorizontal: 16,
  },
  bottomActions: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  exportButton: {
    flex: 1,
    marginRight: 8,
    borderRadius: 8,
  },
  deleteButton: {
    flex: 1,
    marginLeft: 8,
    borderRadius: 8,
    borderColor: "#ff4444",
  },
  titleStyle: { fontFamily: "OutFitBold" },
  descriptionStyle: { fontFamily: "OutFitRegular" },
  dialogText: { fontFamily: "OutFitRegular", fontSize: 15, lineHeight: 22 },
});

export default Settings;
