import type { CSSProperties, ReactNode } from 'react';

type RevealDirection = 'up' | 'down' | 'left' | 'right' | 'none';

const animationName: Record<RevealDirection, string> = {
  up: 'reveal-up',
  down: 'reveal-down',
  left: 'reveal-left',
  right: 'reveal-right',
  none: 'reveal-fade',
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

export function Reveal({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.5,
  className,
  style,
  id,
}: RevealProps) {
  return (
    <div
      id={id}
      className={className}
      style={{
        ...style,
        animation: `${animationName[direction]} ${duration}s ease-out ${delay}s both`,
      }}
    >
      {children}
    </div>
  );
}
