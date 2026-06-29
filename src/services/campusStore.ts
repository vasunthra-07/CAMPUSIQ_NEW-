// Central localStorage-backed mock store — simulates a real backend with CRUD
// Replace individual functions with real API calls when backend is ready.

function loadStore<T>(key: string, initial: T): T {
  try {
    const raw = localStorage.getItem(`ciq_${key}`);
    return raw ? (JSON.parse(raw) as T) : initial;
  } catch {
    return initial;
  }
}

function saveStore<T>(key: string, data: T): void {
  localStorage.setItem(`ciq_${key}`, JSON.stringify(data));
  window.dispatchEvent(new CustomEvent("campusiq:module-change", {
    detail: { module: key, action: "updated", at: new Date().toISOString() },
  }));
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface Ticket {
  id: string;
  category: string;
  subject: string;
  description: string;
  status: "Open" | "In Progress" | "Resolved" | "Closed";
  priority: "Critical" | "High" | "Medium" | "Low";
  assignedTo: string;
  createdAt: string;
  updatedAt: string;
  comments: TicketComment[];
  raisedBy: string;
}

export interface TicketComment {
  id: string;
  author: string;
  body: string;
  createdAt: string;
}

export interface CampusEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  organizer: string;
  registrations: number;
  capacity: number;
  status: "Open" | "Full" | "Cancelled" | "Completed";
  category: string;
  registeredUsers: string[];
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  author: string;
  category: string;
  priority: "Normal" | "Important" | "Urgent";
  pinned: boolean;
  readBy: string[];
  createdAt: string;
}

export interface MaintenanceTask {
  id: string;
  title: string;
  description: string;
  priority: "Critical" | "High" | "Medium" | "Low";
  status: "Open" | "In Progress" | "Done" | "Cancelled";
  dueDate: string;
  assignee: string;
  category: string;
  createdAt: string;
  updatedAt: string;
  comments: string[];
}

export interface LibraryBook {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  totalCopies: number;
  availableCopies: number;
  borrows: number;
  reservedBy: string[];
  checkedOutBy: { userId: string; dueDate: string }[];
}

export interface TransportRoute {
  id: string;
  route: string;
  busNo: string;
  stops: number;
  passengers: number;
  capacity: number;
  driverName: string;
  driverPhone: string;
  status: "Running" | "Full" | "Delayed" | "Off Duty";
  departureTime: string;
  arrivalTime: string;
  requestedSeats: { userId: string; name: string; stop: string }[];
}

export interface SafetyIncident {
  id: string;
  type: "Accident" | "Fire" | "Medical" | "Security" | "Infrastructure" | "Other";
  description: string;
  location: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  status: "Reported" | "Responding" | "Resolved";
  reportedBy: string;
  reportedAt: string;
  resolvedAt?: string;
}

export interface StudentTask {
  id: string;
  label: string;
  due: string;
  done: boolean;
  priority: "High" | "Medium" | "Low";
  category: string;
}

export interface UserSettings {
  displayName: string;
  email: string;
  notifications: {
    email: boolean;
    push: boolean;
    riskAlerts: boolean;
    weeklyReport: boolean;
    eventReminders: boolean;
  };
  theme: string;
  language: string;
}

export interface RoomBooking {
  id: string;
  roomId: string;
  roomName: string;
  date: string;
  startTime: string;
  endTime: string;
  purpose: string;
  bookedBy: string;
  bookedByName: string;
  attendees: number;
  status: "Confirmed" | "Pending" | "Cancelled";
  createdAt: string;
}

export interface CampusRoom {
  id: string;
  name: string;
  type: "Classroom" | "Lab" | "Seminar Hall" | "Auditorium" | "Conference Room" | "Study Room";
  capacity: number;
  floor: string;
  block: string;
  amenities: string[];
  available: boolean;
}

// ── Initial Data ────────────────────────────────────────────────────────────

