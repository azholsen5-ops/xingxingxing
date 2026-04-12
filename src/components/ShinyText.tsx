import React from 'react';
import './ShinyText.css';

interface ShinyTextProps {
  text: string;
  speed?: number;
  delay?: number;
  color?: string;
  shineColor?: string;
  spread?: number;
  direction?: 'left' | 'right';
  yoyo?: boolean;
  pauseOnHover?: boolean;
  disabled?: boolean;
  className?: string;
}

const ShinyText: React.FC<ShinyTextProps> = ({
  text,
  speed = 2,
  delay = 0,
  color = '#b5b5b5',
  shineColor = '#ffffff',
  spread = 120,
  direction = 'left',
  yoyo = false,
  pauseOnHover = false,
  disabled = false,
  className = '',
}) => {
  const animationDirection = direction === 'left' ? 'reverse' : 'normal';

  const inlineStyles: React.CSSProperties = {
    '--shiny-speed': `${speed}s`,
    '--shiny-delay': `${delay}s`,
    '--shiny-color': color,
    '--shiny-shine-color': shineColor,
    '--shiny-spread': `${spread}px`,
    '--shiny-direction': animationDirection,
    '--shiny-yoyo': yoyo ? 'alternate' : 'none',
  } as React.CSSProperties;

  return (
    <div
      className={`shiny-text ${disabled ? 'disabled' : ''} ${pauseOnHover ? 'pause-on-hover' : ''} ${className}`}
      style={inlineStyles}
    >
      {text}
    </div>
  );
};

export default ShinyText;
