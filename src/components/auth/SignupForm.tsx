import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import Input from '../Input';
import PasswordStrengthMeter from '../PasswordStrengthMeter';
import { Button } from '../ui/Button';
import { signup } from '../../services/auth';

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
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    mode: 'onChange',
  });

  // eslint-disable-next-line react-hooks/incompatible-library
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

  return (
    <form className="grid gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500" onSubmit={handleSubmit(onSubmit)}>
      <Input
        label="Full Name"
        type="text"
        autoComplete="name"
        error={errors.name?.message}
        {...register('name')}
      />

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

      <div className="flex flex-col gap-4 mt-4">
        <Button variant="primary" size="lg" type="submit" isLoading={isBusy} className="w-full">
          Sign up
        </Button>
        <Button variant="ghost" size="md" type="button" onClick={onToggleMode} className="w-full">
          Sign in instead
        </Button>
      </div>
    </form>
  );
}
