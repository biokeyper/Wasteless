import ErrorBanner from "@/components/alerts/ErrorBanner";
import FormButton from "@/components/forms/FormButton";
import InputField from "@/components/forms/InputField";
import PasswordInput from "@/components/forms/PasswordInput";
import { register } from "@/lib/auth";
import { signInWithGoogle } from "@/lib/googleSignIn";
import { registerSchema } from "@/validations/resister";
import { useRouter } from "expo-router";
import { useFormik } from "formik";
import React, { useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
type User = {
  name: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
};
const RegisterScreen = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const { colors } = useTheme();

  const router = useRouter();
  const formik = useFormik<User>({
    initialValues: {
      name: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    validationSchema: registerSchema,
    onSubmit: async (values) => {
      handleRegister(values);
    },
  });
  const handleRegister = async (user: User) => {
    setLoading(true);
    setError("");

    try {
      await register({
        email: user.email,
        password: user.password,
        displayName: user.name,
        username: user.username || undefined,
      });
      router.push({
        pathname: "/verify_account",
        params: { email: user.email.trim().toLowerCase() },
      });
    } catch (err) {
      setError((err as Error).message);
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
      <Text style={styles.header}>Create Account</Text>
      <ScrollView contentContainerStyle={styles.content}>
        <InputField
          label="Full Name *"
          keyboardType="name-phone-pad"
          accessibilityLabel="name"
          placeholder={"e.g John Doe"}
          value={formik.values.name}
          onChangeText={(text) => formik.setFieldValue("name", text)}
          errorMessage={formik.errors.name}
          error={formik.touched.name && !!formik.errors.name}
        />
        <InputField
          label="Display Name"
          accessibilityLabel="username"
          keyboardType="name-phone-pad"
          placeholder={"e.g johndoe"}
          value={formik.values.username}
          onChangeText={(text) => formik.setFieldValue("username", text)}
          errorMessage={formik.errors.username}
          error={formik.touched.username && !!formik.errors.username}
        />

        <InputField
          placeholder="e'g username@example.com"
          accessibilityLabel="email"
          label={"Email Address *"}
          keyboardType="email-address"
          value={formik.values.email}
          onChangeText={(text) => formik.setFieldValue("email", text)}
          error={formik.touched.email && !!formik.errors.email}
          errorMessage={formik.errors.email}
        />

        <PasswordInput
          placeholder="Password"
          value={formik.values.password}
          label={"Create Password *"}
          onChangeText={(text) => formik.setFieldValue("password", text)}
          errorMessage={formik.errors.password}
          error={formik.touched.password && !!formik.errors.password}
        />
        <PasswordInput
          placeholder="Confirm Password"
          label={"Confirm Password *"}
          value={formik.values.confirmPassword}
          onChangeText={(text) => formik.setFieldValue("confirmPassword", text)}
          errorMessage={formik.errors.confirmPassword}
          error={
            formik.touched.confirmPassword && !!formik.errors.confirmPassword
          }
        />
        <FormButton loading={loading} onPress={() => formik.handleSubmit()}>
          Register
        </FormButton>

        <FormButton
          mode="outlined"
          onPress={handleGoogle}
          disabled={loading}
          icon={"google"}
        >
          Sign Up with Google
        </FormButton>

        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.footerText}>
            Already have an account?{" "}
            <Text style={styles.loginText}>Log In</Text>
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
  content: {
    padding: 20,
  },
  header: {
    fontSize: 20,
    fontFamily: "OutFitBold",
    alignSelf: "center",
    marginBottom: 10,
  },
  subheader: {
    fontSize: 22,
    fontWeight: "bold",
    alignSelf: "center",
    marginBottom: 20,
  },
  footerText: {
    textAlign: "center",
    marginTop: 20,
    fontFamily: "SpaceMono",
  },
  loginText: {
    fontFamily: "SpaceMonoBold",
  },
});

export default RegisterScreen;