const INITIAL_TICKETS: Ticket[] = [
  { id: "C001", category: "Maintenance", subject: "AC not working in Lab 3", description: "The air conditioning unit in Lab 3 has been non-functional for 3 days. Temperature is affecting student comfort and equipment.", status: "Open", priority: "High", createdAt: "2026-06-20", updatedAt: "2026-06-20", assignedTo: "Maintenance Dept", raisedBy: "Faculty - Dr. Anand", comments: [{ id: "cm1", author: "Admin", body: "Team dispatched. Will inspect by EOD.", createdAt: "2026-06-20" }] },
  { id: "C002", category: "Hostel", subject: "Water supply issue in Block B", description: "No water supply in Block B hostel since morning. Affects 120 residents.", status: "In Progress", priority: "High", createdAt: "2026-06-21", updatedAt: "2026-06-22", assignedTo: "Hostel Warden", raisedBy: "Warden - Block B", comments: [] },
  { id: "C003", category: "Academic", subject: "Timetable clash for ECE 3rd year", description: "Two core subjects scheduled at same time slot on Thursdays for ECE 3rd year batch.", status: "Resolved", priority: "Medium", createdAt: "2026-06-18", updatedAt: "2026-06-19", assignedTo: "Academics Cell", raisedBy: "Class Representative", comments: [{ id: "cm2", author: "Academics Cell", body: "Timetable revised. New schedule published on portal.", createdAt: "2026-06-19" }] },
  { id: "C004", category: "Safety", subject: "Broken railing near staircase Block C", description: "The metal railing near the 2nd floor staircase in Block C is broken and poses a fall risk.", status: "Open", priority: "Critical", createdAt: "2026-06-23", updatedAt: "2026-06-23", assignedTo: "Civil Dept", raisedBy: "Security Staff", comments: [] },
  { id: "C005", category: "Library", subject: "Book reservation system offline", description: "Library online reservation portal is showing 500 error since 2 days.", status: "Resolved", priority: "Low", createdAt: "2026-06-15", updatedAt: "2026-06-16", assignedTo: "Librarian", raisedBy: "Student - CIT06", comments: [] },
];

const INITIAL_EVENTS: CampusEvent[] = [
  { id: "E001", title: "Hackathon 2.0", description: "Annual 24-hour coding hackathon open to all engineering students. Prizes worth ₹1,00,000.", date: "2026-07-10", time: "09:00 AM", venue: "Main Auditorium", organizer: "Student Affairs", registrations: 120, capacity: 200, status: "Open", category: "Technical", registeredUsers: [] },
  { id: "E002", title: "Industry Connect Day", description: "Meet and network with industry leaders from top tech companies. Resume reviews available.", date: "2026-07-15", time: "10:00 AM", venue: "Seminar Hall A", organizer: "Placement Cell", registrations: 80, capacity: 80, status: "Full", category: "Career", registeredUsers: [] },
  { id: "E003", title: "Sports Meet 2026", description: "Inter-department sports tournament. Events include cricket, football, basketball, and athletics.", date: "2026-07-20", time: "07:00 AM", venue: "Ground", organizer: "Sports Dept", registrations: 300, capacity: 500, status: "Open", category: "Sports", registeredUsers: [] },
  { id: "E004", title: "AI Symposium", description: "Research presentations and keynote talks on Artificial Intelligence and Machine Learning trends.", date: "2026-07-25", time: "09:30 AM", venue: "Seminar Hall B", organizer: "AI & DS Dept", registrations: 60, capacity: 100, status: "Open", category: "Technical", registeredUsers: [] },
  { id: "E005", title: "Alumni Talk Series", description: "Senior alumni from top MNCs share career insights and industry experiences.", date: "2026-08-01", time: "02:00 PM", venue: "Main Auditorium", organizer: "Alumni Cell", registrations: 150, capacity: 300, status: "Open", category: "Career", registeredUsers: [] },
];

const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  { id: "AN01", title: "Campus Maintenance on Saturday", body: "Scheduled power outage from 6AM–10AM affecting Labs B and C. Please save all work beforehand.", author: "Admin Office", category: "Infrastructure", priority: "Important", pinned: true, readBy: [], createdAt: "2026-06-28T08:00:00" },
  { id: "AN02", title: "Hackathon 2.0 — Final Registrations Open", body: "Last day to register for the annual hackathon is July 5th. Teams of 3–4. Register on the student portal.", author: "Student Affairs", category: "Events", priority: "Normal", pinned: false, readBy: [], createdAt: "2026-06-28T05:00:00" },
  { id: "AN03", title: "End-Semester Exam Schedule Released", body: "Check the academic portal for your individual schedule. Exam hall assignments will be posted 48 hours before exams.", author: "Academics Cell", category: "Academic", priority: "Important", pinned: false, readBy: [], createdAt: "2026-06-27T09:00:00" },
  { id: "AN04", title: "New Library Timing (Effective July 1)", body: "Library will now be open until 10PM on weekdays. Saturday hours extended to 8PM.", author: "Librarian", category: "Facilities", priority: "Normal", pinned: false, readBy: [], createdAt: "2026-06-26T10:00:00" },
];

