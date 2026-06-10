import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, ShieldAlert, CheckCircle2, AlertTriangle, X, Check } from "lucide-react";
import { ease } from "@/lib/motion";

interface Notification {
  id: string;
  type: "alert" | "success" | "warning";
  title: string;
  body: string;
  time: string;
  read: boolean;
}

const INITIAL: Notification[] = [
  { id: "n1", type: "alert",   title: "Counterfeit Detected",      body: "Batch FAKE-001 flagged at Karachi distribution hub.", time: "2 min ago",  read: false },
  { id: "n2", type: "warning", title: "Geo-Mismatch Alert",        body: "Ventolin scanned in Dubai — registered in Lahore.",  time: "8 min ago",  read: false },
  { id: "n3", type: "success", title: "Batch Verified",             body: "PNX-49281-A fully cleared · 25,000 units.",          time: "15 min ago", read: false },
  { id: "n4", type: "alert",   title: "Duplicate QR Scan",         body: "Same QR scanned 4× in 2 minutes — bot detected.",   time: "1 hr ago",   read: true  },
  { id: "n5", type: "success", title: "DRAP Report Submitted",     body: "Monthly compliance report sent successfully.",        time: "3 hrs ago",  read: true  },
];

const TYPE_CFG = {
  alert:   { icon: ShieldAlert,   color: "#dc2626", bg: "#dc262611", border: "#dc262633" },
  success: { icon: CheckCircle2,  color: "#16a34a", bg: "#16a34a11", border: "#16a34a33" },
  warning: { icon: AlertTriangle, color: "#f59e0b", bg: "#f59e0b11", border: "#f59e0b33" },
};

export function NotificationDropdown() {
  const [open, setOpen]     = useState(false);
  const [items, setItems]   = useState(INITIAL);
  const ref                 = useRef<HTMLDivElement>(null);
  const unread              = items.filter(n => !n.read).length;

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markAllRead = () => setItems(prev => prev.map(n => ({ ...n, read: true })));
  const dismiss = (id: string) => setItems(prev => prev.filter(n => n.id !== id));

  return (
    <div ref={ref} className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-card/80 backdrop-blur transition-all duration-200 hover:bg-accent hover:border-primary/30"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4 text-muted-foreground" />
        {unread > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-black text-white ring-2 ring-background"
          >
            {unread}
          </motion.span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.2, ease }}
            className="absolute right-0 top-11 z-50 w-[360px] overflow-hidden rounded-2xl border border-border/60 bg-card/95 shadow-elegant backdrop-blur-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/40 px-4 py-3">
              <div>
                <p className="text-[13px] font-bold">Notifications</p>
                <p className="text-[10px] text-muted-foreground">{unread} unread</p>
              </div>
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/10"
                >
                  <Check className="h-3 w-3" /> Mark all read
                </button>
              )}
            </div>

            {/* Items */}
            <ul className="max-h-[340px] overflow-y-auto divide-y divide-border/20">
              {items.map(n => {
                const cfg = TYPE_CFG[n.type];
                const Icon = cfg.icon;
                return (
                  <motion.li
                    key={n.id}
                    layout
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className={`relative flex gap-3 px-4 py-3.5 transition-colors hover:bg-accent/30 ${!n.read ? "bg-primary/[0.03]" : ""}`}
                  >
                    {/* Unread dot */}
                    {!n.read && (
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-primary" />
                    )}
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border"
                      style={{ borderColor: cfg.border, background: cfg.bg }}
                    >
                      <Icon className="h-4 w-4" style={{ color: cfg.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold leading-snug">{n.title}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground leading-relaxed">{n.body}</p>
                      <p className="mt-1 text-[10px] text-muted-foreground/70">{n.time}</p>
                    </div>
                    <button
                      onClick={() => dismiss(n.id)}
                      className="shrink-0 rounded-lg p-1 text-muted-foreground/40 transition-colors hover:bg-accent hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </motion.li>
                );
              })}
              {items.length === 0 && (
                <li className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
                  <Bell className="h-8 w-8 opacity-30" />
                  <p className="text-[13px]">All caught up!</p>
                </li>
              )}
            </ul>

            {/* Footer */}
            <div className="border-t border-border/40 px-4 py-2.5">
              <button className="w-full text-center text-[11px] font-semibold text-primary transition-colors hover:underline">
                View all notifications
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
