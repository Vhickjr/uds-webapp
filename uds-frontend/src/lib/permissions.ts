import type { Role } from "@/contexts/AuthContext";

/**
 * Central role helpers. Every admin-gated surface should go through one of
 * these rather than comparing `role` inline, so that adding a role in future
 * is a single-file change.
 *
 * `superadmin` is a strict superset of `admin`: it passes every admin check
 * plus any surface reserved for site-wide administration.
 */

export const ROLES: Role[] = ["superadmin", "admin", "intern", "guest"];

export const ROLE_LABELS: Record<Role, string> = {
  superadmin: "Super Admin",
  admin: "Admin",
  intern: "Intern",
  guest: "Guest",
};

export const isSuperAdmin = (role?: Role | null): boolean => role === "superadmin";

/** Any administrator — inventory, spaces, or site-wide. */
export const isAdmin = (role?: Role | null): boolean =>
  role === "admin" || role === "superadmin";

export const canManageInventory = isAdmin;
export const canManageSpaces = isAdmin;

/** Approving or rejecting other people's booking requests. */
export const canReviewBookings = isAdmin;

/**
 * Editing public website content. Available to admins and super admins —
 * narrow this to `isSuperAdmin` if website copy should be super-admin only.
 */
export const canEditContent = isAdmin;

/** Site-wide administration reserved for super admins (e.g. user management). */
export const canManageSite = isSuperAdmin;

/** Everyone signed in can request a space. */
export const canBookSpaces = (role?: Role | null): boolean => !!role;