const INITIAL_MAINTENANCE: MaintenanceTask[] = [
  { id: "M001", title: "AC Servicing — Lab Block", description: "Annual servicing and coolant refill for all AC units in the Lab Block (3rd floor).", priority: "High", status: "In Progress", dueDate: "2026-06-28", assignee: "Rajan Kumar", category: "HVAC", createdAt: "2026-06-24", updatedAt: "2026-06-25", comments: ["Servicing in progress. 4 units done, 2 remaining."] },
  { id: "M002", title: "Electrical Wiring Check — Block B", description: "Urgent inspection of old wiring in Block B basement. Reported sparking from junction box.", priority: "Critical", status: "Open", dueDate: "2026-06-26", assignee: "Murugan T.", category: "Electrical", createdAt: "2026-06-23", updatedAt: "2026-06-23", comments: [] },
  { id: "M003", title: "Plumbing repair — Hostel", description: "Repair leaking pipes in Boys Hostel Block A, rooms 201–210.", priority: "Medium", status: "Done", dueDate: "2026-06-22", assignee: "Selvam P.", category: "Civil", createdAt: "2026-06-20", updatedAt: "2026-06-22", comments: ["Completed. Pipes replaced and tested."] },
  { id: "M004", title: "Network Cable Replacement — CS Dept", description: "Replace aging Cat5 cables with Cat6 in all CS department labs.", priority: "Low", status: "Open", dueDate: "2026-07-05", assignee: "Unassigned", category: "IT", createdAt: "2026-06-25", updatedAt: "2026-06-25", comments: [] },
  { id: "M005", title: "Broken window — Seminar Hall B", description: "Replace broken window pane in Seminar Hall B (2nd floor). Safety hazard during rain.", priority: "Medium", status: "In Progress", dueDate: "2026-06-30", assignee: "Selvam P.", category: "Civil", createdAt: "2026-06-24", updatedAt: "2026-06-26", comments: ["Glass ordered, installation scheduled for tomorrow."] },
];

const INITIAL_BOOKS: LibraryBook[] = [
  { id: "B001", title: "Deep Learning", author: "Goodfellow, Bengio & Courville", isbn: "978-0-262-03561-3", category: "AI/ML", totalCopies: 5, availableCopies: 2, borrows: 142, reservedBy: [], checkedOutBy: [] },
  { id: "B002", title: "Clean Code", author: "Robert C. Martin", isbn: "978-0-13-235088-4", category: "Software Engineering", totalCopies: 8, availableCopies: 5, borrows: 98, reservedBy: [], checkedOutBy: [] },
  { id: "B003", title: "The Pragmatic Programmer", author: "Hunt & Thomas", isbn: "978-0-13-595705-9", category: "Software Engineering", totalCopies: 6, availableCopies: 3, borrows: 87, reservedBy: [], checkedOutBy: [] },
  { id: "B004", title: "Designing Data-Intensive Applications", author: "Martin Kleppmann", isbn: "978-1-4920-3205-1", category: "Systems", totalCopies: 4, availableCopies: 1, borrows: 76, reservedBy: [], checkedOutBy: [] },
  { id: "B005", title: "Introduction to Algorithms", author: "Cormen, Leiserson, Rivest & Stein", isbn: "978-0-262-04630-5", category: "Computer Science", totalCopies: 10, availableCopies: 7, borrows: 65, reservedBy: [], checkedOutBy: [] },
  { id: "B006", title: "Computer Networks", author: "Andrew S. Tanenbaum", isbn: "978-0-13-212695-3", category: "Networking", totalCopies: 7, availableCopies: 4, borrows: 54, reservedBy: [], checkedOutBy: [] },
  { id: "B007", title: "Operating System Concepts", author: "Silberschatz, Galvin & Gagne", isbn: "978-1-119-32091-3", category: "Systems", totalCopies: 9, availableCopies: 6, borrows: 48, reservedBy: [], checkedOutBy: [] },
  { id: "B008", title: "Database System Concepts", author: "Silberschatz, Korth & Sudarshan", isbn: "978-0-07-352332-3", category: "Database", totalCopies: 6, availableCopies: 3, borrows: 42, reservedBy: [], checkedOutBy: [] },
];

