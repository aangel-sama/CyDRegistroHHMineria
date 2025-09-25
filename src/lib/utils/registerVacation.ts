// Funciones para registrar vacaciones o licencias en la base de datos.
// Valida el rango de fechas y actualiza la tabla de horas.
// lib/utils/registerVacation.ts

import { supabase } from '../supabaseClient';
import {
  eachDayOfInterval,
  format,
  isFriday,
  isWeekend,
  startOfWeek,
  parseISO,
} from 'date-fns';
import { esFeriado } from '../utils/feriados';
import { insertarOActualizarRegistro } from '../service/registroService';

interface RegisterVacationInput {
  correo: string;
  motivo: 'Vacaciones' | 'Licencia médica';
  fechaInicio: Date;
  fechaFin: Date;
}

export async function registerVacation({
  correo,
  motivo,
  fechaInicio,
  fechaFin,
}: RegisterVacationInput) {
  // Registra un bloque de vacaciones o licencia médica para el usuario
  // Validación de rango
  if (fechaFin < fechaInicio) {
    throw new Error('La fecha de fin no puede ser anterior a la fecha de inicio.');
  }

  // 1) Construye el array de días hábiles (sin fines de semana ni feriados)
  const dias = eachDayOfInterval({ start: fechaInicio, end: fechaFin })
    .filter((d) => !isWeekend(d) && !esFeriado(d));

  // Formatea a ISO strings
  const fechas = dias.map((d) => format(d, 'yyyy-MM-dd'));

  // 2) Verificar solapamientos tanto en Enviado como en Borrador (si horas > 0)
  const { data: overlap } = await supabase
    .from('registro_horas')
    .select('fecha, estado, horas')
    .eq('correo', correo)
    .in('fecha', fechas)
    .in('estado', ['Enviado', 'Borrador']);

  const conflictos = (overlap || []).filter(
    (r) =>
      r.estado === 'Enviado' ||
      (r.estado === 'Borrador' && (r.horas || 0) > 0)
  );

  if (conflictos.length) {
    // extrae fechas únicas
    const fechasUnicas = Array.from(
      new Set(conflictos.map((r) => r.fecha))
    );

    // formatea sin duplicados
    const bad = fechasUnicas
      .map((f) => format(parseISO(f), 'dd/MM/yyyy'))
      .join(', ');

    throw new Error(`Ya existen registros en esas fechas: ${bad}`);
  }


  // 3) Determina el proyecto clave según motivo
  const proyectoClave =
    motivo === 'Vacaciones' ? 'GIN-2-Vacaciones' : 'GIN-2-Licencias';

  // 4) Calcula el estado general:
  //    - Si la semana de inicio es anterior a la actual → Enviado
  //    - O si cubre 5 días hábiles → Enviado
  //    - En otro caso → Borrador
  const lunesActual = startOfWeek(new Date(), { weekStartsOn: 1 });
  const lunesBloque = startOfWeek(fechaInicio, { weekStartsOn: 1 });
  const completo = dias.length === 5;
  const estado = lunesBloque < lunesActual || completo ? 'Enviado' : 'Borrador';

  // 5) Inserta o actualiza cada día dentro del rango, solo para el proyecto de vacaciones/licencias
  for (const dia of dias) {
    const iso = format(dia, 'yyyy-MM-dd');
    const horasDia = isFriday(dia) ? 6.5 : 9;
    await insertarOActualizarRegistro(
      correo,
      proyectoClave,
      iso,
      horasDia,
      estado
    );
  }
}


