/**
 * CampusIQ — Campus Brain Type System
 * ====================================
 * Central type definitions for the Campus Brain intelligence layer.
 *
 * Campus Brain is the executive AI advisor that sits ABOVE the 19 operational
 * modules. It aggregates every module into a single unified context, reasons
 * across them, predicts problems, and recommends actions.
 *
 * Design rule: every figure surfaced to the user is COMPUTED deterministically
 * from real module data (see CampusContextService). The LLM is only used to
 * narrate the pre-computed context in natural language — it never invents data.
 */

// ─── Priority + Severity ─────────────────────────────────────────────────────
export type Priority = "Critical" | "High" | "Medium" | "Low";
export type Trend = "up" | "down" | "stable";

/** Modules Campus Brain can reference as evidence sources. */
export type ModuleSource =
  | "Students"
  | "Attendance"
  | "Tickets"
  | "Maintenance"
  | "Assets"
  | "Events"
  | "Resources"
  | "Transport"
  | "Library"
  | "Safety"
  | "Communications"
  | "PulseScore"
  | "IoT";

// ─── Unified Campus Context ──────────────────────────────────────────────────
/**
 * The single object built before every reasoning pass or AI request.
 * This is the "working memory" of Campus Brain.
 */
export interface CampusContext {
  generatedAt: string;

  students: StudentsSlice;
  tickets: TicketsSlice;
  maintenance: MaintenanceSlice;
  events: EventsSlice;
  resources: ResourcesSlice;
  transport: TransportSlice;
  library: LibrarySlice;
  safety: SafetySlice;
  communications: CommunicationsSlice;

  /**
   * Extension point for future IoT / sensor feeds. Today this is empty; a
   * real deployment would populate it from an MQTT bridge or sensor API
   * without changing any downstream engine.
   */
  iot: IoTSlice;
}

export interface StudentsSlice {
  total: number;
  avgAttendance: number;
  avgPulseScore: number;
  critical: number;
  atRisk: number;
  safe: number;
  pendingInterventions: number;
  activeInterventions: number;
  /** Students whose attendance trend is falling sharply this period. */
  fallingAttendance: number;
  topRiskStudents: Array<{
    id: string;
    name: string;
    department: string;
    attendance: number;
    pulseScore: number;
    status: string;
    driftType: string;
    reasoningNote: string;
  }>;
  byDepartment: Array<{
    dept: string;
    total: number;
    critical: number;
    avgAttendance: number;
    avgPulse: number;
  }>;
  weeklyRiskTrend: Array<{ week: number; critical: number; atRisk: number; safe: number }>;
}

export interface TicketsSlice {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  critical: number;
  high: number;
  resolutionRate: number; // 0–100
  backlogTrend: Trend;
  oldestOpenDays: number;
  byCategory: Array<{ category: string; count: number }>;
}

export interface MaintenanceSlice {
  total: number;
  open: number;
  inProgress: number;
  done: number;
  critical: number;
  overdue: number;
  completionRate: number; // 0–100
}

export interface EventsSlice {
  total: number;
  upcoming: number;
  avgFillRate: number; // 0–100
  lowParticipation: Array<{ title: string; fillRate: number; date: string }>;
  full: number;
}

export interface ResourcesSlice {
  totalRooms: number;
  activeBookings: number;
  utilizationRate: number; // 0–100 (booked room-hours vs available today)
  overbookedRooms: Array<{ name: string; util: number }>;
}

export interface TransportSlice {
  totalRoutes: number;
  running: number;
  delayed: number;
  full: number;
  avgOccupancy: number; // 0–100
  delayedRoutes: Array<{ route: string; status: string; occupancy: number }>;
}

export interface LibrarySlice {
  totalTitles: number;
  totalCopies: number;
  availableCopies: number;
  utilizationRate: number; // 0–100 (checked-out vs total)
  scarceTitles: Array<{ title: string; available: number; total: number }>;
}

export interface SafetySlice {
  total: number;
  open: number;
  critical: number;
  high: number;
  unresolvedCritical: Array<{ type: string; location: string; severity: string; status: string }>;
}

export interface CommunicationsSlice {
  total: number;
  urgent: number;
  pinned: number;
}

