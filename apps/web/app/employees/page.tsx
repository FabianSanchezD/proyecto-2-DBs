'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import {
  type Empleado,
  type Puesto,
  createEmployee,
  deleteEmployee,
  getEmployee,
  getEmployees,
  getPuestos,
  logDeleteAttempt,
  updateEmployee,
} from '../../lib/api';

type Modal =
  | { kind: 'none' }
  | { kind: 'insert' }
  | { kind: 'consult'; employee: Empleado }
  | { kind: 'edit'; employee: Empleado }
  | { kind: 'delete'; employee: Empleado };

export default function EmployeesPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Empleado[]>([]);
  const [puestos, setPuestos] = useState<Puesto[]>([]);
  const [filter, setFilter] = useState('');
  const [modal, setModal] = useState<Modal>({ kind: 'none' });
  const [globalError, setGlobalError] = useState('');
  const [loading, setLoading] = useState(false);

  const checkAuth = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (!localStorage.getItem('vc_token')) router.replace('/login');
  }, [router]);

  const fetchEmployees = useCallback(async (f: string) => {
    setLoading(true);
    setGlobalError('');
    try {
      const res = await getEmployees(f);
      setEmployees(res.items);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setGlobalError(e.message ?? 'Error al cargar empleados.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
    fetchEmployees('');
    getPuestos().then((r) => setPuestos(r.items)).catch(() => {});
  }, [checkAuth, fetchEmployees]);

  function handleFilter(e: React.FormEvent) {
    e.preventDefault();
    fetchEmployees(filter);
  }

  async function openConsult(id: number) {
    try {
      const emp = await getEmployee(id);
      setModal({ kind: 'consult', employee: emp });
    } catch {
      setGlobalError('Error al obtener datos del empleado.');
    }
  }

  async function openEdit(id: number) {
    try {
      const emp = await getEmployee(id);
      setModal({ kind: 'edit', employee: emp });
    } catch {
      setGlobalError('Error al obtener datos del empleado.');
    }
  }

  async function openDelete(emp: Empleado) {
    try {
      await logDeleteAttempt(emp.Id);
    } catch {
      // si falla el log no bloqueamos la accion
    }
    setModal({ kind: 'delete', employee: emp });
  }

  function closeModal() {
    setModal({ kind: 'none' });
  }

  function navigateMovements(emp: Empleado) {
    router.push(`/employees/movements?id=${emp.Id}&name=${encodeURIComponent(emp.Nombre)}`);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Empleados</h1>
          <p className="mt-1 text-sm text-zinc-600">Control de vacaciones</p>
        </div>
        <button
          onClick={() => setModal({ kind: 'insert' })}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          + Insertar empleado
        </button>
      </div>

      <form onSubmit={handleFilter} className="flex gap-2">
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filtrar por nombre o número de cédula..."
          className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none ring-zinc-400 focus:ring-2"
        />
        <button
          type="submit"
          className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
        >
          Filtrar
        </button>
        {filter && (
          <button
            type="button"
            onClick={() => { setFilter(''); fetchEmployees(''); }}
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
          >
            Limpiar
          </button>
        )}
      </form>

      {globalError && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {globalError}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        {loading ? (
          <div className="px-4 py-8 text-center text-sm text-zinc-500">Cargando...</div>
        ) : employees.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-zinc-500">No se encontraron empleados.</div>
        ) : (
          <table className="min-w-full divide-y divide-zinc-200 text-sm">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-zinc-700">Nombre</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-700">Cédula</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-700">Puesto</th>
                <th className="px-4 py-3 text-right font-medium text-zinc-700">Saldo vacaciones</th>
                <th className="px-4 py-3 text-center font-medium text-zinc-700">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {employees.map((emp) => (
                <tr key={emp.Id} className="hover:bg-zinc-50/80">
                  <td className="px-4 py-3 text-zinc-900">{emp.Nombre}</td>
                  <td className="px-4 py-3 text-zinc-600">{emp.ValorDocumentoIdentidad}</td>
                  <td className="px-4 py-3 text-zinc-600">{emp.NombrePuesto}</td>
                  <td className="px-4 py-3 text-right text-zinc-900">{Number(emp.SaldoVacaciones).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => openConsult(emp.Id)}
                        className="rounded px-2 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100"
                      >
                        Consultar
                      </button>
                      <button
                        onClick={() => openEdit(emp.Id)}
                        className="rounded px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
                      >
                        Modificar
                      </button>
                      <button
                        onClick={() => openDelete(emp)}
                        className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                      >
                        Eliminar
                      </button>
                      <button
                        onClick={() => navigateMovements(emp)}
                        className="rounded px-2 py-1 text-xs font-medium text-emerald-600 hover:bg-emerald-50"
                      >
                        Movimientos
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modales */}
      {modal.kind === 'insert' && (
        <InsertModal
          puestos={puestos}
          onClose={closeModal}
          onSuccess={() => { closeModal(); fetchEmployees(filter); }}
        />
      )}
      {modal.kind === 'consult' && (
        <ConsultModal employee={modal.employee} onClose={closeModal} />
      )}
      {modal.kind === 'edit' && (
        <EditModal
          employee={modal.employee}
          puestos={puestos}
          onClose={closeModal}
          onSuccess={() => { closeModal(); fetchEmployees(filter); }}
        />
      )}
      {modal.kind === 'delete' && (
        <DeleteModal
          employee={modal.employee}
          onClose={closeModal}
          onSuccess={() => { closeModal(); fetchEmployees(filter); }}
        />
      )}
    </div>
  );
}

// ── Insert Modal ──────────────────────────────────────────────────────────

function InsertModal({
  puestos,
  onClose,
  onSuccess,
}: {
  puestos: Puesto[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    valorDocumentoIdentidad: '',
    nombre: '',
    idPuesto: puestos[0]?.Id ?? 0,
    fechaContratacion: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await createEmployee({ ...form, idPuesto: Number(form.idPuesto) });
      onSuccess();
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message ?? 'Error al insertar empleado.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModalWrapper title="Insertar empleado" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <ErrorBox msg={error} />}
        <Field label="Cédula (solo números)">
          <input
            required
            value={form.valorDocumentoIdentidad}
            onChange={(e) => setForm({ ...form, valorDocumentoIdentidad: e.target.value })}
            className={inputClass}
            placeholder="123456789"
          />
        </Field>
        <Field label="Nombre (solo letras y espacios)">
          <input
            required
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            className={inputClass}
            placeholder="Juan Pérez"
          />
        </Field>
        <Field label="Puesto">
          <select
            required
            value={form.idPuesto}
            onChange={(e) => setForm({ ...form, idPuesto: Number(e.target.value) })}
            className={inputClass}
          >
            {puestos.map((p) => (
              <option key={p.Id} value={p.Id}>{p.Nombre}</option>
            ))}
          </select>
        </Field>
        <Field label="Fecha de contratación">
          <input
            required
            type="date"
            value={form.fechaContratacion}
            onChange={(e) => setForm({ ...form, fechaContratacion: e.target.value })}
            className={inputClass}
          />
        </Field>
        <ModalActions onClose={onClose} loading={loading} submitLabel="Insertar" />
      </form>
    </ModalWrapper>
  );
}

// ── Consult Modal ─────────────────────────────────────────────────────────

function ConsultModal({ employee, onClose }: { employee: Empleado; onClose: () => void }) {
  return (
    <ModalWrapper title="Consulta de empleado" onClose={onClose}>
      <dl className="space-y-3 text-sm">
        <DetailRow label="Cédula" value={employee.ValorDocumentoIdentidad} />
        <DetailRow label="Nombre" value={employee.Nombre} />
        <DetailRow label="Puesto" value={employee.NombrePuesto} />
        <DetailRow label="Saldo vacaciones" value={Number(employee.SaldoVacaciones).toFixed(2)} />
      </dl>
      <div className="mt-6 flex justify-end">
        <button onClick={onClose} className={btnSecondary}>Cerrar</button>
      </div>
    </ModalWrapper>
  );
}

// ── Edit Modal ────────────────────────────────────────────────────────────

function EditModal({
  employee,
  puestos,
  onClose,
  onSuccess,
}: {
  employee: Empleado;
  puestos: Puesto[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    valorDocumentoIdentidad: employee.ValorDocumentoIdentidad,
    nombre: employee.Nombre,
    idPuesto: employee.IdPuesto,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await updateEmployee(employee.Id, { ...form, idPuesto: Number(form.idPuesto) });
      onSuccess();
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message ?? 'Error al actualizar empleado.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModalWrapper title="Modificar empleado" onClose={onClose}>
      <p className="mb-4 text-xs text-zinc-500">Saldo de vacaciones: {Number(employee.SaldoVacaciones).toFixed(2)} (no editable)</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <ErrorBox msg={error} />}
        <Field label="Cédula (solo números)">
          <input
            required
            value={form.valorDocumentoIdentidad}
            onChange={(e) => setForm({ ...form, valorDocumentoIdentidad: e.target.value })}
            className={inputClass}
          />
        </Field>
        <Field label="Nombre (solo letras y espacios)">
          <input
            required
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            className={inputClass}
          />
        </Field>
        <Field label="Puesto">
          <select
            required
            value={form.idPuesto}
            onChange={(e) => setForm({ ...form, idPuesto: Number(e.target.value) })}
            className={inputClass}
          >
            {puestos.map((p) => (
              <option key={p.Id} value={p.Id}>{p.Nombre}</option>
            ))}
          </select>
        </Field>
        <ModalActions onClose={onClose} loading={loading} submitLabel="Guardar cambios" />
      </form>
    </ModalWrapper>
  );
}

// ── Delete Modal ──────────────────────────────────────────────────────────

function DeleteModal({
  employee,
  onClose,
  onSuccess,
}: {
  employee: Empleado;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setError('');
    setLoading(true);
    try {
      await deleteEmployee(employee.Id);
      onSuccess();
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message ?? 'Error al eliminar empleado.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModalWrapper title="Eliminar empleado" onClose={onClose}>
      <p className="text-sm text-zinc-700 mb-1">
        ¿Está seguro de eliminar este empleado?
      </p>
      <dl className="space-y-2 text-sm my-4">
        <DetailRow label="Cédula" value={employee.ValorDocumentoIdentidad} />
        <DetailRow label="Nombre" value={employee.Nombre} />
      </dl>
      {error && <ErrorBox msg={error} />}
      <div className="mt-4 flex justify-end gap-2">
        <button onClick={onClose} className={btnSecondary}>Cancelar</button>
        <button
          onClick={handleConfirm}
          disabled={loading}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? 'Eliminando...' : 'Confirmar eliminación'}
        </button>
      </div>
    </ModalWrapper>
  );
}

// ── Shared UI ─────────────────────────────────────────────────────────────

function ModalWrapper({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 text-xl leading-none">&times;</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-zinc-800">{label}</label>
      {children}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-zinc-100 pb-2">
      <dt className="font-medium text-zinc-600">{label}</dt>
      <dd className="text-zinc-900">{value}</dd>
    </div>
  );
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{msg}</div>
  );
}

function ModalActions({ onClose, loading, submitLabel }: { onClose: () => void; loading: boolean; submitLabel: string }) {
  return (
    <div className="flex justify-end gap-2 pt-2">
      <button type="button" onClick={onClose} className={btnSecondary}>Cancelar</button>
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
      >
        {loading ? 'Guardando...' : submitLabel}
      </button>
    </div>
  );
}

const inputClass =
  'w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none ring-zinc-400 focus:ring-2';

const btnSecondary =
  'rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50';
