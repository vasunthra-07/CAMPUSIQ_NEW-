import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { students } from "@/data/students";
import { analyzeStudent } from "@/utils/CampusIQAI";
import { Shield, Brain, Cpu, Send, CheckCircle, Clock, AlertTriangle, BookOpen, Plus, Search, Filter, Phone, Mail, MoreVertical, X, Users } from "lucide-react";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { askClaude } from "@/utils/claudeAI";

export default function MentorView({ activePage = "dashboard" }: { activePage?: string }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("All Mentees");
  const [selectedStudent, setSelectedStudent] = useState(students[0]);

  useEffect(() => {
    setActiveTab("All Mentees");
  }, [activePage]);
  const [searchQuery, setSearchQuery] = useState("");
  const [fabOpen, setFabOpen] = useState(false);
  const [studentNotes, setStudentNotes] = useState<Record<string, string>>({});

  const stats = [
    { id: "total", label: "Total Mentees", val: students.length },
    { id: "critical", label: "Critical Priority", val: students.filter(s => s.status === "Critical").length },
    { id: "active", label: "Interventions Active", val: students.filter(s => s.interventionStatus === "Active").length },
    { id: "resolved", label: "Resolved Cases", val: students.filter(s => s.interventionStatus === "Resolved").length },
  ];

  const [totalModalOpen, setTotalModalOpen] = useState(false);
  const [criticalModalOpen, setCriticalModalOpen] = useState(false);
  const [activeModalOpen, setActiveModalOpen] = useState(false);
  const [resolvedModalOpen, setResolvedModalOpen] = useState(false);

  const handleKpiClick = (id: string) => {
    if (id === "total") setTotalModalOpen(true);
    if (id === "critical") setCriticalModalOpen(true);
    if (id === "active") setActiveModalOpen(true);
    if (id === "resolved") setResolvedModalOpen(true);
  };

  const filtered = students.filter(s => {
    const matchesTab = 
      activeTab === "All Mentees" ? true :
      activeTab === "Critical" ? s.status === "Critical" :
      activeTab === "Intervention Active" ? s.interventionStatus === "Active" :
      s.interventionStatus === "Resolved";
      
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesTab && matchesSearch;
  });

  const [oracleResult, setOracleResult] = useState("");
  const [oracleLoading, setOracleLoading] = useState(false);

  const handleOracleAnalyze = async (studentId: string) => {
    setOracleLoading(true);
    const st = students.find(s => s.id === studentId)!;
    const prompt = `You are CampusIQ's Dropout Oracle AI. Analyze student ${st.name} (Att: ${st.attendance}%, IAT: ${st.iat1+st.iat2}/100, CampusIQ: ${st.pulseScore}/100, Drift: ${st.driftType}). Generate: 1) Dropout probability %, 2) 3 Root causes, 3) 4-Week Plan, 4) What NOT to do, 5) Exact opening line to say to them.`;
    const res = await askClaude(prompt, "Please run Critical Risk oracle analysis.");
    setOracleResult(res);
    setOracleLoading(false);
  };

  /* Assistant Chat State */
  const [messages, setMessages] = useState<{role: "assistant"|"user", content: string}[]>([
    { role: "assistant", content: `${user?.name.split(" ")[0]}, you have ${stats[1].val} critical students this week. How can I help you plan today's interventions?` }
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

    const systemPrompt = `You are CampusIQ, an AI intervention specialist for mentor ${user?.name}. You know all mentee data. Give specific, actionable intervention advice. Under 150 words.`;
    const response = await askClaude(systemPrompt, userMessage);
    setMessages(prev => [...prev, { role: "assistant", content: response }]);
    setIsTyping(false);
  };

  return (
    <div className="space-y-6">
      
      {/* KPI Strip */}
      {activePage !== "chat" && activePage !== "oracle" && (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-up">
        {stats.map((s, idx) => (
          <div key={s.id} onClick={() => handleKpiClick(s.id)} className="card-warm card-glow-hover p-5 border-border/50 shadow-md cursor-pointer transition-all hover:-translate-y-1" style={{ animationDelay: `${idx * 0.1}s`, animationFillMode: "both" }}>
            <p className="text-[11px] font-bold section-label">{s.label}</p>
            <p className="text-3xl font-bold font-mono mt-2 gradient-text-gold">{s.val}</p>
          </div>
        ))}
      </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Left Side: Mentees & Oracle */}
        <div className="lg:col-span-3 space-y-6">
          {activePage === "mentees" && (
          <div className="card-warm overflow-hidden animate-fade-up shadow-xl border-border/50 z-10 relative">
            <div className="border-b border-border/50 p-4 bg-surface-warm/50 flex flex-col gap-5">
              <div className="flex gap-2 overflow-x-auto hide-scrollbar">
                {["All Mentees", "Critical", "Intervention Active", "Resolved"].map(t => (
                  <button key={t} onClick={() => setActiveTab(t)} className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${activeTab === t ? "nav-active btn-primary shadow-sm" : "btn-ghost text-muted-foreground"}`}>
                    {t}
                  </button>
                ))}
              </div>
              
              <div className="relative shadow-inner">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="Search mentees by name or ID..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full input-warm pl-10 pr-4 py-3 text-sm focus:border-accent"
                />
              </div>
            </div>
            
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto custom-scrollbar">
              {filtered.map(s => {
                const ai = analyzeStudent(s);
                return (
                  <div key={s.id} className={`rounded-xl border border-border/50 bg-surface/50 p-4 card-glow-hover shadow-sm relative flex flex-col justify-between transition-all ${s.status === "Critical" ? "card-critical-glow bg-red-500/5 hover:bg-red-500/10" : s.status === "Safe" ? "shadow-[0_0_15px_rgba(74,222,128,0.1)] border-chart-safe/30 hover:bg-chart-safe/5" : ""}`}>
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1 cursor-pointer group" onClick={() => { setSelectedStudent(s); handleOracleAnalyze(s.id); }}>
                          <p className="font-bold text-foreground group-hover:text-accent transition-colors font-syne tracking-wide">{s.name}</p>
                          <p className="text-[10px] section-label mt-1">{s.id}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className={`px-2.5 py-1 rounded-md shadow-sm text-[10px] font-bold tracking-wider ${s.status === "Critical" ? "badge-critical" : s.status === "Safe" ? "badge-safe" : "badge-observation"}`}>
                            {s.status}
                          </span>
                          <DropdownMenu>
                            <DropdownMenuTrigger className="text-muted-foreground hover:text-foreground focus:outline-none">
                              <MoreVertical className="h-4 w-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-card border-border min-w-[150px]">
                              <DropdownMenuItem onClick={() => toast.success(`Peer Bridge activated for ${s.name}`)} className="text-xs cursor-pointer focus:bg-surface focus:text-accent">
                                Assign Peer Mentor
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toast.success("Intervention plan generated and saved.")} className="text-xs cursor-pointer focus:bg-surface focus:text-accent">
                                Auto-Gen Intervention
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-border" />
                              <DropdownMenuItem onClick={() => toast.success(`${s.name} escalated to HOD.`)} className="text-xs cursor-pointer text-red-400 focus:bg-red-500/10 focus:text-red-500">
                                Escalate to HOD
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-4 mb-4 cursor-pointer" onClick={() => { setSelectedStudent(s); handleOracleAnalyze(s.id); }}>
                        <div className="bg-background border border-border/50 hover:border-accent/30 transition-colors rounded-lg p-2 text-center shadow-sm">
                          <p className="text-[9px] section-label uppercase">Att</p>
                          <p className={`text-sm font-mono font-bold mt-1 ${s.attendance < 75 ? "text-chart-critical" : "text-foreground"}`}>{s.attendance}%</p>
                        </div>
                        <div className="bg-background border border-border/50 hover:border-accent/30 transition-colors rounded-lg p-2 text-center shadow-sm">
                          <p className="text-[9px] section-label uppercase">IAT</p>
                          <p className={`text-sm font-mono font-bold mt-1 ${(s.iat1+s.iat2) < 50 ? "text-orange-400" : "text-foreground"}`}>{s.iat1+s.iat2}</p>
                        </div>
                        <div 
                          className="bg-background border-2 hover:border-accent/80 transition-colors rounded-full aspect-square flex flex-col items-center justify-center relative shadow-sm w-[52px] h-[52px] mx-auto" 
                          style={{ borderColor: s.pulseScore >= 75 ? 'hsl(142 71% 45%)' : s.pulseScore >= 50 ? 'hsl(25 95% 53%)' : 'hsl(0 72% 51%)' }}
                        >
                          <p className="text-[8px] section-label mb-0.5 leading-none">Score</p>
                          <p className={`text-sm font-mono font-bold leading-none ${s.pulseScore >= 75 ? "text-chart-safe" : s.pulseScore >= 50 ? "text-chart-observation" : "text-chart-critical"}`}>{s.pulseScore}</p>
                        </div>
                      </div>
                      <p className="text-[11px] text-muted-foreground italic line-clamp-2 border-l-2 border-accent/70 pl-3 py-1 mb-2">
                        {ai.recommendation}
                      </p>
                      
                      {studentNotes[s.id] && (
                        <div className="bg-yellow-500/10 border border-yellow-500/20 p-2 rounded mb-2 flex justify-between items-start group">
                          <p className="text-[10px] text-yellow-500 flex-1">{studentNotes[s.id]}</p>
                          <button onClick={() => {
                            const newNotes = {...studentNotes};
                            delete newNotes[s.id];
                            setStudentNotes(newNotes);
                          }} className="text-yellow-500/50 hover:text-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-2 flex gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="flex-1 btn-secondary py-1.5 rounded-lg text-[11px] font-bold tracking-wide transition-all shadow-sm">
                            Quick Note
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-3 bg-card border-border">
                          <h4 className="text-xs font-bold mb-2">Add Note for {s.name}</h4>
                          <textarea 
                            className="w-full bg-background border border-border rounded text-xs p-2 focus:outline-none focus:border-accent min-h-[60px]"
                            placeholder="Add intervention details..."
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                const val = e.currentTarget.value.trim();
                                if (val) {
                                  setStudentNotes(prev => ({...prev, [s.id]: val}));
                                  toast.success("Note saved");
                                  // Close popover logic would go here in a real app, utilizing Radix UI controlled state
                                }
                              }
                            }}
                          />
                          <p className="text-[9px] text-muted-foreground text-right mt-1">Press Enter to save</p>
                        </PopoverContent>
                      </Popover>
                      
                      {s.status === "Critical" && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <button className="flex-1 shrink-0 bg-gradient-to-r from-red-600 to-red-500 text-white shadow-[0_4px_10px_rgba(239,68,68,0.4)] hover:shadow-[0_0_20px_rgba(239,68,68,0.6)] px-2 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 hover:scale-[1.02] active:scale-95">
                              <AlertTriangle className="h-3 w-3" /> Parent Alert
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-64 p-0 bg-card border-border overflow-hidden">
                            <div className="bg-red-500/10 p-3 border-b border-border">
                              <h4 className="text-xs font-bold text-red-400">Initiate Parent Contact</h4>
                              <p className="text-[10px] text-muted-foreground mt-1">Reason: Critical Risk Flag (Week 4)</p>
                            </div>
                            <div className="p-2 flex flex-col gap-1">
                              <button onClick={() => toast.success(`SMS Dispatched to ${s.name}'s parent.`)} className="flex items-center gap-2 p-2 hover:bg-surface rounded text-xs text-foreground transition-colors w-full text-left">
                                <Phone className="h-3 w-3 text-muted-foreground" /> Automated SMS Alert
                              </button>
                              <button onClick={() => toast.success(`Official Email sent to ${s.name}'s parent.`)} className="flex items-center gap-2 p-2 hover:bg-surface rounded text-xs text-foreground transition-colors w-full text-left">
                                <Mail className="h-3 w-3 text-muted-foreground" /> Automated Email
                              </button>
                              <button onClick={() => toast("Logged manual call attempt.")} className="flex items-center gap-2 p-2 hover:bg-surface rounded text-xs text-foreground transition-colors w-full text-left">
                                <Phone className="h-3 w-3 text-blue-400" /> Log Manual Call
                              </button>
                            </div>
                          </PopoverContent>
                        </Popover>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          )}

          {/* Dropout Oracle Panel */}
          {activePage === "oracle" && (
          <div className="card-warm p-8 overflow-hidden relative min-h-[500px] animate-fade-up z-10 border border-accent/20">
            <Cpu className="absolute -right-6 -bottom-6 h-48 w-48 text-accent/10 animate-float" />
            <h3 className="text-xl font-bold gradient-text-gold font-syne flex items-center gap-3 mb-6"><Cpu className="h-6 w-6 text-accent" /> Dropout Oracle AI Analysis</h3>
            <p className="text-sm font-medium mb-6">Currently analyzing: <strong className="text-accent tracking-wide">{selectedStudent.name}</strong></p>
            
            {oracleLoading ? (
              <div className="space-y-4 max-w-lg">
                <div className="h-4 bg-accent/20 rounded w-full animate-pulse"></div>
                <div className="h-4 bg-accent/20 rounded w-3/4 animate-pulse" style={{ animationDelay: "0.2s" }}></div>
                <div className="h-4 bg-accent/20 rounded w-5/6 animate-pulse" style={{ animationDelay: "0.4s" }}></div>
              </div>
            ) : oracleResult ? (
              <div className="input-warm border border-accent/20 p-5 rounded-2xl text-[13px] text-foreground whitespace-pre-wrap leading-relaxed shadow-inner">
                {oracleResult}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground italic mt-10 p-6 border border-dashed border-accent/30 rounded-2xl bg-surface-warm/50 text-center shadow-inner">Select a student from the Dashboard list to generate an oracle analysis. Since you are in the standalone Oracle view, it is displaying the last selected mentee ({selectedStudent.name}).</div>
            )}
          </div>
          )}
        </div>

        {/* Mentor CampusIQ Chat (Ask CampusIQ Assistant) */}
        {activePage === "chat" && (
        <div className="lg:col-span-3 space-y-6 animate-fade-up">
          <div className="card-warm hero-mesh flex flex-col h-[700px] shadow-2xl overflow-hidden max-w-4xl mx-auto w-full rounded-[24px]">
            <div className="bg-surface/60 backdrop-blur-md border-b border-border/50 px-6 py-4 flex items-center gap-4 z-10">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl gradient-maroon shadow-md border border-accent/20 glow-maroon">
                <Brain className="h-5 w-5 text-accent animate-CampusIQ-beat" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-syne tracking-wide gradient-text-gold">Mentor Assistant</h3>
                <p className="text-[11px] section-label mt-0.5" >Intervention Specialist AI</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-transparent z-10 text-[13px] hide-scrollbar">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} animate-fade-up`} style={{ animationFillMode: "both" }}>
                  <div className={`max-w-[80%] px-5 py-3.5 text-sm leading-relaxed shadow-sm ${
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
              <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} disabled={isTyping} placeholder="Ask about interventions..." className="flex-1 input-warm w-full text-[13px] px-5 shadow-inner" />
              <button type="submit" disabled={!chatInput.trim() || isTyping} className="btn-primary h-auto px-6 font-medium tracking-wide flex items-center justify-center gap-2 transition-all">
                <Send className="h-[18px] w-[18px]" />
              </button>
            </form>
          </div>
        </div>
        )}

        {/* Intervention Log (Interventions Page only) */}
        {activePage === "plans" && (
        <div className="lg:col-span-3 space-y-6 animate-fade-up">
          <div className="card-warm p-6 card-glow-hover">
            <h3 className="text-xl font-bold font-syne mb-6 flex items-center gap-3 tracking-wide"><Clock className="h-6 w-6 text-accent" /> Recent Interventions</h3>
            <div className="space-y-4">
              {students.filter(s => s.interventionStatus !== "None").slice(0, 5).map((s, idx) => (
                <div key={s.id} className="text-[13px] px-5 py-4 rounded-xl border border-border/50 bg-surface-warm flex justify-between items-center transition-all hover:-translate-y-0.5 shadow-sm hover:shadow-md cursor-pointer group" style={{ animationDelay: `${idx * 0.1}s`, animationFillMode: "both" }}>
                  <div>
                    <p className="font-bold text-foreground group-hover:text-accent transition-colors tracking-wide font-syne">{s.name}</p>
                    <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest">{analyzeStudent(s).interventionType}</p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1.5">
                    <span className={`px-2.5 py-1 rounded-md shadow-sm text-[10px] font-bold tracking-wider ${s.interventionStatus === "Active" ? "badge-observation" : s.interventionStatus === "Pending" ? "badge-critical" : "badge-safe"}`}>
                      {s.interventionStatus}
                    </span>
                    <p className="text-[9px] section-label">Wk {s.weekTriggered}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        )}

        {/* Peer Bridge */}
        {activePage === "peerbridge" && (
        <div className="lg:col-span-3 space-y-6 animate-fade-up">
          <div className="card-warm p-6 border-border/50 shadow-xl">
            <div className="flex items-center gap-4 mb-6 border-b border-border/50 pb-5">
              <div className="h-10 w-10 rounded-xl gradient-maroon flex items-center justify-center glow-maroon shadow-md">
                <Users className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h2 className="text-xl font-bold font-syne tracking-wide gradient-text-gold">Peer Bridge</h2>
                <p className="text-[11px] section-label mt-0.5">AI-suggested peer pairings for collaborative learning</p>
              </div>
            </div>

            {/* Summary KPIs */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: "Active Pairs", val: "8", color: "text-chart-safe" },
                { label: "Study Sessions", val: "14", color: "text-blue-400" },
                { label: "Avg Improvement", val: "+12%", color: "text-chart-observation" },
              ].map((k, i) => (
                <div key={i} className="p-4 rounded-xl bg-surface-warm border border-border/50 text-center">
                  <p className="text-[10px] section-label font-bold mb-1">{k.label}</p>
                  <p className={`text-3xl font-mono font-bold ${k.color}`}>{k.val}</p>
                </div>
              ))}
            </div>

            {/* Peer Pairings */}
            <h3 className="text-[11px] font-bold section-label tracking-widest mb-4">CampusIQ-Suggested Peer Pairs</h3>
            <div className="space-y-3">
              {[
                { mentor: "Sanjay R.", mentee: "Priya D.", reason: "Strong IAT performer paired with below-pass student. Same department.", tag: "Academic Support", tagColor: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
                { mentor: "Karthik S.", mentee: "Arun Kumar", reason: "Top attendance with peer who has 68.5%. Can motivate regularity.", tag: "Attendance Boost", tagColor: "text-chart-safe bg-chart-safe/10 border-chart-safe/20" },
                { mentor: "Rahul G.", mentee: "Meera J.", reason: "High model exam scorer paired with low model exam achiever.", tag: "Exam Strategy", tagColor: "text-chart-observation bg-chart-observation/10 border-chart-observation/20" },
                { mentor: "Deepak V.", mentee: "Anitha B.", reason: "Both at-risk — mutual accountability pair with weekly check-ins.", tag: "Accountability", tagColor: "text-purple-400 bg-purple-400/10 border-purple-400/20" },
              ].map((pair, i) => (
                <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-surface-warm/50 border border-border/50 hover:border-accent/30 transition-all">
                  <div className="flex items-center gap-2 min-w-[200px]">
                    <div className="h-8 w-8 rounded-full gradient-maroon flex items-center justify-center shadow-sm flex-shrink-0">
                      <span className="text-[10px] font-bold text-accent">{pair.mentor.split(" ")[0][0]}{pair.mentor.split(" ")[1]?.[0]}</span>
                    </div>
                    <div>
                      <p className="text-[12px] font-bold font-syne">{pair.mentor}</p>
                      <p className="text-[9px] section-label">Peer Mentor</p>
                    </div>
                    <div className="mx-2 text-accent/50 font-bold">→</div>
                    <div>
                      <p className="text-[12px] font-bold font-syne">{pair.mentee}</p>
                      <p className="text-[9px] section-label">Peer Mentee</p>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{pair.reason}</p>
                  </div>
                  <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full border flex-shrink-0 ${pair.tagColor}`}>{pair.tag}</span>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-4 border-t border-border/50 flex justify-end gap-3">
              <button onClick={() => toast.success("Pair groups notified via email!")} className="btn-primary text-[11px] font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-md glow-maroon">
                Notify All Pairs
              </button>
            </div>
          </div>
        </div>
        )}


      </div>

      {/* FLOATING ACTION BUTTON */}
      <div className="fixed bottom-6 right-6 z-50">
        {fabOpen && (
           <>
            <div className="fixed inset-0 bg-background/20 backdrop-blur-sm z-40" onClick={() => setFabOpen(false)} />
            <div className="absolute bottom-16 right-0 z-50 flex flex-col gap-3 mb-2 items-end animate-in slide-in-from-bottom-5">
              <button 
                onClick={() => { toast.success("Automated check-in emails dispatched to all mentees."); setFabOpen(false); }} 
                className="flex items-center gap-3 bg-card border border-blue-500/30 text-blue-500 hover:bg-blue-500/10 px-4 py-2.5 rounded-full shadow-lg transition-colors group"
              >
                <span className="text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 whitespace-nowrap">Mass Check-in Ping</span>
                <Mail className="h-5 w-5 shrink-0" />
              </button>
              <button 
                onClick={() => { toast.success("Intervention Log exported successfully."); setFabOpen(false); }} 
                className="flex items-center gap-3 bg-card border border-accent/40 text-accent hover:bg-accent/10 px-4 py-2.5 rounded-full shadow-lg transition-colors group"
              >
                <span className="text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 whitespace-nowrap">Export Log</span>
                <BookOpen className="h-5 w-5 shrink-0" />
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
      {/* MODALS */}
      <Dialog open={totalModalOpen} onOpenChange={setTotalModalOpen}>
        <DialogContent className="sm:max-w-[400px] border-border/50 bg-surface-warm shadow-2xl p-6">
          <DialogHeader><DialogTitle className="text-xl font-bold font-syne tracking-wide gradient-text-gold">Total Mentees</DialogTitle></DialogHeader>
          <div className="py-4 text-center text-muted-foreground">
             <p className="text-3xl font-mono font-bold text-foreground mb-2">{stats[0].val}</p>
             <p className="text-[13px] leading-relaxed">Active mentees assigned to you for this semester.</p>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={criticalModalOpen} onOpenChange={setCriticalModalOpen}>
        <DialogContent className="sm:max-w-[400px] border-border/50 bg-surface-warm shadow-2xl p-6">
          <DialogHeader><DialogTitle className="text-xl font-bold font-syne tracking-wide text-chart-critical">Critical Priority</DialogTitle></DialogHeader>
          <div className="py-4 text-center text-muted-foreground">
             <p className="text-3xl font-mono font-bold text-chart-critical mb-2">{stats[1].val}</p>
             <p className="text-[13px] leading-relaxed">Students requiring immediate parent outreach and HOD escalation.</p>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={activeModalOpen} onOpenChange={setActiveModalOpen}>
        <DialogContent className="sm:max-w-[400px] border-border/50 bg-surface-warm shadow-2xl p-6">
          <DialogHeader><DialogTitle className="text-xl font-bold font-syne tracking-wide gradient-text-gold">Active Interventions</DialogTitle></DialogHeader>
          <div className="py-4 text-center text-muted-foreground">
             <p className="text-3xl font-mono font-bold text-foreground mb-2">{stats[2].val}</p>
             <p className="text-[13px] leading-relaxed">Mentees currently undergoing academic recovery programs.</p>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={resolvedModalOpen} onOpenChange={setResolvedModalOpen}>
        <DialogContent className="sm:max-w-[400px] border-border/50 bg-surface-warm shadow-2xl p-6">
          <DialogHeader><DialogTitle className="text-xl font-bold font-syne tracking-wide text-chart-safe">Resolved Cases</DialogTitle></DialogHeader>
          <div className="py-4 text-center text-muted-foreground">
             <p className="text-3xl font-mono font-bold text-chart-safe mb-2">{stats[3].val}</p>
             <p className="text-[13px] leading-relaxed">Successful interventions resulting in student re-engagement.</p>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
