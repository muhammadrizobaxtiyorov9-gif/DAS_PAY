'use client';

import { motion } from 'framer-motion';
import { forwardRef, type CSSProperties, type ReactNode } from 'react';

type RevealDirection = 'up' | 'down' | 'left' | 'right' | 'none';

const offsets: Record<RevealDirection, { x: number; y: number }> = {
  up: { x: 0, y: 20 },
  down: { x: 0, y: -20 },
  left: { x: 20, y: 0 },
  right: { x: -20, y: 0 },
  none: { x: 0, y: 0 },
};

interface RevealProps {
  children: ReactNode;
  direction?: RevealDirection;
  delay?: number;
  duration?: number;
  className?: string;
  style?: CSSProperties;
  id?: string;
}

export const Reveal = forwardRef<HTMLDivElement, RevealProps>(function Reveal(
  { children, direction = 'up', delay = 0, duration = 0.5, className, style, id },
  ref
) {
  const offset = offsets[direction];

  return (
    <motion.div
      ref={ref}
      id={id}
      initial={{ opacity: 0, ...offset }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration, delay, ease: 'easeOut' }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
});
