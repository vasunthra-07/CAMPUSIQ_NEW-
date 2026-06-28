import { useState, useRef, useEffect, Fragment } from "react";
import { useAuth } from "@/context/AuthContext";
import { students } from "@/data/students";
import { analyzeStudent } from "@/utils/CampusIQAI";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine, CartesianGrid } from "recharts";
import { Search, Download, Plus, AlertCircle, ChevronDown, ChevronUp, BookOpen, Send, Shield, Sparkles, UserCheck, Activity, BrainCircuit } from "lucide-react";
import { toast } from "sonner";
import { askClaude } from "@/utils/claudeAI";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function TeacherView({ activePage = "dashboard" }: { activePage?: string }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("All Students");
  const [search, setSearch] = useState("");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [fabOpen, setFabOpen] = useState(false);

  const [avgModalOpen, setAvgModalOpen] = useState(false);
  const [belowPassModalOpen, setBelowPassModalOpen] = useState(false);
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [interventionModalOpen, setInterventionModalOpen] = useState(false);

  useEffect(() => {
    if (activePage === "atrisk") setActiveTab("Below Pass");
    else if (activePage === "overview") setActiveTab("All Students");
  }, [activePage]);

  // Filter out behavioral data for Teacher view
  const classStudents = students.map(s => ({
    ...s,
    // explicitly mask fields the teacher shouldn't see directly
    lmsActivity: undefined,
    driftType: undefined,
    reasoningNote: undefined,
    interventionStatus: undefined
  }));

  const filtered = classStudents.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.id.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (activeTab === "Below Pass") return (s.iat1 + s.iat2) < 50;
    if (activeTab === "Attendance Warning") return s.attendance < 75;
    if (activeTab === "Top Performers") return (s.iat1 + s.iat2) >= 80;
    return true;
  });

  const avgIat = Math.round(classStudents.reduce((acc, s) => acc + (s.iat1 + s.iat2), 0) / classStudents.length);
  const belowPass = classStudents.filter(s => (s.iat1 + s.iat2) < 50).length;
  const avgAtt = Math.round(classStudents.reduce((acc, s) => acc + s.attendance, 0) / classStudents.length);
  const interventionNeeded = classStudents.filter(s => analyzeStudent(s).riskLevel !== "Low").length;

  const distData = [
    { range: "<50", count: classStudents.filter(s => (s.iat1 + s.iat2) < 50).length },
    { range: "50-60", count: classStudents.filter(s => (s.iat1 + s.iat2) >= 50 && (s.iat1 + s.iat2) < 60).length },
    { range: "60-75", count: classStudents.filter(s => (s.iat1 + s.iat2) >= 60 && (s.iat1 + s.iat2) < 75).length },
    { range: "75-90", count: classStudents.filter(s => (s.iat1 + s.iat2) >= 75 && (s.iat1 + s.iat2) < 90).length },
    { range: ">90", count: classStudents.filter(s => (s.iat1 + s.iat2) >= 90).length },
  ];

  /* Chatbot state */
  const [messages, setMessages] = useState<{role: "assistant"|"user", content: string}[]>([
    { role: "assistant", content: `${user?.name.split(" ")[0]}, I've analyzed your class of ${classStudents.length} students. ${interventionNeeded} are at risk. Would you like teaching strategy suggestions for the most common weak areas?` }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  /* Quick Entry State */
  const [quickEntryId, setQuickEntryId] = useState("");
  const [quickEntryMarks, setQuickEntryMarks] = useState("");

  const handleQuickEntrySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickEntryId && quickEntryMarks) {
      toast.success(`Marks updated for ${quickEntryId}`);
      setQuickEntryId("");
      setQuickEntryMarks("");
    }
  };

  useEffect(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), [messages, isTyping]);

  const handleSendChat = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!chatInput.trim() || isTyping) return;
    
    const userMessage = chatInput.trim();
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setChatInput("");
    setIsTyping(true);

    const systemPrompt = `You are CampusIQ, an AI teaching assistant for ${user?.name} at CampusIQ. You analyze class performance patterns and suggest teaching strategies specific to Anna University syllabus. Class average IAT is ${avgIat}/100. ${belowPass} students are failing. Be concise, practical, and list specific methods. Under 150 words.`;
    
    const response = await askClaude(systemPrompt, userMessage);
    setMessages(prev => [...prev, { role: "assistant", content: response }]);
    setIsTyping(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Stats - Show on all except chat */}
      {activePage !== "chat" && activePage !== "markentry" && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-up">
          {[
            { id: "avg", label: "Class Avg IAT", val: `${avgIat}/100`, color: "text-blue-400" },
            { id: "below", label: "Below Pass Marking", val: belowPass, color: "text-chart-critical" },
            { id: "att", label: "Class Avg Attendance", val: `${avgAtt}%`, color: avgAtt >= 75 ? "text-chart-safe" : "text-orange-400" },
            { id: "int", label: "Need Intervention", val: interventionNeeded, color: "text-chart-observation" },
          ].map((s, i) => (
            <div key={i} onClick={() => {
                if (s.id === "avg") setAvgModalOpen(true);
                if (s.id === "below") setBelowPassModalOpen(true);
                if (s.id === "att") setAttendanceModalOpen(true);
                if (s.id === "int") setInterventionModalOpen(true);
              }}
              className="card-warm card-glow-hover p-5 border-border/50 shadow-md cursor-pointer transition-all hover:-translate-y-1" style={{ animationDelay: `${i * 0.1}s`, animationFillMode: "both" }}>
              <p className="text-[11px] font-bold section-label">{s.label}</p>
              <p className={`text-3xl font-bold font-mono mt-2 ${s.color}`}>{s.val}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Main Content (Table + Chart) */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Class Health Summary & Distribution (Dashboard Only) */}
          {activePage === "overview" && (
            <div className="grid md:grid-cols-2 gap-6 animate-fade-up z-10">
              <div className="card-warm p-6 card-glow-hover border-border/50">
                <h3 className="text-[13px] font-bold section-label tracking-widest mb-3">Class Health Summary</h3>
            <div className="w-full h-5 mt-3 mb-3 rounded-full overflow-hidden flex shadow-inner border border-border/50 bg-surface-warm">
              <div 
                className="bg-chart-safe hover:brightness-110 transition-all shadow-[0_0_10px_rgba(74,222,128,0.3)] animate-progress" 
                style={{width: `${(classStudents.length - interventionNeeded - belowPass) / classStudents.length * 100}%`}} 
                title={`Safe: ${classStudents.length - interventionNeeded - belowPass}`} 
              />
              <div 
                className="bg-chart-observation hover:brightness-110 transition-all shadow-[0_0_10px_rgba(250,204,21,0.3)] animate-progress" 
                style={{width: `${interventionNeeded / classStudents.length * 100}%`}} 
                title={`At-Risk: ${interventionNeeded}`} 
              />
              <div 
                className="bg-chart-critical hover:brightness-110 transition-all shadow-[0_0_10px_rgba(244,63,94,0.3)] animate-progress" 
                style={{width: `${belowPass / classStudents.length * 100}%`}} 
                title={`Critical/Below Pass: ${belowPass}`} 
              />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-2">
               <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-chart-safe glow-safe"></span> Safe Zone</span>
               <span className="flex items-center gap-1.5 line-through decoration-muted-foreground/50">Intervention Zone <span className="w-2 h-2 rounded-full bg-chart-critical glow-critical"></span></span>
            </div>
          </div>
          
          <div className="card-warm p-6 card-glow-hover border-border/50">
            <h3 className="text-[13px] font-bold section-label tracking-widest mb-5">IAT Score Distribution</h3>
            <div className="w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distData}>
                  <XAxis dataKey="range" tick={{ fill: "#888", fontSize: 11, fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: "rgba(255,255,255,0.05)" }} contentStyle={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", fontSize: "12px", fontWeight: "bold", fontFamily: "var(--font-mono)" }} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {distData.map((d, i) => <Cell key={i} fill={d.range === "<50" ? "#dc2626" : d.range === ">90" ? "#16a34a" : "#d97706"} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Table Section (Marks, At-Risk, Dashboard) */}
      {(activePage === "overview" || activePage === "atrisk") && (
        <div className="card-warm overflow-hidden animate-fade-up shadow-xl border-border/50 relative z-10">
          <div className="p-4 border-b border-border/50 flex flex-col sm:flex-row gap-5 justify-between items-center bg-surface-warm/50">
              <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
                {["All Students", "Below Pass", "Attendance Warning", "Top Performers"].map(t => (
                  <button key={t} onClick={() => setActiveTab(t)} className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${activeTab === t ? "nav-active btn-primary shadow-sm" : "btn-ghost text-muted-foreground"}`}>
                    {t}
                  </button>
                ))}
              </div>
              <div className="flex gap-3 w-full sm:w-auto mt-4 sm:mt-0">
                <form onSubmit={handleQuickEntrySubmit} className="flex gap-2 input-warm rounded-xl p-1.5 items-center mr-2 shadow-inner">
                   <input 
                     type="text" 
                     placeholder="ID (e.g. S01)" 
                     value={quickEntryId}
                     onChange={e => setQuickEntryId(e.target.value)}
                     className="w-24 bg-transparent text-xs text-foreground px-2 focus:outline-none placeholder:text-muted-foreground/50 uppercase font-bold tracking-widest" 
                   />
                   <div className="w-px bg-border/50 h-5" />
                   <input 
                     type="number" 
                     placeholder="Marks" 
                     value={quickEntryMarks}
                     onChange={e => setQuickEntryMarks(e.target.value)}
                     className="w-16 bg-transparent text-xs font-mono font-bold text-foreground px-2 focus:outline-none placeholder:text-muted-foreground/50" 
                     max="100"
                     min="0"
                   />
                   <button type="submit" disabled={!quickEntryId || !quickEntryMarks} className="bg-accent/15 text-accent hover:bg-accent hover:text-maroon transition-colors p-1.5 rounded-lg disabled:opacity-50">
                     <Send className="h-3.5 w-3.5" />
                   </button>
                </form>

                <div className="relative flex-1 sm:w-56 shadow-inner rounded-xl">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="w-full input-warm pl-10 pr-4 py-2.5 text-xs focus:border-accent" />
                </div>
                <button onClick={() => toast.success("Class report exported to Excel")} className="btn-ghost p-2.5 rounded-xl border border-transparent hover:border-border transition-colors flex items-center justify-center bg-surface hover:bg-surface-hover">
                  <Download className="h-4 w-4 text-muted-foreground hover:text-white" />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="border-b border-border text-muted-foreground bg-surface-warm/30">
                  <tr>
                    <th className="p-4 font-bold section-label text-[10px]">Student</th>
                    <th className="p-4 font-bold section-label text-[10px]">IAT1</th>
                    <th className="p-4 font-bold section-label text-[10px]">IAT2</th>
                    <th className="p-4 font-bold section-label text-[10px]">Total</th>
                    <th className="p-4 font-bold section-label text-[10px]">Model</th>
                    <th className="p-4 font-bold section-label text-[10px]">Att%</th>
                    <th className="p-4 font-bold section-label text-[10px] text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filtered.map(s => {
                    const isExpanded = expandedRow === s.id;
                    const total = s.iat1 + s.iat2;
                    const aiData = analyzeStudent(s); // used just to get pattern for referral context
                    
                    return (
                      <Fragment key={s.id}>
                        <tr className="hover:bg-surface-hover hover:shadow-[0_0_15px_rgba(0,0,0,0.2)] transition-all cursor-pointer group" onClick={() => setExpandedRow(isExpanded ? null : s.id)}>
                          <td className="p-4">
                            <div className="font-bold text-[13px] text-foreground group-hover:text-accent transition-colors font-syne tracking-wide">{s.name}</div>
                            <div className="font-mono text-[10px] section-label mt-1">{s.id}</div>
                          </td>
                          <td className="p-4 font-mono font-medium">{s.iat1}</td>
                          <td className="p-4 font-mono font-medium">{s.iat2}</td>
                          <td className={`p-4 font-mono font-bold ${total < 50 ? "text-chart-critical" : "text-chart-safe"}`}>{total}</td>
                          <td className="p-4 font-mono font-medium">{s.model}</td>
                          <td className={`p-4 font-mono font-bold ${s.attendance < 75 ? "text-chart-critical" : "text-foreground"}`}>{s.attendance}%</td>
                          <td className="p-4 text-right">
                            <button className="p-1.5 rounded-md bg-surface border border-border inline-flex text-muted-foreground group-hover:text-accent group-hover:border-accent/40 transition-colors">
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </button>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-surface/30 border-b border-border shadow-inner">
                            <td colSpan={7} className="p-0">
                              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-up" style={{ animationDuration: '0.3s' }}>
                                
                                {/* Mini chart for student */}
                                <div className="bg-surface-warm border border-border/50 rounded-xl p-4 shadow-sm">
                                  <p className="text-[10px] font-bold section-label tracking-widest uppercase mb-4">Performance Trajectory</p>
                                  <div className="h-28 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                      <BarChart data={[
                                        { name: 'IAT 1', score: s.iat1, fill: s.iat1 < 25 ? '#dc2626' : '#16a34a' },
                                        { name: 'IAT 2', score: s.iat2, fill: s.iat2 < 25 ? '#dc2626' : '#16a34a' },
                                        { name: 'Model', score: s.model, fill: s.model < 50 ? '#dc2626' : '#d97706' }
                                      ]} margin={{top:0, right:0, left:-25, bottom:0}}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} opacity={0.5} />
                                        <XAxis dataKey="name" tick={{fontSize: 10, fill: '#888', fontFamily: 'var(--font-mono)'}} axisLine={false} tickLine={false} />
                                        <YAxis tick={{fontSize: 10, fill: '#888', fontFamily: 'var(--font-mono)'}} axisLine={false} tickLine={false} />
                                        <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }} />
                                        <Bar dataKey="score" radius={[4,4,0,0]}>
                                          {
                                            [s.iat1, s.iat2, s.model].map((val, index) => (
                                              <Cell key={`cell-${index}`} fill={index === 2 ? (val < 50 ? '#dc2626' : '#d97706') : (val < 25 ? '#dc2626' : '#16a34a')} />
                                            ))
                                          }
                                        </Bar>
                                      </BarChart>
                                    </ResponsiveContainer>
                                  </div>
                                </div>
                                
                                {/* AI Context & Actions */}
                                <div className="flex flex-col gap-3">
                                  <div className="bg-chart-critical/5 border border-chart-critical/20 rounded-xl p-4 flex-1 shadow-inner relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-chart-critical/5 rounded-bl-full pointer-events-none" />
                                    <p className="text-[11px] font-bold text-chart-critical tracking-widest uppercase mb-2 flex items-center gap-1.5"><BrainCircuit className="h-3.5 w-3.5" /> CampusIQ Context</p>
                                    <p className="text-[13px] text-foreground font-bold mb-2 tracking-wide font-syne">{aiData.pattern}</p>
                                    <p className="text-[11px] text-muted-foreground leading-relaxed italic border-l-2 border-chart-critical/40 pl-3">{aiData.recommendation}</p>
                                  </div>
                                  
                                  <div className="flex gap-3">
                                    <button onClick={() => toast("Assigning Concept Video: 'Algorithms Basics'")} className="flex-1 btn-secondary py-2.5 rounded-lg text-[11px] font-bold transition-all shadow-sm flex items-center justify-center gap-1.5">
                                      <BookOpen className="h-3.5 w-3.5" /> Assign Video
                                    </button>
                                    <button onClick={() => toast.success(`Referral for ${s.name} sent to Mentor`)} className="flex-1 bg-accent/15 border border-accent/30 text-accent font-bold py-2.5 rounded-lg text-[11px] hover:bg-accent hover:text-maroon transition-all shadow-sm flex items-center justify-center gap-1.5">
                                      <UserCheck className="h-3.5 w-3.5" /> Mentor Referral
                                    </button>
                                  </div>
                                </div>

                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Mark Entry Page */}
        {activePage === "markentry" && (
          <div className="space-y-6 animate-fade-up">
            <div className="card-warm p-6 border-border/50 shadow-xl">
              <div className="flex items-center gap-4 mb-6 border-b border-border/50 pb-5">
                <div className="h-10 w-10 rounded-xl gradient-maroon flex items-center justify-center glow-maroon shadow-md">
                  <BookOpen className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h2 className="text-xl font-bold font-syne tracking-wide gradient-text-gold">Mark Entry Desk</h2>
                  <p className="text-[11px] section-label mt-0.5">Enter IAT / Model / Assignment marks per student</p>
                </div>
              </div>

              {/* Exam type selector */}
              <div className="flex gap-3 mb-6 flex-wrap">
                {["IAT-1", "IAT-2", "Model Exam", "Assignment"].map(exam => (
                  <button key={exam} className="px-4 py-2 rounded-lg text-xs font-bold transition-all btn-ghost border border-border/50 hover:btn-primary hover:border-accent/30">
                    {exam}
                  </button>
                ))}
                <span className="ml-auto text-[11px] text-muted-foreground font-bold my-auto section-label">Max Marks: 50</span>
              </div>

              {/* Marks Table */}
              <div className="overflow-x-auto rounded-xl border border-border/50">
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-surface-warm/50 border-b border-border/50">
                    <tr>
                      <th className="text-left p-4 text-[10px] font-bold section-label tracking-widest">Student ID</th>
                      <th className="text-left p-4 text-[10px] font-bold section-label tracking-widest">Name</th>
                      <th className="text-center p-4 text-[10px] font-bold section-label tracking-widest">IAT-1 (/50)</th>
                      <th className="text-center p-4 text-[10px] font-bold section-label tracking-widest">IAT-2 (/50)</th>
                      <th className="text-center p-4 text-[10px] font-bold section-label tracking-widest">Model (/100)</th>
                      <th className="text-center p-4 text-[10px] font-bold section-label tracking-widest">Status</th>
                      <th className="text-center p-4 text-[10px] font-bold section-label tracking-widest">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {classStudents.map((s, i) => {
                      const total = s.iat1 + s.iat2;
                      const status = total < 50 ? "Below Pass" : total < 70 ? "Average" : "Good";
                      const statusColor = total < 50 ? "text-chart-critical" : total < 70 ? "text-chart-observation" : "text-chart-safe";
                      return (
                        <tr key={s.id} className="hover:bg-surface-hover transition-colors group" style={{ animationDelay: `${i * 0.03}s` }}>
                          <td className="p-4 font-mono text-[11px] font-bold section-label">{s.id}</td>
                          <td className="p-4 font-bold text-[13px] font-syne tracking-wide">{s.name}</td>
                          <td className="p-4 text-center">
                            <input
                              type="number"
                              defaultValue={s.iat1}
                              min={0} max={50}
                              className="w-16 text-center bg-surface-warm/50 border border-border/50 rounded-lg px-2 py-1.5 text-[13px] font-mono font-bold focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30 transition-all"
                            />
                          </td>
                          <td className="p-4 text-center">
                            <input
                              type="number"
                              defaultValue={s.iat2}
                              min={0} max={50}
                              className="w-16 text-center bg-surface-warm/50 border border-border/50 rounded-lg px-2 py-1.5 text-[13px] font-mono font-bold focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30 transition-all"
                            />
                          </td>
                          <td className="p-4 text-center">
                            <input
                              type="number"
                              defaultValue={s.model}
                              min={0} max={100}
                              className="w-20 text-center bg-surface-warm/50 border border-border/50 rounded-lg px-2 py-1.5 text-[13px] font-mono font-bold focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30 transition-all"
                            />
                          </td>
                          <td className="p-4 text-center">
                            <span className={`text-[11px] font-bold ${statusColor}`}>{status}</span>
                          </td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => toast.success(`Marks saved for ${s.name}`)}
                              className="text-[10px] font-bold btn-ghost px-3 py-1.5 rounded-lg border border-accent/30 text-accent hover:bg-accent/10 transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                            >
                              Save
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-border/50">
                <button onClick={() => toast("Marks exported to CSV")} className="btn-ghost border border-border/50 text-[11px] font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-sm hover:border-accent/30">
                  <Download className="h-4 w-4" /> Export CSV
                </button>
                <button onClick={() => toast.success("All marks submitted to CampusIQ")} className="btn-primary text-[11px] font-bold px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-md glow-maroon">
                  Submit All Marks
                </button>
              </div>
            </div>
          </div>
        )}
        </div>

        {/* Teacher's CampusIQ Assistant (Chat View) */}
        {activePage === "chat" && (
        <div className="lg:col-span-3 card-warm hero-mesh flex flex-col h-[700px] shadow-2xl overflow-hidden max-w-4xl mx-auto w-full rounded-[24px] animate-fade-up">
          <div className="bg-surface/60 backdrop-blur-md border-b border-border/50 px-6 py-4 flex items-center gap-4 z-10">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl gradient-maroon shadow-md border border-accent/20 glow-maroon">
              <Sparkles className="h-5 w-5 text-accent animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-syne tracking-wide gradient-text-gold">Teaching Assistant AI</h3>
              <p className="text-[11px] section-label mt-0.5">Class-level patterns & strategies</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-transparent z-10 text-[13px] hide-scrollbar">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} animate-fade-up`} style={{ animationFillMode: "both" }}>
                <div className={`max-w-[80%] px-5 py-3.5 text-[13px] leading-relaxed shadow-sm ${
                  m.role === "user" ? "bubble-user" : "bubble-ai"
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start animate-fade-up">
                <div className="bubble-ai px-5 py-4 rounded-xl flex items-center gap-2 shadow-sm">
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendChat} className="p-4 bg-surface-warm/80 backdrop-blur-md border-t border-border/50 flex gap-3 z-10 shadow-[0_-10px_40px_rgba(0,0,0,0.2)]">
            <input 
              type="text" 
              value={chatInput} 
              onChange={e => setChatInput(e.target.value)} 
              disabled={isTyping} 
              placeholder="Ask for strategy tips..." 
              className="flex-1 input-warm w-full text-[13px] px-5 shadow-inner" 
            />
            <button type="submit" disabled={!chatInput.trim() || isTyping} className="btn-primary h-auto px-6 font-medium tracking-wide flex items-center justify-center gap-2 transition-all">
              <Send className="h-[18px] w-[18px]" />
            </button>
          </form>
        </div>
        )}
        
      </div>

      {/* MODALS */}
      <Dialog open={avgModalOpen} onOpenChange={setAvgModalOpen}>
        <DialogContent className="sm:max-w-[400px] border-border/50 bg-surface-warm shadow-2xl p-6">
          <DialogHeader><DialogTitle className="text-xl font-bold font-syne tracking-wide text-blue-400">Class Average IAT</DialogTitle></DialogHeader>
          <div className="py-4 text-center text-muted-foreground">
             <p className="text-3xl font-mono font-bold text-foreground mb-2">{avgIat}/100</p>
             <p className="text-[13px] leading-relaxed">The average Internal Assessment Test score across all students in your class.</p>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={belowPassModalOpen} onOpenChange={setBelowPassModalOpen}>
        <DialogContent className="sm:max-w-[400px] border-border/50 bg-surface-warm shadow-2xl p-6">
          <DialogHeader><DialogTitle className="text-xl font-bold font-syne tracking-wide text-chart-critical">Below Pass Marking</DialogTitle></DialogHeader>
          <div className="py-4 text-center text-muted-foreground">
             <p className="text-3xl font-mono font-bold text-chart-critical mb-2">{belowPass}</p>
             <p className="text-[13px] leading-relaxed">Number of students currently scoring below 50% in combined IATs.</p>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={attendanceModalOpen} onOpenChange={setAttendanceModalOpen}>
        <DialogContent className="sm:max-w-[400px] border-border/50 bg-surface-warm shadow-2xl p-6">
          <DialogHeader><DialogTitle className="text-xl font-bold font-syne tracking-wide text-orange-400">Class Avg Attendance</DialogTitle></DialogHeader>
          <div className="py-4 text-center text-muted-foreground">
             <p className="text-3xl font-mono font-bold text-foreground mb-2">{avgAtt}%</p>
             <p className="text-[13px] leading-relaxed">Class wide attendance average currently tracked.</p>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={interventionModalOpen} onOpenChange={setInterventionModalOpen}>
        <DialogContent className="sm:max-w-[400px] border-border/50 bg-surface-warm shadow-2xl p-6">
          <DialogHeader><DialogTitle className="text-xl font-bold font-syne tracking-wide text-chart-observation">Need Intervention</DialogTitle></DialogHeader>
          <div className="py-4 text-center text-muted-foreground">
             <p className="text-3xl font-mono font-bold text-chart-observation mb-2">{interventionNeeded}</p>
             <p className="text-[13px] leading-relaxed">Students flagged by CampusIQ as requiring mentor or teacher support.</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* FLOATING ACTION BUTTON */}
      <div className="fixed bottom-6 right-6 z-50">
        {fabOpen && (
           <>
            <div className="fixed inset-0 bg-background/20 backdrop-blur-sm z-40" onClick={() => setFabOpen(false)} />
            <div className="absolute bottom-16 right-0 z-50 flex flex-col gap-3 mb-2 items-end animate-in slide-in-from-bottom-5">
              <button onClick={() => { toast.success("Class report exported to Excel"); setFabOpen(false); }} className="flex items-center gap-3 bg-card border border-blue-500/30 text-blue-500 hover:bg-blue-500/10 px-4 py-2.5 rounded-full shadow-lg transition-colors group whitespace-nowrap">
                <span className="text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0">Download Class Report</span>
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
