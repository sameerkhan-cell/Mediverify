import { useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export function NavigationProgress() {
  const isPending = useRouterState({ select: (s) => s.status === "pending" });
  const [visible, setVisible] = useState(false);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!isPending) {
      setWidth(100);
      const hide = window.setTimeout(() => {
        setVisible(false);
        setWidth(0);
      }, 200);
      return () => window.clearTimeout(hide);
    }

    setVisible(true);
    setWidth(12);

    const tick1 = window.setTimeout(() => setWidth(45), 80);
    const tick2 = window.setTimeout(() => setWidth(72), 240);
    const tick3 = window.setTimeout(() => setWidth(88), 480);

    return () => {
      window.clearTimeout(tick1);
      window.clearTimeout(tick2);
      window.clearTimeout(tick3);
    };
  }, [isPending]);

  if (!visible) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[200] h-[2px] bg-transparent"
      aria-hidden
    >
      <div
        className="h-full bg-gradient-primary shadow-[0_0_8px_oklch(0.50_0.20_265_/_0.6)] transition-[width] duration-200 ease-out"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}