const INITIAL_ROUTES: TransportRoute[] = [
  { id: "R01", route: "Route 1 — Tambaram", busNo: "TN-01-AB-1234", stops: 8, passengers: 42, capacity: 50, driverName: "Rajendran", driverPhone: "98400-11111", status: "Running", departureTime: "07:30 AM", arrivalTime: "08:45 AM", requestedSeats: [] },
  { id: "R02", route: "Route 2 — Velachery", busNo: "TN-01-CD-5678", stops: 6, passengers: 50, capacity: 50, driverName: "Senthil", driverPhone: "98400-22222", status: "Full", departureTime: "07:15 AM", arrivalTime: "08:30 AM", requestedSeats: [] },
  { id: "R03", route: "Route 3 — Guindy", busNo: "TN-01-EF-9012", stops: 5, passengers: 30, capacity: 50, driverName: "Kumar", driverPhone: "98400-33333", status: "Running", departureTime: "07:45 AM", arrivalTime: "08:45 AM", requestedSeats: [] },
  { id: "R04", route: "Route 4 — Porur", busNo: "TN-01-GH-3456", stops: 7, passengers: 45, capacity: 50, driverName: "Anand", driverPhone: "98400-44444", status: "Running", departureTime: "07:00 AM", arrivalTime: "08:30 AM", requestedSeats: [] },
];

const INITIAL_INCIDENTS: SafetyIncident[] = [
  { id: "INC001", type: "Infrastructure", description: "Broken railing near Block C staircase 2nd floor.", location: "Block C", severity: "High", status: "Reported", reportedBy: "Security Staff", reportedAt: "2026-06-23T10:30:00" },
];

const INITIAL_TASKS: StudentTask[] = [
  { id: "T1", label: "Submit ML assignment", due: "2026-06-28", done: false, priority: "High", category: "Academic" },
  { id: "T2", label: "Register for Hackathon 2.0", due: "2026-07-05", done: false, priority: "Medium", category: "Events" },
  { id: "T3", label: "Complete LMS module 4", due: "2026-07-08", done: true, priority: "Medium", category: "Academic" },
  { id: "T4", label: "Collect library book reservation", due: "2026-06-29", done: false, priority: "Low", category: "Library" },
];

const INITIAL_SETTINGS: UserSettings = {
  displayName: "",
  email: "",
  notifications: { email: true, push: true, riskAlerts: true, weeklyReport: false, eventReminders: true },
  theme: "dark",
  language: "English",
};

// ── Store Accessors ─────────────────────────────────────────────────────────

export const ticketStore = {
  getAll: () => loadStore<Ticket[]>("tickets", INITIAL_TICKETS),
  save: (tickets: Ticket[]) => saveStore("tickets", tickets),
  add: (t: Omit<Ticket, "id" | "createdAt" | "updatedAt" | "comments">) => {
    const all = ticketStore.getAll();
    const next: Ticket = {
      ...t,
      id: `C${String(all.length + 1).padStart(3, "0")}`,
      createdAt: new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString().split("T")[0],
      comments: [],
    };
    ticketStore.save([...all, next]);
    return next;
  },
  update: (id: string, patch: Partial<Ticket>) => {
    const all = ticketStore.getAll().map(t => t.id === id ? { ...t, ...patch, updatedAt: new Date().toISOString().split("T")[0] } : t);
    ticketStore.save(all);
  },
  addComment: (id: string, author: string, body: string) => {
    const all = ticketStore.getAll().map(t => {
      if (t.id !== id) return t;
      const comment: TicketComment = { id: `cm${Date.now()}`, author, body, createdAt: new Date().toISOString() };
      return { ...t, comments: [...t.comments, comment], updatedAt: new Date().toISOString().split("T")[0] };
    });
    ticketStore.save(all);
  },
  delete: (id: string) => ticketStore.save(ticketStore.getAll().filter(t => t.id !== id)),
};

