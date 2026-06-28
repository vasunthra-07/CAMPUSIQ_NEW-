import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/queryKeys";
import { calculateResourceOptimization, type ResourceDemand } from "@/lib/scoring";
import {
  ticketStore, eventStore, announcementStore, maintenanceStore,
  libraryStore, transportStore, incidentStore, taskStore, settingsStore, bookingStore,
  type Ticket, type CampusEvent, type Announcement, type MaintenanceTask,
  type SafetyIncident, type StudentTask, type UserSettings, type RoomBooking,
} from "@/services/campusStore";

const mockResources: ResourceDemand[] = [
  { label: "Library Reading Halls", demand: 78, capacity: 100 },
  { label: "Computer Labs", demand: 92, capacity: 100 },
  { label: "Sports Facilities", demand: 55, capacity: 100 },
  { label: "Cafeteria", demand: 88, capacity: 100 },
  { label: "Seminar Halls", demand: 45, capacity: 100 },
  { label: "Parking", demand: 71, capacity: 100 },
];

export function useCampusResources() {
  return useQuery({
    queryKey: QUERY_KEYS.campus.resources,
    queryFn: () => calculateResourceOptimization(mockResources),
    staleTime: 5 * 60 * 1000,
  });
}

// ── Tickets ──────────────────────────────────────────────────────────────────

export function useCampusComplaints() {
  return useQuery({
    queryKey: QUERY_KEYS.campus.complaints,
    queryFn: () => ticketStore.getAll(),
    staleTime: 0,
  });
}

export function useAddTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (t: Omit<Ticket, "id" | "createdAt" | "updatedAt" | "comments">) => {
      const next = ticketStore.add(t);
      return Promise.resolve(next);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.campus.complaints }),
  });
}

export function useUpdateTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Ticket> }) => {
      ticketStore.update(id, patch);
      return Promise.resolve();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.campus.complaints }),
  });
}

export function useAddTicketComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, author, body }: { id: string; author: string; body: string }) => {
      ticketStore.addComment(id, author, body);
      return Promise.resolve();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.campus.complaints }),
  });
}

export function useDeleteTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => { ticketStore.delete(id); return Promise.resolve(); },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.campus.complaints }),
  });
}

// ── Events ──────────────────────────────────────────────────────────────────

export function useCampusEvents() {
  return useQuery({
    queryKey: QUERY_KEYS.campus.events,
    queryFn: () => eventStore.getAll(),
    staleTime: 0,
  });
}

export function useAddEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (e: Omit<CampusEvent, "id" | "registrations" | "registeredUsers" | "status">) => {
      return Promise.resolve(eventStore.add(e));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.campus.events }),
  });
}

export function useUpdateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<CampusEvent> }) => {
      eventStore.update(id, patch);
      return Promise.resolve();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.campus.events }),
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => { eventStore.delete(id); return Promise.resolve(); },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.campus.events }),
  });
}

export function useRegisterEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, userId }: { eventId: string; userId: string }) => {
      eventStore.register(eventId, userId);
      return Promise.resolve();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.campus.events }),
  });
}

export function useUnregisterEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, userId }: { eventId: string; userId: string }) => {
      eventStore.unregister(eventId, userId);
      return Promise.resolve();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.campus.events }),
  });
}

// ── Announcements ────────────────────────────────────────────────────────────

export function useAnnouncements() {
  return useQuery({
    queryKey: ["announcements"],
    queryFn: () => announcementStore.getAll(),
    staleTime: 0,
  });
}

export function useAddAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ann: Omit<Announcement, "id" | "createdAt" | "readBy">) => {
      return Promise.resolve(announcementStore.add(ann));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["announcements"] }),
  });
}

export function useUpdateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Announcement> }) => {
      announcementStore.update(id, patch);
      return Promise.resolve();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["announcements"] }),
  });
}

export function useDeleteAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => { announcementStore.delete(id); return Promise.resolve(); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["announcements"] }),
  });
}

export function useToggleAnnouncementPin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => { announcementStore.togglePin(id); return Promise.resolve(); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["announcements"] }),
  });
}

export function useMarkAnnouncementRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, userId }: { id: string; userId: string }) => {
      announcementStore.markRead(id, userId);
      return Promise.resolve();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["announcements"] }),
  });
}

// ── Maintenance ──────────────────────────────────────────────────────────────

export function useMaintenanceTasks() {
  return useQuery({
    queryKey: QUERY_KEYS.campus.maintenance,
    queryFn: () => maintenanceStore.getAll(),
    staleTime: 0,
  });
}

export function useAddMaintenanceTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (t: Omit<MaintenanceTask, "id" | "createdAt" | "updatedAt" | "comments">) => {
      return Promise.resolve(maintenanceStore.add(t));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.campus.maintenance }),
  });
}

export function useUpdateMaintenanceTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<MaintenanceTask> }) => {
      maintenanceStore.update(id, patch);
      return Promise.resolve();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.campus.maintenance }),
  });
}

export function useDeleteMaintenanceTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => { maintenanceStore.delete(id); return Promise.resolve(); },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.campus.maintenance }),
  });
}

// ── Assets (read-only) ───────────────────────────────────────────────────────

