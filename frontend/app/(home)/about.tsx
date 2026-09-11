import { PRIVACY_POLICY_URL } from "@/constants/contact";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { openBrowserAsync } from "expo-web-browser";
import React from "react";
import { Image, ScrollView, StyleSheet, View } from "react-native";
import { Card, Divider, List, Text, useTheme } from "react-native-paper";

const WEBSITE = "https://wasteless.biokeyper.com";

// Same three steps as the website's "How WasteLess Works" section
const steps = [
  {
    icon: "camera-plus",
    title: "Post an Item",
    description:
      "Upload a photo and describe something useful you no longer need. It takes less than 2 minutes.",
  },
  {
    icon: "account-multiple-check",
    title: "Get Requests",
    description:
      "Community members nearby can request your item. Choose who you'd like to give it to.",
  },
  {
    icon: "handshake",
    title: "Meet & Share",
    description:
      "Arrange a convenient pickup time and location. Make a neighbor happy and reduce waste!",
  },
];

// Opened in the in-app browser
const links = [
  { icon: "web", title: "Website", url: WEBSITE },
  { icon: "shield-account", title: "Privacy Policy", url: PRIVACY_POLICY_URL },
  { icon: "account-remove", title: "Delete your account", url: `${WEBSITE}/account-deletion-info` },
  { icon: "github", title: "Source code on GitHub", url: "https://github.com/biokeyper/Wasteless" },
];

const AboutScreen = () => {
  const { colors } = useTheme();
  const router = useRouter();
  const version = Constants.expoConfig?.version;

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.header}>
        <Image source={require("../../assets/images/icon.png")} style={styles.logo} />
        <Text style={styles.appName}>WasteLess</Text>
        {version ? <Text style={styles.version}>Version {version}</Text> : null}
      </View>

      <Text style={styles.paragraph}>
        WasteLess helps people give away items they no longer need to those who do. From food and
        clothes to books and tools, you can share them with someone nearby, quickly and safely.
      </Text>

      <Text style={styles.sectionTitle}>How it works</Text>
      <Card style={[styles.card, { backgroundColor: colors.surface }]} mode="contained">
        {steps.map((step, index) => (
          <View key={step.title}>
            {index > 0 && <Divider />}
            <List.Item
              title={step.title}
              description={step.description}
              descriptionNumberOfLines={4}
              left={(props) => <List.Icon {...props} icon={step.icon} />}
              titleStyle={styles.itemTitle}
              descriptionStyle={styles.itemDescription}
            />
          </View>
        ))}
      </Card>

      <Text style={styles.sectionTitle}>Built in public</Text>
      <Text style={styles.paragraph}>
        WasteLess was built as part of a 30-day Build In Public challenge by Josephat Juma, and
        invites both developers and non-tech folks to contribute ideas, test features, and follow
        progress in real time.
      </Text>

      <Card style={[styles.card, { backgroundColor: colors.surface }]} mode="contained">
        <List.Item
          title="Contact us"
          onPress={() => router.push("/contact")}
          left={(props) => <List.Icon {...props} icon="lifebuoy" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          titleStyle={styles.itemTitle}
        />
        {links.map((link) => (
          <View key={link.url}>
            <Divider />
            <List.Item
              title={link.title}
              onPress={() => openBrowserAsync(link.url)}
              left={(props) => <List.Icon {...props} icon={link.icon} />}
              right={(props) => <List.Icon {...props} icon="open-in-new" />}
              titleStyle={styles.itemTitle}
            />
          </View>
        ))}
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    alignItems: "center",
    marginVertical: 16,
  },
  logo: {
    width: 88,
    height: 88,
    borderRadius: 20,
  },
  appName: {
    marginTop: 12,
    fontSize: 24,
    fontFamily: "OutFitBold",
  },
  version: {
    marginTop: 4,
    fontFamily: "OutFitRegular",
    opacity: 0.7,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: "OutFitRegular",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "OutFitBold",
    marginBottom: 8,
    marginTop: 8,
  },
  card: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 24,
  },
  itemTitle: {
    fontFamily: "OutFitMedium",
  },
  itemDescription: {
    fontFamily: "OutFitRegular",
  },
});

export default AboutScreen;
