import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Pin, ChevronRight, Search, Tag, Calendar, User, Megaphone, BookOpen, ShieldCheck, GraduationCap, Building2 } from "lucide-react";

type Category = "All" | "Academic" | "Administrative" | "Events" | "Safety" | "Library";

interface Notice {
  id: string;
  title: string;
  body: string;
  category: Exclude<Category, "All">;
  author: string;
  date: string;
  pinned?: boolean;
  urgent?: boolean;
  tag?: string;
}

const NOTICES: Notice[] = [
  {
    id: "n1",
    title: "End-of-semester examination timetable released",
    body: "The final examination schedule for Semester IV has been published. Students are advised to check the academic portal for their individual slot assignments. Hall tickets will be distributed from the registrar's office from Monday.",
    category: "Academic",
    author: "Academic Section",
    date: "Today, 09:15 AM",
    pinned: true,
    tag: "Exams",
  },
  {
    id: "n2",
    title: "Campus maintenance shutdown — Saturday 08:00–14:00",
    body: "Scheduled electrical maintenance will affect Block C, the Library wing, and the Administrative building on Saturday. Essential services will remain operational. Students are encouraged to plan their study sessions accordingly.",
    category: "Administrative",
    author: "Facilities Management",
    date: "Today, 08:45 AM",
    pinned: true,
    urgent: true,
    tag: "Maintenance",
  },
  {
    id: "n3",
    title: "TechFest 2026 — Registration closes Friday",
    body: "Registration for TechFest 2026 closes this Friday at 11:59 PM. Over 18 competitive events spanning robotics, coding, design, and quizzes. Teams of 1–4 students. Register via the Events portal or at the Student Affairs desk.",
    category: "Events",
    author: "Student Affairs",
    date: "Yesterday, 04:30 PM",
    tag: "Events",
  },
  {
    id: "n4",
    title: "Updated anti-ragging policy — mandatory acknowledgement",
    body: "In compliance with UGC regulations, all enrolled students must submit a signed acknowledgement of the revised Anti-Ragging Policy by 30 June 2026. The form is available on the student portal under 'Compliance Documents'.",
    category: "Administrative",
    author: "Dean of Students",
    date: "Yesterday, 11:00 AM",
    urgent: true,
    tag: "Compliance",
  },
  {
    id: "n5",
    title: "New arrivals — Knowledge Center Digital Archive",
    body: "The Knowledge Center has added 340 new digital resources including IEEE journals, Springer textbooks, and curated case study collections for Management and Engineering streams. Access is available through your institutional login.",
    category: "Library",
    author: "Knowledge Center",
    date: "26 Jun 2026",
    tag: "Resources",
  },
  {
    id: "n6",
    title: "Emergency contact numbers updated for monsoon season",
    body: "Campus security and emergency contact numbers have been updated for the monsoon preparedness period. All students and faculty are advised to save the updated hotline: +91-XXXX-XXXXXX. Emergency assembly points are marked on the campus map.",
    category: "Safety",
    author: "Campus Safety Cell",
    date: "25 Jun 2026",
    tag: "Safety",
  },
  {
    id: "n7",
    title: "Guest lecture — Dr. Priya Nair on Sustainable Architecture",
    body: "The Department of Civil Engineering presents a guest lecture by Dr. Priya Nair (IIT Madras) on 'Sustainable Building Practices for Institutional Campuses'. All students and faculty are welcome. Venue: Seminar Hall B, 2:00 PM on 28 June.",
    category: "Academic",
    author: "Civil Engineering Dept.",
    date: "25 Jun 2026",
    tag: "Lecture",
  },
  {
    id: "n8",
    title: "Hostel mess menu revision — effective 1 July",
    body: "The hostel mess committee, in consultation with the student body, has finalised a revised weekly menu to incorporate more regional food options and a dedicated vegan counter. The updated menu will be displayed at the mess entrance.",
    category: "Administrative",
    author: "Hostel Management",
    date: "24 Jun 2026",
    tag: "Hostel",
  },
];

