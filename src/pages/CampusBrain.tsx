/**
 * CampusIQ — Campus Brain (Executive Dashboard)
 * =============================================
 * The flagship feature: one screen that lets an administrator understand the
 * entire campus in under 30 seconds — what's happening, why, what's next, and
 * what to do — without opening any of the 19 individual modules.
 *
 * All intelligence comes from the CampusBrainController (deterministic engines
 * + AI narration with graceful fallback). This component only renders.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BrainCircuit, Activity, AlertTriangle, ShieldAlert, TrendingUp,
  Lightbulb, Sparkles, Send, Target, Network, Clock, ChevronRight, Gauge, CheckCircle2,
  XCircle, GitBranch,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { PageHeader, WorkspacePanel, MetricTile, StatusBadge } from "@/components/workspace";
import { cn } from "@/lib/utils";
import { CampusBrainController, DecisionLogService } from "@/services/campusBrain";
import { useRealtime } from "@/services/realtime/RealtimeContext";
import { DecisionPanel, ResiliencePanel, SimulationPanel } from "@/components/orchestrator/ExecutiveOrchestration";
import { AIReasoningPanel, CampusMemoryPanel, EnterpriseDecisionPanel } from "@/components/ai/EnterpriseAI";
import type {
  BrainSnapshot, BrainAIResponse, Priority, Risk, Recommendation, DecisionRecord,
} from "@/services/campusBrain";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const PRIORITY_VARIANT: Record<Priority, "danger" | "warning" | "info" | "neutral"> = {
  Critical: "danger",
  High: "warning",
  Medium: "info",
  Low: "neutral",
};

function healthColor(label: BrainSnapshot["health"]["label"]): string {
  switch (label) {
    case "Healthy": return "hsl(145 60% 42%)";
    case "Moderate": return "hsl(210 100% 60%)";
    case "At Risk": return "hsl(30 100% 55%)";
    case "Critical": return "hsl(0 84% 60%)";
    default: return "hsl(210 100% 60%)";
  }
}

function confidenceColor(c: number): string {
  if (c >= 75) return "bg-emerald-500";
  if (c >= 50) return "bg-amber-500";
  return "bg-red-500";
}

const SUGGESTED_QUESTIONS = [
  "What requires my attention today?",
  "Why is campus health at this level?",
  "Which building needs maintenance first?",
  "Which students need intervention?",
  "What is affecting attendance?",
  "Summarize today's operations.",
];

interface ChatTurn { role: "user" | "brain"; content: string; meta?: BrainAIResponse; }

// ─── Health gauge ────────────────────────────────────────────────────────────
function HealthGauge({ score, label, trend }: { score: number; label: string; trend: string }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);
  const color = healthColor(label as BrainSnapshot["health"]["label"]);
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative h-[140px] w-[140px]">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 130 130">
          <circle cx="65" cy="65" r={r} fill="none" stroke="hsl(var(--border))" strokeWidth="10" />
          <motion.circle
            cx="65" cy="65" r={r} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1] }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold tabular-nums text-foreground">{score}</span>
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">/ 100</span>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <span className="text-sm font-semibold" style={{ color }}>{label}</span>
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <TrendingUp className={cn("h-3 w-3", trend === "down" && "rotate-180", trend === "stable" && "rotate-90")} />
          {trend}
        </span>
      </div>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────
export default function CampusBrain() {
  const { user } = useAuth();
  const { revision, connection } = useRealtime();
  const role = user?.role ?? "Administrator";

  const [snapshot, setSnapshot] = useState<BrainSnapshot | null>(null);
  const [summary, setSummary] = useState<BrainAIResponse | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  const [chat, setChat] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState("");
  const [asking, setAsking] = useState(false);
  const [decisions, setDecisions] = useState<Record<string, DecisionRecord>>(() => DecisionLogService.getAll());
  const chatEndRef = useRef<HTMLDivElement>(null);

  const loadSnapshot = useCallback(async () => {
    setSummaryLoading(true);
    // Deterministic snapshot is instant.
    const snap = CampusBrainController.getSnapshot();
    setSnapshot(snap);
    // AI narration (async, falls back gracefully).
    try {
      const s = await CampusBrainController.narrateSummary(snap, role);
      setSummary(s);
    } finally {
      setSummaryLoading(false);
    }
  }, [role]);

  useEffect(() => { loadSnapshot(); }, [loadSnapshot, revision]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chat, asking]);

  const ask = useCallback(async (q?: string) => {
    const question = (q ?? input).trim();
    if (!question || asking || !snapshot) return;
    setInput("");
    setChat((c) => [...c, { role: "user", content: question }]);
    setAsking(true);
    try {
      const res = await CampusBrainController.ask(question, snapshot, role);
      setChat((c) => [...c, { role: "brain", content: res.answer, meta: res }]);
    } finally {
      setAsking(false);
    }
  }, [input, asking, snapshot, role]);

  if (!snapshot) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <BrainCircuit className="h-8 w-8 animate-pulse text-primary" />
          <p className="text-sm">Campus Brain is analysing every module…</p>
        </div>
      </div>
    );
  }

  const { health, priorities, topRisks, topOpportunities, alerts, correlations, predictions, recommendations } = snapshot;
  const updated = new Date(snapshot.generatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const decide = (id: string, status: "Approved" | "Rejected") => {
    const record = DecisionLogService.decide(id, status, role);
    setDecisions((current) => ({ ...current, [id]: record }));
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        eyebrow="Executive Intelligence"
        title="Campus Brain"
        description="Understand the entire campus in 30 seconds — what's happening, why, what's next, and what to do."
        actions={
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="text-[11px] font-semibold text-emerald-700">Live · {connection}</span>
            </div>
          </div>
        }
      />

      {/* ── Health + Executive Summary ───────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-3">
        <WorkspacePanel title="Campus Health Score" description="5-dimension operational composite" icon={Gauge} delay={0.05}>
          <HealthGauge score={health.score} label={health.label} trend={health.trend} />
          <div className="mt-4 space-y-2">
            {health.breakdown.map((b) => (
              <div key={b.label} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{b.label}</span>
                  <span className="font-medium tabular-nums text-foreground">{b.rawValue}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
                  <div className="h-full rounded-full bg-primary/70" style={{ width: `${b.rawValue}%` }} />
                </div>
              </div>
            ))}
          </div>
        </WorkspacePanel>

        <WorkspacePanel
          title="AI Executive Summary"
          description="Natural-language situation report"
          icon={Sparkles}
          delay={0.1}
          className="lg:col-span-2"
        >
          {summaryLoading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => <div key={i} className="h-4 w-full animate-pulse rounded bg-muted" style={{ width: `${90 - i * 12}%` }} />)}
            </div>
          ) : (
            <>
              <p className="text-sm leading-relaxed text-foreground">{summary?.answer}</p>
              {summary && (
                <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className={cn("h-1.5 w-1.5 rounded-full", confidenceColor(summary.confidence))} />
                    {summary.confidence}% confidence
                  </span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{updated}</span>
                  <span className="flex items-center gap-1">
                    Sources: {summary.sources.join(", ")}
                  </span>
                  <StatusBadge variant={summary.fallback ? "neutral" : "success"}>
                    {summary.fallback ? "Deterministic" : "AI-narrated"}
                  </StatusBadge>
                </div>
              )}
            </>
          )}
        </WorkspacePanel>
      </div>

      {/* ── Priority dashboard ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricTile label="Critical" value={priorities.Critical} icon={ShieldAlert} variant="danger" subtitle="Immediate action" delay={0.05} />
        <MetricTile label="High" value={priorities.High} icon={AlertTriangle} variant="warning" subtitle="Address today" delay={0.1} />
        <MetricTile label="Medium" value={priorities.Medium} icon={Activity} variant="primary" subtitle="This week" delay={0.15} />
        <MetricTile label="Low" value={priorities.Low} icon={CheckCircle2} variant="success" subtitle="Monitor" delay={0.2} />
      </div>

      <ResiliencePanel />
      <AIReasoningPanel />
      <EnterpriseDecisionPanel />
      <CampusMemoryPanel />
      <SimulationPanel />
      <DecisionPanel />

      {/* ── Top Risks + Recommended Actions ──────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <WorkspacePanel title="Top Risks" description="Ranked by operational impact" icon={AlertTriangle} delay={0.05}>
          <RiskList risks={topRisks} />
        </WorkspacePanel>
        <WorkspacePanel title="Recommended Actions" description="Prioritised by expected impact" icon={Target} delay={0.1}>
          <RecommendationList recs={recommendations.slice(0, 5)} decisions={decisions} onDecide={decide} />
        </WorkspacePanel>
      </div>

      <WorkspacePanel title="Executive Timeline" description="Signals → reasoning → prediction → approval request" icon={GitBranch} delay={0.05}>
        {snapshot.timeline.length === 0 ? (
          <EmptyNote text="No causal sequence is available for the current cycle." />
        ) : (
          <div className="relative ml-2 space-y-0 border-l border-border">
            {snapshot.timeline.map((event) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                className="relative grid gap-1 py-3 pl-6 sm:grid-cols-[72px_1fr]"
              >
                <span className="absolute -left-1.5 top-5 h-3 w-3 rounded-full border-2 border-background bg-primary" />
                <time className="text-xs font-semibold tabular-nums text-primary">
                  {new Date(event.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </time>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{event.title}</p>
                    <StatusBadge variant="neutral">{event.kind}</StatusBadge>
                  </div>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{event.detail}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">Sources: {event.sources.join(", ")}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </WorkspacePanel>

      {/* ── Predictions + Cross-module reasoning ─────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <WorkspacePanel title="Predictive Insights" description="Forecasts with confidence" icon={TrendingUp} delay={0.05}>
          {predictions.length === 0 ? (
            <EmptyNote text="No notable forecasts — current trends are stable." />
          ) : (
            <div className="space-y-3">
              {predictions.slice(0, 5).map((p) => (
                <div key={p.id} className="rounded-lg border border-border bg-muted/20 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">{p.title}</p>
                    <StatusBadge variant="info">{p.horizon}</StatusBadge>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{p.forecast}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
                      <div className={cn("h-full rounded-full", confidenceColor(p.confidence))} style={{ width: `${p.confidence}%` }} />
                    </div>
                    <span className="text-[11px] font-medium tabular-nums text-muted-foreground">{p.confidence}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </WorkspacePanel>

        <WorkspacePanel title="Cross-Module Reasoning" description="Why it's happening — correlated signals" icon={Network} delay={0.1}>
          {correlations.length === 0 ? (
            <EmptyNote text="No multi-module correlations detected this cycle." />
          ) : (
            <div className="space-y-3">
              {correlations.map((c) => (
                <div key={c.id} className="rounded-lg border border-border bg-muted/20 p-3">
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {c.module.map((m) => <StatusBadge key={m} variant="neutral">{m}</StatusBadge>)}
                    <span className="ml-auto text-[11px] font-medium text-muted-foreground">{c.confidence}% confidence</span>
                  </div>
                  <div className="mb-2 space-y-1">
                    {c.signals.map((s, i) => (
                      <p key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                        <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-primary/60" />{s}
                      </p>
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed text-foreground">{c.inference}</p>
                </div>
              ))}
            </div>
          )}
        </WorkspacePanel>
      </div>

      {/* ── Opportunities + Alerts ───────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <WorkspacePanel title="Top Opportunities" description="Where to lean in" icon={Lightbulb} delay={0.05}>
          {topOpportunities.length === 0 ? (
            <EmptyNote text="No standout opportunities surfaced this cycle." />
          ) : (
            <div className="space-y-2.5">
              {topOpportunities.map((o) => (
                <div key={o.id} className="flex items-start gap-3 rounded-lg border border-border bg-emerald-50/40 p-3">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                    <Lightbulb className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{o.title}</p>
                    <p className="text-xs leading-relaxed text-muted-foreground">{o.summary}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </WorkspacePanel>

        <WorkspacePanel title="Active Alerts" description="Live operational signals" icon={Activity} delay={0.1}>
          {alerts.length === 0 ? (
            <EmptyNote text="No active alerts. Campus is operating normally." />
          ) : (
            <div className="space-y-2">
              {alerts.map((a) => (
                <div key={a.id} className="flex items-center gap-3 rounded-lg border border-border bg-surface p-2.5">
                  <StatusBadge variant={PRIORITY_VARIANT[a.priority]}>{a.priority}</StatusBadge>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{a.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{a.detail}</p>
                  </div>
                  <span className="shrink-0 text-[10px] uppercase tracking-wide text-muted-foreground">{a.module}</span>
                </div>
              ))}
            </div>
          )}
        </WorkspacePanel>
      </div>

      {/* ── Ask Campus Brain ─────────────────────────────────────────────── */}
      <WorkspacePanel title="Ask Campus Brain" description="Natural-language questions, grounded in live campus data" icon={BrainCircuit} delay={0.05} noPadding>
        <div className="flex flex-col">
          <div className="flex flex-wrap gap-2 border-b border-border px-4 py-3">
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => ask(q)}
                disabled={asking}
                className="shrink-0 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-50"
              >
                <Sparkles className="mr-1 inline h-3 w-3" />{q}
              </button>
            ))}
          </div>

          <div className="max-h-[380px] min-h-[120px] space-y-3 overflow-y-auto px-4 py-4">
            {chat.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Ask anything about today's campus — risks, predictions, what to prioritise.
              </p>
            )}
            <AnimatePresence initial={false}>
              {chat.map((t, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className={cn("flex", t.role === "user" ? "justify-end" : "justify-start")}
                >
                  <div className={cn("max-w-[85%] rounded-xl px-4 py-3", t.role === "user" ? "bg-primary text-primary-foreground" : "border border-border bg-muted/40")}>
                    <p className="text-sm leading-relaxed">{t.content}</p>
                    {t.meta && (
                      <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-border/60 pt-2 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <span className={cn("h-1.5 w-1.5 rounded-full", confidenceColor(t.meta.confidence))} />
                          {t.meta.confidence}%
                        </span>
                        <span>· {t.meta.sources.join(", ")}</span>
                        {t.meta.fallback && <StatusBadge variant="neutral">Deterministic</StatusBadge>}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {asking && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1.5 rounded-xl border border-border bg-muted/40 px-4 py-3">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60" style={{ animationDelay: "0ms" }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60" style={{ animationDelay: "120ms" }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60" style={{ animationDelay: "240ms" }} />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={(e) => { e.preventDefault(); ask(); }} className="flex gap-2 border-t border-border p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Campus Brain…"
              disabled={asking}
              className="input-warm flex-1 px-4 py-2.5 text-sm"
            />
            <button type="submit" disabled={!input.trim() || asking} className="btn-primary flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm disabled:opacity-50">
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </WorkspacePanel>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────
function RiskList({ risks }: { risks: Risk[] }) {
  if (risks.length === 0) return <EmptyNote text="No active risks. Campus is operating within normal ranges." />;
  return (
    <div className="space-y-2.5">
      {risks.map((r) => (
        <div key={r.id} className="rounded-lg border border-border bg-surface p-3">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium text-foreground">{r.title}</p>
            <StatusBadge variant={PRIORITY_VARIANT[r.priority]}>{r.priority}</StatusBadge>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{r.summary}</p>
          <div className="mt-2 flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
            <ChevronRight className="h-3 w-3" />{r.module}
          </div>
        </div>
      ))}
    </div>
  );
}

function RecommendationList({
  recs,
  decisions,
  onDecide,
}: {
  recs: Recommendation[];
  decisions: Record<string, DecisionRecord>;
  onDecide: (id: string, status: "Approved" | "Rejected") => void;
}) {
  if (recs.length === 0) return <EmptyNote text="No recommended actions — nothing needs intervention right now." />;
  return (
    <div className="space-y-3">
      {recs.map((r) => (
        <div key={r.id} className="rounded-lg border border-border bg-surface p-3">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium text-foreground">{r.problem}</p>
            <StatusBadge variant={PRIORITY_VARIANT[r.priority]}>{r.priority}</StatusBadge>
          </div>
          <div className="mt-2 grid gap-2 rounded-md bg-muted/30 p-2.5 text-xs">
            <p><span className="font-semibold text-foreground">Root cause:</span> <span className="text-muted-foreground">{r.rootCause}</span></p>
            <p><span className="font-semibold text-foreground">Evidence:</span> <span className="text-muted-foreground">{r.evidence.map((e) => `${e.source}: ${e.detail}${e.value !== undefined ? ` (${e.value})` : ""}`).join(" · ")}</span></p>
            <p><span className="font-semibold text-foreground">Reasoning:</span> <span className="text-muted-foreground">{r.reasoningSummary}</span></p>
          </div>
          <ul className="mt-2 space-y-1">
            {r.actions.map((a, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />{a}
              </li>
            ))}
          </ul>
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
            <StatusBadge variant="info">{r.confidence}% confidence</StatusBadge>
            <StatusBadge variant="neutral">{r.expectedImpact}% impact</StatusBadge>
            <span className="text-[10px] text-muted-foreground">{new Date(r.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · {r.sourceModules.join(", ")}</span>
            <div className="ml-auto flex items-center gap-2">
              {decisions[r.id] ? (
                <StatusBadge variant={decisions[r.id].status === "Approved" ? "success" : "danger"}>
                  {decisions[r.id].status}
                </StatusBadge>
              ) : (
                <>
                  <button onClick={() => onDecide(r.id, "Rejected")} className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:text-foreground">
                    <XCircle className="h-3.5 w-3.5" /> Reject
                  </button>
                  <button onClick={() => onDecide(r.id, "Approved")} className="flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-xs text-primary-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyNote({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
      <CheckCircle2 className="h-4 w-4 text-emerald-500" />{text}
    </div>
  );
}
