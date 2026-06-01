import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import Input from '../Input';
import { login } from '../../services/auth';
import { useNavigate } from 'react-router-dom';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onToggleMode: () => void;
}

export default function LoginForm({ onToggleMode }: LoginFormProps) {
  const [isBusy, setIsBusy] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsBusy(true);
    try {
      const response = await login(data);
      const userPayload = { ...response, accessToken: response.token };
      localStorage.setItem('user', JSON.stringify(userPayload));
      toast.success(`Welcome back, ${response.name}!`);
      navigate('/dashboard');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to sign in.';
      toast.error(message);
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
      <Input
        label="Email address"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register('email')}
      />

      <Input
        label="Password"
        type="password"
        autoComplete="current-password"
        error={errors.password?.message}
        {...register('password')}
      />

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem', marginTop: '-0.5rem' }}>
        <button type="button" className="link" style={{ fontSize: '0.85rem' }} onClick={() => toast.error('Forgot password flow is under construction.')}>
          Forgot password?
        </button>
      </div>

      <div className="form-actions">
        <button className="submit-button" type="submit" disabled={isBusy}>
          {isBusy ? 'Processing…' : 'Sign in'}
        </button>
        <button type="button" className="link" onClick={onToggleMode}>
          Create account
        </button>
      </div>
    </form>
  );
}
