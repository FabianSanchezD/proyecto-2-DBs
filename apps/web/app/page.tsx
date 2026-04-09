import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <p className="text-zinc-600">
        Welcome to Vacation Control. Use the sidebar or the links below to
        navigate.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/login"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Go to Login
        </Link>
        <Link
          href="/employees"
          className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
        >
          View Employees
        </Link>
      </div>
    </div>
  );
}
