import { useState } from "react";
import { motion } from "framer-motion";
import {
  UtensilsCrossed, Clock, Star, ShoppingCart, Plus, Minus,
  CheckCircle2, Flame, Leaf, Tag, Coffee, X, Search
} from "lucide-react";
import { toast } from "sonner";

type MealCategory = "All" | "Breakfast" | "Lunch" | "Snacks" | "Beverages";

interface MenuItem {
  id: string;
  name: string;
  category: Exclude<MealCategory, "All">;
  price: number;
  rating: number;
  available: boolean;
  isSpicy?: boolean;
  isVeg: boolean;
  tag?: string;
  description: string;
}

const MENU: MenuItem[] = [
  // Breakfast
  { id: "b1", name: "Masala Dosa", category: "Breakfast", price: 45, rating: 4.6, available: true, isVeg: true, description: "Crispy rice crepe with spiced potato filling, served with sambar & chutneys" },
  { id: "b2", name: "Idli Sambar (4 pcs)", category: "Breakfast", price: 35, rating: 4.4, available: true, isVeg: true, description: "Steamed rice cakes with lentil soup and coconut chutney" },
  { id: "b3", name: "Poha", category: "Breakfast", price: 30, rating: 4.2, available: true, isVeg: true, description: "Flattened rice with mustard, curry leaves, peanuts and onions" },
  { id: "b4", name: "Egg Bhurji with Toast", category: "Breakfast", price: 50, rating: 4.5, available: true, isVeg: false, tag: "Popular", description: "Scrambled spiced eggs with buttered toast" },
  { id: "b5", name: "Upma", category: "Breakfast", price: 28, rating: 3.9, available: false, isVeg: true, description: "Semolina porridge with mixed vegetables and tempering" },

  // Lunch
  { id: "l1", name: "Veg Thali", category: "Lunch", price: 80, rating: 4.3, available: true, isVeg: true, tag: "Best Value", description: "Rice, 2 sabzis, dal, roti, salad, pickle and papad" },
  { id: "l2", name: "Chicken Biryani", category: "Lunch", price: 110, rating: 4.7, available: true, isVeg: false, isSpicy: true, tag: "Popular", description: "Fragrant basmati rice layered with tender chicken and saffron" },
  { id: "l3", name: "Paneer Butter Masala + Roti", category: "Lunch", price: 95, rating: 4.5, available: true, isVeg: true, description: "Creamy tomato-based paneer curry with 3 rotis" },
  { id: "l4", name: "Rajma Chawal", category: "Lunch", price: 70, rating: 4.2, available: true, isVeg: true, description: "Slow-cooked kidney bean curry served over steamed rice" },
  { id: "l5", name: "Egg Fried Rice + Manchurian", category: "Lunch", price: 90, rating: 4.4, available: true, isVeg: false, isSpicy: true, description: "Wok-tossed fried rice with veg manchurian gravy" },
  { id: "l6", name: "Dal Makhani + Naan", category: "Lunch", price: 85, rating: 4.6, available: false, isVeg: true, description: "Slow-cooked black lentils with butter, served with 2 naans" },

  // Snacks
  { id: "s1", name: "Samosa (2 pcs)", category: "Snacks", price: 20, rating: 4.5, available: true, isVeg: true, tag: "Popular", description: "Crispy pastry filled with spiced potatoes and peas" },
  { id: "s2", name: "Veg Puff", category: "Snacks", price: 18, rating: 4.1, available: true, isVeg: true, description: "Flaky pastry shell with a spiced mixed vegetable filling" },
  { id: "s3", name: "Bread Omelette", category: "Snacks", price: 35, rating: 4.3, available: true, isVeg: false, description: "Two-egg omelette sandwiched in buttered bread with veggies" },
  { id: "s4", name: "Maggi Noodles", category: "Snacks", price: 30, rating: 4.2, available: true, isVeg: true, description: "Classic masala instant noodles with veggies, served hot" },
  { id: "s5", name: "Pav Bhaji", category: "Snacks", price: 55, rating: 4.6, available: true, isVeg: true, isSpicy: true, tag: "Today's Special", description: "Spiced mashed vegetable curry with buttered pav rolls" },

  // Beverages
  { id: "v1", name: "Cutting Chai", category: "Beverages", price: 12, rating: 4.8, available: true, isVeg: true, tag: "Popular", description: "Strong, sweet half-cup of masala tea — the campus staple" },
  { id: "v2", name: "Filter Coffee", category: "Beverages", price: 18, rating: 4.7, available: true, isVeg: true, description: "South Indian decoction with milk, served in a traditional cup" },
  { id: "v3", name: "Mango Lassi", category: "Beverages", price: 40, rating: 4.5, available: true, isVeg: true, description: "Chilled sweetened yoghurt drink blended with Alphonso mango" },
  { id: "v4", name: "Cold Coffee (Thick)", category: "Beverages", price: 55, rating: 4.4, available: true, isVeg: true, tag: "New", description: "Blended iced coffee with milk and chocolate sauce, topped with cream" },
  { id: "v5", name: "Fresh Lime Soda", category: "Beverages", price: 25, rating: 4.3, available: true, isVeg: true, description: "Sweet or salted freshly squeezed lime with chilled soda" },
];

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

