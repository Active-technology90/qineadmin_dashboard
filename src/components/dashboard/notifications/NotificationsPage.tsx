// src/components/dashboard/notifications/NotificationsPage.tsx
import { useMemo, useState } from "react";
// import toast from "react-hot-toast";
import { Bell, CheckCheck, RefreshCw, BellRing, BellOff } from "lucide-react";
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
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Bell className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Notifications</h1>
            <p className="text-sm text-gray-500">
              {unread > 0 ? `${unread} unread` : "You're all caught up"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
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
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition"
            >
              {pushState === "denied" ? <BellOff className="h-4 w-4" /> : <BellRing className="h-4 w-4" />}
              {pushState === "denied" ? "Push blocked" : "Enable push"}
            </button>
          )}
          <button
            onClick={() => refetch()}
            className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          {unread > 0 && (
            <button
              onClick={() => markAllRead()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-md transition"
            >
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 mb-4 bg-gray-100 p-1 rounded-xl w-fit">
        {(["all", "unread"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold capitalize transition ${filter === f ? "bg-white text-indigo-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
          >
            {f}
            {f === "unread" && unread > 0 && (
              <span className="ml-1.5 text-[11px] font-bold text-indigo-600">{unread}</span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {list.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <Bell className="h-8 w-8 text-gray-300" />
          </div>
          <p className="text-gray-500 font-medium">
            {filter === "unread" ? "No unread notifications" : "No notifications yet"}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            New orders, payments and deliveries will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {list.map((n) => {
            const { Icon, label, color, bg } = getEventMeta(n.event);
            return (
              <div
                key={n.id}
                onClick={() => !n.is_read && markRead([n.id])}
                className={`flex gap-4 p-4 rounded-2xl border transition cursor-pointer ${n.is_read
                  ? "bg-white border-gray-100 hover:border-gray-200"
                  : "bg-indigo-50/50 border-indigo-100 hover:border-indigo-200"
                  }`}
              >
                <div className={`flex-shrink-0 h-11 w-11 rounded-full ${bg} flex items-center justify-center`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[11px] font-bold uppercase tracking-wide ${color}`}>{label}</span>
                    <span className="text-[11px] text-gray-400">· {formatRelativeTime(n.created_at)}</span>
                    {!n.is_read && (
                      <span className="ml-auto h-2.5 w-2.5 rounded-full bg-indigo-500 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-sm font-bold text-gray-900 mt-0.5">{n.title}</p>
                  <p className="text-sm text-gray-600 mt-0.5">{n.body}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
