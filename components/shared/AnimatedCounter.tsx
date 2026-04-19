'use client';

import { useEffect, useRef, useState } from 'react';
import { useInView, useMotionValue, useSpring } from 'framer-motion';

interface AnimatedCounterProps {
  value: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  duration?: number;
  minWidth?: string;
}

function format(n: number, decimals: number) {
  return decimals > 0 ? n.toFixed(decimals) : Math.floor(n).toLocaleString();
}

export function AnimatedCounter({
  value,
  suffix = '',
  prefix = '',
  decimals = 0,
  minWidth,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const startedRef = useRef(false);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const motionValue = useMotionValue(value);
  const springValue = useSpring(motionValue, { damping: 50, stiffness: 100 });
  const [displayValue, setDisplayValue] = useState(() => format(value, decimals));

  useEffect(() => {
    if (isInView && !startedRef.current) {
      startedRef.current = true;
      motionValue.set(0);
      requestAnimationFrame(() => motionValue.set(value));
    }
  }, [isInView, motionValue, value]);

  useEffect(() => {
    return springValue.on('change', (latest) => {
      setDisplayValue(format(latest, decimals));
    });
  }, [springValue, decimals]);

  return (
    <span
      ref={ref}
      className="inline-block text-center tabular-nums"
      style={minWidth ? { minWidth } : undefined}
    >
      {prefix}
      {displayValue}
      {suffix}
    </span>
  );
}