export default function Canteen() {
  const [activeCategory, setActiveCategory] = useState<MealCategory>("All");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [pickupTime, setPickupTime] = useState("12:30 PM");
  const [vegOnly, setVegOnly] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = MENU.filter(item =>
    (activeCategory === "All" || item.category === activeCategory) &&
    (!vegOnly || item.isVeg) &&
    (!search || item.name.toLowerCase().includes(search.toLowerCase()))
  );

  const specials = MENU.filter(m => m.tag === "Today's Special" || m.tag === "Popular").slice(0, 3);

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
    const item = MENU.find(m => m.id === id);
    return sum + (item?.price ?? 0) * qty;
  }, 0);

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
              {MENU.filter(m => m.available).length} items available today
            </p>
          </div>
        </div>

        {/* Cart summary */}
        {cartCount > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5"
          >
            <ShoppingCart className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-primary">{cartCount} item{cartCount > 1 ? "s" : ""}</span>
            <span className="text-sm font-bold text-foreground">₹{cartTotal}</span>
            <button onClick={() => setCheckoutOpen(true)} className="rounded-lg bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
              Pre-order
            </button>
          </motion.div>
        )}
      </motion.div>

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
              {cat === "All" ? MENU.length : MENU.filter(m => m.category === cat).length}
            </span>
          </button>
        ))}
      </div>

      {/* Search & filters */}
      <div className="flex gap-2 flex-wrap items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="text" placeholder="Search menu items…" value={search} onChange={e => setSearch(e.target.value)} className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm text-foreground focus:border-primary/50 focus:outline-none transition-colors" />
        </div>
        <button onClick={() => setVegOnly(!vegOnly)} className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all ${vegOnly ? "bg-emerald-600 border-emerald-600 text-white" : "border-border bg-surface text-muted-foreground hover:border-emerald-600 hover:text-emerald-700"}`}>
          <Leaf className="h-3 w-3" /> Veg Only
        </button>
      </div>

      {/* Menu grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.length === 0 && <div className="col-span-3 py-8 text-center text-muted-foreground text-sm">No items match your search.</div>}
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

      {/* Checkout Modal */}
      {checkoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm" onClick={() => setCheckoutOpen(false)}>
          <div className="workspace-panel w-full max-w-md p-6 space-y-4 m-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2"><ShoppingCart className="h-5 w-5" /> Pre-Order Summary</h2>
              <button onClick={() => setCheckoutOpen(false)} className="p-1 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {Object.entries(cart).map(([id, qty]) => {
                const item = MENU.find(m => m.id === id);
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
              <div className="flex justify-between text-base font-bold"><span>Total</span><span>₹{cartTotal}</span></div>
            </div>
            <div className="space-y-1.5">
              <label className="section-label">Pickup Time</label>
              <select value={pickupTime} onChange={e => setPickupTime(e.target.value)} className="w-full input-warm px-3 py-2.5 text-sm">
                {["12:00 PM", "12:15 PM", "12:30 PM", "12:45 PM", "1:00 PM", "1:15 PM", "1:30 PM"].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setCheckoutOpen(false)} className="btn-secondary flex-1 py-2.5 text-sm rounded-lg">Cancel</button>
              <button onClick={() => {
                const orderNo = `ORD${Date.now().toString().slice(-4)}`;
                toast.success(`Pre-order ${orderNo} confirmed! Ready at ${pickupTime}. Show this to the counter.`, { duration: 8000 });
                setCart({}); setCheckoutOpen(false);
              }} className="btn-primary flex-1 py-2.5 text-sm rounded-lg font-semibold">
                Confirm Pre-order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface MenuCardProps {
  item: MenuItem;
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
        {/* Top row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Veg/Non-veg indicator */}
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

        {/* Name & description */}
        <div>
          <h3 className="text-sm font-semibold text-foreground">{item.name}</h3>
          <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed line-clamp-2">{item.description}</p>
        </div>

        {/* Price & add/remove */}
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
