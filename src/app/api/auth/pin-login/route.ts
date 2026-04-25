import { jsonError } from "@/app/api/api-helpers";
import { verifyPin } from "@/lib/firebase/pin-auth";

/**
 * In-memory rate limiter for PIN login attempts.
 * Tracks failed attempts per IP. Blocks after 5 failed attempts for 5 minutes.
 */
const attempts = new Map<string, { count: number; firstAttempt: number; blockedUntil: number }>();

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const BLOCK_DURATION_MS = 5 * 60 * 1000; // 5 minutes block

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const real = request.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}

function checkRateLimit(ip: string): { allowed: boolean; retryAfterSec?: number; remaining?: number } {
  const now = Date.now();
  const record = attempts.get(ip);

  if (!record) return { allowed: true, remaining: MAX_ATTEMPTS };

  // If blocked, check if block has expired
  if (record.blockedUntil > now) {
    return {
      allowed: false,
      retryAfterSec: Math.ceil((record.blockedUntil - now) / 1000),
    };
  }

  // If window expired, reset
  if (now - record.firstAttempt > WINDOW_MS) {
    attempts.delete(ip);
    return { allowed: true, remaining: MAX_ATTEMPTS };
  }

  if (record.count >= MAX_ATTEMPTS) {
    record.blockedUntil = now + BLOCK_DURATION_MS;
    return {
      allowed: false,
      retryAfterSec: Math.ceil(BLOCK_DURATION_MS / 1000),
    };
  }

  return { allowed: true, remaining: MAX_ATTEMPTS - record.count };
}

function recordFailedAttempt(ip: string) {
  const now = Date.now();
  const record = attempts.get(ip);
  if (!record) {
    attempts.set(ip, { count: 1, firstAttempt: now, blockedUntil: 0 });
  } else {
    record.count++;
  }
}

function clearAttempts(ip: string) {
  attempts.delete(ip);
}

// Clean up stale entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of attempts.entries()) {
    if (now - record.firstAttempt > WINDOW_MS && record.blockedUntil < now) {
      attempts.delete(ip);
    }
  }
}, 10 * 60 * 1000);

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);

    // Rate limit check
    const rateCheck = checkRateLimit(ip);
    if (!rateCheck.allowed) {
      return Response.json(
        {
          message: `बहुत ज़्यादा कोशिशें। ${rateCheck.retryAfterSec} सेकंड बाद दोबारा कोशिश करें।`,
          retryAfter: rateCheck.retryAfterSec,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateCheck.retryAfterSec),
          },
        },
      );
    }

    const body = (await request.json()) as { pin?: string };
    const pin = body.pin?.trim();

    if (!pin) {
      return Response.json(
        { message: "PIN is required." },
        { status: 400 },
      );
    }

    const result = await verifyPin(pin);

    if (!result) {
      recordFailedAttempt(ip);
      const remaining = (rateCheck.remaining ?? MAX_ATTEMPTS) - 1;
      return Response.json(
        {
          message: remaining > 0
            ? `गलत PIN। ${remaining} कोशिशें बाकी हैं।`
            : "गलत PIN। बहुत ज़्यादा कोशिशें, कृपया 5 मिनट बाद दोबारा कोशिश करें।",
          attemptsRemaining: remaining,
        },
        { status: 401 },
      );
    }

    // Success — clear any failed attempts
    clearAttempts(ip);

    return Response.json({
      success: true,
      member: {
        id: result.member.id,
        name: result.member.name,
        role: result.member.role,
        designation: result.member.designation,
        clinicAccess: result.member.clinicAccess,
        status: result.member.status,
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
