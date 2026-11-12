"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { call } from "./http";

/** A message about the customer's order. The server stores only a kind and an order number; the text is written here. */
export type NotificationKind =
  | "order.packed" | "order.shipped" | "order.outForDelivery" | "order.delivered"
  | "order.cancelled" | "order.refunded" | "request.approved" | "request.declined";

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  orderId: string | null;
  createdAt: string;
  read: boolean;
}
export interface NotificationsPage { items: AppNotification[]; unread: number }

const KEY = ["notifications"] as const;

/** Polls once a minute (only while the tab is visible). `enabled` should be true only for a signed-in customer on the live API. */
export const useNotifications = (enabled: boolean) =>
  useQuery({
    queryKey: KEY,
    queryFn: () => call<NotificationsPage>("/me/notifications"),
    enabled,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    retry: false,
  });

function useNotificationMutation<V>(fn: (v: V) => Promise<unknown>) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: fn, onSuccess: () => qc.invalidateQueries({ queryKey: KEY }) });
}

export const useMarkRead = () => useNotificationMutation((id: string) => call<void>(`/me/notifications/${encodeURIComponent(id)}/read`, { method: "POST" }));
export const useMarkAllRead = () => useNotificationMutation(() => call<void>("/me/notifications/read-all", { method: "POST" }));
