import React, { forwardRef, useMemo, useRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/src/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, onBlur, onChange, onFocus, value, defaultValue, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const isPassword = props.type === 'password';
    const isEmail = props.type === 'email';
    const inputType = isPassword && showPassword ? 'text' : props.type;
    const emailValue = String(value ?? defaultValue ?? '');

    const emailSuggestions = useMemo(() => {
      if (!isEmail || !isFocused) return [];

      const atIndex = emailValue.indexOf('@');
      if (atIndex < 1) return [];

      const localPart = emailValue.slice(0, atIndex).trim();
      const typedDomain = emailValue.slice(atIndex + 1).trim().toLowerCase();
      if (!localPart || typedDomain.includes(' ')) return [];

      const domains = [
        'gmail.com',
        'hotmail.com',
        'outlook.com',
        'yahoo.com',
        'icloud.com',
        'live.com',
        'uol.com.br',
        'bol.com.br',
        'terra.com.br',
      ];

      return domains
        .filter((domain) => domain.startsWith(typedDomain) && domain !== typedDomain)
        .slice(0, 5)
        .map((domain) => `${localPart}@${domain}`);
    }, [emailValue, isEmail, isFocused]);

    const setRefs = (node: HTMLInputElement | null) => {
      inputRef.current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    };

    const applyEmailSuggestion = (suggestion: string) => {
      if (inputRef.current) {
        inputRef.current.value = suggestion;
      }

      onChange?.({
        target: { value: suggestion },
        currentTarget: { value: suggestion },
      } as React.ChangeEvent<HTMLInputElement>);

      setIsFocused(false);
      requestAnimationFrame(() => inputRef.current?.focus());
    };

    return (
      <div className="w-full flex flex-col gap-2">
        {label && (
          <label className="text-[13px] font-semibold text-[#055A43] ml-1 tracking-wide uppercase">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={setRefs}
            className={cn(
              "flex h-14 w-full rounded-2xl border-2 border-gray-200 bg-white px-4 py-2 text-[15px] font-medium text-[#055A43] transition-all duration-200",
              "focus-visible:outline-none focus-visible:border-[#055A43] focus-visible:ring-4 focus-visible:ring-[#055A43]/10 shadow-sm",
              "placeholder:text-[#5C615D]/40 placeholder:font-normal disabled:cursor-not-allowed disabled:opacity-50",
              isPassword && "pr-12",
              error && "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/10",
              className
            )}
            {...props}
            value={value}
            defaultValue={defaultValue}
            onChange={onChange}
            onFocus={(event) => {
              setIsFocused(true);
              onFocus?.(event);
            }}
            onBlur={(event) => {
              window.setTimeout(() => setIsFocused(false), 120);
              onBlur?.(event);
            }}
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
          {emailSuggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-[calc(100%+0.35rem)] z-30 overflow-hidden rounded-2xl border border-[#055A43]/10 bg-white shadow-xl shadow-[#055A43]/10">
              {emailSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    applyEmailSuggestion(suggestion);
                  }}
                  className="flex w-full items-center px-4 py-3 text-left text-[14px] font-medium text-[#055A43] transition-colors hover:bg-[#055A43]/5"
                >
                  {suggestion}
                </button>
              ))}
            </div>
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
