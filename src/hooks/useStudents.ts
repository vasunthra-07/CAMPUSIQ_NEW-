import { useQuery } from "@tanstack/react-query";
import { students as allStudents, departmentStats, weeklyRiskTrend } from "@/data/students";
import { calculateCohortPulse, calculatePulseScore } from "@/lib/scoring";
import { QUERY_KEYS } from "@/lib/queryKeys";

// All students (client-side, from mock data — will swap to API in Phase 5)
export function useStudents() {
  return useQuery({
    queryKey: QUERY_KEYS.students.all,
    queryFn: () => allStudents,
    staleTime: 5 * 60 * 1000,
  });
}

// Single student by ID
export function useStudent(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.students.byId(id),
    queryFn: () => allStudents.find(s => s.id === id) ?? null,
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

// Department stats
export function useDepartmentStats() {
  return useQuery({
    queryKey: QUERY_KEYS.students.byDept("all"),
    queryFn: () => departmentStats,
    staleTime: 5 * 60 * 1000,
  });
}

// Campus-wide pulse summary
export function useCampusPulse() {
  return useQuery({
    queryKey: QUERY_KEYS.campus.pulse,
    queryFn: () => {
      const scores = allStudents.map(s => s.pulseScore);
      const summary = calculateCohortPulse(scores);
      const topRiskStudents = allStudents
        .filter(s => s.status === "Critical" || s.status === "At-Risk")
        .sort((a, b) => a.pulseScore - b.pulseScore)
        .slice(0, 5);
      return { ...summary, total: allStudents.length, topRiskStudents };
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Weekly risk trend data
export function useWeeklyRiskTrend() {
  return useQuery({
    queryKey: ["campus", "weekly-trend"],
    queryFn: () => weeklyRiskTrend,
    staleTime: 10 * 60 * 1000,
  });
}