export const eventStore = {
  getAll: () => loadStore<CampusEvent[]>("events", INITIAL_EVENTS),
  save: (events: CampusEvent[]) => saveStore("events", events),
  add: (e: Omit<CampusEvent, "id" | "registrations" | "registeredUsers" | "status">) => {
    const all = eventStore.getAll();
    const next: CampusEvent = { ...e, id: `E${String(all.length + 1).padStart(3, "0")}`, registrations: 0, registeredUsers: [], status: "Open" };
    eventStore.save([...all, next]);
    return next;
  },
  update: (id: string, patch: Partial<CampusEvent>) => {
    const all = eventStore.getAll().map(e => e.id === id ? { ...e, ...patch } : e);
    eventStore.save(all);
  },
  delete: (id: string) => eventStore.save(eventStore.getAll().filter(e => e.id !== id)),
  register: (eventId: string, userId: string) => {
    const all = eventStore.getAll().map(e => {
      if (e.id !== eventId || e.registeredUsers.includes(userId)) return e;
      const newReg = e.registrations + 1;
      return { ...e, registrations: newReg, registeredUsers: [...e.registeredUsers, userId], status: (newReg >= e.capacity ? "Full" : "Open") as CampusEvent["status"] };
    });
    eventStore.save(all);
  },
  unregister: (eventId: string, userId: string) => {
    const all = eventStore.getAll().map(e => {
      if (e.id !== eventId) return e;
      const newReg = Math.max(0, e.registrations - 1);
      return { ...e, registrations: newReg, registeredUsers: e.registeredUsers.filter(u => u !== userId), status: "Open" as CampusEvent["status"] };
    });
    eventStore.save(all);
  },
};

export const announcementStore = {
  getAll: () => loadStore<Announcement[]>("announcements", INITIAL_ANNOUNCEMENTS),
  save: (a: Announcement[]) => saveStore("announcements", a),
  add: (ann: Omit<Announcement, "id" | "createdAt" | "readBy">) => {
    const all = announcementStore.getAll();
    const next: Announcement = { ...ann, id: `AN${String(all.length + 1).padStart(2, "0")}`, createdAt: new Date().toISOString(), readBy: [] };
    announcementStore.save([next, ...all]);
    return next;
  },
  update: (id: string, patch: Partial<Announcement>) => {
    announcementStore.save(announcementStore.getAll().map(a => a.id === id ? { ...a, ...patch } : a));
  },
  delete: (id: string) => announcementStore.save(announcementStore.getAll().filter(a => a.id !== id)),
  togglePin: (id: string) => {
    announcementStore.save(announcementStore.getAll().map(a => a.id === id ? { ...a, pinned: !a.pinned } : a));
  },
  markRead: (id: string, userId: string) => {
    announcementStore.save(announcementStore.getAll().map(a => a.id === id && !a.readBy.includes(userId) ? { ...a, readBy: [...a.readBy, userId] } : a));
  },
};

export const maintenanceStore = {
  getAll: () => loadStore<MaintenanceTask[]>("maintenance", INITIAL_MAINTENANCE),
  save: (tasks: MaintenanceTask[]) => saveStore("maintenance", tasks),
  add: (t: Omit<MaintenanceTask, "id" | "createdAt" | "updatedAt" | "comments">) => {
    const all = maintenanceStore.getAll();
    const next: MaintenanceTask = { ...t, id: `M${String(all.length + 1).padStart(3, "0")}`, createdAt: new Date().toISOString().split("T")[0], updatedAt: new Date().toISOString().split("T")[0], comments: [] };
    maintenanceStore.save([...all, next]);
    return next;
  },
  update: (id: string, patch: Partial<MaintenanceTask>) => {
    maintenanceStore.save(maintenanceStore.getAll().map(t => t.id === id ? { ...t, ...patch, updatedAt: new Date().toISOString().split("T")[0] } : t));
  },
  delete: (id: string) => maintenanceStore.save(maintenanceStore.getAll().filter(t => t.id !== id)),
};

