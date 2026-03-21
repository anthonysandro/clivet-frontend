'use client';

import { useState, FormEvent, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn, confirmSignIn } from 'aws-amplify/auth';
import { AlertCircle, Lock, Mail, Loader2, BrainCircuit } from 'lucide-react';

// Componente interno para manejar los SearchParams de forma segura en Next.js
function LoginContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isNewPasswordRequired, setIsNewPasswordRequired] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorType = searchParams.get('error');

  // ✅ OPTIMIZACIÓN 1: Pre-carga del dashboard para que la transición sea instantánea
  useEffect(() => {
    router.prefetch('/dashboard');
  }, [router]);

  const handleSignIn = async (e: FormEvent) => {
    e.preventDefault();
    if (isLoading) return; // ✅ Evita múltiples envíos si el usuario hace click rápido

    setError('');
    setIsLoading(true);

    try {
      // ✅ OPTIMIZACIÓN 2: Limpieza de espacios en el email
      const { isSignedIn, nextStep } = await signIn({
        username: email.trim(),
        password: password,
      });

      if (nextStep.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
        setIsNewPasswordRequired(true);
        setIsLoading(false);
      } else if (isSignedIn) {
        // ✅ OPTIMIZACIÓN 3: Eliminamos el setTimeout y usamos replace para mayor velocidad
        router.replace('/dashboard');
      }
    } catch (err: any) {
      console.error('[LOGIN] Error:', err);
      setIsLoading(false);

      // Manejo de errores amigable
      const errorMap: Record<string, string> = {
        'NotAuthorizedException': 'Credenciales incorrectas o cuenta deshabilitada.',
        'UserNotFoundException': 'No existe una cuenta con este correo.',
        'LimitExceededException': 'Demasiados intentos. Intenta más tarde.',
        'PasswordResetRequiredException': 'Debes restablecer tu contraseña.'
      };

      setError(errorMap[err.name] || 'Ocurrió un problema al ingresar. Intenta de nuevo.');
    }
  };

  const handleNewPasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      await confirmSignIn({ challengeResponse: newPassword });
      router.replace('/dashboard');
    } catch (err: any) {
      setError('No se pudo establecer la contraseña. Revisa los requisitos.');
      setIsLoading(false);
    }
  };

  // VISTA: CAMBIO DE CONTRASEÑA OBLIGATORIO
  if (isNewPasswordRequired) {
    return (
      <div className="bg-white p-10 rounded-[3rem] shadow-2xl w-full max-w-md border border-gray-100 animate-in fade-in zoom-in duration-300">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <Lock size={32} />
          </div>
          <h2 className="text-2xl font-black text-gray-800 tracking-tight">Nueva Contraseña</h2>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">Seguridad Requerida</p>
        </div>

        <form onSubmit={handleNewPasswordSubmit} className="space-y-5">
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 block mb-2">Crea tu clave secreta</label>
            <input
              type="password"
              required
              autoFocus
              className="w-full p-5 bg-gray-50 border-none rounded-2xl font-bold text-gray-800 focus:ring-2 focus:ring-indigo-600 outline-none"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min. 8 caracteres"
            />
          </div>
          {error && <p className="text-xs font-bold text-red-500 text-center">{error}</p>}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : 'Activar Cuenta'}
          </button>
        </form>
      </div>
    );
  }

  // VISTA: LOGIN NORMAL
  return (
    <div className="bg-white p-10 rounded-[3rem] shadow-2xl w-full max-w-md border border-gray-100 animate-in fade-in slide-in-from-bottom-8 duration-500">
      <div className="text-center mb-10">
        <h2 className="text-4xl font-black text-indigo-600 tracking-tighter uppercase italic leading-none">Clinica Veterinaria Acevedo</h2>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mt-3">Intelligent SaaS</p>
      </div>

      {/* AVISO DE SESIÓN EXPIRADA / BLOQUEO */}
      {errorType === 'session_expired' && (
        <div className="mb-8 bg-red-50 border border-red-100 p-5 rounded-[2rem] flex items-start gap-4 animate-bounce-short">
          <AlertCircle className="text-red-500 shrink-0" size={24} />
          <div>
            <p className="text-[10px] font-black text-red-700 uppercase tracking-widest">Acceso Denegado</p>
            <p className="text-[11px] text-red-600 font-bold leading-relaxed mt-1">
              Tu sesión fue revocada por seguridad o la cuenta ha sido desactivada.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSignIn} className="space-y-6">
        <div className="relative">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Usuario / Email</label>
          <div className="relative">
            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
            <input
              type="email"
              required
              className="w-full pl-14 pr-5 py-5 bg-gray-50 border-none rounded-2xl font-bold text-gray-800 focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ejemplo@clivet.com"
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Contraseña</label>
          <div className="relative">
            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
            <input
              type="password"
              required
              className="w-full pl-14 pr-5 py-5 bg-gray-50 border-none rounded-2xl font-bold text-gray-800 focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
        </div>

        {error && !errorType && (
          <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl text-center">
            <p className="text-[11px] font-bold text-orange-600">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-5 text-white rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-2xl transition-all flex items-center justify-center gap-2 active:scale-95 ${
            isLoading 
              ? 'bg-indigo-400 cursor-not-allowed' 
              : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100'
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              <span>Validando Credenciales...</span>
            </>
          ) : (
            'Entrar al Sistema'
          )}
        </button>
      </form>
      
      <div className="mt-10 pt-8 border-t border-gray-50 flex justify-center gap-4 opacity-30">
        <BrainCircuit size={20} />
        <span className="text-[9px] font-black uppercase tracking-widest">Developed by Serendipity</span>
      </div>
    </div>
  );
}

// Wrapper principal con Suspense (Requerido por Next.js para usar useSearchParams)
export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-6">
      <Suspense fallback={<Loader2 className="animate-spin text-indigo-600" size={40} />}>
        <LoginContent />
      </Suspense>
    </div>
  );
}