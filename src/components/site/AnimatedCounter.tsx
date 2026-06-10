import { useEffect, useRef, useState } from "react";
import { useInView, useMotionValue, useSpring } from "framer-motion";

export function AnimatedCounter({ value, suffix = "", prefix = "" }: { value: number; suffix?: string; prefix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 60, damping: 20 });
  const [display, setDisplay] = useState(0);

  useEffect(() => { if (inView) mv.set(value); }, [inView, value, mv]);
  useEffect(() => spring.on("change", (v) => setDisplay(Math.round(v))), [spring]);

  return <span ref={ref}>{prefix}{display.toLocaleString()}{suffix}</span>;
}
