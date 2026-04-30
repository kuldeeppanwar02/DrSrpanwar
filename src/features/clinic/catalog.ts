import type { ClinicDefinition, ClinicId } from "@/features/clinic/types";

export const CLINICS: ClinicDefinition[] = [
  {
    id: "surgery",
    slug: "surgery",
    shortName: "Surgical",
    title: "Dr. Satta Ram Panwar",
    subtitle: "Advance Laparoscopic, Gastro & Trauma Specialist Surgeon",
    metaLine: "MBBS MS FMAS ATLS",
    prefix: "S",
    phone: "9636243621",
    locationLabel: "Qtr No. 1, Behind Poonam Stadium, Jaisalmer",
    hoursLabel: "9:00 AM - 6:00 PM",
    accentColor: "#0f6b63",
    hasBooking: true,
    mapUrl: "https://www.google.com/maps/search/?api=1&query=26.912695,70.905230",
  },
  {
    id: "dental",
    slug: "dental",
    shortName: "Dental",
    title: "Dhandev Dental Clinic",
    subtitle: "Dr. Dhawna Dhande Dental Care",
    prefix: "D",
    phone: "9636243621",
    locationLabel: "Family healthcare hub, Jaisalmer",
    hoursLabel: "10:00 AM - 5:30 PM",
    accentColor: "#a35d2f",
    hasBooking: true,
  },
  {
    id: "pharmacy",
    slug: "pharmacy",
    shortName: "Pharmacy",
    title: "Dhanwantri Medical & Provision",
    subtitle: "Medicines, follow-up support and post-consult pickup",
    prefix: "P",
    phone: "8619420077",
    email: "drsrpanwar08@gmail.com",
    locationLabel: "Behind Panchayat Samiti SAM Office Building, Jaisalmer - 345001",
    hoursLabel: "9:00 AM - 8:00 PM",
    accentColor: "#3459a6",
    hasBooking: false,
  },
];

export const DEFAULT_CLINIC_ID: ClinicId = "surgery";

export function getClinicDefinition(clinicId: ClinicId) {
  return CLINICS.find((clinic) => clinic.id === clinicId) ?? CLINICS[0];
}

export function isClinicId(value: string | null | undefined): value is ClinicId {
  return CLINICS.some((clinic) => clinic.id === value);
}

export function buildClinicHref(pathname: string, clinicId: ClinicId) {
  return pathname === "/" ? `/?clinic=${clinicId}` : `${pathname}?clinic=${clinicId}`;
}
