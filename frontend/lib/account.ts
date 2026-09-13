import { apiClient } from "@/api/api_client";
import { signOut } from "@/lib/auth";
import axios from "axios";
import { File, Paths } from "expo-file-system";
import { isAvailableAsync, shareAsync } from "expo-sharing";

// The backend's error body carries a message fit to show the user
export function apiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    if (data?.message) return data.message;
    if (!error.response) return "Can't reach the server. Check your connection.";
  }
  return fallback;
}

// Writes everything the account holds to a JSON file and opens the share sheet,
// so the user can keep it wherever they like
export async function exportAccountData() {
  const { data } = await apiClient.get("/account/export");
  const stamp = new Date().toISOString().slice(0, 10);
  const file = new File(Paths.cache, `wasteless-data-${stamp}.json`);
  if (file.exists) {
    file.delete();
  }
  file.create();
  file.write(JSON.stringify(data, null, 2));

  if (!(await isAvailableAsync())) {
    return { shared: false, uri: file.uri };
  }
  await shareAsync(file.uri, {
    mimeType: "application/json",
    dialogTitle: "Your WasteLess data",
    UTI: "public.json",
  });
  return { shared: true, uri: file.uri };
}

// Takes the account and everything attached to it, then signs this device out
export async function deleteAccount() {
  await apiClient.delete("/account");
  await signOut();
}
