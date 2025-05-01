
import React from 'react';
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'link' | 'brand' | 'brand-outline';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
  hoverEffect?: boolean;
  fullWidth?: boolean;
  rounded?: boolean;
  glow?: boolean;
  className?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'default', 
    size = 'md', 
    hoverEffect = false,
    fullWidth = false,
    rounded = true,
    glow = false,
    children, 
    ...props 
  }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center font-medium transition-all duration-300 ease-in-out",
          rounded ? "rounded-full" : "rounded-lg",
          fullWidth && "w-full",
          hoverEffect && "transform hover:-translate-y-1",
          glow && "hover:shadow-lg hover:shadow-primary/40",
          
          // Variants
          variant === 'default' && "bg-primary text-primary-foreground hover:bg-primary/90",
          variant === 'outline' && "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
          variant === 'ghost' && "hover:bg-accent hover:text-accent-foreground",
          variant === 'link' && "text-primary underline-offset-4 hover:underline",
          variant === 'brand' && "bg-pick-blue text-white hover:bg-pick-blue/90",
          variant === 'brand-outline' && "border-2 border-pick-blue text-pick-blue bg-transparent hover:bg-pick-blue/10",
          
          // Sizes
          size === 'sm' && "h-9 px-4 text-sm",
          size === 'md' && "h-11 px-6 text-base",
          size === 'lg' && "h-14 px-8 text-lg",
          size === 'xl' && "h-16 px-10 text-xl",
          
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
