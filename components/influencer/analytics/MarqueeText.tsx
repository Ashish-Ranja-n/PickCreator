import React, { useRef, useEffect, useState } from 'react';

interface MarqueeTextProps {
  text: string;
  speed?: number; // px per second
}

export const MarqueeText: React.FC<MarqueeTextProps> = ({ text, speed = 40 }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [duration, setDuration] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!containerRef.current || !textRef.current) return;
    const containerWidth = containerRef.current.offsetWidth;
    const textWidth = textRef.current.scrollWidth;
    if (textWidth > containerWidth) {
      setShouldAnimate(true);
      // Duration: textWidth / speed for a smooth, continuous scroll
      setDuration(textWidth / speed);
    } else {
      setShouldAnimate(false);
    }
  }, [text, speed]);

  // Pause on hover
  const handleMouseEnter = () => setPaused(true);
  const handleMouseLeave = () => setPaused(false);

  return (
    <div
      ref={containerRef}
      className="w-full overflow-hidden h-7 flex items-center relative rounded-md border border-slate-200 dark:border-yellow-800 bg-white dark:bg-neutral-900"
      style={{ minHeight: 28, position: 'relative', overflow: 'hidden' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        ref={textRef}
        className="inline-block text-[0.98rem] sm:text-base font-medium px-1 tracking-wide text-slate-700 dark:text-yellow-100"
        style={shouldAnimate ? {
          animation: `marquee ${duration}s linear infinite`,
          animationPlayState: paused ? 'paused' : 'running',
          willChange: 'transform',
          whiteSpace: 'nowrap',
        } : {
          whiteSpace: 'nowrap',
        }}
      >
        {text}
        {shouldAnimate && (
          <span className="inline-block px-8" aria-hidden="true">{text}</span>
        )}
      </div>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );
};
