import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface CanteenStaffUser {
  staffId: string;
  name: string;
  role: "Canteen Staff" | "Canteen Manager";
}

interface CanteenAuthContextType {
  staff: CanteenStaffUser | null;
  login: (staffId: string, password: string) => boolean;
  logout: () => void;
}

const CANTEEN_CREDENTIALS: { staffId: string; password: string; user: CanteenStaffUser }[] = [
  {
    staffId: "CANTEEN001",
    password: "canteen@123",
    user: { staffId: "CANTEEN001", name: "Ravi Kumar", role: "Canteen Staff" },
  },
  {
    staffId: "CANTEEN002",
    password: "canteen@123",
    user: { staffId: "CANTEEN002", name: "Meena Devi", role: "Canteen Staff" },
  },
  {
    staffId: "CANTEEN_MGR",
    password: "manager@123",
    user: { staffId: "CANTEEN_MGR", name: "Suresh Babu", role: "Canteen Manager" },
  },
];

const SESSION_KEY = "ciq_canteen_session";

const CanteenAuthContext = createContext<CanteenAuthContextType | undefined>(undefined);

export function CanteenAuthProvider({ children }: { children: ReactNode }) {
  const [staff, setStaff] = useState<CanteenStaffUser | null>(() => {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      return stored ? (JSON.parse(stored) as CanteenStaffUser) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (staff) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(staff));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  }, [staff]);

  const login = (staffId: string, password: string): boolean => {
    const match = CANTEEN_CREDENTIALS.find(
      c => c.staffId.toLowerCase() === staffId.trim().toLowerCase() && c.password === password
    );
    if (match) {
      setStaff(match.user);
      return true;
    }
    return false;
  };

  const logout = () => setStaff(null);

  return (
    <CanteenAuthContext.Provider value={{ staff, login, logout }}>
      {children}
    </CanteenAuthContext.Provider>
  );
}

export function useCanteenAuth() {
  const ctx = useContext(CanteenAuthContext);
  if (!ctx) throw new Error("useCanteenAuth must be used inside CanteenAuthProvider");
  return ctx;
}
