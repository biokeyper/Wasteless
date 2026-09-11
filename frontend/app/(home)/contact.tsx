import { SUPPORT } from "@/constants/contact";
import React from "react";
import { Alert, Linking, ScrollView, StyleSheet, View } from "react-native";
import { Card, Divider, List, Text, useTheme } from "react-native-paper";

const channels = [
  { icon: "whatsapp", title: "WhatsApp", ...SUPPORT.whatsapp },
  { icon: "phone", title: "Call us", ...SUPPORT.phone },
  { icon: "email", title: "Email", ...SUPPORT.email },
];

const ContactScreen = () => {
  const { colors } = useTheme();

  const open = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert("Couldn't open that", "No app on this phone can handle it. The details are shown on this screen.");
    }
  };

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
    >
      <Text style={styles.intro}>
        Questions, problems or feedback? Reach the WasteLess team any of these ways.
      </Text>
      <Card style={[styles.card, { backgroundColor: colors.surface }]} mode="contained">
        {channels.map((channel, index) => (
          <View key={channel.title}>
            {index > 0 && <Divider />}
            <List.Item
              title={channel.title}
              description={channel.label}
              onPress={() => open(channel.url)}
              left={(props) => <List.Icon {...props} icon={channel.icon} />}
              right={(props) => <List.Icon {...props} icon="open-in-new" />}
              titleStyle={styles.itemTitle}
              descriptionStyle={styles.itemDescription}
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
  intro: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: "OutFitRegular",
    marginBottom: 16,
  },
  card: {
    borderRadius: 12,
    overflow: "hidden",
  },
  itemTitle: {
    fontFamily: "OutFitMedium",
  },
  itemDescription: {
    fontFamily: "OutFitRegular",
  },
});

export default ContactScreen;
