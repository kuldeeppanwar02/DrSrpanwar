import "server-only";

export const serverEnv = {
  firebaseProjectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim() ?? "",
  firebaseServiceAccountJson:
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim() ?? "",
  staffAllowedEmails:
    process.env.STAFF_ALLOWED_EMAILS?.split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean) ?? [],
  doctorPin: process.env.DOCTOR_PIN?.trim() ?? "1234",
  doctorName: process.env.DOCTOR_NAME?.trim() ?? "Dr. Satta Ram Panwar",
  masterEmail: "panwarkuldeep256@gmail.com",
};

export function hasFirebaseAdminConfig() {
  return Boolean(
    serverEnv.firebaseProjectId && serverEnv.firebaseServiceAccountJson,
  );
}
