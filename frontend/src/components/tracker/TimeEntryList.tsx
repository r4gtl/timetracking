import { useState } from "react";
import type { Project, TimeEntry } from "../../api/types";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { formatDurationShort } from "./timeUtils";

interface TimeEntryListProps {
  entries: TimeEntry[];
  projects: Project[];
  onEdit: (entry: TimeEntry) => void;
  onDelete: (entry: TimeEntry) => void;
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

export function TimeEntryList({ entries, projects, onEdit, onDelete }: TimeEntryListProps) {
  // La entry attiva (end_time null) è già mostrata da ActiveTimer.
  const completedEntries = entries.filter((entry) => entry.end_time !== null);
  const [deletingEntry, setDeletingEntry] = useState<TimeEntry | null>(null);

  function handleDeleteConfirmed() {
    if (!deletingEntry) return;
    onDelete(deletingEntry);
    setDeletingEntry(null);
  }

  return (
    <>
      <table className="data-table">
        <thead>
          <tr>
            <th>Data</th>
            <th>Progetto</th>
            <th>Task</th>
            <th>Descrizione</th>
            <th className="num">Durata</th>
            <th className="num">Tariffa</th>
            <th className="num">Importo</th>
            <th>Fatturabile</th>
            <th>Fatturata</th>
            <th>Azioni</th>
          </tr>
        </thead>
        <tbody>
          {completedEntries.map((entry) => {
            const project = projects.find((item) => item.id === entry.project);
            const task = project?.tasks.find((item) => item.id === entry.task);
            return (
              <tr key={entry.id}>
                <td>{formatDateTime(entry.start_time)}</td>
                <td>{project?.name ?? `#${entry.project}`}</td>
                <td>{task?.name ?? "—"}</td>
                <td>{entry.description || "—"}</td>
                <td className="num">{formatDurationShort(entry.duration_seconds)}</td>
                <td className="num">{entry.resolved_hourly_rate ?? "—"}</td>
                <td className="num">{entry.estimated_amount ?? "—"}</td>
                <td>{entry.is_billable ? "Sì" : "No"}</td>
                <td>{entry.is_invoiced ? "Sì" : "No"}</td>
                <td className="actions-cell">
                  <button type="button" className="btn btn--small" onClick={() => onEdit(entry)}>
                    Modifica
                  </button>
                  <button
                    type="button"
                    className="btn btn--small btn--danger"
                    onClick={() => setDeletingEntry(entry)}
                  >
                    Elimina
                  </button>
                </td>
              </tr>
            );
          })}
          {completedEntries.length === 0 && (
            <tr>
              <td colSpan={10} className="empty-row">
                Nessuna time entry registrata.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {deletingEntry && (
        <ConfirmDialog
          message={`Eliminare la registrazione del ${formatDateTime(deletingEntry.start_time)} (${formatDurationShort(deletingEntry.duration_seconds)})? L'azione non è reversibile.`}
          onConfirm={handleDeleteConfirmed}
          onCancel={() => setDeletingEntry(null)}
        />
      )}
    </>
  );
}
