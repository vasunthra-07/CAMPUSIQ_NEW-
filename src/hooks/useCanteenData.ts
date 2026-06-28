import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  menuStore, orderStore,
  type CanteenMenuItem, type CanteenOrder, type OrderStatus, type OrderItem,
} from "@/services/canteenStore";

const MENU_KEY = ["canteen", "menu"] as const;
const ORDERS_KEY = ["canteen", "orders"] as const;

// Poll every 4 seconds to simulate real-time status updates across student/staff views.
const POLL_INTERVAL = 4000;

export function useCanteenMenu() {
  return useQuery({
    queryKey: MENU_KEY,
    queryFn: () => menuStore.getAll(),
    staleTime: 0,
    refetchInterval: POLL_INTERVAL,
  });
}

export function useCanteenOrders() {
  return useQuery({
    queryKey: ORDERS_KEY,
    queryFn: () => orderStore.getAll(),
    staleTime: 0,
    refetchInterval: POLL_INTERVAL,
  });
}

export function useMyOrders(studentId: string) {
  return useQuery({
    queryKey: [...ORDERS_KEY, studentId],
    queryFn: () => orderStore.getByStudent(studentId),
    staleTime: 0,
    refetchInterval: POLL_INTERVAL,
  });
}

export function usePlaceOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (order: Omit<CanteenOrder, "id" | "orderTime" | "status">) =>
      Promise.resolve(orderStore.place(order)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ORDERS_KEY }),
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) => {
      orderStore.updateStatus(id, status);
      return Promise.resolve();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ORDERS_KEY }),
  });
}

export function useAddMenuItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (item: Omit<CanteenMenuItem, "id">) => Promise.resolve(menuStore.add(item)),
    onSuccess: () => qc.invalidateQueries({ queryKey: MENU_KEY }),
  });
}

export function useUpdateMenuItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<CanteenMenuItem> }) => {
      menuStore.update(id, patch);
      return Promise.resolve();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: MENU_KEY }),
  });
}

export function useDeleteMenuItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => { menuStore.delete(id); return Promise.resolve(); },
    onSuccess: () => qc.invalidateQueries({ queryKey: MENU_KEY }),
  });
}

export function useToggleMenuItemAvailability() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => { menuStore.toggleAvailability(id); return Promise.resolve(); },
    onSuccess: () => qc.invalidateQueries({ queryKey: MENU_KEY }),
  });
}

export type { CanteenMenuItem, CanteenOrder, OrderStatus, OrderItem };
