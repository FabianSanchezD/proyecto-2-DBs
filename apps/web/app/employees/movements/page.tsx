'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';
import {
  type Movimiento,
  type TipoMovimiento,
  createMovimiento,
  getMovimientos,
  getTiposMovimiento,
} from '../../../lib/api';

export default function MovimientosPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-zinc-500">Cargando...</div>}>
      <MovimientosContent />
    </Suspense>
  );
}

function MovimientosContent() {
  const router = useRouter();
  const params = useSearchParams();
  const employeeId = Number(params.get('id') ?? '0');
  const employeeName = params.get('name') ?? '';
  const employeeDocId = params.get('docId') ?? '';
  const employeeSaldo = params.get('saldo') ?? '';

  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [tipos, setTipos] = useState<TipoMovimiento[]>([]);
  const [showInsert, setShowInsert] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const checkAuth = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (!localStorage.getItem('vc_token')) router.replace('/login');
  }, [router]);

  const fetchMovimientos = useCallback(async () => {
    if (!employeeId) return;
    setLoading(true);
    setError('');
    try {
      const res = await getMovimientos(employeeId);
      setMovimientos(res.items);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message ?? 'Error al cargar movimientos.');
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    checkAuth();
    fetchMovimientos();
    getTiposMovimiento().then((r) => setTipos(r.items)).catch(() => {});
  }, [checkAuth, fetchMovimientos]);

  if (!employeeId) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <p className="text-sm text-zinc-500">Empleado no especificado.</p>
        <button onClick={() => router.push('/employees')} className={btnSecondary}>
          Volver a empleados
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Movimientos</h1>
          <p className="mt-1 text-sm text-zinc-600">{decodeURIComponent(employeeName)}</p>
          <div className="mt-1 flex gap-4 text-xs text-zinc-500">
            {employeeDocId && <span>Cédula: <span className="font-medium text-zinc-700">{decodeURIComponent(employeeDocId)}</span></span>}
            {employeeSaldo !== '' && <span>Saldo vacaciones: <span className="font-medium text-zinc-700">{Number(employeeSaldo).toFixed(2)}</span></span>}
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowInsert(true)} className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800">
            + Insertar movimiento
          </button>
          <button onClick={() => router.push('/employees')} className={btnSecondary}>
            Volver
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        {loading ? (
          <div className="px-4 py-8 text-center text-sm text-zinc-500">Cargando...</div>
        ) : movimientos.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-zinc-500">No hay movimientos registrados.</div>
        ) : (
          <table className="min-w-full divide-y divide-zinc-200 text-sm">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-zinc-700">Fecha</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-700">Tipo</th>
                <th className="px-4 py-3 text-right font-medium text-zinc-700">Monto</th>
                <th className="px-4 py-3 text-right font-medium text-zinc-700">Nuevo saldo</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-700">Usuario</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-700">IP</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-700">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {movimientos.map((m) => (
                <tr key={m.Id} className="hover:bg-zinc-50/80">
                  <td className="px-4 py-3 text-zinc-700">{String(m.Fecha).split('T')[0]}</td>
                  <td className="px-4 py-3 text-zinc-900">{m.NombreTipoMovimiento}</td>
                  <td className="px-4 py-3 text-right text-zinc-700">{Number(m.Monto).toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-zinc-900">{Number(m.NuevoSaldo).toFixed(2)}</td>
                  <td className="px-4 py-3 text-zinc-600">{m.NombreUsuario}</td>
                  <td className="px-4 py-3 text-zinc-500 text-xs">{m.PostInIP}</td>
                  <td className="px-4 py-3 text-zinc-500 text-xs">{String(m.PostTime).replace('T', ' ').slice(0, 19)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showInsert && (
        <InsertMovimientoModal
          employeeId={employeeId}
          employeeName={decodeURIComponent(employeeName)}
          employeeDocId={decodeURIComponent(employeeDocId)}
          employeeSaldo={employeeSaldo}
          tipos={tipos}
          onClose={() => setShowInsert(false)}
          onSuccess={() => { setShowInsert(false); fetchMovimientos(); }}
        />
      )}
    </div>
  );
}

function InsertMovimientoModal({
  employeeId,
  employeeName,
  employeeDocId,
  employeeSaldo,
  tipos,
  onClose,
  onSuccess,
}: {
  employeeId: number;
  employeeName: string;
  employeeDocId: string;
  employeeSaldo: string;
  tipos: TipoMovimiento[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    idTipoMovimiento: tipos[0]?.Id ?? 0,
    fecha: new Date().toISOString().split('T')[0],
    monto: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const montoNum = parseFloat(form.monto);
    if (isNaN(montoNum) || montoNum <= 0) {
      setError('El monto debe ser mayor a 0.');
      return;
    }
    setLoading(true);
    try {
      await createMovimiento({
        empleadoId: employeeId,
        idTipoMovimiento: Number(form.idTipoMovimiento),
        fecha: form.fecha,
        monto: montoNum,
      });
      onSuccess();
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message ?? 'Error al insertar movimiento.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900">Insertar movimiento</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 text-xl leading-none">&times;</button>
        </div>
        <dl className="mb-4 space-y-1 rounded-lg bg-zinc-50 border border-zinc-200 px-4 py-3 text-sm">
          {employeeDocId && (
            <div className="flex justify-between">
              <dt className="text-zinc-500">Cédula</dt>
              <dd className="font-medium text-zinc-800">{employeeDocId}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-zinc-500">Nombre</dt>
            <dd className="font-medium text-zinc-800">{employeeName}</dd>
          </div>
          {employeeSaldo !== '' && (
            <div className="flex justify-between">
              <dt className="text-zinc-500">Saldo vacaciones</dt>
              <dd className="font-medium text-zinc-800">{Number(employeeSaldo).toFixed(2)}</dd>
            </div>
          )}
        </dl>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
          )}
          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-800">Tipo de movimiento</label>
            <select
              required
              value={form.idTipoMovimiento}
              onChange={(e) => setForm({ ...form, idTipoMovimiento: Number(e.target.value) })}
              className={inputClass}
            >
              {tipos.map((t) => (
                <option key={t.Id} value={t.Id}>{t.Nombre} ({t.TipoAccion})</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-800">Fecha</label>
            <input
              required
              type="date"
              value={form.fecha}
              onChange={(e) => setForm({ ...form, fecha: e.target.value })}
              className={inputClass}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-800">Monto</label>
            <input
              required
              type="number"
              min="0.01"
              step="0.01"
              value={form.monto}
              onChange={(e) => setForm({ ...form, monto: e.target.value })}
              className={inputClass}
              placeholder="0.00"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className={btnSecondary}>Cancelar</button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Insertar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputClass =
  'w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none ring-zinc-400 focus:ring-2';

const btnSecondary =
  'rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50';
