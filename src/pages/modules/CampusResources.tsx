import { useState, useMemo } from "react";
import { useCampusResources, useRoomBookings, useAddRoomBooking, useCancelRoomBooking } from "@/hooks/useCampusData";
import { CAMPUS_ROOMS, bookingStore, type CampusRoom, type RoomBooking } from "@/services/campusStore";
import { useAuth } from "@/context/AuthContext";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { PageHeader, MetricTile, WorkspacePanel, StatusBadge } from "@/components/workspace";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Building2, AlertTriangle, CheckCircle, Gauge, TrendingUp,
  Calendar, Clock, Users, X, Search, Filter, ChevronDown,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";

const TIME_SLOTS = ["08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00"];
const ROOM_TYPES = ["All", "Classroom", "Lab", "Seminar Hall", "Auditorium", "Conference Room", "Study Room"];

function getStatusColor(status: string) {
  if (status === "over") return "#EF4444";
  if (status === "optimal") return "#2563EB";
  return "#64748B";
}

function getStatusVariant(status: string): "danger" | "success" | "neutral" {
  if (status === "over") return "danger";
  if (status === "optimal") return "success";
  return "neutral";
}

interface BookingFormState {
  roomId: string;
  date: string;
  startTime: string;
  endTime: string;
  purpose: string;
  attendees: string;
}

const EMPTY_FORM: BookingFormState = {
  roomId: "",
  date: new Date().toISOString().split("T")[0],
  startTime: "09:00",
  endTime: "10:00",
  purpose: "",
  attendees: "1",
};

