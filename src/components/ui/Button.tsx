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
    
    // rounded-full (pill) nos CTAs. Pressionado: scale(0.97) + fundo ~6% mais escuro, 150ms ease-out.
    const baseStyles = "inline-flex items-center justify-center rounded-full font-medium transition-all duration-150 ease-out focus:outline-none active:scale-[0.97] disabled:pointer-events-none disabled:bg-[#DCE5DC] disabled:text-[#7E8E80] disabled:shadow-none";

    const variants = {
      primary: "bg-[#055A43] text-[#F7F3E8] hover:bg-[#044735] active:bg-[#044735] shadow-[0_8px_20px_rgb(5,90,67,0.22)] hover:shadow-[0_8px_25px_rgb(5,90,67,0.32)]",
      secondary: "bg-[#506352] text-[#F7F3E8] hover:bg-[#3D4C3F] active:bg-[#3D4C3F]",
      outline: "border border-[#C9D2C9] text-[#055A43] bg-transparent hover:bg-[#055A43]/5 active:bg-[#055A43]/10 rounded-full",
      ghost: "text-[#6B7A6E] hover:text-[#055A43] hover:bg-[#055A43]/5"
    };

    const sizes = {
      sm: "h-10 px-6 text-sm",
      md: "h-[54px] px-8 text-[16px]",
      lg: "h-[54px] px-10 text-[16px]"
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
