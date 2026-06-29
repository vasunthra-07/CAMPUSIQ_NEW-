/**
 * CampusIQ — CampusContextService
 * ===============================
 * Aggregates every operational module into ONE unified `CampusContext` object.
 *
 * This is the foundation of Campus Brain: instead of each engine reaching into
 * 10 different stores, they all consume a single, consistent, point-in-time
 * snapshot built here. Build the context once, reason over it many times.
 *
 * All data is read from the live application stores (`campusStore` localStorage
 * layer + the generated `students` dataset). When the real REST backend is
 * wired up, only this file changes — the engines downstream stay untouched.
 */

import { students, departmentStats, weeklyRiskTrend } from "@/data/students";
import {
  ticketStore,
  eventStore,
  announcementStore,
  maintenanceStore,
  libraryStore,
  transportStore,
  incidentStore,
  bookingStore,
  CAMPUS_ROOMS,
} from "@/services/campusStore";
import type {
  CampusContext,
  StudentsSlice,
  TicketsSlice,
  MaintenanceSlice,
  EventsSlice,
  ResourcesSlice,
  TransportSlice,
  LibrarySlice,
  SafetySlice,
  CommunicationsSlice,
  IoTSlice,
  Trend,
} from "./types";

function pct(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

function daysSince(iso: string): number {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return 0;
  return Math.max(0, Math.round((Date.now() - then) / 86_400_000));
}

// ─── Per-module builders ─────────────────────────────────────────────────────

function buildStudents(): StudentsSlice {
  const total = students.length;
  const avgAttendance = Math.round(
    (students.reduce((a, s) => a + s.attendance, 0) / total) * 10
  ) / 10;
  const avgPulseScore = Math.round(students.reduce((a, s) => a + s.pulseScore, 0) / total);

  const critical = students.filter((s) => s.status === "Critical").length;
  const atRisk = students.filter((s) => s.status === "At-Risk").length;
  const safe = students.filter((s) => s.status === "Safe").length;
  const pendingInterventions = students.filter((s) => s.interventionStatus === "Pending").length;
  const activeInterventions = students.filter((s) => s.interventionStatus === "Active").length;

  // A student is "falling" when their latest tracked week is well below their first.
  const fallingAttendance = students.filter((s) => {
    const w = s.weeklyAttendance;
    return w.length >= 2 && w[0] - w[w.length - 1] >= 12;
  }).length;

  const topRiskStudents = [...students]
    .sort((a, b) => a.pulseScore - b.pulseScore)
    .slice(0, 6)
    .map((s) => ({
      id: s.id,
      name: s.name,
      department: s.department,
      attendance: s.attendance,
      pulseScore: s.pulseScore,
      status: s.status,
      driftType: s.driftType,
      reasoningNote: s.reasoningNote,
    }));

  const byDepartment = departmentStats.map((d) => ({
    dept: d.dept,
    total: d.total,
    critical: d.critical,
    avgAttendance: d.avgAttendance,
    avgPulse: d.avgPulse,
  }));

  return {
    total,
    avgAttendance,
    avgPulseScore,
    critical,
    atRisk,
    safe,
    pendingInterventions,
    activeInterventions,
    fallingAttendance,
    topRiskStudents,
    byDepartment,
    weeklyRiskTrend: weeklyRiskTrend.map((w) => ({ ...w })),
  };
}

function buildTickets(): TicketsSlice {
  const all = ticketStore.getAll();
  const total = all.length;
  const open = all.filter((t) => t.status === "Open").length;
  const inProgress = all.filter((t) => t.status === "In Progress").length;
  const resolved = all.filter((t) => t.status === "Resolved" || t.status === "Closed").length;
  const critical = all.filter((t) => t.priority === "Critical" && t.status !== "Resolved" && t.status !== "Closed").length;
  const high = all.filter((t) => t.priority === "High" && t.status !== "Resolved" && t.status !== "Closed").length;

  const openTickets = all.filter((t) => t.status === "Open" || t.status === "In Progress");
  const oldestOpenDays = openTickets.reduce((max, t) => Math.max(max, daysSince(t.createdAt)), 0);

  // Backlog trend: more open+inProgress than resolved → growing.
  const backlogTrend: Trend = open + inProgress > resolved ? "up" : open + inProgress < resolved ? "down" : "stable";

  const catMap = new Map<string, number>();
  all.forEach((t) => catMap.set(t.category, (catMap.get(t.category) ?? 0) + 1));
  const byCategory = [...catMap.entries()].map(([category, count]) => ({ category, count }));

  return {
    total,
    open,
    inProgress,
    resolved,
    critical,
    high,
    resolutionRate: pct(resolved, total),
    backlogTrend,
    oldestOpenDays,
    byCategory,
  };
}

function buildMaintenance(): MaintenanceSlice {
  const all = maintenanceStore.getAll();
  const total = all.length;
  const open = all.filter((t) => t.status === "Open").length;
  const inProgress = all.filter((t) => t.status === "In Progress").length;
  const done = all.filter((t) => t.status === "Done").length;
  const critical = all.filter((t) => t.priority === "Critical" && t.status !== "Done" && t.status !== "Cancelled").length;
  const today = new Date().toISOString().split("T")[0];
  const overdue = all.filter(
    (t) => t.status !== "Done" && t.status !== "Cancelled" && t.dueDate < today
  ).length;

  return {
    total,
    open,
    inProgress,
    done,
    critical,
    overdue,
    completionRate: pct(done, total),
  };
}

function buildEvents(): EventsSlice {
  const all = eventStore.getAll();
  const today = new Date().toISOString().split("T")[0];
  const upcomingEvents = all.filter((e) => e.date >= today && e.status !== "Cancelled");

  const fillRates = all.map((e) => (e.capacity > 0 ? Math.round((e.registrations / e.capacity) * 100) : 0));
  const avgFillRate = fillRates.length ? Math.round(fillRates.reduce((a, b) => a + b, 0) / fillRates.length) : 0;

  const lowParticipation = upcomingEvents
    .map((e) => ({ title: e.title, fillRate: e.capacity > 0 ? Math.round((e.registrations / e.capacity) * 100) : 0, date: e.date }))
    .filter((e) => e.fillRate < 50)
    .sort((a, b) => a.fillRate - b.fillRate);

  return {
    total: all.length,
    upcoming: upcomingEvents.length,
    avgFillRate,
    lowParticipation,
    full: all.filter((e) => e.status === "Full").length,
  };
}

function buildResources(): ResourcesSlice {
  const bookings = bookingStore.getAll().filter((b) => b.status !== "Cancelled");
  const today = new Date().toISOString().split("T")[0];
  const todays = bookings.filter((b) => b.date === today);

  // Utilisation = booked room-hours today vs a nominal 10-hour operating day across all rooms.
  const OPERATING_HOURS = 10;
  const capacityHours = CAMPUS_ROOMS.length * OPERATING_HOURS;
  const bookedHours = todays.reduce((sum, b) => {
    const start = Number(b.startTime.split(":")[0]) + Number(b.startTime.split(":")[1] ?? 0) / 60;
    const end = Number(b.endTime.split(":")[0]) + Number(b.endTime.split(":")[1] ?? 0) / 60;
    return sum + Math.max(0, end - start);
  }, 0);

  // Per-room utilisation (today) to surface over-booked rooms.
  const perRoom = new Map<string, number>();
  todays.forEach((b) => {
    const start = Number(b.startTime.split(":")[0]) + Number(b.startTime.split(":")[1] ?? 0) / 60;
    const end = Number(b.endTime.split(":")[0]) + Number(b.endTime.split(":")[1] ?? 0) / 60;
    perRoom.set(b.roomName, (perRoom.get(b.roomName) ?? 0) + Math.max(0, end - start));
  });
  const overbookedRooms = [...perRoom.entries()]
    .map(([name, hours]) => ({ name, util: Math.round((hours / OPERATING_HOURS) * 100) }))
    .filter((r) => r.util >= 80)
    .sort((a, b) => b.util - a.util);

  return {
    totalRooms: CAMPUS_ROOMS.length,
    activeBookings: bookings.length,
    utilizationRate: pct(bookedHours, capacityHours),
    overbookedRooms,
  };
}

function buildTransport(): TransportSlice {
  const all = transportStore.getAll();
  const totalRoutes = all.length;
  const running = all.filter((r) => r.status === "Running").length;
  const delayed = all.filter((r) => r.status === "Delayed").length;
  const full = all.filter((r) => r.status === "Full").length;
  const occ = all.map((r) => (r.capacity > 0 ? Math.round((r.passengers / r.capacity) * 100) : 0));
  const avgOccupancy = occ.length ? Math.round(occ.reduce((a, b) => a + b, 0) / occ.length) : 0;

  const delayedRoutes = all
    .filter((r) => r.status === "Delayed" || r.status === "Full")
    .map((r) => ({ route: r.route, status: r.status, occupancy: r.capacity > 0 ? Math.round((r.passengers / r.capacity) * 100) : 0 }));

  return { totalRoutes, running, delayed, full, avgOccupancy, delayedRoutes };
}

function buildLibrary(): LibrarySlice {
  const all = libraryStore.getAll();
  const totalCopies = all.reduce((a, b) => a + b.totalCopies, 0);
  const availableCopies = all.reduce((a, b) => a + b.availableCopies, 0);
  const scarceTitles = all
    .filter((b) => b.totalCopies > 0 && b.availableCopies / b.totalCopies <= 0.25)
    .map((b) => ({ title: b.title, available: b.availableCopies, total: b.totalCopies }))
    .sort((a, b) => a.available / a.total - b.available / b.total)
    .slice(0, 5);

  return {
    totalTitles: all.length,
    totalCopies,
    availableCopies,
    utilizationRate: pct(totalCopies - availableCopies, totalCopies),
    scarceTitles,
  };
}

function buildSafety(): SafetySlice {
  const all = incidentStore.getAll();
  const open = all.filter((i) => i.status !== "Resolved").length;
  const critical = all.filter((i) => i.severity === "Critical" && i.status !== "Resolved").length;
  const high = all.filter((i) => i.severity === "High" && i.status !== "Resolved").length;
  const unresolvedCritical = all
    .filter((i) => (i.severity === "Critical" || i.severity === "High") && i.status !== "Resolved")
    .map((i) => ({ type: i.type, location: i.location, severity: i.severity, status: i.status }));

  return { total: all.length, open, critical, high, unresolvedCritical };
}

function buildCommunications(): CommunicationsSlice {
  const all = announcementStore.getAll();
  return {
    total: all.length,
    urgent: all.filter((a) => a.priority === "Urgent").length,
    pinned: all.filter((a) => a.pinned).length,
  };
}

function buildIoT(): IoTSlice {
  // No sensor bridge connected yet. This slice is intentionally empty so the
  // reasoning engines can already account for IoT without special-casing.
  // Wire an MQTT / sensor-API adapter here to light up environmental signals.
  return { available: false, sensors: [] };
}

// ─── Public API ──────────────────────────────────────────────────────────────

export const CampusContextService = {
  /** Build a fresh, point-in-time unified context from all live module data. */
  build(): CampusContext {
    return {
      generatedAt: new Date().toISOString(),
      students: buildStudents(),
      tickets: buildTickets(),
      maintenance: buildMaintenance(),
      events: buildEvents(),
      resources: buildResources(),
      transport: buildTransport(),
      library: buildLibrary(),
      safety: buildSafety(),
      communications: buildCommunications(),
      iot: buildIoT(),
    };
  },
};