export default function CampusResources() {
  const { user } = useAuth();
  const { data: resources, isLoading: loadingResources } = useCampusResources();
  const { data: bookings = [], isLoading: loadingBookings } = useRoomBookings();
  const addBooking = useAddRoomBooking();
  const cancelBooking = useCancelRoomBooking();

  const [activeTab, setActiveTab] = useState<"availability" | "book" | "my-bookings">("availability");
  const [typeFilter, setTypeFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split("T")[0]);
  const [selectedRoom, setSelectedRoom] = useState<CampusRoom | null>(null);
  const [bookingForm, setBookingForm] = useState<BookingFormState>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Partial<BookingFormState>>({});
  const [showRoomDetail, setShowRoomDetail] = useState<CampusRoom | null>(null);
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);

  const isLoading = loadingResources || loadingBookings;

  const userId = user?.userId ?? "guest";
  const userName = user?.name ?? "Guest";

  const myBookings = useMemo(() =>
    bookings.filter(b => b.bookedBy === userId && b.status !== "Cancelled")
      .sort((a, b) => a.date.localeCompare(b.date)),
    [bookings, userId]
  );

  const filteredRooms = useMemo(() => {
    return CAMPUS_ROOMS.filter(r => {
      if (typeFilter !== "All" && r.type !== typeFilter) return false;
      if (search && !r.name.toLowerCase().includes(search.toLowerCase()) && !r.block.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [typeFilter, search]);

  function getRoomBookingsOnDate(roomId: string, date: string) {
    return bookings.filter(b => b.roomId === roomId && b.date === date && b.status !== "Cancelled");
  }

  function isRoomAvailableOnDate(roomId: string, date: string) {
    const dayBookings = getRoomBookingsOnDate(roomId, date);
    if (dayBookings.length === 0) return true;
    const totalHours = dayBookings.reduce((acc, b) => {
      const s = parseInt(b.startTime.split(":")[0]);
      const e = parseInt(b.endTime.split(":")[0]);
      return acc + (e - s);
    }, 0);
    return totalHours < 10;
  }

  function validateForm(): boolean {
    const errors: Partial<BookingFormState> = {};
    if (!bookingForm.roomId) errors.roomId = "Select a room";
    if (!bookingForm.date) errors.date = "Select a date";
    if (bookingForm.startTime >= bookingForm.endTime) errors.endTime = "End time must be after start time";
    const hrs = parseInt(bookingForm.endTime) - parseInt(bookingForm.startTime.split(":")[0]);
    if (hrs > 4) errors.endTime = "Maximum booking duration is 4 hours";
    if (!bookingForm.purpose.trim()) errors.purpose = "Purpose is required";
    if (!bookingForm.attendees || parseInt(bookingForm.attendees) < 1) errors.attendees = "At least 1 attendee";
    const room = CAMPUS_ROOMS.find(r => r.id === bookingForm.roomId);
    if (room && parseInt(bookingForm.attendees) > room.capacity) {
      errors.attendees = `Exceeds room capacity of ${room.capacity}`;
    }
    if (bookingStore.hasConflict(bookingForm.roomId, bookingForm.date, bookingForm.startTime, bookingForm.endTime)) {
      errors.startTime = "This slot is already booked. Choose another time.";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleSubmitBooking() {
    if (!validateForm()) return;
    const room = CAMPUS_ROOMS.find(r => r.id === bookingForm.roomId)!;
    addBooking.mutate({
      roomId: bookingForm.roomId,
      roomName: room.name,
      date: bookingForm.date,
      startTime: bookingForm.startTime,
      endTime: bookingForm.endTime,
      purpose: bookingForm.purpose.trim(),
      bookedBy: userId,
      bookedByName: userName,
      attendees: parseInt(bookingForm.attendees),
    }, {
      onSuccess: () => {
        toast.success("Room booked successfully!");
        setBookingForm(EMPTY_FORM);
        setSelectedRoom(null);
        setActiveTab("my-bookings");
      },
      onError: () => toast.error("Booking failed. Please try again."),
    });
  }

  function handleCancelBooking(id: string) {
    cancelBooking.mutate(id, {
      onSuccess: () => { toast.success("Booking cancelled."); setCancelTarget(null); },
    });
  }

  if (isLoading) {
    return (
      <div className="space-y-6 pb-10">
        <div className="h-10 w-80 animate-pulse rounded-lg bg-muted" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[0,1,2,3].map(i => <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />)}
        </div>
        <div className="h-96 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  const avgUtil = resources ? Math.round(resources.reduce((a, r) => a + r.utilizationPct, 0) / resources.length) : 0;
  const overCount = resources?.filter(r => r.status === "over").length ?? 0;
  const optimalCount = resources?.filter(r => r.status === "optimal").length ?? 0;
  const chartData = resources?.map(r => ({
    name: r.label.split("—")[0].trim().slice(0, 12),
    utilization: r.utilizationPct,
    status: r.status,
  })) ?? [];

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        eyebrow="Resource Operations"
        title="Resource Operations Center"
        description="Real-time availability, reservations, and utilization across campus facilities"
        actions={
          <button
            className="btn-primary flex items-center gap-2 px-4 py-2 rounded-lg text-sm"
            onClick={() => setActiveTab("book")}
          >
            <Calendar className="h-4 w-4" /> Book a Room
          </button>
        }
      />

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <MetricTile label="Avg Utilization" value={<AnimatedNumber value={avgUtil} suffix="%" />} icon={TrendingUp} variant="primary" delay={0} />
        <MetricTile label="Over-utilized" value={<AnimatedNumber value={overCount} />} icon={AlertTriangle} variant="danger" delay={0.05} />
        <MetricTile label="Optimal" value={<AnimatedNumber value={optimalCount} />} icon={CheckCircle} variant="success" delay={0.1} />
        <MetricTile label="My Bookings" value={<AnimatedNumber value={myBookings.length} />} icon={Calendar} variant="default" delay={0.15} />
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 rounded-lg border border-border bg-muted/40 p-1 w-fit">
        {(["availability", "book", "my-bookings"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "rounded-md px-4 py-1.5 text-sm font-medium transition-colors capitalize",
              activeTab === tab ? "bg-surface shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab === "availability" ? "Availability" : tab === "book" ? "Book a Room" : "My Bookings"}
          </button>
        ))}
      </div>

      {/* AVAILABILITY TAB */}
      {activeTab === "availability" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search rooms or blocks..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="input-warm w-full pl-9 pr-4 py-2 text-sm rounded-lg"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                className="input-warm pl-9 pr-8 py-2 text-sm rounded-lg appearance-none"
              >
                {ROOM_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
            <input
              type="date"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              className="input-warm px-3 py-2 text-sm rounded-lg"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredRooms.map(room => {
              const available = isRoomAvailableOnDate(room.id, dateFilter);
              const dayBookings = getRoomBookingsOnDate(room.id, dateFilter);
              return (
                <div key={room.id} className="rounded-xl border border-border bg-surface p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{room.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{room.block} · {room.floor} floor</p>
                    </div>
                    <StatusBadge variant={available ? "success" : "warning"}>
                      {available ? "Available" : "Busy"}
                    </StatusBadge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" />{room.capacity} seats</span>
                    <span className="text-xs bg-muted rounded px-1.5 py-0.5">{room.type}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {room.amenities.slice(0, 3).map(a => (
                      <span key={a} className="text-[10px] rounded border border-border bg-muted/50 px-1.5 py-0.5 text-muted-foreground">{a}</span>
                    ))}
                    {room.amenities.length > 3 && (
                      <span className="text-[10px] rounded border border-border bg-muted/50 px-1.5 py-0.5 text-muted-foreground">+{room.amenities.length - 3}</span>
                    )}
                  </div>
                  {dayBookings.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Booked slots</p>
                      {dayBookings.map(b => (
                        <div key={b.id} className="flex items-center gap-2 text-xs">
                          <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span className="text-foreground">{b.startTime}–{b.endTime}</span>
                          <span className="text-muted-foreground truncate">{b.purpose}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => setShowRoomDetail(room)}
                      className="btn-secondary flex-1 py-1.5 text-xs rounded-lg"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => {
                        setBookingForm(prev => ({ ...prev, roomId: room.id }));
                        setSelectedRoom(room);
                        setActiveTab("book");
                      }}
                      className="btn-primary flex-1 py-1.5 text-xs rounded-lg"
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              );
            })}
            {filteredRooms.length === 0 && (
              <div className="col-span-3 rounded-xl border border-border bg-surface py-16 text-center text-sm text-muted-foreground">
                No rooms match your search.
              </div>
            )}
          </div>

          {/* Utilization analytics */}
          <div className="grid gap-4 lg:grid-cols-2">
            <WorkspacePanel title="Occupancy Analytics" description="Resource utilization by facility" icon={TrendingUp} delay={0}>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 16 }}>
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#64748B" }} width={90} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="utilization" radius={[0, 4, 4, 0]}>
                      {chartData.map((entry, i) => (
                        <Cell key={i} fill={getStatusColor(entry.status)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </WorkspacePanel>

            <WorkspacePanel title="Resource Health" description="Optimization insights" icon={CheckCircle} delay={0.1}>
              <ul className="space-y-2 text-sm text-foreground">
                {resources?.filter(r => r.status === "over").map(r => (
                  <li key={r.label} className="flex gap-2 rounded-lg border border-red-200 bg-red-50/50 px-3 py-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
                    <span>{r.label}: {r.recommendation}</span>
                  </li>
                ))}
                {resources?.filter(r => r.status !== "over").slice(0, 3).map(r => (
                  <li key={r.label} className="flex gap-2 rounded-lg border border-border px-3 py-2">
                    <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                    <span>{r.label}: {r.recommendation}</span>
                  </li>
                ))}
                {overCount === 0 && (
                  <li className="text-muted-foreground">All resources within optimal operating parameters.</li>
                )}
              </ul>
            </WorkspacePanel>
          </div>
        </div>
      )}

      {/* BOOK A ROOM TAB */}
      {activeTab === "book" && (
        <WorkspacePanel title="Book a Room" description="Reserve a campus facility for your activity" icon={Calendar} delay={0}>
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left: form */}
            <div className="space-y-4">
              <div>
                <label className="label-sm">Select Room *</label>
                <select
                  value={bookingForm.roomId}
                  onChange={e => {
                    const room = CAMPUS_ROOMS.find(r => r.id === e.target.value) ?? null;
                    setSelectedRoom(room);
                    setBookingForm(prev => ({ ...prev, roomId: e.target.value }));
                    setFormErrors(prev => ({ ...prev, roomId: undefined }));
                  }}
                  className={cn("input-warm w-full px-3 py-2 text-sm rounded-lg mt-1", formErrors.roomId && "border-red-500")}
                >
                  <option value="">— Choose a room —</option>
                  {CAMPUS_ROOMS.map(r => (
                    <option key={r.id} value={r.id}>{r.name} (cap. {r.capacity})</option>
                  ))}
                </select>
                {formErrors.roomId && <p className="text-xs text-red-500 mt-1">{formErrors.roomId}</p>}
              </div>

              <div>
                <label className="label-sm">Date *</label>
                <input
                  type="date"
                  value={bookingForm.date}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={e => setBookingForm(prev => ({ ...prev, date: e.target.value }))}
                  className={cn("input-warm w-full px-3 py-2 text-sm rounded-lg mt-1", formErrors.date && "border-red-500")}
                />
                {formErrors.date && <p className="text-xs text-red-500 mt-1">{formErrors.date}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-sm">Start Time *</label>
                  <select
                    value={bookingForm.startTime}
                    onChange={e => setBookingForm(prev => ({ ...prev, startTime: e.target.value }))}
                    className={cn("input-warm w-full px-3 py-2 text-sm rounded-lg mt-1", formErrors.startTime && "border-red-500")}
                  >
                    {TIME_SLOTS.slice(0, -1).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  {formErrors.startTime && <p className="text-xs text-red-500 mt-1">{formErrors.startTime}</p>}
                </div>
                <div>
                  <label className="label-sm">End Time *</label>
                  <select
                    value={bookingForm.endTime}
                    onChange={e => setBookingForm(prev => ({ ...prev, endTime: e.target.value }))}
                    className={cn("input-warm w-full px-3 py-2 text-sm rounded-lg mt-1", formErrors.endTime && "border-red-500")}
                  >
                    {TIME_SLOTS.slice(1).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  {formErrors.endTime && <p className="text-xs text-red-500 mt-1">{formErrors.endTime}</p>}
                </div>
              </div>

              <div>
                <label className="label-sm">Purpose *</label>
                <input
                  type="text"
                  placeholder="e.g. Team project meeting, Guest lecture..."
                  value={bookingForm.purpose}
                  onChange={e => setBookingForm(prev => ({ ...prev, purpose: e.target.value }))}
                  className={cn("input-warm w-full px-3 py-2 text-sm rounded-lg mt-1", formErrors.purpose && "border-red-500")}
                />
                {formErrors.purpose && <p className="text-xs text-red-500 mt-1">{formErrors.purpose}</p>}
              </div>

              <div>
                <label className="label-sm">Number of Attendees *</label>
                <input
                  type="number"
                  min={1}
                  max={selectedRoom?.capacity ?? 500}
                  value={bookingForm.attendees}
                  onChange={e => setBookingForm(prev => ({ ...prev, attendees: e.target.value }))}
                  className={cn("input-warm w-full px-3 py-2 text-sm rounded-lg mt-1", formErrors.attendees && "border-red-500")}
                />
                {formErrors.attendees && <p className="text-xs text-red-500 mt-1">{formErrors.attendees}</p>}
              </div>

              <button
                onClick={handleSubmitBooking}
                disabled={addBooking.isPending}
                className="btn-primary w-full py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {addBooking.isPending ? "Booking…" : "Confirm Booking"}
              </button>
            </div>

            {/* Right: room preview */}
            {selectedRoom ? (
              <div className="rounded-xl border border-border bg-muted/30 p-5 space-y-4">
                <div>
                  <p className="text-base font-semibold text-foreground">{selectedRoom.name}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{selectedRoom.block} · {selectedRoom.floor} floor · {selectedRoom.type}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg border border-border bg-surface px-3 py-2.5">
                    <p className="text-xs text-muted-foreground">Capacity</p>
                    <p className="font-semibold text-foreground mt-0.5">{selectedRoom.capacity} seats</p>
                  </div>
                  <div className="rounded-lg border border-border bg-surface px-3 py-2.5">
                    <p className="text-xs text-muted-foreground">Type</p>
                    <p className="font-semibold text-foreground mt-0.5">{selectedRoom.type}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Amenities</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedRoom.amenities.map(a => (
                      <span key={a} className="text-xs rounded border border-border bg-surface px-2 py-1">{a}</span>
                    ))}
                  </div>
                </div>
                {bookingForm.date && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                      Existing bookings on {bookingForm.date}
                    </p>
                    {getRoomBookingsOnDate(selectedRoom.id, bookingForm.date).length === 0 ? (
                      <p className="text-sm text-emerald-600">No bookings — fully available</p>
                    ) : (
                      <div className="space-y-1.5">
                        {getRoomBookingsOnDate(selectedRoom.id, bookingForm.date).map(b => (
                          <div key={b.id} className="flex items-center gap-2 text-xs rounded border border-border bg-surface px-2 py-1.5">
                            <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span className="font-medium">{b.startTime}–{b.endTime}</span>
                            <span className="text-muted-foreground truncate">{b.purpose}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-muted/20 flex flex-col items-center justify-center p-10 text-center">
                <Building2 className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">Select a room to see availability and details</p>
              </div>
            )}
          </div>
        </WorkspacePanel>
      )}

      {/* MY BOOKINGS TAB */}
      {activeTab === "my-bookings" && (
        <WorkspacePanel title="My Bookings" description="Your upcoming and past room reservations" icon={Calendar} delay={0}>
          {myBookings.length === 0 ? (
            <div className="py-16 text-center">
              <Calendar className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">You have no active bookings.</p>
              <button className="btn-primary mt-4 px-4 py-2 rounded-lg text-sm" onClick={() => setActiveTab("book")}>
                Book a Room
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {myBookings.map(b => {
                const isPast = b.date < new Date().toISOString().split("T")[0];
                return (
                  <div key={b.id} className={cn(
                    "rounded-xl border border-border p-4 flex items-start justify-between gap-4",
                    isPast && "opacity-60"
                  )}>
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-foreground">{b.roomName}</p>
                        <StatusBadge variant={b.status === "Confirmed" ? "success" : "neutral"}>{b.status}</StatusBadge>
                        {isPast && <StatusBadge variant="neutral">Past</StatusBadge>}
                      </div>
                      <p className="text-xs text-muted-foreground">{b.purpose}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1.5">
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{b.date}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{b.startTime}–{b.endTime}</span>
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" />{b.attendees} attendees</span>
                      </div>
                    </div>
                    {!isPast && (
                      <button
                        onClick={() => setCancelTarget(b.id)}
                        className="btn-secondary shrink-0 px-3 py-1.5 text-xs rounded-lg text-red-600 hover:bg-red-50"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </WorkspacePanel>
      )}

      {/* Room Detail Modal */}
      {showRoomDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-xl space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-semibold text-foreground">{showRoomDetail.name}</h2>
                <p className="text-sm text-muted-foreground mt-0.5">{showRoomDetail.block} · {showRoomDetail.floor} floor</p>
              </div>
              <button onClick={() => setShowRoomDetail(null)} className="btn-ghost p-1 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Room Type", value: showRoomDetail.type },
                { label: "Capacity", value: `${showRoomDetail.capacity} seats` },
                { label: "Block", value: showRoomDetail.block },
                { label: "Floor", value: showRoomDetail.floor },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-lg border border-border bg-muted/30 px-3 py-2">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-sm font-medium text-foreground mt-0.5">{value}</p>
                </div>
              ))}
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Amenities</p>
              <div className="flex flex-wrap gap-1.5">
                {showRoomDetail.amenities.map(a => (
                  <span key={a} className="text-xs rounded border border-border bg-muted/50 px-2 py-1">{a}</span>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowRoomDetail(null)} className="btn-secondary px-4 py-2 rounded-lg text-sm">Close</button>
              <button
                onClick={() => {
                  setBookingForm(prev => ({ ...prev, roomId: showRoomDetail.id }));
                  setSelectedRoom(showRoomDetail);
                  setShowRoomDetail(null);
                  setActiveTab("book");
                }}
                className="btn-primary px-4 py-2 rounded-lg text-sm"
              >
                Book This Room
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-xl space-y-4">
            <h2 className="text-base font-semibold text-foreground">Cancel Booking</h2>
            <p className="text-sm text-muted-foreground">Are you sure you want to cancel this booking? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setCancelTarget(null)} className="btn-secondary flex-1 py-2 rounded-lg text-sm">Keep Booking</button>
              <button
                onClick={() => handleCancelBooking(cancelTarget)}
                disabled={cancelBooking.isPending}
                className="btn-primary flex-1 py-2 rounded-lg text-sm bg-red-600 hover:bg-red-700 disabled:opacity-50"
              >
                {cancelBooking.isPending ? "Cancelling…" : "Yes, Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
