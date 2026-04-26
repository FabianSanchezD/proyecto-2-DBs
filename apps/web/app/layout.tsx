import type { Metadata } from 'next';
import './globals.css';
import NavClient from './nav-client';

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
    <html lang="es">
      <body className="min-h-screen bg-zinc-50 text-zinc-900 antialiased">
        <div className="flex min-h-screen">
          <NavClient />
          <main className="flex flex-1 flex-col">
            <div className="flex-1 p-6">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
