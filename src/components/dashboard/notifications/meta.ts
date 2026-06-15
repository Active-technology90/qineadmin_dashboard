// src/components/dashboard/notifications/meta.ts
import {
  Bell,
  CreditCard,
  AlertTriangle,
  ShoppingBag,
  Clock,
  Truck,
  PackageCheck,
  type LucideIcon,
} from "lucide-react";

export interface EventMeta {
  Icon: LucideIcon;
  label: string;
  color: string; // text color
  bg: string; // icon background
}

export function getEventMeta(event: string): EventMeta {
  switch (event) {
    case "order.paid":
      return { Icon: CreditCard, label: "Payment received", color: "text-emerald-600", bg: "bg-emerald-50" };
    case "order.payment_failed":
      return { Icon: AlertTriangle, label: "Payment failed", color: "text-red-600", bg: "bg-red-50" };
    case "vendororder.new":
      return { Icon: ShoppingBag, label: "New order", color: "text-indigo-600", bg: "bg-indigo-50" };
    case "vendororder.preparing":
      return { Icon: Clock, label: "Being prepared", color: "text-amber-600", bg: "bg-amber-50" };
    case "delivery.assigned":
      return { Icon: Truck, label: "Delivery assigned", color: "text-blue-600", bg: "bg-blue-50" };
    case "delivery.out_for_delivery":
      return { Icon: Truck, label: "Out for delivery", color: "text-blue-600", bg: "bg-blue-50" };
    case "delivery.delivered":
      return { Icon: PackageCheck, label: "Delivered", color: "text-emerald-600", bg: "bg-emerald-50" };
    default:
      return { Icon: Bell, label: "Notification", color: "text-gray-600", bg: "bg-gray-100" };
  }
}

export function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const seconds = Math.floor((Date.now() - then) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}
