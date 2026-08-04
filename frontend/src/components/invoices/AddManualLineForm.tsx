import { useState } from "react";
import type { FormEvent } from "react";
import type { AddManualLineInput } from "../../hooks/useInvoiceDetail";

interface AddManualLineFormProps {
  onSubmit: (values: AddManualLineInput) => Promise<void>;
  onCancel: () => void;
  error: string | null;
}

interface FormValues {
  description: string;
  quantity_hours: string;
  unit_rate: string;
}

const EMPTY_VALUES: FormValues = { description: "", quantity_hours: "", unit_rate: "" };

export function AddManualLineForm({ onSubmit, onCancel, error }: AddManualLineFormProps) {
  const [values, setValues] = useState<FormValues>(EMPTY_VALUES);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationError(null);

    const hours = Number(values.quantity_hours);
    const rate = Number(values.unit_rate);

    if (!values.description.trim()) {
      setValidationError("Inserisci una descrizione.");
      return;
    }
    if (!Number.isFinite(hours) || hours <= 0) {
      setValidationError("Inserisci un numero di ore valido.");
      return;
    }
    if (!Number.isFinite(rate) || rate < 0) {
      setValidationError("Inserisci una tariffa valida.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({ description: values.description, quantity_hours: hours, unit_rate: rate });
    } finally {
      setIsSubmitting(false);
    }
  }

  const displayedError = validationError ?? error;

  return (
    <form className="entity-form" onSubmit={handleSubmit}>
      {displayedError && <p className="entity-form__error">{displayedError}</p>}
      <label className="entity-form__field">
        Descrizione
        <input
          type="text"
          value={values.description}
          onChange={(event) => setValues({ ...values, description: event.target.value })}
          required
        />
      </label>
      <label className="entity-form__field">
        Ore
        <input
          type="number"
          step="0.01"
          min="0"
          value={values.quantity_hours}
          onChange={(event) => setValues({ ...values, quantity_hours: event.target.value })}
          required
        />
      </label>
      <label className="entity-form__field">
        Tariffa unitaria
        <input
          type="number"
          step="0.01"
          min="0"
          value={values.unit_rate}
          onChange={(event) => setValues({ ...values, unit_rate: event.target.value })}
          required
        />
      </label>
      <div className="entity-form__actions">
        <button type="button" className="btn btn--secondary" onClick={onCancel}>
          Annulla
        </button>
        <button type="submit" className="btn btn--primary" disabled={isSubmitting}>
          {isSubmitting ? "Salvataggio…" : "Aggiungi"}
        </button>
      </div>
    </form>
  );
}
