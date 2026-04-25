const FALLBACK_CLINIC_NAME = "डॉ. सत्ताराम पंवार क्लिनिक";

export const env = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ?? "",
  clinicName:
    process.env.NEXT_PUBLIC_CLINIC_NAME?.trim() || FALLBACK_CLINIC_NAME,
};

export function isRemoteSyncEnabled() {
  return env.apiBaseUrl.length > 0;
}
