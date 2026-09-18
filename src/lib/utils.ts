import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * cn() — the shadcn utility for merging Tailwind classes.
 *
 * Combines clsx (conditional class names) with tailwind-merge (deduplicates
 * conflicting Tailwind utilities). This is the single utility required by
 * the shadcn CLI (PRD §4.3).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
