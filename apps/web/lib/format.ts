/**
 * Formata uma data ISO string para o formato PT-PT (ex: "30 de junho de 2026, 14:30").
 * @param value - Data em formato ISO string
 * @param options - Opções de formatação
 */
export function formatDateTime(
  value: string,
  options?: { dateStyle?: "medium" | "short" },
): string {
  return new Intl.DateTimeFormat("pt-PT", {
    dateStyle: options?.dateStyle ?? "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

/**
 * Formata uma data ISO string ou retorna "Nao informado" se for null.
 * @param value - Data em formato ISO string ou null
 */
export function formatNullableDateTime(value: string | null): string {
  return value === null ? "Nao informado" : formatDateTime(value);
}

/**
 * Cria um valor de datetime-local para input HTML a partir de um Date.
 * Ajusta o timezone offset para que o valor mostrado no input corresponda à hora local.
 * @param date - Date object
 */
export function createDatetimeLocalValue(date: Date): string {
  const timezoneOffsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - timezoneOffsetMs).toISOString().slice(0, 16);
}

/**
 * Adiciona horas a uma data.
 * @param date - Date base
 * @param hours - Número de horas a adicionar
 */
export function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}
