// src/context/NotificationsContext.tsx
// Shared notification state for the dashboard: auto-registers for web push on
// start, polls the in-app center, surfaces foreground pushes as toasts, and
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
  enablePushNotifications,
  listenForegroundMessages,
} from "../services/notifications";

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
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pushState, setPushState] = useState<PushState>(currentPushState());
  const started = useRef(false);

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
    try {
      await enablePushNotifications("admin");
    } catch {
      /* denied / unsupported — in-app center still works */
    } finally {
      setPushState(currentPushState());
    }
  }, []);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (!localStorage.getItem("access")) return;

    refetch();

    // Auto-ask for notification permission on start (and register the device).
    if (pushState === "granted" || pushState === "default") {
      enablePush();
    }

    // Foreground pushes → toast + refresh the list.
    let unsub: () => void = () => {};
    listenForegroundMessages((payload) => {
      const title = payload.notification?.title ?? "Notification";
      const body = payload.notification?.body ?? "";
      toast.success(body ? `${title} — ${body}` : title, { duration: 6000 });
      refetch();
    }).then((u) => {
      unsub = u;
    });

    const interval = setInterval(refetch, POLL_MS);
    return () => {
      clearInterval(interval);
      unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Ctx.Provider
      value={{ notifications, unread, loading, pushState, refetch, markAllRead, markRead, enablePush }}
    >
      <Toaster position="top-right" toastOptions={{ style: { fontSize: "14px" } }} />
      {children}
    </Ctx.Provider>
  );
}
