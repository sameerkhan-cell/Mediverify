import { useEffect, useState } from "react";

/**
 * Animates a number from 0 to `target` over `duration` ms.
 * Replaces the inline useCountUp pattern in LiveBlockchainDashboard.
 *
 * Usage:
 *   const displayed = useCountUp(48321);
 */
export function useCountUp(target: number, duration = 1400): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (target === 0) return;
    let start = 0;
    const step = target / (duration / 16);
    const id = setInterval(() => {
      start += step;
      if (start >= target) {
        setValue(target);
        clearInterval(id);
      } else {
        setValue(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(id);
  }, [target, duration]);

  return value;
}
