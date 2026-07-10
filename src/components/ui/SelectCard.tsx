import React, { forwardRef } from 'react';
import { cn } from '@/src/lib/utils';

export interface SelectCardProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  title: string;
  description?: string;
  selected?: boolean;
}

export const SelectCard = forwardRef<HTMLButtonElement, SelectCardProps>(
  ({ className, title, description, selected = false, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          "w-full flex w-full flex-col items-start text-left p-5 rounded-[20px] border-2 transition-all duration-300",
          selected 
            ? "border-[#055A43] bg-[#055A43]/5 ring-4 ring-[#055A43]/5 shadow-sm" 
            : "border-gray-100 bg-white hover:border-[#055A43]/30 shadow-sm hover:shadow-md",
          className
        )}
        {...props}
      >
        <div className="flex items-center justify-between w-full">
          <span className={cn(
            "font-semibold text-[15px]",
            selected ? "text-[#055A43]" : "text-[#6B7A6E]"
          )}>
            {title}
          </span>
          <div className={cn(
            "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
            selected ? "border-[#055A43]" : "border-gray-200"
          )}>
            {selected && <div className="w-2.5 h-2.5 rounded-full bg-[#055A43]" />}
          </div>
        </div>
        {description && (
          <span className={cn(
            "text-[13px] mt-2 leading-relaxed pr-6",
            selected ? "text-[#055A43]/80" : "text-[#6B7A6E]/70"
          )}>
            {description}
          </span>
        )}
      </button>
    );
  }
);
SelectCard.displayName = 'SelectCard';
