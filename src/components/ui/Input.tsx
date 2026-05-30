import React, { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/src/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = props.type === 'password';
    const inputType = isPassword && showPassword ? 'text' : props.type;

    return (
      <div className="w-full flex flex-col gap-2">
        {label && (
          <label className="text-[13px] font-semibold text-[#055A43] ml-1 tracking-wide uppercase">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            className={cn(
              "flex h-14 w-full rounded-2xl border-2 border-gray-200 bg-white px-4 py-2 text-[15px] font-medium text-[#055A43] transition-all duration-200",
              "focus-visible:outline-none focus-visible:border-[#055A43] focus-visible:ring-4 focus-visible:ring-[#055A43]/10 shadow-sm",
              "placeholder:text-[#5C615D]/40 placeholder:font-normal disabled:cursor-not-allowed disabled:opacity-50",
              isPassword && "pr-12",
              error && "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/10",
              className
            )}
            {...props}
            type={inputType}
          />
          {isPassword && (
            <button
              type="button"
              aria-label={showPassword ? 'Ocultar senha' : 'Visualizar senha'}
              onClick={() => setShowPassword((current) => !current)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#5C615D]/70 transition-colors hover:text-[#055A43] focus-visible:outline-none focus-visible:text-[#055A43]"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          )}
        </div>
        {error && (
          <span className="text-xs font-medium text-red-500 ml-1">{error}</span>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';
