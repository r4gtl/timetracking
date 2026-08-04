import { useNavigate } from "react-router-dom";
import type { Invoice } from "../../api/types";
import { InvoiceStatusBadge } from "./InvoiceStatusBadge";

interface InvoiceListProps {
  invoices: Invoice[];
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

export function InvoiceList({ invoices }: InvoiceListProps) {
  const navigate = useNavigate();

  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Numero</th>
          <th>Cliente</th>
          <th>Data emissione</th>
          <th>Stato</th>
          <th>Totale</th>
          <th>Azioni</th>
        </tr>
      </thead>
      <tbody>
        {invoices.map((invoice) => (
          <tr key={invoice.id}>
            <td>{invoice.number}</td>
            <td>{invoice.client_name}</td>
            <td>{formatDate(invoice.issue_date)}</td>
            <td>
              <InvoiceStatusBadge status={invoice.status} />
            </td>
            <td>€ {invoice.total_amount.toFixed(2)}</td>
            <td className="actions-cell">
              <button
                type="button"
                className="btn btn--small"
                onClick={() => navigate(`/invoices/${invoice.id}`)}
              >
                Apri
              </button>
            </td>
          </tr>
        ))}
        {invoices.length === 0 && (
          <tr>
            <td colSpan={6} className="empty-row">
              Nessuna fattura trovata.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
