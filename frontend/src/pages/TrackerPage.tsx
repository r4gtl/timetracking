import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { extractErrorMessage } from "../api/errors";
import type { TimeEntry } from "../api/types";
import "../components/common/common.css";
import { ErrorMessage } from "../components/common/ErrorMessage";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { Modal } from "../components/common/Modal";
import { ActiveTimer } from "../components/tracker/ActiveTimer";
import { TimeEntryForm } from "../components/tracker/TimeEntryForm";
import { TimeEntryList } from "../components/tracker/TimeEntryList";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { useProjects } from "../hooks/useProjects";
import { useTimeEntries } from "../hooks/useTimeEntries";
import type { TimeEntryInput } from "../hooks/useTimeEntries";
import "./TrackerPage.css";

export function TrackerPage() {
  const navigate = useNavigate();
  const { projects } = useProjects();
  const {
    timeEntries,
    activeEntry,
    loading,
    error,
    startTimer,
    stopTimer,
    createManualEntry,
    updateEntry,
  } = useTimeEntries();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  function openCreateModal() {
    setEditingEntry(null);
    setFormError(null);
    setIsModalOpen(true);
  }

  function openEditModal(entry: TimeEntry) {
    setEditingEntry(entry);
    setFormError(null);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingEntry(null);
    setFormError(null);
  }

  async function handleSubmit(values: TimeEntryInput) {
    try {
      if (editingEntry) {
        await updateEntry(editingEntry.id, values);
      } else {
        await createManualEntry(values);
      }
      closeModal();
    } catch (err) {
      setFormError(
        extractErrorMessage(err, "Non è stato possibile salvare la time entry. Riprova tra qualche istante."),
      );
    }
  }

  async function handleStop(entryId: number) {
    setActionError(null);
    try {
      await stopTimer(entryId);
    } catch (err) {
      setActionError(
        extractErrorMessage(err, "Non è stato possibile fermare il timer. Riprova tra qualche istante."),
      );
    }
  }

  const hasLoadedOnce = !(loading && timeEntries.length === 0 && !activeEntry);
  const hasSelectableProject = projects.some((project) => !project.is_archived);

  return (
    <div className="tracker-page">
      <div className="page-header">
        <h1>Tracker</h1>
        <button type="button" className="btn btn--primary" onClick={openCreateModal}>
          Aggiungi manualmente
        </button>
      </div>

      {actionError && <ErrorMessage message={actionError} />}
      {loading && timeEntries.length === 0 && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}

      {hasLoadedOnce && !activeEntry && !hasSelectableProject && (
        <Card>
          <EmptyState
            title="Configura almeno un progetto"
            description="Per avviare un timer serve un cliente con almeno un progetto e un task associato."
            actionLabel="Vai a Clienti"
            onAction={() => navigate("/clients")}
          />
        </Card>
      )}

      {hasLoadedOnce && (activeEntry || hasSelectableProject) && (
        <ActiveTimer
          activeEntry={activeEntry}
          projects={projects}
          onStart={startTimer}
          onStop={handleStop}
        />
      )}

      {!error && hasLoadedOnce && (
        <TimeEntryList entries={timeEntries} projects={projects} onEdit={openEditModal} />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingEntry ? "Modifica time entry" : "Nuova time entry"}
      >
        <TimeEntryForm
          initialValues={editingEntry ?? undefined}
          projects={projects}
          onSubmit={handleSubmit}
          onCancel={closeModal}
          error={formError}
        />
      </Modal>
    </div>
  );
}
