import "./FieldError.css";

interface FieldErrorProps {
  /** Testo specifico che spiega cosa correggere (mai un messaggio generico). */
  message: string;
  icon?: boolean;
}

export function FieldError({ message, icon = true }: FieldErrorProps) {
  return (
    <p className="field-error">
      {icon && (
        <svg
          className="field-error__icon"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <circle cx="8" cy="8" r="6.25" />
          <path d="M8 5.25v3.25" />
          <circle cx="8" cy="10.9" r="0.35" fill="currentColor" stroke="none" />
        </svg>
      )}
      <span>{message}</span>
    </p>
  );
}
