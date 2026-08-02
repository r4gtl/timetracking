import axios from "axios";

/**
 * DRF restituisce errori di validazione come { campo: ["messaggio", ...] }
 * oppure { detail: "messaggio" }. Prova a produrre un testo leggibile,
 * altrimenti ricade sul messaggio di fallback fornito dal chiamante.
 */
export function extractErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data: unknown = error.response?.data;
    if (data && typeof data === "object") {
      const parts: string[] = [];
      for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
        const text = Array.isArray(value) ? value.join(" ") : String(value);
        parts.push(key === "detail" || key === "non_field_errors" ? text : `${key}: ${text}`);
      }
      if (parts.length > 0) return parts.join(" — ");
    }
  }
  return fallback;
}
