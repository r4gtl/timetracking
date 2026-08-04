import type { TimeEntry } from "../../api/types";
import { formatDurationShort } from "../tracker/timeUtils";
import "./reports.css";

interface EntriesDetailProps {
  entries: TimeEntry[];
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function EntriesDetail({ entries }: EntriesDetailProps) {
  return (
    <details className="entries-detail">
      <summary>Dettaglio registrazioni ({entries.length})</summary>
      <table className="data-table">
        <thead>
          <tr>
            <th>Data</th>
            <th>Progetto</th>
            <th>Descrizione</th>
            <th>Durata</th>
            <th>Fatturabile</th>
            <th>Importo</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id}>
              <td>{formatDateTime(entry.start_time)}</td>
              <td>#{entry.project}</td>
              <td>{entry.description || "—"}</td>
              <td>{formatDurationShort(entry.duration_seconds)}</td>
              <td>{entry.is_billable ? "Sì" : "No"}</td>
              <td>{entry.estimated_amount ?? "—"}</td>
            </tr>
          ))}
          {entries.length === 0 && (
            <tr>
              <td colSpan={6} className="empty-row">
                Nessuna registrazione.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </details>
  );
}
