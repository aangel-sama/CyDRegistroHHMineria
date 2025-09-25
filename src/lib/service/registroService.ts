// Funciones de servicio para interactuar con la tabla registro_horas
// y con la lista de proyectos en Supabase.
import { supabase } from '../supabaseClient';

/**
 * Obtiene todos los proyectos asociados a un correo.
 */

type MetaRow = { codigo: string; proyecto: string };

export async function obtenerProyectoMetaMap(): Promise<Record<string,string>> {
  const { data, error } = await supabase
    .from('nombre_proyecto')
    .select('codigo, proyecto');

  if (error) {
    console.error('Error cargando nombre_proyecto:', error);
    return {};
  }

  const metas = (data ?? []) as MetaRow[];

  return metas.reduce((map, { codigo, proyecto }) => {
    map[codigo] = proyecto;
    return map;
  }, {} as Record<string, string>);
}

export const obtenerProyectos = async (correo: string): Promise<string[]> => {
  const { data, error } = await supabase
    .from('proyecto')
    .select('codigo')
    .eq('correo', correo);

  if (error) {
    console.error('Error al obtener proyectos:', error);
    return [];
  }

  return data?.map(p => p.codigo) || [];
};

/**
 * Verifica si el usuario es nuevo.
 */
export const esUsuarioNuevo = async (correo: string): Promise<boolean> => {
  const { count } = await supabase
    .from('registro_horas')
    .select('*', { count: 'exact', head: true })
    .eq('correo', correo);

  return (count || 0) === 0;
};

/**
 * Obtiene los registros de la semana actual o anterior, según las fechas indicadas.
 */
export const obtenerRegistros = async (
  correo: string,
  fechas: string[]
) => {
  const { data, error } = await supabase
    .from('registro_horas')
    .select('*')
    .eq('correo', correo)
    .in('fecha', fechas)
    .in('estado', ['Borrador', 'Enviado']);

  if (error) {
    console.error('Error al obtener registros de semana:', error);
    return [];
  }

  return data || [];
};

/**
 * Obtiene los registros en estado 'Borrador' del usuario (sin restricción de fecha).
 */
export const obtenerBorradores = async (correo: string) => {
  const { data, error } = await supabase
    .from('registro_horas')
    .select('fecha')
    .eq('correo', correo)
    .eq('estado', 'Borrador');

  if (error) {
    console.error('Error al obtener borradores:', error);
    return [];
  }

  return data || [];
};

/**
 * Obtiene el estado de los registros de la semana anterior.
 */
export const obtenerEstadosSemanaAnterior = async (
  correo: string,
  fechas: string[]
) => {
  const { data, error } = await supabase
    .from('registro_horas')
    .select('estado')
    .eq('correo', correo)
    .in('fecha', fechas);

  if (error) {
    console.error('Error al obtener estados anteriores:', error);
    return [];
  }

  return data || [];
};

/**
 * Inserta un nuevo registro o actualiza uno existente (si ya había registro borrador).
 */
export const insertarOActualizarRegistro = async (
  correo: string,
  proyecto: string,
  fecha: string,
  horas: number,
  estado: 'Borrador' | 'Enviado'
) => {
  const { data: existente } = await supabase
    .from('registro_horas')
    .select('id, estado')
    .eq('correo', correo)
    .eq('proyecto', proyecto)
    .eq('fecha', fecha)
    .maybeSingle();

  if (existente) {
    if (existente.estado === 'Enviado') return; // ya es fijo, no se puede tocar
    await supabase
      .from('registro_horas')
      .update({ horas, estado })
      .eq('id', existente.id);
  } else {
    await supabase.from('registro_horas').insert({
      correo,
      proyecto,
      fecha,
      horas,
      estado,
    });
  }
};