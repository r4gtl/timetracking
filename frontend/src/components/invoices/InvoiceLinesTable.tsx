import type { InvoiceLine } from "../../api/types";
import "./invoices.css";

interface InvoiceLinesTableProps {
  lines: InvoiceLine[];
}

export function InvoiceLinesTable({ lines }: InvoiceLinesTableProps) {
  const total = lines.reduce((sum, line) => sum + line.amount, 0);

  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Descrizione</th>
          <th>Ore</th>
          <th>Tariffa unitaria</th>
          <th>Importo</th>
        </tr>
      </thead>
      <tbody>
        {lines.map((line) => (
          <tr key={line.id}>
            <td>{line.description}</td>
            <td>{Number(line.quantity_hours).toFixed(2)}</td>
            <td>€ {Number(line.unit_rate).toFixed(2)}</td>
            <td>€ {line.amount.toFixed(2)}</td>
          </tr>
        ))}
        {lines.length === 0 && (
          <tr>
            <td colSpan={4} className="empty-row">
              Nessuna riga in fattura.
            </td>
          </tr>
        )}
        <tr className="invoice-lines-table__total">
          <td colSpan={3}>Totale</td>
          <td>€ {total.toFixed(2)}</td>
        </tr>
      </tbody>
    </table>
  );
}
