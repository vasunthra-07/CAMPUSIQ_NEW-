import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { askClaude } from "@/utils/claudeAI";
import { PageHeader, WorkspacePanel, QuickActionBar } from "@/components/workspace";
import { Brain, Send, Sparkles, RotateCcw, Zap, Lightbulb, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

const QUICK_PROMPTS = [
  "What is the Campus Pulse Score?",
  "Which students are at highest risk?",
  "Show intervention recommendations",
  "Summarize today's operational alerts",
  "Optimize resource utilization",
];

const CAPABILITIES = [
  { icon: MessageSquare, label: "Natural Language Actions" },
  { icon: Lightbulb, label: "Recommendations" },
  { icon: Zap, label: "Campus Insights" },
  { icon: Brain, label: "Context Awareness" },
];

interface Message { role: "assistant" | "user"; content: string; }

export default function AIAssistant() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `Welcome, ${user?.name?.split(" ")[0] ?? "there"}. I'm Campus Copilot — your AI operations partner. I understand campus data, student analytics, and operational workflows. What would you like to accomplish?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isTyping]);

  const sendMessage = async (text?: string) => {
    const msg = text ?? input.trim();
    if (!msg || isTyping) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: msg }]);
    setIsTyping(true);

    const systemPrompt = `You are Campus Copilot, the flagship AI for CampusIQ — a Smart Campus Operating System. You help with natural language actions, recommendations, campus insights, and context-aware operations. You understand Campus Pulse Score (30% attendance, 25% IAT, 20% LMS, 15% model exam, 10% co-curricular), all operational modules, and intervention strategies. Be concise (under 120 words), professional, and actionable. User: ${user?.name}, Role: ${user?.role}.`;

    const response = await askClaude(systemPrompt, msg);
    setMessages(prev => [...prev, { role: "assistant", content: response }]);
    setIsTyping(false);
  };

  const reset = () =>
    setMessages([{ role: "assistant", content: `Session reset. How can Campus Copilot assist you, ${user?.name?.split(" ")[0]}?` }]);

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        eyebrow="AI Operations"
        title="Campus Copilot"
        description="Natural language actions, recommendations, and context-aware campus intelligence"
        actions={
          <button onClick={reset} className="btn-secondary px-3 py-2 text-sm rounded-lg flex items-center gap-2">
            <RotateCcw className="h-4 w-4" /> Reset
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {CAPABILITIES.map((cap, i) => (
          <motion.div
            key={cap.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
            className="workspace-panel flex items-center gap-3 p-4"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <cap.icon className="h-4 w-4" />
            </div>
            <span className="text-xs font-medium text-foreground">{cap.label}</span>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <WorkspacePanel title="Conversation" description="Ask anything about campus operations" icon={Brain} noPadding delay={0.15}>
            <div className="flex flex-col h-[520px]">
              <div className="flex gap-2 px-4 py-2 border-b border-border overflow-x-auto">
                {QUICK_PROMPTS.map(p => (
                  <button
                    key={p}
                    onClick={() => sendMessage(p)}
                    className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
                  >
                    <Sparkles className="inline h-3 w-3 mr-1" />{p}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                <AnimatePresence initial={false}>
                  {messages.map((m, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                      className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
                    >
                      <div className={cn("max-w-[85%] px-4 py-3 text-sm leading-relaxed", m.role === "user" ? "bubble-user" : "bubble-ai")}>
                        {m.content}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bubble-ai px-4 py-3 flex items-center gap-1.5">
                      <div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" />
                    </div>
                  </div>
                )}
                <div ref={endRef} />
              </div>

              <form onSubmit={e => { e.preventDefault(); sendMessage(); }} className="p-3 border-t border-border flex gap-2">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Ask Campus Copilot…"
                  disabled={isTyping}
                  className="flex-1 input-warm px-4 py-2.5 text-sm"
                />
                <button type="submit" disabled={!input.trim() || isTyping} className="btn-primary px-4 py-2.5 flex items-center gap-2 text-sm rounded-lg">
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </WorkspacePanel>
        </div>

        <WorkspacePanel title="Quick Actions" description="Common operations" icon={Zap} delay={0.2}>
          <QuickActionBar actions={[
            { id: "risk", label: "Risk Report", icon: Brain, onClick: () => sendMessage("Generate a student risk summary") },
            { id: "resources", label: "Resource Status", icon: Sparkles, onClick: () => sendMessage("What resources are over-utilized?") },
            { id: "events", label: "Event Summary", icon: MessageSquare, onClick: () => sendMessage("Summarize upcoming events") },
            { id: "insights", label: "Campus Insights", icon: Lightbulb, onClick: () => sendMessage("Give me today's campus insights") },
          ]} />
          <div className="mt-4 rounded-lg border border-border bg-muted/30 p-4">
            <p className="text-xs font-medium text-muted-foreground mb-2">Context</p>
            <p className="text-sm text-foreground">{user?.name}</p>
            <p className="text-xs text-muted-foreground">{user?.role} · CampusIQ OS</p>
          </div>
        </WorkspacePanel>
      </div>
    </div>
  );
}
