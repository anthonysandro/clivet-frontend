'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from 'aws-amplify/auth';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await getCurrentUser();
        // Si hay sesión activa → va al dashboard
        router.replace('/dashboard');
      } catch {
        // Si no hay sesión → va al login
        router.replace('/login');
      }
    };
    checkAuth();
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Loader2 className="animate-spin text-indigo-600" size={40} />
    </div>
  );
}