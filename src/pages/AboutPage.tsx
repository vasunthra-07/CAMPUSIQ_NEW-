import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Building2, GraduationCap, Brain, Users, Calendar, Wrench,
  ShieldCheck, Car, BookOpen, BarChart3, Headset, Activity,
  ArrowRight, CheckCircle2, Briefcase, BarChart2, UtensilsCrossed
} from "lucide-react";
import { CampusIQLogo } from "@/components/CampusIQLogo";

const MODULES = [
  { icon: Building2, label: "Campus Command Center", desc: "Unified overview of all campus operations and health metrics." },
  { icon: GraduationCap, label: "Student Experience Hub", desc: "Attendance, timetables, grades, and personalised student tools." },
  { icon: Briefcase, label: "Faculty Workspace", desc: "Teaching schedules, student oversight, and faculty utilities." },
  { icon: Brain, label: "Campus Copilot", desc: "AI-powered assistant for queries, planning, and recommendations." },
  { icon: Building2, label: "Resource Operations", desc: "Room bookings, equipment allocation, and utilisation tracking." },
  { icon: Calendar, label: "Event Operations", desc: "End-to-end event planning, registration, and management." },
  { icon: Headset, label: "Campus Service Center", desc: "Ticketing, issue resolution, and student support workflows." },
  { icon: Wrench, label: "Asset Management", desc: "Asset lifecycle, inventory, and maintenance scheduling." },
  { icon: Activity, label: "Maintenance Operations", desc: "Work orders, repair tracking, and infrastructure health." },
  { icon: Users, label: "Communications Center", desc: "Campus-wide announcements, messaging, and notices." },
  { icon: ShieldCheck, label: "Safety & Emergency", desc: "Incident reporting, drills, and emergency response tools." },
  { icon: Car, label: "Mobility Operations", desc: "Bus routes, fleet tracking, and passenger management." },
  { icon: BookOpen, label: "Knowledge Center", desc: "Library catalogue, digital resources, and borrowing tools." },
  { icon: BarChart3, label: "Campus Analytics", desc: "Institutional data intelligence and performance dashboards." },
  { icon: BarChart2, label: "Polls & Feedback", desc: "Campus-wide polls, live voting, and anonymous feedback submission." },
  { icon: UtensilsCrossed, label: "Campus Canteen", desc: "Daily menu, meal timings, item ratings, and pre-order management." },
];

const VALUES = [
  { title: "Institutional-grade security", desc: "Role-based access control with fine-grained permissions for every user type." },
  { title: "Single source of truth", desc: "All campus data in one unified platform — no more siloed spreadsheets." },
  { title: "Built for real campuses", desc: "Designed around how students, faculty, and administrators actually work." },
  { title: "Modular & extensible", desc: "Deploy only the modules you need; expand as your institution grows." },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.45, ease: [0.25, 0.1, 0.25, 1] as any },
  }),
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background auth-theme">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <Link to="/">
            <CampusIQLogo size="sm" variant="light" />
          </Link>
          <Link
            to="/auth/login"
            className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Sign In <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(160deg, hsl(220 38% 9%) 0%, hsl(219 55% 16%) 60%, hsl(219 45% 22%) 100%)",
          }}
        />
        <div className="relative mx-auto max-w-4xl px-6 py-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex justify-center mb-8"
          >
            <CampusIQLogo size="xl" variant="dark" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.5 }}
            className="text-4xl sm:text-5xl font-bold text-white leading-tight mb-5"
            style={{ letterSpacing: "-0.03em" }}
          >
            One platform.<br />Every campus operation.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.45 }}
            className="text-base leading-relaxed max-w-2xl mx-auto mb-10"
            style={{ color: "hsl(215 18% 62%)" }}
          >
            CampusIQ is an institutional operating system that unifies attendance, resources, events,
            services, and communications into a single intelligent platform — purpose-built for
            modern educational institutions.
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="flex flex-wrap items-center justify-center gap-3"
          >
            <Link
              to="/auth/login"
              className="rounded-xl bg-amber-500 px-6 py-3 text-sm font-semibold text-slate-900 hover:bg-amber-400 transition-colors"
            >
              Sign In to Campus
            </Link>
            <a
              href="#modules"
              className="rounded-xl border border-white/15 px-6 py-3 text-sm font-semibold text-white hover:bg-white/8 hover:bg-white/[0.08] transition-colors"
            >
              Explore Modules
            </a>
          </motion.div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-b border-border bg-surface">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {[
              { value: "2,847", label: "Active Students" },
              { value: "14", label: "Campus Modules" },
              { value: "94/100", label: "Health Score" },
              { value: "99.8%", label: "Platform Uptime" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                custom={i}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                variants={fadeUp}
              >
                <p className="text-2xl font-bold text-foreground tabular-nums">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Modules */}
      <section id="modules" className="py-20 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-primary mb-3">Platform Modules</p>
            <h2 className="text-3xl font-bold text-foreground tracking-tight">Everything your campus needs</h2>
            <p className="text-sm text-muted-foreground mt-3 max-w-xl mx-auto leading-relaxed">
              Fourteen purpose-built modules covering every dimension of campus operations,
              all sharing a single data layer.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {MODULES.map(({ icon: Icon, label, desc }, i) => (
              <motion.div
                key={label}
                custom={i}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-40px" }}
                variants={fadeUp}
                className="group rounded-2xl border border-border bg-surface p-5 hover:border-primary/30 hover:shadow-md transition-all"
              >
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/8 bg-primary/[0.08] text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Icon className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-1.5">{label}</h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="border-t border-border bg-muted/30 py-20 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-primary mb-3">Why CampusIQ</p>
            <h2 className="text-3xl font-bold text-foreground tracking-tight">Built for institutions, not startups</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {VALUES.map(({ title, desc }, i) => (
              <motion.div
                key={title}
                custom={i}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                variants={fadeUp}
                className="flex gap-4 rounded-2xl border border-border bg-surface p-6"
              >
                <CheckCircle2 className="h-5 w-5 shrink-0 text-primary mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1.5">{title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 text-center">
        <div className="mx-auto max-w-xl">
          <h2 className="text-2xl font-bold text-foreground tracking-tight mb-3">Ready to get started?</h2>
          <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
            Sign in with your institutional credentials to access your personalised campus dashboard.
          </p>
          <Link
            to="/auth/login"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Access Campus Portal <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-surface px-6 py-6">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <CampusIQLogo size="sm" variant="light" hideSubtitle />
          <p className="text-[11px] text-muted-foreground">© 2026 CampusIQ Platform. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <a href="#" className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">Terms</a>
            <Link to="/auth/login" className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
