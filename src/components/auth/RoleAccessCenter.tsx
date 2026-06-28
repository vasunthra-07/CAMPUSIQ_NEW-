import { motion } from "framer-motion";
import { GraduationCap, BookOpen, Building2, Shield, Crown } from "lucide-react";
import { RoleCard } from "./RoleCard";
import type { Role } from "@/types/auth";

const ROLES = [
  {
    role: "Student" as Role,
    name: "Student",
    description: "Academic workspace, schedule, tasks, and campus resources.",
    icon: <GraduationCap size={20} />,
    credentials: { id: "STU2024001", pwd: "password123" },
  },
  {
    role: "Subject Teacher" as Role,
    name: "Faculty",
    description: "Class management, attendance tracking, and student interventions.",
    icon: <BookOpen size={20} />,
    credentials: { id: "FAC2024001", pwd: "password123" },
  },
  {
    role: "HOD" as Role,
    name: "HOD",
    description: "Department operations, analytics, and faculty oversight.",
    icon: <Building2 size={20} />,
    credentials: { id: "HOD2024001", pwd: "password123" },
  },
  {
    role: "Principal" as Role,
    name: "Principal",
    description: "Institution-wide command center and strategic operations.",
    icon: <Shield size={20} />,
    credentials: { id: "PRI2024001", pwd: "password123" },
  },
  {
    role: "Chairman" as Role,
    name: "Admin",
    description: "Full platform access, configuration, and executive analytics.",
    icon: <Crown size={20} />,
    credentials: { id: "ADM2024001", pwd: "password123" },
  },
];

interface RoleAccessCenterProps {
  onQuickLogin: (id: string, pwd: string) => void;
}

export function RoleAccessCenter({ onQuickLogin }: RoleAccessCenterProps) {
  return (
    <div className="mt-8">
      <div className="mb-4">
        <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Evaluation Mode</p>
        <h3 className="text-sm font-semibold text-foreground mt-1">Role Access Center</h3>
        <p className="text-xs text-muted-foreground mt-0.5">One-click access for judges and evaluators</p>
      </div>

      <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1 custom-scrollbar">
        {ROLES.map((role, i) => (
          <motion.div
            key={role.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05, duration: 0.3 }}
          >
            <RoleCard
              name={role.name}
              description={role.description}
              credentials={role.credentials}
              icon={role.icon}
              onQuickLogin={() => onQuickLogin(role.credentials.id, role.credentials.pwd)}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
