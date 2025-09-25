// Página para registrar vacaciones o licencias médicas.
// Permite seleccionar rangos de fechas y enviarlos a Supabase.
'use client';

import Sidebar from '../../components/Sidebar';
import CalendarioFecha from '../../components/CalendarioFecha';
import { registerVacation } from '../../lib/utils/registerVacation';
import React, { useState, useCallback, useEffect, ChangeEvent } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { format, parseISO, addDays, startOfWeek } from 'date-fns';

// Tipo de fila retornada por Supabase
interface DiaRow { fecha: string; proyecto: string; horas: number; }
// Periodo de días libres agrupados
type Motivo = 'Vacaciones' | 'Licencia médica';

interface PeriodoLibre { start: string; end: string; motivo: Motivo }

export default function RegistroDiasLibres() {
  // Datos del formulario: motivo y rango de fechas
  const [motivo, setMotivo] = useState<'Vacaciones' | 'Licencia médica'>('Vacaciones');
  const [fechaInicio, setFechaInicio] = useState<Date>();
  const [fechaFin, setFechaFin] = useState<Date>();
  // Mensajes de feedback para el usuario
  const [mensajeError, setMensajeError] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');
  // Correo obtenido de la sesión actual
  const [correoUsuario, setCorreoUsuario] = useState('');
  // Periodos ya registrados y vigentes
  const [registrosDiasLibres, setRegistrosDiasLibres] = useState<PeriodoLibre[]>([]);

  // Agrupa fechas contiguas en rangos start→end
  const agruparFechas = (fechas: string[]): { start: string; end: string }[] => {
    if (!fechas.length) return [];
    const grupos: { start: string; end: string }[] = [];
    let start = fechas[0];
    let prev = parseISO(fechas[0]);
    for (let i = 1; i < fechas.length; i++) {
      const curr = parseISO(fechas[i]);
      const oneDay = 24 * 3600_000;
      if (curr.getTime() - prev.getTime() === oneDay) {
        prev = curr;
      } else {
        grupos.push({ start, end: format(prev, 'yyyy-MM-dd') });
        start = fechas[i];
        prev = curr;
      }
    }
    grupos.push({ start, end: format(prev, 'yyyy-MM-dd') });
    return grupos;
  };

  // Carga y procesa registros de Vacaciones/Licencias
  const loadRegistrosDiasLibres = useCallback(async (email: string) => {
    const { data, error } = await supabase
      .from('registro_horas')
      .select('fecha, proyecto, horas')
      .eq('correo', email)
      .in('proyecto', ['GIN-2-Vacaciones', 'GIN-2-Licencias'])
      .order('fecha', { ascending: true });
    if (error) {
      console.error('Error cargando días libres:', error);
      return;
    }
    const rows = (data ?? []) as DiaRow[];
    const vacFechas = rows.filter(r => r.proyecto === 'GIN-2-Vacaciones' && r.horas > 0).map(r => r.fecha);
    const licFechas = rows.filter(r => r.proyecto === 'GIN-2-Licencias' && r.horas > 0).map(r => r.fecha);
    const vacPeriodos = agruparFechas(vacFechas).map(p => ({ ...p, motivo: 'Vacaciones' as Motivo }));
    const licPeriodos = agruparFechas(licFechas).map(p => ({ ...p, motivo: 'Licencia médica' as Motivo }));

    // Filtrar periodos cuyo 'end' sea al menos el lunes de la semana actual
    const lunesActual = startOfWeek(new Date(), { weekStartsOn: 1 });
    const todos = [...vacPeriodos, ...licPeriodos];
    const vigentes = todos.filter(p => parseISO(p.end) >= lunesActual);

    setRegistrosDiasLibres(vigentes);
  }, []);

  // Inicialización: obtiene usuario y carga registros
  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        console.error('No se pudo obtener el usuario:', error);
        return;
      }
      const email = data.user.email!;
      setCorreoUsuario(email);
      await loadRegistrosDiasLibres(email);
    };
    fetchUser();
  }, [loadRegistrosDiasLibres]);

  // Al pulsar "Eliminar" en un periodo:
  // 1) Se genera el array con todas las fechas del bloque (start→end).
  // 2) Sólo se filtran las fechas *estrictamente posteriores* a esta semana partiendo del lunes, de modo que
  //    los días ya consumidos (menores o iguales a hoy) no se tocan.
  // 3) Se envía DELETE a Supabase únicamente con esos días futuros y proyecto correspondiente.
  // 4) Si no quedan días futuros, mostrará un aviso y no tocará nada.
  const handleEliminar = async (
    start: string,
    end: string,
    motivo: 'Vacaciones' | 'Licencia médica'
  ) => {
    setMensajeError('')
    try {
      // 1) Generar array de ISO-strings desde start hasta end
      const dias: string[] = []
      for (let d = parseISO(start); d <= parseISO(end); d = addDays(d, 1)) {
        dias.push(format(d, 'yyyy-MM-dd'))
      }

      // 2) Determinar proyecto clave
      const proyectoClave = motivo === 'Vacaciones'
        ? 'GIN-2-Vacaciones'
        : 'GIN-2-Licencias'

      // 3) Calcular inicio de esta semana (lunes)
      const lunesActual = format(
        startOfWeek(new Date(), { weekStartsOn: 1 }),
        'yyyy-MM-dd'
      )

      // 4) Filtrar sólo fechas >= lunesActual
      const diasAEliminar = dias.filter(f => f >= lunesActual)

      if (diasAEliminar.length === 0) {
        setMensajeError('No hay días de esta semana o futuras para eliminar.')
        return
      }

      // 5) Borrar en Supabase
      const { error } = await supabase
        .from('registro_horas')
        .delete()
        .in('fecha', diasAEliminar)
        .eq('correo', correoUsuario)
        .eq('proyecto', proyectoClave)

      if (error) throw error

      setMensajeExito('Días libres eliminados correctamente.')
      await loadRegistrosDiasLibres(correoUsuario)
    } catch (err) {
      console.error('Error eliminando registros:', err)
      setMensajeError('No se pudo eliminar ese período.')
    }
  }

  // Maneja el envío de vacaciones/licencia (delegado a registerVacation)
  const handleEnviar = async () => {
    setMensajeError('');
    if (!fechaInicio || !fechaFin) {
      setMensajeError('Debes seleccionar ambas fechas.');
      return;
    }
    if (!correoUsuario) {
      setMensajeError('No se pudo determinar tu correo. Intenta de nuevo.');
      return;
    }
    try {
      await registerVacation({ correo: correoUsuario, motivo, fechaInicio, fechaFin });
      setMensajeExito('Registro enviado exitosamente.');
      setMotivo('Vacaciones');
      setFechaInicio(undefined);
      setFechaFin(undefined);
      await loadRegistrosDiasLibres(correoUsuario);
    } catch (err) {
      console.error('Error al registrar días libres:', err);
      if (err instanceof Error) setMensajeError(err.message);
      else setMensajeError('Error al registrar los días libres.');
    }
  };

  return (
    <div className="flex bg-[#ffffff] min-h-screen">
      <Sidebar />
      <main className="ml-64 flex-1 px-10 py-12 flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center w-full max-w-4xl">
          <h1 className="text-3xl font-bold text-[#212121] mb-8">Registro de días libres</h1>
          {mensajeError && (
            <div className="relative w-full mb-4 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded">
              <button onClick={() => setMensajeError('')} className="absolute top-2 right-2 text-red-700 hover:text-red-900 text-lg font-bold focus:outline-none">×</button>
              {mensajeError}
            </div>
          )}
          {mensajeExito && (
            <div className="relative w-full mb-4 p-4 bg-green-100 border-l-4 border-green-500 text-green-700 rounded">
              <button onClick={() => setMensajeExito('')} className="absolute top-2 right-2 text-green-700 hover:text-green-900 text-lg font-bold focus:outline-none">×</button>
              {mensajeExito}
            </div>
          )}
          <div className="bg-white rounded-xl shadow-md p-6 flex items-center gap-26 w-full">
            <div className="flex items-center gap-16">
              <div className="flex flex-col gap-1">
                <label className="text-sm text-[#212121]">Motivo</label>
                <select
                  value={motivo}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                    setMotivo(e.target.value as 'Vacaciones' | 'Licencia médica')
                  }
                  className="border-white rounded px-4 py-2 text-sm bg-white shadow text-[#76787A] outline-none focus:ring-0 focus:border-transparent"
                >
                  <option value="Vacaciones">Vacaciones</option>
                  <option value="Licencia médica">Licencia médica</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm text-[#212121]">Fecha Inicio</label>
                <CalendarioFecha date={fechaInicio} onDateChange={setFechaInicio} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm text-[#212121]">Fecha Fin</label>
                <CalendarioFecha date={fechaFin} onDateChange={setFechaFin} />
              </div>
            </div>
            <button onClick={handleEnviar} className="btn-secundary px-6 py-2 text-white rounded shadow">Enviar</button>
          </div>
          {registrosDiasLibres.length > 0 && (
            <section className="mt-8 w-full max-w-4xl bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold text-[#212121] mb-4">Días libres registrados</h2>
              <ul className="list-disc pl-5 space-y-1 text-[#374151]">
                {registrosDiasLibres.map(({ start, end, motivo }) => (
                  <li key={start + motivo} className="flex justify-between items-center">
                    <span>
                      {format(parseISO(start), 'dd/MM/yyyy')} – {format(parseISO(end), 'dd/MM/yyyy')} | {motivo}
                    </span>
                    <button onClick={() => handleEliminar(start, end, motivo)} className="ml-4 text-red-600 hover:text-red-800 text-sm">Eliminar</button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

