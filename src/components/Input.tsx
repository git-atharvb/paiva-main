import { forwardRef, useState } from 'react';
import type { InputHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, type = 'text', className = '', ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';

    return (
      <div className="input-group">
        <div className="input-wrapper">
          <input
            ref={ref}
            type={isPassword && showPassword ? 'text' : type}
            className={`modern-input ${error ? 'input-error' : ''} ${className}`}
            placeholder=" "
            {...props}
          />
          <label className="floating-label">{label}</label>
          
          {isPassword && (
            <button
              type="button"
              className="password-toggle-icon"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}
        </div>
        {error && <span className="error-message">{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
