import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { AuthUser } from "@/types/auth";
import { loginAPI } from "@/utils/api";
import {
  tryDemoLogin,
  generateDemoToken,
  rehydrateDemoSession,
  isDemoToken,
} from "@/utils/demoAuth";

interface AuthContextType {
  user: AuthUser | null;
  login: (userId: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("CampusIQ_token");
    if (!token) return;

    // ── Demo session rehydration ──────────────────────────────────────────────
    if (isDemoToken(token)) {
      const demoUser = rehydrateDemoSession();
      if (demoUser) {
        setUser(demoUser);
      } else {
        // Demo token is expired/invalid — clear it
        localStorage.removeItem("CampusIQ_token");
      }
      return;
    }

    // ── Real session verification ─────────────────────────────────────────────
    fetch(
      `${import.meta.env.VITE_API_URL || "http://localhost:3001"}/api/auth/verify`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
      .then((r) => r.json())
      .then((data) => {
        if (data.valid) setUser(data.user);
      })
      .catch(() => localStorage.removeItem("CampusIQ_token"));
  }, []);

  const login = async (userId: string, password: string): Promise<boolean> => {
    // ── 1. Try demo credentials first (no network call) ───────────────────────
    const demoUser = tryDemoLogin(userId, password);
    if (demoUser) {
      const token = generateDemoToken(userId);
      localStorage.setItem("CampusIQ_token", token);
      setUser(demoUser);
      return true;
    }

    // ── 2. Fall through to real backend authentication ────────────────────────
    try {
      const data = await loginAPI(userId, password);
      if (data.success && data.token) {
        localStorage.setItem("CampusIQ_token", data.token);
        setUser(data.user);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("CampusIQ_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
