import { ease } from "@/lib/motion";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, type ReactNode } from "react";

// ease is imported from @/lib/motion — see that file for the canonical definition

// ── Page transition wrapper ──────────────────────────────────────────────────
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.45, ease }}
    >
      {children}
    </motion.div>
  );
}

// ── Stagger reveal container ─────────────────────────────────────────────────
export function StaggerReveal({
  children,
  className = "",
  staggerDelay = 0.08,
}: {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: staggerDelay } },
      }}
    >
      {children}
    </motion.div>
  );
}

// ── Individual stagger item ──────────────────────────────────────────────────
export function RevealItem({
  children,
  className = "",
  direction = "up",
}: {
  children: ReactNode;
  className?: string;
  direction?: "up" | "left" | "right" | "scale";
}) {
  const variants = {
    up:    { hidden: { opacity: 0, y: 20 },      visible: { opacity: 1, y: 0 } },
    left:  { hidden: { opacity: 0, x: -20 },     visible: { opacity: 1, x: 0 } },
    right: { hidden: { opacity: 0, x: 20 },      visible: { opacity: 1, x: 0 } },
    scale: { hidden: { opacity: 0, scale: 0.9 }, visible: { opacity: 1, scale: 1 } },
  }[direction];

  return (
    <motion.div
      className={className}
      variants={{
        hidden:  variants.hidden,
        visible: { ...variants.visible, transition: { duration: 0.55, ease } },
      }}
    >
      {children}
    </motion.div>
  );
}

// ── Floating ambient particles ───────────────────────────────────────────────
const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: 2 + Math.random() * 3,
  delay: Math.random() * 4,
  duration: 4 + Math.random() * 4,
}));

export function FloatingParticles({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {PARTICLES.map((p) => (
        <motion.span
          key={p.id}
          className="absolute rounded-full bg-primary/30"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
          }}
          animate={{
            y:       [0, -60, 0],
            x:       [0, 15, -10, 0],
            opacity: [0, 0.7, 0.5, 0],
            scale:   [1, 0.8, 1],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// ── Blockchain orbit visualization ───────────────────────────────────────────
export function BlockchainOrb({ className = "" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Core */}
      <motion.div
        className="h-14 w-14 rounded-full bg-gradient-primary shadow-elegant flex items-center justify-center"
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="h-6 w-6 rounded-full bg-primary-foreground/20" />
      </motion.div>

      {/* Ring 1 */}
      <div className="absolute h-28 w-28 rounded-full border border-primary/20" style={{ transformStyle: "preserve-3d" }}>
        {[0, 120, 240].map((deg, i) => (
          <motion.span
            key={i}
            className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_8px_2px_oklch(0.50_0.20_265_/_0.5)]"
            style={{ left: "50%", top: "50%" }}
            animate={{ rotate: [deg, deg + 360] }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear", delay: i * 0.3 }}
          >
            <span
              className="block h-3 w-3 rounded-full bg-primary"
              style={{
                transform: `translateX(56px)`,
              }}
            />
          </motion.span>
        ))}
      </div>

      {/* Ring 2 */}
      <div className="absolute h-44 w-44 rounded-full border border-primary/10">
        {[60, 180, 300].map((deg, i) => (
          <motion.span
            key={i}
            className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-success/70"
            style={{ left: "50%", top: "50%" }}
            animate={{ rotate: [deg, deg - 360] }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear", delay: i * 0.5 }}
          >
            <span className="block h-2.5 w-2.5 rounded-full bg-success" style={{ transform: "translateX(88px)" }} />
          </motion.span>
        ))}
      </div>
    </div>
  );
}

// ── Scan pulse rings ─────────────────────────────────────────────────────────
export function ScanPulse({
  tone = "primary",
  className = "",
}: {
  tone?: "primary" | "success" | "destructive" | "warning";
  className?: string;
}) {
  const color = {
    primary:     "oklch(0.50 0.20 265 / 0.5)",
    success:     "oklch(0.60 0.18 150 / 0.5)",
    destructive: "oklch(0.56 0.22 22  / 0.5)",
    warning:     "oklch(0.76 0.17 68  / 0.5)",
  }[tone];

  return (
    <div className={`relative grid place-items-center ${className}`}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="absolute rounded-full border"
          style={{ borderColor: color }}
          animate={{ scale: [1, 2.5], opacity: [0.8, 0] }}
          transition={{ duration: 2, delay: i * 0.65, repeat: Infinity, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

// ── Animated gradient text ────────────────────────────────────────────────────
export function GradientText({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <motion.span
      className={`bg-gradient-primary bg-clip-text text-transparent ${className}`}
      animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
      transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
      style={{ backgroundSize: "200% auto" }}
    >
      {children}
    </motion.span>
  );
}

// ── Section reveal wrapper (simpler alternative) ──────────────────────────────
export function FadeUp({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.6, delay, ease }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