export const libraryStore = {
  getAll: () => loadStore<LibraryBook[]>("library_books", INITIAL_BOOKS),
  save: (books: LibraryBook[]) => saveStore("library_books", books),
  reserve: (bookId: string, userId: string) => {
    libraryStore.save(libraryStore.getAll().map(b => {
      if (b.id !== bookId || b.reservedBy.includes(userId)) return b;
      return { ...b, reservedBy: [...b.reservedBy, userId], availableCopies: Math.max(0, b.availableCopies - 1) };
    }));
  },
  cancelReservation: (bookId: string, userId: string) => {
    libraryStore.save(libraryStore.getAll().map(b => {
      if (b.id !== bookId) return b;
      return { ...b, reservedBy: b.reservedBy.filter(u => u !== userId), availableCopies: Math.min(b.totalCopies, b.availableCopies + 1) };
    }));
  },
  checkout: (bookId: string, userId: string) => {
    const dueDate = new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0];
    libraryStore.save(libraryStore.getAll().map(b => {
      if (b.id !== bookId || b.availableCopies <= 0) return b;
      return { ...b, availableCopies: b.availableCopies - 1, borrows: b.borrows + 1, checkedOutBy: [...b.checkedOutBy, { userId, dueDate }] };
    }));
  },
  returnBook: (bookId: string, userId: string) => {
    libraryStore.save(libraryStore.getAll().map(b => {
      if (b.id !== bookId) return b;
      return { ...b, availableCopies: Math.min(b.totalCopies, b.availableCopies + 1), checkedOutBy: b.checkedOutBy.filter(c => c.userId !== userId) };
    }));
  },
};

export const transportStore = {
  getAll: () => loadStore<TransportRoute[]>("transport", INITIAL_ROUTES),
  save: (routes: TransportRoute[]) => saveStore("transport", routes),
  requestSeat: (routeId: string, userId: string, name: string, stop: string) => {
    transportStore.save(transportStore.getAll().map(r => {
      if (r.id !== routeId || r.requestedSeats.find(s => s.userId === userId)) return r;
      return { ...r, requestedSeats: [...r.requestedSeats, { userId, name, stop }] };
    }));
  },
  cancelSeat: (routeId: string, userId: string) => {
    transportStore.save(transportStore.getAll().map(r => ({
      ...r, requestedSeats: r.requestedSeats.filter(s => s.userId !== userId),
    })));
  },
};

export const incidentStore = {
  getAll: () => loadStore<SafetyIncident[]>("incidents", INITIAL_INCIDENTS),
  save: (incidents: SafetyIncident[]) => saveStore("incidents", incidents),
  add: (inc: Omit<SafetyIncident, "id" | "reportedAt" | "status">) => {
    const all = incidentStore.getAll();
    const next: SafetyIncident = { ...inc, id: `INC${String(all.length + 1).padStart(3, "0")}`, reportedAt: new Date().toISOString(), status: "Reported" };
    incidentStore.save([next, ...all]);
    return next;
  },
  update: (id: string, patch: Partial<SafetyIncident>) => {
    incidentStore.save(incidentStore.getAll().map(i => i.id === id ? { ...i, ...patch } : i));
  },
};

export const taskStore = {
  getAll: () => loadStore<StudentTask[]>("student_tasks", INITIAL_TASKS),
  save: (tasks: StudentTask[]) => saveStore("student_tasks", tasks),
  toggle: (id: string) => {
    taskStore.save(taskStore.getAll().map(t => t.id === id ? { ...t, done: !t.done } : t));
  },
  add: (t: Omit<StudentTask, "id" | "done">) => {
    const all = taskStore.getAll();
    const next: StudentTask = { ...t, id: `T${Date.now()}`, done: false };
    taskStore.save([...all, next]);
    return next;
  },
  delete: (id: string) => taskStore.save(taskStore.getAll().filter(t => t.id !== id)),
};

export const settingsStore = {
  get: (userId: string, userName: string) => {
    const stored = loadStore<UserSettings | null>(`settings_${userId}`, null);
    if (stored) return stored;
    return { ...INITIAL_SETTINGS, displayName: userName, email: `${userId.toLowerCase()}@campusiq.edu` };
  },
  save: (userId: string, settings: UserSettings) => saveStore(`settings_${userId}`, settings),
};

