import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { extractErrorMessage } from "../api/errors";
import "../components/common/common.css";
import { ErrorMessage } from "../components/common/ErrorMessage";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import "../components/reports/reports.css";
import { SummaryCards } from "../components/reports/SummaryCards";
import { ActiveTimer } from "../components/tracker/ActiveTimer";
import { formatDurationShort } from "../components/tracker/timeUtils";
import { useInvoices } from "../hooks/useInvoices";
import { useProjects } from "../hooks/useProjects";
import { getCurrentMonthRange, useReportSummary } from "../hooks/useReportSummary";
import { useTimeEntries } from "../hooks/useTimeEntries";
import "./DashboardPage.css";

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function DashboardPage() {
  const { projects } = useProjects();
  const {
    timeEntries,
    activeEntry,
    loading: entriesLoading,
    error: entriesError,
    startTimer,
    stopTimer,
  } = useTimeEntries();
  const {
    data: reportData,
    loading: reportLoading,
    error: reportError,
    runReport,
  } = useReportSummary();
  const { invoices, loading: invoicesLoading, error: invoicesError } = useInvoices();

  const [stopError, setStopError] = useState<string | null>(null);

  useEffect(() => {
    runReport(getCurrentMonthRange());
  }, [runReport]);

  async function handleStop(entryId: number) {
    setStopError(null);
    try {
      await stopTimer(entryId);
    } catch (err) {
      setStopError(extractErrorMessage(err, "Impossibile fermare il timer."));
    }
  }

  const timeEntriesLoaded = !(entriesLoading && timeEntries.length === 0 && !activeEntry);
  const recentEntries = timeEntries.filter((entry) => entry.end_time !== null).slice(0, 5);
  const pendingInvoices = invoices.filter((invoice) => invoice.status !== "paid");

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1>Dashboard</h1>
      </div>

      <section className="dashboard-section">
        <h2 className="dashboard-section__title">Timer attivo</h2>
        {stopError && <ErrorMessage message={stopError} />}
        {entriesError && <ErrorMessage message={entriesError} />}
        {timeEntriesLoaded ? (
          <ActiveTimer
            activeEntry={activeEntry}
            projects={projects}
            onStart={startTimer}
            onStop={handleStop}
          />
        ) : (
          <LoadingSpinner />
        )}
      </section>

      <div className="dashboard-grid">
        <section className="dashboard-section">
          <div className="dashboard-section__header">
            <h2 className="dashboard-section__title">Riepilogo mese corrente</h2>
            <Link to="/reports">Vai al report completo</Link>
          </div>
          {reportLoading && <LoadingSpinner />}
          {reportError && <ErrorMessage message={reportError} />}
          {!reportLoading && !reportError && reportData && (
            <SummaryCards totals={reportData.totals} />
          )}
        </section>

        <section className="dashboard-section">
          <div className="dashboard-section__header">
            <h2 className="dashboard-section__title">Fatture in sospeso</h2>
            <Link to="/invoices">Vai a tutte le fatture</Link>
          </div>
          {invoicesLoading && <LoadingSpinner />}
          {invoicesError && <ErrorMessage message={invoicesError} />}
          {!invoicesLoading && !invoicesError && (
            <>
              <p className="dashboard-section__summary">
                {pendingInvoices.length > 0
                  ? `Hai ${pendingInvoices.length} fatture non ancora saldate`
                  : "Nessuna fattura in sospeso"}
              </p>
              {pendingInvoices.length > 0 && (
                <ul className="dashboard-invoice-list">
                  {pendingInvoices.slice(0, 5).map((invoice) => (
                    <li key={invoice.id}>
                      <Link to={`/invoices/${invoice.id}`}>
                        {invoice.number} — {invoice.client_name} — €{" "}
                        {invoice.total_amount.toFixed(2)}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </section>
      </div>

      <section className="dashboard-section">
        <div className="dashboard-section__header">
          <h2 className="dashboard-section__title">Ultime registrazioni</h2>
          <Link to="/tracker">Vai al tracker completo</Link>
        </div>
        {!timeEntriesLoaded && <LoadingSpinner />}
        {entriesError && <ErrorMessage message={entriesError} />}
        {timeEntriesLoaded && !entriesError && (
          <table className="data-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Progetto</th>
                <th>Descrizione</th>
                <th>Durata</th>
              </tr>
            </thead>
            <tbody>
              {recentEntries.map((entry) => {
                const project = projects.find((item) => item.id === entry.project);
                return (
                  <tr key={entry.id}>
                    <td>{formatDateTime(entry.start_time)}</td>
                    <td>{project?.name ?? `#${entry.project}`}</td>
                    <td>{entry.description || "—"}</td>
                    <td>{formatDurationShort(entry.duration_seconds)}</td>
                  </tr>
                );
              })}
              {recentEntries.length === 0 && (
                <tr>
                  <td colSpan={4} className="empty-row">
                    Nessuna registrazione recente.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
