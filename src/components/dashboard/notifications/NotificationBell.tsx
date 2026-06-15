// src/components/dashboard/notifications/NotificationBell.tsx
import { useEffect, useRef, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { useNotifications } from "../../../context/NotificationsContext";
import { getEventMeta, formatRelativeTime } from "./meta";

export default function NotificationBell({ onViewAll }: { onViewAll: () => void }) {
  const { notifications, unread, markAllRead, markRead, refetch } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const recent = notifications.slice(0, 8);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => {
          setOpen((o) => !o);
          if (!open) refetch();
        }}
        className="relative p-2.5 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-indigo-600 transition-colors cursor-pointer"
        title="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow ring-2 ring-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-[360px] max-w-[92vw] bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-indigo-50/60 to-transparent">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-indigo-600" />
              <p className="font-bold text-gray-900">Notifications</p>
              {unread > 0 && (
                <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">
                  {unread} new
                </span>
              )}
            </div>
            {unread > 0 && (
              <button
                onClick={() => markAllRead()}
                className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all
              </button>
            )}
          </div>

          <div className="max-h-[380px] overflow-y-auto">
            {recent.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-gray-400">
                <Bell className="h-7 w-7 mx-auto mb-2 text-gray-300" />
                You're all caught up.
              </div>
            ) : (
              recent.map((n) => {
                const { Icon, color, bg } = getEventMeta(n.event);
                return (
                  <button
                    key={n.id}
                    onClick={() => markRead([n.id])}
                    className={`w-full text-left flex gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition cursor-pointer ${
                      !n.is_read ? "bg-indigo-50/40" : ""
                    }`}
                  >
                    <div className={`flex-shrink-0 h-9 w-9 rounded-full ${bg} flex items-center justify-center`}>
                      <Icon className={`h-4 w-4 ${color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900 truncate">{n.title}</p>
                        {!n.is_read && <span className="h-2 w-2 rounded-full bg-indigo-500 flex-shrink-0" />}
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2">{n.body}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{formatRelativeTime(n.created_at)}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <button
            onClick={() => {
              setOpen(false);
              onViewAll();
            }}
            className="w-full py-3 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 transition border-t border-gray-100"
          >
            View all notifications
          </button>
        </div>
      )}
    </div>
  );
}
