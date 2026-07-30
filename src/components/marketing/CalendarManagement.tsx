import React, { useState, useEffect, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Eye,
  X,
  FileDown,
  List,
  Grid,
} from "lucide-react";
import { useToast } from "../../hooks/useToast";
import { Toast } from "../ui/Toast";
import { FormModal } from "../ui/FormModal";
import { DeleteConfirmModal } from "../ui/DeleteConfirmModal";

// ─── Types ───────────────────────────────────────────────
interface CalendarEvent {
  id: number;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string;
  description?: string;
  type: "task" | "event" | "reminder" | "meeting";
  priority?: "low" | "medium" | "high";
  completed?: boolean;
  taskId?: number;
}

// ─── Mock Tasks (same as TasksManagement) ──────────────
const mockTasks = [
  {
    id: 1,
    title: "Follow up with Abyssinia Trading",
    description: "Call Abebe Kebede to discuss pricing and next steps.",
    status: "pending",
    priority: "high",
    due_date: "2025-02-20",
    created_at: "2025-01-16T10:00:00Z",
    updated_at: "2025-01-16T10:00:00Z",
    assigned_to: 4,
  },
  {
    id: 2,
    title: "Prepare proposal for Ethio Telecom",
    description: "Draft the service agreement and send for review.",
    status: "in_progress",
    priority: "medium",
    due_date: "2025-02-25",
    created_at: "2025-01-15T14:30:00Z",
    updated_at: "2025-01-16T09:00:00Z",
    assigned_to: 4,
  },
  {
    id: 3,
    title: "Send thank-you email to Zemen Bank",
    description: "After the meeting, send a follow-up email with meeting notes.",
    status: "completed",
    priority: "low",
    due_date: "2025-01-14",
    created_at: "2025-01-13T11:00:00Z",
    updated_at: "2025-01-14T08:30:00Z",
    assigned_to: 4,
  },
  {
    id: 4,
    title: "Schedule demo with Habesha Foods",
    description: "Arrange a product demo for Meron Ayele.",
    status: "pending",
    priority: "medium",
    due_date: "2025-02-28",
    created_at: "2025-01-16T16:00:00Z",
    updated_at: "2025-01-16T16:00:00Z",
    assigned_to: 4,
  },
];

// ─── Mock Events ────────────────────────────────────────
const mockEvents: CalendarEvent[] = [
  {
    id: 1,
    title: "Team Meeting",
    date: "2025-02-18",
    time: "10:00",
    description: "Weekly sync with the marketing team",
    type: "meeting",
    priority: "medium",
  },
  {
    id: 2,
    title: "Client Call - Abyssinia Trading",
    date: "2025-02-21",
    time: "14:30",
    description: "Discuss proposal details",
    type: "meeting",
    priority: "high",
  },
  {
    id: 3,
    title: "Coffee with Tigist",
    date: "2025-02-22",
    time: "09:00",
    description: "Follow-up on referral opportunities",
    type: "event",
    priority: "low",
  },
];

// ─── Configs ─────────────────────────────────────────────
const typeConfig: Record<CalendarEvent["type"], { label: string; color: string; dotColor: string }> = {
  task: { label: "Task", color: "bg-blue-100 text-blue-700 border-blue-200", dotColor: "bg-blue-500" },
  event: { label: "Event", color: "bg-purple-100 text-purple-700 border-purple-200", dotColor: "bg-purple-500" },
  reminder: { label: "Reminder", color: "bg-amber-100 text-amber-700 border-amber-200", dotColor: "bg-amber-500" },
  meeting: { label: "Meeting", color: "bg-emerald-100 text-emerald-700 border-emerald-200", dotColor: "bg-emerald-500" },
};

const priorityConfig: Record<"low" | "medium" | "high", { label: string; color: string }> = {
  low: { label: "Low", color: "bg-gray-100 text-gray-600 border-gray-200" },
  medium: { label: "Medium", color: "bg-blue-100 text-blue-600 border-blue-200" },
  high: { label: "High", color: "bg-red-100 text-red-600 border-red-200" },
};

// ─── Helper functions ────────────────────────────────────
const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year: number, month: number): number => {
  return new Date(year, month, 1).getDay();
};

