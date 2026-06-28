import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { students, departmentStats } from "@/data/students";
import { getBatchRiskSummary, analyzeStudent } from "@/utils/CampusIQAI";
import { Users, Shield, Target, AlertTriangle, BarChart3, ChevronRight, FileText, Globe, TrendingUp, TrendingDown, CheckCircle, Download, Share2, Crown, ClipboardList, Brain, Send } from "lucide-react";
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, AreaChart, Area, Legend, Cell, LineChart, Line, BarChart, Bar } from "recharts";
import { askClaude } from "@/utils/claudeAI";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const STATUS_COLORS: Record<string, string> = {
  Safe: "#22c55e",
  Observation: "#eab308",
  "At-Risk": "#f97316",
  Critical: "#ef4444",
};

const DEPT_COLORS: Record<string, string> = {
  "AI & DS": "#16a34a",
  "CSE": "#991b1b",
  "ECE": "#d97706",
  "MECH": "#0284c7",
};

const TABS = ["Strategic Overview", "Industry Readiness", "SDG 4 Impact", "Institution Report"] as const;
type Tab = typeof TABS[number];

export default function ChairmanView({ activePage = "dashboard" }: { activePage?: string }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("Strategic Overview");
  
  useEffect(() => {
    switch (activePage) {
      case "strategic": setActiveTab("Strategic Overview"); break;
      case "industry": setActiveTab("Industry Readiness"); break;
      case "sdg": setActiveTab("SDG 4 Impact"); break;
      case "report": setActiveTab("Institution Report"); break;
      default: setActiveTab("Strategic Overview");
    }
  }, [activePage]);
  const [visibleDepts, setVisibleDepts] = useState<string[]>(Object.keys(DEPT_COLORS));
  const [visibleRiskLines, setVisibleRiskLines] = useState<string[]>(["Critical", "AtRisk", "Safe"]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  
  // Modal states
  const [studentsModalOpen, setStudentsModalOpen] = useState(false);
  const [scoreModalOpen, setScoreModalOpen] = useState(false);
  const [industryModalOpen, setIndustryModalOpen] = useState(false);
  const [criticalModalOpen, setCriticalModalOpen] = useState(false);
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);

  const riskSummary = getBatchRiskSummary(students);
  const criticalCount = students.filter(s => s.status === "Critical").length;
  const atRiskCount = students.filter(s => s.status === "At-Risk").length;
  
  // Pre-computed Metrics
  const avgAttendance = Math.round(students.reduce((a, s) => a + s.attendance, 0) / students.length);
  const instScore = Math.round(students.reduce((a, s) => 
    a + (s.attendance*0.3 + (s.iat1+s.iat2)*0.25 + s.model*0.15 + Math.min(s.hackathonWins*10, 10) + Math.max(0, 10 - s.lateSubmissions))
  , 0) / students.length);
  
  const industryReady = students.filter(s => (s.iat1 + s.iat2) >= 60 && s.hackathonWins >= 2);
  const criticalStudents = students.filter(s => s.status === "Critical");
  const attendanceBelow75 = students.filter(s => s.attendance < 75);

  const sortedByIndustry = [...students].sort((a,b) => ((b.iat1+b.iat2) + b.hackathonWins*10) - ((a.iat1+a.iat2) + a.hackathonWins*10));

  // Modals Data
  const deptCounts = ["AI & DS", "CSE", "ECE", "MECH"].map(d => ({
    dept: d,
    count: students.filter(s => s.department === d).length,
    critical: students.filter(s => s.department === d && s.status === "Critical").length
  }));

  // Radar Data
  const radarData = ["AI & DS", "CSE", "ECE", "MECH"].map(dept => {
    const ds = students.filter(s => s.department === dept);
    if (!ds.length) return { dept, Attendance: 0, "IAT Score": 0, "Model Exam": 0, Hackathons: 0, "Safe Rate": 0, count: 0 };
    return {
      dept,
      count: ds.length,
      Attendance: Math.round(ds.reduce((a,s) => a+s.attendance, 0)/ds.length),
      "IAT Score": Math.round(ds.reduce((a,s) => a+(s.iat1+s.iat2), 0)/ds.length),
      "Model Exam": Math.round(ds.reduce((a,s) => a+s.model, 0)/ds.length),
      Hackathons: Math.round((ds.reduce((a,s) => a+s.hackathonWins, 0)/ds.length) * 20), // Scale to 100 for radar
      "Safe Rate": Math.round(ds.filter(s => s.status==="Safe").length / ds.length * 100)
    };
  });
  // Line Chart Data
  const weeklyRiskData = Array.from({length: 8}, (_, i) => ({
    week: `W${i+1}`,
    Critical: students.filter(s => s.status === "Critical").length + (i > 3 ? Math.floor(i * 0.8) : 0),
    AtRisk: Math.max(0, students.filter(s => s.status === "At-Risk").length - (i > 3 ? Math.floor(i * 0.5) : 0)),
    Safe: students.filter(s => s.status === "Safe").length - (i > 3 ? Math.floor(i * 0.3) : 0),
  }));

  // Scatter Chart Data
  const scatterData = students.map(s => ({
    ...s,
    x: s.iat1 + s.iat2, // Academic Score
    y: s.hackathonWins, // Competition Wins
    z: s.attendance      // Dot size
  }));

  // Area Chart Data
  const projectionData = Array.from({length: 16}, (_, i) => ({
    week: `Week ${i+1}`,
    withoutCampusIQ: Math.min(95, 15 + i * 5),
    withCampusIQ: Math.max(5, 15 - i * 0.5 + (i > 4 ? 2 : 0)),
  }));

  const handleEscalate = (name: string) => {
    toast.success(`Escalation notice sent for ${name} to Principal and Mentor.`);
  };

  const selectedStudent = selectedStudentId ? students.find(s => s.id === selectedStudentId) : null;

  /* Ask CampusIQ Assistant Chat State */
  const [messages, setMessages] = useState<{role: "assistant"|"user", content: string}[]>([
    { role: "assistant", content: `Chairman, I've analyzed the institution's strategic performance. With ${criticalCount} critical students and ${instScore}/100 institution score, I can help you set strategic goals and mandates for department heads.` }
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
    const systemPrompt = `You are CampusIQ, a strategic AI advisor for the Chairman of CampusIQ. Provide concise boardroom-level insights. Be authoritative and strategic. Under 150 words.`;
    const response = await askClaude(systemPrompt, userMessage);
    setMessages(prev => [...prev, { role: "assistant", content: response }]);
    setIsTyping(false);
  };

  return (
    <div className="space-y-6">
      {/* Local Tab Navigation hidden since sidebar controls this now */}

      <div className="animate-in fade-in duration-300">
        {activeTab === "Strategic Overview" && (
          <div className="space-y-6">
            
            {/* KPI STRIP */}
            <div className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar">
              <button onClick={() => setStudentsModalOpen(true)} className="flex-shrink-0 w-64 p-5 card-warm card-glow-hover text-left transition-all hover:-translate-y-1 hover:border-accent/40 border-border/50 shadow-sm focus:outline-none animate-fade-up" style={{ animationDelay: "0.1s", animationFillMode: "both" }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 bg-blue-500/10 rounded-xl shadow-inner"><Users className="h-5 w-5 text-blue-500" /></div>
                  <p className="text-[11px] font-bold section-label tracking-wide">Students Monitored</p>
                </div>
                <p className="text-4xl font-bold font-mono gradient-text-gold">{students.length}</p>
              </button>

              <button onClick={() => setScoreModalOpen(true)} className="flex-shrink-0 w-64 p-5 card-warm card-glow-hover text-left transition-all hover:-translate-y-1 hover:border-accent/40 border-border/50 shadow-sm focus:outline-none animate-fade-up" style={{ animationDelay: "0.2s", animationFillMode: "both" }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 bg-accent/10 rounded-xl shadow-inner"><Shield className="h-5 w-5 text-accent" /></div>
                  <p className="text-[11px] font-bold section-label tracking-wide">Institution Score</p>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-bold font-mono gradient-text-gold">{instScore}</p>
                  <p className="text-sm font-medium text-muted-foreground">/100</p>
                </div>
              </button>

              <button onClick={() => setIndustryModalOpen(true)} className="flex-shrink-0 w-64 p-5 card-warm card-glow-hover text-left transition-all hover:-translate-y-1 hover:border-accent/40 border-border/50 shadow-sm focus:outline-none animate-fade-up" style={{ animationDelay: "0.3s", animationFillMode: "both" }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 bg-chart-safe/10 rounded-xl shadow-inner"><Target className="h-5 w-5 text-chart-safe" /></div>
                  <p className="text-[11px] font-bold section-label tracking-wide">Industry Ready</p>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-bold font-mono gradient-text-gold">{industryReady.length}</p>
                  <p className="text-[11px] font-bold text-chart-safe uppercase tracking-wider">top tier</p>
                </div>
              </button>

              <button onClick={() => setCriticalModalOpen(true)} className={`flex-shrink-0 w-64 p-5 card-warm text-left transition-all hover:-translate-y-1 shadow-sm focus:outline-none animate-fade-up ${criticalCount > 0 ? 'card-critical-glow border-red-500/30' : 'border-border/50'}`} style={{ animationDelay: "0.4s", animationFillMode: "both" }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 bg-red-500/10 rounded-xl shadow-inner"><AlertTriangle className="h-5 w-5 text-chart-critical" /></div>
                  <p className="text-[11px] font-bold section-label tracking-wide">Critical Risk</p>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-bold font-mono text-chart-critical">{criticalCount}</p>
                  <p className="text-[11px] font-bold text-red-500/70 uppercase tracking-wider">require action</p>
                </div>
              </button>

              <button onClick={() => setAttendanceModalOpen(true)} className="flex-shrink-0 w-64 p-5 card-warm card-glow-hover text-left transition-all hover:-translate-y-1 hover:border-accent/40 border-border/50 shadow-sm focus:outline-none animate-fade-up" style={{ animationDelay: "0.5s", animationFillMode: "both" }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 bg-chart-observation/10 rounded-xl shadow-inner"><BarChart3 className="h-5 w-5 text-chart-observation" /></div>
                  <p className="text-[11px] font-bold section-label tracking-wide">Avg Attendance</p>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-bold font-mono gradient-text-gold">{avgAttendance}</p>
                  <p className="text-sm font-medium text-muted-foreground">%</p>
                </div>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* DEPT PERFORMANCE BAR CHART (replaces broken RadarChart) */}
              <div className="card-warm p-6 card-glow-hover border-border/50 shadow-sm animate-fade-up" style={{ animationDelay: "0.6s", animationFillMode: "both" }}>
                <div className="flex flex-col mb-4">
                  <h3 className="text-[13px] font-bold section-label tracking-widest mb-1">Department Performance Matrix</h3>
                  <p className="text-[10px] italic text-muted-foreground">Multi-metric comparison across departments</p>
                </div>
                <div className="w-full h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={radarData}
                      margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                      barCategoryGap="20%"
                      barGap={2}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} opacity={0.5} />
                      <XAxis dataKey="dept" tick={{ fill: "#aaa", fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: "bold" }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fill: "#888", fontSize: 10, fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} />
                      <Tooltip
                        cursor={{ fill: "rgba(255,255,255,0.04)" }}
                        contentStyle={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", borderRadius: "12px", fontSize: "12px", fontWeight: "bold" }}
                      />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: "10px", fontWeight: "bold", paddingTop: "16px", fontFamily: "var(--font-mono)" }} />
                      <Bar dataKey="Attendance" fill="#4ade80" radius={[4, 4, 0, 0]} maxBarSize={18} />
                      <Bar dataKey="IAT Score" fill="#60a5fa" radius={[4, 4, 0, 0]} maxBarSize={18} />
                      <Bar dataKey="Model Exam" fill="#f97316" radius={[4, 4, 0, 0]} maxBarSize={18} />
                      <Bar dataKey="Hackathons" fill="#c084fc" radius={[4, 4, 0, 0]} maxBarSize={18} />
                      <Bar dataKey="Safe Rate" fill="#facc15" radius={[4, 4, 0, 0]} maxBarSize={18} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>


              {/* RISK TREND LINE */}
              <div className="card-warm p-6 card-glow-hover border-border/50 shadow-sm flex flex-col animate-fade-up" style={{ animationDelay: "0.7s", animationFillMode: "both" }}>
                <div className="flex flex-col mb-4">
                  <h3 className="text-[13px] font-bold section-label tracking-widest mb-1">8-Week Risk Evolution</h3>
                  <p className="text-[10px] italic text-muted-foreground">Click legend to toggle lines</p>
                </div>
                <div className="w-full h-[300px] mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weeklyRiskData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} opacity={0.5} />
                      <XAxis dataKey="week" stroke="#888" fontSize={11} fontFamily="var(--font-mono)" tickLine={false} axisLine={false} />
                      <YAxis stroke="#888" fontSize={11} fontFamily="var(--font-mono)" tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}
                        itemStyle={{ fontSize: '13px' }}
                      />
                      <Legend 
                        iconType="circle"
                        verticalAlign="bottom"
                        wrapperStyle={{ paddingTop: '10px', fontSize: '12px', fontWeight: 'bold' }}
                        onClick={(e: any) => {
                          const name = e.dataKey;
                          setVisibleRiskLines(prev => prev.includes(name) ? prev.filter(d => d !== name) : [...prev, name]);
                        }}
                      />
                      <ReferenceLine x="W3" stroke="var(--glow-gold)" strokeDasharray="4 4" label={{ position: 'top', value: 'CampusIQ Trigger Window', fill: 'var(--glow-gold)', fontSize: 10, fontWeight: "bold" }} />
                      
                      {visibleRiskLines.includes("Critical") && <Line type="monotone" dataKey="Critical" stroke="#dc2626" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />}
                      {visibleRiskLines.includes("AtRisk") && <Line type="monotone" dataKey="AtRisk" stroke="#d97706" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />}
                      {visibleRiskLines.includes("Safe") && <Line type="monotone" dataKey="Safe" stroke="#16a34a" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            
          </div>
        )}

        {/* Other tabs will be implemented in subsequent steps to manage complexity */}
        {activeTab === "Industry Readiness" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* QUADRANT SCATTER */}
            <div className="lg:col-span-2 card-warm p-6 card-glow-hover border-border/50 shadow-sm flex flex-col relative h-[500px] animate-fade-up" style={{ animationDelay: "0.2s", animationFillMode: "both" }}>
              <div className="absolute top-8 right-8 gradient-text-gold text-xs font-bold bg-yellow-500/10 px-3 py-1.5 rounded-md shadow-sm border border-yellow-500/20">⭐ Industry Stars</div>
              <div className="absolute top-8 left-16 text-orange-500 font-bold text-xs bg-orange-500/10 px-3 py-1.5 rounded-md shadow-sm border border-orange-500/20">🔧 Hidden Talent</div>
              <div className="absolute bottom-16 right-8 text-blue-500 font-bold text-xs bg-blue-500/10 px-3 py-1.5 rounded-md shadow-sm border border-blue-500/20">📚 Academic Focus</div>
              <div className="absolute bottom-16 left-16 text-chart-critical font-bold text-xs bg-red-500/10 px-3 py-1.5 rounded-md shadow-sm border border-red-500/20">⚠️ Needs Support</div>

              <h3 className="text-[13px] font-bold section-label tracking-widest mb-4 absolute top-6 left-6 z-10">Holistic Student Matrix</h3>

              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                  <XAxis type="number" dataKey="x" name="IAT Total" domain={[0, 100]} stroke="#888" tick={{fontSize: 11, fontFamily: "var(--font-mono)"}} axisLine={false} tickLine={false}>
                    {/* Hacky label replacement handled by text elements in Recharts usually, sticking to basic axis for now */}
                  </XAxis>
                  <YAxis type="number" dataKey="y" name="Hackathons" domain={[0, 6]} stroke="#888" tick={{fontSize: 11, fontFamily: "var(--font-mono)"}} axisLine={false} tickLine={false} />
                  <ZAxis type="number" dataKey="z" range={[40, 140]} name="Attendance" />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3', stroke: 'var(--border)' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const s = payload[0].payload;
                        return (
                          <div className="card-warm p-4 border-accent/20 shadow-2xl z-50">
                            <p className="font-bold text-foreground font-syne tracking-wide">{s.name}</p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest section-label">{s.department}</p>
                            <div className="mt-3 space-y-1 text-xs">
                              <p className="flex justify-between items-center gap-4"><span className="text-muted-foreground">Academic Score:</span> <span className="text-foreground font-mono font-bold">{s.x}/100</span></p>
                              <p className="flex justify-between items-center gap-4"><span className="text-muted-foreground">Competitions:</span> <span className="text-glow-gold font-bold font-mono text-yellow-500">{s.y} Wins</span></p>
                              <p className="flex justify-between items-center gap-4 pt-1 border-t border-border/50"><span className="text-muted-foreground">Attendance:</span> <span className="text-foreground font-mono font-bold">{s.z}%</span></p>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <ReferenceLine x={50} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4" />
                  <ReferenceLine y={2} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4" />
                  <Scatter 
                    data={scatterData} 
                    onClick={(e) => setSelectedStudentId(e.id)}
                    className="cursor-pointer"
                  >
                    {scatterData.map((entry, index) => {
                      let fill = "#16a34a";
                      if (entry.status === "Critical") fill = "#dc2626";
                      if (entry.status === "At-Risk") fill = "#f97316";
                      if (entry.status === "Observation") fill = "#d97706";
                      return (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={fill} 
                          stroke={selectedStudentId === entry.id ? 'var(--glow-gold)' : 'none'}
                          strokeWidth={selectedStudentId === entry.id ? 3 : 0}
                          className="hover:opacity-80 transition-opacity drop-shadow-md"
                        />
                      );
                    })}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
              <div className="mt-4 text-center">
                <p className="text-[10px] font-bold section-label tracking-widest">Academic Score (IAT1 + IAT2) ➔</p>
              </div>
            </div>

            {/* SIDE PANEL / TOP 10 LIST */}
            <div className="space-y-6">
              {/* Dynamic Side Panel */}
              <div className={`card-warm p-6 transition-all duration-300 shadow-sm animate-fade-up ${selectedStudent ? 'border-accent/50 shadow-[0_0_20px_rgba(255,215,0,0.1)]' : 'border-border/50'}`} style={{ animationDelay: "0.4s", animationFillMode: "both" }}>
                <h3 className="flex items-center gap-2 text-[10px] border-b border-border/50 pb-3 mb-4 font-bold section-label tracking-widest">
                  <Target className="h-3 w-3 text-accent" /> {selectedStudent ? "Selected Profile" : "Select a point on the chart"}
                </h3>
                
                {selectedStudent ? (
                  <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
                    <div>
                      <h2 className="text-xl font-bold font-syne tracking-wide text-foreground">{selectedStudent.name}</h2>
                      <p className="text-[11px] text-muted-foreground section-label mt-1">{selectedStudent.id} • <span className="text-accent">{selectedStudent.department}</span> • Year {selectedStudent.year}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-surface-warm/50 rounded-xl p-3 text-center border border-border/50 shadow-inner">
                        <p className="text-[9px] section-label uppercase tracking-widest mb-1">Att</p>
                        <p className="font-mono font-bold text-lg text-foreground">{selectedStudent.attendance}%</p>
                      </div>
                      <div className="bg-surface-warm/50 rounded-xl p-3 text-center border border-border/50 shadow-inner">
                        <p className="text-[9px] section-label uppercase tracking-widest mb-1">Score</p>
                        <p className="font-mono font-bold text-lg text-foreground">{selectedStudent.iat1+selectedStudent.iat2}</p>
                      </div>
                      <div className="bg-surface-warm/50 rounded-xl p-3 text-center border border-border/50 shadow-inner">
                        <p className="text-[9px] section-label uppercase tracking-widest mb-1">Wins</p>
                        <p className="font-mono font-bold text-lg text-yellow-500 glow-gold">{selectedStudent.hackathonWins}</p>
                      </div>
                      <div className="bg-surface-warm/50 rounded-xl p-3 text-center border border-border/50 shadow-inner">
                        <p className="text-[9px] section-label uppercase tracking-widest mb-1">CGPA</p>
                        <p className="font-mono font-bold text-lg text-foreground">{selectedStudent.cgpa}</p>
                      </div>
                    </div>
                    
                    <div className="pt-3 border-t border-border/50">
                       <p className="text-xs font-bold text-foreground mb-3 flex items-center justify-between">AI Persona: <span className="text-[11px] badge-safe font-syne tracking-widest">{selectedStudent.persona}</span></p>
                       <div className="flex gap-2">
                         <button onClick={() => toast("Full profile view coming in student portal")} className="flex-1 btn-secondary py-2 rounded-md text-[11px] font-bold transition-all shadow-sm">
                           View Profile
                         </button>
                         <button onClick={() => toast.success(`Student ${selectedStudent.name} flagged for Chairman review`)} className="flex-1 btn-ghost border border-accent/20 bg-accent/5 hover:bg-accent/15 py-2 rounded-md text-[11px] font-bold text-accent transition-all shadow-sm">
                           Flag for Review
                         </button>
                       </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-48 flex flex-col items-center justify-center gap-4 text-muted-foreground opacity-60">
                    <div className="p-4 rounded-full border border-dashed border-border"><Target className="h-8 w-8" /></div>
                    <p className="text-xs font-medium max-w-[150px] text-center">Click any dot on the quadrant matrix to view student details</p>
                  </div>
                )}
              </div>

              {/* Top 10 List */}
              <div className="card-warm p-0 border-border/50 shadow-sm overflow-hidden flex flex-col h-[280px] animate-fade-up" style={{ animationDelay: "0.6s", animationFillMode: "both" }}>
                 <div className="p-5 border-b border-border/50 bg-surface-warm/30">
                   <h3 className="text-[11px] font-bold section-label tracking-widest flex justify-between items-center">
                     <span>Top 10 Fast-Track</span>
                     <Crown className="h-4 w-4 text-accent" />
                   </h3>
                 </div>
                 <div className="overflow-y-auto custom-scrollbar flex-1 p-3 space-y-1">
                   {sortedByIndustry.slice(0,10).map((s, i) => (
                     <div 
                       key={s.id} 
                       onClick={() => setSelectedStudentId(s.id)}
                       className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all ${selectedStudentId === s.id ? 'bg-accent/10 border-accent/30 shadow-sm' : 'border-transparent hover:bg-surface-hover hover:scale-[1.02]'}`}
                     >
                       <span className={`w-5 text-center font-bold text-xs font-syne ${i<3 ? 'text-accent glow-gold' : 'text-muted-foreground'}`}>#{i+1}</span>
                       <div className="flex-1 min-w-0">
                         <p className={`text-[13px] font-bold truncate transition-colors font-syne ${selectedStudentId === s.id ? 'text-accent' : 'text-foreground'}`}>{s.name}</p>
                         <p className="text-[9px] section-label mt-0.5 tracking-wider">{s.department}</p>
                       </div>
                       <div className="text-right">
                         <p className="text-[11px] font-mono font-bold text-foreground">{s.iat1+s.iat2}</p>
                         <p className="text-[9px] text-yellow-500 font-bold uppercase tracking-wider">{s.hackathonWins}W</p>
                       </div>
                     </div>
                   ))}
                 </div>
              </div>
            </div>
            
          </div>
        )}
        {activeTab === "SDG 4 Impact" && (
          <div className="space-y-6">
            
            {/* 3 IMPACT CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card-warm p-6 shadow-sm flex flex-col items-center text-center border-border/50 card-glow-hover animate-fade-up" style={{ animationDelay: "0.1s", animationFillMode: "both" }}>
                <div className="p-4 bg-yellow-500/10 rounded-2xl mb-5 shadow-inner"><Shield className="h-8 w-8 text-yellow-500 glow-gold" /></div>
                <h3 className="text-[11px] font-bold section-label tracking-wide mb-3">Students Proactively Identified</h3>
                <p className="text-6xl font-mono font-bold gradient-text-gold mb-3">{criticalCount + atRiskCount}</p>
                <p className="text-[11px] text-muted-foreground mb-6 font-medium leading-relaxed">Before academic failure became irreversible</p>
                
                <div className="w-full h-3 flex rounded-full overflow-hidden mt-auto bg-surface-warm shadow-inner">
                  <div className="bg-chart-critical hover:opacity-80 transition-opacity" style={{width: `${(criticalCount/(criticalCount+atRiskCount))*100}%`}} title={`Critical: ${criticalCount}`} />
                  <div className="bg-chart-observation hover:opacity-80 transition-opacity" style={{width: `${(atRiskCount/(criticalCount+atRiskCount))*100}%`}} title={`At-Risk: ${atRiskCount}`} />
                </div>
                <button onClick={() => setActiveTab("Strategic Overview")} className="mt-5 text-[11px] font-bold text-accent hover:text-glow-gold hover:-translate-y-0.5 transition-all">View All At-Risk ➔</button>
              </div>

              <div className="card-warm p-6 shadow-sm flex flex-col items-center text-center border-border/50 card-glow-hover animate-fade-up" style={{ animationDelay: "0.2s", animationFillMode: "both" }}>
                <div className="p-4 bg-chart-safe/10 rounded-2xl mb-5 shadow-inner"><TrendingDown className="h-8 w-8 text-chart-safe glow-safe" /></div>
                <h3 className="text-[11px] font-bold section-label tracking-wide mb-3">Estimated Dropout Prevention</h3>
                <p className="text-6xl font-mono font-bold text-foreground mb-3">{Math.round(criticalCount * 0.68)}</p>
                <p className="text-[11px] text-muted-foreground mb-6 font-medium leading-relaxed">Students projected to be retained through interventions</p>
                
                <div className="w-full flex justify-between items-center mt-auto bg-surface-warm/50 p-4 rounded-xl border border-border/50 shadow-inner">
                  <div className="text-center">
                    <p className="text-[9px] section-label uppercase tracking-widest mb-1">Without CampusIQ</p>
                    <p className="font-mono font-bold text-chart-critical text-lg">{criticalCount}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground animate-pulse" />
                  <div className="text-center">
                    <p className="text-[9px] section-label uppercase tracking-widest mb-1">With CampusIQ</p>
                    <p className="font-mono font-bold text-chart-safe text-lg">{Math.round(criticalCount * 0.32)}</p>
                  </div>
                </div>
              </div>

              <div className="card-warm p-6 shadow-sm flex flex-col items-center text-center border-border/50 card-glow-hover animate-fade-up" style={{ animationDelay: "0.3s", animationFillMode: "both" }}>
                <div className="p-4 bg-blue-500/10 rounded-2xl mb-5 shadow-inner"><Users className="h-8 w-8 text-blue-500/80" /></div>
                <h3 className="text-[11px] font-bold section-label tracking-wide mb-3">Peer Bridge Network</h3>
                <p className="text-6xl font-mono font-bold text-foreground mb-3">{Math.floor(students.length * 0.3)}</p>
                <p className="text-[11px] text-muted-foreground mb-6 font-medium leading-relaxed">Student-to-student support connections formed</p>
                
                <div className="relative w-full h-16 mt-auto flex items-center justify-center bg-surface-warm/30 rounded-xl border border-dashed border-border/50">
                   {/* CSS Node Network Visualization */}
                   <div className="absolute top-1/2 left-6 right-6 h-0.5 bg-blue-500/20 -translate-y-1/2 rounded-full"></div>
                   <div className="relative z-10 flex gap-5">
                     {['AK', 'MP', 'SD', 'VJ', 'RS'].map((initials, i) => (
                       <div key={i} className="h-9 w-9 rounded-full bg-surface-warm border-2 border-blue-500/40 flex items-center justify-center text-[10px] font-bold font-syne text-foreground hover:scale-110 hover:border-blue-400 hover:shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all cursor-help" style={{ animationDelay: `${i * 0.1 + 0.5}s` }} title="Active Peer Mentor Connection">
                         {initials}
                       </div>
                     ))}
                   </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* DROPOUT PROJECTION AREA CHART */}
              <div className="lg:col-span-2 card-warm p-8 card-glow-hover border-border/50 shadow-sm animate-fade-up" style={{ animationDelay: "0.4s", animationFillMode: "both" }}>
                <h3 className="text-[13px] font-bold section-label tracking-widest mb-6 border-b border-border/50 pb-4">Semester Dropout Probability Projection</h3>
                <div className="w-full h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={projectionData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorWithout" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#dc2626" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorWith" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#16a34a" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} opacity={0.5} />
                      <XAxis dataKey="week" stroke="#888" fontSize={11} fontFamily="var(--font-mono)" tickLine={false} axisLine={false} />
                      <YAxis stroke="#888" fontSize={11} fontFamily="var(--font-mono)" tickLine={false} axisLine={false} domain={[0, 100]} label={{ value: 'Dropout Risk %', angle: -90, position: 'insideLeft', fill: '#888', fontSize: 11, fontWeight: 'bold' }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}
                        itemStyle={{ fontSize: '13px' }}
                        formatter={(value: number, name: string) => [`${value}%`, name === 'withoutCampusIQ' ? 'Without CampusIQ' : 'With CampusIQ']}
                      />
                      <Legend verticalAlign="top" height={40} wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                      <ReferenceLine x="Week 3" stroke="#ca8a04" strokeDasharray="4 4" label={{ position: 'top', value: 'CampusIQ Activated', fill: '#ca8a04', fontSize: 10, fontWeight: 'bold' }} />
                      <Area type="monotone" dataKey="withoutCampusIQ" name="Without CampusIQ" stroke="#dc2626" strokeWidth={3} fillOpacity={1} fill="url(#colorWithout)" />
                      <Area type="monotone" dataKey="withCampusIQ" name="With CampusIQ" stroke="#16a34a" strokeWidth={3} fillOpacity={1} fill="url(#colorWith)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* SDG TEXT BLOCK */}
              <div className="card-warm p-8 bg-surface-warm/50 border-l-[6px] border-l-accent border-r border-y border-border/50 shadow-sm flex flex-col justify-center animate-fade-up relative overflow-hidden" style={{ animationDelay: "0.5s", animationFillMode: "both" }}>
                <Globe className="absolute -right-10 -bottom-10 h-48 w-48 text-accent/5 animate-float" />
                <h3 className="text-xl font-bold font-syne tracking-wide text-foreground mb-4 flex items-center gap-3 relative z-10">
                  <div className="p-2 bg-accent/10 rounded-lg"><Globe className="h-6 w-6 text-accent" /></div>
                  UN SDG 4 — Quality Education
                </h3>
                <p className="text-[11px] font-medium leading-relaxed text-muted-foreground mb-6 relative z-10">How CIT connects to global educational goals through data-driven retention:</p>
                
                <ul className="space-y-5 relative z-10">
                  <li className="flex gap-4 items-start group">
                    <div className="mt-0.5 bg-surface rounded-full p-1 shadow-sm border border-border group-hover:border-chart-safe transition-colors"><CheckCircle className="h-4 w-4 text-chart-safe" /></div>
                    <p className="text-[11px] text-foreground leading-relaxed"><span className="font-bold section-label tracking-wide block mb-0.5">Inclusive education:</span> Identifying marginalized learners before they disengage.</p>
                  </li>
                  <li className="flex gap-4 items-start group">
                    <div className="mt-0.5 bg-surface rounded-full p-1 shadow-sm border border-border group-hover:border-chart-safe transition-colors"><CheckCircle className="h-4 w-4 text-chart-safe" /></div>
                    <p className="text-[11px] text-foreground leading-relaxed"><span className="font-bold section-label tracking-wide block mb-0.5">Quality learning outcomes:</span> Personalized intervention maintains academic standards.</p>
                  </li>
                  <li className="flex gap-4 items-start group">
                    <div className="mt-0.5 bg-surface rounded-full p-1 shadow-sm border border-border group-hover:border-chart-safe transition-colors"><CheckCircle className="h-4 w-4 text-chart-safe" /></div>
                    <p className="text-[11px] text-foreground leading-relaxed"><span className="font-bold section-label tracking-wide block mb-0.5">Data-driven equity:</span> No student falls through the cracks undetected.</p>
                  </li>
                  <li className="flex gap-4 items-start group">
                    <div className="mt-0.5 bg-surface rounded-full p-1 shadow-sm border border-border group-hover:border-chart-safe transition-colors"><CheckCircle className="h-4 w-4 text-chart-safe" /></div>
                    <p className="text-[11px] text-foreground leading-relaxed"><span className="font-bold section-label tracking-wide block mb-0.5">Proactive over reactive:</span> Week 3 detection prevents irreversible academic decline.</p>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === "Institution Report" && (
          <div className="max-w-4xl mx-auto rounded-2xl bg-[#fafafa] p-8 md:p-12 shadow-2xl text-black animate-fade-up border border-border/20 relative overflow-hidden" style={{ animationDelay: "0.1s", animationFillMode: "both" }}>
            {/* Watermark */}
            <Shield className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] text-gray-100 mix-blend-multiply opacity-50 pointer-events-none" />
            
            {/* Action Bar */}
            <div className="flex flex-wrap gap-2 justify-end mb-8 border-b-2 border-gray-200 pb-5 relative z-10">
              <button onClick={() => {toast("Preparing print view..."); setTimeout(() => window.print(), 500)}} className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider bg-white border border-gray-300 shadow-sm hover:shadow hover:bg-gray-50 rounded-lg text-gray-800 transition-all">
                <FileText className="h-4 w-4" /> Print Report
              </button>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(`Semester Intelligence Report - CIT. Monitored ${students.length} students. ${criticalCount} at critical risk. Avg Attendance ${avgAttendance}%.`);
                  toast.success("Executive summary copied to clipboard.");
                }} 
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider bg-white border border-gray-300 shadow-sm hover:shadow hover:bg-gray-50 rounded-lg text-gray-800 transition-all"
               >
                <ClipboardList className="h-4 w-4" /> Copy Summary
              </button>
              <button onClick={() => toast.success("PDF generation queued — available in 2 minutes")} className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider bg-blue-50 border border-blue-200 outline outline-1 outline-blue-100 hover:bg-blue-100 shadow-sm text-blue-800 rounded-lg transition-all">
                <Download className="h-4 w-4" /> Download PDF
              </button>
              <button onClick={() => toast.success("Report shared with Dr. K. Rajkumar (Principal)")} className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider bg-[#800000]/5 hover:bg-[#800000]/10 text-[#800000] border border-[#800000]/20 shadow-sm rounded-lg transition-all">
                <Share2 className="h-4 w-4" /> Share with Principal
              </button>
            </div>

            {/* Document Header */}
            <div className="text-center mb-12 relative z-10">
              <div className="inline-flex p-4 rounded-full bg-white shadow-md border border-gray-100 mb-6">
                <Shield className="h-12 w-12 text-[#800000]" />
              </div>
              <h1 className="text-3xl font-serif font-bold text-[#800000] uppercase tracking-widest mb-2">CampusIQ</h1>
              <h2 className="text-sm font-bold text-gray-600 tracking-[0.2em] uppercase mt-2 border-y border-gray-200 py-3 inline-block">AI & DS Department — Semester Intelligence Report</h2>
              <p className="text-xs text-gray-500 mt-4 font-mono font-medium">Semester IV, Academic Year 2025-26 • Generated by <span className="text-[#800000] font-bold">CampusIQ</span> | Confidential</p>
            </div>

            {/* Content Sections */}
            <div className="space-y-10 relative z-10 font-serif">
              <section>
                <h3 className="text-sm font-bold border-b-2 border-[#800000] pb-2 mb-4 uppercase tracking-[0.15em] text-[#800000] flex items-center gap-2">
                  <span className="bg-[#800000] text-white w-5 h-5 flex items-center justify-center rounded-sm text-xs">1</span> Executive Summary
                </h3>
                <p className="text-base text-gray-800 leading-relaxed font-medium">
                  During Semester IV, CampusIQ successfully monitored a cohort of <strong className="font-bold text-black border-b border-[#ffd700] bg-[#ffd700]/10 px-1">{students.length}</strong> students across 4 departments. 
                  The institutional attendance average currently stands at <strong className="font-bold text-black">{avgAttendance}%</strong>, while the average academic score is <strong className="font-bold text-black">{Math.round(students.reduce((a,s)=>a+s.iat1+s.iat2,0)/students.length)}/100</strong>. 
                  Early warning systems have proactively flagged <strong className="text-red-700 bg-red-50/50 px-1 border border-red-200 rounded">{criticalCount}</strong> students at critical risk of academic failure or dropout, allowing for immediate mentor intervention.
                </p>
              </section>

              <section>
                <h3 className="text-sm font-bold border-b-2 border-[#800000] pb-2 mb-4 uppercase tracking-[0.15em] text-[#800000] flex items-center gap-2">
                  <span className="bg-[#800000] text-white w-5 h-5 flex items-center justify-center rounded-sm text-xs">2</span> Risk Distribution
                </h3>
                <div className="overflow-hidden rounded-lg border border-gray-300 shadow-sm font-sans">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-gray-100 text-gray-900 border-b-2 border-gray-300">
                        <th className="px-5 py-3 text-left font-bold uppercase tracking-wider text-xs">Status Segment</th>
                        <th className="px-5 py-3 text-center font-bold uppercase tracking-wider text-xs border-l border-gray-200">Student Count</th>
                        <th className="px-5 py-3 text-center font-bold uppercase tracking-wider text-xs border-l border-gray-200">Percentage</th>
                        <th className="px-5 py-3 text-center font-bold uppercase tracking-wider text-xs border-l border-gray-200">Intervention Priority</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3 text-red-700 font-bold flex items-center gap-2"><AlertTriangle className="h-4 w-4"/> Critical Risk</td>
                        <td className="px-5 py-3 text-center font-mono font-bold text-lg border-l border-gray-200">{criticalCount}</td>
                        <td className="px-5 py-3 text-center font-mono font-medium border-l border-gray-200">{Math.round((criticalCount/students.length)*100)}%</td>
                        <td className="px-5 py-3 text-center text-red-700 text-xs font-bold uppercase tracking-wider border-l border-gray-200 bg-red-50">Immediate (48h)</td>
                      </tr>
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3 text-orange-600 font-bold flex items-center gap-2"><TrendingDown className="h-4 w-4"/> At-Risk</td>
                        <td className="px-5 py-3 text-center font-mono font-bold text-lg border-l border-gray-200">{atRiskCount}</td>
                        <td className="px-5 py-3 text-center font-mono font-medium border-l border-gray-200">{Math.round((atRiskCount/students.length)*100)}%</td>
                        <td className="px-5 py-3 text-center text-orange-700 text-xs font-bold uppercase tracking-wider border-l border-gray-200 bg-orange-50">High (1 Week)</td>
                      </tr>
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3 text-green-700 font-bold flex items-center gap-2"><CheckCircle className="h-4 w-4"/> Safe Zone</td>
                        <td className="px-5 py-3 text-center font-mono font-bold text-lg border-l border-gray-200">{students.length - criticalCount - atRiskCount}</td>
                        <td className="px-5 py-3 text-center font-mono font-medium border-l border-gray-200">{Math.round(((students.length - criticalCount - atRiskCount)/students.length)*100)}%</td>
                        <td className="px-5 py-3 text-center text-green-700 text-xs font-bold uppercase tracking-wider border-l border-gray-200 bg-green-50">Monitor</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              <section>
                <h3 className="text-sm font-bold border-b-2 border-[#800000] pb-2 mb-4 uppercase tracking-[0.15em] text-[#800000] flex items-center gap-2">
                  <span className="bg-[#800000] text-white w-5 h-5 flex items-center justify-center rounded-sm text-xs">3</span> Strategic Highlights & Recommendations
                </h3>
                <ul className="space-y-4 text-base text-gray-800 font-medium font-sans">
                  <li className="flex gap-3 items-start bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <Target className="h-5 w-5 text-[#800000] shrink-0 mt-0.5" />
                    <p><strong className="text-black uppercase text-xs tracking-wider block mb-1">Industry Readiness:</strong> {industryReady.length} students have demonstrated exceptional technical skills (&gt;60% IAT, 2+ Hackathons) and should be fast-tracked for placement drives.</p>
                  </li>
                  <li className="flex gap-3 items-start bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <Users className="h-5 w-5 text-[#800000] shrink-0 mt-0.5" />
                    <p><strong className="text-black uppercase text-xs tracking-wider block mb-1">Intervention Deployment:</strong> {Math.floor(students.length * 0.3)} Peer Bridges active. Recommend escalating {criticalCount} critical cases to Principal review by end of week.</p>
                  </li>
                  <li className="flex gap-3 items-start bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <BarChart3 className="h-5 w-5 text-[#800000] shrink-0 mt-0.5" />
                    <p><strong className="text-black uppercase text-xs tracking-wider block mb-1">Attendance Drift:</strong> A notable drift in lab attendance compared to theory is observed in the lower quartile. Recommend auditing lab engagement strategies.</p>
                  </li>
                </ul>
              </section>
            </div>
          </div>
        )}
      </div>

      {/* SEPARATE DIALOGS */}
      <Dialog open={studentsModalOpen} onOpenChange={setStudentsModalOpen}>
        <DialogContent className="bg-card border border-border text-foreground max-w-lg w-full max-h-[80vh] overflow-y-auto rounded-xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold font-syne tracking-wide flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-xl"><Users className="h-6 w-6 text-blue-500"/></div> Department Breakdown
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 w-full">
            <table className="w-full text-sm text-left">
              <thead className="text-[11px] font-bold tracking-wider section-label uppercase bg-surface-warm/50 border-b border-border/50">
                <tr><th className="px-5 py-3 rounded-tl-xl leading-relaxed">Department</th><th className="px-5 py-3 leading-relaxed">Total Monitored</th><th className="px-5 py-3 rounded-tr-xl leading-relaxed">Critical Flags</th></tr>
              </thead>
              <tbody>
                {deptCounts.map(d => (
                  <tr key={d.dept} className="border-b border-border/50 hover:bg-surface-hover cursor-pointer transition-colors" onClick={() => {toast("Filtered view feature coming")}}>
                    <td className="px-5 py-4 font-bold font-syne text-[13px] text-foreground">{d.dept}</td>
                    <td className="px-5 py-4 font-mono font-bold text-lg">{d.count}</td>
                    <td className="px-5 py-4 font-mono font-bold text-lg text-chart-critical">{d.critical}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={industryModalOpen} onOpenChange={setIndustryModalOpen}>
        <DialogContent className="bg-card border border-border text-foreground max-w-lg w-full max-h-[80vh] overflow-y-auto rounded-xl shadow-2xl pr-2 custom-scrollbar">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold font-syne tracking-wide flex items-center gap-3">
              <div className="p-2 bg-chart-safe/10 rounded-xl"><Target className="h-6 w-6 text-chart-safe"/></div> Industry Ready Cohort
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 w-full space-y-4">
            <div className="flex justify-between items-center bg-chart-safe/10 p-4 rounded-xl border border-chart-safe/20 shadow-inner">
              <p className="text-[13px] font-bold text-chart-safe flex items-center gap-2"><Crown className="h-4 w-4"/> Total {industryReady.length} highly engageable students identified.</p>
              <button onClick={() => toast.success("Industry readiness list exported.")} className="text-[11px] uppercase tracking-widest bg-chart-safe text-white font-bold px-4 py-2 rounded-lg hover:bg-green-500 transition-colors shadow-sm cursor-pointer">Export List</button>
            </div>
            <div className="space-y-3">
              {industryReady.map((s, i) => (
                <div key={s.id} className="flex justify-between items-center p-4 bg-surface-warm/30 rounded-xl border border-border/50 hover:border-accent/40 hover:-translate-y-0.5 shadow-sm transition-all group">
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-bold section-label w-4 text-center">#{i+1}</span>
                    <div>
                      <p className="text-[14px] font-bold font-syne tracking-wide text-foreground group-hover:text-accent transition-colors">{s.name}</p>
                      <p className="text-[10px] section-label mt-1">{s.id} • {s.department}</p>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-6">
                    <div>
                      <p className="text-[10px] section-label uppercase tracking-widest mb-0.5">IAT</p>
                      <p className="text-lg font-mono font-bold text-foreground">{s.iat1+s.iat2}</p>
                    </div>
                    <div className="w-px h-8 bg-border border-dashed"></div>
                    <div>
                      <p className="text-[10px] section-label uppercase tracking-widest mb-0.5">Wins</p>
                      <p className="text-lg font-mono font-bold text-yellow-500 glow-gold">{s.hackathonWins}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={criticalModalOpen} onOpenChange={setCriticalModalOpen}>
        <DialogContent className="bg-card border border-border text-foreground max-w-lg w-full max-h-[80vh] overflow-y-auto rounded-xl shadow-2xl pr-2 custom-scrollbar">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold font-syne tracking-wide flex items-center gap-3">
              <div className="p-2 bg-red-500/10 rounded-xl"><AlertTriangle className="h-6 w-6 text-chart-critical"/></div> Critical Risk Students
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 w-full space-y-3">
            {criticalStudents.length === 0 ? <div className="p-8 text-center text-muted-foreground border border-dashed border-border rounded-xl bg-surface-warm/50"><Shield className="h-12 w-12 text-chart-safe mx-auto mb-4 opacity-50 block" /><p className="font-bold">No critical students currently.</p></div> :
              criticalStudents.map(s => (
                <div key={s.id} className="flex justify-between items-center p-4 border border-red-500/20 bg-red-500/5 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-500 font-bold font-syne text-[10px]">CRIT</div>
                    <div>
                      <p className="text-[14px] font-bold font-syne tracking-wide text-foreground">{s.name}</p>
                      <p className="text-[10px] section-label mt-1">{s.id} • Att: <span className="text-chart-critical font-mono font-bold text-[12px]">{s.attendance}%</span></p>
                    </div>
                  </div>
                  <button onClick={() => handleEscalate(s.name)} className="text-[11px] font-bold tracking-widest uppercase px-4 py-2 rounded-lg bg-surface-warm hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/50 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)] transition-all border border-border/50 text-foreground">
                    Escalate
                  </button>
                </div>
              ))
            }
          </div>
        </DialogContent>
      </Dialog>
      
      <Dialog open={scoreModalOpen} onOpenChange={setScoreModalOpen}>
        <DialogContent className="bg-card border border-border text-foreground max-w-lg w-full max-h-[80vh] overflow-y-auto rounded-xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold font-syne tracking-wide flex items-center gap-3">
              <div className="p-2 bg-accent/10 rounded-xl"><Shield className="h-6 w-6 text-accent"/></div> Score Distribution
            </DialogTitle>
          </DialogHeader>
          <div className="p-12 w-full text-center text-muted-foreground border-2 border-dashed border-border/50 rounded-xl bg-surface-warm/30 flex flex-col items-center gap-4">
            <BarChart3 className="h-12 w-12 text-accent/20 animate-pulse" />
            <div>
               <p className="mb-2 font-bold font-syne text-foreground text-lg">Score Distribution Histogram rendering target</p>
               <p className="text-[11px] section-label">Recharts visualization structure ready.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={attendanceModalOpen} onOpenChange={setAttendanceModalOpen}>
        <DialogContent className="bg-card border border-border text-foreground max-w-lg w-full max-h-[80vh] overflow-y-auto rounded-xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold font-syne tracking-wide flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-xl"><BarChart3 className="h-6 w-6 text-chart-observation"/></div> Attendance Alerts
            </DialogTitle>
          </DialogHeader>
          <div className="p-12 w-full text-center text-muted-foreground border-2 border-dashed border-border/50 rounded-xl bg-surface-warm/30 flex flex-col items-center gap-4">
            <BarChart3 className="h-12 w-12 text-accent/20 animate-pulse" />
            <div>
               <p className="mb-2 font-bold font-syne text-foreground text-lg">Attendance Trend View</p>
               <p className="text-[11px] section-label">Recharts visualization structure ready.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Ask CampusIQ Assistant Chat */}
      {activePage === "chat" && (
        <div className="space-y-6 animate-fade-up">
          <div className="card-warm hero-mesh flex flex-col h-[700px] shadow-2xl overflow-hidden max-w-4xl mx-auto w-full rounded-[24px]">
            <div className="bg-surface/60 backdrop-blur-md border-b border-border/50 px-6 py-4 flex items-center gap-4 z-10">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl gradient-maroon shadow-md border border-accent/20 glow-maroon">
                <Brain className="h-5 w-5 text-accent animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-syne tracking-wide gradient-text-gold">Chairman Strategic AI</h3>
                <p className="text-[11px] section-label mt-0.5">Executive Board Intelligence</p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar relative z-10 bg-gradient-to-b from-transparent to-surface-warm/30">
              {messages.map((m, i) => (
                <div key={i} className={`flex gap-4 max-w-[85%] ${m.role === "user" ? "ml-auto flex-row-reverse" : ""}`}>
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${m.role === "assistant" ? "bg-card border border-accent/20 text-accent glow-gold" : "gradient-maroon text-muted/80"}`}>
                    {m.role === "assistant" ? <Brain className="h-4 w-4" /> : <Crown className="h-4 w-4" />}
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
                  placeholder="Ask about strategic goals, SDG alignment, industry readiness, or institution-wide mandates..."
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
    </div>
  );
}
