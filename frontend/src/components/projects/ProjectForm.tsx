import { useState } from "react";
import type { FormEvent } from "react";
import { useClients } from "../../hooks/useClients";
import type { Project } from "../../api/types";
import type { ProjectInput } from "../../hooks/useProjects";

interface ProjectFormProps {
  initialValues?: Project;
  onSubmit: (values: ProjectInput) => Promise<void>;
  onCancel: () => void;
  error: string | null;
}

const EMPTY_VALUES: ProjectInput = {
  client: 0,
  name: "",
  color: "#03A9F4",
  is_billable: true,
  default_hourly_rate: "",
  budget_hours: "",
};

export function ProjectForm({ initialValues, onSubmit, onCancel, error }: ProjectFormProps) {
  const { clients } = useClients();
  const [values, setValues] = useState<ProjectInput>(
    initialValues
      ? {
          client: initialValues.client,
          name: initialValues.name,
          color: initialValues.color,
          is_billable: initialValues.is_billable,
          default_hourly_rate: initialValues.default_hourly_rate ?? "",
          budget_hours: initialValues.budget_hours ?? "",
        }
      : EMPTY_VALUES,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({
        ...values,
        default_hourly_rate:
          values.default_hourly_rate === "" ? null : values.default_hourly_rate,
        budget_hours: values.budget_hours === "" ? null : values.budget_hours,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="entity-form" onSubmit={handleSubmit}>
      {error && <p className="entity-form__error">{error}</p>}
      <label className="entity-form__field">
        Cliente
        <select
          value={values.client || ""}
          onChange={(event) => setValues({ ...values, client: Number(event.target.value) })}
          required
        >
          <option value="" disabled>
            Seleziona un cliente
          </option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
      </label>
      <label className="entity-form__field">
        Nome
        <input
          type="text"
          value={values.name}
          onChange={(event) => setValues({ ...values, name: event.target.value })}
          required
        />
      </label>
      <label className="entity-form__field">
        Colore
        <input
          type="color"
          value={values.color}
          onChange={(event) => setValues({ ...values, color: event.target.value })}
        />
      </label>
      <label className="entity-form__field entity-form__field--checkbox">
        <input
          type="checkbox"
          checked={values.is_billable}
          onChange={(event) => setValues({ ...values, is_billable: event.target.checked })}
        />
        Fatturabile
      </label>
      <label className="entity-form__field">
        Tariffa oraria di default
        <input
          type="number"
          step="0.01"
          min="0"
          value={values.default_hourly_rate ?? ""}
          onChange={(event) =>
            setValues({ ...values, default_hourly_rate: event.target.value })
          }
        />
      </label>
      <label className="entity-form__field">
        Budget ore
        <input
          type="number"
          step="0.01"
          min="0"
          value={values.budget_hours ?? ""}
          onChange={(event) => setValues({ ...values, budget_hours: event.target.value })}
        />
      </label>
      <div className="entity-form__actions">
        <button type="button" className="btn btn--secondary" onClick={onCancel}>
          Annulla
        </button>
        <button type="submit" className="btn btn--primary" disabled={isSubmitting}>
          {isSubmitting ? "Salvataggio…" : "Salva"}
        </button>
      </div>
    </form>
  );
}
