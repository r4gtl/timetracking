import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { apiClient } from "../api/client";
import { extractErrorMessage } from "../api/errors";
import type { Invoice, InvoiceStatus } from "../api/types";

export interface AddManualLineInput {
  description: string;
  quantity_hours: number;
  unit_rate: number;
}

export function useInvoiceDetail(id: number) {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNotFound(false);
    try {
      const { data } = await apiClient.get<Invoice>(`/v1/invoices/${id}/`);
      setInvoice(data);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        setNotFound(true);
      } else {
        setError(
          extractErrorMessage(err, "Non è stato possibile caricare la fattura. Riprova tra qualche istante."),
        );
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const addManualLine = useCallback(
    async (data: AddManualLineInput) => {
      await apiClient.post(`/v1/invoices/${id}/add_manual_line/`, data);
      await refetch();
    },
    [id, refetch],
  );

  const updateStatus = useCallback(
    async (status: InvoiceStatus) => {
      await apiClient.patch(`/v1/invoices/${id}/`, { status });
      await refetch();
    },
    [id, refetch],
  );

  const downloadPdf = useCallback(async () => {
    const response = await apiClient.get<Blob>(`/v1/invoices/${id}/pdf/`, {
      responseType: "blob",
    });
    const number = invoice?.number ?? id;
    const url = window.URL.createObjectURL(response.data);
    const link = document.createElement("a");
    link.href = url;
    link.download = `fattura_${number}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }, [id, invoice]);

  return { invoice, loading, error, notFound, refetch, addManualLine, updateStatus, downloadPdf };
}
