/**
 * Demo Authentication Provider
 * ─────────────────────────────
 * Purely client-side. No database, no network.
 * Active when VITE_DEMO_MODE=true in .env
 *
 * SAFE: Real authentication in AuthContext is called only
 * when this module returns null (i.e. credentials don't match any demo user).
 */

import type { AuthUser, Role } from "@/types/auth";

// ── Demo user registry ────────────────────────────────────────────────────────

interface DemoCredential {
  userId: string;
  password: string;
  user: AuthUser;
}

const DEMO_USERS: DemoCredential[] = [
  {
    userId: "STU2024001",
    password: "password123",
    user: {
      userId: "STU2024001",
      name: "Arjun Krishnamurthy",
      role: "Student" as Role,
      department: "Computer Science Engineering",
      studentId: "STU2024001",
    },
  },
  {
    userId: "FAC2024001",
    password: "password123",
    user: {
      userId: "FAC2024001",
      name: "Dr. Priya Nair",
      role: "Subject Teacher" as Role,
      department: "Computer Science Engineering",
    },
  },
  {
    userId: "HOD2024001",
    password: "password123",
    user: {
      userId: "HOD2024001",
      name: "Dr. Ramesh Venkataraman",
      role: "HOD" as Role,
      department: "Computer Science Engineering",
    },
  },
  {
    userId: "PRI2024001",
    password: "password123",
    user: {
      userId: "PRI2024001",
      name: "Dr. Anitha Subramaniam",
      role: "Principal" as Role,
      department: "Administration",
    },
  },
  {
    userId: "ADM2024001",
    password: "password123",
    user: {
      userId: "ADM2024001",
      name: "CampusIQ Administrator",
      role: "Chairman" as Role,
      department: "System Administration",
    },
  },
];

// ── Public API ────────────────────────────────────────────────────────────────

/** Returns true if the app is running in demo mode. */
export const isDemoMode = (): boolean => {
  return import.meta.env.VITE_DEMO_MODE === "true";
};

/**
 * Attempts to authenticate against the local demo registry.
 *
 * @returns The matching AuthUser if credentials are valid demo credentials,
 *          or null if they should fall through to the real backend.
 */
export const tryDemoLogin = (userId: string, password: string): AuthUser | null => {
  if (!isDemoMode()) return null;

  const match = DEMO_USERS.find(
    (u) =>
      u.userId.toLowerCase() === userId.trim().toLowerCase() &&
      u.password === password
  );

  return match?.user ?? null;
};

/** Generates a stable, fake JWT-shaped token for demo sessions. */
export const generateDemoToken = (userId: string): string => {
  const payload = btoa(JSON.stringify({ userId, demo: true, exp: Date.now() + 86400000 }));
  return `demo.${payload}.signature`;
};

/** Checks whether the stored session token is a demo token. */
export const isDemoToken = (token: string): boolean => token.startsWith("demo.");

/**
 * If a demo token is stored in localStorage, rehydrates the matching AuthUser.
 * Returns null if token is not a demo token or is invalid.
 */
export const rehydrateDemoSession = (): AuthUser | null => {
  const token = localStorage.getItem("CampusIQ_token");
  if (!token || !isDemoToken(token)) return null;

  try {
    const payloadB64 = token.split(".")[1];
    const payload = JSON.parse(atob(payloadB64)) as { userId: string; demo: boolean; exp: number };
    if (!payload.demo || payload.exp < Date.now()) return null;

    const match = DEMO_USERS.find((u) => u.userId === payload.userId);
    return match?.user ?? null;
  } catch {
    return null;
  }
};
