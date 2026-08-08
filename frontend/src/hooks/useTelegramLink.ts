import { useCallback, useEffect, useState } from "react";
import { extractErrorMessage } from "../api/errors";
import { apiClient } from "../api/client";
import type { TelegramLink } from "../api/types";

export function useTelegramLink() {
  const [link, setLink] = useState<TelegramLink | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get<TelegramLink>("/v1/telegram/link/");
      setLink(data);
    } catch (err) {
      setError(
        extractErrorMessage(
          err,
          "Non è stato possibile caricare lo stato del collegamento Telegram. Riprova tra qualche istante.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { link, loading, error, refetch };
}
