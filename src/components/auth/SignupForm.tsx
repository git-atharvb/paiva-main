import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import Input from '../Input';
import PasswordStrengthMeter from '../PasswordStrengthMeter';
import { Button } from '../ui/Button';
import { signup, googleLogin } from '../../services/auth';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import type { CredentialResponse } from '@react-oauth/google';
import { useTheme } from '../../context/ThemeContext';
import { ArrowRight } from 'lucide-react';

const signupSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters.').max(50, 'Name is too long.'),
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupFormData = z.infer<typeof signupSchema>;

interface SignupFormProps {
  onToggleMode: () => void;
  onSuccess: (email: string) => void;
}

export default function SignupForm({ onToggleMode, onSuccess }: SignupFormProps) {
  const [isBusy, setIsBusy] = useState(false);
  const navigate = useNavigate();
  const { theme } = useTheme();

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    setIsBusy(true);
    try {
      if (credentialResponse.credential) {
        const response = await googleLogin(credentialResponse.credential);
        const userPayload = { ...response, accessToken: response.token };
        localStorage.setItem('user', JSON.stringify(userPayload));
        toast.success(`Welcome to Paiva, ${response.name || 'User'}!`);
        navigate('/dashboard');
      } else {
        toast.error('Google sign in failed. No token received.');
      }
    } catch(err) {
      const message = err instanceof Error ? err.message : 'Unable to sign up with Google.';
      toast.error(message);
    } finally {
      setIsBusy(false);
    }
  };

  const handleGoogleError = () => {
    toast.error('Google sign in was unsuccessful. Please try again.');
  };
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    mode: 'onChange',
  });

  const password = watch('password');

  const onSubmit = async (data: SignupFormData) => {
    setIsBusy(true);
    try {
      await signup({
        name: data.name,
        email: data.email,
        password: data.password
      });
      toast.success('Account created successfully. You can now sign in.');
      onSuccess(data.email);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to create account.';
      toast.error(message);
    } finally {
      setIsBusy(false);
    }
  };

  const isDark = theme === 'dark' || theme === 'cyberpunk' || theme === 'midnight';

  if (isBusy) {
    return (
      <div className="flex flex-col items-center justify-center py-8 animate-in fade-in zoom-in duration-500">
        <div className="relative w-20 h-20 mb-6">
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
          <img src="/src/assets/paiva_logo.png" alt="PAIVA Logo" className="w-full h-full object-contain relative z-10 animate-bounce" style={{ animationDuration: '2s' }} />
        </div>
        <h3 className="text-lg font-bold text-foreground mb-2 tracking-tight">Creating Account...</h3>
        <p className="text-sm text-muted-foreground mb-6 text-center">Securing your connection to PAIVA</p>
        <div className="w-48 h-1.5 bg-secondary/50 rounded-full overflow-hidden relative">
          <div className="absolute inset-y-0 left-0 bg-primary w-1/2 rounded-full animate-[loading_1.5s_ease-in-out_infinite] origin-left" style={{ animationName: 'progress' }} />
        </div>
        <style>{`
          @keyframes progress {
            0% { transform: translateX(-100%); }
            50% { transform: translateX(100%); }
            100% { transform: translateX(200%); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <form className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-4 duration-500" onSubmit={handleSubmit(onSubmit)}>
      <Input
        label="Full Name"
        type="text"
        autoComplete="name"
        error={errors.name?.message}
        {...register('name')}
      />

      <Input
        label="Email"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register('email')}
      />

      <Input
        label="Password"
        type="password"
        autoComplete="new-password"
        error={errors.password?.message}
        {...register('password')}
      />
      
      {password && password.length > 0 && (
        <PasswordStrengthMeter password={password} />
      )}

      <Input
        label="Confirm Password"
        type="password"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        {...register('confirmPassword')}
      />

      <div className="flex flex-col gap-4 mt-2">
        <Button variant="glow" size="lg" type="submit" isLoading={isBusy} className="w-full gap-2.5">
          Create account
          {!isBusy && <ArrowRight size={17} strokeWidth={2} className="transition-transform duration-200 group-hover:translate-x-0.5" />}
        </Button>

        {/* Divider */}
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-linear-to-r from-transparent via-border to-transparent" />
          <span className="text-xs uppercase text-muted-foreground/60 font-semibold tracking-widest">
            Or continue with
          </span>
          <div className="flex-1 h-px bg-linear-to-l from-transparent via-border to-transparent" />
        </div>

        <div className="flex justify-center w-full transform transition-transform duration-300 hover:scale-[1.02]">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            useOneTap
            theme={isDark ? 'filled_blue' : 'outline'}
            shape="pill"
          />
        </div>

        <Button variant="secondary" size="md" type="button" onClick={onToggleMode} className="w-full mt-2 border border-border/50 hover:bg-secondary/80 hover:shadow-sm transition-all duration-300">
          Sign in to existing account
        </Button>

        {/* ── Footer Credits ──────────────────────────────────────── */}
        <div className="mt-6 pt-5 w-full relative group">
          {/* Subtle glowing separator */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent group-hover:via-primary/30 transition-colors duration-500" />
          
          <div className="flex flex-col items-center justify-center gap-2.5">
            <div className="text-[11.5px] font-medium text-muted-foreground/60 tracking-wide text-center leading-relaxed">
              Developed By <br/>
              <span className="inline-flex items-center gap-1.5 mt-1.5">
                <span className="font-bold bg-gradient-to-r from-pink-500 to-rose-400 bg-clip-text text-transparent drop-shadow-sm transform transition-transform hover:scale-105 cursor-default">
                  Ananya Parbat
                </span>
                <span className="text-muted-foreground/40 text-[10px] font-bold">&amp;</span>
                <span className="font-bold bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent drop-shadow-sm transform transition-transform hover:scale-105 cursor-default">
                  Atharv Bowlekar
                </span>
              </span>
            </div>
            
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/30 border border-border/20 text-[10px] font-bold tracking-widest text-muted-foreground/50 transition-all duration-300 group-hover:bg-secondary/50 group-hover:text-foreground/70 group-hover:border-border/40 group-hover:shadow-sm">
              <span className="text-[13px] leading-none">&copy;</span> 2026
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
