import { useState } from "react";
import type { FormEvent } from "react";
import type { Project, TimeEntry } from "../../api/types";
import type { TimeEntryInput } from "../../hooks/useTimeEntries";
import { fromDatetimeLocalValue, toDatetimeLocalValue } from "./timeUtils";

interface TimeEntryFormProps {
  initialValues?: TimeEntry;
  projects: Project[];
  onSubmit: (values: TimeEntryInput) => Promise<void>;
  onCancel: () => void;
  error: string | null;
}

interface FormValues {
  project: number | "";
  task: number | "";
  description: string;
  startLocal: string;
  endLocal: string;
  is_billable: boolean;
}

function buildInitialValues(entry?: TimeEntry): FormValues {
  if (!entry) {
    return {
      project: "",
      task: "",
      description: "",
      startLocal: "",
      endLocal: "",
      is_billable: true,
    };
  }
  return {
    project: entry.project,
    task: entry.task ?? "",
    description: entry.description,
    startLocal: toDatetimeLocalValue(entry.start_time),
    endLocal: entry.end_time ? toDatetimeLocalValue(entry.end_time) : "",
    is_billable: entry.is_billable,
  };
}

export function TimeEntryForm({
  initialValues,
  projects,
  onSubmit,
  onCancel,
  error,
}: TimeEntryFormProps) {
  const [values, setValues] = useState<FormValues>(buildInitialValues(initialValues));
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeProjects = projects.filter(
    (project) => !project.is_archived || project.id === values.project,
  );
  const selectedProject = projects.find((project) => project.id === values.project);
  const availableTasks =
    selectedProject?.tasks.filter((task) => !task.is_archived || task.id === values.task) ?? [];

  function handleProjectChange(value: string) {
    setValues({ ...values, project: value === "" ? "" : Number(value), task: "" });
  }

  const estimatedHours =
    values.startLocal && values.endLocal
      ? (new Date(values.endLocal).getTime() - new Date(values.startLocal).getTime()) / 3600000
      : null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationError(null);

    if (values.project === "") {
      setValidationError("Seleziona un progetto.");
      return;
    }
    if (!values.startLocal || !values.endLocal) {
      setValidationError("Inserisci data/ora di inizio e fine.");
      return;
    }
    if (new Date(values.endLocal).getTime() <= new Date(values.startLocal).getTime()) {
      setValidationError("La data/ora di fine deve essere successiva a quella di inizio.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        project: values.project,
        task: values.task === "" ? null : values.task,
        description: values.description,
        start_time: fromDatetimeLocalValue(values.startLocal),
        end_time: fromDatetimeLocalValue(values.endLocal),
        is_billable: values.is_billable,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const displayedError = validationError ?? error;

  return (
    <form className="entity-form" onSubmit={handleSubmit}>
      {displayedError && <p className="entity-form__error">{displayedError}</p>}
      <label className="entity-form__field">
        Progetto
        <select
          value={values.project}
          onChange={(event) => handleProjectChange(event.target.value)}
          required
        >
          <option value="" disabled>
            Seleziona un progetto
          </option>
          {activeProjects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name} ({project.client_name})
            </option>
          ))}
        </select>
      </label>
      <label className="entity-form__field">
        Task
        <select
          value={values.task}
          onChange={(event) =>
            setValues({
              ...values,
              task: event.target.value === "" ? "" : Number(event.target.value),
            })
          }
          disabled={!selectedProject}
        >
          <option value="">Nessun task</option>
          {availableTasks.map((task) => (
            <option key={task.id} value={task.id}>
              {task.name}
            </option>
          ))}
        </select>
      </label>
      <label className="entity-form__field">
        Descrizione
        <input
          type="text"
          value={values.description}
          onChange={(event) => setValues({ ...values, description: event.target.value })}
        />
      </label>
      <label className="entity-form__field">
        Inizio
        <input
          type="datetime-local"
          value={values.startLocal}
          onChange={(event) => setValues({ ...values, startLocal: event.target.value })}
          required
        />
      </label>
      <label className="entity-form__field">
        Fine
        <input
          type="datetime-local"
          value={values.endLocal}
          onChange={(event) => setValues({ ...values, endLocal: event.target.value })}
          required
        />
      </label>
      {estimatedHours !== null && estimatedHours > 0 && (
        <p className="time-entry-form__estimate">circa {estimatedHours.toFixed(2)} ore</p>
      )}
      <label className="entity-form__field entity-form__field--checkbox">
        <input
          type="checkbox"
          checked={values.is_billable}
          onChange={(event) => setValues({ ...values, is_billable: event.target.checked })}
        />
        Fatturabile
      </label>
      <div className="entity-form__actions">
        <button type="button" className="btn btn--secondary" onClick={onCancel}>
          Annulla
        </button>
        <button type="submit" className="btn btn--primary" disabled={isSubmitting}>
          {isSubmitting ? "Salvataggio…" : "Salva"}
        </button>
      </div>
    </form>
  );
}
