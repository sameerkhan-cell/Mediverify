import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, ShieldCheck, AlertTriangle, Zap, Cpu,
  Globe2, Lock, CheckCircle2, XCircle,
  BarChart3, Clock,
} from "lucide-react";
import {
  AreaChart, Area, ResponsiveContainer, Tooltip, CartesianGrid, XAxis, YAxis,
} from "recharts";
import { useCountUp } from "@/hooks/use-count-up";
import { ease } from "@/lib/motion";

const FEED_POOL = [
  { msg: "Panadol Extra 500mg verified", loc: "Karachi", type: "ok" as const },
  { msg: "DUPLICATE QR — Ventolin", loc: "Dubai", type: "bad" as const },
  { msg: "Augmentin 625mg confirmed", loc: "Lahore", type: "ok" as const },
  { msg: "Geo-mismatch flagged", loc: "London", type: "warn" as const },
  { msg: "Brufen 400mg verified", loc: "Islamabad", type: "ok" as const },
  { msg: "COUNTERFEIT — Disprol Clone", loc: "Karachi", type: "bad" as const },
  { msg: "Calpol Syrup authenticated", loc: "Multan", type: "ok" as const },
  { msg: "Bot scan pattern detected", loc: "Rawalpindi", type: "warn" as const },
];

const generateChart = () =>
  Array.from({ length: 20 }, (_, i) => ({
    t: i,
    genuine: Math.round(120 + Math.sin(i / 2.5) * 50 + Math.random() * 30),
    flagged: Math.round(4 + Math.random() * 10),
  }));

