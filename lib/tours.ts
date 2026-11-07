// Today in Thailand (YYYY-MM-DD), the timezone the departure dates are published in.
export function todayBangkok(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date());
}

// PostgREST `or` filter: keep tours that haven't departed yet.
// Tours with no departure date are kept — some sources don't publish one.
export function notDepartedFilter(): string {
  return `departure_date.is.null,departure_date.gte.${todayBangkok()}`;
}

// The date `days` days after `date` (both YYYY-MM-DD).
export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// The `within` filter ("leaving within N days") from the URL, or null when absent or not a sane number.
export function parseWithin(value: string | undefined): number | null {
  if (!value || !/^\d{1,3}$/.test(value)) return null;
  const days = Number(value);
  return days >= 1 && days <= 120 ? days : null;
}

