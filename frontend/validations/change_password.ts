import * as Yup from "yup";

export const changePasswordSchema = Yup.object().shape({
  currentPassword: Yup.string().required("Enter your current password"),
  newPassword: Yup.string()
    .min(6, "Password must be at least 6 characters")
    // bcrypt only uses the first 72 bytes, which is what the backend accepts
    .max(72, "Password must be at most 72 characters")
    .notOneOf(
      [Yup.ref("currentPassword")],
      "Your new password has to be different"
    )
    .required("Enter a new password"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("newPassword")], "Passwords don't match")
    .required("Confirm your new password"),
});
