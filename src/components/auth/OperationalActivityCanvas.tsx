import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Zone {
  id: string;
  label: string;
  sublabel: string;
  x: number;
  y: number;
  w: number;
  h: number;
  status: "active" | "busy" | "normal";
  activity: string;
}

const ZONES: Zone[] = [
  { id: "academic", label: "Academic Block", sublabel: "2,840 students", x: 8, y: 12, w: 28, h: 22, status: "active", activity: "12 classes in session" },
  { id: "library", label: "Knowledge Center", sublabel: "260 visitors", x: 40, y: 8, w: 22, h: 18, status: "busy", activity: "Peak reading hours" },
  { id: "labs", label: "Research Labs", sublabel: "92% utilized", x: 66, y: 14, w: 26, h: 20, status: "busy", activity: "Lab bookings active" },
  { id: "events", label: "Event Arena", sublabel: "3 live events", x: 12, y: 42, w: 24, h: 20, status: "active", activity: "Hackathon registration open" },
  { id: "services", label: "Service Hub", sublabel: "14 open tickets", x: 42, y: 38, w: 22, h: 18, status: "normal", activity: "Avg resolution 4.2h" },
  { id: "mobility", label: "Mobility Center", sublabel: "4 routes active", x: 68, y: 40, w: 24, h: 18, status: "active", activity: "167 passengers tracked" },
  { id: "assets", label: "Asset Operations", sublabel: "98% healthy", x: 28, y: 68, w: 26, h: 20, status: "normal", activity: "HVAC maintenance scheduled" },
  { id: "admin", label: "Administration", sublabel: "All systems go", x: 58, y: 66, w: 28, h: 22, status: "active", activity: "Campus pulse stable" },
];

const FLOWS = [
  { from: "academic", to: "library" },
  { from: "academic", to: "labs" },
  { from: "library", to: "services" },
  { from: "events", to: "mobility" },
  { from: "labs", to: "assets" },
  { from: "services", to: "admin" },
  { from: "mobility", to: "admin" },
];

const STATUS_COLORS = {
  active: { fill: "hsl(221 83% 53% / 0.12)", stroke: "hsl(221 83% 53% / 0.4)", dot: "bg-blue-500" },
  busy: { fill: "hsl(38 92% 50% / 0.1)", stroke: "hsl(38 92% 50% / 0.35)", dot: "bg-amber-500" },
  normal: { fill: "hsl(160 84% 39% / 0.08)", stroke: "hsl(160 84% 39% / 0.3)", dot: "bg-emerald-500" },
};

function zoneCenter(id: string) {
  const z = ZONES.find(z => z.id === id)!;
  return { x: z.x + z.w / 2, y: z.y + z.h / 2 };
}

const LIVE_UPDATES = [
  "Student check-in · Block A",
  "Resource booking confirmed · Lab 204",
  "Service ticket resolved · Maintenance",
  "Event registration · Hackathon 2.0",
  "Bus Route 2 at 94% capacity",
  "Faculty session started · CS Dept",
];

export function OperationalActivityCanvas() {
  const [tick, setTick] = useState(0);
  const [liveIndex, setLiveIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick(v => v + 1), 3000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setLiveIndex(v => (v + 1) % LIVE_UPDATES.length), 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative h-full min-h-[480px] w-full overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {/* Ambient grid */}
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: "linear-gradient(hsl(214 32% 91%) 1px, transparent 1px), linear-gradient(90deg, hsl(214 32% 91%) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Campus zones */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 90" preserveAspectRatio="xMidYMid meet">
        {FLOWS.map((flow, i) => {
          const from = zoneCenter(flow.from);
          const to = zoneCenter(flow.to);
          return (
            <g key={`${flow.from}-${flow.to}`}>
              <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="hsl(214 32% 91%)" strokeWidth="0.15" />
              <motion.circle
                r="0.35"
                fill="hsl(221 83% 53%)"
                initial={{ cx: from.x, cy: from.y, opacity: 0 }}
                animate={{
                  cx: [from.x, to.x],
                  cy: [from.y, to.y],
                  opacity: [0, 0.9, 0],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  delay: i * 0.5 + (tick % 3) * 0.2,
                  ease: "easeInOut",
                }}
              />
            </g>
          );
        })}
      </svg>

      {/* Zone cards */}
      {ZONES.map((zone, i) => {
        const colors = STATUS_COLORS[zone.status];
        return (
          <motion.div
            key={zone.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.4 }}
            className="absolute rounded-lg border backdrop-blur-sm"
            style={{
              left: `${zone.x}%`,
              top: `${zone.y}%`,
              width: `${zone.w}%`,
              height: `${zone.h}%`,
              background: colors.fill,
              borderColor: colors.stroke,
            }}
          >
            <div className="flex h-full flex-col justify-between p-2 sm:p-2.5">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${colors.dot} animate-pulse`} />
                  <span className="text-[9px] sm:text-[10px] font-semibold text-foreground leading-tight truncate">{zone.label}</span>
                </div>
                <p className="text-[8px] sm:text-[9px] text-muted-foreground mt-0.5 truncate">{zone.sublabel}</p>
              </div>
              <p className="text-[7px] sm:text-[8px] text-muted-foreground/80 leading-snug line-clamp-2">{zone.activity}</p>
            </div>
          </motion.div>
        );
      })}

      {/* Live activity ticker */}
      <div className="absolute bottom-0 inset-x-0 border-t border-border/60 bg-white/80 backdrop-blur-md px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 shrink-0 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground shrink-0">Live</span>
          <AnimatePresence mode="wait">
            <motion.p
              key={liveIndex}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.3 }}
              className="text-xs text-foreground truncate"
            >
              {LIVE_UPDATES[liveIndex]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      {/* Header label */}
      <div className="absolute top-4 left-4 right-4 flex items-start justify-between pointer-events-none">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Campus Intelligence Center</p>
          <p className="text-sm font-semibold text-foreground mt-0.5">Operational Activity Canvas</p>
        </div>
        <div className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-medium text-emerald-700">
          Campus Active
        </div>
      </div>
    </div>
  );
}
