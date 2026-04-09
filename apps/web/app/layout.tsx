import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'Vacation Control',
  description: 'Employee vacation and movement management',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-zinc-50 text-zinc-900 antialiased">
        <div className="flex min-h-screen">
          <aside className="hidden w-56 shrink-0 border-r border-zinc-200 bg-white md:flex md:flex-col">
            <div className="border-b border-zinc-100 px-4 py-4">
              <span className="text-sm font-semibold tracking-tight">
                Vacation Control
              </span>
            </div>
            <nav className="flex flex-col gap-1 p-3 text-sm">
              <Link
                className="rounded-md px-3 py-2 text-zinc-700 hover:bg-zinc-100"
                href="/"
              >
                Home
              </Link>
              <Link
                className="rounded-md px-3 py-2 text-zinc-700 hover:bg-zinc-100"
                href="/login"
              >
                Login
              </Link>
              <Link
                className="rounded-md px-3 py-2 text-zinc-700 hover:bg-zinc-100"
                href="/employees"
              >
                Employees
              </Link>
            </nav>
          </aside>
          <main className="flex flex-1 flex-col">
            <header className="border-b border-zinc-200 bg-white px-4 py-3 md:hidden">
              <span className="text-sm font-semibold">Vacation Control</span>
            </header>
            <div className="flex-1 p-6">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
