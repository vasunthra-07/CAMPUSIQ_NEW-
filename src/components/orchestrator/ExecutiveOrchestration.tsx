import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, BrainCircuit, Building2, ChevronDown, Clock3, Gauge, Play, ShieldCheck, Sparkles, Users, Zap } from "lucide-react";
import { WorkspacePanel, StatusBadge } from "@/components/workspace";
import { useOrchestrator, type OrchestratedDecision } from "@/services/orchestrator/OrchestratorContext";
import type { SimulationType } from "@/services/realtime/RealtimeContext";
import { cn } from "@/lib/utils";

const SCENARIOS: Array<{ type: SimulationType; label: string }> = [
  { type: "fire", label: "Fire" }, { type: "power-failure", label: "Power Failure" },
  { type: "flood", label: "Flood" }, { type: "bus-delay", label: "Bus Delay" },
  { type: "internet-outage", label: "Internet Outage" }, { type: "hvac-failure", label: "HVAC Failure" },
  { type: "overcrowding", label: "Overcrowding" }, { type: "medical-emergency", label: "Medical Emergency" },
];

const severityVariant = { Critical: "danger", High: "warning", Medium: "info", Low: "neutral" } as const;

export function ResiliencePanel() {
  const { resilience } = useOrchestrator();
  if (!resilience) return null;
  return <WorkspacePanel title="Campus Resilience Score" description="Readiness and recovery capacity across nine dimensions" icon={ShieldCheck}>
    <div className="grid gap-5 md:grid-cols-[180px_1fr]">
      <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-muted/20 p-5">
        <motion.span key={resilience.current} initial={{ scale: .8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-5xl font-bold tabular-nums text-foreground">{resilience.current}</motion.span>
        <span className="text-xs text-muted-foreground">Previous {resilience.previous}</span>
        <StatusBadge variant={resilience.trend === "up" ? "success" : resilience.trend === "down" ? "warning" : "neutral"}>{resilience.trend}</StatusBadge>
        <p className="mt-3 text-center text-xs text-muted-foreground">Weakest area<br/><strong className="text-foreground">{resilience.weakestArea}</strong></p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {resilience.contributors.map((item) => <div key={item.label} className="rounded-lg border border-border bg-muted/20 p-2.5">
          <div className="flex justify-between text-xs"><span className="text-muted-foreground">{item.label}</span><strong>{item.score}</strong></div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border"><motion.div initial={{ width: 0 }} animate={{ width: `${item.score}%` }} className={cn("h-full rounded-full", item.score >= 80 ? "bg-emerald-500" : item.score >= 65 ? "bg-amber-500" : "bg-red-500")} /></div>
        </div>)}
      </div>
    </div>
  </WorkspacePanel>;
}

export function SimulationPanel() {
  const { trigger, presentation, startPresentation } = useOrchestrator();
  return <WorkspacePanel title="What-If Simulator" description="Run deterministic incident playbooks through the live operating system" icon={Sparkles}>
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {SCENARIOS.map((scenario) => <button key={scenario.type} onClick={() => trigger(scenario.type)} className="rounded-lg border border-border bg-muted/20 px-3 py-3 text-left text-xs font-medium text-foreground transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:bg-primary/5">{scenario.label}</button>)}
    </div>
    <div className="mt-4 rounded-xl border border-primary/25 bg-primary/5 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Play className="h-4 w-4" /></div>
        <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-foreground">Executive Presentation Mode</p><p className="text-xs text-muted-foreground">{presentation.active ? presentation.label : "Automatic 49-second live campus incident story"}</p></div>
        <button onClick={startPresentation} disabled={presentation.active} className="btn-primary rounded-lg px-4 py-2 text-xs disabled:opacity-50">{presentation.active ? "Playing…" : "Start presentation"}</button>
      </div>
      {(presentation.active || presentation.progress > 0) && <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-border"><motion.div animate={{ width: `${presentation.progress}%` }} className="h-full rounded-full bg-primary" /></div>}
    </div>
  </WorkspacePanel>;
}

export function DecisionPanel() {
  const { decisions } = useOrchestrator();
  return <WorkspacePanel title="Executive Decision Panel" description="Coordinated, explainable response plans awaiting executive action" icon={BrainCircuit}>
    {decisions.length === 0 ? <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">No orchestrated incidents. Campus systems are within normal limits.</div> :
      <div className="space-y-3">{decisions.slice(0, 6).map((decision) => <DecisionCard key={decision.id} decision={decision} />)}</div>}
  </WorkspacePanel>;
}

function DecisionCard({ decision }: { decision: OrchestratedDecision }) {
  const [open, setOpen] = useState(false);
  return <motion.div layout className="overflow-hidden rounded-xl border border-border bg-surface">
    <button onClick={() => setOpen((value) => !value)} className="flex w-full items-start gap-3 p-4 text-left">
      <div className="mt-0.5 rounded-lg bg-primary/10 p-2 text-primary"><Activity className="h-4 w-4" /></div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2"><p className="text-sm font-semibold text-foreground">{decision.problem}</p><StatusBadge variant={severityVariant[decision.severity]}>{decision.severity}</StatusBadge><StatusBadge variant="neutral">{decision.source}</StatusBadge></div>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{decision.reason}</p>
        <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-muted-foreground"><span>{decision.confidence}% confidence</span><span><Clock3 className="mr-1 inline h-3 w-3" />{decision.estimatedResolutionTime}</span><span>{decision.responsibleDepartments.join(" · ")}</span></div>
      </div><ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
    </button>
    <AnimatePresence>{open && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-border">
      <div className="grid gap-4 p-4 lg:grid-cols-2">
        <Detail title="Recommended actions" items={decision.recommendedActions} />
        <Detail title="Reasoning steps" items={decision.reasoningSteps} />
        <Detail title="Evidence used" items={decision.evidence.map((item) => `${item.source}: ${item.detail}${item.value !== undefined ? ` — ${item.value}` : ""}`)} />
        <Detail title="Alternatives considered" items={decision.alternativeActions} />
      </div>
      <div className="grid grid-cols-2 gap-2 border-t border-border p-4 sm:grid-cols-4">
        <Mini icon={Building2} label="Buildings" value={decision.affectedBuildings.join(", ")} />
        <Mini icon={Users} label="Students" value={String(decision.affectedStudents)} />
        <Mini icon={Users} label="Staff" value={String(decision.affectedStaff)} />
        <Mini icon={Gauge} label="Expected impact" value={decision.expectedImpact} />
      </div>
      <div className="border-t border-border p-4"><p className="text-xs font-semibold text-foreground">Expected outcome</p><p className="mt-1 text-xs text-muted-foreground">{decision.expectedOutcome}</p></div>
      <div className="border-t border-border p-4">
        <p className="mb-3 text-xs font-semibold text-foreground">Orchestration timeline</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {decision.workflow.map((step) => <div key={step.id} className="flex gap-2 rounded-lg bg-muted/25 p-2.5">
            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
            <div><p className="text-xs font-medium text-foreground">{step.label}</p><p className="text-[11px] text-muted-foreground">{step.detail}</p></div>
          </div>)}
        </div>
      </div>
    </motion.div>}</AnimatePresence>
  </motion.div>;
}

function Detail({ title, items }: { title: string; items: string[] }) { return <div><p className="mb-2 text-xs font-semibold text-foreground">{title}</p><ol className="space-y-1.5">{items.map((item, index) => <li key={item} className="flex gap-2 text-xs text-muted-foreground"><span className="text-primary">{index + 1}.</span>{item}</li>)}</ol></div>; }
function Mini({ icon: Icon, label, value }: { icon: typeof Zap; label: string; value: string }) { return <div className="rounded-lg bg-muted/30 p-3"><Icon className="h-4 w-4 text-primary" /><p className="mt-2 text-[10px] uppercase text-muted-foreground">{label}</p><p className="mt-1 text-xs font-semibold text-foreground">{value}</p></div>; }
