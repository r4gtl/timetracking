import { useEffect, useMemo, useState } from "react";
import { extractErrorMessage } from "../../api/errors";
import type { Project, TimeEntry } from "../../api/types";
import { formatElapsed } from "./timeUtils";
import "./ActiveTimer.css";

interface ActiveTimerProps {
  activeEntry: TimeEntry | null;
  projects: Project[];
  onStart: (projectId: number, taskId: number | null, description: string) => Promise<void>;
  onStop: (entryId: number) => Promise<void>;
}

export function ActiveTimer({ activeEntry, projects, onStart, onStop }: ActiveTimerProps) {
  if (activeEntry) {
    return <RunningTimer entry={activeEntry} projects={projects} onStop={onStop} />;
  }
  return <StartTimerForm projects={projects} onStart={onStart} />;
}

interface RunningTimerProps {
  entry: TimeEntry;
  projects: Project[];
  onStop: (entryId: number) => Promise<void>;
}

function RunningTimer({ entry, projects, onStop }: RunningTimerProps) {
  const [elapsed, setElapsed] = useState(() => formatElapsed(entry.start_time));
  const [isStopping, setIsStopping] = useState(false);

  useEffect(() => {
    setElapsed(formatElapsed(entry.start_time));
    const interval = setInterval(() => {
      setElapsed(formatElapsed(entry.start_time));
    }, 1000);
    return () => clearInterval(interval);
  }, [entry.start_time]);

  const project = projects.find((item) => item.id === entry.project);
  const task = project?.tasks.find((item) => item.id === entry.task);

  async function handleStop() {
    setIsStopping(true);
    try {
      await onStop(entry.id);
    } finally {
      setIsStopping(false);
    }
  }

  return (
    <div className="active-timer active-timer--running">
      <div className="active-timer__info">
        <span className="active-timer__project">
          {project?.name ?? `Progetto #${entry.project}`}
        </span>
        {task && <span className="active-timer__task">{task.name}</span>}
        {entry.description && (
          <span className="active-timer__description">{entry.description}</span>
        )}
      </div>
      <div className="active-timer__clock">{elapsed}</div>
      <button
        type="button"
        className="btn btn--danger"
        onClick={handleStop}
        disabled={isStopping}
      >
        {isStopping ? "Fermando…" : "Ferma"}
      </button>
    </div>
  );
}

interface StartTimerFormProps {
  projects: Project[];
  onStart: (projectId: number, taskId: number | null, description: string) => Promise<void>;
}

function StartTimerForm({ projects, onStart }: StartTimerFormProps) {
  const activeProjects = useMemo(() => projects.filter((item) => !item.is_archived), [projects]);
  const [projectId, setProjectId] = useState<number | "">("");
  const [taskId, setTaskId] = useState<number | "">("");
  const [description, setDescription] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedProject = activeProjects.find((item) => item.id === projectId);
  const availableTasks = selectedProject?.tasks.filter((item) => !item.is_archived) ?? [];

  function handleProjectChange(value: string) {
    setProjectId(value === "" ? "" : Number(value));
    setTaskId("");
  }

  async function handleStart() {
    if (projectId === "") return;
    setError(null);
    setIsStarting(true);
    try {
      await onStart(projectId, taskId === "" ? null : taskId, description);
      setDescription("");
      setTaskId("");
    } catch (err) {
      setError(extractErrorMessage(err, "Impossibile avviare il timer."));
    } finally {
      setIsStarting(false);
    }
  }

  return (
    <div className="active-timer active-timer--idle">
      {error && <p className="entity-form__error">{error}</p>}
      <select value={projectId} onChange={(event) => handleProjectChange(event.target.value)}>
        <option value="">Seleziona un progetto</option>
        {activeProjects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.name} ({project.client_name})
          </option>
        ))}
      </select>
      <select
        value={taskId}
        onChange={(event) =>
          setTaskId(event.target.value === "" ? "" : Number(event.target.value))
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
      <input
        type="text"
        placeholder="Descrizione (opzionale)"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
      />
      <button
        type="button"
        className="btn btn--primary"
        onClick={handleStart}
        disabled={projectId === "" || isStarting}
      >
        {isStarting ? "Avvio…" : "Avvia"}
      </button>
    </div>
  );
}
