// Utilidad simple para combinar clases de Tailwind de forma segura.
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  // Combina clases condicionales y resuelve conflictos de Tailwind
  return twMerge(clsx(inputs))
}
