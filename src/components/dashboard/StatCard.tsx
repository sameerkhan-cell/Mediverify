import type { LucideIcon } from "lucide-react";
import { ArrowUpRight, ArrowDownRight, TrendingUp } from "lucide-react";
import { AnimatedCounter } from "@/components/site/AnimatedCounter";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { TiltCard } from "@/components/motion/TiltCard";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: number;
  suffix?: string;
  delta?: number;
  tone?: "primary" | "success" | "warning" | "destructive";
  description?: string;
  sparkline?: number[];
}

const TONE = {
  primary:     { icon: "bg-primary/10 text-primary",      badge_up: "bg-primary/10 text-primary",      bar: "bg-gradient-primary" },
  success:     { icon: "bg-success/10 text-success",      badge_up: "bg-success/10 text-success",      bar: "bg-gradient-success" },
  warning:     { icon: "bg-warning/10 text-warning-foreground", badge_up: "bg-warning/10 text-warning-foreground", bar: "bg-warning" },
  destructive: { icon: "bg-destructive/10 text-destructive", badge_up: "bg-destructive/10 text-destructive", bar: "bg-destructive" },
};

export function StatCard({
  icon: Icon, label, value, suffix, delta, tone = "primary", description, sparkline,
}: StatCardProps) {
  const t = TONE[tone];
  const up = (delta ?? 0) >= 0;

  return (
    <TiltCard intensity={5} className="h-full">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        data-dash-card
        className="card-premium group relative overflow-hidden p-5 sm:p-6 h-full cursor-default"
      >
      {/* Subtle top-left gradient */}
      <div className={cn("absolute -left-6 -top-6 h-20 w-20 rounded-full blur-2xl opacity-40 transition-opacity duration-500 group-hover:opacity-70", t.icon)} />

      <div className="relative flex items-start justify-between">
        <div className={cn("grid h-10 w-10 place-items-center rounded-xl transition-transform duration-300 group-hover:scale-110 shrink-0", t.icon)}>
          <Icon className="h-[18px] w-[18px]" />
        </div>
        {delta !== undefined && (
          <span className={cn(
            "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold",
            up ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
          )}>
            {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(delta)}%
          </span>
        )}
      </div>

      <p className="relative mt-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{label}</p>
      <p className="relative mt-1.5 text-[1.75rem] font-bold tracking-tight tabular-nums">
        <AnimatedCounter value={value} suffix={suffix} />
      </p>

      {description && (
        <p className="relative mt-1.5 text-[12px] text-muted-foreground">{description}</p>
      )}

      {/* Mini sparkline */}
      {sparkline && (
        <div className="relative mt-4 flex items-end gap-0.5 h-7">
          {sparkline.map((v, i) => {
            const max = Math.max(...sparkline);
            const pct = max > 0 ? (v / max) * 100 : 0;
            return (
              <motion.div
                key={i}
                initial={{ scaleY: 0 }}
                whileInView={{ scaleY: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                style={{ height: `${pct}%`, transformOrigin: "bottom" }}
                className={cn("flex-1 rounded-sm opacity-60 group-hover:opacity-90 transition-opacity duration-300", t.bar)}
              />
            );
          })}
        </div>
      )}

      {/* Bottom gradient line */}
      <div className={cn("absolute bottom-0 left-0 h-[2px] w-full opacity-0 group-hover:opacity-100 transition-opacity duration-500", t.bar)} />
    </motion.div>
    </TiltCard>
  );
}

// ── Compact metric row for dense layouts ─────────────────────────────────────
export function MetricRow({ icon: Icon, label, value, tone = "primary" }: {
  icon: LucideIcon; label: string; value: string | number; tone?: keyof typeof TONE;
}) {
  const t = TONE[tone];
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-secondary/30 px-4 py-3 transition-colors hover:bg-secondary/50">
      <div className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-lg", t.icon)}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className="text-[14px] font-semibold tabular-nums">{value}</p>
      </div>
      <TrendingUp className="h-3.5 w-3.5 text-muted-foreground/40" />
    </div>
  );
}
