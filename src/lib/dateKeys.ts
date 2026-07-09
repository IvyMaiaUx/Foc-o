export function toLocalDateKey(value: Date | number = new Date()): string {
  const date = value instanceof Date ? value : new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parseia uma chave 'YYYY-MM-DD' como data LOCAL (meia-noite local).
 * Evita o bug clássico do `new Date("2026-08-01")`, que é interpretado como
 * UTC e, em BRT (UTC-3), "volta" para o dia anterior às 21h.
 */
export function parseLocalDateKey(key: string): Date {
  const [y, m, d] = String(key).split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}
