// src/utils/notificationNavigation.ts
/** Map FCM data payload → dashboard tab (role-aware). */
export type DashboardPushTab =
  | "masterOrders"
  | "companyOrders"
  | "notifications";

export interface PushNavigationPayload {
  pushTab?: string | null;
  pushType?: string | null;
  vendor_order_id?: string | null;
}

export function resolvePushTab(
  payload: PushNavigationPayload,
  isSuperAdmin: boolean,
): DashboardPushTab {
  const explicit = payload.pushTab;
  if (explicit && explicit !== "auto") {
    if (explicit === "masterOrders" || explicit === "companyOrders" || explicit === "notifications") {
      return explicit;
    }
  }

  if (payload.pushType === "vendor_order" || payload.pushTab === "auto") {
    return isSuperAdmin ? "masterOrders" : "companyOrders";
  }

  return "notifications";
}

export function buildDashboardPushUrl(
  data: Record<string, unknown> = {},
): string {
  const params = new URLSearchParams();
  const type = typeof data.type === "string" ? data.type : "";
  const vendorOrderId =
    data.vendor_order_id != null ? String(data.vendor_order_id) : "";

  if (type === "vendor_order" && vendorOrderId) {
    params.set("pushTab", "auto");
    params.set("pushType", "vendor_order");
    params.set("vendor_order_id", vendorOrderId);
  } else {
    params.set("pushTab", "notifications");
  }

  return `/dashboard?${params.toString()}`;
}

export function readPushParamsFromUrl(): PushNavigationPayload | null {
  const params = new URLSearchParams(window.location.search);
  const pushTab = params.get("pushTab");
  if (!pushTab) return null;

  return {
    pushTab,
    pushType: params.get("pushType"),
    vendor_order_id: params.get("vendor_order_id"),
  };
}

export function clearPushParamsFromUrl(): void {
  window.history.replaceState({}, "", "/dashboard");
}

/** Dispatch navigation after a push click (foreground SW message or in-app). */
export function dispatchPushNavigation(payload: PushNavigationPayload): void {
  window.dispatchEvent(
    new CustomEvent("admin-push-navigate", { detail: payload }),
  );
}
