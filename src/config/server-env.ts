import "server-only";

export const serverEnv = {
  firebaseProjectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim() ?? "",
  firebaseServiceAccountJson:
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim() ?? "",
  staffAllowedEmails:
    process.env.STAFF_ALLOWED_EMAILS?.split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean) ?? [],
  masterEmail: "panwarkuldeep256@gmail.com",

  // Per-clinic doctor config
  doctors: {
    surgery: {
      pin: process.env.DOCTOR_PIN_SURGERY?.trim() ?? "9636",
      name: process.env.DOCTOR_NAME_SURGERY?.trim() ?? "Dr. Satta Ram Panwar",
    },
    dental: {
      pin: process.env.DOCTOR_PIN_DENTAL?.trim() ?? "9950",
      name: process.env.DOCTOR_NAME_DENTAL?.trim() ?? "Dr. Dhawna Dhande",
    },
  },
};

export function hasFirebaseAdminConfig() {
  return Boolean(
    serverEnv.firebaseProjectId && serverEnv.firebaseServiceAccountJson,
  );
}
