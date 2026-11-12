import { useAdvanceOrder, useResolveRequest } from "@/lib/api/queries";

/** The two things the shop team does to an order. Both refresh the dashboard numbers afterwards. */
export function useAdminActions() {
  return { advance: useAdvanceOrder(), resolve: useResolveRequest() };
}
