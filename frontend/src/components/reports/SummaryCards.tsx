import type { ReportTotals } from "../../api/types";
import "./reports.css";

interface SummaryCardsProps {
  totals: ReportTotals;
}

export function SummaryCards({ totals }: SummaryCardsProps) {
  return (
    <div className="summary-cards">
      <div className="summary-cards__card">
        <span className="summary-cards__label">Ore totali</span>
        <span className="summary-cards__value">{totals.total_hours.toFixed(2)}</span>
      </div>
      <div className="summary-cards__card">
        <span className="summary-cards__label">Importo totale stimato</span>
        <span className="summary-cards__value">€ {totals.total_amount.toFixed(2)}</span>
      </div>
      <div className="summary-cards__card">
        <span className="summary-cards__label">Numero registrazioni</span>
        <span className="summary-cards__value">{totals.entries_count}</span>
      </div>
    </div>
  );
}
