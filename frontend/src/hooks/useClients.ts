import { useCallback, useEffect, useState } from "react";
import { extractErrorMessage } from "../api/errors";
import { apiClient } from "../api/client";
import type { Client } from "../api/types";

export interface ClientInput {
  name: string;
  email: string;
  currency: string;
  address: string;
  notes: string;
}

interface UseClientsOptions {
  /** undefined = nessun filtro (tutti i clienti), altrimenti filtra per stato archiviato */
  showArchived?: boolean;
}

export function useClients(options: UseClientsOptions = {}) {
  const { showArchived } = options;
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get<Client[]>("/v1/clients/", {
        params: showArchived === undefined ? undefined : { is_archived: showArchived },
      });
      setClients(data);
    } catch (err) {
      setError(
        extractErrorMessage(err, "Non è stato possibile caricare i clienti. Riprova tra qualche istante."),
      );
    } finally {
      setLoading(false);
    }
  }, [showArchived]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const createClient = useCallback(
    async (data: ClientInput) => {
      await apiClient.post("/v1/clients/", data);
      await refetch();
    },
    [refetch],
  );

  const updateClient = useCallback(
    async (id: number, data: Partial<ClientInput>) => {
      await apiClient.patch(`/v1/clients/${id}/`, data);
      await refetch();
    },
    [refetch],
  );

  const archiveClient = useCallback(
    async (id: number) => {
      await apiClient.post(`/v1/clients/${id}/archive/`);
      await refetch();
    },
    [refetch],
  );

  const unarchiveClient = useCallback(
    async (id: number) => {
      await apiClient.post(`/v1/clients/${id}/unarchive/`);
      await refetch();
    },
    [refetch],
  );

  return {
    clients,
    loading,
    error,
    refetch,
    createClient,
    updateClient,
    archiveClient,
    unarchiveClient,
  };
}
