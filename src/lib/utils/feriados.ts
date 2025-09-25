// Listado de feriados nacionales utilizados para validar semanas.
// Las fechas se expresan en formato ISO (YYYY-MM-DD).
// YYYY-MM-DD de los feriados
export const FERIADOS: string[] = [
  '2025-01-01', // Año Nuevo (irrenunciable)
  '2025-04-18', // Viernes Santo
  '2025-04-19', // Sábado Santo
  '2025-05-01', // Día del Trabajo (irrenunciable)
  '2025-05-21', // Día de las Glorias Navales
  '2025-06-20', // Día Nacional de los Pueblos Indígenas
  '2025-07-16', // Día de la Virgen del Carmen
  '2025-08-15', // Asunción de la Virgen
  '2025-09-18', // Independencia Nacional (irrenunciable)
  '2025-09-19', // Día de las Glorias del Ejército (irrenunciable)
  '2025-10-12', // Encuentro de Dos Mundos
  '2025-10-31', // Día Nacional de las Iglesias Evangélicas y Protestantes
  '2025-11-01', // Día de Todos los Santos
  '2025-11-16', // Elecciones Presidenciales y Parlamentarias
  '2025-12-08', // Inmaculada Concepción
  '2025-12-25', // Navidad (irrenunciable)
];

//NO MODIFICAR
export const esFeriado = (d: Date) => {
  // Convierte la fecha a formato ISO y verifica si existe en la lista
  return FERIADOS.includes(d.toISOString().split('T')[0]);
};

// Horas que se restan según el día del feriado
export const horasFeriado = (d: Date) => (d.getDay() === 5 ? 6.5 : 9); // viernes 6.5, resto 9
