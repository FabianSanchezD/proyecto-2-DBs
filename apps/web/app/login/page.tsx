'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  checkLoginAvailability,
  login,
  saveToken,
} from '../../lib/api';

function localGetToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('vc_token');
}

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginEnabled, setLoginEnabled] = useState(true);
  const [blockedMsg, setBlockedMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (localGetToken()) {
      router.replace('/employees');
    }
  }, [router]);

  async function handleUsernameBlur() {
    if (!username.trim()) return;
    try {
      const res = await checkLoginAvailability(username.trim());
      if (!res.allowed) {
        setLoginEnabled(false);
        setBlockedMsg(res.message ?? 'Login deshabilitado. Intente de nuevo en 10 minutos.');
      } else {
        setLoginEnabled(true);
        setBlockedMsg('');
      }
    } catch {
      // Si falla la verificacion, se permite intentar de todas formas
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!loginEnabled) return;
    setError('');
    setLoading(true);

    // Verificar disponibilidad antes de hacer login
    try {
      const avail = await checkLoginAvailability(username.trim());
      if (!avail.allowed) {
        setLoginEnabled(false);
        setBlockedMsg(avail.message ?? 'Demasiados intentos de login, intente de nuevo dentro de 10 minutos.');
        setLoading(false);
        return;
      }
    } catch {
      // continuar de todas formas
    }

    try {
      const res = await login(username.trim(), password);
      saveToken(res.accessToken, res.username);
      router.push('/employees');
    } catch (err: unknown) {
      const e = err as { message?: string; resultCode?: number };
      setError(e.message ?? 'Credenciales invalidas.');

      // Re-verificar disponibilidad despues de un fallo
      try {
        const avail = await checkLoginAvailability(username.trim());
        if (!avail.allowed) {
          setLoginEnabled(false);
          setBlockedMsg(avail.message ?? 'Demasiados intentos de login, intente de nuevo dentro de 10 minutos.');
        }
      } catch {
        // ignorar
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Iniciar sesión</h1>
        <p className="mt-1 text-sm text-zinc-600">Control de Vacaciones</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        {blockedMsg && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {blockedMsg}
          </div>
        )}
        {error && !blockedMsg && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="username" className="text-sm font-medium text-zinc-800">
            Usuario
          </label>
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onBlur={handleUsernameBlur}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none ring-zinc-400 focus:ring-2"
            placeholder="nombre de usuario"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium text-zinc-800">
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none ring-zinc-400 focus:ring-2"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={!loginEnabled || loading}
          className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Ingresando...' : loginEnabled ? 'Ingresar' : 'Login deshabilitado'}
        </button>
      </form>
    </div>
  );
}
