import { useState } from "react";
import { extractErrorMessage } from "../api/errors";
import type { Client } from "../api/types";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import "../components/common/common.css";
import { ErrorMessage } from "../components/common/ErrorMessage";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { Modal } from "../components/common/Modal";
import { ClientForm } from "../components/clients/ClientForm";
import { useClients } from "../hooks/useClients";
import type { ClientInput } from "../hooks/useClients";

export function ClientsPage() {
  const [showArchived, setShowArchived] = useState(false);
  const {
    clients,
    loading,
    error,
    createClient,
    updateClient,
    archiveClient,
    unarchiveClient,
  } = useClients({ showArchived });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [archivingClient, setArchivingClient] = useState<Client | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  function openCreateModal() {
    setEditingClient(null);
    setFormError(null);
    setIsModalOpen(true);
  }

  function openEditModal(client: Client) {
    setEditingClient(client);
    setFormError(null);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingClient(null);
    setFormError(null);
  }

  async function handleSubmit(values: ClientInput) {
    try {
      if (editingClient) {
        await updateClient(editingClient.id, values);
      } else {
        await createClient(values);
      }
      closeModal();
    } catch (err) {
      setFormError(extractErrorMessage(err, "Impossibile salvare il cliente."));
    }
  }

  async function handleArchiveConfirmed() {
    if (!archivingClient) return;
    setActionError(null);
    try {
      await archiveClient(archivingClient.id);
    } catch (err) {
      setActionError(extractErrorMessage(err, "Impossibile archiviare il cliente."));
    } finally {
      setArchivingClient(null);
    }
  }

  async function handleUnarchive(client: Client) {
    setActionError(null);
    try {
      await unarchiveClient(client.id);
    } catch (err) {
      setActionError(extractErrorMessage(err, "Impossibile riattivare il cliente."));
    }
  }

  return (
    <div className="clients-page">
      <div className="page-header">
        <h1>Clienti</h1>
        <button type="button" className="btn btn--primary" onClick={openCreateModal}>
          Nuovo cliente
        </button>
      </div>

      <label className="filter-toggle">
        <input
          type="checkbox"
          checked={showArchived}
          onChange={(event) => setShowArchived(event.target.checked)}
        />
        Mostra archiviati
      </label>

      {actionError && <ErrorMessage message={actionError} />}
      {loading && clients.length === 0 && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}

      {!error && !(loading && clients.length === 0) && (
        <table className="data-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Email</th>
              <th>Valuta</th>
              <th>Stato</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.id}>
                <td>{client.name}</td>
                <td>{client.email}</td>
                <td>{client.currency}</td>
                <td>{client.is_archived ? "Archiviato" : "Attivo"}</td>
                <td className="actions-cell">
                  <button
                    type="button"
                    className="btn btn--small"
                    onClick={() => openEditModal(client)}
                  >
                    Modifica
                  </button>
                  {client.is_archived ? (
                    <button
                      type="button"
                      className="btn btn--small"
                      onClick={() => handleUnarchive(client)}
                    >
                      Riattiva
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn--small btn--danger"
                      onClick={() => setArchivingClient(client)}
                    >
                      Archivia
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {clients.length === 0 && (
              <tr>
                <td colSpan={5} className="empty-row">
                  Nessun cliente trovato.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingClient ? "Modifica cliente" : "Nuovo cliente"}
      >
        <ClientForm
          initialValues={editingClient ?? undefined}
          onSubmit={handleSubmit}
          onCancel={closeModal}
          error={formError}
        />
      </Modal>

      {archivingClient && (
        <ConfirmDialog
          message={`Vuoi archiviare il cliente "${archivingClient.name}"?`}
          onConfirm={handleArchiveConfirmed}
          onCancel={() => setArchivingClient(null)}
        />
      )}
    </div>
  );
}
