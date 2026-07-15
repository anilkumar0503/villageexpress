/**
 * Returns the canonical app base URL, always with https:// prefix.
 * Priority: NEXT_PUBLIC_APP_URL (if valid) → hardcoded production URL
 */
export function getAppUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL ?? ''
  if (raw.startsWith('https://') || raw.startsWith('http://')) return raw.replace(/\/$/, '')
  return 'https://www.villageexpress.in'
}
