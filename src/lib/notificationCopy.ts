import { sanitizeText } from './textSanitizer';

const WORD_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bAlmoco\b/g, 'Almoço'],
  [/\balmoco\b/g, 'almoço'],
  [/\bPorcao\b/g, 'Porção'],
  [/\bporcao\b/g, 'porção'],
  [/\bCafe\b/g, 'Café'],
  [/\bcafe\b/g, 'café'],
  [/\bHorario\b/g, 'Horário'],
  [/\bhorario\b/g, 'horário'],
  [/\bRelatorio\b/g, 'Relatório'],
  [/\brelatorio\b/g, 'relatório'],
  [/\bNotificacao\b/g, 'Notificação'],
  [/\bnotificacao\b/g, 'notificação'],
  [/\bVoce\b/g, 'Você'],
  [/\bvoce\b/g, 'você'],
  [/\bEsta\b/g, 'Está'],
  [/\besta\b/g, 'está'],
  [/\bCao\b/g, 'Cão'],
  [/\bcao\b/g, 'cão'],
  [/\bCaes\b/g, 'Cães'],
  [/\bcaes\b/g, 'cães'],
];

export function polishNotificationText(text?: string) {
  if (!text) return '';

  return WORD_REPLACEMENTS.reduce(
    (current, [pattern, replacement]) => current.replace(pattern, replacement),
    sanitizeText(text)
  );
}
