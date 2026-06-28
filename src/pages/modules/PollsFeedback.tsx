import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart2, CheckCircle2, Clock, Users, Send, ChevronRight,
  MessageSquare, Star, TrendingUp, Lock
} from "lucide-react";

type PollStatus = "active" | "closed";
type Tab = "polls" | "feedback";

interface PollOption {
  id: string;
  label: string;
  votes: number;
}

interface Poll {
  id: string;
  question: string;
  category: string;
  status: PollStatus;
  totalVotes: number;
  endsIn?: string;
  closedOn?: string;
  options: PollOption[];
}

const POLLS: Poll[] = [
  {
    id: "p1",
    question: "How would you rate the quality of campus Wi-Fi coverage?",
    category: "Infrastructure",
    status: "active",
    totalVotes: 312,
    endsIn: "2 days",
    options: [
      { id: "a", label: "Excellent", votes: 54 },
      { id: "b", label: "Good", votes: 112 },
      { id: "c", label: "Average", votes: 98 },
      { id: "d", label: "Poor", votes: 48 },
    ],
  },
  {
    id: "p2",
    question: "Which elective should be added to the Semester V curriculum?",
    category: "Academic",
    status: "active",
    totalVotes: 478,
    endsIn: "5 days",
    options: [
      { id: "a", label: "Machine Learning Fundamentals", votes: 192 },
      { id: "b", label: "Entrepreneurship & Startups", votes: 148 },
      { id: "c", label: "Digital Marketing", votes: 84 },
      { id: "d", label: "Environmental Studies", votes: 54 },
    ],
  },
  {
    id: "p3",
    question: "What is your preferred timing for evening extracurricular activities?",
    category: "Campus Life",
    status: "active",
    totalVotes: 204,
    endsIn: "1 day",
    options: [
      { id: "a", label: "4:00 PM – 5:30 PM", votes: 88 },
      { id: "b", label: "5:30 PM – 7:00 PM", votes: 72 },
      { id: "c", label: "7:00 PM – 8:30 PM", votes: 44 },
    ],
  },
  {
    id: "p4",
    question: "Are you satisfied with the current library operating hours?",
    category: "Services",
    status: "closed",
    totalVotes: 621,
    closedOn: "20 Jun 2026",
    options: [
      { id: "a", label: "Yes, they work well", votes: 285 },
      { id: "b", label: "Needs extended evening hours", votes: 218 },
      { id: "c", label: "Needs weekend hours", votes: 118 },
    ],
  },
  {
    id: "p5",
    question: "How satisfied are you with the campus canteen food quality?",
    category: "Services",
    status: "closed",
    totalVotes: 543,
    closedOn: "15 Jun 2026",
    options: [
      { id: "a", label: "Very satisfied", votes: 102 },
      { id: "b", label: "Satisfied", votes: 198 },
      { id: "c", label: "Neutral", votes: 154 },
      { id: "d", label: "Dissatisfied", votes: 89 },
    ],
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  Infrastructure: "bg-blue-50 border-blue-200 text-blue-700",
  Academic: "bg-violet-50 border-violet-200 text-violet-700",
  "Campus Life": "bg-amber-50 border-amber-200 text-amber-700",
  Services: "bg-emerald-50 border-emerald-200 text-emerald-700",
};

const FEEDBACK_AREAS = [
  "Academic Quality", "Campus Facilities", "Canteen & Food",
  "Hostel & Accommodation", "Transport", "Library", "Sports & Recreation",
  "Administration", "Safety & Security", "Other",
];

export default function PollsFeedback() {
  const [tab, setTab] = useState<Tab>("polls");
  const [voted, setVoted] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [feedbackArea, setFeedbackArea] = useState(FEEDBACK_AREAS[0]);
  const [feedbackText, setFeedbackText] = useState("");
  const [rating, setRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const activePolls = POLLS.filter(p => p.status === "active");
  const closedPolls = POLLS.filter(p => p.status === "closed");

  const handleVote = (pollId: string) => {
    if (!selected[pollId]) return;
    setVoted(v => ({ ...v, [pollId]: selected[pollId] }));
  };

  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFeedbackText("");
      setRating(0);
    }, 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <BarChart2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">Polls & Feedback</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {activePolls.length} active polls · Share your voice
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl border border-border bg-muted/40 p-1 gap-1">
          {(["polls", "feedback"] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium capitalize transition-all ${
                tab === t
                  ? "bg-surface text-foreground shadow-sm border border-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "polls" ? "Polls" : "Give Feedback"}
            </button>
          ))}
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {tab === "polls" ? (
          <motion.div
            key="polls"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            {/* Active polls */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">Active Polls</h2>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                  {activePolls.length}
                </span>
              </div>
              {activePolls.map((poll, i) => (
                <PollCard
                  key={poll.id}
                  poll={poll}
                  index={i}
                  votedOption={voted[poll.id]}
                  selectedOption={selected[poll.id]}
                  onSelect={optId => !voted[poll.id] && setSelected(s => ({ ...s, [poll.id]: optId }))}
                  onVote={() => handleVote(poll.id)}
                />
              ))}
            </div>

            {/* Closed polls */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-muted-foreground">Closed Polls</h2>
              </div>
              {closedPolls.map((poll, i) => (
                <PollCard
                  key={poll.id}
                  poll={poll}
                  index={i}
                  votedOption={undefined}
                  selectedOption={undefined}
                  onSelect={() => {}}
                  onVote={() => {}}
                />
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="feedback"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="max-w-2xl"
          >
            <div className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">
              <div className="border-b border-border px-6 py-5">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">Submit Feedback</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Your feedback is anonymous and reviewed by administration</p>
                  </div>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {submitted ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center"
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 border border-emerald-200">
                      <CheckCircle2 className="h-7 w-7 text-emerald-600" />
                    </div>
                    <p className="text-base font-semibold text-foreground">Feedback submitted!</p>
                    <p className="text-sm text-muted-foreground">Thank you — your input helps improve campus life.</p>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onSubmit={handleSubmitFeedback}
                    className="p-6 space-y-5"
                  >
                    {/* Area */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">Area of Feedback</label>
                      <select
                        value={feedbackArea}
                        onChange={e => setFeedbackArea(e.target.value)}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10 transition-colors"
                      >
                        {FEEDBACK_AREAS.map(a => (
                          <option key={a} value={a}>{a}</option>
                        ))}
                      </select>
                    </div>

                    {/* Rating */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">Overall Rating</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(n => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setRating(n)}
                            className="transition-transform hover:scale-110"
                          >
                            <Star
                              className={`h-7 w-7 transition-colors ${
                                n <= rating ? "fill-amber-400 text-amber-400" : "text-border"
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Message */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">Your Feedback</label>
                      <textarea
                        rows={5}
                        value={feedbackText}
                        onChange={e => setFeedbackText(e.target.value)}
                        placeholder="Describe your experience or suggestion in detail..."
                        className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10 resize-none transition-colors"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={!feedbackText.trim()}
                      className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <Send className="h-4 w-4" /> Submit Feedback
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface PollCardProps {
  poll: Poll;
  index: number;
  votedOption: string | undefined;
  selectedOption: string | undefined;
  onSelect: (id: string) => void;
  onVote: () => void;
}

function PollCard({ poll, index, votedOption, selectedOption, onSelect, onVote }: PollCardProps) {
  const isClosed = poll.status === "closed";
  const hasVoted = !!votedOption;
  const showResults = isClosed || hasVoted;
  const maxVotes = Math.max(...poll.options.map(o => o.votes));
  const catStyle = CATEGORY_COLORS[poll.category] ?? "bg-muted border-border text-muted-foreground";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35 }}
      className={`rounded-2xl border bg-surface shadow-sm overflow-hidden ${
        isClosed ? "border-border opacity-80" : "border-border hover:border-primary/25 hover:shadow-md"
      } transition-all`}
    >
      <div className="px-5 py-4 border-b border-border flex flex-wrap items-center gap-3">
        <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${catStyle}`}>
          {poll.category}
        </span>
        {isClosed ? (
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Lock className="h-3 w-3" /> Closed · {poll.closedOn}
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[11px] text-amber-600 font-medium">
            <Clock className="h-3 w-3" /> Ends in {poll.endsIn}
          </span>
        )}
        <span className="ml-auto flex items-center gap-1 text-[11px] text-muted-foreground">
          <Users className="h-3 w-3" /> {poll.totalVotes.toLocaleString()} votes
        </span>
      </div>

      <div className="px-5 py-4 space-y-4">
        <p className="text-sm font-semibold text-foreground leading-snug">{poll.question}</p>

        <div className="space-y-2.5">
          {poll.options.map(opt => {
            const pct = poll.totalVotes > 0 ? Math.round((opt.votes / poll.totalVotes) * 100) : 0;
            const isWinner = isClosed && opt.votes === maxVotes;
            const isVoted = votedOption === opt.id;
            const isSelected = selectedOption === opt.id;

            return (
              <button
                key={opt.id}
                onClick={() => !isClosed && !hasVoted && onSelect(opt.id)}
                disabled={isClosed || hasVoted}
                className={`w-full text-left rounded-xl border px-4 py-3 transition-all ${
                  showResults
                    ? isVoted || isWinner
                      ? "border-primary/30 bg-primary/5"
                      : "border-border bg-muted/30"
                    : isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border bg-surface hover:border-primary/40 hover:bg-muted/30"
                } ${isClosed || hasVoted ? "cursor-default" : "cursor-pointer"}`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-sm font-medium ${isVoted || isWinner ? "text-primary" : "text-foreground"}`}>
                    {opt.label}
                  </span>
                  {showResults && (
                    <span className={`text-xs font-semibold tabular-nums ${isVoted || isWinner ? "text-primary" : "text-muted-foreground"}`}>
                      {pct}%
                    </span>
                  )}
                  {!showResults && isSelected && (
                    <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-white" />
                    </div>
                  )}
                  {!showResults && !isSelected && (
                    <div className="h-4 w-4 rounded-full border-2 border-border" />
                  )}
                </div>
                {showResults && (
                  <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
                      className={`h-full rounded-full ${isVoted || isWinner ? "bg-primary" : "bg-muted-foreground/30"}`}
                    />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {!isClosed && !hasVoted && (
          <button
            onClick={onVote}
            disabled={!selectedOption}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="h-4 w-4" /> Submit Vote
          </button>
        )}
        {hasVoted && (
          <p className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
            <CheckCircle2 className="h-3.5 w-3.5" /> Your vote has been recorded
          </p>
        )}
      </div>
    </motion.div>
  );
}
