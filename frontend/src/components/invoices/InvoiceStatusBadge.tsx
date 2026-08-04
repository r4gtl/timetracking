import type { InvoiceStatus } from "../../api/types";
import "./invoices.css";

const LABELS: Record<InvoiceStatus, string> = {
  draft: "Bozza",
  sent: "Inviata",
  paid: "Pagata",
};

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus;
}

export function InvoiceStatusBadge({ status }: InvoiceStatusBadgeProps) {
  return (
    <span className={`invoice-status-badge invoice-status-badge--${status}`}>
      {LABELS[status]}
    </span>
  );
}
