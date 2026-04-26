'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clearToken, getUsername, logout } from '../lib/api';

export default function NavClient() {
  const router = useRouter();
  const pathname = usePathname();
  const isLogin = pathname === '/login';

  async function handleLogout() {
    try {
      await logout();
    } catch {
      // ignorar errores de red en logout
    }
    clearToken();
    router.push('/login');
  }

  if (isLogin) return null;

  const username = getUsername();

  return (
    <aside className="hidden w-56 shrink-0 border-r border-zinc-200 bg-white md:flex md:flex-col">
      <div className="border-b border-zinc-100 px-4 py-4">
        <span className="text-sm font-semibold tracking-tight">Vacation Control</span>
      </div>
      <nav className="flex flex-col gap-1 p-3 text-sm flex-1">
        <Link
          className="rounded-md px-3 py-2 text-zinc-700 hover:bg-zinc-100"
          href="/employees"
        >
          Empleados
        </Link>
      </nav>
      {username && (
        <div className="border-t border-zinc-100 p-3">
          <p className="px-3 py-1 text-xs text-zinc-500">{username}</p>
          <button
            onClick={handleLogout}
            className="w-full rounded-md px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </aside>
  );
}
