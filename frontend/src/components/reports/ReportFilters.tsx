import { useState } from "react";
import type { ReportFilterParams } from "../../hooks/useReportSummary";
import { getCurrentMonthRange } from "../../hooks/useReportSummary";
import { useClients } from "../../hooks/useClients";
import { useProjects } from "../../hooks/useProjects";
import "./reports.css";

interface ReportFiltersProps {
  onApply: (filters: ReportFilterParams) => void;
}

type BillableOption = "all" | "billable" | "non_billable";

interface FilterFormState {
  client: number | "";
  project: number | "";
  start_after: string;
  start_before: string;
  billable: BillableOption;
}

function buildDefaultFormState(): FilterFormState {
  return {
    client: "",
    project: "",
    ...getCurrentMonthRange(),
    billable: "all",
  };
}

function toFilterParams(form: FilterFormState): ReportFilterParams {
  return {
    ...(form.client === "" ? {} : { client: form.client }),
    ...(form.project === "" ? {} : { project: form.project }),
    ...(form.start_after === "" ? {} : { start_after: form.start_after }),
    ...(form.start_before === "" ? {} : { start_before: form.start_before }),
    ...(form.billable === "all" ? {} : { is_billable: form.billable === "billable" }),
  };
}

export function ReportFilters({ onApply }: ReportFiltersProps) {
  const [form, setForm] = useState<FilterFormState>(buildDefaultFormState);
  const { clients } = useClients();
  const { projects } = useProjects({ clientId: form.client === "" ? undefined : form.client });
  const availableProjects = projects.filter((project) => !project.is_archived);

  function handleClientChange(value: string) {
    setForm({ ...form, client: value === "" ? "" : Number(value), project: "" });
  }

  function handleApply() {
    onApply(toFilterParams(form));
  }

  function handleReset() {
    setForm(buildDefaultFormState());
  }

  return (
    <div className="report-filters">
      <label className="entity-form__field">
        Cliente
        <select value={form.client} onChange={(event) => handleClientChange(event.target.value)}>
          <option value="">Tutti i clienti</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
      </label>
      <label className="entity-form__field">
        Progetto
        <select
          value={form.project}
          onChange={(event) =>
            setForm({ ...form, project: event.target.value === "" ? "" : Number(event.target.value) })
          }
        >
          <option value="">Tutti i progetti</option>
          {availableProjects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </label>
      <label className="entity-form__field">
        Da
        <input
          type="date"
          value={form.start_after}
          onChange={(event) => setForm({ ...form, start_after: event.target.value })}
        />
      </label>
      <label className="entity-form__field">
        A
        <input
          type="date"
          value={form.start_before}
          onChange={(event) => setForm({ ...form, start_before: event.target.value })}
        />
      </label>
      <label className="entity-form__field">
        Fatturabile
        <select
          value={form.billable}
          onChange={(event) => setForm({ ...form, billable: event.target.value as BillableOption })}
        >
          <option value="all">Tutti</option>
          <option value="billable">Solo billable</option>
          <option value="non_billable">Solo non billable</option>
        </select>
      </label>
      <div className="entity-form__actions">
        <button type="button" className="btn btn--secondary" onClick={handleReset}>
          Azzera
        </button>
        <button type="button" className="btn btn--primary" onClick={handleApply}>
          Applica filtri
        </button>
      </div>
    </div>
  );
}
