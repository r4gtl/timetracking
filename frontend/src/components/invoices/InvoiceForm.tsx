import { useState } from "react";
import type { FormEvent } from "react";
import { useClients } from "../../hooks/useClients";
import type { GenerateInvoiceInput } from "../../hooks/useInvoices";

interface InvoiceFormProps {
  onSubmit: (values: GenerateInvoiceInput) => Promise<void>;
  onCancel: () => void;
  error: string | null;
}

interface FormValues {
  client: number | "";
  number: string;
  issue_date: string;
  due_date: string;
  period_start: string;
  period_end: string;
  notes: string;
}

const EMPTY_VALUES: FormValues = {
  client: "",
  number: "",
  issue_date: "",
  due_date: "",
  period_start: "",
  period_end: "",
  notes: "",
};

export function InvoiceForm({ onSubmit, onCancel, error }: InvoiceFormProps) {
  const { clients } = useClients();
  const [values, setValues] = useState<FormValues>(EMPTY_VALUES);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationError(null);

    if (values.client === "") {
      setValidationError("Seleziona un cliente.");
      return;
    }
    if (values.period_end < values.period_start) {
      setValidationError("La fine del periodo deve essere successiva o uguale all'inizio.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        client: values.client,
        number: values.number,
        issue_date: values.issue_date,
        due_date: values.due_date === "" ? undefined : values.due_date,
        period_start: values.period_start,
        period_end: values.period_end,
        notes: values.notes === "" ? undefined : values.notes,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const displayedError = validationError ?? error;

  return (
    <form className="entity-form" onSubmit={handleSubmit}>
      {displayedError && <p className="entity-form__error">{displayedError}</p>}
      <label className="entity-form__field">
        Cliente
        <select
          value={values.client}
          onChange={(event) =>
            setValues({
              ...values,
              client: event.target.value === "" ? "" : Number(event.target.value),
            })
          }
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
        Numero fattura
        <input
          type="text"
          value={values.number}
          onChange={(event) => setValues({ ...values, number: event.target.value })}
          placeholder="2026-001"
          required
        />
      </label>
      <label className="entity-form__field">
        Data emissione
        <input
          type="date"
          value={values.issue_date}
          onChange={(event) => setValues({ ...values, issue_date: event.target.value })}
          required
        />
      </label>
      <label className="entity-form__field">
        Scadenza
        <input
          type="date"
          value={values.due_date}
          onChange={(event) => setValues({ ...values, due_date: event.target.value })}
        />
      </label>
      <label className="entity-form__field">
        Periodo dal
        <input
          type="date"
          value={values.period_start}
          onChange={(event) => setValues({ ...values, period_start: event.target.value })}
          required
        />
      </label>
      <label className="entity-form__field">
        Periodo al
        <input
          type="date"
          value={values.period_end}
          onChange={(event) => setValues({ ...values, period_end: event.target.value })}
          required
        />
      </label>
      <label className="entity-form__field">
        Note
        <textarea
          value={values.notes}
          onChange={(event) => setValues({ ...values, notes: event.target.value })}
        />
      </label>
      <div className="entity-form__actions">
        <button type="button" className="btn btn--secondary" onClick={onCancel}>
          Annulla
        </button>
        <button type="submit" className="btn btn--primary" disabled={isSubmitting}>
          {isSubmitting ? "Generazione…" : "Genera fattura"}
        </button>
      </div>
    </form>
  );
}
