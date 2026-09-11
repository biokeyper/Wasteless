import axios from "axios";

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
const authHttp = axios.create({ baseURL: import.meta.env.VITE_PUBLIC_API_URL });

function readStored(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

let current: Session | null = readStored();
const listeners = new Set<(session: Session | null) => void>();

export const getSession = () => current;

export function subscribe(listener: (session: Session | null) => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function setSession(next: Session | null) {
  current = next;
  if (next) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
  listeners.forEach((listener) => listener(next));
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
  setSession(session);
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
    .then(({ expiresIn, ...session }) => {
      setSession(session);
      return session as Session | null;
    })
    .catch((error: AuthError) => {
      if (error.code === "NETWORK") throw error;
      setSession(null);
      return null;
    })
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

export function signOut() {
  const refreshToken = current?.refreshToken;
  setSession(null);
  if (refreshToken) {
    // Best effort: the local session is already gone either way
    authHttp.post("/auth/logout", { refreshToken }).catch(() => {});
  }
}
