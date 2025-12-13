/**
 * Authentication Page
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { AuthForm } from '@/components/AuthForm';
import { authApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export default function AuthPage() {
  const { user, login, signup } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      router.push('/ideas');
    }
  }, [user, router]);

  const handleEmailAuth = async (email: string, password: string, isSignUp: boolean) => {
    try {
      if (isSignUp) {
        await signup(email, password);
      } else {
        await login(email, password);
      }
      router.push('/ideas');
    } catch (error: any) {
      console.error('Auth error:', error);
      toast({
        title: "Authentication Failed",
        description: error.message || 'Authentication failed',
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <AuthForm
        onEmailAuth={handleEmailAuth}
      />
    </div>
  );
}

