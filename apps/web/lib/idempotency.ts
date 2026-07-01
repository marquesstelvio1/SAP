/**
 * Cria uma chave de idempotência única para operações RPC.
 * Usa crypto.randomUUID() quando disponível, ou Math.random() como fallback.
 * @param prefix - Prefixo que identifica a operação (ex: "cargo_reg", "admin_role_create")
 */
export function createIdempotencyKey(prefix: string): string {
  const randomValue =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  return `${prefix}_${randomValue}`;
}
