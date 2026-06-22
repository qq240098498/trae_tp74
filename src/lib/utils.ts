import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatHours(n: number | null | undefined): string {
  if (n == null) return "-"
  const rounded = Math.round(Number(n) * 10) / 10
  if (rounded <= 0) return "0"
  return rounded.toFixed(1).replace(/\.0$/, "")
}

export function formatShortage(n: number | null | undefined): string {
  if (n == null) return "0"
  const rounded = Math.round(Number(n) * 10) / 10
  if (rounded <= 0) return "0"
  return rounded.toFixed(1).replace(/\.0$/, "")
}
