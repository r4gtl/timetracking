import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { extractErrorMessage } from "../api/errors";
import type { InvoiceStatus } from "../api/types";
import { BrandLogo } from "../components/common/BrandLogo";
import "../components/common/common.css";
import { ErrorMessage } from "../components/common/ErrorMessage";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { Modal } from "../components/common/Modal";
import { AddManualLineForm } from "../components/invoices/AddManualLineForm";
import { InvoiceLinesTable } from "../components/invoices/InvoiceLinesTable";
import { InvoiceStatusBadge } from "../components/invoices/InvoiceStatusBadge";
import "../components/invoices/invoices.css";
import { Card } from "../components/ui/Card";
import type { AddManualLineInput } from "../hooks/useInvoiceDetail";
import { useInvoiceDetail } from "../hooks/useInvoiceDetail";

const STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: "Bozza",
  sent: "Inviata",
  paid: "Pagata",
};

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

export function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const invoiceId = Number(id);
  const { invoice, loading, error, notFound, addManualLine, updateStatus, downloadPdf } =
    useInvoiceDetail(invoiceId);

  const [isLineModalOpen, setIsLineModalOpen] = useState(false);
  const [lineError, setLineError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  function openLineModal() {
    setLineError(null);
    setIsLineModalOpen(true);
  }

  function closeLineModal() {
    setIsLineModalOpen(false);
    setLineError(null);
  }

  async function handleAddLine(values: AddManualLineInput) {
    try {
      await addManualLine(values);
      closeLineModal();
    } catch (err) {
      setLineError(
        extractErrorMessage(err, "Non è stato possibile aggiungere la riga. Riprova tra qualche istante."),
      );
    }
  }

  async function handleStatusChange(status: InvoiceStatus) {
    setActionError(null);
    try {
      await updateStatus(status);
    } catch (err) {
      setActionError(
        extractErrorMessage(err, "Non è stato possibile aggiornare lo stato. Riprova tra qualche istante."),
      );
    }
  }

  async function handleDownload() {
    setActionError(null);
    try {
      await downloadPdf();
    } catch (err) {
      setActionError(
        extractErrorMessage(err, "Non è stato possibile scaricare il PDF. Riprova tra qualche istante."),
      );
    }
  }

  if (notFound) {
    return (
      <div className="invoice-detail-page">
        <div className="page-header">
          <h1>Fattura</h1>
          <button type="button" className="btn btn--secondary" onClick={() => navigate("/invoices")}>
            Torna alle fatture
          </button>
        </div>
        <ErrorMessage message="Fattura non trovata." />
      </div>
    );
  }

  return (
    <div className="invoice-detail-page">
      <div className="page-header">
        <BrandLogo />
        <h1>{invoice ? `Fattura ${invoice.number}` : "Fattura"}</h1>
        <button type="button" className="btn btn--secondary" onClick={() => navigate("/invoices")}>
          Torna alle fatture
        </button>
      </div>

      {actionError && <ErrorMessage message={actionError} />}
      {loading && !invoice && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}

      {invoice && (
        <>
          <div className="invoice-detail-page__header">
            <p>
              <strong>Cliente:</strong> {invoice.client_name}
            </p>
            <p>
              <strong>Data emissione:</strong> {formatDate(invoice.issue_date)}
            </p>
            {invoice.due_date && (
              <p>
                <strong>Scadenza:</strong> {formatDate(invoice.due_date)}
              </p>
            )}
            <p>
              <strong>Stato:</strong> <InvoiceStatusBadge status={invoice.status} />
            </p>
            {invoice.notes && (
              <p>
                <strong>Note:</strong> {invoice.notes}
              </p>
            )}
          </div>

          <label className="entity-form__field invoice-detail-page__status-field">
            Cambia stato
            <select
              value={invoice.status}
              onChange={(event) => handleStatusChange(event.target.value as InvoiceStatus)}
            >
              {(Object.keys(STATUS_LABELS) as InvoiceStatus[]).map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </label>

          <Card className="ui-card--flush">
            <InvoiceLinesTable lines={invoice.lines} />
          </Card>

          <div className="invoice-detail-page__actions">
            <button type="button" className="btn btn--secondary" onClick={openLineModal}>
              Aggiungi riga manuale
            </button>
            <button type="button" className="btn btn--primary" onClick={handleDownload}>
              Scarica PDF
            </button>
          </div>

          <Modal isOpen={isLineModalOpen} onClose={closeLineModal} title="Aggiungi riga manuale">
            <AddManualLineForm onSubmit={handleAddLine} onCancel={closeLineModal} error={lineError} />
          </Modal>
        </>
      )}
    </div>
  );
}
