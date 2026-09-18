'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { LogoBancoNacion } from '@/components/LogoBancoNacion';
import { UserIcon } from '@/components/Icons';
import { SupabaseUserRepository } from '@/infrastructure/repositories/supabase-user-repository';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectUrl = searchParams.get('redirect') || '/';
  const tramiteId = searchParams.get('tramiteId');
  const agenciaId = searchParams.get('agenciaId');

  const [identifier, setIdentifier] = useState(''); // DNI o Correo
  const [password, setPassword] = useState('');     // Contraseña
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rememberParamsMessage, setRememberParamsMessage] = useState<string | null>(null);

  const userRepo = new SupabaseUserRepository();

  useEffect(() => {
    if (tramiteId || agenciaId) {
      setRememberParamsMessage('Se guardó tu selección previa de trámite/agencia. Inicia sesión para continuar tu agendamiento.');
    }
  }, [tramiteId, agenciaId]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      // Consulta en vivo directa al servidor remoto de Supabase
      const user = await userRepo.authenticateUser(identifier, password);

      if (!user) {
        setErrorMessage('DNI / Correo o contraseña incorrectos en el servidor de Supabase.');
        setLoading(false);
        return;
      }

      // Guardar la sesión autenticada con la data real obtenida de Supabase
      const sessionData = {
        authenticated: true,
        id_usuario: user.id_usuario,
        dni: user.dni,
        email: user.correo,
        nombre: user.nombre_completo || `${user.nombres || ''} ${user.apellidos || ''}`.trim() || 'Usuario',
        role: user.rol,
        id_agencia: user.id_agencia,
      };
      localStorage.setItem('bn_user_session', JSON.stringify(sessionData));

      const normalizedRole = String(user.rol).toUpperCase();

      if (normalizedRole === 'ADMIN_GENERAL') {
        router.push('/admin-general?adminNotice=true');
        return;
      }
      if (normalizedRole === 'ADMIN_AGENCIA') {
        router.push('/admin-agencia?adminNotice=true');
        return;
      }
      if (normalizedRole === 'AGENTE' || normalizedRole === 'AGENTE_VENTANILLA') {
        router.push('/ventanilla?adminNotice=true');
        return;
      }

      // Rol CLIENTE
      let target = redirectUrl;
      if (tramiteId || agenciaId) {
        const params = new URLSearchParams();
        if (tramiteId) params.set('tramiteId', tramiteId);
        if (agenciaId) params.set('agenciaId', agenciaId);
        target = `/agendar?${params.toString()}`;
      } else if (redirectUrl === '/') {
        target = '/cliente';
      }

      router.push(target);
    } catch (err: any) {
      console.error('Error de autenticación:', err);
      setErrorMessage(err?.message || 'Error al conectar con la base de datos remota de Supabase.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrefill = (demoIdentifier: string, demoPass: string) => {
    setIdentifier(demoIdentifier);
    setPassword(demoPass);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 selection:bg-red-600 selection:text-white">
      {/* Header Superior con Logo del Banco */}
      <div className="mb-6">
        <Link href="/">
          <LogoBancoNacion showSubtitle={true} className="h-14" />
        </Link>
      </div>

      {/* Mensaje de selección de trámite preservada */}
      {rememberParamsMessage && (
        <div className="mb-6 max-w-md w-full bg-red-50 border border-red-200 p-4 rounded-xl text-red-700 text-xs font-semibold text-center shadow-sm animate-fadeIn">
          {rememberParamsMessage}
        </div>
      )}

      {/* TARJETA DEL LOGIN */}
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 sm:p-10 shadow-xl relative">
        <div className="w-16 h-16 rounded-full bg-red-50 border-2 border-red-600 flex items-center justify-center font-extrabold text-red-700 text-xl mx-auto mb-4 shadow-sm">
          <UserIcon className="w-8 h-8 text-red-600" />
        </div>

        <div className="text-center mb-6 space-y-1">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Agendamiento de Citas
          </h1>
          <p className="text-sm text-slate-600 font-medium">
            Inicia sesión con tu DNI o Correo registrado
          </p>
        </div>

        {/* Mensaje de Error de Credenciales */}
        {errorMessage && (
          <div className="mb-5 bg-red-100 border border-red-300 p-3.5 rounded-xl text-red-800 text-xs font-bold text-center animate-fadeIn">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          {/* PRIMER CAMPO: DNI o CORREO */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
              DNI o Correo Electrónico
            </label>
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Ej: 76929985 o leonardocruzgonzales@gmail.com"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl py-3.5 px-4 text-slate-900 placeholder-slate-400 text-sm font-medium focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100 transition"
            />
          </div>

          {/* SEGUNDO CAMPO: CONTRASEÑA */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
              Contraseña
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl py-3.5 px-4 text-slate-900 placeholder-slate-400 text-sm font-medium focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100 transition"
            />
          </div>

          <div className="text-right">
            <a
              href="#olvido"
              onClick={(e) => { e.preventDefault(); alert('Para restablecer tu clave, ponte en contacto con tu agencia o ingresa tu correo registrado.'); }}
              className="text-xs font-bold text-slate-600 hover:text-red-700 underline transition"
            >
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-extrabold rounded-xl shadow-md hover:shadow-red-200 transition text-base uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Consultando Supabase...
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </div>
        </form>

        {/* Atajos de las filas reales del servidor remoto de Supabase */}
        <div className="mt-6 pt-4 border-t border-slate-200">
          <span className="block text-[11px] font-extrabold text-slate-500 uppercase text-center mb-2">
            Filas reales del servidor remoto Supabase (Click para probar):
          </span>
          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            <button
              type="button"
              onClick={() => handlePrefill('76929985', '123456')}
              className="px-2 py-1 bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 rounded font-semibold text-left border border-slate-200 transition truncate"
            >
              🔑 Admin Gen (76929985)
            </button>
            <button
              type="button"
              onClick={() => handlePrefill('20304050', '123456')}
              className="px-2 py-1 bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 rounded font-semibold text-left border border-slate-200 transition truncate"
            >
              🔑 Admin Ag (20304050)
            </button>
            <button
              type="button"
              onClick={() => handlePrefill('30405060', '123456')}
              className="px-2 py-1 bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 rounded font-semibold text-left border border-slate-200 transition truncate"
            >
              🔑 Agente (30405060)
            </button>
            <button
              type="button"
              onClick={() => handlePrefill('40506070', '123456')}
              className="px-2 py-1 bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 rounded font-semibold text-left border border-slate-200 transition truncate"
            >
              🔑 Cliente (40506070)
            </button>
          </div>
        </div>

        <div className="w-full h-px bg-slate-200 my-5" />

        <div className="text-center text-sm text-slate-600 font-medium">
          ¿No tienes cuenta?{' '}
          <Link href="/registro" className="font-extrabold text-red-700 underline hover:text-red-800 transition">
            Regístrate
          </Link>
        </div>
      </div>

      <div className="mt-6 text-center">
        <Link href="/" className="text-xs font-extrabold text-slate-600 hover:text-red-700 transition">
          ← Volver a la página principal
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
