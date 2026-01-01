/**
 * Utilidades para manejar semanas y fechas laborales.
 *
 * Devuelve un arreglo de fechas (string en formato YYYY-MM-DD) correspondiente a una semana laboral.
 * @param offsetSemanas Número de semanas a desplazar. 0 = semana actual, -1 = anterior, +1 = siguiente
 * @returns Arreglo de 5 fechas (lunes a viernes)
 */

import { esFeriado as esFeriadoDate } from "./feriados";

export function esFeriado(fecha: string): boolean {
  // Comprueba si la fecha (ISO) es feriado usando la función dinámica
  const fechaDate = new Date(fecha + "T12:00:00"); // Mediodía para evitar problemas de zona horaria
  return esFeriadoDate(fechaDate);
}

export function obtenerFechasSemana(offsetSemanas = 0): string[] {
  const hoyLocal = new Date(); // Fecha local actual

  // Forzar la hora a mediodía para evitar problemas con UTC
  hoyLocal.setHours(12, 0, 0, 0);

  // Aplica el offset de semanas
  const fechaBase = new Date(hoyLocal);
  fechaBase.setDate(hoyLocal.getDate() + offsetSemanas * 7);

  // Calcular el lunes de esa semana
  const distanciaAlLunes = (fechaBase.getDay() + 6) % 7;
  const lunes = new Date(fechaBase);
  lunes.setDate(fechaBase.getDate() - distanciaAlLunes);

  // Generar 4 días desde el lunes (lunes a jueves)
  return Array.from({ length: 4 }, (_, i) => {
    const d = new Date(lunes);
    d.setDate(lunes.getDate() + i);
    d.setHours(12); // Aseguramos que esté al mediodía local
    return d.toISOString().split("T")[0]; // yyyy-mm-dd
  });
}

/**
 * Devuelve un texto formateado como "Semana del dd/mm al dd/mm"
 * @param desdeISO Fecha ISO del lunes de la semana
 * @returns Texto legible
 */
export function formatoSemana(desdeISO: string): string {
  const d = new Date(desdeISO); // Lunes
  const f = new Date(d);
  f.setDate(d.getDate() + 3); // Jueves

  const fmt = (x: Date) =>
    `${x.getDate().toString().padStart(2, "0")}/${(x.getMonth() + 1)
      .toString()
      .padStart(2, "0")}`;

  return `Semana del ${fmt(d)} al ${fmt(f)}`;
}

export function obtenerFechasHabilesSemana(offset = 0): string[] {
  return obtenerFechasSemana(offset).filter((f) => !esFeriado(f));
}
