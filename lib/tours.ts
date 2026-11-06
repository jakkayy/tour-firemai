// Today in Thailand (YYYY-MM-DD), the timezone the departure dates are published in.
export function todayBangkok(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date());
}

// PostgREST `or` filter: keep tours that haven't departed yet.
// Tours with no departure date are kept — some sources don't publish one.
export function notDepartedFilter(): string {
  return `departure_date.is.null,departure_date.gte.${todayBangkok()}`;
}
