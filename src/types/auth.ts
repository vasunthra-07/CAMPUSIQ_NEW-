export type Role = "Student" | "Subject Teacher" | "Mentor" | "HOD" | "Principal" | "Chairman";

export interface AuthUser {
  userId: string;
  name: string;
  role: Role;
  department: string;
  studentId?: string; // only for Student role — maps to a student record
}
