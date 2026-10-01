import type {
  DocumentCategory,
  DocumentStatus,
  FlightCategory,
  PermitAuthorization,
  PermitKind,
  RevisionType,
} from "./types";

/** Static option lists used by forms and filters. */

export const PERMIT_AUTHORIZATIONS: readonly PermitAuthorization[] = ["OVERFLIGHT", "LANDING"];

export const PERMIT_KINDS: readonly PermitKind[] = [
  "SINGLE PERMIT",
  "BLOCK PERMIT",
  "SEASONAL PERMIT",
  "OFFLINE PERMIT",
];

export const FLIGHT_CATEGORIES: readonly FlightCategory[] = [
  "Commercial Scheduled",
  "Commercial Non-Scheduled / Ad-hoc",
  "Private",
  "Cargo",
  "Military / Diplomatic",
  "Humanitarian / Emergency",
  "Search & Rescue",
  "Air Ambulance / Medical Evacuation",
  "Ferry / Test / Delivery",
];

export const DOCUMENT_STATUSES: readonly DocumentStatus[] = [
  "VALID",
  "EXPIRING SOON",
  "EXPIRED",
  "PENDING VERIFICATION",
  "REJECTED",
  "MISSING",
  "NOT REQUIRED",
];

export const DOCUMENT_CATEGORIES: readonly DocumentCategory[] = [
  "Company",
  "Operator",
  "Aircraft",
  "Insurance",
  "Authorization",
  "Flight-specific",
  "Cargo",
  "PAX",
  "Special-purpose",
];

export const REVISION_TYPES: readonly RevisionType[] = [
  "Date / Time Change",
  "Route Change",
  "Aircraft Change",
  "Document Update",
];

/** Categories that may require additional documents (configurable, not hard-coded rules). */
export const SPECIAL_DOCUMENT_CATEGORIES: readonly FlightCategory[] = [
  "Air Ambulance / Medical Evacuation",
  "Humanitarian / Emergency",
  "Military / Diplomatic",
  "Search & Rescue",
];
