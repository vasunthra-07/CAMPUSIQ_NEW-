import { createContext, useContext, useState, ReactNode } from "react";
import { AuthUser } from "@/types/auth";

const USERS = [
  { userId: "CIT2022001", password: "student123", role: "Student", name: "Arun Kumar", department: "AI & DS", studentId: "CIT01" },
  { userId: "CIT2022002", password: "student456", role: "Student", name: "Priya D.", department: "AI & DS", studentId: "CIT02" },
  { userId: "CIT2022003", password: "student789", role: "Student", name: "Sanjay R.", department: "AI & DS", studentId: "CIT03" },
  { userId: "CIT2022004", password: "student321", role: "Student", name: "Deepak V.", department: "AI & DS", studentId: "CIT04" },
  { userId: "CIT2022005", password: "student654", role: "Student", name: "Meera J.", department: "AI & DS", studentId: "CIT05" },
  { userId: "FAC001", password: "teacher123", role: "Subject Teacher", name: "Dr. S. Kavitha", department: "AI & DS" },
  { userId: "MNT001", password: "mentor123", role: "Mentor", name: "Dr. R. Meenakshi", department: "AI & DS" },
  { userId: "HOD001", password: "hod123", role: "HOD", name: "Dr. P. Anandan", department: "AI & DS" },
  { userId: "PRN001", password: "principal123", role: "Principal", name: "Dr. K. Rajkumar", department: "CIT" },
  { userId: "CHR001", password: "chairman123", role: "Chairman", name: "Shri. S. Ramabhadran", department: "CIT" },
] as const;

interface AuthContextType {
  user: AuthUser | null;
  login: (userId: string, password: string) => boolean;
  logout: () => void;
  demoUsers: typeof USERS;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  const login = (userId: string, pass: string) => {
    const match = USERS.find(u => u.userId === userId && u.password === pass);
    if (match) {
      setUser({
        userId: match.userId,
        name: match.name,
        role: match.role as AuthUser["role"],
        department: match.department,
        studentId: 'studentId' in match ? match.studentId : undefined,
      });
      return true;
    }
    return false;
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout, demoUsers: USERS }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
