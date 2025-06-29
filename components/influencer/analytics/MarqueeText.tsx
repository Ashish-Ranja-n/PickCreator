import React, { useRef, useEffect, useState } from 'react';

interface MarqueeTextProps {
  text: string;
  speed?: number; // px per second
}

export const MarqueeText: React.FC<MarqueeTextProps> = ({ text, speed = 60 }) => {
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
      className="w-full overflow-hidden whitespace-nowrap h-7 flex items-center relative"
      style={{ minHeight: 28 }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        ref={textRef}
        className="inline-block text-base text-yellow-800 dark:text-yellow-100 font-medium px-1"
        style={shouldAnimate ? {
          animation: `marquee ${duration}s linear infinite`,
          animationPlayState: paused ? 'paused' : 'running',
        } : {}}
      >
        {text}
      </div>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );
};
