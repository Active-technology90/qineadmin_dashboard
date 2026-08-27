// src/components/dashboard/notifications/NotificationsPage.tsx
import { useMemo, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { useNotifications } from "../../../context/NotificationsContext";
import { getEventMeta, formatRelativeTime } from "./meta";

function getNotificationDateGroup(iso: string): string {
  try {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "Earlier";

    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    ).getTime();
    const startOfYesterday = startOfToday - 86_400_000;
    const startOfNotificationDay = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    ).getTime();

    if (startOfNotificationDay >= startOfToday) return "Today";
    if (startOfNotificationDay >= startOfYesterday) return "Yesterday";
    return "Earlier";
  } catch {
    return "Earlier";
  }
}

function groupNotificationsByDate<T extends { created_at: string }>(
  items: T[]
): { label: string; items: T[] }[] {
  const groups: { label: string; items: T[] }[] = [];

  for (const item of items) {
    const label = getNotificationDateGroup(item.created_at);
    const last = groups[groups.length - 1];

    if (last && last.label === label) {
      last.items.push(item);
    } else {
      groups.push({ label, items: [item] });
    }
  }

  return groups;
}

function NotificationSkeleton() {
  return (
    <div className="flex gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl border border-gray-100 bg-white">
      <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-gray-200/80 animate-pulse" />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="h-3 w-32 max-w-[60%] rounded-full bg-gray-200/80 animate-pulse" />
        <div className="h-4 w-3/4 max-w-[80%] rounded-full bg-gray-200/80 animate-pulse" />
        <div className="h-4 w-1/2 max-w-[50%] rounded-full bg-gray-200/80 animate-pulse" />
      </div>
    </div>
  );
}

interface NotificationsPageProps {
  /** Called when a notification is clicked. The full notification object is passed. */
  onNotificationClick?: (notification: any) => void;
}

export default function NotificationsPage({
  onNotificationClick,
}: NotificationsPageProps) {
  const {
    notifications,
    unread,
    loading,
    markAllRead,
    markRead,
  } = useNotifications();

  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [markingAll, setMarkingAll] = useState(false);

  const filtered = useMemo(
    () =>
      filter === "unread"
        ? notifications.filter((n) => !n.is_read)
        : notifications,
    [notifications, filter]
  );

  const grouped = useMemo(() => groupNotificationsByDate(filtered), [filtered]);

  const isInitialLoading = loading && notifications.length === 0;
  const totalCount = notifications.length;

  const headerSubtitle = isInitialLoading
    ? "Loading notifications..."
    : unread > 0
      ? `${unread} unread ${unread === 1 ? "notification" : "notifications"}`
      : "You're all caught up";

  const handleMarkAllRead = async () => {
    if (markingAll) return;
    setMarkingAll(true);
    try {
      await markAllRead();
    } finally {
      setMarkingAll(false);
    }
  };

  const handleNotificationClick = (notification: any) => {
    // Mark as read if unread
    if (!notification.is_read) {
      markRead([notification.id]);
    }
    // Notify parent to open order details
    if (onNotificationClick) {
      onNotificationClick(notification);
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      {/* Header */}
      <div className="flex flex-wrap items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
            <Bell className="h-5 w-5 sm:h-6 sm:w-6 text-secondary" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              Notifications
            </h1>
            <p className="text-xs sm:text-sm text-gray-500" aria-live="polite">
              {headerSubtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-start sm:justify-end">
          {unread > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={markingAll}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-secondary hover:bg-secondary/80 border border-indigo-100 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/60 focus-visible:ring-offset-2 transition"
            >
              <CheckCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Mark all read</span>
              <span className="sm:hidden">Mark read</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div
        className="flex items-center gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-fit"
        role="group"
        aria-label="Filter notifications"
      >
        {(["all", "unread"] as const).map((f) => {
          const count = f === "all" ? totalCount : unread;
          const active = filter === f;

          return (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              aria-pressed={active}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold capitalize transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/60 ${
                active
                  ? "bg-white text-secondary shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {f}
              <span
                className={`text-[10px] sm:text-xs font-bold ${
                  active ? "text-secondary" : "text-gray-400"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* List states */}
      {isInitialLoading ? (
        <div
          className="space-y-2"
          aria-label="Loading notifications"
          aria-busy="true"
        >
          {Array.from({ length: 6 }).map((_, index) => (
            <NotificationSkeleton key={index} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 sm:py-20 text-center px-4 rounded-2xl border border-gray-100 bg-white">
          <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            {filter === "unread" ? (
              <CheckCheck className="h-7 w-7 sm:h-8 sm:w-8 text-gray-400" />
            ) : (
              <Bell className="h-7 w-7 sm:h-8 sm:w-8 text-gray-400" />
            )}
          </div>
          <p className="text-sm sm:text-base font-bold text-gray-900">
            {filter === "unread"
              ? "You're all caught up"
              : "No notifications yet"}
          </p>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-xs text-center">
            {filter === "unread"
              ? "You have no unread notifications."
              : "New orders, payments and deliveries will appear here."}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {grouped.map((group) => (
            <section key={group.label} aria-label={group.label}>
              <div className="flex items-center justify-between px-1 mb-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  {group.label}
                </h2>
                <span className="text-xs font-medium text-gray-400">
                  {group.items.length}
                </span>
              </div>

              <div className="space-y-2">
                {group.items.map((n) => {
                  const { Icon, label, color, bg } = getEventMeta(n.event);

                  return (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => handleNotificationClick(n)}
                      aria-label={`Notification: ${n.title}`}
                      className={`flex gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl border transition w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/60 focus-visible:ring-offset-2 ${
                        n.is_read
                          ? "bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm cursor-pointer"
                          : "bg-indigo-50/50 border-indigo-100 hover:border-secondary hover:shadow-sm cursor-pointer"
                      }`}
                    >
                      <span
                        className={`flex-shrink-0 h-10 w-10 sm:h-11 sm:w-11 rounded-full ${bg} flex items-center justify-center`}
                      >
                        <Icon
                          className={`h-4 w-4 sm:h-5 sm:w-5 ${color}`}
                          aria-hidden="true"
                        />
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          <span
                            className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-wide ${color}`}
                          >
                            {label}
                          </span>
                          <span className="text-[10px] sm:text-[11px] text-gray-400">
                            · {formatRelativeTime(n.created_at)}
                          </span>
                          {!n.is_read && (
                            <>
                              <span
                                className="ml-auto h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-secondary flex-shrink-0"
                                aria-hidden="true"
                              />
                              <span className="sr-only">Unread</span>
                            </>
                          )}
                        </span>

                        <span className="block text-sm sm:text-base font-bold text-gray-900 mt-0.5">
                          {n.title}
                        </span>
                        <span className="block text-xs sm:text-sm text-gray-600 mt-0.5 break-words whitespace-pre-line">
                          {n.body}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}