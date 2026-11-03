/** Rules shared by the forms (browser) and the API routes (server), so both say the same thing. */

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 30;
export const NAME_MAX = 50;
export const USERNAME_PATTERN = /^[A-Za-z0-9_.-]+$/;

/** Returns the problem in plain words, or null when the username is fine. */
export function validateUsername(value: string): string | null {
  const v = value.trim();
  if (!v) return "Username is required";
  if (v.length < USERNAME_MIN) return `Username must be at least ${USERNAME_MIN} characters`;
  if (v.length > USERNAME_MAX) return `Username must be at most ${USERNAME_MAX} characters`;
  if (!USERNAME_PATTERN.test(v)) return "Username can only use letters, numbers, dots, dashes and underscores";
  return null;
}

export function validateName(value: string): string | null {
  return value.trim().length > NAME_MAX ? `Names must be at most ${NAME_MAX} characters` : null;
}

export function splitFullName(full: string): { firstName: string; lastName: string } {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  return { firstName: parts[0] ?? "", lastName: parts.slice(1).join(" ") };
}

/** A redirect target taken from a URL must stay on this site. */
export function safeNext(next: string | null | undefined): string {
  if (typeof next !== "string" || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return "/";
  return next;
}
