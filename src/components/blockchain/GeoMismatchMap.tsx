import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, AlertTriangle, Clock, Shield, Wifi, Zap,
} from "lucide-react";
import { ease } from "@/lib/motion";


interface ScanPoint {
  id: string;
  city: string;
  country: string;
  x: number; // percentage on SVG viewport
  y: number;
  type: "origin" | "suspicious" | "pharmacy" | "verified";
  timestamp: string;
  detail: string;
  scans: number;
}

interface RouteLink {
  from: string;
  to: string;
  suspicious: boolean;
}

const POINTS: ScanPoint[] = [
  { id: "pk1", city: "Karachi",  country: "Pakistan", x: 62,  y: 48,  type: "origin",     timestamp: "16 Jan · 09:05", detail: "Original sale at Servaid Pharmacy #218",        scans: 1  },
  { id: "pk2", city: "Lahore",   country: "Pakistan", x: 64,  y: 44,  type: "pharmacy",   timestamp: "14 Jan · 11:20", detail: "Warehouse verified — batch dispatched",          scans: 2  },
  { id: "pk3", city: "Islamabad",country: "Pakistan", x: 65,  y: 42,  type: "verified",   timestamp: "15 Jan · 09:00", detail: "Regulatory checkpoint — all clear",               scans: 1  },
  { id: "ae1", city: "Dubai",    country: "UAE",      x: 58,  y: 45,  type: "suspicious", timestamp: "17 Jan · 23:11", detail: "⚠ Duplicate scan — geo-temporal impossibility",  scans: 7  },
  { id: "gb1", city: "London",   country: "UK",       x: 42,  y: 28,  type: "suspicious", timestamp: "15 Jan · 18:30", detail: "⚠ Duplicate scan — impossible travel time",      scans: 3  },
  { id: "in1", city: "Mumbai",   country: "India",    x: 66,  y: 50,  type: "suspicious", timestamp: "18 Jan · 02:45", detail: "⚠ Unknown device — 5 rapid sequential scans",    scans: 5  },
];

const ROUTES: RouteLink[] = [
  { from: "pk2", to: "pk1", suspicious: false },
  { from: "pk3", to: "pk2", suspicious: false },
  { from: "pk1", to: "ae1", suspicious: true  },
  { from: "pk1", to: "gb1", suspicious: true  },
  { from: "pk1", to: "in1", suspicious: true  },
];

const TYPE_CFG: Record<ScanPoint["type"], { color: string; bg: string; border: string; glow: string; label: string; size: number }> = {
  origin:     { color: "#16a34a", bg: "#16a34a22", border: "#16a34a", glow: "#16a34a44", label: "Origin Scan",    size: 16 },
  pharmacy:   { color: "#1a56db", bg: "#1a56db22", border: "#1a56db", glow: "#1a56db44", label: "Pharmacy",       size: 12 },
  verified:   { color: "#06b6d4", bg: "#06b6d422", border: "#06b6d4", glow: "#06b6d444", label: "Verified",       size: 10 },
  suspicious: { color: "#dc2626", bg: "#dc262622", border: "#dc2626", glow: "#dc262644", label: "Suspicious",     size: 14 },
};

function WorldMapSVG() {
  // Simplified world map paths (continents as rough polygons — lightweight, no external lib)
  return (
    <svg
      viewBox="0 0 100 60"
      className="absolute inset-0 h-full w-full"
      preserveAspectRatio="xMidYMid meet"
      style={{ opacity: 0.18 }}
    >
      <defs>
        <filter id="glow-map">
          <feGaussianBlur stdDeviation="0.3" result="coloredBlur" />
          <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {/* North America */}
      <path fill="#1a56db" d="M5,10 L18,8 L22,15 L20,25 L15,28 L8,22 L5,15 Z" />
      {/* South America */}
      <path fill="#1a56db" d="M14,30 L20,28 L22,35 L19,45 L14,46 L11,40 L12,33 Z" />
      {/* Europe */}
      <path fill="#1a56db" d="M40,10 L50,9 L52,16 L48,20 L42,18 L39,14 Z" />
      {/* Africa */}
      <path fill="#1a56db" d="M43,22 L52,20 L55,30 L53,42 L46,44 L41,35 L41,25 Z" />
      {/* Asia (simplified) */}
      <path fill="#1a56db" d="M52,8 L78,6 L82,16 L76,26 L65,28 L55,24 L52,15 Z" />
      {/* Middle East */}
      <path fill="#1a56db" d="M54,24 L62,22 L65,30 L58,32 L53,28 Z" />
      {/* South Asia + SE Asia */}
      <path fill="#1a56db" d="M62,28 L74,26 L80,34 L72,36 L63,33 Z" />
      {/* Australia */}
      <path fill="#1a56db" d="M72,38 L84,36 L86,46 L78,48 L70,44 Z" />
      {/* UK island */}
      <path fill="#1a56db" d="M40,11 L43,10 L43,15 L40,15 Z" />
      {/* Japan */}
      <path fill="#1a56db" d="M80,18 L83,17 L84,22 L81,22 Z" />
      {/* Greenland */}
      <path fill="#1a56db" d="M20,4 L28,3 L29,10 L22,11 Z" />
    </svg>
  );
}

