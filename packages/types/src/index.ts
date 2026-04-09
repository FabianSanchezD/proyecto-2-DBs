/** Shared domain types — extend as the app grows. */

export interface Employee {
  id: string;
  name: string;
  email: string;
}

export interface Movement {
  id: string;
  employeeId: string;
  type: 'vacation' | 'sick' | 'other';
  startDate: string;
  endDate: string;
}

export interface ApiHealthResponse {
  status: 'ok';
  service: string;
  timestamp: string;
}