const formatDate = (year: number, month: number, day: number): string => {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

const isToday = (date: string): boolean => {
  return date === new Date().toISOString().split("T")[0];
};

// ─── Component ──────────────────────────────────────────
// ─── Skeleton Components ──────────────────────────────────
const SkeletonCalendarDay: React.FC = () => (
  <div className="relative min-h-[80px] sm:min-h-[100px] p-1.5 rounded-xl bg-gray-200/60 animate-pulse border border-transparent">
    <span className="h-4 w-6 bg-gray-300/70 rounded block"></span>
  </div>
);

const SkeletonCalendarGrid: React.FC = () => (
  <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 border border-white/50 shadow-sm overflow-hidden animate-pulse">
    <div className="grid grid-cols-7 gap-1 mb-2">
      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
        <div key={day} className="text-center py-2">
          <div className="h-4 w-8 bg-gray-300/70 rounded mx-auto"></div>
        </div>
      ))}
    </div>
    <div className="grid grid-cols-7 gap-1">
      {[...Array(42)].map((_, i) => (
        <SkeletonCalendarDay key={i} />
      ))}
    </div>
  </div>
);

const SkeletonSidebar: React.FC = () => (
  <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-5 border border-white/50 shadow-sm max-h-[500px] overflow-y-auto animate-pulse">
    <div className="flex items-center gap-2 mb-4">
      <div className="h-8 w-8 rounded-xl bg-gray-300/70"></div>
      <div className="h-5 w-32 bg-gray-300/70 rounded"></div>
      <div className="ml-auto h-5 w-8 bg-gray-300/70 rounded-full"></div>
    </div>
    {[...Array(6)].map((_, i) => (
      <div key={i} className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <div className="h-3 w-24 bg-gray-300/70 rounded"></div>
          <div className="h-3 w-12 bg-gray-300/70 rounded"></div>
        </div>
        <div className="space-y-1.5">
          {[...Array(3)].map((_, j) => (
            <div key={j} className="flex items-center gap-2 p-2 rounded-xl bg-white/60 border border-gray-100">
              <div className="w-2 h-2 rounded-full bg-gray-300/70"></div>
              <div className="flex-1">
                <div className="h-3 w-24 bg-gray-300/70 rounded"></div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="h-2.5 w-12 bg-gray-300/70 rounded"></div>
                  <div className="h-2.5 w-16 bg-gray-300/70 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

export default function CalendarManagement() {
  const { toast, showToast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"month" | "week" | "day">("month");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [newEvent, setNewEvent] = useState<Partial<CalendarEvent>>({
    title: "",
    date: "",
    time: "",
    description: "",
    type: "event",
    priority: "medium",
  });
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<CalendarEvent | null>(null);
  const [viewingEvent, setViewingEvent] = useState<CalendarEvent | null>(null);

  console.log("editingEvent", editingEvent)
  // ─── Fetch data ─────────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 500));
        setTasks(mockTasks);
        setEvents(mockEvents);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ─── Generate calendar days ────────────────────────────
  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    // Merge tasks into events (tasks appear on their due date)
    const allEvents: CalendarEvent[] = [
      ...events,
      ...tasks.map((task) => ({
        id: -task.id,
        title: task.title,
        date: task.due_date,
        description: task.description,
        type: "task" as const,
        priority: task.priority,
        completed: task.status === "completed",
        taskId: task.id,
      })),
    ];

    const days: Array<{ day: number; date: string; events: CalendarEvent[] }> = [];
    // const today = new Date();

    for (let i = 0; i < firstDay; i++) {
      const prevMonthDate = new Date(year, month, -firstDay + i + 1);
      const dateStr = formatDate(prevMonthDate.getFullYear(), prevMonthDate.getMonth(), prevMonthDate.getDate());
      days.push({ day: prevMonthDate.getDate(), date: dateStr, events: [] });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = formatDate(year, month, d);
      const dayEvents = allEvents.filter((e) => e.date === dateStr);
      days.push({ day: d, date: dateStr, events: dayEvents });
    }

    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const nextMonthDate = new Date(year, month + 1, i);
      const dateStr = formatDate(nextMonthDate.getFullYear(), nextMonthDate.getMonth(), nextMonthDate.getDate());
      days.push({ day: nextMonthDate.getDate(), date: dateStr, events: [] });
    }

    return { days, allEvents };
  }, [currentDate, events, tasks]);

  // ─── Navigation ─────────────────────────────────────────
  const goToPrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // ─── Open add modal for a day ──────────────────────────
  const openAddEvent = (date: string) => {
    setSelectedDate(date);
    setNewEvent({
      title: "",
      date: date,
      time: "",
      description: "",
      type: "event",
      priority: "medium",
    });
    setIsModalOpen(true);
  };

  // ─── CRUD handlers ──────────────────────────────────────
  const handleAddEvent = () => {
    if (!newEvent.title?.trim()) {
      showToast("error", "Title is required");
      return;
    }
    const event: CalendarEvent = {
      id: Math.max(...events.map((e) => e.id), 0) + 1,
      title: newEvent.title,
      date: newEvent.date || selectedDate,
      time: newEvent.time || "",
      description: newEvent.description || "",
      type: (newEvent.type as CalendarEvent["type"]) || "event",
      priority: (newEvent.priority as CalendarEvent["priority"]) || "medium",
    };
    setEvents([...events, event]);
    setIsModalOpen(false);
    setNewEvent({ title: "", date: "", time: "", description: "", type: "event", priority: "medium" });
    showToast("success", "Event added successfully");
  };

  // const handleUpdateEvent = () => {
  //   if (!editingEvent) return;
  //   if (!editingEvent.title?.trim()) {
  //     showToast("error", "Title is required");
  //     return;
  //   }
  //   setEvents(events.map((e) => (e.id === editingEvent.id ? editingEvent : e)));
  //   setEditingEvent(null);
  //   showToast("success", "Event updated successfully");
  // };

  const handleDeleteEvent = () => {
    if (!deletingEvent) return;
    setEvents(events.filter((e) => e.id !== deletingEvent.id));
    setDeletingEvent(null);
    showToast("success", "Event deleted successfully");
  };

  const handleViewEvent = (event: CalendarEvent) => {
    setViewingEvent(event);
  };

  // ─── Export ─────────────────────────────────────────────
  const handleExport = () => {
    const headers = ["Title", "Date", "Time", "Type", "Priority", "Description"];
    const rows = calendarData.allEvents.map((e) => [
      e.title,
      e.date,
      e.time || "—",
      typeConfig[e.type]?.label || e.type,
      e.priority ? priorityConfig[e.priority]?.label || e.priority : "—",
      e.description || "—",
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `calendar_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("success", "Export successful");
  };

  // Group events by date for the events sidebar
  const eventsByDate = useMemo(() => {
    const grouped: Record<string, CalendarEvent[]> = {};
    const sortedEvents = [...calendarData.allEvents].sort((a, b) => a.date.localeCompare(b.date));
    sortedEvents.forEach((e) => {
      if (!grouped[e.date]) grouped[e.date] = [];
      grouped[e.date].push(e);
    });
    return grouped;
  }, [calendarData.allEvents]);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 font-sans bg-gray-50/50 min-h-screen animate-pulse">
        {/* ─── Header Skeleton ──────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="h-8 w-48 bg-gray-300/70 rounded mb-2"></div>
            <div className="h-4 w-64 bg-gray-300/70 rounded"></div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-8 w-20 bg-gray-300/70 rounded-xl"></div>
            <div className="h-10 w-28 bg-gray-300/70 rounded-xl"></div>
          </div>
        </div>

        {/* ─── Calendar Controls Skeleton ──────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/60 backdrop-blur-xl rounded-2xl p-4 border border-white/50 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 bg-gray-300/70 rounded-xl"></div>
            <div className="h-8 w-16 bg-gray-300/70 rounded-xl"></div>
            <div className="h-9 w-9 bg-gray-300/70 rounded-xl"></div>
            <div className="h-6 w-40 bg-gray-300/70 rounded ml-2"></div>
          </div>
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
            <div className="h-8 w-20 bg-gray-300/70 rounded-lg"></div>
            <div className="h-8 w-20 bg-gray-300/70 rounded-lg"></div>
          </div>
        </div>

        {/* ─── Calendar Grid + Sidebar ────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <SkeletonCalendarGrid />
          </div>
          <div>
            <SkeletonSidebar />
          </div>
        </div>
      </div>
    );
  }

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const sortedDates = Object.keys(eventsByDate).sort();

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 font-sans bg-gray-50/50 min-h-screen">
      <Toast toast={toast} />
      {/* ─── Header ──────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-secondary tracking-tight flex items-center gap-2.5">
            <CalendarIcon className="h-6 w-6 sm:h-8 sm:w-8 text-secondary" />
            Calendar
          </h1>
          <p className="text-xs sm:text-sm text-secondary-light/80 mt-1">
            Manage your schedule, meetings, and task deadlines at a glance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-50 transition shadow-sm"
          >
            <FileDown className="h-4 w-4" />
            Export
          </button>
          <button
            onClick={() => openAddEvent(formatDate(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()))}
            className="flex items-center gap-1.5 px-4 py-2 bg-secondary text-white rounded-xl text-sm font-bold hover:shadow-lg transition active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Add Event
          </button>
        </div>
      </div>

      {/* ─── Calendar Controls ──────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/60 backdrop-blur-xl rounded-2xl p-4 border border-white/50 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={goToPrevMonth}
            className="p-2 rounded-xl hover:bg-gray-100 transition"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>
          <button
            onClick={goToToday}
            className="px-4 py-1.5 text-sm font-semibold text-secondary bg-secondary/10 rounded-xl hover:bg-secondary/20 transition"
          >
            Today
          </button>
          <button
            onClick={goToNextMonth}
            className="p-2 rounded-xl hover:bg-gray-100 transition"
          >
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </button>
          <h2 className="text-lg font-bold text-gray-800 ml-2">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
        </div>

        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => setView("month")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${view === "month" ? "bg-white text-secondary shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
          >
            <Grid className="h-3.5 w-3.5" />
            Month
          </button>
          <button
            onClick={() => setView("week")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${view === "week" ? "bg-white text-secondary shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
          >
            <List className="h-3.5 w-3.5" />
            Week
          </button>
        </div>
      </div>

      {/* ─── Calendar Grid ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-3 bg-white/60 backdrop-blur-xl rounded-3xl p-6 border border-white/50 shadow-sm overflow-hidden">
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day) => (
              <div key={day} className="text-center text-xs font-semibold text-gray-400 uppercase tracking-wider py-2">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calendarData.days.map((day, index) => {
              const isCurrentMonth = day.date.includes(`-${String(currentDate.getMonth() + 1).padStart(2, '0')}-`);
              const isTodayFlag = isToday(day.date);
              const hasEvents = day.events.length > 0;

              return (
                <div
                  key={index}
                  onClick={() => openAddEvent(day.date)}
                  className={`relative min-h-[80px] sm:min-h-[100px] p-1.5 rounded-xl transition-all duration-200 cursor-pointer hover:bg-gray-50/80 ${!isCurrentMonth ? "text-gray-300" : "text-gray-700"
                    } ${isTodayFlag ? "bg-secondary/5 border-2 border-secondary/30" : "border border-transparent hover:border-gray-200"}`}
                >
                  <span className={`text-xs font-medium ${isTodayFlag ? "text-secondary font-bold" : ""}`}>
                    {day.day}
                  </span>
                  {hasEvents && (
                    <div className="mt-1 space-y-0.5">
                      {day.events.slice(0, 3).map((e, i) => (
                        <div
                          key={i}
                          onClick={(ev) => { ev.stopPropagation(); handleViewEvent(e); }}
                          className="flex items-center gap-1 text-[9px] font-medium truncate px-1.5 py-0.5 rounded-full cursor-pointer hover:opacity-80 transition"
                          style={{ backgroundColor: `${typeConfig[e.type].dotColor}20`, color: typeConfig[e.type].dotColor.replace('bg-', 'text-') }}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${typeConfig[e.type].dotColor}`} />
                          {e.title}
                        </div>
                      ))}
                      {day.events.length > 3 && (
                        <span className="text-[8px] font-semibold text-gray-400 ml-1">
                          +{day.events.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── Events Sidebar ────────────────────────────── */}
        <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-5 border border-white/50 shadow-sm max-h-[500px] overflow-y-auto">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-secondary to-purple-600 flex items-center justify-center">
              <List className="h-4 w-4 text-white" />
            </div>
            <h3 className="text-sm font-bold text-gray-800">Upcoming Events</h3>
            <span className="ml-auto text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              {calendarData.allEvents.length}
            </span>
          </div>

          {sortedDates.length === 0 ? (
            <div className="text-center py-8">
              <CalendarIcon className="h-10 w-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No events scheduled</p>
              <p className="text-xs text-gray-400">Click a day to add an event</p>
            </div>
          ) : (
            sortedDates.slice(0, 10).map((date) => {
              const dayEvents = eventsByDate[date] || [];
              return (
                <div key={date} className="mb-4 last:mb-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      {new Date(date + "T00:00:00").toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                    <span className="text-[9px] font-semibold text-gray-300">{dayEvents.length} events</span>
                  </div>
                  <div className="space-y-1.5">
                    {dayEvents.slice(0, 4).map((e) => (
                      <div
                        key={e.id}
                        onClick={() => handleViewEvent(e)}
                        className="flex items-center gap-2 p-2 rounded-xl bg-white/60 border border-gray-100 hover:shadow-sm transition cursor-pointer group"
                      >
                        <span className={`w-2 h-2 rounded-full ${typeConfig[e.type].dotColor}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-800 truncate">{e.title}</p>
                          <div className="flex items-center gap-1.5">
                            {e.time && <span className="text-[9px] text-gray-400">{e.time}</span>}
                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${typeConfig[e.type].color}`}>
                              {typeConfig[e.type].label}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={(ev) => { ev.stopPropagation(); handleViewEvent(e); }}
                          className="opacity-0 group-hover:opacity-100 transition"
                        >
                          <Eye className="h-3.5 w-3.5 text-gray-400 hover:text-secondary" />
                        </button>
                      </div>
                    ))}
                    {dayEvents.length > 4 && (
                      <span className="text-[9px] text-gray-400 ml-2">+{dayEvents.length - 4} more</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ─── Add Event Modal ────────────────────────────── */}
      <FormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setNewEvent({ title: "", date: "", time: "", description: "", type: "event", priority: "medium" });
        }}
        title={`Add Event - ${selectedDate}`}
        onSubmit={handleAddEvent}
        submitting={false}
        maxWidth="lg"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newEvent.title || ""}
              onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
              placeholder="e.g. Client Meeting"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Time</label>
            <input
              type="time"
              value={newEvent.time || ""}
              onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Type</label>
            <select
              value={newEvent.type || "event"}
              onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value as CalendarEvent["type"] })}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
            >
              <option value="event">Event</option>
              <option value="meeting">Meeting</option>
              <option value="reminder">Reminder</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Priority</label>
            <select
              value={newEvent.priority || "medium"}
              onChange={(e) => setNewEvent({ ...newEvent, priority: e.target.value as CalendarEvent["priority"] })}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Description</label>
            <textarea
              value={newEvent.description || ""}
              onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 resize-none"
              rows={2}
              placeholder="Add details about this event..."
            />
          </div>
        </div>
      </FormModal>

      {/* ─── View Event Modal ────────────────────────────── */}
      {viewingEvent && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${typeConfig[viewingEvent.type].dotColor}`} />
                <h2 className="text-xl font-bold text-gray-900">{viewingEvent.title}</h2>
              </div>
              <button onClick={() => setViewingEvent(null)} className="p-1.5 rounded-full hover:bg-gray-100 transition">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Date</p>
                  <p className="text-sm font-medium text-gray-700">{viewingEvent.date}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Time</p>
                  <p className="text-sm font-medium text-gray-700">{viewingEvent.time || "—"}</p>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Type</p>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${typeConfig[viewingEvent.type].color}`}>
                  {typeConfig[viewingEvent.type].label}
                </span>
              </div>
              {viewingEvent.priority && (
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Priority</p>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${priorityConfig[viewingEvent.priority].color}`}>
                    {priorityConfig[viewingEvent.priority].label}
                  </span>
                </div>
              )}
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Description</p>
                <p className="text-sm text-gray-600">{viewingEvent.description || "No description"}</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              {viewingEvent.id > 0 && (
                <button
                  onClick={() => {
                    setEditingEvent(viewingEvent);
                    setViewingEvent(null);
                  }}
                  className="px-4 py-2 bg-secondary text-white rounded-xl text-sm font-bold hover:shadow-lg transition"
                >
                  Edit
                </button>
              )}
              <button onClick={() => setViewingEvent(null)} className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Delete Confirmation ──────────────────────────── */}
      <DeleteConfirmModal
        isOpen={!!deletingEvent}
        title={deletingEvent?.title || ""}
        onConfirm={handleDeleteEvent}
        onCancel={() => setDeletingEvent(null)}
      />
    </div>
  );
}