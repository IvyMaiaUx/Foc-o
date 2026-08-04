// Helpers de data/hora compartilhados pelos crons de lembrete (WhatsApp e e-mail).
// Duplica de propósito a lógica pura já existente em api/run-whatsapp-reminders.js —
// evita mexer num cron que já está em produção só pra eliminar a repetição.
const TIME_ZONE = 'America/Sao_Paulo';

export function saoPauloDateParts(value = Date.now()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date(value));

  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
}

export function todayKey(value = Date.now()) {
  const parts = saoPauloDateParts(value);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function currentMinutes(value = Date.now()) {
  const parts = saoPauloDateParts(value);
  return Number(parts.hour) * 60 + Number(parts.minute);
}

export function timeToMinutes(time, fallback = '09:00') {
  const [hour, minute] = String(time || fallback).split(':').map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return timeToMinutes(fallback);
  return hour * 60 + minute;
}

export function isDueTime(configTime, nowMinutes) {
  return nowMinutes >= timeToMinutes(configTime);
}

export function dateKeyToNoonMs(dateKey) {
  return new Date(`${dateKey}T12:00:00-03:00`).getTime();
}

export function diffDaysFromToday(dateKey, today) {
  if (!dateKey) return null;
  return Math.round((dateKeyToNoonMs(dateKey) - dateKeyToNoonMs(today)) / 86400000);
}

export function isMonday(dateKey) {
  return new Date(`${dateKey}T12:00:00-03:00`).getDay() === 1;
}
