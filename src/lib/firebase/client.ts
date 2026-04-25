import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { env, hasFirebaseClientConfig } from "@/config/env";

export function getFirebaseClientApp() {
  if (!hasFirebaseClientConfig()) {
    throw new Error(
      "Firebase client config missing. Add NEXT_PUBLIC_FIREBASE_* variables before using staff login.",
    );
  }

  if (getApps().length > 0) {
    return getApp();
  }

  return initializeApp({
    apiKey: env.firebaseApiKey,
    authDomain: env.firebaseAuthDomain,
    projectId: env.firebaseProjectId,
    storageBucket: env.firebaseStorageBucket,
    messagingSenderId: env.firebaseMessagingSenderId,
    appId: env.firebaseAppId,
    measurementId: env.firebaseMeasurementId || undefined,
  });
}

export function getFirebaseClientAuth() {
  return getAuth(getFirebaseClientApp());
}
