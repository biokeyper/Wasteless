import ErrorBanner from "@/components/alerts/ErrorBanner";
import FormButton from "@/components/forms/FormButton";
import { resendCode, verifyEmail } from "@/lib/auth";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Keyboard,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Text, TextInput, useTheme } from "react-native-paper";
const OTPVerificationScreen = () => {
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState<number>(60);
  const [isResendDisabled, setIsResendDisabled] = useState<boolean>(true);
  const inputs = useRef<any[]>([]);
  const [showOtp, setShowOtp] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [resending, setResending] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const { colors } = useTheme();
  const { email } = useLocalSearchParams();

  const router = useRouter();

  // Focus the first input when component mounts
  useEffect(() => {
    if (inputs.current[0]) {
      inputs.current[0].focus();
    }
  }, []);

  // Timer countdown
  useEffect(() => {
    let interval: any;
    if (timer > 0 && isResendDisabled) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setIsResendDisabled(false);
    }
    return () => clearInterval(interval);
  }, [timer, isResendDisabled]);

  const handleChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Auto focus next input
    if (text && index < 5) {
      inputs.current[index + 1].focus();
    }

    // Submit if last digit is entered
    // if (index === 5 && text) {
    //   handleSubmit();
    // }
  };

  // Trigger submit when full OTP is entered
  useEffect(() => {
    const isOtpComplete = otp.every((digit) => digit.length === 1);
    if (isOtpComplete) {
      handleSubmit(); // called with the latest OTP state
    }
  }, [otp]);

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1].focus();
    }
  };

  const handleSubmit = async () => {
    setError("");
    setShowOtp(false);
    Keyboard.dismiss();
    const enteredOtp = otp.join("");
    try {
      setLoading(true);
      await verifyEmail(email.toString(), enteredOtp);
      // Verifying signs the user in
      router.replace("/(home)");
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError("");
    try {
      setResending(true);
      await resendCode(email.toString());
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setResending(false);
      setTimer(60);
      setIsResendDisabled(true);
      setOtp(["", "", "", "", "", ""]);
      if (inputs.current[0]) {
        inputs.current[0].focus();
      }
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={styles.title}>Verify Your Account</Text>
        <Text style={styles.subtitle}>
          We&apos;ve sent a 6-digit verification code to your email
        </Text>
        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              mode="outlined"
              ref={(ref: any) => (inputs.current[index] = ref)}
              contentStyle={{
                justifyContent: "center",
                alignContent: "center",
                fontFamily: "SpaceMonoRegular",
              }}
              style={styles.otpInput}
              keyboardType="number-pad"
              maxLength={1}
              value={digit}
              onChangeText={(text) => handleChange(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              selectTextOnFocus
              autoFocus={index === 0}
              secureTextEntry={!showOtp}
            />
          ))}
        </View>
        <View style={styles.buttonContainer}>
          <FormButton
            mode="contained-tonal"
            style={styles.verifyButton}
            onPress={() => setShowOtp(!showOtp)}
            icon={showOtp ? "eye-off" : "eye"}
            disabled={loading}
          >
            {showOtp ? "Hide OTP" : "Show OTP"}
          </FormButton>
          <FormButton
            style={styles.verifyButton}
            onPress={handleSubmit}
            icon={"arrow-right"}
            disabled={loading || resending || otp.some((digit) => !digit)}
            loading={loading}
          >
            Verify
          </FormButton>
        </View>
        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>
            Didn&apos;t receive code?{" "}
            {isResendDisabled ? (
              <Text style={[styles.resendLink, { color: colors.primary }]}>
                Resend in {timer}s
              </Text>
            ) : (
              <TouchableOpacity onPress={handleResendOTP}>
                <Text
                  style={[
                    { color: colors.primary, fontFamily: "SpaceMonoBold" },
                  ]}
                >
                  Resend OTP
                </Text>
              </TouchableOpacity>
            )}
          </Text>
        </View>
      </View>
      <ErrorBanner error={error} setError={setError} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButton: {
    marginTop: 50,
    marginBottom: 20,
    width: 40,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    marginBottom: 10,
    fontFamily: "OutFitBold",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 40,
    paddingHorizontal: 20,
    fontFamily: "OutFitRegular",
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 40,
    width: "90%",
  },
  otpInput: {
    width: 60,
    height: 60,
    borderRadius: 10,
    textAlign: "center",
    fontSize: 22,
    fontWeight: "bold",
  },
  buttonContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "90%",
    paddingHorizontal: 20,
  },
  verifyButton: {
    marginBottom: 20,
    borderRadius: 30,
  },

  resendContainer: {
    marginTop: 20,
  },
  resendText: {
    fontSize: 16,
    fontFamily: "SpaceMono",
  },
  resendLink: {
    fontFamily: "SpaceMono",
  },
});

export default OTPVerificationScreen;
