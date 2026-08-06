import { useEffect } from "react";
import { BrandLogo } from "../components/common/BrandLogo";
import "../components/common/common.css";
import { ErrorMessage } from "../components/common/ErrorMessage";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { BreakdownTable } from "../components/reports/BreakdownTable";
import { EntriesDetail } from "../components/reports/EntriesDetail";
import { ReportFilters } from "../components/reports/ReportFilters";
import "../components/reports/reports.css";
import { SummaryCards } from "../components/reports/SummaryCards";
import { getCurrentMonthRange, useReportSummary } from "../hooks/useReportSummary";

export function ReportsPage() {
  const { data, loading, error, runReport } = useReportSummary();

  useEffect(() => {
    runReport(getCurrentMonthRange());
  }, [runReport]);

  return (
    <div className="reports-page">
      <div className="page-header">
        <BrandLogo />
        <h1>Report</h1>
      </div>

      <ReportFilters onApply={runReport} />

      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}

      {!loading && !error && data === null && (
        <p className="reports-page__empty">Applica dei filtri per generare un report.</p>
      )}

      {!loading && !error && data !== null && (
        <>
          <SummaryCards totals={data.totals} />

          <div className="report-breakdown">
            <BreakdownTable
              labelHeader="Cliente"
              rows={data.by_client.map((row) => ({
                label: row.client_name,
                total_hours: row.total_hours,
                total_amount: row.total_amount,
              }))}
            />
            <BreakdownTable
              labelHeader="Progetto"
              rows={data.by_project.map((row) => ({
                label: row.project_name,
                total_hours: row.total_hours,
                total_amount: row.total_amount,
              }))}
            />
          </div>

          <EntriesDetail entries={data.entries} />
        </>
      )}
    </div>
  );
}