export const CAMPUS_ROOMS: CampusRoom[] = [
  { id: "RM01", name: "Lab 3 — CS Block", type: "Lab", capacity: 40, floor: "2nd", block: "CS Block", amenities: ["AC", "Projector", "Whiteboard", "30 Workstations"], available: true },
  { id: "RM02", name: "Seminar Hall A", type: "Seminar Hall", capacity: 80, floor: "1st", block: "Main Block", amenities: ["AC", "Projector", "Podium", "Sound System", "Whiteboard"], available: true },
  { id: "RM03", name: "Seminar Hall B", type: "Seminar Hall", capacity: 100, floor: "2nd", block: "Main Block", amenities: ["AC", "Dual Projector", "Podium", "Sound System", "Recording Setup"], available: true },
  { id: "RM04", name: "Main Auditorium", type: "Auditorium", capacity: 500, floor: "Ground", block: "Central", amenities: ["AC", "Stage", "Professional Sound", "LED Display", "Green Room"], available: true },
  { id: "RM05", name: "Conference Room 1", type: "Conference Room", capacity: 20, floor: "3rd", block: "Admin Block", amenities: ["AC", "Video Conferencing", "Smart Board", "Whiteboard"], available: true },
  { id: "RM06", name: "Conference Room 2", type: "Conference Room", capacity: 15, floor: "3rd", block: "Admin Block", amenities: ["AC", "Smart Board", "Whiteboard"], available: true },
  { id: "RM07", name: "Study Room A", type: "Study Room", capacity: 10, floor: "1st", block: "Library Block", amenities: ["AC", "Whiteboard", "WiFi"], available: true },
  { id: "RM08", name: "Study Room B", type: "Study Room", capacity: 10, floor: "1st", block: "Library Block", amenities: ["AC", "Whiteboard", "WiFi"], available: true },
  { id: "RM09", name: "Classroom 101", type: "Classroom", capacity: 60, floor: "1st", block: "CS Block", amenities: ["Fan", "Blackboard", "Projector"], available: true },
  { id: "RM10", name: "Computer Lab — ECE", type: "Lab", capacity: 35, floor: "2nd", block: "ECE Block", amenities: ["AC", "Projector", "25 Workstations", "Oscilloscopes"], available: true },
];

const INITIAL_BOOKINGS: RoomBooking[] = [
  { id: "BK001", roomId: "RM02", roomName: "Seminar Hall A", date: "2026-06-29", startTime: "10:00", endTime: "12:00", purpose: "Department Review Meeting", bookedBy: "faculty01", bookedByName: "Dr. Anand Kumar", attendees: 40, status: "Confirmed", createdAt: "2026-06-27T09:00:00" },
  { id: "BK002", roomId: "RM05", roomName: "Conference Room 1", date: "2026-06-30", startTime: "14:00", endTime: "15:30", purpose: "HOD Sync Meeting", bookedBy: "hod01", bookedByName: "Prof. Meena", attendees: 10, status: "Confirmed", createdAt: "2026-06-27T10:00:00" },
  { id: "BK003", roomId: "RM04", roomName: "Main Auditorium", date: "2026-07-10", startTime: "09:00", endTime: "18:00", purpose: "Hackathon 2.0", bookedBy: "admin01", bookedByName: "Student Affairs", attendees: 200, status: "Confirmed", createdAt: "2026-06-25T08:00:00" },
];

export const bookingStore = {
  getAll: () => loadStore<RoomBooking[]>("room_bookings", INITIAL_BOOKINGS),
  save: (bookings: RoomBooking[]) => saveStore("room_bookings", bookings),
  add: (b: Omit<RoomBooking, "id" | "createdAt" | "status">) => {
    const all = bookingStore.getAll();
    const next: RoomBooking = { ...b, id: `BK${String(all.length + 1).padStart(3, "0")}`, status: "Confirmed", createdAt: new Date().toISOString() };
    bookingStore.save([...all, next]);
    return next;
  },
  cancel: (id: string) => {
    bookingStore.save(bookingStore.getAll().map(b => b.id === id ? { ...b, status: "Cancelled" } : b));
  },
  hasConflict: (roomId: string, date: string, startTime: string, endTime: string, excludeId?: string) => {
    return bookingStore.getAll().some(b => {
      if (b.roomId !== roomId || b.date !== date || b.status === "Cancelled") return false;
      if (excludeId && b.id === excludeId) return false;
      return startTime < b.endTime && endTime > b.startTime;
    });
  },
};
