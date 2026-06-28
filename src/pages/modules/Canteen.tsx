import { useState } from "react";
import { motion } from "framer-motion";
import {
  UtensilsCrossed, Clock, Star, ShoppingCart, Plus, Minus,
  Flame, Leaf, Tag, Coffee, X, Search, ClipboardList, ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import {
  useCanteenMenu, useMyOrders, usePlaceOrder,
  type CanteenMenuItem, type OrderStatus,
} from "@/hooks/useCanteenData";

type MealCategory = "All" | "Breakfast" | "Lunch" | "Snacks" | "Beverages";

const TIMING = [
  { meal: "Breakfast", time: "7:30 AM – 9:30 AM" },
  { meal: "Lunch", time: "12:00 PM – 2:30 PM" },
  { meal: "Snacks", time: "4:00 PM – 6:00 PM" },
  { meal: "Beverages", time: "7:30 AM – 7:00 PM" },
];

const CATEGORIES: MealCategory[] = ["All", "Breakfast", "Lunch", "Snacks", "Beverages"];

const CAT_ICONS: Record<Exclude<MealCategory, "All">, typeof Coffee> = {
  Breakfast: UtensilsCrossed,
  Lunch: UtensilsCrossed,
  Snacks: Tag,
  Beverages: Coffee,
};

const PICKUP_SLOTS = [
  "12:00 PM", "12:15 PM", "12:30 PM", "12:45 PM",
  "1:00 PM", "1:15 PM", "1:30 PM", "5:00 PM", "5:30 PM", "6:00 PM",
];

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  Pending:   { label: "Pending",    color: "text-amber-700",  bg: "bg-amber-50 border-amber-200" },
  Accepted:  { label: "Accepted",   color: "text-blue-700",   bg: "bg-blue-50 border-blue-200" },
  Preparing: { label: "Preparing",  color: "text-violet-700", bg: "bg-violet-50 border-violet-200" },
  Ready:     { label: "Ready ✓",    color: "text-emerald-700",bg: "bg-emerald-50 border-emerald-200" },
  Completed: { label: "Completed",  color: "text-muted-foreground", bg: "bg-muted/50 border-border" },
  Cancelled: { label: "Cancelled",  color: "text-red-700",    bg: "bg-red-50 border-red-200" },
};