export interface IoTSlice {
  available: boolean;
  sensors: Array<{
    id: string;
    kind: string;
    location: string;
    value: number;
    unit: string;
    status: "ok" | "warn" | "alert";
  }>;
}

// ─── Campus Health Score ─────────────────────────────────────────────────────
/**
 * Operational health index, mirroring the backend PulseScoreSnapshot model:
 * a weighted composite of five operational dimensions.
 */
export interface CampusHealthScore {
  score: number; // 0–100
  label: "Healthy" | "Moderate" | "At Risk" | "Critical";
  trend: Trend;
  breakdown: Array<{
    label: string;
    weight: number;
    rawValue: number;   // the raw dimension value (0–100)
    contribution: number; // points contributed to the final score
  }>;
  computedFrom: {
    attendanceRate: number;
    ticketResolutionRate: number;
    eventParticipationRate: number;
    resourceUtilizationRate: number;
    infrastructureHealthRate: number;
  };
}

// ─── Insights, Risks, Opportunities ──────────────────────────────────────────
export interface Evidence {
  source: ModuleSource;
  detail: string;
  value?: string | number;
}

export interface Risk {
  id: string;
  title: string;
  priority: Priority;
  summary: string;
  module: ModuleSource;
  evidence: Evidence[];
  /** Relative business impact 0–100 used for ranking. */
  impact: number;
}

export interface Opportunity {
  id: string;
  title: string;
  summary: string;
  module: ModuleSource;
  evidence: Evidence[];
  upside: number; // 0–100
}

export interface Alert {
  id: string;
  title: string;
  priority: Priority;
  module: ModuleSource;
  detail: string;
  at: string;
}

// ─── Cross-module reasoning ──────────────────────────────────────────────────
export interface Correlation {
  id: string;
  signals: string[]; // the individual facts being correlated
  inference: string; // the explanation the engine derives
  confidence: number; // 0–100
  module: ModuleSource[];
}

// ─── Predictions ─────────────────────────────────────────────────────────────
export interface Prediction {
  id: string;
  title: string;
  forecast: string;
  confidence: number; // 0–100
  module: ModuleSource;
  horizon: string; // e.g. "Next 7 days"
  evidence: Evidence[];
}

// ─── Recommendations ─────────────────────────────────────────────────────────
export interface Recommendation {
  id: string;
  problem: string;
  rootCause: string;
  evidence: Evidence[];
  confidence: number;
  actions: string[];
  priority: Priority;
  expectedImpact: number; // 0–100, used for ordering
  module: ModuleSource;
  sourceModules: ModuleSource[];
  reasoningSummary: string;
  createdAt: string;
  approvalRequired: true;
}

export type DecisionStatus = "Pending" | "Approved" | "Rejected";
export interface DecisionRecord {
  recommendationId: string;
  status: DecisionStatus;
  decidedAt?: string;
  decidedBy?: string;
}
export type TimelineKind = "signal" | "correlation" | "prediction" | "recommendation";
export interface ExecutiveTimelineEvent {
  id: string;
  at: string;
  kind: TimelineKind;
  title: string;
  detail: string;
  sources: ModuleSource[];
  evidence: Evidence[];
}

// ─── Priority dashboard counts ───────────────────────────────────────────────
export interface PriorityBreakdown {
  Critical: number;
  High: number;
  Medium: number;
  Low: number;
}

// ─── The full executive snapshot ─────────────────────────────────────────────
export interface BrainSnapshot {
  generatedAt: string;
  health: CampusHealthScore;
  priorities: PriorityBreakdown;
  topRisks: Risk[];
  topOpportunities: Opportunity[];
  alerts: Alert[];
  correlations: Correlation[];
  predictions: Prediction[];
  recommendations: Recommendation[];
  timeline: ExecutiveTimelineEvent[];
  /** A deterministic, template-built executive summary (always available). */
  deterministicSummary: string;
  /** The compact context digest handed to the LLM for narration. */
  contextDigest: string;
}

// ─── AI narration envelope ───────────────────────────────────────────────────
export interface BrainAIResponse {
  answer: string;
  confidence: number; // 0–100
  evidence: Evidence[];
  sources: ModuleSource[];
  timestamp: string;
  fallback: boolean; // true when produced by the deterministic narrator
}
