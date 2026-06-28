import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/queryKeys";
import { calculateResourceOptimization, type ResourceDemand } from "@/lib/scoring";

// Mock campus resource data (will be replaced by backend in Phase 5)
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

// Mock events
const mockEvents = [
  { id: "E001", title: "Hackathon 2.0", date: "2026-07-10", venue: "Main Auditorium", registrations: 120, capacity: 200, status: "Open" },
  { id: "E002", title: "Industry Connect Day", date: "2026-07-15", venue: "Seminar Hall A", registrations: 80, capacity: 80, status: "Full" },
  { id: "E003", title: "Sports Meet", date: "2026-07-20", venue: "Ground", registrations: 300, capacity: 500, status: "Open" },
  { id: "E004", title: "AI Symposium", date: "2026-07-25", venue: "Seminar Hall B", registrations: 60, capacity: 100, status: "Open" },
  { id: "E005", title: "Alumni Talk", date: "2026-08-01", venue: "Main Auditorium", registrations: 150, capacity: 300, status: "Open" },
];

export function useCampusEvents() {
  return useQuery({
    queryKey: QUERY_KEYS.campus.events,
    queryFn: () => mockEvents,
    staleTime: 5 * 60 * 1000,
  });
}

// Mock complaints
const mockComplaints = [
  { id: "C001", category: "Maintenance", subject: "AC not working in Lab 3", status: "Open", priority: "High", createdAt: "2026-06-20", assignedTo: "Maintenance Dept" },
  { id: "C002", category: "Hostel", subject: "Water supply issue in Block B", status: "In Progress", priority: "High", createdAt: "2026-06-21", assignedTo: "Hostel Warden" },
  { id: "C003", category: "Academic", subject: "Timetable clash for ECE 3rd year", status: "Resolved", priority: "Medium", createdAt: "2026-06-18", assignedTo: "Academics Cell" },
  { id: "C004", category: "Safety", subject: "Broken railing near staircase Block C", status: "Open", priority: "Critical", createdAt: "2026-06-23", assignedTo: "Civil Dept" },
  { id: "C005", category: "Library", subject: "Book reservation system offline", status: "Resolved", priority: "Low", createdAt: "2026-06-15", assignedTo: "Librarian" },
];

export function useCampusComplaints() {
  return useQuery({
    queryKey: QUERY_KEYS.campus.complaints,
    queryFn: () => mockComplaints,
    staleTime: 3 * 60 * 1000,
  });
}

// Mock assets
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

// Mock maintenance work orders
const mockMaintenanceTasks = [
  { id: "M001", title: "AC Servicing — Lab Block", priority: "High", status: "In Progress", dueDate: "2026-06-28", assignee: "Rajan Kumar", category: "HVAC" },
  { id: "M002", title: "Electrical Wiring Check — Block B", priority: "Critical", status: "Open", dueDate: "2026-06-26", assignee: "Murugan T.", category: "Electrical" },
  { id: "M003", title: "Plumbing repair — Hostel", priority: "Medium", status: "Done", dueDate: "2026-06-22", assignee: "Selvam P.", category: "Civil" },
  { id: "M004", title: "Network Cable Replacement — CS Dept", priority: "Low", status: "Open", dueDate: "2026-07-05", assignee: "Unassigned", category: "IT" },
  { id: "M005", title: "Broken window — Seminar Hall B", priority: "Medium", status: "In Progress", dueDate: "2026-06-30", assignee: "Selvam P.", category: "Civil" },
];

export function useMaintenanceTasks() {
  return useQuery({
    queryKey: QUERY_KEYS.campus.maintenance,
    queryFn: () => mockMaintenanceTasks,
    staleTime: 3 * 60 * 1000,
  });
}

// Mock transport
const mockTransportRoutes = [
  { id: "R01", route: "Route 1 — Tambaram", busNo: "TN-01-AB-1234", stops: 8, passengers: 42, capacity: 50, driverName: "Rajendran", status: "Running" },
  { id: "R02", route: "Route 2 — Velachery", busNo: "TN-01-CD-5678", stops: 6, passengers: 50, capacity: 50, driverName: "Senthil", status: "Full" },
  { id: "R03", route: "Route 3 — Guindy", busNo: "TN-01-EF-9012", stops: 5, passengers: 30, capacity: 50, driverName: "Kumar", status: "Running" },
  { id: "R04", route: "Route 4 — Porur", busNo: "TN-01-GH-3456", stops: 7, passengers: 45, capacity: 50, driverName: "Anand", status: "Running" },
];

export function useTransportRoutes() {
  return useQuery({
    queryKey: QUERY_KEYS.campus.transport,
    queryFn: () => mockTransportRoutes,
    staleTime: 2 * 60 * 1000,
  });
}

// Mock library data
const mockLibraryData = {
  totalBooks: 45820,
  checkedOut: 2341,
  overdue: 187,
  newArrivals: 45,
  popularBooks: [
    { title: "Deep Learning", author: "Goodfellow et al.", borrows: 142, available: 2 },
    { title: "Clean Code", author: "Robert C. Martin", borrows: 98, available: 5 },
    { title: "The Pragmatic Programmer", author: "Hunt & Thomas", borrows: 87, available: 3 },
    { title: "Designing Data-Intensive Apps", author: "Martin Kleppmann", borrows: 76, available: 1 },
  ],
  dailyVisitors: [210, 185, 230, 198, 242, 178, 260],
};

export function useLibraryData() {
  return useQuery({
    queryKey: QUERY_KEYS.campus.library,
    queryFn: () => mockLibraryData,
    staleTime: 5 * 60 * 1000,
  });
}