const mockAssets = [
  { id: "A001", name: "Projector - Main Hall", category: "AV Equipment", status: "Active", health: 92, lastService: "2026-05-10" },
  { id: "A002", name: "Server Rack - Data Center", category: "IT Infrastructure", status: "Active", health: 78, lastService: "2026-06-01" },
  { id: "A003", name: "HVAC Unit - Block A", category: "HVAC", status: "Maintenance", health: 45, lastService: "2026-06-22" },
  { id: "A004", name: "Water Purifier - Cafeteria", category: "Utilities", status: "Active", health: 88, lastService: "2026-05-25" },
  { id: "A005", name: "Generator - Admin Block", category: "Power", status: "Active", health: 95, lastService: "2026-06-10" },
  { id: "A006", name: "Fire Suppression System", category: "Safety", status: "Active", health: 100, lastService: "2026-04-15" },
];

export function useCampusAssets() {
  return useQuery({
    queryKey: QUERY_KEYS.campus.assets,
    queryFn: () => mockAssets,
    staleTime: 10 * 60 * 1000,
  });
}

// ── Transport ────────────────────────────────────────────────────────────────

export function useTransportRoutes() {
  return useQuery({
    queryKey: QUERY_KEYS.campus.transport,
    queryFn: () => transportStore.getAll(),
    staleTime: 0,
  });
}

export function useRequestTransportSeat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ routeId, userId, name, stop }: { routeId: string; userId: string; name: string; stop: string }) => {
      transportStore.requestSeat(routeId, userId, name, stop);
      return Promise.resolve();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.campus.transport }),
  });
}

export function useCancelTransportSeat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ routeId, userId }: { routeId: string; userId: string }) => {
      transportStore.cancelSeat(routeId, userId);
      return Promise.resolve();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.campus.transport }),
  });
}

// ── Library ──────────────────────────────────────────────────────────────────

export function useLibraryBooks() {
  return useQuery({
    queryKey: QUERY_KEYS.campus.library,
    queryFn: () => libraryStore.getAll(),
    staleTime: 0,
  });
}

export function useReserveBook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bookId, userId }: { bookId: string; userId: string }) => {
      libraryStore.reserve(bookId, userId);
      return Promise.resolve();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.campus.library }),
  });
}

export function useCancelReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bookId, userId }: { bookId: string; userId: string }) => {
      libraryStore.cancelReservation(bookId, userId);
      return Promise.resolve();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.campus.library }),
  });
}

export function useReturnBook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bookId, userId }: { bookId: string; userId: string }) => {
      libraryStore.returnBook(bookId, userId);
      return Promise.resolve();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.campus.library }),
  });
}

// ── Library summary stats (for dashboard) ───────────────────────────────────

export function useLibraryData() {
  return useQuery({
    queryKey: ["library_summary"],
    queryFn: () => {
      const books = libraryStore.getAll();
      const checkedOut = books.reduce((a, b) => a + b.checkedOutBy.length, 0);
      const totalBooks = books.reduce((a, b) => a + b.totalCopies, 0);
      return {
        totalBooks: 45820,
        checkedOut: 2341 + checkedOut,
        overdue: 187,
        newArrivals: 45,
        popularBooks: [...books].sort((a, b) => b.borrows - a.borrows).slice(0, 4).map(b => ({ title: b.title, author: b.author, borrows: b.borrows, available: b.availableCopies })),
        dailyVisitors: [210, 185, 230, 198, 242, 178, 260],
      };
    },
    staleTime: 0,
  });
}

// ── Safety Incidents ─────────────────────────────────────────────────────────

export function useSafetyIncidents() {
  return useQuery({
    queryKey: ["safety_incidents"],
    queryFn: () => incidentStore.getAll(),
    staleTime: 0,
  });
}

export function useReportIncident() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (inc: Omit<SafetyIncident, "id" | "reportedAt" | "status">) => {
      return Promise.resolve(incidentStore.add(inc));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["safety_incidents"] }),
  });
}

export function useUpdateIncident() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<SafetyIncident> }) => {
      incidentStore.update(id, patch);
      return Promise.resolve();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["safety_incidents"] }),
  });
}

// ── Student Tasks ────────────────────────────────────────────────────────────

export function useStudentTasks() {
  return useQuery({
    queryKey: ["student_tasks"],
    queryFn: () => taskStore.getAll(),
    staleTime: 0,
  });
}

export function useToggleTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => { taskStore.toggle(id); return Promise.resolve(); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["student_tasks"] }),
  });
}

export function useAddTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (t: Omit<StudentTask, "id" | "done">) => Promise.resolve(taskStore.add(t)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["student_tasks"] }),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => { taskStore.delete(id); return Promise.resolve(); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["student_tasks"] }),
  });
}

// ── Room Bookings ─────────────────────────────────────────────────────────────

export function useRoomBookings() {
  return useQuery({
    queryKey: ["room_bookings"],
    queryFn: () => bookingStore.getAll(),
    staleTime: 0,
  });
}

export function useAddRoomBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (b: Omit<RoomBooking, "id" | "createdAt" | "status">) => Promise.resolve(bookingStore.add(b)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["room_bookings"] }),
  });
}

export function useCancelRoomBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => { bookingStore.cancel(id); return Promise.resolve(); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["room_bookings"] }),
  });
}

// ── User Settings ────────────────────────────────────────────────────────────

export function useUserSettings(userId: string, userName: string) {
  return useQuery({
    queryKey: ["settings", userId],
    queryFn: () => settingsStore.get(userId, userName),
    staleTime: 0,
  });
}

export function useSaveSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, settings }: { userId: string; settings: UserSettings }) => {
      settingsStore.save(userId, settings);
      return Promise.resolve();
    },
    onSuccess: (_data, { userId }) => qc.invalidateQueries({ queryKey: ["settings", userId] }),
  });
}
