"use client";

import { ArrowLeft } from "lucide-react";
import type { NotificationItem } from "@/components/types";

interface NotificationsScreenProps {
  notifications: NotificationItem[];
  setNotifications: (notifs: NotificationItem[]) => void;
  onBack: () => void;
}

export default function NotificationsScreen({
  notifications,
  setNotifications,
  onBack,
}: NotificationsScreenProps) {
  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: number) => {
    setNotifications(notifications.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  return (
    <div className="fixed inset-0 bg-[#08080D] z-[150] animate-in slide-in-from-right duration-300">
      <div className="h-full flex flex-col p-4 max-w-md sm:max-w-lg mx-auto">
        {/* Header */}
        <button onClick={onBack} className="flex items-center gap-2 text-foreground mb-6 hover:text-primary transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Inapoi</span>
        </button>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "var(--font-syne)" }}>
            Notificari
          </h1>
          {unreadCount > 0 && (
            <span className="bg-primary text-primary-foreground px-2.5 py-0.5 rounded-full text-xs font-bold">{unreadCount}</span>
          )}
        </div>

        {/* Mark All as Read Button */}
        {unreadCount > 0 && (
          <button onClick={markAllAsRead} className="mb-4 px-3 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors">
            Marcheaza toate ca citite
          </button>
        )}

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto space-y-2">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <span className="text-3xl mb-2">✓</span>
              <p className="text-center text-muted-foreground">Esti la zi cu toate notificările</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <button
                key={notif.id}
                onClick={() => markAsRead(notif.id)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  notif.read ? "bg-card border-border" : "bg-primary/5 border-l-4 border-l-primary border-r-0 border-t-0 border-b-0 border-border"
                }`}
              >
                <div className="flex gap-3">
                  <span className="text-lg shrink-0">{notif.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm">{notif.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{notif.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">{notif.time}</p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