export function LiveBlockchainDashboard() {
  const [chartData, setChartData] = useState(generateChart);
  const [feed, setFeed] = useState(
    FEED_POOL.slice(0, 5).map((f, i) => ({ id: i, ...f, ago: `${(i + 1) * 2}m ago` }))
  );
  const [scanRate, setScanRate] = useState(342);
  const [integrity, setIntegrity] = useState(98.7);
  const [tick, setTick] = useState(0);

  const totalScans = useCountUp(48_321);
  const genuine    = useCountUp(47_190);
  const suspicious = useCountUp(918);
  const fake       = useCountUp(213);

  useEffect(() => {
    const id = setInterval(() => {
      const pick = FEED_POOL[Math.floor(Math.random() * FEED_POOL.length)];
      setFeed(f => [{ id: Date.now(), ...pick, ago: "just now" }, ...f].slice(0, 7));
      setScanRate(v => Math.max(280, Math.min(420, v + Math.round((Math.random() - 0.5) * 18))));
      setIntegrity(v => Math.max(97, Math.min(99.9, +(v + (Math.random() - 0.5) * 0.2).toFixed(1))));
      setChartData(prev => {
        const next = [...prev.slice(1), {
          t: prev[prev.length - 1].t + 1,
          genuine: Math.round(120 + Math.random() * 80),
          flagged: Math.round(2 + Math.random() * 12),
        }];
        return next;
      });
      setTick(t => t + 1);
    }, 2000);
    return () => clearInterval(id);
  }, []);

  const STATS = [
    { icon: Activity,      label: "Total Scans",    value: totalScans.toLocaleString(), delta: "+5.2%",  color: "#1a56db", glow: "#1a56db33" },
    { icon: ShieldCheck,   label: "Genuine",        value: genuine.toLocaleString(),    delta: "+3.1%",  color: "#16a34a", glow: "#16a34a33" },
    { icon: AlertTriangle, label: "Suspicious",     value: suspicious.toLocaleString(), delta: "-8.4%",  color: "#f59e0b", glow: "#f59e0b33" },
    { icon: XCircle,       label: "Counterfeits",   value: fake.toLocaleString(),       delta: "-12.3%", color: "#dc2626", glow: "#dc262633" },
  ];

  const NODES = [
    { label: "AI Engine v4.2", ok: true },
    { label: "Blockchain Sync", ok: true },
    { label: "API Gateway", ok: true },
    { label: "QR Scanner", ok: true },
    { label: "Geo-IP Service", ok: true },
    { label: "Alert System", ok: false },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1a56db]/10 border border-[#1a56db]/20 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-[#1a56db] mb-2">
            <motion.span
              className="h-1.5 w-1.5 rounded-full bg-[#1a56db]"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            />
            Live Blockchain Dashboard
          </span>
          <h2 className="text-2xl font-bold tracking-tight">Command Center</h2>
          <p className="mt-1 text-[13px] font-medium text-foreground/80">
            Real-time MediVerify blockchain network · {scanRate} scans/min
          </p>
        </div>
        <div className="hidden sm:flex flex-col items-end gap-1">
          <div
            className="flex items-center gap-2 rounded-xl border px-4 py-2"
            style={{ borderColor: "#16a34a44", background: "#16a34a0d" }}
          >
            <motion.div
              className="h-2.5 w-2.5 rounded-full bg-[#16a34a]"
              animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
            <span className="text-[12px] font-bold text-[#16a34a]">Network: HEALTHY</span>
          </div>
          <span className="text-[11px] font-medium text-foreground/80">
            Integrity: <strong className="text-[#16a34a]">{integrity}%</strong>
          </span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STATS.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.5, ease }}
              className="relative overflow-hidden rounded-2xl border p-5"
              style={{
                borderColor: `${s.color}33`,
                background: `${s.color}08`,
                boxShadow: `0 0 30px 0 ${s.glow}`,
              }}
            >
              {/* Background glow orb */}
              <div
                className="absolute -top-8 -right-8 h-24 w-24 rounded-full opacity-20"
                style={{ background: `radial-gradient(circle, ${s.color}, transparent 70%)` }}
              />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-xl border"
                    style={{ borderColor: `${s.color}44`, background: `${s.color}15` }}
                  >
                    <Icon className="h-4 w-4" style={{ color: s.color }} />
                  </div>
                  <span
                    className="text-[10px] font-bold rounded-full px-2 py-0.5"
                    style={{ color: s.color, background: `${s.color}15` }}
                  >
                    {s.delta}
                  </span>
                </div>
                <p className="text-2xl font-black tabular-nums" style={{ color: s.color }}>
                  {s.value}
                </p>
                <p className="mt-1 text-[12px] text-foreground/80 font-bold">{s.label}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Chart + Feed + Nodes */}
      <div className="grid gap-5 lg:grid-cols-5">
        {/* Area Chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease }}
          className="lg:col-span-3 rounded-2xl border border-border/40 bg-card/60 p-6 backdrop-blur-sm"
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-[14px] font-semibold">Verification Stream</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Live scan analytics · last 20 events</p>
            </div>
            <div className="flex items-center gap-4 text-[11px] font-medium">
              {[{ color: "#16a34a", label: "Genuine" }, { color: "#dc2626", label: "Flagged" }].map(l => (
                <span key={l.label} className="flex items-center gap-1.5 text-foreground/80">
                  <span className="h-2 w-2 rounded-full" style={{ background: l.color }} />
                  {l.label}
                </span>
              ))}
            </div>
          </div>
          <div className="h-52">
            <ResponsiveContainer>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="dg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#16a34a" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#16a34a" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="df" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#dc2626" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="#dc2626" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="t" hide />
                <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    fontSize: 12,
                    color: "var(--foreground)",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                  }}
                />
                <Area type="monotone" dataKey="genuine" stroke="#16a34a" strokeWidth={2.5} fill="url(#dg)" name="Genuine" />
                <Area type="monotone" dataKey="flagged" stroke="#dc2626" strokeWidth={2} fill="url(#df)" name="Flagged" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Live Feed */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1, duration: 0.5, ease }}
          className="lg:col-span-2 rounded-2xl border border-border/40 bg-card/60 overflow-hidden backdrop-blur-sm"
        >
          <div className="border-b border-border/40 px-5 py-4 flex items-center justify-between">
            <h3 className="text-[13px] font-semibold">Live Activity</h3>
            <motion.span
              className="flex items-center gap-1.5 text-[10px] text-[#16a34a] font-bold"
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#16a34a]" />
              LIVE
            </motion.span>
          </div>
          <ul className="divide-y divide-border/20 overflow-auto" style={{ maxHeight: 260 }}>
            <AnimatePresence initial={false}>
              {feed.map(f => (
                <motion.li
                  key={f.id}
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease }}
                  className="flex items-center gap-3 px-5 py-3"
                >
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{
                      background: f.type === "ok" ? "#16a34a" : f.type === "warn" ? "#f59e0b" : "#dc2626",
                      boxShadow: `0 0 6px ${f.type === "ok" ? "#16a34a" : f.type === "warn" ? "#f59e0b" : "#dc2626"}`,
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-[12px] font-bold text-foreground/90">{f.msg}</p>
                    <p className="flex items-center gap-1 text-[10px] font-medium text-foreground/70">
                      <Globe2 className="h-3 w-3" />{f.loc} · {f.ago}
                    </p>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </motion.div>
      </div>

      {/* Network Node Status */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, ease }}
        className="rounded-2xl border border-border/40 bg-card/60 p-5 backdrop-blur-sm"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[13px] font-semibold flex items-center gap-2">
            <Cpu className="h-4 w-4 text-[#1a56db]" /> Network Node Status
          </h3>
          <span className="text-[11px] text-muted-foreground">
            {NODES.filter(n => n.ok).length}/{NODES.length} nodes online
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {NODES.map((node, i) => (
            <motion.div
              key={node.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.4, ease }}
              className="flex items-center gap-2.5 rounded-xl border px-3 py-2.5"
              style={{
                borderColor: node.ok ? "#16a34a33" : "#dc262633",
                background: node.ok ? "#16a34a08" : "#dc262608",
              }}
            >
              <motion.span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: node.ok ? "#16a34a" : "#dc2626" }}
                animate={node.ok ? { opacity: [1, 0.4, 1] } : { opacity: [1, 0.2, 1] }}
                transition={{ duration: node.ok ? 2 : 0.6, repeat: Infinity }}
              />
              <span className="text-[11px] font-medium leading-tight truncate">{node.label}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
