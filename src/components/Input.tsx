import { forwardRef, useState } from 'react';
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

    return (
      <div className="relative mb-6 text-left w-full group">
        <div className="relative w-full">
          <input
            ref={ref}
            type={isPassword && showPassword ? 'text' : type}
            className={cn(
              'peer w-full h-14 px-4 pt-4 pb-2 rounded-xl bg-black/5 dark:bg-white/5 border-2 transition-all outline-none text-foreground placeholder-transparent focus:ring-4 focus:ring-primary/20',
              error ? 'border-destructive focus:border-destructive' : 'border-transparent focus:border-primary',
              className
            )}
            placeholder={label}
            {...props}
          />
          <label 
            className={cn(
              'absolute left-4 top-4 text-muted-foreground transition-all pointer-events-none text-base',
              'peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-muted-foreground',
              'peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-primary',
              'peer-[&:not(:placeholder-shown)]:top-1.5 peer-[&:not(:placeholder-shown)]:text-xs'
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
