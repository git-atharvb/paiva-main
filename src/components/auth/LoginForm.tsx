import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import Input from '../Input';
import { Button } from '../ui/Button';
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
      toast.success(`Welcome to Paiva, ${response.name || 'User'}!`);
      navigate('/dashboard');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to sign in.';
      toast.error(message);
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <form className="grid gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500" onSubmit={handleSubmit(onSubmit)}>
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

      <div className="flex justify-end -mt-4 mb-2">
        <Button variant="ghost" size="sm" type="button" onClick={() => toast.error('Forgot password flow is under construction.')}>
          Forgot password?
        </Button>
      </div>

      <div className="flex flex-col gap-4 mt-2">
        <Button variant="primary" size="lg" type="submit" isLoading={isBusy} className="w-full">
          Sign in
        </Button>
        <Button variant="ghost" size="md" type="button" onClick={onToggleMode} className="w-full">
          Create account
        </Button>
      </div>
    </form>
  );
}
