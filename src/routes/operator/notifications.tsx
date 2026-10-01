import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Bell, BellRing, CheckCheck } from "lucide-react";
import { EmptyState, PortalPage, SectionCard, UnderlineTabs } from "@/components/desktop";
import { Button } from "@/components/ui/button";
import { formatDateTime, useAppStore, useNotifications } from "@/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/operator/notifications")({
  component: NotificationsScreen,
});

const TAB_KEYS = ["all", "unread"] as const;
type TabKey = (typeof TAB_KEYS)[number];

function NotificationsScreen() {
  const notifications = useNotifications("customer");
  const markNotificationRead = useAppStore((s) => s.markNotificationRead);
  const [tab, setTab] = useState<TabKey>("all");

  const sorted = [...notifications].sort(
    (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime(),
  );
  const unreadCount = sorted.filter((notification) => !notification.read).length;
  const rows = tab === "unread" ? sorted.filter((notification) => !notification.read) : sorted;

  return (
    <PortalPage
      title="Notifications"
      description="Application, document and payment updates relevant to your operator account."
      breadcrumb={[{ label: "Operator" }, { label: "Notifications" }]}
      tabs={
        <UnderlineTabs
          value={tab}
          onChange={(key) => setTab(key as TabKey)}
          tabs={[
            { key: "all", label: "All", count: sorted.length },
            { key: "unread", label: "Unread", count: unreadCount },
          ]}
        />
      }
    >
      <SectionCard padded={false}>
        {rows.length === 0 ? (
          <EmptyState
            icon={Bell}
            title={tab === "unread" ? "No unread notifications" : "No notifications"}
            description="You are up to date. New activity will appear here."
          />
        ) : (
          <ul className="divide-y divide-border-soft">
            {rows.map((notification) => (
              <li
                key={notification.id}
                className={cn(
                  "flex items-start justify-between gap-4 px-5 py-4",
                  !notification.read && "bg-info-soft/40",
                )}
              >
                <div className="flex min-w-0 gap-3">
                  <span
                    className={cn(
                      "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                      notification.read
                        ? "bg-surface-muted text-text-subtle"
                        : "bg-info-soft text-accent",
                    )}
                  >
                    {notification.read ? <Bell size={16} /> : <BellRing size={16} />}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wide text-text-subtle">
                        {notification.type}
                      </span>
                      {!notification.read ? (
                        <span className="rounded-full bg-accent px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-accent-foreground">
                          New
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-[13px] font-medium text-text-dark">
                      {notification.text}
                    </p>
                    <p className="mt-0.5 text-[11px] text-text-subtle">
                      {formatDateTime(notification.time)}
                    </p>
                  </div>
                </div>

                {notification.read ? (
                  <span className="flex shrink-0 items-center gap-1.5 text-[11px] font-semibold text-text-subtle">
                    <CheckCheck size={14} /> Read
                  </span>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={() => markNotificationRead(notification.id)}
                  >
                    Mark read
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </PortalPage>
  );
}
