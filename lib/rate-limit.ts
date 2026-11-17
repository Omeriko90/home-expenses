// In-memory sliding-window rate limiter. Per-process only — fine for a
// single-instance deployment; swap for a shared store if the app is scaled out.

const windows = new Map<string, number[]>();

export function isRateLimited(
  key: string,
  maxAttempts: number,
  windowMs: number,
): boolean {
  const now = Date.now();
  const cutoff = now - windowMs;
  const attempts = (windows.get(key) ?? []).filter((ts) => ts > cutoff);
  windows.set(key, attempts);
  return attempts.length >= maxAttempts;
}

export function recordAttempt(key: string): void {
  const attempts = windows.get(key) ?? [];
  attempts.push(Date.now());
  windows.set(key, attempts);
}

export function clearAttempts(key: string): void {
  windows.delete(key);
}
