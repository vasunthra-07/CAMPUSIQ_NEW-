import { useCampusAssets } from "@/hooks/useCampusData";
import { fadeUpStyle } from "@/lib/motion";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { Wrench, CheckCircle, AlertTriangle, Activity, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AssetManagement() {
  const { data: assets, isLoading } = useCampusAssets();

  if (isLoading || !assets) {
    return <div className="flex h-64 items-center justify-center text-muted-foreground animate-pulse">Loading assets…</div>;
  }

  const activeCount = assets.filter(a => a.status === "Active").length;
  const maintCount = assets.filter(a => a.status === "Maintenance").length;
  const avgHealth = Math.round(assets.reduce((a, s) => a + s.health, 0) / assets.length);

  const getHealthColor = (h: number) => h >= 80 ? "hsl(145 60% 42%)" : h >= 60 ? "hsl(210 100% 60%)" : "hsl(0 84% 60%)";

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-10">
      <div style={fadeUpStyle(0)} className="border-b border-border/50 pb-6">
        <p className="section-label mb-1">Operations</p>
        <h1 className="text-3xl font-bold font-syne gradient-text-gold tracking-tight">Asset Management</h1>
        <p className="text-sm text-muted-foreground mt-1">{assets.length} tracked assets · IoT health monitoring</p>
      </div>

      <div className="grid grid-cols-3 gap-4" style={fadeUpStyle(1)}>
        {[
          { label: "Active Assets", value: activeCount, icon: CheckCircle, color: "text-emerald-400" },
          { label: "Under Maintenance", value: maintCount, icon: Wrench, color: "text-orange-400" },
          { label: "Avg Health Score", value: avgHealth, suffix: "%", icon: Activity, color: "text-blue-400" },
        ].map((s, i) => (
          <div key={s.label} className="card-warm p-5 text-center card-glow-hover" style={fadeUpStyle(i, 80)}>
            <s.icon className={cn("h-5 w-5 mx-auto mb-2", s.color)} />
            <p className="text-3xl font-bold font-mono gradient-text-gold"><AnimatedNumber value={s.value} suffix={s.suffix} /></p>
            <p className="text-[11px] text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={fadeUpStyle(2)}>
        {assets.map((asset, i) => {
          const hColor = getHealthColor(asset.health);
          return (
            <div key={asset.id} className="card-warm card-glow-hover p-5" style={fadeUpStyle(i, 60)}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Cpu className="h-4 w-4 text-accent" />
                    <p className="font-semibold text-foreground text-sm">{asset.name}</p>
                  </div>
                  <p className="text-[10px] text-muted-foreground font-mono">{asset.id} · {asset.category}</p>
                </div>
                <span className={cn("text-[10px] font-bold px-2.5 py-1 rounded-full border",
                  asset.status === "Active" ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10" : "border-orange-500/30 text-orange-400 bg-orange-500/10")}>
                  {asset.status}
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-muted-foreground">Health Score</span>
                  <span className="font-mono font-bold" style={{ color: hColor }}>{asset.health}%</span>
                </div>
                <div className="h-2 rounded-full bg-border overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${asset.health}%`, background: hColor }} />
                </div>
                <p className="text-[10px] text-muted-foreground pt-1">Last serviced: {asset.lastService}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
