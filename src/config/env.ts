export const env = {
  firebaseApiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim() ?? "",
  firebaseAuthDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim() ?? "",
  firebaseProjectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim() ?? "",
  firebaseStorageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim() ?? "",
  firebaseMessagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim() ?? "",
  firebaseAppId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.trim() ?? "",
  firebaseMeasurementId:
    process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID?.trim() ?? "",
  appBaseUrl: process.env.NEXT_PUBLIC_APP_BASE_URL?.trim() ?? "",
};

export function hasFirebaseClientConfig() {
  return Boolean(
    env.firebaseApiKey &&
      env.firebaseAuthDomain &&
      env.firebaseProjectId &&
      env.firebaseAppId,
  );
}

export function hasRemoteSyncConfig() {
  return Boolean(env.firebaseProjectId);
}
