// src/context/NotificationsContext.tsx
// Shared notification state for the dashboard: auto-registers for web push on
// login, polls the in-app center, surfaces foreground pushes as toasts, and
// exposes unread count + list to the header bell and the notifications page.
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import toast, { Toaster } from "react-hot-toast";
import {
  getNotifications,
  getUnreadCount,
  markNotificationsRead,
} from "../services/api";
import {
  listenForegroundMessages,
  registerPushForSession,
} from "../services/notifications";
import { useAuth } from "./authContext";
import {
  dispatchPushNavigation,
} from "../utils/notificationNavigation";

export interface AppNotification {
  id: number;
  event: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

type PushState = "unsupported" | "default" | "granted" | "denied";

interface NotificationsContextValue {
  notifications: AppNotification[];
  unread: number;
  loading: boolean;
  pushState: PushState;
  refetch: () => Promise<void>;
  markAllRead: () => Promise<void>;
  markRead: (ids: number[]) => Promise<void>;
  enablePush: () => Promise<void>;
}

const Ctx = createContext<NotificationsContextValue | undefined>(undefined);

export const useNotifications = () => {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error("useNotifications must be used within NotificationsProvider");
  }
  return ctx;
};

const POLL_MS = 30000;

function currentPushState(): PushState {
  if (typeof Notification === "undefined") return "unsupported";
  return Notification.permission as PushState;
}

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pushState, setPushState] = useState<PushState>(currentPushState());
  const foregroundUnsub = useRef<() => void>(() => {});

  const refetch = useCallback(async () => {
    if (!localStorage.getItem("access")) return;
    setLoading(true);
    try {
      const [listRes, unreadRes] = await Promise.all([
        getNotifications(),
        getUnreadCount(),
      ]);
      const data = listRes.data as { results?: AppNotification[] } | AppNotification[];
      setNotifications(Array.isArray(data) ? data : data.results ?? []);
      setUnread(unreadRes.data.unread);
    } catch {
      /* not authed / network — ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    await markNotificationsRead();
    setNotifications((ns) => ns.map((n) => ({ ...n, is_read: true })));
    setUnread(0);
  }, []);

  const markRead = useCallback(async (ids: number[]) => {
    if (!ids.length) return;
    await markNotificationsRead(ids);
    setNotifications((ns) =>
      ns.map((n) => (ids.includes(n.id) ? { ...n, is_read: true } : n))
    );
    setUnread((u) => Math.max(0, u - ids.length));
  }, []);

  const enablePush = useCallback(async () => {
    await registerPushForSession("admin");
    setPushState(currentPushState());
  }, []);

  // Background notification click → service worker postMessage → navigate dashboard.
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const onMessage = (event: MessageEvent) => {
      if (event.data?.type !== "PUSH_NOTIFICATION_CLICK") return;
      dispatchPushNavigation(event.data.payload ?? {});
    };

    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;

    refetch();

    // Register this browser for background + foreground FCM on every login/session.
    registerPushForSession("admin").finally(() => {
      setPushState(currentPushState());
    });

    foregroundUnsub.current();
    listenForegroundMessages((payload) => {
      const title = payload.notification?.title ?? "Notification";
      const body = payload.notification?.body ?? "";
      const data = (payload.data ?? {}) as Record<string, unknown>;

      toast.success(
        (t) => (
          <button
            type="button"
            onClick={() => {
              toast.dismiss(t.id);
              dispatchPushNavigation({
                pushTab: data.type === "vendor_order" ? "auto" : "notifications",
                pushType: typeof data.type === "string" ? data.type : null,
                vendor_order_id:
                  data.vendor_order_id != null ? String(data.vendor_order_id) : null,
              });
            }}
            className="text-left w-full"
          >
            <span className="font-semibold block">{title}</span>
            {body ? <span className="text-sm opacity-90">{body}</span> : null}
            <span className="text-xs opacity-70 mt-1 block">Tap to open</span>
          </button>
        ),
        { duration: 8000 },
      );
      refetch();
    }).then((unsub) => {
      foregroundUnsub.current = unsub;
    });

    const interval = setInterval(refetch, POLL_MS);
    return () => {
      clearInterval(interval);
      foregroundUnsub.current();
    };
  }, [isAuthenticated, isLoading, refetch]);

  return (
    <Ctx.Provider
      value={{ notifications, unread, loading, pushState, refetch, markAllRead, markRead, enablePush }}
    >
      <Toaster position="top-right" toastOptions={{ style: { fontSize: "14px" } }} />
      {children}
    </Ctx.Provider>
  );
}
