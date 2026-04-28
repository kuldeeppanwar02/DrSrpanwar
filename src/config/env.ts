export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "",
  appBaseUrl: process.env.NEXT_PUBLIC_APP_BASE_URL?.trim() ?? "",
};

export function hasRemoteSyncConfig() {
  return Boolean(env.supabaseUrl);
}
