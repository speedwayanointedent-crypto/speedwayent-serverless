"use client";

import { useEffect, useState } from "react";
import { useScrollReveal } from "@/lib/useScrollReveal";

type AnimatedCounterProps = {
  value: string;
  duration?: number;
  className?: string;
};

function parseValue(val: string) {
  const match = val.match(/^([^0-9]*)([\d,]+\.?\d*)(.*)$/);
  if (!match) return { prefix: "", numeric: 0, suffix: val };
  return { prefix: match[1], numeric: parseFloat(match[2].replace(/,/g, "")), suffix: match[3] };
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({ value, duration = 1800, className = "" }) => {
  const { ref, isVisible } = useScrollReveal<HTMLSpanElement>({ threshold: 0.3 });
  const [display, setDisplay] = useState(value);
  const hasComma = value.includes(",");

  useEffect(() => {
    if (!isVisible) return;
    const { prefix, numeric, suffix } = parseValue(value);
    if (numeric === 0) {
      setDisplay(value);
      return;
    }

    const startTime = performance.now();
    let rafId: number;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * numeric);
      const formatted = hasComma ? current.toLocaleString() : current.toString();
      setDisplay(`${prefix}${formatted}${suffix}`);
      if (progress < 1) rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [isVisible, value, duration, hasComma]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
};
