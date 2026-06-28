import {
  Home, GraduationCap, Brain, Users, Building2, Calendar,
  Wrench, Activity, ShieldAlert, Car, BookOpen, BarChart3, Settings,
  Headset, Briefcase, Bell, Network, BarChart2, UtensilsCrossed, LucideIcon
} from "lucide-react";
import { Role } from "@/types/auth";

export interface ModuleDefinition {
  path: string;
  id: string;
  label: string;
  icon: LucideIcon;
  allowedRoles: Role[];
}

const ALL_ROLES: Role[] = ["Student", "Subject Teacher", "Mentor", "HOD", "Principal", "Chairman"];
const FACULTY_ADMIN_ROLES: Role[] = ["Subject Teacher", "Mentor", "HOD", "Principal", "Chairman"];
const ADMIN_ROLES: Role[] = ["HOD", "Principal", "Chairman"];

export const moduleRegistry: ModuleDefinition[] = [
  {
    path: "/app/overview",
    id: "overview",
    label: "Campus Command Center",
    icon: Home,
    allowedRoles: ALL_ROLES,
  },
  {
    path: "/app/student-hub",
    id: "student-hub",
    label: "Student Experience Hub",
    icon: GraduationCap,
    allowedRoles: ["Student"],
  },
  {
    path: "/app/faculty",
    id: "faculty",
    label: "Faculty Workspace",
    icon: Briefcase,
    allowedRoles: ["Subject Teacher", "Mentor", "HOD"],
  },
  {
    path: "/app/assistant",
    id: "assistant",
    label: "Campus Copilot",
    icon: Brain,
    allowedRoles: ALL_ROLES,
  },
  {
    path: "/app/notices",
    id: "notices",
    label: "Notices Board",
    icon: Bell,
    allowedRoles: ALL_ROLES,
  },
  {
    path: "/app/resources",
    id: "resources",
    label: "Resource Operations Center",
    icon: Building2,
    allowedRoles: ALL_ROLES,
  },
  {
    path: "/app/events",
    id: "events",
    label: "Event Operations Center",
    icon: Calendar,
    allowedRoles: ALL_ROLES,
  },
  {
    path: "/app/service-center",
    id: "service-center",
    label: "Campus Service Center",
    icon: Headset,
    allowedRoles: ALL_ROLES,
  },
  {
    path: "/app/assets",
    id: "assets",
    label: "Asset Management",
    icon: Wrench,
    allowedRoles: ADMIN_ROLES,
  },
  {
    path: "/app/maintenance",
    id: "maintenance",
    label: "Maintenance Operations",
    icon: Activity,
    allowedRoles: ADMIN_ROLES,
  },
  {
    path: "/app/comms",
    id: "comms",
    label: "Campus Communications Center",
    icon: Users,
    allowedRoles: ALL_ROLES,
  },
  {
    path: "/app/safety",
    id: "safety",
    label: "Safety & Emergency",
    icon: ShieldAlert,
    allowedRoles: ALL_ROLES,
  },
  {
    path: "/app/transport",
    id: "transport",
    label: "Mobility Operations Center",
    icon: Car,
    allowedRoles: ALL_ROLES,
  },
  {
    path: "/app/library",
    id: "library",
    label: "Knowledge Center",
    icon: BookOpen,
    allowedRoles: ALL_ROLES,
  },
  {
    path: "/app/analytics",
    id: "analytics",
    label: "Campus Analytics Center",
    icon: BarChart3,
    allowedRoles: ADMIN_ROLES,
  },
  {
    path: "/app/polls",
    id: "polls",
    label: "Polls & Feedback",
    icon: BarChart2,
    allowedRoles: ALL_ROLES,
  },
  {
    path: "/app/canteen",
    id: "canteen",
    label: "Campus Canteen",
    icon: UtensilsCrossed,
    allowedRoles: ALL_ROLES,
  },
  {
    path: "/app/canteen-dashboard",
    id: "canteen-dashboard",
    label: "Canteen Dashboard",
    icon: UtensilsCrossed,
    allowedRoles: FACULTY_ADMIN_ROLES,
  },
  {
    path: "/app/intelligence",
    id: "intelligence",
    label: "Intelligence Centre",
    icon: Network,
    allowedRoles: ALL_ROLES,
  },
  {
    path: "/app/settings",
    id: "settings",
    label: "Settings",
    icon: Settings,
    allowedRoles: ALL_ROLES,
  },
];
