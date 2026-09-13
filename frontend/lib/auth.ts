import axios from "axios";
import * as SecureStore from "expo-secure-store";

export type AuthUser = {
  id: string;
  email: string;
  displayName: string | null;
  username: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
  provider: "email" | "google";
  createdAt: string;
  lastSignInAt: string | null;
};

export type Session = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

type AuthResponse = Session & { expiresIn: number };

// The backend's error body carries a stable `code` and a message fit to show the user
export class AuthError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
  }
}

const STORAGE_KEY = "wasteless.session";

// Auth calls use a plain client so a 401 here never triggers the API client's refresh-and-retry
const authHttp = axios.create({ baseURL: process.env.EXPO_PUBLIC_API_URL });

let current: Session | null = null;
const listeners = new Set<(session: Session | null) => void>();

export const getSession = () => current;

export function subscribe(listener: (session: Session | null) => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

async function setSession(next: Session | null) {
  current = next;
  if (next) {
    await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(next));
  } else {
    await SecureStore.deleteItemAsync(STORAGE_KEY);
  }
  listeners.forEach((listener) => listener(next));
}

export async function restoreSession(): Promise<Session | null> {
  const raw = await SecureStore.getItemAsync(STORAGE_KEY);
  current = raw ? (JSON.parse(raw) as Session) : null;
  return current;
}

function toAuthError(error: unknown): AuthError {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { code?: string; message?: string } | undefined;
    if (data?.message) return new AuthError(data.message, data.code);
    if (!error.response) return new AuthError("Can't reach the server. Check your connection.", "NETWORK");
  }
  return new AuthError("Something went wrong. Please try again.");
}

async function post<T>(path: string, body: object): Promise<T> {
  try {
    return (await authHttp.post<T>(path, body)).data;
  } catch (error) {
    throw toAuthError(error);
  }
}

async function signInWith(path: string, body: object) {
  const { expiresIn, ...session } = await post<AuthResponse>(path, body);
  await setSession(session);
}

export async function register(input: { email: string; password: string; displayName: string; username?: string }) {
  await post("/auth/register", input);
}

export const verifyEmail = (email: string, code: string) => signInWith("/auth/verify-email", { email, code });

export async function resendCode(email: string) {
  await post("/auth/resend-code", { email });
}

export const signIn = (email: string, password: string) => signInWith("/auth/login", { email, password });

export const signInWithGoogleIdToken = (idToken: string) => signInWith("/auth/google", { idToken });

let refreshing: Promise<Session | null> | null = null;

// Swaps the refresh token for new tokens; concurrent callers share one request.
// Resolves to null when the server rejects the session (the user is signed out);
// throws on network errors so a flaky connection doesn't log anyone out.
export function refresh(): Promise<Session | null> {
  if (!current) return Promise.resolve(null);
  refreshing ??= post<AuthResponse>("/auth/refresh", { refreshToken: current.refreshToken })
    .then(async ({ expiresIn, ...session }) => {
      await setSession(session);
      return session as Session | null;
    })
    .catch(async (error: AuthError) => {
      if (error.code === "NETWORK") throw error;
      await setSession(null);
      return null;
    })
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

// Needs the access token, and the server hands back a fresh session because it revokes
// every refresh token the account had, this device's included
export async function changePassword(currentPassword: string, newPassword: string) {
  const send = async () => {
    if (!current) throw new AuthError("Sign in to continue.", "UNAUTHORIZED");
    const { data } = await authHttp.post<AuthResponse>(
      "/auth/change-password",
      { currentPassword, newPassword },
      { headers: { Authorization: `Bearer ${current.accessToken}` } }
    );
    return data;
  };

  try {
    let response: AuthResponse;
    try {
      response = await send();
    } catch (error) {
      // An expired access token gets one refresh-and-retry, the way the API client does it.
      // A wrong current password answers 401 too, but with its own code, so it isn't retried.
      const code = axios.isAxiosError(error)
        ? (error.response?.data as { code?: string } | undefined)?.code
        : undefined;
      if (code !== "UNAUTHORIZED" || !(await refresh())) throw error;
      response = await send();
    }
    const { expiresIn, ...session } = response;
    await setSession(session);
  } catch (error) {
    throw toAuthError(error);
  }
}

export async function signOut() {
  const refreshToken = current?.refreshToken;
  await setSession(null);
  if (refreshToken) {
    // Best effort: the local session is already gone either way
    authHttp.post("/auth/logout", { refreshToken }).catch(() => {});
  }
}
