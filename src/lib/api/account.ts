"use client";

import { useMutation } from "@tanstack/react-query";
import { call } from "./http";

/** Change your own password. The server checks the current one first. */
export const useChangePassword = () =>
  useMutation({ mutationFn: (v: { current: string; next: string }) => call<void>("/me/change-password", { method: "POST", body: { current: v.current, new: v.next } }) });
