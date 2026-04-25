import "server-only";

import { createHash } from "crypto";
import { getAdminDb } from "@/lib/firebase/admin";
import { serverEnv } from "@/config/server-env";
import type { ClinicId } from "@/features/clinic/types";

export type StaffRole = "doctor" | "staff";

export type StaffMember = {
  id: string;
  name: string;
  role: StaffRole;
  pinHash: string;
  phone: string;
  email: string;
  designation: string;
  clinicAccess: ClinicId[];
  status: "active" | "hold" | "removed";
  joinedAt: string;
  lastLoginAt: string;
  createdBy: string;
};

export function hashPin(pin: string): string {
  return createHash("sha256").update(pin.trim()).digest("hex");
}

export async function verifyPin(
  pin: string,
): Promise<{ member: StaffMember; role: StaffRole } | null> {
  const db = getAdminDb();
  const pinHashed = hashPin(pin);

  // Check doctor PIN from env first
  if (serverEnv.doctorPin && pin.trim() === serverEnv.doctorPin) {
    return {
      member: {
        id: "doctor-master",
        name: serverEnv.doctorName || "Doctor",
        role: "doctor",
        pinHash: pinHashed,
        phone: "",
        email: "",
        designation: "Doctor",
        clinicAccess: ["surgery", "dental", "pharmacy"],
        status: "active",
        joinedAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        createdBy: "system",
      },
      role: "doctor",
    };
  }

  // Check staff_members collection
  const snapshot = await db
    .collection("staff_members")
    .where("pinHash", "==", pinHashed)
    .where("status", "==", "active")
    .limit(1)
    .get();

  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  const data = doc.data() as Omit<StaffMember, "id">;
  const member: StaffMember = { id: doc.id, ...data };

  // Update last login
  await doc.ref.update({ lastLoginAt: new Date().toISOString() });

  return { member, role: member.role };
}

export async function listStaffMembers(): Promise<StaffMember[]> {
  const db = getAdminDb();
  const snapshot = await db
    .collection("staff_members")
    .orderBy("joinedAt", "desc")
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<StaffMember, "id">),
  }));
}

export async function createStaffMember(
  input: Omit<StaffMember, "id" | "pinHash" | "joinedAt" | "lastLoginAt"> & { pin: string },
): Promise<StaffMember> {
  const db = getAdminDb();
  const now = new Date().toISOString();

  const data = {
    name: input.name,
    role: input.role,
    pinHash: hashPin(input.pin),
    phone: input.phone || "",
    email: input.email || "",
    designation: input.designation || "",
    clinicAccess: input.clinicAccess || ["surgery"],
    status: input.status || "active",
    joinedAt: now,
    lastLoginAt: "",
    createdBy: input.createdBy || "doctor",
  };

  const ref = await db.collection("staff_members").add(data);
  return { id: ref.id, ...data };
}

export async function updateStaffMember(
  staffId: string,
  updates: Partial<Pick<StaffMember, "name" | "phone" | "email" | "designation" | "clinicAccess" | "status" | "role">> & { pin?: string },
): Promise<void> {
  const db = getAdminDb();
  const updateData: Record<string, unknown> = {};

  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.phone !== undefined) updateData.phone = updates.phone;
  if (updates.email !== undefined) updateData.email = updates.email;
  if (updates.designation !== undefined) updateData.designation = updates.designation;
  if (updates.clinicAccess !== undefined) updateData.clinicAccess = updates.clinicAccess;
  if (updates.status !== undefined) updateData.status = updates.status;
  if (updates.role !== undefined) updateData.role = updates.role;
  if (updates.pin) updateData.pinHash = hashPin(updates.pin);

  await db.collection("staff_members").doc(staffId).update(updateData);
}

export async function deleteStaffMember(staffId: string): Promise<void> {
  const db = getAdminDb();
  await db.collection("staff_members").doc(staffId).delete();
}
