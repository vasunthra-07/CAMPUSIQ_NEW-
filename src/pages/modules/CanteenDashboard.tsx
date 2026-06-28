import { useState } from "react";
import { toast } from "sonner";
import {
  UtensilsCrossed, Clock, CheckCircle2, AlertTriangle, ChefHat,
  Plus, Search, Edit2, Trash2, X, Leaf, Flame,
} from "lucide-react";
import {
  useCanteenMenu, useCanteenOrders, useUpdateOrderStatus, useAddMenuItem,
  useUpdateMenuItem, useDeleteMenuItem, useToggleMenuItemAvailability,
  type CanteenMenuItem, type CanteenOrder, type OrderStatus,
} from "@/hooks/useCanteenData";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { PageHeader, MetricTile, WorkspacePanel, StatusBadge } from "@/components/workspace";
import { cn } from "@/lib/utils";

const STATUS_SEQUENCE: Record<OrderStatus, OrderStatus | null> = {
  Pending:   "Accepted",
  Accepted:  "Preparing",
  Preparing: "Ready",
  Ready:     "Completed",
  Completed: null,
  Cancelled: null,
};

const STATUS_ACTIONS: Record<OrderStatus, string> = {
  Pending:   "Accept",
  Accepted:  "Start Preparing",
  Preparing: "Mark Ready",
  Ready:     "Complete",
  Completed: "",
  Cancelled: "",
};

const STATUS_BADGE: Record<OrderStatus, "warning" | "info" | "primary" | "success" | "neutral" | "danger"> = {
  Pending:   "warning",
  Accepted:  "info",
  Preparing: "primary",
  Ready:     "success",
  Completed: "neutral",
  Cancelled: "danger",
};

type MealCategory = "Breakfast" | "Lunch" | "Snacks" | "Beverages";
const CATEGORIES: MealCategory[] = ["Breakfast", "Lunch", "Snacks", "Beverages"];

const EMPTY_MENU_FORM: Omit<CanteenMenuItem, "id"> = {
  name: "", category: "Lunch", price: 0, rating: 4.0,
  available: true, isVeg: true, isSpicy: false, tag: "", description: "",
};

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

