"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./index";
import type { AddressValues, LoginValues, RegisterValues } from "@/lib/auth-schema";
import type { AdminOrdersQuery, CreateOrderInput, NewRequest, NewReview, Order, RequestStatus } from "./types";

export const keys = {
  orders: ["orders"] as const,
  order: (id: string) => ["orders", id] as const,
  reviews: (slug: string) => ["reviews", slug] as const,
  ratings: ["ratings"] as const,
  session: ["session"] as const,
};

export const useAdminStats = (enabled: boolean) => useQuery({ queryKey: ["admin", "stats"], queryFn: () => api.admin.stats(), enabled, retry: false });
export const useAdminOrders = (query: AdminOrdersQuery, enabled: boolean) =>
  useQuery({ queryKey: ["admin", "orders", query], queryFn: () => api.admin.orders(query), enabled, retry: false });

export const useOrdersQuery = () => useQuery({ queryKey: keys.orders, queryFn: () => api.orders.list() });

export const useOrderQuery = (id: string | undefined) =>
  useQuery({ queryKey: keys.order(id ?? ""), queryFn: () => api.orders.get(id!), enabled: Boolean(id) });

function useOrderMutation<V, R extends Order | null>(fn: (v: V) => Promise<R>) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: fn, onSuccess: () => Promise.all([qc.invalidateQueries({ queryKey: keys.orders }), qc.invalidateQueries({ queryKey: ["admin"] })]) });
}

export const useCreateOrder = () => useOrderMutation((input: CreateOrderInput) => api.orders.create(input));

export const useAddRequest = () =>
  useOrderMutation(({ orderId, request }: { orderId: string; request: NewRequest }) => api.orders.addRequest(orderId, request));

export const useAdvanceOrder = () => useOrderMutation((orderId: string) => api.orders.advance(orderId));

export const useResolveRequest = () =>
  useOrderMutation(({ orderId, requestId, status }: { orderId: string; requestId: string; status: Exclude<RequestStatus, "pending"> }) =>
    api.orders.resolveRequest(orderId, requestId, status));

export const useReviewsQuery = (slug: string) => useQuery({ queryKey: keys.reviews(slug), queryFn: () => api.reviews.list(slug) });

export const useRatingSummary = (slug: string) =>
  useQuery({ queryKey: keys.ratings, queryFn: () => api.reviews.summaries(), select: (all) => all[slug] });

function useReviewMutation<V, R>(fn: (v: V) => Promise<R>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => Promise.all([qc.invalidateQueries({ queryKey: ["reviews"] }), qc.invalidateQueries({ queryKey: keys.ratings })]),
  });
}

export const useAddReview = () => useReviewMutation((r: NewReview) => api.reviews.add(r));
export const useRemoveReview = () => useReviewMutation((id: string) => api.reviews.remove(id));

export const useSessionQuery = () => useQuery({ queryKey: keys.session, queryFn: () => api.auth.me() });

function useAuthMutation<V, R>(fn: (v: V) => Promise<R>) {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: keys.session });
  // On failure too: a 401 usually means the session expired, so re-check who we are.
  return useMutation({ mutationFn: fn, onSuccess: refresh, onError: refresh });
}

export const useSignIn = () => useAuthMutation((v: LoginValues) => api.auth.signIn(v));
export const useSignUp = () => useAuthMutation((v: RegisterValues) => api.auth.signUp(v));
export const useSignOut = () => useAuthMutation(() => api.auth.signOut());
export const useUpdateProfile = () => useAuthMutation((v: { name: string; phone: string }) => api.auth.updateProfile(v));
export const useAddAddress = () => useAuthMutation((v: AddressValues) => api.auth.addAddress(v));
export const useRemoveAddress = () => useAuthMutation((id: string) => api.auth.removeAddress(id));
