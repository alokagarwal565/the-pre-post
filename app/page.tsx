/**
 * Home page - redirects to ideas or auth
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Spinner } from '@/components/Spinner';

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    // Wait for auth to finish loading
    if (loading) return;
    
    // Redirect based on auth state
    if (user) {
      router.replace('/ideas');
    } else {
      router.replace('/auth');
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Spinner message="Loading..." />
    </div>
  );
}
