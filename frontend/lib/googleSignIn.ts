import { signInWithGoogleIdToken } from "@/lib/auth";
import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from "@react-native-google-signin/google-signin";

let configured = false;

// Resolves true once signed in, false if the user backed out of Google's sheet
export async function signInWithGoogle(): Promise<boolean> {
  if (!configured) {
    // The ID token's audience is this web client ID, which the backend must list in GOOGLE_CLIENT_IDS
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    });
    configured = true;
  }
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();
    if (!isSuccessResponse(response)) return false;
    const { idToken } = response.data;
    if (!idToken) {
      throw new Error("Google didn't return a sign-in token. Please try again.");
    }
    await signInWithGoogleIdToken(idToken);
    return true;
  } catch (error) {
    if (isErrorWithCode(error)) {
      if (
        error.code === statusCodes.SIGN_IN_CANCELLED ||
        error.code === statusCodes.IN_PROGRESS
      ) {
        return false;
      }
      if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new Error("Google Play Services isn't available on this device.");
      }
    }
    throw error;
  }
}
