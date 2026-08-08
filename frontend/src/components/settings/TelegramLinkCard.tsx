import type { TelegramLink } from "../../api/types";
import { ErrorMessage } from "../common/ErrorMessage";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import "./TelegramLinkCard.css";

interface TelegramLinkCardProps {
  link: TelegramLink | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function TelegramLinkCard({ link, loading, error, refetch }: TelegramLinkCardProps) {
  return (
    <Card className="telegram-link-card">
      <h2 className="telegram-link-card__title">Telegram</h2>

      {loading && <p>Caricamento...</p>}
      {error && <ErrorMessage message={error} />}

      {!loading && !error && link && (
        <>
          {link.is_active ? (
            <p className="telegram-link-card__badge telegram-link-card__badge--active">
              ✅ Telegram collegato
            </p>
          ) : (
            <div className="telegram-link-card__connect">
              <p className="telegram-link-card__description">
                Collega il tuo account Telegram per avviare/fermare il timer e vedere il
                riepilogo giornaliero direttamente in chat.
              </p>
              <div className="telegram-link-card__actions">
                <a
                  href={link.deep_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn--primary"
                >
                  Apri Telegram
                </a>
                <Button variant="secondary" small onClick={refetch}>
                  Ho collegato, verifica
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  );
}
