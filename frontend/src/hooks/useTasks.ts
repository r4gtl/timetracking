import { useCallback } from "react";
import { apiClient } from "../api/client";
import type { Task } from "../api/types";

export interface TaskInput {
  name: string;
  hourly_rate: string | null;
  is_billable: boolean | null;
}

/**
 * I task sono già annidati nella risposta di GET /api/v1/projects/{id}/,
 * quindi questo hook espone solo le operazioni di scrittura: dopo ogni
 * chiamata il componente chiamante deve rifare il refetch dei progetti.
 */
export function useTasks(projectId: number) {
  const createTask = useCallback(
    async (data: TaskInput) => {
      await apiClient.post<Task>("/v1/tasks/", { project: projectId, ...data });
    },
    [projectId],
  );

  const updateTask = useCallback(async (taskId: number, data: Partial<TaskInput>) => {
    await apiClient.patch<Task>(`/v1/tasks/${taskId}/`, data);
  }, []);

  const archiveTask = useCallback(async (taskId: number) => {
    await apiClient.post(`/v1/tasks/${taskId}/archive/`);
  }, []);

  const unarchiveTask = useCallback(async (taskId: number) => {
    await apiClient.post(`/v1/tasks/${taskId}/unarchive/`);
  }, []);

  return { createTask, updateTask, archiveTask, unarchiveTask };
}
