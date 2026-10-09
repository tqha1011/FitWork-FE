export function formatJobDate(value: string): string {
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? date.toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Date unavailable";
}
export function formatJobAmount(amount: number, currency?: string): string {
  return `${amount.toLocaleString()}${currency ? ` ${currency}` : ""}`;
}
