import { forwardRef, useState, useId } from 'react';
import type { InputHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '../lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, type = 'text', className, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const id = useId();

    return (
      <div className="relative mb-6 text-left w-full group">
        <div className="relative w-full">
          <input
            id={id}
            ref={ref}
            type={isPassword && showPassword ? 'text' : type}
            className={cn(
              "peer w-full h-14 px-4 bg-transparent border-b-2 border-border/50 text-foreground text-base outline-none transition-all duration-300",
              "focus:border-primary placeholder-transparent",
              error && "border-destructive focus:border-destructive",
              className
            )}
            placeholder={label}
            {...props}
          />
          <label
            htmlFor={id}
            className={cn(
              "absolute left-4 top-4 text-muted-foreground transition-transform duration-200 ease-out pointer-events-none origin-[0]",
              "peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:text-primary peer-focus:font-semibold",
              "peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100",
              "peer-[:not(:placeholder-shown)]:-translate-y-6 peer-[:not(:placeholder-shown)]:scale-75",
              error && "text-destructive peer-focus:text-destructive"
            )}
          >
            {label}
          </label>
          
          {isPassword && (
            <button
              type="button"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          )}
        </div>
        {error && <span className="absolute -bottom-5 left-1 text-xs text-destructive font-medium">{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
