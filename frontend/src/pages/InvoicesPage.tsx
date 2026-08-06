import { useState } from "react";
import { extractErrorMessage } from "../api/errors";
import type { InvoiceStatus } from "../api/types";
import { BrandLogo } from "../components/common/BrandLogo";
import "../components/common/common.css";
import { ErrorMessage } from "../components/common/ErrorMessage";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { Modal } from "../components/common/Modal";
import { InvoiceForm } from "../components/invoices/InvoiceForm";
import { InvoiceList } from "../components/invoices/InvoiceList";
import "../components/invoices/invoices.css";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { useClients } from "../hooks/useClients";
import { useInvoices } from "../hooks/useInvoices";
import type { GenerateInvoiceInput } from "../hooks/useInvoices";

const STATUS_OPTIONS: { value: InvoiceStatus | ""; label: string }[] = [
  { value: "", label: "Tutti" },
  { value: "draft", label: "Bozza" },
  { value: "sent", label: "Inviata" },
  { value: "paid", label: "Pagata" },
];

export function InvoicesPage() {
  const { clients } = useClients();
  const [clientFilter, setClientFilter] = useState<number | "">("");
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "">("");
  const { invoices, loading, error, generateInvoice } = useInvoices({
    client: clientFilter === "" ? undefined : clientFilter,
    status: statusFilter === "" ? undefined : statusFilter,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function openCreateModal() {
    setFormError(null);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setFormError(null);
  }

  async function handleGenerate(values: GenerateInvoiceInput) {
    try {
      const invoice = await generateInvoice(values);
      closeModal();
      setNotice(
        invoice.skipped_entries_count > 0
          ? `Fattura creata. Nota: ${invoice.skipped_entries_count} registrazioni sono state escluse per mancanza di una tariffa configurata.`
          : "Fattura creata.",
      );
    } catch (err) {
      setFormError(
        extractErrorMessage(err, "Non è stato possibile generare la fattura. Riprova tra qualche istante."),
      );
    }
  }

  return (
    <div className="invoices-page">
      <div className="page-header">
        <BrandLogo />
        <h1>Fatture</h1>
        <button type="button" className="btn btn--primary" onClick={openCreateModal}>
          Nuova fattura
        </button>
      </div>

      <div className="invoices-page__filters">
        <label className="entity-form__field">
          Cliente
          <select
            value={clientFilter}
            onChange={(event) =>
              setClientFilter(event.target.value === "" ? "" : Number(event.target.value))
            }
          >
            <option value="">Tutti i clienti</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </label>
        <label className="entity-form__field">
          Stato
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as InvoiceStatus | "")}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {notice && <p className="invoices-page__notice">{notice}</p>}
      {loading && invoices.length === 0 && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}

      {!error && !(loading && invoices.length === 0) && invoices.length === 0 && (
        <Card>
          <EmptyState
            title="Nessuna fattura ancora"
            description="Le fatture create appariranno qui."
            actionLabel="Crea fattura"
            onAction={openCreateModal}
          />
        </Card>
      )}

      {!error && !(loading && invoices.length === 0) && invoices.length > 0 && (
        <Card className="ui-card--flush">
          <InvoiceList invoices={invoices} />
        </Card>
      )}

      <Modal isOpen={isModalOpen} onClose={closeModal} title="Nuova fattura">
        <InvoiceForm onSubmit={handleGenerate} onCancel={closeModal} error={formError} />
      </Modal>
    </div>
  );
}
