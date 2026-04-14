'use client';

import { useRef } from 'react';
import { useInView, useScroll, useTransform, type MotionValue } from 'framer-motion';

interface UseScrollAnimationOptions {
  once?: boolean;
  amount?: 'some' | 'all' | number;
  margin?: string;
}

/**
 * Hook for scroll-based animations
 */
export function useScrollAnimation(options: UseScrollAnimationOptions = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, {
    once: options.once ?? true,
    amount: options.amount ?? 0.3,
    margin: options.margin,
  });

  return { ref, isInView };
}

/**
 * Hook for parallax scroll effects
 */
export function useParallax(
  offset: [string, string] = ['start end', 'end start']
): {
  ref: React.RefObject<HTMLDivElement | null>;
  y: MotionValue<string>;
  opacity: MotionValue<number>;
} {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset,
  });

  const y = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.6, 1, 0.6]);

  return { ref, y, opacity };
}

/**
 * Hook for scroll progress within a section
 */
export function useSectionProgress() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  return { ref, progress: scrollYProgress };
}