export default function Canteen() {
  const { user } = useAuth();
  const userId = user?.id ?? "guest";
  const userName = user?.name ?? "Guest";

  const { data: menuItems = [] } = useCanteenMenu();
  const { data: myOrders = [] } = useMyOrders(userId);
  const placeOrder = usePlaceOrder();

  const [activeTab, setActiveTab] = useState<"menu" | "my-orders">("menu");
  const [activeCategory, setActiveCategory] = useState<MealCategory>("All");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [pickupTime, setPickupTime] = useState(PICKUP_SLOTS[2]);
  const [vegOnly, setVegOnly] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = menuItems.filter(item =>
    (activeCategory === "All" || item.category === activeCategory) &&
    (!vegOnly || item.isVeg) &&
    (!search || item.name.toLowerCase().includes(search.toLowerCase()))
  );

  const specials = menuItems.filter(m => m.available && (m.tag === "Today's Special" || m.tag === "Popular")).slice(0, 3);

  const addToCart = (id: string) => setCart(c => ({ ...c, [id]: (c[id] || 0) + 1 }));
  const removeFromCart = (id: string) =>
    setCart(c => {
      const next = { ...c };
      if (next[id] > 1) next[id]--;
      else delete next[id];
      return next;
    });

  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);
  const cartTotal = Object.entries(cart).reduce((sum, [id, qty]) => {
    const item = menuItems.find(m => m.id === id);
    return sum + (item?.price ?? 0) * qty;
  }, 0);

  const activeOrders = myOrders.filter(o => o.status !== "Completed" && o.status !== "Cancelled");

  function handleConfirmOrder() {
    const items = Object.entries(cart).map(([id, qty]) => {
      const item = menuItems.find(m => m.id === id)!;
      return { menuItemId: id, name: item.name, price: item.price, qty };
    });
    placeOrder.mutate(
      { studentId: userId, studentName: userName, items, totalPrice: cartTotal, pickupTime },
      {
        onSuccess: (order) => {
          toast.success(`Order ${order.id} placed! Pickup at ${pickupTime}.`, { duration: 6000 });
          setCart({});
          setCheckoutOpen(false);
          setActiveTab("my-orders");
        },
        onError: () => toast.error("Failed to place order. Try again."),
      }
    );
  }

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
            <UtensilsCrossed className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">Campus Canteen</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {menuItems.filter(m => m.available).length} items available today
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeOrders.length > 0 && (
            <button
              onClick={() => setActiveTab("my-orders")}
              className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors"
            >
              <ClipboardList className="h-4 w-4" />
              {activeOrders.length} active order{activeOrders.length > 1 ? "s" : ""}
            </button>
          )}
          {cartCount > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5"
            >
              <ShoppingCart className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">{cartCount} item{cartCount > 1 ? "s" : ""}</span>
              <span className="text-sm font-bold text-foreground">₹{cartTotal}</span>
              <button
                onClick={() => setCheckoutOpen(true)}
                className="rounded-lg bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Order
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-border bg-muted/40 p-1 w-fit">
        {(["menu", "my-orders"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "relative rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
              activeTab === tab ? "bg-surface shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab === "menu" ? "Menu" : "My Orders"}
            {tab === "my-orders" && activeOrders.length > 0 && (
              <span className="ml-1.5 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                {activeOrders.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* MENU TAB */}
      {activeTab === "menu" && (
        <>
          {/* Timings strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3"
          >
            {TIMING.map(t => (
              <div key={t.meal} className="flex items-center gap-2.5 rounded-xl border border-border bg-surface px-4 py-3">
                <Clock className="h-3.5 w-3.5 shrink-0 text-primary" />
                <div>
                  <p className="text-xs font-semibold text-foreground">{t.meal}</p>
                  <p className="text-[11px] text-muted-foreground">{t.time}</p>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Today's specials */}
          {specials.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-amber-500" />
                <h2 className="text-sm font-semibold text-foreground">Today's Highlights</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {specials.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="relative rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4 overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 rounded-bl-2xl bg-amber-500 px-2.5 py-1 text-[10px] font-bold text-white">
                      {item.tag}
                    </div>
                    <p className="text-sm font-semibold text-foreground mt-3">{item.name}</p>
                    <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed line-clamp-2">{item.description}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-base font-bold text-foreground">₹{item.price}</span>
                      <button
                        onClick={() => addToCart(item.id)}
                        className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                      >
                        <Plus className="h-3 w-3" /> Add
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Category tabs */}
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map(cat => (
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
                  const Icon = CAT_ICONS[cat];
                  return <Icon className="h-3 w-3" />;
                })()}
                {cat}
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums ${
                  activeCategory === cat ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>
                  {cat === "All" ? menuItems.length : menuItems.filter(m => m.category === cat).length}
                </span>
              </button>
            ))}
          </div>

          {/* Search & filters */}
          <div className="flex gap-2 flex-wrap items-center">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search menu items…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm text-foreground focus:border-primary/50 focus:outline-none transition-colors"
              />
            </div>
            <button
              onClick={() => setVegOnly(!vegOnly)}
              className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all ${
                vegOnly ? "bg-emerald-600 border-emerald-600 text-white" : "border-border bg-surface text-muted-foreground hover:border-emerald-600 hover:text-emerald-700"
              }`}
            >
              <Leaf className="h-3 w-3" /> Veg Only
            </button>
          </div>

          {/* Menu grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.length === 0 && (
              <div className="col-span-3 py-8 text-center text-muted-foreground text-sm">No items match your search.</div>
            )}
            {filtered.map((item, i) => (
              <MenuCard
                key={item.id}
                item={item}
                index={i}
                qty={cart[item.id] || 0}
                onAdd={() => addToCart(item.id)}
                onRemove={() => removeFromCart(item.id)}
              />
            ))}
          </div>
        </>
      )}

      {/* MY ORDERS TAB */}
      {activeTab === "my-orders" && (
        <div className="space-y-3">
          {myOrders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border py-16 text-center">
              <ClipboardList className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">You haven't placed any orders yet.</p>
              <button
                className="btn-primary mt-4 px-4 py-2 rounded-lg text-sm"
                onClick={() => setActiveTab("menu")}
              >
                Browse Menu
              </button>
            </div>
          ) : (
            myOrders.map(order => {
              const sc = STATUS_CONFIG[order.status];
              return (
                <div key={order.id} className="rounded-2xl border border-border bg-surface p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-foreground">{order.id}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(order.orderTime).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })} · Pickup {order.pickupTime}
                      </p>
                    </div>
                    <span className={cn("rounded-full border px-3 py-1 text-xs font-semibold", sc.bg, sc.color)}>
                      {sc.label}
                    </span>
                  </div>

                  {/* Status progress bar */}
                  {order.status !== "Cancelled" && (
                    <StatusTracker status={order.status} />
                  )}

                  <div className="space-y-1.5">
                    {order.items.map(item => (
                      <div key={item.menuItemId} className="flex items-center justify-between text-sm">
                        <span className="text-foreground">{item.name} × {item.qty}</span>
                        <span className="text-muted-foreground tabular-nums">₹{item.price * item.qty}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between border-t border-border pt-2 text-sm font-semibold">
                    <span className="text-foreground">Total</span>
                    <span className="text-foreground">₹{order.totalPrice}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Checkout / Order Modal */}
      {checkoutOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm"
          onClick={() => setCheckoutOpen(false)}
        >
          <div
            className="workspace-panel w-full max-w-md p-6 space-y-4 m-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" /> Order Summary
              </h2>
              <button onClick={() => setCheckoutOpen(false)} className="p-1 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {Object.entries(cart).map(([id, qty]) => {
                const item = menuItems.find(m => m.id === id);
                if (!item) return null;
                return (
                  <div key={id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className={`h-3 w-3 rounded-sm border-2 ${item.isVeg ? "border-emerald-600" : "border-red-500"}`} />
                      <span>{item.name} × {qty}</span>
                    </div>
                    <span className="font-medium tabular-nums">₹{item.price * qty}</span>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-border pt-3">
              <div className="flex justify-between text-base font-bold">
                <span>Total</span><span>₹{cartTotal}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="section-label">Pickup Time</label>
              <div className="relative">
                <select
                  value={pickupTime}
                  onChange={e => setPickupTime(e.target.value)}
                  className="w-full input-warm px-3 py-2.5 text-sm appearance-none"
                >
                  {PICKUP_SLOTS.map(t => <option key={t}>{t}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setCheckoutOpen(false)}
                className="btn-secondary flex-1 py-2.5 text-sm rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmOrder}
                disabled={placeOrder.isPending}
                className="btn-primary flex-1 py-2.5 text-sm rounded-lg font-semibold disabled:opacity-50"
              >
                {placeOrder.isPending ? "Placing…" : "Place Order"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Status Tracker ─────────────────────────────────────────────────────────

const STATUS_STEPS: OrderStatus[] = ["Pending", "Accepted", "Preparing", "Ready", "Completed"];

function StatusTracker({ status }: { status: OrderStatus }) {
  const currentIdx = STATUS_STEPS.indexOf(status as typeof STATUS_STEPS[number]);
  return (
    <div className="flex items-center gap-0">
      {STATUS_STEPS.map((step, i) => {
        const done = i <= currentIdx;
        const isLast = i === STATUS_STEPS.length - 1;
        return (
          <div key={step} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center shrink-0">
              <div className={cn(
                "h-2.5 w-2.5 rounded-full border-2 transition-colors",
                done ? "border-primary bg-primary" : "border-border bg-surface"
              )} />
              <span className="text-[9px] text-muted-foreground mt-1 text-center leading-tight whitespace-nowrap">
                {step}
              </span>
            </div>
            {!isLast && (
              <div className={cn(
                "h-0.5 flex-1 mx-1 transition-colors",
                i < currentIdx ? "bg-primary" : "bg-border"
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Menu Card ──────────────────────────────────────────────────────────────

interface MenuCardProps {
  item: CanteenMenuItem;
  index: number;
  qty: number;
  onAdd: () => void;
  onRemove: () => void;
}

function MenuCard({ item, index, qty, onAdd, onRemove }: MenuCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className={`group rounded-2xl border bg-surface shadow-sm transition-all ${
        item.available
          ? "border-border hover:border-primary/25 hover:shadow-md"
          : "border-border opacity-55"
      }`}
    >
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex h-4 w-4 items-center justify-center rounded border-2 ${
              item.isVeg ? "border-emerald-600" : "border-red-500"
            }`}>
              <span className={`h-2 w-2 rounded-full ${item.isVeg ? "bg-emerald-600" : "bg-red-500"}`} />
            </span>
            {item.isSpicy && <Flame className="h-3.5 w-3.5 text-orange-500" />}
            {item.isVeg && <Leaf className="h-3.5 w-3.5 text-emerald-600" />}
            {item.tag && item.tag !== "Today's Special" && (
              <span className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                {item.tag}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <span className="text-[11px] font-semibold text-foreground tabular-nums">{item.rating}</span>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-foreground">{item.name}</h3>
          <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed line-clamp-2">{item.description}</p>
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-base font-bold text-foreground">₹{item.price}</span>

          {!item.available ? (
            <span className="rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-xs font-medium text-muted-foreground">
              Unavailable
            </span>
          ) : qty === 0 ? (
            <button
              onClick={onAdd}
              className="flex items-center gap-1.5 rounded-xl border border-primary bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Add
            </button>
          ) : (
            <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-2 py-1">
              <button onClick={onRemove} className="rounded-lg p-1 hover:bg-primary/10 transition-colors">
                <Minus className="h-3.5 w-3.5 text-primary" />
              </button>
              <span className="w-5 text-center text-sm font-bold text-primary tabular-nums">{qty}</span>
              <button onClick={onAdd} className="rounded-lg p-1 hover:bg-primary/10 transition-colors">
                <Plus className="h-3.5 w-3.5 text-primary" />
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