const CATEGORY_META: Record<Exclude<Category, "All">, { icon: typeof Bell; color: string; bg: string }> = {
  Academic: { icon: GraduationCap, color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
  Administrative: { icon: Building2, color: "text-violet-600", bg: "bg-violet-50 border-violet-200" },
  Events: { icon: Megaphone, color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
  Safety: { icon: ShieldCheck, color: "text-red-600", bg: "bg-red-50 border-red-200" },
  Library: { icon: BookOpen, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
};

const CATEGORY_TABS: Category[] = ["All", "Academic", "Administrative", "Events", "Safety", "Library"];

export default function NoticesBoard() {
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = NOTICES.filter(n => {
    const matchCat = activeCategory === "All" || n.category === activeCategory;
    const matchSearch =
      search.trim() === "" ||
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.body.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const pinned = filtered.filter(n => n.pinned);
  const regular = filtered.filter(n => !n.pinned);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">Notices Board</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {NOTICES.length} notices · {pinned.length > 0 ? `${pinned.length} pinned` : "No pinned notices"}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search notices..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10 transition-colors"
          />
        </div>
      </motion.div>

      {/* Category tabs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.08 }}
        className="flex gap-2 flex-wrap"
      >
        {CATEGORY_TABS.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all ${
              activeCategory === cat
                ? "bg-primary border-primary text-primary-foreground shadow-sm"
                : "border-border bg-surface text-muted-foreground hover:border-primary/30 hover:text-foreground"
            }`}
          >
            {cat !== "All" && (() => {
              const { icon: Icon } = CATEGORY_META[cat as Exclude<Category, "All">];
              return <Icon className="h-3 w-3" />;
            })()}
            {cat}
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums ${
              activeCategory === cat ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}>
              {cat === "All" ? NOTICES.length : NOTICES.filter(n => n.category === cat).length}
            </span>
          </button>
        ))}
      </motion.div>

      {/* Pinned notices */}
      {pinned.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Pin className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pinned</p>
          </div>
          {pinned.map((notice, i) => (
            <NoticeCard
              key={notice.id}
              notice={notice}
              index={i}
              expanded={expanded === notice.id}
              onToggle={() => setExpanded(expanded === notice.id ? null : notice.id)}
            />
          ))}
        </div>
      )}

      {/* Regular notices */}
      {regular.length > 0 && (
        <div className="space-y-3">
          {pinned.length > 0 && (
            <div className="flex items-center gap-2">
              <Bell className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">All Notices</p>
            </div>
          )}
          {regular.map((notice, i) => (
            <NoticeCard
              key={notice.id}
              notice={notice}
              index={i}
              expanded={expanded === notice.id}
              onToggle={() => setExpanded(expanded === notice.id ? null : notice.id)}
            />
          ))}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="py-20 text-center">
          <Bell className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm font-medium text-muted-foreground">No notices found</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Try a different category or search term</p>
        </div>
      )}
    </div>
  );
}

interface NoticeCardProps {
  notice: Notice;
  index: number;
  expanded: boolean;
  onToggle: () => void;
}

function NoticeCard({ notice, index, expanded, onToggle }: NoticeCardProps) {
  const meta = CATEGORY_META[notice.category];
  const Icon = meta.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35 }}
      className={`rounded-2xl border bg-surface shadow-sm transition-shadow hover:shadow-md overflow-hidden ${
        notice.pinned ? "border-primary/20" : "border-border"
      }`}
    >
      <button
        onClick={onToggle}
        className="w-full text-left px-5 py-4"
      >
        <div className="flex items-start gap-4">
          {/* Category icon */}
          <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${meta.bg}`}>
            <Icon className={`h-3.5 w-3.5 ${meta.color}`} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              {notice.urgent && (
                <span className="rounded-full bg-red-50 border border-red-200 px-2 py-0.5 text-[10px] font-semibold text-red-600 uppercase tracking-wide">
                  Urgent
                </span>
              )}
              {notice.pinned && (
                <span className="flex items-center gap-1 rounded-full bg-primary/8 bg-primary/[0.08] border border-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  <Pin className="h-2.5 w-2.5" /> Pinned
                </span>
              )}
              {notice.tag && (
                <span className="flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[10px] text-muted-foreground">
                  <Tag className="h-2.5 w-2.5" /> {notice.tag}
                </span>
              )}
            </div>

            <h3 className="text-sm font-semibold text-foreground leading-snug">{notice.title}</h3>

            <div className="mt-2 flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <User className="h-3 w-3" /> {notice.author}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Calendar className="h-3 w-3" /> {notice.date}
              </span>
              <span className={`text-[11px] font-medium ${meta.color}`}>{notice.category}</span>
            </div>
          </div>

          <ChevronRight
            className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform mt-1 ${expanded ? "rotate-90" : ""}`}
          />
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-border px-5 pb-5 pt-4">
              <p className="text-sm text-foreground/80 leading-relaxed">{notice.body}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
