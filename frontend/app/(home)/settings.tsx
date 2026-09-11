import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import {
  Button,
  Divider,
  Icon,
  List,
  Switch,
  Text,
  TouchableRipple,
  useTheme,
} from "react-native-paper";

const Settings = () => {
  const { colors } = useTheme();
  const router = useRouter();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  const settingsSections = [
    {
      title: "Preferences",
      icon: "tune",
      items: [
        {
          title: "Dark Mode",
          icon: "weather-night",
          action: (
            <Switch
              value={darkModeEnabled}
              onValueChange={() => setDarkModeEnabled(!darkModeEnabled)}
            />
          ),
        },
        // {
        //   title: "Language",
        //   icon: "translate",
        //   action: <Text style={styles.actionText}>English</Text>,
        //   onPress: () => console.log("Change language"),
        // },
        // {
        //   title: "Appearance",
        //   icon: "palette",
        //   action: <Icon source="chevron-right" size={20} />,
        //   onPress: () => console.log("Change appearance"),
        // },
      ],
    },
    {
      title: "Security",
      icon: "shield-lock",
      items: [
        // {
        //   title: "Biometric Login",
        //   icon: "fingerprint",
        //   action: (
        //     <Switch
        //       value={biometricEnabled}
        //       onValueChange={() => setBiometricEnabled(!biometricEnabled)}
        //     />
        //   ),
        // },
        {
          title: "Change Password",
          icon: "key",
          action: <Icon source="chevron-right" size={20} />,
          onPress: () => console.log("Change password"),
        },
        // {
        //   title: "Two-Factor Auth",
        //   icon: "cellphone-key",
        //   action: <Icon source="chevron-right" size={20} />,
        //   onPress: () => console.log("2FA settings"),
        // },
      ],
    },
    {
      title: "Notifications",
      icon: "bell",
      items: [
        {
          title: "Enable Notifications",
          icon: "bell",
          action: (
            <Switch
              value={notificationsEnabled}
              onValueChange={() =>
                setNotificationsEnabled(!notificationsEnabled)
              }
            />
          ),
        },
        {
          title: "Notification Sounds",
          icon: "music-note",
          action: <Icon source="chevron-right" size={20} />,
          onPress: () => console.log("Notification sounds"),
          disabled: !notificationsEnabled,
        },
        {
          title: "Vibration",
          icon: "vibrate",
          action: <Icon source="chevron-right" size={20} />,
          onPress: () => console.log("Vibration settings"),
          disabled: !notificationsEnabled,
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
          action: <Icon source="chevron-right" size={20} />,
          onPress: () => console.log("Help center"),
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
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { backgroundColor: colors.background },
      ]}
    >
      {settingsSections.map((section, sectionIndex) => (
        <View key={sectionIndex} style={styles.sectionContainer}>
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
              <React.Fragment key={itemIndex}>
                <TouchableRipple
                  onPress={item.onPress}
                  //   disabled={item.disabled}
                  //   style={item.disabled ? styles.disabledItem : null}
                >
                  <List.Item
                    title={item.title}
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
          onPress={() => console.log("Export data")}
        >
          Export Data
        </Button>
        <Button
          mode="outlined"
          icon="delete"
          style={styles.deleteButton}
          textColor={colors.error}
          onPress={() => console.log("Delete account")}
        >
          Delete Account
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 32,
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
  actionText: {
    color: "#666",
  },
  disabledItem: {
    opacity: 0.5,
  },
  disabledText: {
    color: "#999",
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
});

export default Settings;
