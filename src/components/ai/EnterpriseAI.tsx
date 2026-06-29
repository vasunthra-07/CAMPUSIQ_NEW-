import { motion } from "framer-motion";
import { BrainCircuit, CheckCircle2, Database, GitMerge, History, Lightbulb, Search, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";
import { WorkspacePanel, StatusBadge } from "@/components/workspace";
import { useEnterpriseAI, type FusedExecutiveDecision } from "@/services/ai/EnterpriseAIContext";

export function AIReasoningPanel() {
  const { decisions, agentNames } = useEnterpriseAI();
  const latest = decisions[0];
  const active = new Map(latest?.agentAnalyses.map((analysis) => [analysis.agent, analysis]));
  return <WorkspacePanel title="AI Reasoning" description="Campus Brain coordinating specialist intelligence in real time" icon={BrainCircuit}>
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {agentNames.map((name, index) => {
        const analysis = active.get(name);
        return <motion.div key={`${latest?.id ?? "idle"}-${name}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .12 }} className="rounded-lg border border-border bg-muted/20 p-3">
          <div className="flex items-center gap-2"><motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: index * .12 + .18 }}><CheckCircle2 className="h-4 w-4 text-emerald-500" /></motion.span><p className="text-xs font-semibold text-foreground">{name}</p><span className="ml-auto text-[10px] text-emerald-500">Complete</span></div>
          <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">{analysis?.recommendation ?? "Context checked — no domain intervention required."}</p>
          {analysis && <div className="mt-2 flex gap-2"><StatusBadge variant={analysis.stance === "caution" ? "warning" : "success"}>{analysis.stance}</StatusBadge><span className="text-[10px] text-muted-foreground">{analysis.confidence}%</span></div>}
        </motion.div>;
      })}
    </div>
    <motion.div key={latest?.id ?? "waiting"} initial={{ opacity: 0, scale: .98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: .85 }} className="mt-3 flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
      <GitMerge className="h-5 w-5 text-primary" /><div><p className="text-sm font-semibold text-foreground">{latest ? "Executive Decision Generated" : "Agents awaiting campus event"}</p><p className="text-xs text-muted-foreground">{latest ? `${latest.agentAnalyses.length} relevant analyses fused · ${latest.conflictsResolved.length} conflict(s) resolved` : "Campus Brain will select relevant agents automatically."}</p></div>
    </motion.div>
  </WorkspacePanel>;
}

export function EnterpriseDecisionPanel() {
  const { decisions, learning } = useEnterpriseAI();
  const decision = decisions[0];
  if (!decision) return null;
  return <WorkspacePanel title="Enterprise AI Decision" description="Current evidence fused with campus memory and learned outcomes" icon={Sparkles}>
    <div className="flex flex-wrap items-start gap-3">
      <div className="min-w-0 flex-1"><p className="text-base font-semibold text-foreground">{decision.problem}</p><p className="mt-1 text-sm leading-relaxed text-muted-foreground">{decision.reasonForRecommendation}</p></div>
      <StatusBadge variant={decision.severity === "Critical" ? "danger" : "warning"}>{decision.severity}</StatusBadge>
      <StatusBadge variant="info">{decision.confidence}% confidence</StatusBadge>
    </div>
    <div className="mt-4 grid gap-3 lg:grid-cols-2">
      <Info title="Current Evidence" icon={ShieldCheck} items={decision.currentEvidence.slice(0, 6).map((item) => `${item.source}: ${item.detail}${item.value !== undefined ? ` — ${item.value}` : ""}`)} />
      <Info title="Historical Evidence" icon={History} items={decision.historicalEvidence.length ? decision.historicalEvidence.map((item) => `${item.detail}: ${item.value}`) : ["No prior resolved incident evidence yet; confidence is based on current verified data."]} />
      <Info title="Recommended Actions" icon={Lightbulb} items={decision.recommendation.slice(0, 7)} />
      <Info title="Alternatives Considered" icon={GitMerge} items={decision.alternativeActions} />
    </div>
    {decision.similarIncidents.length > 0 && <div className="mt-3 rounded-xl border border-border bg-muted/20 p-4"><p className="mb-2 flex items-center gap-2 text-xs font-semibold text-foreground"><Search className="h-4 w-4 text-primary" />Similar incidents</p>{decision.similarIncidents.map((match) => <p key={match.previousIncident.id} className="mt-1 text-xs text-muted-foreground"><strong className="text-foreground">{match.similarity}%</strong> · {match.previousIncident.incident} · {match.previousResolution} · {match.recommendedReuse}</p>)}</div>}
    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
      <Kpi label="Learning Confidence" value={`${decision.learningConfidence}%`} />
      <Kpi label="Historical Accuracy" value={`${learning.historicalAccuracy}%`} />
      <Kpi label="Success Rate" value={`${learning.recommendationSuccessRate}%`} />
      <Kpi label="Expected Improvement" value={decision.expectedImprovement} compact />
    </div>
  </WorkspacePanel>;
}

export function CampusMemoryPanel() {
  const { memory, learning, collaborationScore } = useEnterpriseAI();
  const frequencies = memory.reduce<Record<string, number>>((out, item) => ({ ...out, [item.eventType]: (out[item.eventType] ?? 0) + 1 }), {});
  const mostFrequent = Object.entries(frequencies).sort((a, b) => b[1] - a[1])[0]?.[0]?.replace(/-/g, " ") ?? "No incidents yet";
  const resolved = memory.filter((item) => item.resolutionMinutes !== undefined);
  const fastest = [...resolved].sort((a, b) => (a.resolutionMinutes ?? Infinity) - (b.resolutionMinutes ?? Infinity))[0];
  const buildings = memory.flatMap((item) => item.affectedBuildings);
  const repeatedBuilding = Object.entries(buildings.reduce<Record<string, number>>((out, building) => { out[building] = (out[building] ?? 0) + 1; return out; }, {})).sort((a, b) => b[1] - a[1])[0];
  const best = memory.filter((item) => item.outcome === "Successful").sort((a, b) => b.confidence - a.confidence)[0];
  return <WorkspacePanel title="Campus Memory" description="Institutional incident knowledge and self-learning performance" icon={Database}>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Kpi label="Incidents Learned" value={String(memory.length)} />
      <Kpi label="Patterns Detected" value={String(learning.patternsLearned)} />
      <Kpi label="Most Frequent Issue" value={mostFrequent} />
      <Kpi label="Agent Collaboration" value={`${collaborationScore}%`} />
      <Kpi label="Fastest Resolution" value={fastest ? `${fastest.resolutionMinutes} min` : "Awaiting resolution"} />
      <Kpi label="Repeated Building" value={repeatedBuilding ? `${repeatedBuilding[0]} (${repeatedBuilding[1]})` : "None"} />
      <Kpi label="Most Reliable Action" value={best?.actionsTaken[0] ?? "Learning in progress"} compact />
      <Kpi label="Historical Accuracy" value={`${learning.historicalAccuracy}%`} />
    </div>
    {memory[0] && <div className="mt-4 rounded-xl border border-border bg-muted/20 p-4"><p className="text-xs font-semibold text-foreground">Latest memory</p><p className="mt-1 text-xs text-muted-foreground">{memory[0].incident} · {memory[0].affectedBuildings.join(", ")} · {memory[0].occupancy} occupants · {memory[0].outcome}</p></div>}
  </WorkspacePanel>;
}

function Info({ title, icon: Icon, items }: { title: string; icon: typeof TrendingUp; items: string[] }) { return <div className="rounded-xl border border-border bg-muted/20 p-4"><p className="mb-2 flex items-center gap-2 text-xs font-semibold text-foreground"><Icon className="h-4 w-4 text-primary" />{title}</p><ul className="space-y-1.5">{items.map((item) => <li key={item} className="flex gap-2 text-xs leading-relaxed text-muted-foreground"><span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />{item}</li>)}</ul></div>; }
function Kpi({ label, value, compact }: { label: string; value: string; compact?: boolean }) { return <div className="rounded-lg border border-border bg-muted/20 p-3"><p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p><p className={compact ? "mt-1 line-clamp-2 text-xs font-semibold text-foreground" : "mt-1 text-lg font-bold capitalize text-foreground"}>{value}</p></div>; }
