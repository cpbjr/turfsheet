import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Compare DB ids that may arrive as either a string or a number.
 * Postgres SERIAL columns come back as numbers while several of our types
 * declare them as strings, so a bare === silently fails.
 */
export function sameId(
  a: string | number | null | undefined,
  b: string | number | null | undefined
): boolean {
  if (a == null || b == null) return false
  return String(a) === String(b)
}
