import ErrorBanner from "@/components/alerts/ErrorBanner";
import FormButton from "@/components/forms/FormButton";
import InputField from "@/components/forms/InputField";
import PasswordInput from "@/components/forms/PasswordInput";
import { AuthError, signIn } from "@/lib/auth";
import { signInWithGoogle } from "@/lib/googleSignIn";
import { loginSchema } from "@/validations/login";
import { useRouter } from "expo-router";
import { useFormik } from "formik";
import React, { useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { Text, TextInput, useTheme } from "react-native-paper";
type User = {
  email: string;
  password: string;
};
const LoginScreen = () => {
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const formik = useFormik<User>({
    initialValues: { email: "", password: "" },
    onSubmit: async (values) => {
      handleLogin(values);
    },
    validationSchema: loginSchema,
  });

  const router = useRouter();
  const { colors } = useTheme();

  const handleLogin = async (user: User) => {
    try {
      setLoading(true);
      setError("");
      await signIn(user.email, user.password);
      router.replace("/(home)");
    } catch (error) {
      const err = error as AuthError;
      if (err.code === "EMAIL_NOT_VERIFIED") {
        // The backend has already emailed a fresh code
        router.push({ pathname: "/verify_account", params: { email: user.email } });
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      setLoading(true);
      setError("");
      if (await signInWithGoogle()) {
        router.replace("/(home)");
      }
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={{ width: "100%", height: "100%" }}
        contentContainerStyle={{ padding: 20 }}
      >
        <Text style={styles.title}>Welcome, Enter Your Details to Login</Text>
        <InputField
          label="Email"
          placeholder="username@email.com"
          left={<TextInput.Icon icon="email-outline" />}
          value={formik.values.email}
          onChangeText={(value) => formik.setFieldValue("email", value)}
          error={formik.touched.email && !!formik.errors.email}
          errorMessage={formik.errors.email}
        />
        <PasswordInput
          mode="flat"
          label={"Password"}
          placeholder="Enter Password"
          value={formik.values.password}
          onChangeText={(value) => formik.setFieldValue("password", value)}
          error={formik.touched.password && !!formik.errors.password}
          errorMessage={formik.errors.password}
        />
        <FormButton
          onPress={() => formik.handleSubmit()}
          loading={loading}
          disabled={loading}
        >
          Login
        </FormButton>
        <FormButton
          disabled={loading}
          onPress={handleGoogle}
          icon={"google"}
          mode="outlined"
        >
          Login with Google
        </FormButton>
        <TouchableOpacity onPress={() => router.navigate("/register")}>
          <Text style={[styles.signupText, styles.text]}>
            Don&#39;t have an account?{" "}
            <Text style={{ fontFamily: "SpaceMonoBold" }}>Sign Up</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
      <ErrorBanner error={error} setError={setError} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    textAlign: "center",
    fontSize: 18,
    marginBottom: 8,
    fontFamily: "OutFitBold",
  },

  signupText: {
    marginTop: 18,
    textAlign: "center",
    fontFamily: "SpaceMono",
  },
  text: {
    fontFamily: "SpaceMono",
  },
});

export default LoginScreen;
