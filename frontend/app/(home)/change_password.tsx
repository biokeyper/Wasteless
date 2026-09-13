import ErrorBanner from "@/components/alerts/ErrorBanner";
import SuccessBanner from "@/components/alerts/SuccessBanner";
import FormButton from "@/components/forms/FormButton";
import PasswordInput from "@/components/forms/PasswordInput";
import { AuthError, changePassword } from "@/lib/auth";
import { changePasswordSchema } from "@/validations/change_password";
import { useRouter } from "expo-router";
import { useFormik } from "formik";
import React, { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Text, useTheme } from "react-native-paper";

type Values = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

const ChangePasswordScreen = () => {
  const { colors } = useTheme();
  const router = useRouter();
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const formik = useFormik<Values>({
    initialValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
    validationSchema: changePasswordSchema,
    onSubmit: async (values) => {
      try {
        setLoading(true);
        setError("");
        await changePassword(values.currentPassword, values.newPassword);
        setSuccess("Your password has been changed.");
        formik.resetForm();
        // Long enough for the banner to be read before the screen closes
        setTimeout(() => router.back(), 1200);
      } catch (e) {
        setError((e as AuthError).message);
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ErrorBanner error={error} setError={setError} />
      <SuccessBanner success={success} setSuccess={setSuccess} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.intro}>
          Choose a new password for your account. Any other device you&apos;re signed in
          on will be signed out.
        </Text>

        <PasswordInput
          label="Current password"
          placeholder="Enter your current password"
          value={formik.values.currentPassword}
          onChangeText={(value) => formik.setFieldValue("currentPassword", value)}
          errorMessage={
            formik.touched.currentPassword ? formik.errors.currentPassword : undefined
          }
        />
        <PasswordInput
          label="New password"
          placeholder="At least 6 characters"
          value={formik.values.newPassword}
          onChangeText={(value) => formik.setFieldValue("newPassword", value)}
          errorMessage={
            formik.touched.newPassword ? formik.errors.newPassword : undefined
          }
        />
        <PasswordInput
          label="Confirm new password"
          placeholder="Repeat the new password"
          value={formik.values.confirmPassword}
          onChangeText={(value) => formik.setFieldValue("confirmPassword", value)}
          errorMessage={
            formik.touched.confirmPassword ? formik.errors.confirmPassword : undefined
          }
        />

        <FormButton
          onPress={() => formik.handleSubmit()}
          loading={loading}
          disabled={loading}
        >
          Change Password
        </FormButton>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 32,
  },
  intro: {
    fontFamily: "OutFitRegular",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8,
  },
});

export default ChangePasswordScreen;
