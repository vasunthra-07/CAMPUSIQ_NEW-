import { useState } from "react";
import { useLibraryBooks, useReserveBook, useCancelReservation, useReturnBook } from "@/hooks/useCampusData";
import { useAuth } from "@/context/AuthContext";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { PageHeader, MetricTile, WorkspacePanel, StatusBadge } from "@/components/workspace";
import { BookOpen, TrendingUp, AlertTriangle, Star, Users, Monitor, Search, RefreshCw, BookMarked, CheckCircle, X } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { LibraryBook } from "@/services/campusStore";

const CATEGORIES = ["All", "AI/ML", "Software Engineering", "Systems", "Computer Science", "Networking", "Database"];
const VISITOR_DATA = [
  { day: "Mon", visitors: 210 }, { day: "Tue", visitors: 185 }, { day: "Wed", visitors: 230 },
  { day: "Thu", visitors: 198 }, { day: "Fri", visitors: 242 }, { day: "Sat", visitors: 178 }, { day: "Sun", visitors: 260 },
];

export default function LibraryIntelligence() {
  const { user } = useAuth();
  const { data: books, isLoading } = useLibraryBooks();
  const reserveBook = useReserveBook();
  const cancelReservation = useCancelReservation();
  const returnBook = useReturnBook();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [detailBook, setDetailBook] = useState<LibraryBook | null>(null);
  const [returnConfirm, setReturnConfirm] = useState<string | null>(null);

  const userId = user?.userId ?? "guest";

  if (isLoading || !books) {
    return (
      <div className="space-y-6 pb-10">
        <div className="h-12 w-64 rounded-lg bg-muted animate-pulse" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map(i => <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />)}
        </div>
        <div className="h-64 rounded-xl bg-muted animate-pulse" />
      </div>
    );
  }

  const totalBooks = 45820;
  const totalCheckedOut = 2341 + books.reduce((a, b) => a + b.checkedOutBy.length, 0);
  const overdue = 187;
  const newArrivals = 45;

  const filtered = books
    .filter(b => categoryFilter === "All" || b.category === categoryFilter)
    .filter(b => !search || b.title.toLowerCase().includes(search.toLowerCase()) || b.author.toLowerCase().includes(search.toLowerCase()) || b.isbn.includes(search));

  const myReservations = books.filter(b => b.reservedBy.includes(userId));
  const myCheckouts = books.filter(b => b.checkedOutBy.some(c => c.userId === userId));

  const handleReserve = (book: LibraryBook) => {
    const isReserved = book.reservedBy.includes(userId);
    if (isReserved) {
      cancelReservation.mutate({ bookId: book.id, userId }, {
        onSuccess: () => toast.success(`Reservation for "${book.title}" cancelled`),
      });
    } else if (book.availableCopies <= 0) {
      toast.error("No copies available. You can still reserve to join the waitlist.");
    } else {
      reserveBook.mutate({ bookId: book.id, userId }, {
        onSuccess: () => toast.success(`"${book.title}" reserved! Pick up within 48 hours.`),
      });
    }
  };

  const handleReturn = (bookId: string) => {
    returnBook.mutate({ bookId, userId }, {
      onSuccess: () => { toast.success("Book returned successfully!"); setReturnConfirm(null); },
    });
  };

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        eyebrow="Knowledge Operations"
        title="Knowledge Center"
        description="Collection management, reservations, digital resources, and usage analytics"
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <MetricTile label="Total Books" value={<AnimatedNumber value={totalBooks} />} icon={BookOpen} variant="primary" delay={0} />
        <MetricTile label="Checked Out" value={<AnimatedNumber value={totalCheckedOut} />} icon={TrendingUp} variant="default" delay={0.05} />
        <MetricTile label="Overdue" value={<AnimatedNumber value={overdue} />} icon={AlertTriangle} variant="warning" delay={0.1} />
        <MetricTile label="New Arrivals" value={<AnimatedNumber value={newArrivals} />} icon={Star} variant="success" delay={0.15} />
      </div>

      {/* My Activity */}
      {(myReservations.length > 0 || myCheckouts.length > 0) && (
        <div className="grid gap-4 lg:grid-cols-2">
          {myReservations.length > 0 && (
            <WorkspacePanel title="My Reservations" description="Books awaiting pickup" icon={BookMarked} delay={0.18}>
              <div className="space-y-2">
                {myReservations.map(book => (
                  <div key={book.id} className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 p-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{book.title}</p>
                      <p className="text-xs text-muted-foreground">{book.author}</p>
                    </div>
                    <button onClick={() => cancelReservation.mutate({ bookId: book.id, userId }, { onSuccess: () => toast.success("Reservation cancelled") })}
                      className="text-xs text-destructive hover:underline px-2 py-1 rounded hover:bg-destructive/10 transition-colors">Cancel</button>
                  </div>
                ))}
              </div>
            </WorkspacePanel>
          )}
          {myCheckouts.length > 0 && (
            <WorkspacePanel title="My Checkouts" description="Books currently borrowed" icon={CheckCircle} delay={0.2}>
              <div className="space-y-2">
                {myCheckouts.map(book => {
                  const checkout = book.checkedOutBy.find(c => c.userId === userId);
                  const isOverdue = checkout && new Date(checkout.dueDate) < new Date();
                  return (
                    <div key={book.id} className={cn("flex items-center justify-between rounded-lg border p-3", isOverdue ? "border-red-200 bg-red-50/50" : "border-border")}>
                      <div>
                        <p className="text-sm font-medium text-foreground">{book.title}</p>
                        <p className={cn("text-xs", isOverdue ? "text-red-500 font-medium" : "text-muted-foreground")}>
                          Due: {checkout?.dueDate}{isOverdue ? " — OVERDUE" : ""}
                        </p>
                      </div>
                      <button onClick={() => setReturnConfirm(book.id)} className="btn-secondary text-xs px-3 py-1.5 rounded-lg">Return</button>
                    </div>
                  );
                })}
              </div>
            </WorkspacePanel>
          )}
        </div>
      )}

      {/* Book Catalog */}
      <WorkspacePanel title="Book Catalog" description={`${filtered.length} books`} icon={BookOpen} delay={0.2}
        actions={
          <div className="flex gap-1 flex-wrap">
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setCategoryFilter(c)}
                className={cn("rounded-md px-2.5 py-1 text-xs font-medium transition-colors", categoryFilter === c ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}>
                {c}
              </button>
            ))}
          </div>
        }
      >
        <div className="mb-3 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="text" placeholder="Search by title, author, or ISBN…" value={search} onChange={e => setSearch(e.target.value)}
            className="w-full input-warm pl-9 pr-4 py-2 text-sm" />
        </div>
        <div className="space-y-2">
          {filtered.length === 0 && <div className="py-8 text-center text-muted-foreground text-sm">No books match your search.</div>}
          {filtered.map((book, i) => {
            const isReserved = book.reservedBy.includes(userId);
            return (
              <div key={book.id} className="flex items-center gap-4 rounded-lg border border-border p-3 hover:bg-muted/20 transition-colors">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-semibold text-primary">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{book.title}</p>
                  <p className="text-xs text-muted-foreground">{book.author} · ISBN {book.isbn}</p>
                  <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded mt-0.5 inline-block">{book.category}</span>
                </div>
                <div className="text-right shrink-0 space-y-1">
                  <StatusBadge variant={book.availableCopies > 0 ? "success" : "danger"}>
                    {book.availableCopies}/{book.totalCopies} avail.
                  </StatusBadge>
                  <div className="flex gap-1 justify-end">
                    <button onClick={() => setDetailBook(book)} className="text-[10px] btn-ghost px-2 py-0.5 rounded">Details</button>
                    <button onClick={() => handleReserve(book)}
                      className={cn("text-[10px] px-2 py-0.5 rounded font-medium transition-colors", isReserved ? "text-destructive hover:bg-destructive/10 border border-destructive/20" : "btn-primary")}>
                      {isReserved ? "Cancel Reserve" : "Reserve"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </WorkspacePanel>

      <div className="grid gap-4 lg:grid-cols-2">
        <WorkspacePanel title="Digital Resources" description="Online access metrics" icon={Monitor} delay={0.3}>
          <ul className="space-y-2 text-sm">
            {[
              { label: "E-Journals", value: "1,240 active", action: "Browse", color: "text-blue-600" },
              { label: "Research Databases", value: "18 subscribed", action: "Access", color: "text-purple-600" },
              { label: "Digital Downloads", value: "342 this week", action: "Download", color: "text-emerald-600" },
              { label: "Online Thesis Repository", value: "4,820 records", action: "Search", color: "text-amber-600" },
            ].map(item => (
              <li key={item.label} className="flex items-center justify-between py-2 border-b border-border/60 last:border-0">
                <div>
                  <p className="text-sm text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.value}</p>
                </div>
                <button onClick={() => toast.info(`Opening ${item.label}…`)} className={cn("text-xs font-medium hover:underline", item.color)}>
                  {item.action} →
                </button>
              </li>
            ))}
          </ul>
        </WorkspacePanel>

        <WorkspacePanel title="Usage Analytics" description="Daily visitors this week" icon={Users} delay={0.35}>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={VISITOR_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="visitors" fill="#2563EB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </WorkspacePanel>
      </div>

      {/* Book Detail Modal */}
      {detailBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm" onClick={() => setDetailBook(null)}>
          <div className="workspace-panel w-full max-w-md p-6 space-y-4 m-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">{detailBook.title}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{detailBook.author}</p>
              </div>
              <button onClick={() => setDetailBook(null)} className="p-1 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">ISBN</span><span className="font-mono">{detailBook.isbn}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Category</span><span>{detailBook.category}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Total Copies</span><span>{detailBook.totalCopies}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Available</span>
                <StatusBadge variant={detailBook.availableCopies > 0 ? "success" : "danger"}>{detailBook.availableCopies} available</StatusBadge>
              </div>
              <div className="flex justify-between"><span className="text-muted-foreground">Total Borrows</span><span className="font-semibold">{detailBook.borrows}</span></div>
              {detailBook.reservedBy.length > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Reservations</span><span>{detailBook.reservedBy.length} pending</span></div>}
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setDetailBook(null)} className="btn-secondary flex-1 py-2.5 text-sm rounded-lg">Close</button>
              <button onClick={() => { handleReserve(detailBook); setDetailBook(null); }}
                className={cn("flex-1 py-2.5 text-sm rounded-lg font-medium", detailBook.reservedBy.includes(userId) ? "bg-destructive/10 text-destructive border border-destructive/20" : "btn-primary")}>
                {detailBook.reservedBy.includes(userId) ? "Cancel Reservation" : "Reserve Book"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return Confirm */}
      {returnConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm">
          <div className="workspace-panel w-full max-w-sm p-6 m-4 space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Return Book?</h2>
            <p className="text-sm text-muted-foreground">Confirm that you are returning "{books.find(b => b.id === returnConfirm)?.title}".</p>
            <div className="flex gap-3">
              <button onClick={() => setReturnConfirm(null)} className="btn-secondary flex-1 py-2.5 text-sm rounded-lg">Cancel</button>
              <button onClick={() => handleReturn(returnConfirm)} className="btn-primary flex-1 py-2.5 text-sm rounded-lg">Confirm Return</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
