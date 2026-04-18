'use client';

import { useRef, type ReactNode } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

interface HeroParallaxProps {
  background: ReactNode;
  children: ReactNode;
}

export function HeroParallax({ background, children }: HeroParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section
      ref={ref}
      style={{ position: 'relative' }}
      className="min-h-screen overflow-hidden bg-[#042C53]"
    >
      <div className="absolute inset-0 overflow-hidden">
        <motion.div style={{ y }} className="absolute inset-0">
          {background}
        </motion.div>
      </div>
      <motion.div style={{ opacity }} className="relative z-10 flex min-h-screen items-center">
        {children}
      </motion.div>
    </section>
  );
}

export function HeroScrollIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1 }}
      className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2"
    >
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="flex h-10 w-6 items-start justify-center rounded-full border-2 border-white/30 p-1"
      >
        <div className="h-2 w-1 rounded-full bg-white/60" />
      </motion.div>
    </motion.div>
  );
}
