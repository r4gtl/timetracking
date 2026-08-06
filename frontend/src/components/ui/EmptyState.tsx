import type { ReactNode } from "react";
import { Button } from "./Button";
import "./EmptyState.css";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

function DefaultIcon() {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="20" cy="20" r="15" />
      <path d="M13 20h14" />
    </svg>
  );
}

export function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon">{icon ?? <DefaultIcon />}</div>
      <p className="empty-state__title">{title}</p>
      <p className="empty-state__description">{description}</p>
      {actionLabel && onAction && (
        <Button variant="secondary" onClick={onAction} className="empty-state__action">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
