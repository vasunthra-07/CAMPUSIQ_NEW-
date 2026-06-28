import { useState } from "react";
import { useStudents } from "@/hooks/useStudents";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { PageHeader, MetricTile, WorkspacePanel, StatusBadge } from "@/components/workspace";
import { AlertTriangle, BarChart3, Users, Edit3, CheckCircle, Search, Download, X, Send, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Student } from "@/data/students";
import { getPulseColor } from "@/lib/scoring";

const STATUS_VARIANT = (s: string) => s === "Critical" ? "danger" : s === "At-Risk" ? "warning" : s === "Safe" ? "success" : "info";

export default function FacultyWorkspace() {
  const { data: students } = useStudents();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [deptFilter, setDeptFilter] = useState("All");
  const [sortBy, setSortBy] = useState<"name" | "attendance" | "pulse">("pulse");
  const [sortAsc, setSortAsc] = useState(false);
  const [interventionTarget, setInterventionTarget] = useState<Student | null>(null);
  const [interventionNote, setInterventionNote] = useState("");
  const [interventionType, setInterventionType] = useState("Counselling");
  const [markStudent, setMarkStudent] = useState<Student | null>(null);
  const [markIAT1, setMarkIAT1] = useState("");
  const [markIAT2, setMarkIAT2] = useState("");
  const [detailStudent, setDetailStudent] = useState<Student | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  const myStudents = students?.slice(0, 20) ?? [];

  const filtered = myStudents
    .filter(s => statusFilter === "All" || s.status === statusFilter)
    .filter(s => deptFilter === "All" || s.department === deptFilter)
    .filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.id.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      let av = sortBy === "name" ? a.name : sortBy === "attendance" ? a.attendance : a.pulseScore;
      let bv = sortBy === "name" ? b.name : sortBy === "attendance" ? b.attendance : b.pulseScore;
      if (typeof av === "string" && typeof bv === "string") return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortAsc ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });

  const atRisk = myStudents.filter(s => s.status === "Critical" || s.status === "At-Risk");
  const avgAttend = myStudents.length ? Math.round(myStudents.reduce((a, s) => a + s.attendance, 0) / myStudents.length) : 0;
  const avgPulse = myStudents.length ? Math.round(myStudents.reduce((a, s) => a + s.pulseScore, 0) / myStudents.length) : 0;

  const toggleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortAsc(!sortAsc);
    else { setSortBy(col); setSortAsc(false); }
  };

  const toggleRow = (id: string) => setSelectedRows(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  const toggleAll = () => setSelectedRows(prev => prev.size === filtered.length ? new Set() : new Set(filtered.map(s => s.id)));

  const submitIntervention = () => {
    if (!interventionNote.trim()) { toast.error("Please add an intervention note"); return; }
    toast.success(`${interventionType} intervention scheduled for ${interventionTarget?.name}. Mentor notified.`);
    setInterventionTarget(null); setInterventionNote(""); setInterventionType("Counselling");
  };

  const submitMarks = () => {
    const iat1 = Number(markIAT1); const iat2 = Number(markIAT2);
    if (isNaN(iat1) || isNaN(iat2) || iat1 < 0 || iat1 > 50 || iat2 < 0 || iat2 > 50) {
      toast.error("IAT scores must be between 0 and 50"); return;
    }
    toast.success(`Marks updated for ${markStudent?.name}: IAT1=${iat1}, IAT2=${iat2}`);
    setMarkStudent(null); setMarkIAT1(""); setMarkIAT2("");
  };

  const exportCSV = () => {
    const rows = [["ID", "Name", "Dept", "Year", "Attendance", "IAT1", "IAT2", "Pulse", "Status", "Drift"]];
    filtered.forEach(s => rows.push([s.id, s.name, s.department, String(s.year), String(s.attendance), String(s.iat1), String(s.iat2), String(s.pulseScore), s.status, s.driftType]));
    const csv = rows.map(r => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = "data:text/csv," + encodeURIComponent(csv);
    a.download = "students.csv";
    a.click();
    toast.success("Student data exported");
  };

  const bulkIntervene = () => {
    if (selectedRows.size === 0) { toast.error("Select students first"); return; }
    toast.success(`Intervention initiated for ${selectedRows.size} student${selectedRows.size > 1 ? "s" : ""}. Mentors notified.`);
    setSelectedRows(new Set());
  };

  const departments = ["All", ...new Set(myStudents.map(s => s.department))];

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        eyebrow="Faculty Operations"
        title="Faculty Workspace"
        description="Class performance, mark entry, and at-risk student monitoring"
        actions={
          <div className="flex gap-2">
            <button onClick={exportCSV} className="btn-secondary px-4 py-2 text-sm rounded-lg flex items-center gap-1"><Download className="h-4 w-4" /> Export</button>
            {selectedRows.size > 0 && (
              <button onClick={bulkIntervene} className="btn-primary px-4 py-2 text-sm rounded-lg">
                Intervene ({selectedRows.size} selected)
              </button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <MetricTile label="My Students" value={<AnimatedNumber value={myStudents.length} />} icon={Users} variant="primary" delay={0} />
        <MetricTile label="At-Risk Cases" value={<AnimatedNumber value={atRisk.length} />} icon={AlertTriangle} variant={atRisk.length > 3 ? "warning" : "default"} delay={0.05} />
        <MetricTile label="Avg Attendance" value={<AnimatedNumber value={avgAttend} suffix="%" />} icon={BarChart3} variant={avgAttend < 75 ? "warning" : "default"} delay={0.1} />
        <MetricTile label="Avg Pulse" value={<AnimatedNumber value={avgPulse} />} icon={CheckCircle} variant="success" delay={0.15} />
      </div>

      {atRisk.length > 0 && (
        <WorkspacePanel title="Action Required" description={`${atRisk.length} students need intervention`} icon={AlertTriangle} delay={0.2}>
          <div className="space-y-2">
            {atRisk.slice(0, 5).map(s => (
              <div key={s.id} className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50/50 p-3 gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2"><p className="text-sm font-medium">{s.name}</p><StatusBadge variant={STATUS_VARIANT(s.status) as any}>{s.status}</StatusBadge></div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{s.reasoningNote}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => setDetailStudent(s)} className="btn-ghost text-xs px-3 py-1.5 rounded-lg">View</button>
                  <button onClick={() => setInterventionTarget(s)} className="btn-primary text-xs px-3 py-1.5 rounded-lg">Intervene</button>
                </div>
              </div>
            ))}
          </div>
        </WorkspacePanel>
      )}

      <WorkspacePanel title="Class Register" description={`${filtered.length} students`} icon={Edit3} delay={0.25}
        actions={
          <div className="flex gap-1">
            {["All", "Safe", "At-Risk", "Critical", "Observation"].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={cn("rounded-md px-2.5 py-1 text-xs font-medium transition-colors", statusFilter === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}>
                {s}
              </button>
            ))}
          </div>
        }
      >
        <div className="mb-3 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input type="text" placeholder="Search students…" value={search} onChange={e => setSearch(e.target.value)} className="w-full input-warm pl-9 py-2 text-sm" />
          </div>
          <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className="input-warm px-2 py-2 text-sm">
            {departments.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="py-2 pr-2 text-left">
                  <input type="checkbox" checked={selectedRows.size === filtered.length && filtered.length > 0} onChange={toggleAll} className="accent-primary" />
                </th>
                <th className="text-left py-2 pr-4 font-medium cursor-pointer hover:text-foreground" onClick={() => toggleSort("name")}>
                  Student {sortBy === "name" && (sortAsc ? "↑" : "↓")}
                </th>
                <th className="text-center py-2 px-3 font-medium cursor-pointer hover:text-foreground" onClick={() => toggleSort("attendance")}>
                  Attend {sortBy === "attendance" && (sortAsc ? "↑" : "↓")}
                </th>
                <th className="text-center py-2 px-3 font-medium">IAT1</th>
                <th className="text-center py-2 px-3 font-medium">IAT2</th>
                <th className="text-center py-2 px-3 font-medium">Model</th>
                <th className="text-center py-2 px-3 font-medium cursor-pointer hover:text-foreground" onClick={() => toggleSort("pulse")}>
                  Pulse {sortBy === "pulse" && (sortAsc ? "↑" : "↓")}
                </th>
                <th className="text-center py-2 px-3 font-medium">Status</th>
                <th className="text-center py-2 px-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="py-8 text-center text-muted-foreground text-sm">No students match your filters.</td></tr>
              )}
              {filtered.map(s => (
                <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-2.5 pr-2">
                    <input type="checkbox" checked={selectedRows.has(s.id)} onChange={() => toggleRow(s.id)} className="accent-primary" />
                  </td>
                  <td className="py-2.5 pr-4">
                    <p className="font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.id} · Yr {s.year}</p>
                  </td>
                  <td className={cn("text-center py-2.5 px-3 tabular-nums font-medium", s.attendance < 75 ? "text-red-600" : "")}>{s.attendance}%</td>
                  <td className="text-center py-2.5 px-3 tabular-nums">{s.iat1}</td>
                  <td className="text-center py-2.5 px-3 tabular-nums">{s.iat2}</td>
                  <td className="text-center py-2.5 px-3 tabular-nums">{s.model}</td>
                  <td className="text-center py-2.5 px-3 tabular-nums font-medium" style={{ color: getPulseColor(s.pulseScore) }}>{s.pulseScore}</td>
                  <td className="text-center py-2.5 px-3">
                    <StatusBadge variant={STATUS_VARIANT(s.status) as any}>{s.status}</StatusBadge>
                  </td>
                  <td className="text-center py-2.5 px-3">
                    <div className="flex gap-1 justify-center">
                      <button onClick={() => setDetailStudent(s)} className="btn-ghost text-[10px] px-2 py-1 rounded">View</button>
                      <button onClick={() => { setMarkStudent(s); setMarkIAT1(String(s.iat1)); setMarkIAT2(String(s.iat2)); }} className="btn-ghost text-[10px] px-2 py-1 rounded">Marks</button>
                      {(s.status === "Critical" || s.status === "At-Risk") && (
                        <button onClick={() => setInterventionTarget(s)} className="text-[10px] px-2 py-1 rounded bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors">Intervene</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </WorkspacePanel>

      {/* Intervention Modal */}
      {interventionTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm">
          <div className="workspace-panel w-full max-w-md p-6 space-y-4 m-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Intervention Plan</h2>
              <button onClick={() => setInterventionTarget(null)} className="p-1 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-sm font-medium text-foreground">{interventionTarget.name}</p>
              <p className="text-xs text-muted-foreground">{interventionTarget.id} · {interventionTarget.department}</p>
              <p className="text-xs text-muted-foreground mt-1">{interventionTarget.reasoningNote}</p>
            </div>
            <div className="space-y-1.5">
              <label className="section-label">Intervention Type</label>
              <select value={interventionType} onChange={e => setInterventionType(e.target.value)} className="w-full input-warm px-3 py-2.5 text-sm">
                {["Counselling", "Mentor Meeting", "Parent Notification", "Academic Support", "Medical Referral", "Dean Escalation"].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="section-label">Notes *</label>
              <textarea value={interventionNote} onChange={e => setInterventionNote(e.target.value)} rows={4} required
                placeholder="Describe the intervention plan and observations…" className="w-full input-warm px-3 py-2.5 text-sm resize-none" />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setInterventionTarget(null)} className="btn-secondary flex-1 py-2.5 text-sm rounded-lg">Cancel</button>
              <button onClick={submitIntervention} className="btn-primary flex-1 py-2.5 text-sm rounded-lg flex items-center justify-center gap-2">
                <Send className="h-4 w-4" /> Submit Intervention
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Marks Entry Modal */}
      {markStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm">
          <div className="workspace-panel w-full max-w-sm p-6 space-y-4 m-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Update Marks</h2>
              <button onClick={() => setMarkStudent(null)} className="p-1 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <p className="text-sm text-muted-foreground">{markStudent.name} · {markStudent.id}</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="section-label">IAT 1 (0–50)</label>
                <input type="number" min={0} max={50} value={markIAT1} onChange={e => setMarkIAT1(e.target.value)} className="w-full input-warm px-3 py-2.5 text-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="section-label">IAT 2 (0–50)</label>
                <input type="number" min={0} max={50} value={markIAT2} onChange={e => setMarkIAT2(e.target.value)} className="w-full input-warm px-3 py-2.5 text-sm" />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setMarkStudent(null)} className="btn-secondary flex-1 py-2.5 text-sm rounded-lg">Cancel</button>
              <button onClick={submitMarks} className="btn-primary flex-1 py-2.5 text-sm rounded-lg">Update Marks</button>
            </div>
          </div>
        </div>
      )}

      {/* Student Detail Modal */}
      {detailStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm" onClick={() => setDetailStudent(null)}>
          <div className="workspace-panel w-full max-w-md p-6 space-y-4 m-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">{detailStudent.name}</h2>
                <p className="text-xs text-muted-foreground">{detailStudent.id} · {detailStudent.department} · Year {detailStudent.year}</p>
              </div>
              <button onClick={() => setDetailStudent(null)} className="p-1 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              {[
                { label: "Pulse", value: detailStudent.pulseScore },
                { label: "Attend", value: `${detailStudent.attendance}%` },
                { label: "IAT", value: detailStudent.iat1 + detailStudent.iat2 },
                { label: "CGPA", value: detailStudent.cgpa },
              ].map(m => (
                <div key={m.label} className="rounded-lg bg-muted/50 p-2">
                  <p className="text-sm font-semibold tabular-nums">{m.value}</p>
                  <p className="text-[10px] text-muted-foreground">{m.label}</p>
                </div>
              ))}
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Status</span><StatusBadge variant={STATUS_VARIANT(detailStudent.status) as any}>{detailStudent.status}</StatusBadge></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Drift Type</span><span>{detailStudent.driftType}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Intervention</span><span>{detailStudent.interventionStatus}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Hackathon Wins</span><span>{detailStudent.hackathonWins}</span></div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed border-t border-border pt-3">{detailStudent.reasoningNote}</p>
            <div className="flex gap-3">
              <button onClick={() => setDetailStudent(null)} className="btn-secondary flex-1 py-2.5 text-sm rounded-lg">Close</button>
              <button onClick={() => { setInterventionTarget(detailStudent); setDetailStudent(null); }} className="btn-primary flex-1 py-2.5 text-sm rounded-lg">Intervene</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
