// src/components/dashboard/notifications/NotificationsPage.tsx
import { useMemo, useState } from "react";
// import toast from "react-hot-toast";
import { Bell, CheckCheck, RefreshCw, BellRing, BellOff, Sparkles } from "lucide-react";
import { useNotifications } from "../../../context/NotificationsContext";
// import { sendTestNotification } from "../../../services/api";
import { getEventMeta, formatRelativeTime } from "./meta";

export default function NotificationsPage() {
  const { notifications, unread, loading, pushState, refetch, markAllRead, markRead, enablePush } =
    useNotifications();
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const list = useMemo(
    () => (filter === "unread" ? notifications.filter((n) => !n.is_read) : notifications),
    [notifications, filter]
  );

  // const handleSendTest = async () => {
  //   try {
  //     const { data } = await sendTestNotification("admin");
  //     if (data.active_devices_for_app === 0) {
  //       toast.error("No device registered — click 'Enable push' first.");
  //     } else {
  //       toast.success("Test notification sent.");
  //     }
  //     setTimeout(refetch, 600);
  //   } catch {
  //     toast.error("Test failed (is DEBUG on?).");
  //   }
  // };

  return (
<div className="max-w-5xl mx-auto px-4 sm:px-6 py-2">
      {/* Header */}
<div className="flex flex-wrap items-center justify-between gap-4 mb-10">
  <div className="flex items-center gap-5">
<div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-secondary to-secondary-light flex items-center justify-center shadow-2xl shadow-secondary/25 ring-1 ring-white/20 backdrop-blur-sm">
  <Bell className="h-8 w-8 text-white drop-shadow-lg" />
</div>
    <div>
<h1 className="text-3xl font-extrabold tracking-tight text-secondary">
  Notifications
</h1>
    <p className="text-sm text-secondary/70 mt-0.5 flex items-center gap-2">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-secondary" />
        {unread > 0 ? (
          <span className="font-semibold text-secondary">{unread} unread</span>
        ) : (
          "All caught up"
        )}
            </p>
          </div>
        </div>

<div className="flex items-center gap-2 flex-wrap">
          {/* {import.meta.env.DEV && (
            <button
              onClick={handleSendTest}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition"
              title="Dev only: send a test push to yourself"
            >
              <Send className="h-4 w-4" />
              Send test
            </button>
          )} */}
          {pushState !== "granted" && (
            <button
              onClick={() => enablePush()}
      className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold text-secondary bg-secondary/10 hover:bg-secondary/20 transition-all duration-300 border border-secondary/20 hover:border-secondary/40 hover:shadow-lg hover:shadow-secondary/10"
    >
              {pushState === "denied" ? <BellOff className="h-4 w-4" /> : <BellRing className="h-4 w-4" />}
              {pushState === "denied" ? "Push blocked" : "Enable push"}
            </button>
          )}
          <button
            onClick={() => refetch()}
    className="p-2.5 rounded-full text-gray-400 hover:text-secondary hover:bg-secondary/10 transition-all duration-300 hover:rotate-180"
    title="Refresh"
  >
    <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
          </button>
          {unread > 0 && (
            <button
              onClick={() => markAllRead()}
      className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold text-white bg-gradient-to-r from-secondary to-secondary-light hover:shadow-xl hover:shadow-secondary/30 transition-all duration-300 shadow-lg shadow-secondary/20 hover:scale-[1.02] active:scale-[0.98]"
    >
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </button>
          )}
        </div>
      </div>

{/* Filter tabs */}
<div className="flex items-center gap-1 mb-8 bg-gray-100/60 backdrop-blur-sm p-1 rounded-2xl w-fit shadow-inner">
        {(["all", "unread"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
      className={`px-6 py-2.5 rounded-xl text-sm font-bold capitalize transition-all duration-300 ${
        filter === f
          ? "bg-white text-secondary shadow-lg shadow-secondary/10 ring-1 ring-secondary/20 scale-[1.02]"
          : "text-gray-500 hover:text-secondary hover:bg-white/50"
      }`}
    >
      {f}
      {f === "unread" && unread > 0 && (
        <span className="ml-2 text-[10px] font-black text-white bg-secondary px-2.5 py-0.5 rounded-full shadow-md shadow-secondary/30">
          {unread}
        </span>
      )}
    </button>
  ))}
</div>

      {/* List */}
{list.length === 0 ? (
  <div className="flex flex-col items-center justify-center py-32 text-center bg-gradient-to-br from-gray-50/80 to-gray-100/30 rounded-3xl border border-gray-200/50 backdrop-blur-sm">
    <div className="h-24 w-24 rounded-full bg-secondary/10 flex items-center justify-center shadow-inner">
      <Bell className="h-12 w-12 text-secondary/30" />
    </div>
    <p className="text-xl font-bold text-secondary mt-6">
      {filter === "unread" ? "No unread notifications" : "All caught up"}
    </p>
    <p className="text-sm text-secondary/70 mt-2 max-w-sm">
      New orders, payments, and deliveries will appear here.
    </p>
  </div>
) : (
<div className="space-y-4">
          {list.map((n) => {
            const { Icon, label, color, bg } = getEventMeta(n.event);
            return (
              <div
                key={n.id}
                onClick={() => !n.is_read && markRead([n.id])}        className={`group relative flex gap-5 p-5 rounded-2xl border transition-all duration-300 cursor-pointer ${
          n.is_read
                  ? "bg-white border-gray-100 hover:border-gray-200"
                  : "bg-indigo-50/50 border-indigo-100 hover:border-indigo-200"
                  }`}
              >
        {!n.is_read && (
          <div className="absolute -left-0.5 top-1/2 -translate-y-1/2 h-12 w-1.5 rounded-full bg-gradient-to-b from-secondary to-secondary-light shadow-md shadow-secondary/30" />
        )}

        <div className={`flex-shrink-0 h-12 w-12 rounded-2xl ${bg} flex items-center justify-center shadow-sm ring-1 ring-white/50 transition-transform duration-300 group-hover:scale-110 group-hover:shadow-md`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`text-[10px] font-extrabold uppercase tracking-wider ${color}`}>
              {label}
            </span>
            <span className="text-[10px] text-gray-400 font-medium">· {formatRelativeTime(n.created_at)}</span>
            {!n.is_read && (
              <span className="ml-auto flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-secondary shadow-sm shadow-secondary/30 animate-pulse" />
                <span className="text-[9px] font-bold text-secondary uppercase tracking-widest">New</span>
              </span>
            )}
          </div>
          <p className="text-base font-bold text-gray-900 mt-1.5 leading-tight group-hover:text-secondary transition-colors duration-300">
            {n.title}
          </p>
          <p className="text-sm text-gray-600 mt-1 leading-relaxed">{n.body}</p>
        </div>

        {!n.is_read && (
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-secondary/0 via-secondary/5 to-secondary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        )}
      </div>
    );
  })}
</div>
      )}
    </div>
  );
}
