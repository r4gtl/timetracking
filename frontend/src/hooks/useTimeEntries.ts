import { useCallback, useEffect, useMemo, useState } from "react";
import { extractErrorMessage } from "../api/errors";
import { apiClient } from "../api/client";
import type { TimeEntry } from "../api/types";

export interface TimeEntryInput {
  project: number;
  task: number | null;
  description: string;
  start_time: string;
  end_time: string;
  is_billable: boolean;
}

interface UseTimeEntriesOptions {
  /** numero massimo di entry esposte in timeEntries (il backend non pagina) */
  limit?: number;
}

export function useTimeEntries(options: UseTimeEntriesOptions = {}) {
  const { limit = 50 } = options;
  const [allEntries, setAllEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Il backend non ha paginazione configurata (vedi api/types.ts) ed
      // è già ordinato -start_time di default: un'unica GET restituisce
      // quindi TUTTE le time entry, non solo "le prime N". Non esiste un
      // filtro server-side su end_time null, ma non serve nemmeno una
      // query dedicata di fallback: possiamo cercare l'entry attiva
      // (end_time === null) nell'intero risultato con affidabilità totale.
      const { data } = await apiClient.get<TimeEntry[]>("/v1/time-entries/");
      setAllEntries(data);
    } catch (err) {
      setError(
        extractErrorMessage(err, "Non è stato possibile caricare le time entry. Riprova tra qualche istante."),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const timeEntries = useMemo(() => allEntries.slice(0, limit), [allEntries, limit]);

  const activeEntry = useMemo(
    () => allEntries.find((entry) => entry.end_time === null) ?? null,
    [allEntries],
  );

  const startTimer = useCallback(
    async (projectId: number, taskId: number | null, description: string) => {
      await apiClient.post("/v1/time-entries/start/", {
        project: projectId,
        task: taskId,
        description,
      });
      await refetch();
    },
    [refetch],
  );

  const stopTimer = useCallback(
    async (entryId: number) => {
      await apiClient.post(`/v1/time-entries/${entryId}/stop/`);
      await refetch();
    },
    [refetch],
  );

  const createManualEntry = useCallback(
    async (data: TimeEntryInput) => {
      await apiClient.post("/v1/time-entries/", data);
      await refetch();
    },
    [refetch],
  );

  const updateEntry = useCallback(
    async (id: number, data: Partial<TimeEntryInput>) => {
      await apiClient.patch(`/v1/time-entries/${id}/`, data);
      await refetch();
    },
    [refetch],
  );

  const deleteEntry = useCallback(
    async (id: number) => {
      await apiClient.delete(`/v1/time-entries/${id}/`);
      await refetch();
    },
    [refetch],
  );

  return {
    timeEntries,
    activeEntry,
    loading,
    error,
    refetch,
    startTimer,
    stopTimer,
    createManualEntry,
    updateEntry,
    deleteEntry,
  };
}
