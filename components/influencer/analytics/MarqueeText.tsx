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
      // Duration: (textWidth + containerWidth) / speed for full scroll
      setDuration((textWidth + containerWidth) / speed);
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
      className="w-full overflow-hidden h-10 flex items-center relative rounded-xl shadow-lg border border-yellow-300 dark:border-yellow-700"
      style={{
        minHeight: 40,
        background: 'linear-gradient(90deg, #fffbe6 0%, #ffe7ba 50%, #fffbe6 100%)',
        boxShadow: '0 2px 16px 0 rgba(255, 215, 0, 0.10), 0 1.5px 0 #ffe066',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Shine effect overlay */}
      <span
        className="absolute left-0 top-0 h-full w-1/3 pointer-events-none animate-shine"
        style={{
          background: 'linear-gradient(120deg, rgba(255,255,255,0.0) 0%, rgba(255,255,255,0.7) 50%, rgba(255,255,255,0.0) 100%)',
          filter: 'blur(2px)',
        }}
      />
      <div
        ref={textRef}
        className="inline-block text-[1.08rem] sm:text-base font-semibold px-1 tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-yellow-500 via-orange-400 to-pink-400 drop-shadow-md"
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
      {/* Glow border for mobile */}
      <span className="absolute inset-0 pointer-events-none rounded-xl border-2 border-yellow-300 dark:border-yellow-700 shadow-[0_0_16px_2px_rgba(255,215,0,0.15)]" />
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        @media (max-width: 640px) {
          .sm\\:text-base { font-size: 1rem; }
        }
        .animate-shine {
          animation: shine-move 2.5s linear infinite;
        }
        @keyframes shine-move {
          0% { left: -40%; }
          100% { left: 110%; }
        }
      `}</style>
    </div>
  );
};
