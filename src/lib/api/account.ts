"use client";

import { useMutation } from "@tanstack/react-query";
import { call } from "./http";

/** Change your own password. The server checks the current one first. */
export const useChangePassword = () =>
  useMutation({ mutationFn: (v: { current: string; next: string }) => call<void>("/me/change-password", { method: "POST", body: { current: v.current, new: v.next } }) });

/** Asks the server to email a reset link. The answer is the same whether or not the address has an account. */
export const useForgotPassword = () =>
  useMutation({ mutationFn: (v: { email: string; locale: string }) => call<void>("/auth/forgot-password", { method: "POST", body: v }) });

/** Sets a new password using the secret from the emailed link. */
export const useResetPassword = () =>
  useMutation({ mutationFn: (v: { email: string; token: string; password: string }) => call<void>("/auth/reset-password", { method: "POST", body: v }) });
