/*
::neup.documentation::core-helper-date
::title Date Helper

Shared helpers for presenting dates and times in a readable format.

::public

Use `formatReadableDateTime()` to render persisted timestamps for UI display.

::public end

::end
*/

function normalizeDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

export function formatReadableDateTime(value: Date | string | null | undefined): string {
  const date = normalizeDate(value);
  if (!date) {
    return '—';
  }

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}
