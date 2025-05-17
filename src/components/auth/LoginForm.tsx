
"use client";

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, LogIn } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface LoginFormProps {
  onSwitchToSignUp?: () => void;
  onLoginSuccess?: () => void;
}

export function LoginForm({ onSwitchToSignUp, onLoginSuccess }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signIn(email, password);
      toast({
        title: 'Login Successful',
        description: "Welcome back!",
      });
      onLoginSuccess?.();
      router.refresh(); // Important to re-trigger server components that might depend on auth state
      // router.push('/dashboard'); // Or wherever you want to redirect after login
    } catch (error: any) {
      console.error(error);
      let description = "An unexpected error occurred. Please try again.";
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        description = "Invalid email or password. Please check your credentials.";
      } else if (error.code === 'auth/too-many-requests') {
        description = "Too many login attempts. Please try again later.";
      }
      toast({
        title: 'Login Failed',
        description,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="login-email">Email</Label>
        <Input
          id="login-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="you@example.com"
        />
      </div>
      <div>
        <Label htmlFor="login-password">Password</Label>
        <Input
          id="login-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="••••••••"
        />
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
        Login
      </Button>
      {onSwitchToSignUp && (
        <Button variant="link" type="button" onClick={onSwitchToSignUp} className="w-full">
          Don't have an account? Sign Up
        </Button>
      )}
    </form>
  );
}
