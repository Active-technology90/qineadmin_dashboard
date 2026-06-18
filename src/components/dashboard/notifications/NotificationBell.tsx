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
  className="relative p-2.5 rounded-xl bg-gradient-to-br from-secondary to-secondary-light text-white shadow-lg shadow-secondary/20 hover:shadow-secondary/40 hover:scale-105 transition-all duration-300 cursor-pointer"
  title="Notifications"
>
  <Bell className="h-5 w-5 drop-shadow-md" />
  {unread > 0 && (
    <span className="absolute -top-1 -right-1 min-w-[20px] h-[20px] px-1.5 flex items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-[10px] font-bold text-white shadow-lg shadow-orange-400/50 ring-2 ring-white animate-pulse">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
<div className="absolute right-0 mt-3 w-[380px] max-w-[92vw] bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl shadow-secondary/15 border border-white/30 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
<div className="flex items-center justify-between px-5 py-4 border-b border-secondary/20 bg-gradient-to-r from-secondary/10 to-secondary-light/5">
  <div className="flex items-center gap-2.5">
    <div className="p-1.5 rounded-lg bg-gradient-to-br from-secondary to-secondary-light text-white shadow-md shadow-secondary/20">
      <Bell className="h-3.5 w-3.5" />
    </div>
    <p className="font-extrabold text-gray-800">Notifications</p>
    {unread > 0 && (
      <span className="text-[10px] font-bold text-white bg-secondary px-2.5 py-0.5 rounded-full shadow-sm shadow-secondary/30">
                  {unread} new
                </span>
              )}
            </div>
            {unread > 0 && (
              <button
                onClick={() => markAllRead()}

      className="flex items-center gap-1.5 text-xs font-bold text-secondary hover:text-secondary-dark transition-colors bg-white/60 px-3 py-1 rounded-full shadow-sm hover:shadow"
    >
      <CheckCheck className="h-3.5 w-3.5" />
      Mark all
    </button>
  )}
</div>

          <div className="max-h-[380px] overflow-y-auto">
            {recent.length === 0 ? (
<div className="px-5 py-12 text-center">
  <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-secondary/10 flex items-center justify-center shadow-inner">
    <Bell className="h-7 w-7 text-secondary/30" />
  </div>
  <p className="text-sm font-semibold text-gray-500">You're all caught up.</p>
  <p className="text-xs text-gray-400 mt-1">No new notifications</p>
</div>
            ) : (
              recent.map((n) => {
                const { Icon, color, bg } = getEventMeta(n.event);
                return (
                  <button
                    key={n.id}
                    onClick={() => markRead([n.id])}

      className={`w-full text-left flex gap-4 px-5 py-3.5 border-b border-gray-100/50 hover:bg-secondary/5 transition-all duration-200 cursor-pointer ${
        !n.is_read ? "bg-secondary/5 border-l-4 border-l-secondary" : ""
      }`}
    >
      <div className={`flex-shrink-0 h-10 w-10 rounded-xl ${bg} flex items-center justify-center shadow-sm ring-1 ring-white/50`}>
        <Icon className={`h-4.5 w-4.5 ${color}`} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-gray-800 truncate">{n.title}</p>
          {!n.is_read && <span className="h-2.5 w-2.5 rounded-full bg-secondary shadow-sm shadow-secondary/30 flex-shrink-0" />}
        </div>
        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{n.body}</p>
        <p className="text-[10px] text-gray-400 mt-1 font-medium">{formatRelativeTime(n.created_at)}</p>
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
  className="w-full py-4 text-sm font-bold text-secondary bg-gradient-to-r from-secondary/5 to-secondary-light/5 hover:from-secondary/10 hover:to-secondary-light/10 transition-all duration-200 border-t border-secondary/20"
>
  <span className="bg-gradient-to-r from-secondary to-secondary-light bg-clip-text text-transparent">
    View all notifications →
  </span>
</button>
        </div>
      )}
    </div>
  );
}
