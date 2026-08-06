import { useState } from "react";
import { extractErrorMessage } from "../api/errors";
import type { Project } from "../api/types";
import "../components/common/common.css";
import { ErrorMessage } from "../components/common/ErrorMessage";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { Modal } from "../components/common/Modal";
import { ProjectForm } from "../components/projects/ProjectForm";
import { ProjectListItem } from "../components/projects/ProjectListItem";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { useClients } from "../hooks/useClients";
import { useProjects } from "../hooks/useProjects";
import type { ProjectInput } from "../hooks/useProjects";
import "./ProjectsPage.css";

export function ProjectsPage() {
  const [showArchived, setShowArchived] = useState(false);
  const [clientFilter, setClientFilter] = useState<number | "">("");
  const { clients } = useClients();
  const {
    projects,
    loading,
    error,
    refetch,
    createProject,
    updateProject,
    archiveProject,
    unarchiveProject,
  } = useProjects({
    showArchived,
    clientId: clientFilter === "" ? undefined : clientFilter,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  function openCreateModal() {
    setEditingProject(null);
    setFormError(null);
    setIsModalOpen(true);
  }

  function openEditModal(project: Project) {
    setEditingProject(project);
    setFormError(null);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingProject(null);
    setFormError(null);
  }

  async function handleSubmit(values: ProjectInput) {
    try {
      if (editingProject) {
        await updateProject(editingProject.id, values);
      } else {
        await createProject(values);
      }
      closeModal();
    } catch (err) {
      setFormError(
        extractErrorMessage(err, "Non è stato possibile salvare il progetto. Riprova tra qualche istante."),
      );
    }
  }

  async function handleArchive(project: Project) {
    setActionError(null);
    try {
      await archiveProject(project.id);
    } catch (err) {
      setActionError(
        extractErrorMessage(err, "Non è stato possibile archiviare il progetto. Riprova tra qualche istante."),
      );
    }
  }

  async function handleUnarchive(project: Project) {
    setActionError(null);
    try {
      await unarchiveProject(project.id);
    } catch (err) {
      setActionError(
        extractErrorMessage(err, "Non è stato possibile riattivare il progetto. Riprova tra qualche istante."),
      );
    }
  }

  return (
    <div className="projects-page">
      <div className="page-header">
        <h1>Progetti</h1>
        <button type="button" className="btn btn--primary" onClick={openCreateModal}>
          Nuovo progetto
        </button>
      </div>

      <div className="projects-page__filters">
        <select
          value={clientFilter}
          onChange={(event) =>
            setClientFilter(event.target.value === "" ? "" : Number(event.target.value))
          }
        >
          <option value="">Tutti i clienti</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
        <label className="filter-toggle">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(event) => setShowArchived(event.target.checked)}
          />
          Mostra archiviati
        </label>
      </div>

      {actionError && <ErrorMessage message={actionError} />}
      {loading && projects.length === 0 && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}

      {!error && !(loading && projects.length === 0) && projects.length === 0 && (
        <Card>
          <EmptyState
            title={clientFilter === "" ? "Nessun progetto ancora" : "Nessun progetto per questo cliente"}
            description="Crea un progetto per iniziare a registrare le ore."
            actionLabel="Aggiungi progetto"
            onAction={openCreateModal}
          />
        </Card>
      )}

      {!error && !(loading && projects.length === 0) && projects.length > 0 && (
        <ul className="project-list">
          {projects.map((project) => (
            <ProjectListItem
              key={project.id}
              project={project}
              onEdit={openEditModal}
              onArchive={() => handleArchive(project)}
              onUnarchive={() => handleUnarchive(project)}
              onTasksChanged={refetch}
            />
          ))}
        </ul>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingProject ? "Modifica progetto" : "Nuovo progetto"}
      >
        <ProjectForm
          initialValues={editingProject ?? undefined}
          onSubmit={handleSubmit}
          onCancel={closeModal}
          error={formError}
        />
      </Modal>
    </div>
  );
}
