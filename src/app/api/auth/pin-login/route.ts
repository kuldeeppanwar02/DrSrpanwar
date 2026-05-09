import { NextResponse } from "next/server";
import { jsonError } from "@/app/api/api-helpers";
import { verifyPin } from "@/lib/firebase/pin-auth";
import { createSessionCookie, createStaffSessionToken } from "@/lib/staff-session";

const attempts = new Map<string, { count: number; firstAttempt: number; blockedUntil: number }>();

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 5 * 60 * 1000;
const BLOCK_DURATION_MS = 5 * 60 * 1000;

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const cfConnectingIp = request.headers.get("cf-connecting-ip");

  const ipStr = forwarded?.split(",")[0] || realIp || cfConnectingIp || "unknown";
  
  // Basic sanitization
  return ipStr.trim().split(":")[0]; // Extract IPv4 cleanly
}

function checkRateLimit(ip: string): { allowed: boolean; retryAfterSec?: number; remaining?: number } {
  const now = Date.now();
  const record = attempts.get(ip);

  if (!record) return { allowed: true, remaining: MAX_ATTEMPTS };

  if (record.blockedUntil > now) {
    return {
      allowed: false,
      retryAfterSec: Math.ceil((record.blockedUntil - now) / 1000),
    };
  }

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
    record.count += 1;
  }
}

function clearAttempts(ip: string) {
  attempts.delete(ip);
}

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
    const rateCheck = checkRateLimit(ip);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          message: `Bahut zyada koshishe hui hain. ${rateCheck.retryAfterSec} second baad phir try karein.`,
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
      return NextResponse.json({ message: "PIN is required." }, { status: 400 });
    }

    const result = await verifyPin(pin);

    if (!result) {
      recordFailedAttempt(ip);
      const remaining = Math.max((rateCheck.remaining ?? MAX_ATTEMPTS) - 1, 0);
      return NextResponse.json(
        {
          message:
            remaining > 0
              ? `Galat PIN. ${remaining} koshishe baaki hain.`
              : "Galat PIN. Kripya 5 minute baad dobara koshish karein.",
          attemptsRemaining: remaining,
        },
        { status: 401 },
      );
    }

    clearAttempts(ip);

    const sessionToken = createStaffSessionToken({
      id: result.member.id,
      name: result.member.name,
      role: result.member.role,
      designation: result.member.designation,
      clinicAccess: result.member.clinicAccess,
    });

    const response = NextResponse.json({
      success: true,
      sessionToken,
      member: {
        id: result.member.id,
        name: result.member.name,
        role: result.member.role,
        designation: result.member.designation,
        clinicAccess: result.member.clinicAccess,
        status: result.member.status,
      },
    });

    response.headers.append("Set-Cookie", createSessionCookie(sessionToken));
    return response;
  } catch (error) {
    return jsonError(error);
  }
}
