import { useCallback, useEffect, useState } from "react";
import { extractErrorMessage } from "../api/errors";
import { apiClient } from "../api/client";
import type { Project } from "../api/types";

export interface ProjectInput {
  client: number;
  name: string;
  color: string;
  is_billable: boolean;
  default_hourly_rate: string | null;
  budget_hours: string | null;
}

interface UseProjectsOptions {
  clientId?: number;
  /** undefined = nessun filtro (tutti i progetti), altrimenti filtra per stato archiviato */
  showArchived?: boolean;
}

export function useProjects(options: UseProjectsOptions = {}) {
  const { clientId, showArchived } = options;
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get<Project[]>("/v1/projects/", {
        params: {
          ...(showArchived === undefined ? {} : { is_archived: showArchived }),
          ...(clientId === undefined ? {} : { client: clientId }),
        },
      });
      setProjects(data);
    } catch (err) {
      setError(
        extractErrorMessage(err, "Non è stato possibile caricare i progetti. Riprova tra qualche istante."),
      );
    } finally {
      setLoading(false);
    }
  }, [clientId, showArchived]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const createProject = useCallback(
    async (data: ProjectInput) => {
      await apiClient.post("/v1/projects/", data);
      await refetch();
    },
    [refetch],
  );

  const updateProject = useCallback(
    async (id: number, data: Partial<ProjectInput>) => {
      await apiClient.patch(`/v1/projects/${id}/`, data);
      await refetch();
    },
    [refetch],
  );

  const archiveProject = useCallback(
    async (id: number) => {
      await apiClient.post(`/v1/projects/${id}/archive/`);
      await refetch();
    },
    [refetch],
  );

  const unarchiveProject = useCallback(
    async (id: number) => {
      await apiClient.post(`/v1/projects/${id}/unarchive/`);
      await refetch();
    },
    [refetch],
  );

  return {
    projects,
    loading,
    error,
    refetch,
    createProject,
    updateProject,
    archiveProject,
    unarchiveProject,
  };
}
