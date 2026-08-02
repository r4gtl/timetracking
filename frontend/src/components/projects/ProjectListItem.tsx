import { useState } from "react";
import type { Project, Task } from "../../api/types";
import { extractErrorMessage } from "../../api/errors";
import { useTasks } from "../../hooks/useTasks";
import type { TaskInput } from "../../hooks/useTasks";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { Modal } from "../common/Modal";
import { TaskForm } from "./TaskForm";

interface ProjectListItemProps {
  project: Project;
  onEdit: (project: Project) => void;
  onArchive: () => Promise<void>;
  onUnarchive: () => Promise<void>;
  onTasksChanged: () => void;
}

export function ProjectListItem({
  project,
  onEdit,
  onArchive,
  onUnarchive,
  onTasksChanged,
}: ProjectListItemProps) {
  const [expanded, setExpanded] = useState(false);
  const [confirmingArchive, setConfirmingArchive] = useState(false);
  const { createTask, updateTask, archiveTask, unarchiveTask } = useTasks(project.id);

  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskFormError, setTaskFormError] = useState<string | null>(null);
  const [archivingTask, setArchivingTask] = useState<Task | null>(null);
  const [taskActionError, setTaskActionError] = useState<string | null>(null);

  function openCreateTaskModal() {
    setEditingTask(null);
    setTaskFormError(null);
    setTaskModalOpen(true);
  }

  function openEditTaskModal(task: Task) {
    setEditingTask(task);
    setTaskFormError(null);
    setTaskModalOpen(true);
  }

  function closeTaskModal() {
    setTaskModalOpen(false);
    setEditingTask(null);
    setTaskFormError(null);
  }

  async function handleTaskSubmit(values: TaskInput) {
    try {
      if (editingTask) {
        await updateTask(editingTask.id, values);
      } else {
        await createTask(values);
      }
      closeTaskModal();
      onTasksChanged();
    } catch (err) {
      setTaskFormError(extractErrorMessage(err, "Impossibile salvare il task."));
    }
  }

  async function handleArchiveTaskConfirmed() {
    if (!archivingTask) return;
    try {
      await archiveTask(archivingTask.id);
      onTasksChanged();
    } catch (err) {
      setTaskActionError(extractErrorMessage(err, "Impossibile archiviare il task."));
    } finally {
      setArchivingTask(null);
    }
  }

  async function handleUnarchiveTask(task: Task) {
    setTaskActionError(null);
    try {
      await unarchiveTask(task.id);
      onTasksChanged();
    } catch (err) {
      setTaskActionError(extractErrorMessage(err, "Impossibile riattivare il task."));
    }
  }

  async function handleArchiveConfirmed() {
    setConfirmingArchive(false);
    await onArchive();
  }

  return (
    <li className="project-item">
      <div className="project-item__row">
        <button
          type="button"
          className="project-item__toggle"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
        >
          <span className="project-item__color-dot" style={{ backgroundColor: project.color }} />
          <span className="project-item__name">{project.name}</span>
          <span className="project-item__client">{project.client_name}</span>
        </button>
        <span className="project-item__meta">
          {project.default_hourly_rate ? `${project.default_hourly_rate} / h` : "—"}
        </span>
        <span className="project-item__meta">
          {project.budget_hours ? `${project.budget_hours} h budget` : "—"}
        </span>
        <span className="project-item__badge">
          {project.is_billable ? "Fatturabile" : "Non fatturabile"}
        </span>
        <span className="project-item__badge">
          {project.is_archived ? "Archiviato" : "Attivo"}
        </span>
        <div className="project-item__actions">
          <button type="button" className="btn btn--small" onClick={() => onEdit(project)}>
            Modifica
          </button>
          {project.is_archived ? (
            <button type="button" className="btn btn--small" onClick={onUnarchive}>
              Riattiva
            </button>
          ) : (
            <button
              type="button"
              className="btn btn--small btn--danger"
              onClick={() => setConfirmingArchive(true)}
            >
              Archivia
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <div className="project-item__tasks">
          <div className="project-item__tasks-header">
            <h3>Task</h3>
            <button type="button" className="btn btn--small" onClick={openCreateTaskModal}>
              Nuovo task
            </button>
          </div>

          {taskActionError && <p className="entity-form__error">{taskActionError}</p>}

          {project.tasks.length === 0 ? (
            <p className="empty-row">Nessun task per questo progetto.</p>
          ) : (
            <table className="data-table data-table--nested">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Tariffa effettiva</th>
                  <th>Fatturabile (effettivo)</th>
                  <th>Stato</th>
                  <th>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {project.tasks.map((task) => (
                  <tr key={task.id}>
                    <td>{task.name}</td>
                    <td>
                      {task.effective_hourly_rate ?? "—"}
                      {task.hourly_rate ? " (specifica)" : " (ereditata)"}
                    </td>
                    <td>
                      {task.effective_is_billable ? "Sì" : "No"}
                      {task.is_billable === null ? " (ereditato)" : " (specifico)"}
                    </td>
                    <td>{task.is_archived ? "Archiviato" : "Attivo"}</td>
                    <td className="actions-cell">
                      <button
                        type="button"
                        className="btn btn--small"
                        onClick={() => openEditTaskModal(task)}
                      >
                        Modifica
                      </button>
                      {task.is_archived ? (
                        <button
                          type="button"
                          className="btn btn--small"
                          onClick={() => handleUnarchiveTask(task)}
                        >
                          Riattiva
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn btn--small btn--danger"
                          onClick={() => setArchivingTask(task)}
                        >
                          Archivia
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <Modal
        isOpen={taskModalOpen}
        onClose={closeTaskModal}
        title={editingTask ? "Modifica task" : "Nuovo task"}
      >
        <TaskForm
          initialValues={editingTask ?? undefined}
          onSubmit={handleTaskSubmit}
          onCancel={closeTaskModal}
          error={taskFormError}
        />
      </Modal>

      {archivingTask && (
        <ConfirmDialog
          message={`Vuoi archiviare il task "${archivingTask.name}"?`}
          onConfirm={handleArchiveTaskConfirmed}
          onCancel={() => setArchivingTask(null)}
        />
      )}

      {confirmingArchive && (
        <ConfirmDialog
          message={`Vuoi archiviare il progetto "${project.name}"?`}
          onConfirm={handleArchiveConfirmed}
          onCancel={() => setConfirmingArchive(false)}
        />
      )}
    </li>
  );
}
