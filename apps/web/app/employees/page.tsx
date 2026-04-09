import type { Employee } from '@vacation-control/types';

const placeholderEmployees: Employee[] = [
  { id: '1', name: 'Alex Rivera', email: 'alex@example.com' },
  { id: '2', name: 'Sam Chen', email: 'sam@example.com' },
];

export default function EmployeesPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Employees</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Placeholder list — replace with data from the API.
        </p>
      </div>
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-zinc-700">
                Name
              </th>
              <th className="px-4 py-3 text-left font-medium text-zinc-700">
                Email
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {placeholderEmployees.map((e) => (
              <tr key={e.id} className="hover:bg-zinc-50/80">
                <td className="px-4 py-3 text-zinc-900">{e.name}</td>
                <td className="px-4 py-3 text-zinc-600">{e.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
