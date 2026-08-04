import { useCallback, useEffect, useState } from "react";
import { apiClient } from "../api/client";
import { extractErrorMessage } from "../api/errors";
import type { Invoice, InvoiceStatus } from "../api/types";

export interface GenerateInvoiceInput {
  client: number;
  number: string;
  issue_date: string;
  due_date?: string;
  period_start: string;
  period_end: string;
  notes?: string;
}

export interface GenerateInvoiceResult extends Invoice {
  skipped_entries_count: number;
}

interface UseInvoicesOptions {
  client?: number;
  status?: InvoiceStatus;
}

export function useInvoices(options: UseInvoicesOptions = {}) {
  const { client, status } = options;
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get<Invoice[]>("/v1/invoices/", {
        params: {
          ...(client === undefined ? {} : { client }),
          ...(status === undefined ? {} : { status }),
        },
      });
      setInvoices(data);
    } catch (err) {
      setError(extractErrorMessage(err, "Impossibile caricare le fatture."));
    } finally {
      setLoading(false);
    }
  }, [client, status]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const generateInvoice = useCallback(
    async (data: GenerateInvoiceInput) => {
      const { data: invoice } = await apiClient.post<GenerateInvoiceResult>(
        "/v1/invoices/generate/",
        data,
      );
      await refetch();
      return invoice;
    },
    [refetch],
  );

  const updateInvoiceStatus = useCallback(
    async (id: number, status: InvoiceStatus) => {
      await apiClient.patch(`/v1/invoices/${id}/`, { status });
      await refetch();
    },
    [refetch],
  );

  return { invoices, loading, error, refetch, generateInvoice, updateInvoiceStatus };
}
