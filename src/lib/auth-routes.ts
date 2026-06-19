import type { UserRole } from "@/types/auth";

export type PortalRole = UserRole;

export const PORTAL_ROLES: {
  value: PortalRole;
  label: string;
  description: string;
}[] = [
  { value: "customer", label: "Patient", description: "Verify medicines" },
  { value: "pharmacy", label: "Pharmacy", description: "Bulk verification" },
  { value: "manufacturer", label: "Manufacturer", description: "Register batches" },
];

export function getDashboardPath(role?: string | null, redirect?: string): string {
  if (redirect) return redirect;
  if (role === "pharmacy") return "/dashboard/pharmacy";
  if (role === "manufacturer") return "/dashboard/manufacturer";
  return "/dashboard/patient";
}
