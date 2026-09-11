import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { getSession, refresh } from "@/lib/auth";

export const apiClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  //timeout: 4000,
});

apiClient.interceptors.request.use((config) => {
  const session = getSession();
  if (session) {
    config.headers.Authorization = `Bearer ${session.accessToken}`;
  }
  return config;
});

// An expired access token gets one refresh-and-retry; if the refresh is rejected the user is signed out
apiClient.interceptors.response.use(undefined, async (error: AxiosError) => {
  const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
  if (error.response?.status !== 401 || !original || original._retried || !getSession()) {
    throw error;
  }
  original._retried = true;
  const next = await refresh();
  if (!next) throw error;
  original.headers.Authorization = `Bearer ${next.accessToken}`;
  return apiClient(original);
});