export default function CanteenDashboard() {
  const { data: orders = [] } = useCanteenOrders();
  const { data: menuItems = [] } = useCanteenMenu();
  const updateStatus = useUpdateOrderStatus();
  const addMenuItem = useAddMenuItem();
  const updateMenuItem = useUpdateMenuItem();
  const deleteMenuItem = useDeleteMenuItem();
  const toggleAvailability = useToggleMenuItemAvailability();

  const [activeTab, setActiveTab] = useState<"orders" | "menu">("orders");
  const [orderSearch, setOrderSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "All">("All");
  const [menuSearch, setMenuSearch] = useState("");
  const [menuCatFilter, setMenuCatFilter] = useState<MealCategory | "All">("All");

  const [menuModalOpen, setMenuModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CanteenMenuItem | null>(null);
  const [menuForm, setMenuForm] = useState<Omit<CanteenMenuItem, "id">>(EMPTY_MENU_FORM);
  const [menuFormErrors, setMenuFormErrors] = useState<Partial<Record<keyof Omit<CanteenMenuItem, "id">, string>>>({});
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Stats
  const todayOrders = orders.filter(o => o.orderTime.startsWith(todayStr()));
  const pendingCount = orders.filter(o => o.status === "Pending").length;
  const preparingCount = orders.filter(o => o.status === "Preparing" || o.status === "Accepted").length;
  const readyCount = orders.filter(o => o.status === "Ready").length;

  // Filtered orders
  const filteredOrders = orders.filter(o => {
    const matchSearch = !orderSearch ||
      o.id.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.studentName.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.studentId.toLowerCase().includes(orderSearch.toLowerCase());
    const matchStatus = statusFilter === "All" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Filtered menu
  const filteredMenu = menuItems.filter(m => {
    const matchSearch = !menuSearch || m.name.toLowerCase().includes(menuSearch.toLowerCase());
    const matchCat = menuCatFilter === "All" || m.category === menuCatFilter;
    return matchSearch && matchCat;
  });

  function handleAdvanceStatus(order: CanteenOrder) {
    const next = STATUS_SEQUENCE[order.status];
    if (!next) return;
    updateStatus.mutate(
      { id: order.id, status: next },
      { onSuccess: () => toast.success(`Order ${order.id} → ${next}`) }
    );
  }

  function handleCancelOrder(order: CanteenOrder) {
    updateStatus.mutate(
      { id: order.id, status: "Cancelled" },
      { onSuccess: () => toast.success(`Order ${order.id} cancelled.`) }
    );
  }

  function openAddMenu() {
    setEditTarget(null);
    setMenuForm(EMPTY_MENU_FORM);
    setMenuFormErrors({});
    setMenuModalOpen(true);
  }

  function openEditMenu(item: CanteenMenuItem) {
    setEditTarget(item);
    const { id: _id, ...rest } = item;
    setMenuForm(rest);
    setMenuFormErrors({});
    setMenuModalOpen(true);
  }

  function validateMenuForm() {
    const errors: typeof menuFormErrors = {};
    if (!menuForm.name.trim()) errors.name = "Name is required";
    if (!menuForm.price || menuForm.price <= 0) errors.price = "Price must be > 0";
    if (!menuForm.description.trim()) errors.description = "Description is required";
    setMenuFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleSaveMenu() {
    if (!validateMenuForm()) return;
    if (editTarget) {
      updateMenuItem.mutate(
        { id: editTarget.id, patch: menuForm },
        { onSuccess: () => { toast.success("Menu item updated."); setMenuModalOpen(false); } }
      );
    } else {
      addMenuItem.mutate(
        menuForm,
        { onSuccess: () => { toast.success("Menu item added."); setMenuModalOpen(false); } }
      );
    }
  }

  function handleDeleteMenu(id: string) {
    deleteMenuItem.mutate(id, {
      onSuccess: () => { toast.success("Menu item deleted."); setDeleteTarget(null); }
    });
  }

  const ALL_STATUSES: (OrderStatus | "All")[] = ["All", "Pending", "Accepted", "Preparing", "Ready", "Completed", "Cancelled"];

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        eyebrow="Canteen Operations"
        title="Canteen Dashboard"
        description="Manage incoming orders and menu in real time"
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge variant="success">Live</StatusBadge>
            <span className="text-xs text-muted-foreground">Auto-refreshing</span>
          </div>
        }
      />

      {/* Top metrics */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <MetricTile
          label="Orders Today"
          value={<AnimatedNumber value={todayOrders.length} />}
          icon={UtensilsCrossed}
          variant="primary"
          delay={0}
        />
        <MetricTile
          label="Pending"
          value={<AnimatedNumber value={pendingCount} />}
          icon={Clock}
          variant={pendingCount > 5 ? "danger" : "warning"}
          delay={0.05}
        />
        <MetricTile
          label="Preparing"
          value={<AnimatedNumber value={preparingCount} />}
          icon={ChefHat}
          variant="primary"
          delay={0.1}
        />
        <MetricTile
          label="Ready for Pickup"
          value={<AnimatedNumber value={readyCount} />}
          icon={CheckCircle2}
          variant="success"
          delay={0.15}
        />
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 rounded-lg border border-border bg-muted/40 p-1 w-fit">
        {(["orders", "menu"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "relative rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
              activeTab === tab ? "bg-surface shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab === "orders" ? "Live Orders" : "Menu Management"}
            {tab === "orders" && pendingCount > 0 && (
              <span className="ml-1.5 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ORDERS TAB */}
      {activeTab === "orders" && (
        <WorkspacePanel title="Incoming Orders" description="All orders — update status as you process them" icon={UtensilsCrossed} delay={0}>
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by order ID, student name or ID..."
                  value={orderSearch}
                  onChange={e => setOrderSearch(e.target.value)}
                  className="input-warm w-full pl-9 pr-4 py-2 text-sm rounded-lg"
                />
              </div>
              <div className="flex gap-1 flex-wrap">
                {ALL_STATUSES.map(s => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                      statusFilter === s
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-border bg-surface text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {s}
                    {s !== "All" && (
                      <span className="ml-1 tabular-nums">
                        ({orders.filter(o => o.status === s).length})
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders table */}
            {filteredOrders.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                {orders.length === 0
                  ? "No orders received yet. Orders placed by students will appear here."
                  : "No orders match your filter."}
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-left">
                      <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Order ID</th>
                      <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Student</th>
                      <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Items</th>
                      <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total</th>
                      <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Order Time</th>
                      <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pickup</th>
                      <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                      <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredOrders.map(order => {
                      const nextAction = STATUS_ACTIONS[order.status];
                      const canAdvance = !!STATUS_SEQUENCE[order.status];
                      const isFinal = order.status === "Completed" || order.status === "Cancelled";
                      return (
                        <tr key={order.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3 font-mono text-xs font-semibold text-foreground">{order.id}</td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-foreground">{order.studentName}</p>
                            <p className="text-xs text-muted-foreground">{order.studentId}</p>
                          </td>
                          <td className="px-4 py-3 max-w-[200px]">
                            <div className="space-y-0.5">
                              {order.items.map(item => (
                                <p key={item.menuItemId} className="text-xs text-foreground truncate">
                                  {item.name} × {item.qty}
                                </p>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3 font-semibold text-foreground tabular-nums">₹{order.totalPrice}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(order.orderTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                          </td>
                          <td className="px-4 py-3 text-xs text-foreground whitespace-nowrap">{order.pickupTime}</td>
                          <td className="px-4 py-3">
                            <StatusBadge variant={STATUS_BADGE[order.status]}>{order.status}</StatusBadge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {canAdvance && (
                                <button
                                  onClick={() => handleAdvanceStatus(order)}
                                  disabled={updateStatus.isPending}
                                  className="btn-primary px-2.5 py-1 text-xs rounded-lg whitespace-nowrap disabled:opacity-50"
                                >
                                  {nextAction}
                                </button>
                              )}
                              {!isFinal && (
                                <button
                                  onClick={() => handleCancelOrder(order)}
                                  disabled={updateStatus.isPending}
                                  className="btn-secondary px-2.5 py-1 text-xs rounded-lg text-red-600 hover:bg-red-50 whitespace-nowrap disabled:opacity-50"
                                >
                                  Cancel
                                </button>
                              )}
                              {isFinal && (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </WorkspacePanel>
      )}

      {/* MENU MANAGEMENT TAB */}
      {activeTab === "menu" && (
        <WorkspacePanel
          title="Menu Management"
          description="Add, edit, and manage menu availability"
          icon={UtensilsCrossed}
          delay={0}
        >
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 justify-between">
              <div className="flex gap-2 flex-1">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search menu items..."
                    value={menuSearch}
                    onChange={e => setMenuSearch(e.target.value)}
                    className="input-warm w-full pl-9 pr-4 py-2 text-sm rounded-lg"
                  />
                </div>
                <select
                  value={menuCatFilter}
                  onChange={e => setMenuCatFilter(e.target.value as MealCategory | "All")}
                  className="input-warm px-3 py-2 text-sm rounded-lg"
                >
                  <option value="All">All Categories</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <button
                onClick={openAddMenu}
                className="btn-primary flex items-center gap-2 px-4 py-2 rounded-lg text-sm shrink-0"
              >
                <Plus className="h-4 w-4" /> Add Item
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-left">
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Item</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Category</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Price</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Type</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredMenu.map(item => (
                    <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{item.name}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{item.description}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{item.category}</td>
                      <td className="px-4 py-3 font-semibold text-foreground tabular-nums">₹{item.price}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {item.isVeg
                            ? <span className="flex items-center gap-1 text-xs text-emerald-700"><Leaf className="h-3 w-3" />Veg</span>
                            : <span className="flex items-center gap-1 text-xs text-red-600">Non-Veg</span>}
                          {item.isSpicy && <Flame className="h-3 w-3 text-orange-500" />}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleAvailability.mutate(item.id)}
                          className={cn(
                            "rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
                            item.available
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              : "border-border bg-muted/50 text-muted-foreground hover:bg-muted"
                          )}
                        >
                          {item.available ? "Available" : "Out of Stock"}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditMenu(item)}
                            className="btn-ghost p-1.5 rounded-lg text-muted-foreground hover:text-foreground"
                            title="Edit item"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(item.id)}
                            className="btn-ghost p-1.5 rounded-lg text-muted-foreground hover:text-red-600"
                            title="Delete item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </WorkspacePanel>
      )}

      {/* Add/Edit Menu Item Modal */}
      {menuModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4" onClick={() => setMenuModalOpen(false)}>
          <div
            className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">
                {editTarget ? "Edit Menu Item" : "Add Menu Item"}
              </h2>
              <button onClick={() => setMenuModalOpen(false)} className="btn-ghost p-1 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-4">
              <div>
                <label className="label-sm">Item Name *</label>
                <input
                  type="text"
                  value={menuForm.name}
                  onChange={e => setMenuForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Masala Dosa"
                  className={cn("input-warm w-full px-3 py-2 text-sm rounded-lg mt-1", menuFormErrors.name && "border-red-500")}
                />
                {menuFormErrors.name && <p className="text-xs text-red-500 mt-1">{menuFormErrors.name}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-sm">Category</label>
                  <select
                    value={menuForm.category}
                    onChange={e => setMenuForm(p => ({ ...p, category: e.target.value as MealCategory }))}
                    className="input-warm w-full px-3 py-2 text-sm rounded-lg mt-1"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label-sm">Price (₹) *</label>
                  <input
                    type="number"
                    min={1}
                    value={menuForm.price}
                    onChange={e => setMenuForm(p => ({ ...p, price: Number(e.target.value) }))}
                    className={cn("input-warm w-full px-3 py-2 text-sm rounded-lg mt-1", menuFormErrors.price && "border-red-500")}
                  />
                  {menuFormErrors.price && <p className="text-xs text-red-500 mt-1">{menuFormErrors.price}</p>}
                </div>
              </div>

              <div>
                <label className="label-sm">Description *</label>
                <textarea
                  rows={2}
                  value={menuForm.description}
                  onChange={e => setMenuForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Brief description of the item..."
                  className={cn("input-warm w-full px-3 py-2 text-sm rounded-lg mt-1 resize-none", menuFormErrors.description && "border-red-500")}
                />
                {menuFormErrors.description && <p className="text-xs text-red-500 mt-1">{menuFormErrors.description}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-sm">Tag (optional)</label>
                  <input
                    type="text"
                    value={menuForm.tag ?? ""}
                    onChange={e => setMenuForm(p => ({ ...p, tag: e.target.value }))}
                    placeholder="e.g. Popular, New"
                    className="input-warm w-full px-3 py-2 text-sm rounded-lg mt-1"
                  />
                </div>
                <div>
                  <label className="label-sm">Rating</label>
                  <input
                    type="number"
                    min={1} max={5} step={0.1}
                    value={menuForm.rating}
                    onChange={e => setMenuForm(p => ({ ...p, rating: Number(e.target.value) }))}
                    className="input-warm w-full px-3 py-2 text-sm rounded-lg mt-1"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                {[
                  { key: "isVeg", label: "Vegetarian" },
                  { key: "isSpicy", label: "Spicy" },
                  { key: "available", label: "Available" },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!menuForm[key as keyof typeof menuForm]}
                      onChange={e => setMenuForm(p => ({ ...p, [key]: e.target.checked }))}
                      className="rounded"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setMenuModalOpen(false)} className="btn-secondary flex-1 py-2 rounded-lg text-sm">
                Cancel
              </button>
              <button
                onClick={handleSaveMenu}
                disabled={addMenuItem.isPending || updateMenuItem.isPending}
                className="btn-primary flex-1 py-2 rounded-lg text-sm disabled:opacity-50"
              >
                {editTarget ? "Save Changes" : "Add Item"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-xl space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <h2 className="text-base font-semibold text-foreground">Delete Menu Item</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  This item will be removed from the menu permanently.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="btn-secondary flex-1 py-2 rounded-lg text-sm">
                Cancel
              </button>
              <button
                onClick={() => handleDeleteMenu(deleteTarget)}
                disabled={deleteMenuItem.isPending}
                className="flex-1 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
