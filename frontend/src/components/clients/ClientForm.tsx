import { useState } from "react";
import type { FormEvent } from "react";
import type { Client } from "../../api/types";
import type { ClientInput } from "../../hooks/useClients";

interface ClientFormProps {
  initialValues?: Client;
  onSubmit: (values: ClientInput) => Promise<void>;
  onCancel: () => void;
  error: string | null;
}

const EMPTY_VALUES: ClientInput = {
  name: "",
  email: "",
  currency: "EUR",
  address: "",
  notes: "",
};

export function ClientForm({ initialValues, onSubmit, onCancel, error }: ClientFormProps) {
  const [values, setValues] = useState<ClientInput>(
    initialValues
      ? {
          name: initialValues.name,
          email: initialValues.email,
          currency: initialValues.currency,
          address: initialValues.address,
          notes: initialValues.notes,
        }
      : EMPTY_VALUES,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } finally {
      setIsSubmitting(false);
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
        Email
        <input
          type="email"
          value={values.email}
          onChange={(event) => setValues({ ...values, email: event.target.value })}
        />
      </label>
      <label className="entity-form__field">
        Valuta
        <input
          type="text"
          value={values.currency}
          maxLength={3}
          onChange={(event) =>
            setValues({ ...values, currency: event.target.value.toUpperCase() })
          }
          required
        />
      </label>
      <label className="entity-form__field">
        Indirizzo
        <textarea
          value={values.address}
          onChange={(event) => setValues({ ...values, address: event.target.value })}
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
          {isSubmitting ? "Salvataggio…" : "Salva"}
        </button>
      </div>
    </form>
  );
}
