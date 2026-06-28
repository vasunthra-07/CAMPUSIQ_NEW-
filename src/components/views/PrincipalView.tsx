import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { students, departmentStats } from "@/data/students";
import { analyzeStudent, getBatchRiskSummary } from "@/utils/CampusIQAI";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend, CartesianGrid, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { Shield, AlertOctagon, CheckSquare, TrendingDown, Globe, Sparkles, Clock, CheckCircle, Cpu, Users, Plus, Download, Brain, Send } from "lucide-react";
import { askClaude } from "@/utils/claudeAI";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function PrincipalView({ activePage = "dashboard" }: { activePage?: string }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("Institution Overview");
  const [acknowledged, setAcknowledged] = useState<Set<string>>(new Set());
  const [fabOpen, setFabOpen] = useState(false);

  const [monitoredModalOpen, setMonitoredModalOpen] = useState(false);
  const [criticalModalOpen, setCriticalModalOpen] = useState(false);
  const [scoreModalOpen, setScoreModalOpen] = useState(false);
  const [activeModalOpen, setActiveModalOpen] = useState(false);

  useEffect(() => {
    switch (activePage) {
      case "overview": setActiveTab("Institution Overview"); break;
      case "escalation": setActiveTab("Escalation Panel"); break;
      case "compliance": setActiveTab("Compliance Tracker"); break;
      default: setActiveTab("Institution Overview");
    }
  }, [activePage]);

  const batchSummary = getBatchRiskSummary(students);
  const escalations = students.filter(s => s.status === "Critical" && s.interventionStatus === "Pending" && !acknowledged.has(s.id));
  const auditStudents = students.filter(s => s.interventionStatus !== "None");

  const deptCritical = departmentStats.filter(d => d.total > 0).map((d) => ({ dept: d.dept, critical: d.critical, color: d.critical > 5 ? "#ef4444" : d.critical > 2 ? "#f97316" : "#22c55e" }));

  const below75 = students.filter(s => s.attendance < 75).length;
  const below65 = students.filter(s => s.attendance < 65).length;
  const above75 = students.length - below75;

  const radarData = departmentStats.filter(d => d.total > 0).length > 0 ? [
    { axis: "Attendance", ...Object.fromEntries(departmentStats.filter(d => d.total > 0).map(d => [d.dept, d.avgAttendance])) },
    { axis: "IAT Avg", ...Object.fromEntries(departmentStats.filter(d => d.total > 0).map(d => [d.dept, d.avgIAT])) },
    { axis: "LMS Activity", ...Object.fromEntries(departmentStats.filter(d => d.total > 0).map(d => [d.dept, d.avgLMS])) },
    { axis: "Campus Pulse Score", ...Object.fromEntries(departmentStats.filter(d => d.total > 0).map(d => [d.dept, d.avgPulse])) },
    { axis: "Intervention Rate", ...Object.fromEntries(departmentStats.filter(d => d.total > 0).map(d => [d.dept, d.interventionRate])) },
  ] : [];

  /* AI Chat state for Principal */
  const [oracleMode, setOracleMode] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [analyzing, setAnalyzing] = useState(false);

  /* Ask CampusIQ Assistant Chat State */
  const [messages, setMessages] = useState<{role: "assistant"|"user", content: string}[]>([
    { role: "assistant", content: `Principal ${user?.name.split(" ")[0]}, I've analyzed the institution's real-time data. We have ${batchSummary.criticalCount || 0} critical escalations across ${departmentStats.filter(d=>d.total>0).length} departments. How can I assist with your executive strategy?` }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), [messages, isTyping]);

  const handleSendChat = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!chatInput.trim() || isTyping) return;
    
    const userMessage = chatInput.trim();
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setChatInput("");
    setIsTyping(true);

    const systemPrompt = `You are CampusIQ, an AI Executive advisor for Principal ${user?.name}. You analyze institution performance. Be concise, strategic, and authoritative. Under 150 words.`;
    
    const response = await askClaude(systemPrompt, userMessage);
    setMessages(prev => [...prev, { role: "assistant", content: response }]);
    setIsTyping(false);
  };

  const runMacroAnalysis = async (pattern: string) => {
    setOracleMode(true);
    setAnalyzing(true);
    const count = batchSummary.topPattern === pattern ? 32 : 14; 
    const prompt = `You are CampusIQ an AI advisor for ${user?.name}, Principal of CIT. Analyze the institution-wide pattern "${pattern}" currently affecting ${count} total students. Provide 1) Systemic Root causes, 2) Principal-level policy mandate, 3) Instructions for HODs. Under 200 words.`;
    const res = await askClaude(prompt, "Generate institution-level directive.");
    setAiAnalysis(res);
    setAnalyzing(false);
  };

  return (
    <div className="space-y-6">
      {/* Local Tab Navigation hidden since sidebar controls this now */}

      {activeTab === "Institution Overview" && (
        <div className="space-y-6 animate-fade-up" style={{ animationDelay: "0.1s", animationFillMode: "both" }}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div onClick={() => setMonitoredModalOpen(true)} className="card-warm p-6 card-glow-hover border-border/50 shadow-sm flex flex-col justify-center cursor-pointer transition-all hover:-translate-y-1">
              <p className="text-[11px] font-bold section-label tracking-wide mb-2 flex items-center gap-2"><Users className="h-4 w-4 text-blue-500" /> Total Monitored</p>
              <p className="text-4xl font-bold font-mono gradient-text-gold">{students.length}</p>
            </div>
            <div onClick={() => setCriticalModalOpen(true)} className="card-warm p-6 border-red-500/30 card-critical-glow shadow-sm flex flex-col justify-center cursor-pointer transition-all hover:-translate-y-1">
              <p className="text-[11px] font-bold section-label text-chart-critical tracking-wide mb-2 flex items-center gap-2"><AlertOctagon className="h-4 w-4 text-chart-critical" /> Institution Critical Count</p>
              <p className="text-4xl font-bold font-mono text-chart-critical">{batchSummary.criticalCount || 0}</p>
            </div>
            <div onClick={() => setScoreModalOpen(true)} className="card-warm p-6 card-glow-hover border-border/50 shadow-sm flex flex-col justify-center cursor-pointer transition-all hover:-translate-y-1">
              <p className="text-[11px] font-bold section-label tracking-wide mb-2 flex items-center gap-2"><Shield className="h-4 w-4 text-accent" /> Avg Campus Pulse Score</p>
              <p className="text-4xl font-bold font-mono gradient-text-gold">{batchSummary.avgpulseScore}</p>
            </div>
            <div onClick={() => setActiveModalOpen(true)} className="card-warm p-6 card-glow-hover border-border/50 shadow-sm flex flex-col justify-center cursor-pointer transition-all hover:-translate-y-1">
              <p className="text-[11px] font-bold section-label tracking-wide mb-2 flex items-center gap-2"><CheckSquare className="h-4 w-4 text-chart-safe" /> Active Interventions</p>
              <p className="text-4xl font-bold font-mono text-foreground">{auditStudents.length}</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="card-warm p-6 card-glow-hover border-border/50 shadow-sm animate-fade-up" style={{ animationDelay: "0.2s", animationFillMode: "both" }}>
              <h3 className="text-[13px] font-bold section-label tracking-widest mb-6">Department Risk Leaderboard</h3>
              <div className="w-full h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={deptCritical} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} opacity={0.5} />
                    <XAxis dataKey="dept" tick={{ fill: "#888", fontSize: 11, fontFamily: "var(--font-mono)", fontWeight: "bold" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#888", fontSize: 11, fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: 'var(--surface-hover)' }} contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }} />
                    <Bar dataKey="critical" radius={[6, 6, 0, 0]}>
                      {deptCritical.map((d, i) => <Cell key={i} fill={d.color} className="hover:opacity-80 transition-opacity drop-shadow-sm" />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card-warm p-0 border-border/50 shadow-sm flex flex-col overflow-hidden animate-fade-up" style={{ animationDelay: "0.3s", animationFillMode: "both" }}>
              <div className="p-5 border-b border-border/50 bg-surface-warm/30">
                 <h3 className="text-[13px] font-bold section-label tracking-widest flex items-center gap-2"><AlertOctagon className="h-4 w-4 text-chart-critical" /> Top Urgent Escalations</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {escalations.slice(0, 5).map((s, i) => (
                  <div key={s.id} className="p-4 bg-surface-warm/30 rounded-xl border border-border/50 hover:border-red-500/30 hover:bg-red-500/5 transition-all flex justify-between items-center group shadow-sm stagger-1" style={{ animationDelay: `${0.1 * i}s` }}>
                    <div>
                      <p className="font-bold text-[14px] font-syne tracking-wide text-foreground">{s.name} <span className="text-[10px] section-label ml-2 tracking-widest">{s.department}</span></p>
                      <p className="text-[11px] font-medium text-chart-critical mt-1 leading-relaxed">"{analyzeStudent(s).primaryTrigger}"</p>
                    </div>
                    <button onClick={() => { setAcknowledged(a => new Set([...a, s.id])); toast.success(`Escalation acknowledged for ${s.name}`); }} className="hidden group-hover:block btn-ghost border border-border py-1.5 px-3 text-[11px] font-bold rounded-md hover:bg-surface-hover transition-colors shadow-sm">
                      Acknowledge
                    </button>
                  </div>
                ))}
                {escalations.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 border border-chart-safe/20 bg-chart-safe/5 rounded-xl">
                    <div className="p-4 bg-chart-safe/20 rounded-full mb-4"><CheckCircle className="h-8 w-8 text-chart-safe glow-safe" /></div>
                    <p className="font-bold font-syne tracking-wide text-chart-safe text-lg">All Escalations Addressed</p>
                    <p className="text-[11px] font-medium text-muted-foreground mt-2 leading-relaxed">No critical students are pending intervention for &gt;1 week.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "Escalation Panel" && (
        <div className="space-y-6 animate-fade-up" style={{ animationDelay: "0.1s", animationFillMode: "both" }}>
          {escalations.length === 0 ? (
            <div className="p-12 text-center border-2 border-dashed border-chart-safe/30 bg-chart-safe/5 rounded-2xl flex flex-col items-center justify-center shadow-inner">
              <div className="p-4 bg-chart-safe/20 rounded-full mb-4"><CheckCircle className="h-10 w-10 text-chart-safe glow-safe" /></div>
              <p className="font-bold font-syne tracking-wide text-chart-safe text-xl">All Interventions Addressed</p>
              <p className="text-[13px] font-medium text-muted-foreground mt-2 section-label">HODs and Mentors have responded to all critical alerts.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {escalations.map((s, i) => {
                const analysis = analyzeStudent(s);
                return (
                  <div key={s.id} className="card-warm p-6 rounded-2xl border-red-500/30 flex flex-col gap-4 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all card-critical-glow animate-fade-up" style={{ animationDelay: `${0.1 * i}s`, animationFillMode: "both" }}>
                    <div className="flex justify-between items-start border-b border-border/50 pb-4">
                      <div>
                        <p className="font-bold font-syne tracking-wide text-foreground text-xl mb-1">{s.name}</p>
                        <p className="text-[11px] section-label font-mono">{s.id} · <span className="text-accent">{s.department}</span> · Year {s.year}</p>
                      </div>
                      <span className="bg-red-500/10 text-chart-critical border border-red-500/20 text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-lg animate-pulse shadow-sm">ESCALATED</span>
                    </div>
                    <div className="bg-surface-warm/50 rounded-xl p-4 border border-border/50 shadow-inner">
                      <p className="text-[13px] font-medium text-chart-critical leading-relaxed">"{analysis.primaryTrigger}"</p>
                      <p className="text-[11px] font-bold text-muted-foreground flex items-center gap-2 mt-4 section-label">
                        <Clock className="h-4 w-4" /> Flagged Week {s.weekTriggered} <span className="text-border">|</span> <span className="text-red-400">{(6 - s.weekTriggered) * 7} days unresolved</span>
                      </p>
                    </div>
                    <div className="flex gap-3 mt-2">
                      <button onClick={() => { setAcknowledged(a => new Set([...a, s.id])); toast.success(`Acknowledged ${s.name}`); }} className="flex-1 btn-ghost border border-border text-[11px] font-bold uppercase tracking-wider py-3 rounded-xl hover:bg-surface-hover transition-colors shadow-sm">
                        Acknowledge
                      </button>
                      <button onClick={() => toast("Formal escalation dispatched to Chairman", { icon: <Shield className="h-4 w-4" />})} className="flex-1 btn-primary py-3 text-[11px] font-bold uppercase tracking-wider rounded-xl shadow-md glow-maroon transition-all">
                        Escalate to Chairman
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === "Compliance Tracker" && (
        <div className="card-warm border-border/50 p-8 shadow-sm animate-fade-up" style={{ animationDelay: "0.1s", animationFillMode: "both" }}>
          <h3 className="flex items-center gap-3 font-bold font-syne tracking-wide text-foreground mb-8 text-xl"><CheckSquare className="h-6 w-6 text-accent" /> Anna University Attendance Compliance</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="p-6 rounded-2xl bg-chart-safe/5 border border-chart-safe/20 text-center shadow-inner hover:scale-[1.02] transition-transform">
              <p className="text-4xl font-bold font-mono text-chart-safe mb-2">{above75}</p>
              <p className="text-[11px] font-bold section-label uppercase tracking-widest text-foreground">Compliant (≥75%)</p>
            </div>
            <div className="p-6 rounded-2xl bg-chart-observation/5 border border-chart-observation/20 text-center shadow-inner hover:scale-[1.02] transition-transform">
              <p className="text-4xl font-bold font-mono text-chart-observation mb-2">{below75 - below65}</p>
              <p className="text-[11px] font-bold section-label uppercase tracking-widest text-foreground">Warning (65-74%)</p>
            </div>
            <div className="p-6 rounded-2xl bg-red-500/5 border border-red-500/20 text-center relative overflow-hidden shadow-inner hover:scale-[1.02] transition-transform">
              <div className="absolute inset-0 bg-red-500/5 animate-pulse pointer-events-none"></div>
              <p className="text-4xl font-bold font-mono text-chart-critical relative z-10 mb-2">{below65}</p>
              <p className="text-[11px] font-bold section-label uppercase tracking-widest text-chart-critical relative z-10">Detention Risk (&lt;65%)</p>
            </div>
          </div>

          <div className="space-y-4 mb-10 bg-surface-warm/50 p-6 rounded-2xl border border-border/50 shadow-inner">
            <div className="flex justify-between text-[11px] font-bold section-label tracking-widest mb-1">
              <span>0%</span>
              <span className="text-foreground">Compliance Distribution Across Institution</span>
              <span>100%</span>
            </div>
            <div className="flex h-8 w-full rounded-full overflow-hidden shadow-inner bg-surface">
              <div className="h-full bg-chart-safe hover:opacity-80 transition-opacity" style={{ width: `${(above75 / students.length) * 100}%` }} title={`≥75%: ${above75}`} />
              <div className="h-full bg-chart-observation hover:opacity-80 transition-opacity" style={{ width: `${((below75 - below65) / students.length) * 100}%` }} title={`65–74%: ${below75 - below65}`} />
              <div className="h-full bg-chart-critical hover:opacity-80 transition-opacity" style={{ width: `${(below65 / students.length) * 100}%` }} title={`<65%: ${below65}`} />
            </div>
          </div>

          <div className="flex justify-end">
            <button onClick={() => toast.success("Compliance report generated for AU portal")} className="btn-secondary py-3 px-6 text-[11px] font-bold uppercase tracking-wider rounded-xl shadow-sm hover:shadow-md transition-all">
              Export AU Compliance Report
            </button>
          </div>
        </div>
      )}
        {activeTab === "Cross-Dept Analytics" && (
        <div className="card-warm border-border/50 p-8 h-[550px] shadow-sm flex flex-col animate-fade-up" style={{ animationDelay: "0.1s", animationFillMode: "both" }}>
           <h3 className="text-[13px] font-bold section-label tracking-widest mb-6 flex items-center gap-3"><Globe className="h-5 w-5 text-accent" /> Institutional Department Comparison Radar</h3>
           <div className="w-full h-[300px] bg-surface-warm/30 rounded-2xl border border-border/50 shadow-inner p-4">
             <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="var(--border)" opacity={0.5} />
                  <PolarAngleAxis dataKey="axis" tick={{ fill: "#888", fontSize: 11, fontFamily: "var(--font-mono)", fontWeight: "bold" }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "#888", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Radar name="AI & DS" dataKey="AI & DS" stroke="#ca8a04" fill="#ca8a04" fillOpacity={0.2} strokeWidth={2} />
                  <Radar name="CSE" dataKey="CSE" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} strokeWidth={2} />
                  <Radar name="ECE" dataKey="ECE" stroke="#16a34a" fill="#16a34a" fillOpacity={0.2} strokeWidth={2} />
                  <Legend wrapperStyle={{ paddingTop: "20px", fontSize: "12px", fontWeight: "bold" }} />
                  <Tooltip contentStyle={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", fontSize: "12px", fontWeight: "bold" }} />
                </RadarChart>
              </ResponsiveContainer>
           </div>
        </div>
      )}

      {activeTab === "Dropout Insights AI" && (
        <div className="space-y-6 animate-fade-up" style={{ animationDelay: "0.1s", animationFillMode: "both" }}>
          <div className="flex items-center gap-4 card-warm p-6 mb-6 shadow-sm border-border/50">
            <div className="h-12 w-12 rounded-xl gradient-maroon flex items-center justify-center glow-maroon shadow-lg">
              <TrendingDown className="h-6 w-6 text-accent" />
            </div>
            <div>
              <h2 className="text-2xl font-bold font-syne tracking-wide text-foreground mb-1">Principal's Dropout Insights AI</h2>
              <p className="text-[11px] font-bold section-label tracking-widest text-muted-foreground uppercase">Strategic institution-wide anomaly directives</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              {["Attendance Collapse", "Hidden Talent Loss", "Disengagement", "Academic Overload"].map((p, i) => (
                <div key={p} className="p-5 rounded-2xl border border-border/50 bg-surface-warm/50 hover:bg-surface-hover hover:border-accent/40 hover:-translate-y-1 transition-all shadow-sm group animate-fade-up" style={{ animationDelay: `${0.1 * i}s` }}>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold font-syne tracking-wide text-[15px] text-foreground group-hover:text-accent transition-colors">{p}</h3>
                    <button onClick={() => runMacroAnalysis(p)} disabled={analyzing} className="text-[10px] uppercase tracking-widest btn-ghost bg-accent/10 hover:bg-accent/20 text-accent px-4 py-2 rounded-lg font-bold transition-colors border border-accent/20 shadow-sm">
                      Generate Directive
                    </button>
                  </div>
                  <p className="text-[11px] font-medium leading-relaxed text-muted-foreground">Macro pattern currently flagged across departments.</p>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-accent/30 bg-accent/5 p-8 relative overflow-hidden shadow-[inset_0_0_50px_rgba(255,215,0,0.05)] flex flex-col min-h-[300px]">
              <Cpu className="absolute -right-12 -bottom-12 h-64 w-64 text-accent/5 animate-float pointer-events-none" />
              <h3 className="font-bold text-accent mb-6 text-[13px] uppercase tracking-widest flex items-center gap-3 relative z-10"><Sparkles className="h-5 w-5 text-accent animate-pulse" /> AI Policy Directive</h3>
              {analyzing ? (
                <div className="space-y-4 relative z-10 flex-1">
                  <div className="h-3 bg-accent/20 rounded-full w-3/4 animate-pulse"></div>
                  <div className="h-3 bg-accent/20 rounded-full w-full animate-pulse"></div>
                  <div className="h-3 bg-accent/20 rounded-full w-5/6 animate-pulse"></div>
                  <div className="h-3 bg-accent/20 rounded-full w-2/3 animate-pulse"></div>
                </div>
              ) : aiAnalysis ? (
                <div className="text-[13px] text-foreground whitespace-pre-wrap leading-relaxed relative z-10 flex-1 font-medium bg-surface/50 p-5 rounded-xl border border-accent/10 shadow-inner backdrop-blur-sm">{aiAnalysis}</div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center relative z-10 opacity-60">
                  <div className="p-4 rounded-full border border-dashed border-accent/30 mb-4"><Cpu className="h-8 w-8 text-accent/50" /></div>
                  <p className="text-[11px] font-bold uppercase tracking-widest section-label max-w-[200px] leading-relaxed">Select a dropout pattern to generate a Principal's directive for HODs.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}      

      {/* Ask CampusIQ Assistant Chat */}
      {activePage === "chat" && (
        <div className="space-y-6 animate-fade-up">
          <div className="card-warm hero-mesh flex flex-col h-[700px] shadow-2xl overflow-hidden max-w-4xl mx-auto w-full rounded-[24px]">
            <div className="bg-surface/60 backdrop-blur-md border-b border-border/50 px-6 py-4 flex items-center gap-4 z-10">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl gradient-maroon shadow-md border border-accent/20 glow-maroon">
                <Brain className="h-5 w-5 text-accent animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-syne tracking-wide gradient-text-gold">Principal Executive Advisor</h3>
                <p className="text-[11px] section-label mt-0.5" >Institution-Wide Insights AI</p>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar relative z-10 bg-gradient-to-b from-transparent to-surface-warm/30">
              {messages.map((m, i) => (
                <div key={i} className={`flex gap-4 max-w-[85%] ${m.role === "user" ? "ml-auto flex-row-reverse" : ""}`}>
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${m.role === "assistant" ? "bg-card border border-accent/20 text-accent glow-gold" : "gradient-maroon text-muted/80" }`}>
                    {m.role === "assistant" ? <Brain className="h-4 w-4" /> : <Users className="h-4 w-4" />}
                  </div>
                  <div className={`p-4 rounded-2xl text-[13px] leading-relaxed shadow-sm backdrop-blur-sm ${m.role === "user" ? "bg-accent/10 border border-accent/20 text-foreground rounded-tr-sm" : "bg-card/80 border border-border/50 text-foreground rounded-tl-sm border-l-2 border-l-accent"}`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex gap-4 max-w-[85%]">
                  <div className="h-8 w-8 rounded-full bg-card border border-accent/20 flex items-center justify-center shrink-0 shadow-sm glow-gold">
                    <Brain className="h-4 w-4 text-accent animate-pulse" />
                  </div>
                  <div className="p-4 rounded-2xl bg-card/80 border border-border/50 rounded-tl-sm flex gap-2 items-center shadow-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-accent/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-accent/60 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-surface/80 backdrop-blur-md border-t border-border/50 z-10">
              <form onSubmit={handleSendChat} className="flex gap-3 max-w-4xl mx-auto">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask for institution-wide retention strategies, compliance scores, or escalation metrics..."
                  className="flex-1 bg-card/50 border border-border/50 rounded-xl px-5 py-3 text-[13px] focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all font-medium placeholder:text-muted-foreground/50 shadow-inner"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || isTyping}
                  className="gradient-maroon text-accent px-5 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-md glow-maroon"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}      

      {/* MODALS */}
      <Dialog open={monitoredModalOpen} onOpenChange={setMonitoredModalOpen}>
        <DialogContent className="sm:max-w-[500px] border-border/50 bg-surface-warm shadow-2xl p-6">
          <DialogHeader><DialogTitle className="text-xl font-bold font-syne tracking-wide gradient-text-gold">Total Students Monitored</DialogTitle></DialogHeader>
          <div className="py-8 text-center text-muted-foreground">
             <div className="p-4 bg-blue-500/10 rounded-full inline-flex mb-4"><Users className="h-10 w-10 text-blue-500" /></div>
             <p className="text-3xl font-mono font-bold text-foreground mb-2">{students.length}</p>
             <p className="text-[13px] leading-relaxed">Active student profiles currently analyzed by CampusIQ Assistant across all departments.</p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={criticalModalOpen} onOpenChange={setCriticalModalOpen}>
        <DialogContent className="sm:max-w-[500px] border-border/50 bg-surface-warm shadow-2xl p-6">
          <DialogHeader><DialogTitle className="text-xl font-bold font-syne tracking-wide text-chart-critical">Critical Action Required</DialogTitle></DialogHeader>
          <div className="py-8 text-center text-muted-foreground">
             <div className="p-4 bg-red-500/10 rounded-full inline-flex mb-4"><AlertOctagon className="h-10 w-10 text-chart-critical" /></div>
             <p className="text-3xl font-mono font-bold text-chart-critical mb-2">{batchSummary.criticalCount || 0}</p>
             <p className="text-[13px] leading-relaxed">Students have been flagged with a critical risk of failure or dropout. Immediate Principal override may be required if departments fail to intervene.</p>
          </div>
        </DialogContent>
      </Dialog>
      
      <Dialog open={scoreModalOpen} onOpenChange={setScoreModalOpen}>
        <DialogContent className="sm:max-w-[500px] border-border/50 bg-surface-warm shadow-2xl p-6">
          <DialogHeader><DialogTitle className="text-xl font-bold font-syne tracking-wide gradient-text-gold">Institution Health Score</DialogTitle></DialogHeader>
          <div className="py-8 text-center text-muted-foreground">
             <div className="p-4 bg-accent/10 rounded-full inline-flex mb-4"><Shield className="h-10 w-10 text-accent" /></div>
             <p className="text-3xl font-mono font-bold text-foreground mb-2">{batchSummary.avgpulseScore} / 100</p>
             <p className="text-[13px] leading-relaxed">The aggregated CampusIQ Health Score across all departments, weighted by attendance and intervention success rate.</p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={activeModalOpen} onOpenChange={setActiveModalOpen}>
        <DialogContent className="sm:max-w-[500px] border-border/50 bg-surface-warm shadow-2xl p-6">
          <DialogHeader><DialogTitle className="text-xl font-bold font-syne tracking-wide gradient-text-gold">Active Interventions</DialogTitle></DialogHeader>
          <div className="py-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
            <div className="space-y-3">
              {auditStudents.length === 0 ? <p className="text-muted-foreground text-center py-4">No active interventions.</p> : 
                auditStudents.map(s => (
                  <div key={s.id} className="flex justify-between items-center bg-surface-warm/30 p-4 border border-border/50 rounded-xl">
                    <div>
                      <p className="text-[13px] font-bold text-foreground font-syne">{s.name}</p>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">{s.department} • {s.interventionStatus}</p>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* FLOATING ACTION BUTTON */}
      <div className="fixed bottom-6 right-6 z-50">
        {fabOpen && (
           <>
            <div className="fixed inset-0 bg-background/20 backdrop-blur-sm z-40" onClick={() => setFabOpen(false)} />
            <div className="absolute bottom-16 right-0 z-50 flex flex-col gap-3 mb-2 items-end animate-in slide-in-from-bottom-5">
              <button onClick={() => { toast("Broadcasting Institutional Notification..."); setFabOpen(false); }} className="flex items-center gap-3 bg-card border border-accent/30 text-accent hover:bg-accent/10 px-4 py-2.5 rounded-full shadow-lg transition-colors group whitespace-nowrap">
                <span className="text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0">Broadcast Notification</span>
                <Globe className="h-5 w-5 shrink-0" />
              </button>
              <button onClick={() => { toast.success("Institution report exported to Excel"); setFabOpen(false); }} className="flex items-center gap-3 bg-card border border-blue-500/30 text-blue-500 hover:bg-blue-500/10 px-4 py-2.5 rounded-full shadow-lg transition-colors group whitespace-nowrap">
                <span className="text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0">Download Full Report</span>
                <Download className="h-5 w-5 shrink-0" />
              </button>
            </div>
           </>
        )}
        <button 
          onClick={() => setFabOpen(!fabOpen)}
          className={`h-14 w-14 rounded-full gradient-maroon text-accent flex items-center justify-center shadow-[0_0_20px_rgba(128,0,0,0.5)] transition-transform duration-300 relative z-50 ${fabOpen ? "rotate-45" : "hover:scale-105"}`}
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>

    </div>
  );
}
