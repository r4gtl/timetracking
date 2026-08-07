import { useEffect, useState } from "react";
import { extractErrorMessage } from "../api/errors";
import { BrandLogo } from "../components/common/BrandLogo";
import "../components/common/common.css";
import { ErrorMessage } from "../components/common/ErrorMessage";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { BreakdownTable } from "../components/reports/BreakdownTable";
import { EntriesDetail } from "../components/reports/EntriesDetail";
import { ReportFilters } from "../components/reports/ReportFilters";
import "../components/reports/reports.css";
import { SummaryCards } from "../components/reports/SummaryCards";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { getCurrentMonthRange, useReportSummary } from "../hooks/useReportSummary";

export function ReportsPage() {
  const { data, loading, error, runReport, downloadPdf } = useReportSummary();
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    runReport(getCurrentMonthRange());
  }, [runReport]);

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

  return (
    <div className="reports-page">
      <div className="page-header">
        <BrandLogo />
        <h1>Report</h1>
        {data !== null && data.totals.entries_count > 0 && (
          <Button variant="secondary" onClick={handleDownload}>
            Scarica PDF
          </Button>
        )}
      </div>

      <ReportFilters onApply={runReport} />

      {actionError && <ErrorMessage message={actionError} />}
      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}

      {!loading && !error && data === null && (
        <p className="reports-page__empty">Applica dei filtri per generare un report.</p>
      )}

      {!loading && !error && data !== null && data.totals.entries_count === 0 && (
        <Card>
          <EmptyState
            title="Nessuna registrazione in questo periodo"
            description="Prova ad allargare l'intervallo di date o rimuovere qualche filtro."
          />
        </Card>
      )}

      {!loading && !error && data !== null && data.totals.entries_count > 0 && (
        <>
          <SummaryCards totals={data.totals} />

          <div className="report-breakdown">
            <Card className="ui-card--flush">
              <BreakdownTable
                labelHeader="Cliente"
                rows={data.by_client.map((row) => ({
                  label: row.client_name,
                  total_hours: row.total_hours,
                  total_amount: row.total_amount,
                }))}
              />
            </Card>
            <Card className="ui-card--flush">
              <BreakdownTable
                labelHeader="Progetto"
                rows={data.by_project.map((row) => ({
                  label: row.project_name,
                  total_hours: row.total_hours,
                  total_amount: row.total_amount,
                }))}
              />
            </Card>
          </div>

          <Card>
            <EntriesDetail entries={data.entries} />
          </Card>
        </>
      )}
    </div>
  );
}
