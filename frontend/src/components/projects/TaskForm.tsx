import { useState } from "react";
import type { FormEvent } from "react";
import type { Task } from "../../api/types";
import type { TaskInput } from "../../hooks/useTasks";

interface TaskFormProps {
  initialValues?: Task;
  onSubmit: (values: TaskInput) => Promise<void>;
  onCancel: () => void;
  error: string | null;
}

const EMPTY_VALUES: TaskInput = {
  name: "",
  hourly_rate: "",
  is_billable: null,
};

export function TaskForm({ initialValues, onSubmit, onCancel, error }: TaskFormProps) {
  const [values, setValues] = useState<TaskInput>(
    initialValues
      ? {
          name: initialValues.name,
          hourly_rate: initialValues.hourly_rate ?? "",
          is_billable: initialValues.is_billable,
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
        hourly_rate: values.hourly_rate === "" ? null : values.hourly_rate,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleBillableChange(value: string) {
    if (value === "inherit") {
      setValues({ ...values, is_billable: null });
    } else {
      setValues({ ...values, is_billable: value === "true" });
    }
  }

  return (
    <form className="entity-form" onSubmit={handleSubmit}>
      {error && <p className="entity-form__error">{error}</p>}
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
        Tariffa oraria (vuoto = eredita dal progetto)
        <input
          type="number"
          step="0.01"
          min="0"
          value={values.hourly_rate ?? ""}
          onChange={(event) => setValues({ ...values, hourly_rate: event.target.value })}
        />
      </label>
      <label className="entity-form__field">
        Fatturabile
        <select
          value={values.is_billable === null ? "inherit" : String(values.is_billable)}
          onChange={(event) => handleBillableChange(event.target.value)}
        >
          <option value="inherit">Eredita dal progetto</option>
          <option value="true">Sì</option>
          <option value="false">No</option>
        </select>
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
