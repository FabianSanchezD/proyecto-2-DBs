const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('vc_token');
}

export function saveToken(token: string, username: string): void {
  localStorage.setItem('vc_token', token);
  localStorage.setItem('vc_username', username);
}

export function clearToken(): void {
  localStorage.removeItem('vc_token');
  localStorage.removeItem('vc_username');
}

export function getUsername(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('vc_username');
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...init, headers });

  if (res.status === 204) return undefined as T;

  const body = await res.json().catch(() => ({})) as Record<string, unknown>;

  if (!res.ok) {
    throw { status: res.status, ...body };
  }

  return body as T;
}

// ── Auth ──────────────────────────────────────────────────────────────────

export type LoginAvailabilityResponse = {
  allowed: boolean;
  resultCode: number;
  message?: string;
};

export async function checkLoginAvailability(username: string): Promise<LoginAvailabilityResponse> {
  return request('/auth/login-availability', {
    method: 'POST',
    body: JSON.stringify({ username }),
  });
}

export type LoginResponse = {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  username: string;
};

export async function login(username: string, password: string): Promise<LoginResponse> {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export async function logout(): Promise<void> {
  return request('/auth/logout', { method: 'POST' });
}

// ── Puestos ───────────────────────────────────────────────────────────────

export type Puesto = { Id: number; Nombre: string; SalarioxHora: number };

export async function getPuestos(): Promise<{ items: Puesto[] }> {
  return request('/employees/puestos');
}

// ── Empleados ─────────────────────────────────────────────────────────────

export type Empleado = {
  Id: number;
  ValorDocumentoIdentidad: string;
  Nombre: string;
  IdPuesto: number;
  NombrePuesto: string;
  SaldoVacaciones: number;
  FechaContratacion: string;
};

export async function getEmployees(filter: string = ''): Promise<{ items: Empleado[] }> {
  const q = filter ? `?filter=${encodeURIComponent(filter)}` : '';
  return request(`/employees${q}`);
}

export async function getEmployee(id: number): Promise<Empleado> {
  return request(`/employees/${id}`);
}

export async function createEmployee(data: {
  valorDocumentoIdentidad: string;
  nombre: string;
  idPuesto: number;
  fechaContratacion: string;
}): Promise<{ resultCode: number }> {
  return request('/employees', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateEmployee(
  id: number,
  data: { valorDocumentoIdentidad: string; nombre: string; idPuesto: number },
): Promise<{ resultCode: number }> {
  return request(`/employees/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function logDeleteAttempt(id: number): Promise<{ resultCode: number }> {
  return request(`/employees/${id}/log-delete`, { method: 'POST' });
}

export async function deleteEmployee(id: number): Promise<{ resultCode: number }> {
  return request(`/employees/${id}`, { method: 'DELETE' });
}

// ── Movimientos ───────────────────────────────────────────────────────────

export type TipoMovimiento = { Id: number; Nombre: string; TipoAccion: string };

export async function getTiposMovimiento(): Promise<{ items: TipoMovimiento[] }> {
  return request('/movements/tipos');
}

export type Movimiento = {
  Id: number;
  Fecha: string;
  NombreTipoMovimiento: string;
  Monto: number;
  NuevoSaldo: number;
  NombreUsuario: string;
  PostInIP: string;
  PostTime: string;
};

export async function getMovimientos(employeeId: number): Promise<{ items: Movimiento[] }> {
  return request(`/movements?employeeId=${employeeId}`);
}

export async function createMovimiento(data: {
  empleadoId: number;
  idTipoMovimiento: number;
  fecha: string;
  monto: number;
}): Promise<{ resultCode: number }> {
  return request('/movements', { method: 'POST', body: JSON.stringify(data) });
}