export function GeoMismatchMap() {
  const [selectedPoint, setSelectedPoint] = useState<ScanPoint | null>(POINTS[0]);
  const [pulsePhase, setPulsePhase] = useState(0);
  const [routeProgress, setRouteProgress] = useState(0);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const id = setInterval(() => {
      setPulsePhase((p) => (p + 1) % 360);
      setRouteProgress((r) => (r + 0.4) % 100);
    }, 30);
    return () => clearInterval(id);
  }, []);

  const getPoint = (id: string) => POINTS.find((p) => p.id === id)!;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#dc2626]/10 border border-[#dc2626]/20 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-[#dc2626] mb-2">
          <MapPin className="h-3 w-3" /> Geo-Location Tracking
        </span>
        <h2 className="text-2xl font-bold tracking-tight">Global Medicine Route Map</h2>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Real-time supply chain tracking with geo-mismatch fraud detection
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Map */}
        <div className="lg:col-span-2 rounded-2xl border border-border/40 bg-card/60 overflow-hidden" style={{ minHeight: 340 }}>
          <div className="relative h-full min-h-[340px]">
            {/* Dark space background */}
            <div
              className="absolute inset-0"
              style={{
                background: "radial-gradient(ellipse at 60% 50%, #0d1117, #050810)",
              }}
            />
            {/* Grid lines */}
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(26,86,219,0.08) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(26,86,219,0.08) 1px, transparent 1px)
                `,
                backgroundSize: "10% 10%",
              }}
            />
            {/* Latitude/longitude arcs */}
            <svg className="absolute inset-0 h-full w-full opacity-10" viewBox="0 0 100 60" preserveAspectRatio="xMidYMid meet">
              <ellipse cx="50" cy="30" rx="49" ry="29" fill="none" stroke="#1a56db" strokeWidth="0.2" />
              <ellipse cx="50" cy="30" rx="35" ry="29" fill="none" stroke="#1a56db" strokeWidth="0.1" />
              <ellipse cx="50" cy="30" rx="20" ry="29" fill="none" stroke="#1a56db" strokeWidth="0.1" />
              <line x1="50" y1="1" x2="50" y2="59" stroke="#1a56db" strokeWidth="0.1" />
              <line x1="1" y1="30" x2="99" y2="30" stroke="#1a56db" strokeWidth="0.1" />
            </svg>

            {/* Continent outlines */}
            <WorldMapSVG />

            {/* SVG for routes and nodes */}
            <svg
              ref={svgRef}
              className="absolute inset-0 h-full w-full"
              viewBox="0 0 100 60"
              preserveAspectRatio="xMidYMid meet"
            >
              {/* Route lines */}
              {ROUTES.map((route) => {
                const from = getPoint(route.from);
                const to = getPoint(route.to);
                const dashOffset = route.suspicious ? 100 - routeProgress : undefined;
                return (
                  <g key={`${route.from}-${route.to}`}>
                    {/* Base line */}
                    <line
                      x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                      stroke={route.suspicious ? "#dc2626" : "#1a56db"}
                      strokeWidth={route.suspicious ? 0.3 : 0.2}
                      strokeOpacity={0.4}
                      strokeDasharray={route.suspicious ? "1 1" : undefined}
                    />
                    {/* Animated packet */}
                    {route.suspicious && (
                      <line
                        x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                        stroke="#dc2626"
                        strokeWidth={0.6}
                        strokeOpacity={0.9}
                        strokeDasharray="2 98"
                        strokeDashoffset={dashOffset}
                        style={{ transition: "stroke-dashoffset 0.03s linear" }}
                      />
                    )}
                    {!route.suspicious && (
                      <line
                        x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                        stroke="#16a34a"
                        strokeWidth={0.5}
                        strokeOpacity={0.7}
                        strokeDasharray="2 98"
                        strokeDashoffset={dashOffset !== undefined ? undefined : 100 - routeProgress}
                        style={{ transition: "stroke-dashoffset 0.03s linear" }}
                      />
                    )}
                  </g>
                );
              })}

              {/* Scan nodes */}
              {POINTS.map((pt) => {
                const cfg = TYPE_CFG[pt.type];
                const isSelected = selectedPoint?.id === pt.id;
                const r = cfg.size / 4;
                const pulse = Math.sin((pulsePhase * Math.PI) / 180) * 0.5 + 0.5;

                return (
                  <g
                    key={pt.id}
                    style={{ cursor: "pointer" }}
                    onClick={() => setSelectedPoint(pt)}
                  >
                    {/* Pulse ring */}
                    <circle
                      cx={pt.x} cy={pt.y}
                      r={r + 1.5 + pulse * 1.5}
                      fill="none"
                      stroke={cfg.color}
                      strokeWidth={0.3}
                      opacity={0.4 - pulse * 0.3}
                    />
                    {/* Outer ring */}
                    <circle
                      cx={pt.x} cy={pt.y} r={r + 0.8}
                      fill="none" stroke={cfg.color} strokeWidth={0.4}
                      opacity={isSelected ? 1 : 0.6}
                    />
                    {/* Fill */}
                    <circle
                      cx={pt.x} cy={pt.y} r={r}
                      fill={cfg.color}
                      opacity={isSelected ? 1 : 0.8}
                      style={{ filter: `drop-shadow(0 0 ${r}px ${cfg.color})` }}
                    />
                    {/* City label */}
                    <text
                      x={pt.x} y={pt.y - r - 1}
                      textAnchor="middle"
                      fontSize="2"
                      fill={cfg.color}
                      fontWeight="bold"
                      opacity={isSelected ? 1 : 0.7}
                    >
                      {pt.city}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Legend */}
            <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
              {Object.entries(TYPE_CFG).map(([type, cfg]) => (
                <div
                  key={type}
                  className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide backdrop-blur-sm"
                  style={{ borderColor: `${cfg.color}44`, background: `${cfg.color}11`, color: cfg.color }}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: cfg.color }} />
                  {cfg.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Side panel */}
        <div className="space-y-3">
          {/* Selected point detail */}
          <AnimatePresence mode="wait">
            {selectedPoint && (
              <motion.div
                key={selectedPoint.id}
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.3, ease }}
                className="rounded-2xl border p-5"
                style={{
                  borderColor: TYPE_CFG[selectedPoint.type].border + "55",
                  background: TYPE_CFG[selectedPoint.type].bg,
                  boxShadow: `0 0 30px 0 ${TYPE_CFG[selectedPoint.type].glow}`,
                }}
              >
                <div className="mb-3 flex items-center gap-2.5">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{
                      background: TYPE_CFG[selectedPoint.type].color,
                      boxShadow: `0 0 8px ${TYPE_CFG[selectedPoint.type].color}`,
                    }}
                  />
                  <span
                    className="text-[11px] font-black uppercase tracking-widest"
                    style={{ color: TYPE_CFG[selectedPoint.type].color }}
                  >
                    {TYPE_CFG[selectedPoint.type].label}
                  </span>
                </div>
                <h3 className="text-[16px] font-bold">{selectedPoint.city}</h3>
                <p className="text-[12px] text-muted-foreground mb-4">{selectedPoint.country}</p>
                <div className="space-y-2.5">
                  {[
                    { icon: Clock, label: "Timestamp",  value: selectedPoint.timestamp },
                    { icon: Wifi,  label: "Scan count", value: `${selectedPoint.scans}×` },
                    { icon: Shield, label: "Status",    value: TYPE_CFG[selectedPoint.type].label },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-center gap-2 text-[12px]">
                      <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="text-muted-foreground">{label}:</span>
                      <span className="font-semibold">{value}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-[11px] text-muted-foreground leading-relaxed">{selectedPoint.detail}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Point list */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">All Scan Locations</p>
            {POINTS.map((pt) => {
              const cfg = TYPE_CFG[pt.type];
              const isSelected = selectedPoint?.id === pt.id;
              return (
                <motion.button
                  key={pt.id}
                  onClick={() => setSelectedPoint(pt)}
                  className="flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-all duration-200"
                  style={{
                    borderColor: isSelected ? cfg.border : "rgba(255,255,255,0.06)",
                    background: isSelected ? cfg.bg : "rgba(255,255,255,0.02)",
                  }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <span className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ background: cfg.color, boxShadow: isSelected ? `0 0 6px ${cfg.color}` : "none" }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold">{pt.city}, {pt.country}</p>
                    <p className="text-[10px] text-muted-foreground">{pt.timestamp}</p>
                  </div>
                  <div className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
                    style={{ background: cfg.bg, color: cfg.color }}>
                    <Zap className="h-2.5 w-2.5" /> {pt.scans}×
                  </div>
                  {pt.type === "suspicious" && (
                    <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 0.7, repeat: Infinity }}>
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" style={{ color: "#dc2626" }} />
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
