function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/** Secondi trascorsi da startTime (ISO) a ora. */
export function elapsedSeconds(startTimeIso: string): number {
  const elapsedMs = Date.now() - new Date(startTimeIso).getTime();
  return Math.max(0, Math.floor(elapsedMs / 1000));
}

/** Tempo trascorso da startTime (ISO) a ora, formattato HH:MM:SS. */
export function formatElapsed(startTimeIso: string): string {
  const totalSeconds = elapsedSeconds(startTimeIso);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/** Durata in secondi formattata in forma compatta "Xh Ym". */
export function formatDurationShort(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

/**
 * Converte un ISO string (UTC) nel formato "YYYY-MM-DDTHH:mm" richiesto da
 * <input type="datetime-local">, espresso nel fuso orario locale del browser.
 */
export function toDatetimeLocalValue(iso: string): string {
  const date = new Date(iso);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

/**
 * Converte il valore locale di un <input type="datetime-local"> in un ISO
 * string UTC accettato dal backend (il Date constructor interpreta una
 * stringa senza suffisso di fuso come orario locale).
 */
export function fromDatetimeLocalValue(value: string): string {
  return new Date(value).toISOString();
}
