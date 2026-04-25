import "server-only";

import { getAdminAuth } from "@/lib/firebase/admin";
import { serverEnv } from "@/config/server-env";

export class StaffAuthError extends Error {
  status: number;

  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

export async function requireStaffUser(request: Request) {
  const header = request.headers.get("authorization");

  if (!header?.startsWith("Bearer ")) {
    throw new StaffAuthError("Staff session missing. Please login again.");
  }

  const idToken = header.slice("Bearer ".length).trim();

  if (!idToken) {
    throw new StaffAuthError("Staff session missing. Please login again.");
  }

  try {
    const decodedToken = await getAdminAuth().verifyIdToken(idToken);
    const email = decodedToken.email?.trim().toLowerCase();

    if (serverEnv.staffAllowedEmails.length > 0) {
      if (!email || !serverEnv.staffAllowedEmails.includes(email)) {
        throw new StaffAuthError(
          "This account is not allowed for staff access. Add the email to STAFF_ALLOWED_EMAILS.",
          403,
        );
      }
    }

    return decodedToken;
  } catch (error) {
    if (error instanceof StaffAuthError) {
      throw error;
    }

    throw new StaffAuthError("Staff session invalid or expired. Please login again.");
  }
}
