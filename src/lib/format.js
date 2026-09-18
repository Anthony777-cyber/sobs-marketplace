// Explicit Day/Month/Year timestamp formatting.
// Never shows a raw countdown; always renders a calendar date string.
export function formatExpiryDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const day = d.getDate();
  const month = d.toLocaleString('en-GB', { month: 'long' });
  const year = d.getFullYear();
  return `Expires on: ${day} ${month} ${year}`;
}

// UK alphanumeric word syntax: "11 January 2027".
export function formatUkDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getDate()} ${d.toLocaleString('en-GB', { month: 'long' })} ${d.getFullYear()}`;
}