import { useLibraryData } from "@/hooks/useCampusData";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { PageHeader, MetricTile, WorkspacePanel, StatusBadge } from "@/components/workspace";
import { BookOpen, TrendingUp, AlertTriangle, Star, Users, Monitor } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function LibraryIntelligence() {
  const { data: library, isLoading } = useLibraryData();

  if (isLoading || !library) {
    return <div className="flex h-64 items-center justify-center text-muted-foreground">Loading library data…</div>;
  }

  const checkoutPct = Math.round((library.checkedOut / library.totalBooks) * 100);
  const visitorData = library.dailyVisitors.map((v, i) => ({
    day: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i],
    visitors: v,
  }));

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        eyebrow="Knowledge Operations"
        title="Knowledge Center"
        description="Collection management, reservations, digital resources, and usage analytics"
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <MetricTile label="Total Books" value={<AnimatedNumber value={library.totalBooks} />} icon={BookOpen} variant="primary" delay={0} />
        <MetricTile label="Checked Out" value={<AnimatedNumber value={library.checkedOut} />} icon={TrendingUp} variant="default" delay={0.05} />
        <MetricTile label="Overdue" value={<AnimatedNumber value={library.overdue} />} icon={AlertTriangle} variant="warning" delay={0.1} />
        <MetricTile label="New Arrivals" value={<AnimatedNumber value={library.newArrivals} />} icon={Star} variant="success" delay={0.15} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <WorkspacePanel title="Reservations" description="Collection checkout rate" icon={BookOpen} delay={0.2}>
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm text-muted-foreground">Circulation rate</span>
            <span className="text-2xl font-semibold tabular-nums">{checkoutPct}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${checkoutPct}%` }} />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {library.checkedOut.toLocaleString()} of {library.totalBooks.toLocaleString()} books in circulation
          </p>
        </WorkspacePanel>

        <WorkspacePanel title="Digital Resources" description="Online access metrics" icon={Monitor} delay={0.25}>
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between py-2 border-b border-border/60">
              <span className="text-muted-foreground">E-Journals</span>
              <span className="font-medium">1,240 active</span>
            </li>
            <li className="flex justify-between py-2 border-b border-border/60">
              <span className="text-muted-foreground">Research Databases</span>
              <span className="font-medium">18 subscribed</span>
            </li>
            <li className="flex justify-between py-2">
              <span className="text-muted-foreground">Digital Downloads</span>
              <span className="font-medium">342 this week</span>
            </li>
          </ul>
        </WorkspacePanel>
      </div>

      <WorkspacePanel title="Usage Analytics" description="Daily visitors this week" icon={Users} delay={0.3}>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={visitorData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="visitors" fill="#2563EB" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </WorkspacePanel>

      <WorkspacePanel title="Recommendations" description="Most borrowed books" icon={Star} delay={0.35}>
        <div className="space-y-2">
          {library.popularBooks.map((book, i) => (
            <div key={book.title} className="flex items-center gap-4 rounded-lg border border-border p-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-semibold text-primary">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{book.title}</p>
                <p className="text-xs text-muted-foreground">{book.author}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold tabular-nums">{book.borrows}</p>
                <StatusBadge variant={book.available > 0 ? "success" : "danger"}>{book.available} avail.</StatusBadge>
              </div>
            </div>
          ))}
        </div>
      </WorkspacePanel>
    </div>
  );
}
