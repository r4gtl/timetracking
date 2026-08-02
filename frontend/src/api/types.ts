// Interfacce TypeScript che rispecchiano i serializer DRF del backend.
// Nota sui tipi numerici: i campi DecimalField dei model (es. hourly_rate,
// unit_rate, quantity_hours) vengono serializzati da DRF come stringhe
// ("75.00"), mentre i SerializerMethodField che ritornano Decimal calcolati
// in Python (es. effective_hourly_rate, resolved_hourly_rate, amount,
// total_amount) vengono serializzati come numeri JSON. REST_FRAMEWORK non
// ha paginazione configurata, quindi le liste sono array semplici.

export interface Client {
  id: number;
  name: string;
  email: string;
  currency: string;
  address: string;
  notes: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: number;
  project: number;
  name: string;
  hourly_rate: string | null;
  is_billable: boolean | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  effective_hourly_rate: number | null;
  effective_is_billable: boolean;
}

export interface Project {
  id: number;
  client: number;
  client_name: string;
  name: string;
  color: string;
  is_billable: boolean;
  default_hourly_rate: string | null;
  budget_hours: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  tasks: Task[];
}

export interface TimeEntry {
  id: number;
  user: number;
  project: number;
  task: number | null;
  description: string;
  start_time: string;
  end_time: string | null;
  is_billable: boolean;
  is_invoiced: boolean;
  created_at: string;
  updated_at: string;
  duration_seconds: number;
  resolved_hourly_rate: number | null;
  estimated_amount: number | null;
}

export interface UserProjectRate {
  id: number;
  user: number;
  project: number;
  hourly_rate: string;
  user_username: string;
  project_name: string;
}

export type InvoiceStatus = "draft" | "sent" | "paid";

export interface InvoiceLine {
  id: number;
  invoice: number;
  time_entry: number | null;
  description: string;
  quantity_hours: string;
  unit_rate: string;
  amount: number;
}

export interface Invoice {
  id: number;
  client: number;
  client_name: string;
  number: string;
  status: InvoiceStatus;
  currency: string;
  issue_date: string;
  due_date: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
  lines: InvoiceLine[];
  total_amount: number;
}
