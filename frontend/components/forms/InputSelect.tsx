import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Keyboard,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import {
  HelperText,
  Icon,
  Modal,
  Portal,
  Searchbar,
  Text,
  TextInput,
  TouchableRipple,
  useTheme,
} from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import InputField from "./InputField";
const { height } = Dimensions.get("window");

interface Option {
  label: string;
  value: string;
}

interface InputSelectProps {
  data: Option[];
  value: string;
  onChange: (value: string) => void;
  label: string;
  errorMessage?: string | undefined | null;
  error?: boolean | undefined;
  isSearchable?: boolean;
  leftIcon?: string;
}

const InputSelect = ({
  data,
  value,
  onChange,
  label,
  error,
  isSearchable = true,
  leftIcon,

  errorMessage,
}: InputSelectProps) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState("");

  // Animation values
  const modalY = useRef(new Animated.Value(height)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  // Filter the data based on search text
  const filteredData = data.filter((option) =>
    option.label.toLowerCase().includes(search.toLowerCase())
  );

  // Selected option label
  const selectedLabel = data.find((item) => item.value === value)?.label || "";

  useEffect(() => {
    if (visible) {
      setSearch("");
      Animated.parallel([
        Animated.timing(modalY, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(modalY, {
          toValue: height,
          duration: 250,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, opacity, modalY]);

  const handleOptionSelect = (val: string) => {
    onChange(val);
    setVisible(false);
  };
  const handleShowModal = () => {
    Keyboard.dismiss();
    setVisible(true);
  };
  return (
    <View>
      <TouchableOpacity onPress={handleShowModal}>
        <InputField
          error={error}
          label={label}
          value={selectedLabel.replace(/_/g, " ")}
          editable={false}
          contentStyle={{
            textTransform: "capitalize",
            fontFamily: "OutFitRegular",
          }}
          right={
            <TextInput.Icon
              icon="unfold-more-horizontal"
              onPress={handleShowModal}
            />
          }
          leftIcon={leftIcon}
        />
        {errorMessage && (
          <HelperText type="error" visible={true}>
            {errorMessage}
          </HelperText>
        )}
      </TouchableOpacity>

      <Portal>
        <Modal
          visible={visible}
          onDismiss={() => setVisible(false)}
          contentContainerStyle={{
            backgroundColor: colors.background,
            maxHeight: "90%",
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            padding: 20,
            paddingBottom: 20 + insets.bottom,
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            shadowOffset: {
              width: 0,
              height: -5,
            },
            shadowOpacity: 0.2,
            shadowRadius: 10,
            elevation: 10,
            transform: [{ translateY: modalY }],
          }}
        >
          <View style={{ marginBottom: 10 }}>
            <Text
              style={{
                fontSize: 20,
                marginBottom: 15,
                fontFamily: "OutFitBold",
              }}
            >
              {label}
            </Text>

            {isSearchable && data.length > 10 && (
              <Searchbar
                value={search}
                onChangeText={setSearch}
                placeholder="Search..."
                style={{
                  borderRadius: 50,
                  backgroundColor: colors.surfaceVariant,
                  elevation: 2,
                  height: 40, // Reduced height
                  marginBottom: 8, // Adjusted spacing
                  width: "90%",
                  alignSelf: "center",
                }}
                inputStyle={{
                  fontSize: 14, // Smaller font size
                  minHeight: 0, // Remove minimum height constraint
                  paddingVertical: 0, // Remove vertical padding
                }}
                iconColor={colors.primary}
              />
            )}
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {filteredData.map((option) => (
              <TouchableRipple
                key={option.value}
                onPress={() => handleOptionSelect(option.value)}
                style={{
                  paddingVertical: 16,
                  paddingHorizontal: 8,
                  borderBottomWidth: 0.5,
                  borderBottomColor: colors.surfaceVariant,
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <>
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 16,
                      fontFamily: "OutFitRegular",
                    }}
                  >
                    {option.label}
                  </Text>
                  {value === option.value && (
                    <Icon source="check" size={20} color={colors.primary} />
                  )}
                </>
              </TouchableRipple>
            ))}

            {filteredData.length === 0 && (
              <View
                style={{
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                  padding: 30,
                  marginTop: 20,
                  borderRadius: 10,
                  backgroundColor: colors.surfaceVariant,
                }}
              >
                <Icon
                  source={"magnify-close"}
                  size={50}
                  color={colors.tertiary}
                />
                <Text
                  style={{
                    marginTop: 15,
                    fontSize: 18,
                    fontWeight: "bold",
                    textAlign: "center",
                    fontFamily: "OutFitBold",
                  }}
                >
                  No results found
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    textAlign: "center",
                    marginTop: 5,
                    fontFamily: "OutFitRegular",
                  }}
                >
                  Try different search terms
                </Text>
              </View>
            )}
          </ScrollView>
        </Modal>
      </Portal>
    </View>
  );
};

export default InputSelect;
