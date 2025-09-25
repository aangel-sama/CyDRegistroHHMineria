/**
 * Utilidades para manejar semanas y fechas laborales.
 *
 * Devuelve un arreglo de fechas (string en formato YYYY-MM-DD) correspondiente a una semana laboral.
 * @param offsetSemanas Número de semanas a desplazar. 0 = semana actual, -1 = anterior, +1 = siguiente
 * @returns Arreglo de 5 fechas (lunes a viernes)
 */

import { FERIADOS } from './feriados';

export function esFeriado(fecha: string): boolean {
  // Comprueba si la fecha (ISO) se encuentra en la lista de feriados
  return FERIADOS.includes(fecha);
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

  // Generar 5 días desde el lunes
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(lunes);
    d.setDate(lunes.getDate() + i);
    d.setHours(12); // Aseguramos que esté al mediodía local
    return d.toISOString().split('T')[0]; // yyyy-mm-dd
  });
}





/**
 * Devuelve un texto formateado como "Semana del dd/mm al dd/mm"
 * @param desdeISO Fecha ISO del lunes de la semana
 * @returns Texto legible
 */
export function formatoSemana(desdeISO: string): string {
  const d = new Date(desdeISO);       // Lunes
  const f = new Date(d); f.setDate(d.getDate() + 4); // Viernes

  const fmt = (x: Date) =>
    `${x.getDate().toString().padStart(2, '0')}/${(x.getMonth() + 1).toString().padStart(2, '0')}`;

  return `Semana del ${fmt(d)} al ${fmt(f)}`;
}

export function obtenerFechasHabilesSemana(offset = 0): string[] {
  return obtenerFechasSemana(offset).filter(f => !esFeriado(f));
}

