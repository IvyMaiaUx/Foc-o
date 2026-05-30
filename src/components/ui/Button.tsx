import React from 'react';
import { cn } from '@/src/lib/utils';
import { hapticLightTap } from '@/src/lib/haptic';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, onClick, ...props }, ref) => {
    
    // Using rounded-full for the main CTA buttons to match Welcome screen and premium feel
    const baseStyles = "inline-flex items-center justify-center rounded-full font-semibold transition-all focus:outline-none disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]";
    
    const variants = {
      primary: "bg-[#055A43] text-white hover:bg-[#044735] shadow-[0_8px_20px_rgb(5,90,67,0.2)] hover:shadow-[0_8px_25px_rgb(5,90,67,0.3)]",
      secondary: "bg-[#506352] text-white hover:bg-[#3D4C3F]",
      outline: "border-2 border-[#055A43] text-[#055A43] hover:bg-[#055A43]/5",
      ghost: "text-[#5C615D] hover:text-[#055A43] hover:bg-[#055A43]/5"
    };

    const sizes = {
      sm: "h-10 px-6 text-sm",
      md: "h-14 px-8 text-[15px]",
      lg: "h-16 px-10 text-lg"
    };

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      hapticLightTap();
      if (onClick) {
        onClick(e);
      }
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={isLoading || props.disabled}
        onClick={handleClick}
        {...props}
      >
        {isLoading ? (
          <span className="animate-spin mr-2 h-4 w-4 rounded-full border-2 border-current border-t-transparent" />
        ) : null}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
