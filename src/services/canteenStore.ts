// Canteen mock service — localStorage-backed. Replace with real API calls when backend is ready.

function loadStore<T>(key: string, initial: T): T {
  try {
    const raw = localStorage.getItem(`ciq_${key}`);
    return raw ? (JSON.parse(raw) as T) : initial;
  } catch {
    return initial;
  }
}

function saveStore<T>(key: string, data: T): void {
  localStorage.setItem(`ciq_${key}`, JSON.stringify(data));
}

// ── Types ──────────────────────────────────────────────────────────────────

export type MealCategory = "Breakfast" | "Lunch" | "Snacks" | "Beverages";

export interface CanteenMenuItem {
  id: string;
  name: string;
  category: MealCategory;
  price: number;
  rating: number;
  available: boolean;
  isSpicy?: boolean;
  isVeg: boolean;
  tag?: string;
  description: string;
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  qty: number;
}

export type OrderStatus = "Pending" | "Accepted" | "Preparing" | "Ready" | "Completed" | "Cancelled";

export interface CanteenOrder {
  id: string;
  studentId: string;
  studentName: string;
  items: OrderItem[];
  totalPrice: number;
  orderTime: string;
  pickupTime: string;
  status: OrderStatus;
}

// ── Seed data ───────────────────────────────────────────────────────────────

const INITIAL_MENU: CanteenMenuItem[] = [
  { id: "b1", name: "Masala Dosa", category: "Breakfast", price: 45, rating: 4.6, available: true, isVeg: true, description: "Crispy rice crepe with spiced potato filling, served with sambar & chutneys" },
  { id: "b2", name: "Idli Sambar (4 pcs)", category: "Breakfast", price: 35, rating: 4.4, available: true, isVeg: true, description: "Steamed rice cakes with lentil soup and coconut chutney" },
  { id: "b3", name: "Poha", category: "Breakfast", price: 30, rating: 4.2, available: true, isVeg: true, description: "Flattened rice with mustard, curry leaves, peanuts and onions" },
  { id: "b4", name: "Egg Bhurji with Toast", category: "Breakfast", price: 50, rating: 4.5, available: true, isVeg: false, tag: "Popular", description: "Scrambled spiced eggs with buttered toast" },
  { id: "b5", name: "Upma", category: "Breakfast", price: 28, rating: 3.9, available: false, isVeg: true, description: "Semolina porridge with mixed vegetables and tempering" },
  { id: "l1", name: "Veg Thali", category: "Lunch", price: 80, rating: 4.3, available: true, isVeg: true, tag: "Best Value", description: "Rice, 2 sabzis, dal, roti, salad, pickle and papad" },
  { id: "l2", name: "Chicken Biryani", category: "Lunch", price: 110, rating: 4.7, available: true, isVeg: false, isSpicy: true, tag: "Popular", description: "Fragrant basmati rice layered with tender chicken and saffron" },
  { id: "l3", name: "Paneer Butter Masala + Roti", category: "Lunch", price: 95, rating: 4.5, available: true, isVeg: true, description: "Creamy tomato-based paneer curry with 3 rotis" },
  { id: "l4", name: "Rajma Chawal", category: "Lunch", price: 70, rating: 4.2, available: true, isVeg: true, description: "Slow-cooked kidney bean curry served over steamed rice" },
  { id: "l5", name: "Egg Fried Rice + Manchurian", category: "Lunch", price: 90, rating: 4.4, available: true, isVeg: false, isSpicy: true, description: "Wok-tossed fried rice with veg manchurian gravy" },
  { id: "l6", name: "Dal Makhani + Naan", category: "Lunch", price: 85, rating: 4.6, available: false, isVeg: true, description: "Slow-cooked black lentils with butter, served with 2 naans" },
  { id: "s1", name: "Samosa (2 pcs)", category: "Snacks", price: 20, rating: 4.5, available: true, isVeg: true, tag: "Popular", description: "Crispy pastry filled with spiced potatoes and peas" },
  { id: "s2", name: "Veg Puff", category: "Snacks", price: 18, rating: 4.1, available: true, isVeg: true, description: "Flaky pastry shell with a spiced mixed vegetable filling" },
  { id: "s3", name: "Bread Omelette", category: "Snacks", price: 35, rating: 4.3, available: true, isVeg: false, description: "Two-egg omelette sandwiched in buttered bread with veggies" },
  { id: "s4", name: "Maggi Noodles", category: "Snacks", price: 30, rating: 4.2, available: true, isVeg: true, description: "Classic masala instant noodles with veggies, served hot" },
  { id: "s5", name: "Pav Bhaji", category: "Snacks", price: 55, rating: 4.6, available: true, isVeg: true, isSpicy: true, tag: "Today's Special", description: "Spiced mashed vegetable curry with buttered pav rolls" },
  { id: "v1", name: "Cutting Chai", category: "Beverages", price: 12, rating: 4.8, available: true, isVeg: true, tag: "Popular", description: "Strong, sweet half-cup of masala tea — the campus staple" },
  { id: "v2", name: "Filter Coffee", category: "Beverages", price: 18, rating: 4.7, available: true, isVeg: true, description: "South Indian decoction with milk, served in a traditional cup" },
  { id: "v3", name: "Mango Lassi", category: "Beverages", price: 40, rating: 4.5, available: true, isVeg: true, description: "Chilled sweetened yoghurt drink blended with Alphonso mango" },
  { id: "v4", name: "Cold Coffee (Thick)", category: "Beverages", price: 55, rating: 4.4, available: true, isVeg: true, tag: "New", description: "Blended iced coffee with milk and chocolate sauce, topped with cream" },
  { id: "v5", name: "Fresh Lime Soda", category: "Beverages", price: 25, rating: 4.3, available: true, isVeg: true, description: "Sweet or salted freshly squeezed lime with chilled soda" },
];

