import React from 'react';
import { cn } from "@/lib/utils";

interface AnimatedTextProps {
  text: string;
  className?: string;
  delay?: number;
  staggerChildren?: number;
  as?: React.ElementType;
  animation?: 'fade' | 'slide' | 'bounce' | 'scale';
}

const AnimatedText: React.FC<AnimatedTextProps> = ({
  text,
  className,
  delay = 0,
  staggerChildren = 0.06,
  as: Component = 'p',
  animation = 'fade'
}) => {
  const characters = text.split('');
  const baseDelay = delay * 1000;
  
  const getAnimationClass = () => {    
    switch (animation) {
      case 'fade':
        return 'opacity-0 animate-fade-in';
      case 'slide':
        return 'opacity-0 translate-y-4 animate-slide-up';
      case 'bounce':
        return 'opacity-0 animate-bounce-in';
      case 'scale':
        return 'opacity-0 scale-95 animate-scale-in';
      default:
        return 'opacity-0 animate-fade-in';
    }
  };

  return (
    <Component className={cn("inline-block", className)}>
      {characters.map((char, index) => (
        <span
          key={`${char}-${index}`}
          className={cn(
            "inline-block",
            getAnimationClass()
          )}
          style={{ animationDelay: `${baseDelay + (index * staggerChildren * 1000)}ms` }}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </Component>
  );
};

export default AnimatedText;
