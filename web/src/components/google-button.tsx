import { GoogleLogin } from "@react-oauth/google";

export const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

// Google's own sign-in button. Hands back an ID token for the backend's /auth/google.
// Renders nothing when VITE_GOOGLE_CLIENT_ID isn't set, rather than a broken button.
export function GoogleButton({
  onToken,
  onError,
  text = "continue_with",
}: {
  onToken: (idToken: string) => void;
  onError: () => void;
  text?: "signin_with" | "signup_with" | "continue_with";
}) {
  if (!googleClientId) return null;
  return (
    <div className="flex justify-center">
      <GoogleLogin
        text={text}
        onSuccess={(response) =>
          response.credential ? onToken(response.credential) : onError()
        }
        onError={onError}
      />
    </div>
  );
}