const INITIAL_ORDERS: CanteenOrder[] = [];

// ── Menu store ───────────────────────────────────────────────────────────────

export const menuStore = {
  getAll: (): CanteenMenuItem[] => loadStore<CanteenMenuItem[]>("canteen_menu", INITIAL_MENU),
  save: (items: CanteenMenuItem[]) => saveStore("canteen_menu", items),
  add: (item: Omit<CanteenMenuItem, "id">) => {
    const all = menuStore.getAll();
    const next: CanteenMenuItem = { ...item, id: `mi_${Date.now()}` };
    menuStore.save([...all, next]);
    return next;
  },
  update: (id: string, patch: Partial<CanteenMenuItem>) => {
    menuStore.save(menuStore.getAll().map(m => m.id === id ? { ...m, ...patch } : m));
  },
  delete: (id: string) => {
    menuStore.save(menuStore.getAll().filter(m => m.id !== id));
  },
  toggleAvailability: (id: string) => {
    menuStore.save(menuStore.getAll().map(m => m.id === id ? { ...m, available: !m.available } : m));
  },
};

// ── Order store ──────────────────────────────────────────────────────────────

export const orderStore = {
  getAll: (): CanteenOrder[] => loadStore<CanteenOrder[]>("canteen_orders", INITIAL_ORDERS),
  save: (orders: CanteenOrder[]) => saveStore("canteen_orders", orders),
  place: (order: Omit<CanteenOrder, "id" | "orderTime" | "status">): CanteenOrder => {
    const all = orderStore.getAll();
    const next: CanteenOrder = {
      ...order,
      id: `ORD${String(all.length + 1).padStart(4, "0")}`,
      orderTime: new Date().toISOString(),
      status: "Pending",
    };
    orderStore.save([next, ...all]);
    return next;
  },
  updateStatus: (id: string, status: OrderStatus) => {
    orderStore.save(orderStore.getAll().map(o => o.id === id ? { ...o, status } : o));
  },
  getByStudent: (studentId: string): CanteenOrder[] =>
    orderStore.getAll().filter(o => o.studentId === studentId),
};
