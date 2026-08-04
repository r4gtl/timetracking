import "./reports.css";

export interface BreakdownRow {
  label: string;
  total_hours: number;
  total_amount: number;
}

interface BreakdownTableProps {
  labelHeader: string;
  rows: BreakdownRow[];
}

export function BreakdownTable({ labelHeader, rows }: BreakdownTableProps) {
  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>{labelHeader}</th>
          <th>Ore</th>
          <th>Importo</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={`${row.label}-${index}`}>
            <td>{row.label}</td>
            <td>{row.total_hours.toFixed(2)}</td>
            <td>€ {row.total_amount.toFixed(2)}</td>
          </tr>
        ))}
        {rows.length === 0 && (
          <tr>
            <td colSpan={3} className="empty-row">
              Nessun dato disponibile.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
