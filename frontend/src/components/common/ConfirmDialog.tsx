import { Modal } from "./Modal";
import "./ConfirmDialog.css";

interface ConfirmDialogProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ message, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <Modal isOpen onClose={onCancel} title="Conferma">
      <p className="confirm-dialog__message">{message}</p>
      <div className="confirm-dialog__actions">
        <button type="button" className="btn btn--secondary" onClick={onCancel}>
          Annulla
        </button>
        <button type="button" className="btn btn--danger" onClick={onConfirm}>
          Conferma
        </button>
      </div>
    </Modal>
  );
}
