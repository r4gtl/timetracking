import "../components/common/common.css";
import { TelegramLinkCard } from "../components/settings/TelegramLinkCard";
import { useTelegramLink } from "../hooks/useTelegramLink";

export function SettingsPage() {
  const { link, loading, error, refetch } = useTelegramLink();

  return (
    <div className="settings-page">
      <div className="page-header">
        <h1>Impostazioni</h1>
      </div>

      <TelegramLinkCard link={link} loading={loading} error={error} refetch={refetch} />
    </div>
  );
}
