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

  const runReport = useCallback(async (filters: ReportFilterParams) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get<ReportSummary>("/v1/reports/summary/", {
        params: filters,
      });
      setData(data);
    } catch (err) {
      setError(extractErrorMessage(err, "Impossibile caricare il report."));
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, runReport };
}
