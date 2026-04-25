import "server-only";

import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import type { ServiceAccount } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { hasFirebaseAdminConfig, serverEnv } from "@/config/server-env";

function parseServiceAccount(): ServiceAccount {
  if (!hasFirebaseAdminConfig()) {
    throw new Error(
      "Firebase admin config missing. Add FIREBASE_SERVICE_ACCOUNT_JSON on the server.",
    );
  }

  try {
    const parsed = JSON.parse(serverEnv.firebaseServiceAccountJson) as {
      project_id?: string;
      client_email?: string;
      private_key?: string;
    };

    return {
      projectId: parsed.project_id,
      clientEmail: parsed.client_email,
      privateKey: parsed.private_key?.replace(/\\n/g, "\n"),
    };
  } catch {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON. Paste the full service account JSON into Vercel.",
    );
  }
}

export function getFirebaseAdminApp() {
  if (!hasFirebaseAdminConfig()) {
    throw new Error(
      "Firebase admin config missing. Add FIREBASE_SERVICE_ACCOUNT_JSON and NEXT_PUBLIC_FIREBASE_PROJECT_ID.",
    );
  }

  if (getApps().length > 0) {
    return getApp();
  }

  return initializeApp({
    credential: cert(parseServiceAccount()),
    projectId: serverEnv.firebaseProjectId,
  });
}

export function getAdminDb() {
  return getFirestore(getFirebaseAdminApp());
}

export function getAdminAuth() {
  return getAuth(getFirebaseAdminApp());
}
