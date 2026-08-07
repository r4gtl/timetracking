import { useCallback, useState } from "react";
import { apiClient } from "../api/client";
import { extractErrorMessage } from "../api/errors";
import type { ReportSummary } from "../api/types";

export interface ReportFilterParams {
  client?: number;
  project?: number;
  start_after?: string;
  start_before?: string;
  is_billable?: boolean;
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function formatDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Intervallo di default: dal primo giorno del mese corrente a oggi. */
export function getCurrentMonthRange(): { start_after: string; start_before: string } {
  const now = new Date();
  return {
    start_after: formatDate(new Date(now.getFullYear(), now.getMonth(), 1)),
    start_before: formatDate(now),
  };
}

export function useReportSummary() {
  const [data, setData] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFilters, setLastFilters] = useState<ReportFilterParams>({});

  const runReport = useCallback(async (filters: ReportFilterParams) => {
    setLastFilters(filters);
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get<ReportSummary>("/v1/reports/summary/", {
        params: filters,
      });
      setData(data);
    } catch (err) {
      setError(
        extractErrorMessage(err, "Non è stato possibile caricare il report. Riprova tra qualche istante."),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const downloadPdf = useCallback(async () => {
    const response = await apiClient.get<Blob>("/v1/reports/summary/pdf/", {
      params: lastFilters,
      responseType: "blob",
    });
    const { start_after, start_before } = lastFilters;
    const filename =
      start_after && start_before ? `riepilogo_${start_after}_${start_before}.pdf` : "riepilogo.pdf";
    const url = window.URL.createObjectURL(response.data);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }, [lastFilters]);

  return { data, loading, error, runReport, downloadPdf };
}
