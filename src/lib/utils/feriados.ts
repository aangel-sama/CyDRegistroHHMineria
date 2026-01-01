// Listado de feriados nacionales de CHILE utilizados para validar semanas.
// Las fechas se expresan en formato ISO (YYYY-MM-DD).
// Este sistema calcula automáticamente los feriados para cualquier año.

/**
 * Calcula la fecha de Pascua (Domingo de Resurrección) usando el algoritmo de Meeus
 * @param año Año para calcular la Pascua
 * @returns Fecha de Pascua
 */
function calcularPascua(año: number): Date {
  const a = año % 19;
  const b = Math.floor(año / 100);
  const c = año % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(año, mes - 1, dia);
}


/**
 * Fechas de elecciones por año (configuración manual)
 * Actualizar cuando haya nuevas elecciones
 */
const ELECCIONES: Record<number, string> = {
  2025: "2025-11-16", // Elecciones Presidenciales y Parlamentarias
  // Agregar más años según sea necesario
};

/**
 * Genera la lista de feriados para un año específico
 * @param año Año para generar los feriados
 * @returns Array de fechas en formato ISO (YYYY-MM-DD)
 */
function generarFeriados(año: number): string[] {
  const feriados: string[] = [];

  // Feriados fijos (Chile)
  feriados.push(`${año}-01-01`); // Año Nuevo (irrenunciable)
  feriados.push(`${año}-05-01`); // Día del Trabajo (irrenunciable)
  feriados.push(`${año}-05-21`); // Día de las Glorias Navales
  feriados.push(`${año}-06-24`); // Día Nacional de los Pueblos Indígenas (Chile - fecha fija)
  feriados.push(`${año}-07-16`); // Día de la Virgen del Carmen
  feriados.push(`${año}-08-15`); // Asunción de la Virgen
  feriados.push(`${año}-09-18`); // Independencia Nacional (irrenunciable)
  feriados.push(`${año}-09-19`); // Día de las Glorias del Ejército (irrenunciable)
  feriados.push(`${año}-10-12`); // Encuentro de Dos Mundos
  feriados.push(`${año}-10-31`); // Día Nacional de las Iglesias Evangélicas y Protestantes
  feriados.push(`${año}-11-01`); // Día de Todos los Santos
  feriados.push(`${año}-12-08`); // Inmaculada Concepción
  feriados.push(`${año}-12-25`); // Navidad (irrenunciable)

  // Feriados variables (calculados según calendario litúrgico)
  const pascua = calcularPascua(año);
  const viernesSanto = new Date(pascua);
  viernesSanto.setDate(pascua.getDate() - 2);
  const sabadoSanto = new Date(pascua);
  sabadoSanto.setDate(pascua.getDate() - 1);

  feriados.push(viernesSanto.toISOString().split("T")[0]);
  feriados.push(sabadoSanto.toISOString().split("T")[0]);

  // Elecciones (si están configuradas para este año)
  if (ELECCIONES[año]) {
    feriados.push(ELECCIONES[año]);
  }

  return feriados.sort(); // Ordenar por fecha
}

// Cache de feriados por año para mejorar rendimiento
const feriadosCache: Record<number, string[]> = {};

/**
 * Obtiene los feriados para un año específico (con cache)
 * @param año Año para obtener los feriados
 * @returns Array de fechas en formato ISO
 */
export function obtenerFeriados(año: number): string[] {
  if (!feriadosCache[año]) {
    feriadosCache[año] = generarFeriados(año);
  }
  return feriadosCache[año];
}

// Mantener compatibilidad: lista de feriados para el año actual
const añoActual = new Date().getFullYear();
export const FERIADOS: string[] = obtenerFeriados(añoActual);

/**
 * Verifica si una fecha es feriado
 * @param d Fecha a verificar
 * @returns true si es feriado, false en caso contrario
 */
export const esFeriado = (d: Date) => {
  const año = d.getFullYear();
  const feriadosAño = obtenerFeriados(año);
  const fechaISO = d.toISOString().split("T")[0];
  return feriadosAño.includes(fechaISO);
};

// Horas que se restan según el día del feriado
export const horasFeriado = (d: Date) => (d.getDay() === 4 ? 8 : 12); // jueves 8, resto 12
