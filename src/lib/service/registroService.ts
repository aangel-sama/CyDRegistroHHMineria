// Funciones de servicio para interactuar con la tabla registro_horas
// y con la lista de proyectos en Supabase.
import { supabase } from "../supabaseClient";

/**
 * Obtiene todos los proyectos asociados a un correo.
 */

type MetaRow = { codigo: string; proyecto: string };

export async function obtenerProyectoMetaMap(): Promise<
  Record<string, string>
> {
  const { data, error } = await supabase
    .from("nombre_proyecto")
    .select("codigo, proyecto");

  if (error) {
    console.error("Error cargando nombre_proyecto:", error);
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
    .from("proyecto")
    .select("codigo")
    .eq("correo", correo);

  if (error) {
    console.error("Error al obtener proyectos:", error);
    return [];
  }

  return data?.map((p) => p.codigo) || [];
};

/**
 * Verifica si el usuario es nuevo.
 */
export const esUsuarioNuevo = async (correo: string): Promise<boolean> => {
  const { count } = await supabase
    .from("registro_horas")
    .select("*", { count: "exact", head: true })
    .eq("correo", correo);

  return (count || 0) === 0;
};

/**
 * Obtiene los registros de la semana actual o anterior, según las fechas indicadas.
 */
export const obtenerRegistros = async (correo: string, fechas: string[]) => {
  const { data, error } = await supabase
    .from("registro_horas")
    .select("*")
    .eq("correo", correo)
    .in("fecha", fechas)
    .in("estado", ["Borrador", "Enviado"]);

  if (error) {
    console.error("Error al obtener registros de semana:", error);
    return [];
  }

  return data || [];
};

/**
 * Obtiene los registros en estado 'Borrador' del usuario (sin restricción de fecha).
 */
export const obtenerBorradores = async (correo: string) => {
  const { data, error } = await supabase
    .from("registro_horas")
    .select("fecha")
    .eq("correo", correo)
    .eq("estado", "Borrador");

  if (error) {
    console.error("Error al obtener borradores:", error);
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
    .from("registro_horas")
    .select("estado")
    .eq("correo", correo)
    .in("fecha", fechas);

  if (error) {
    console.error("Error al obtener estados anteriores:", error);
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
  estado: "Borrador" | "Enviado"
) => {
  const { data: existente } = await supabase
    .from("registro_horas")
    .select("id, estado")
    .eq("correo", correo)
    .eq("proyecto", proyecto)
    .eq("fecha", fecha)
    .maybeSingle();

  if (existente) {
    if (existente.estado === "Enviado") return; // ya es fijo, no se puede tocar
    await supabase
      .from("registro_horas")
      .update({ horas, estado })
      .eq("id", existente.id);
  } else {
    await supabase.from("registro_horas").insert({
      correo,
      proyecto,
      fecha,
      horas,
      estado,
    });
  }
};

/**
 * Función de diagnóstico para verificar datos en las tablas
 */
export const diagnosticarProyectos = async (correo: string) => {
  console.log("🔍 === DIAGNÓSTICO DE PROYECTOS ===");
  console.log("📧 Correo a verificar:", correo);

  // 1. Verificar tabla proyecto
  const { data: proyectosData, error: proyectosError } = await supabase
    .from("proyecto")
    .select("*")
    .eq("correo", correo);

  console.log("📊 Tabla proyecto - Datos:", proyectosData);
  console.log("❌ Tabla proyecto - Error:", proyectosError);

  // 2. Verificar tabla nombre_proyecto
  const { data: nombresData, error: nombresError } = await supabase
    .from("nombre_proyecto")
    .select("*");

  console.log("📊 Tabla nombre_proyecto - Datos:", nombresData);
  console.log("❌ Tabla nombre_proyecto - Error:", nombresError);

  // 3. Verificar todos los proyectos (sin filtro)
  const { data: todosProyectos, error: todosError } = await supabase
    .from("proyecto")
    .select("*");

  console.log("📊 Todos los proyectos:", todosProyectos);
  console.log("❌ Error al obtener todos:", todosError);

  console.log("🔍 === FIN DIAGNÓSTICO ===");
};

/**
 * Función para inicializar datos de prueba en las tablas
 */
export const inicializarDatosPrueba = async () => {
  console.log("🚀 === INICIALIZANDO DATOS DE PRUEBA ===");

  try {
    // 1. Insertar datos en nombre_proyecto
    const { error: nombresError } = await supabase
      .from("nombre_proyecto")
      .upsert(
        [
          { codigo: "AP-69", proyecto: "Prueba" },
          { codigo: "AP-29", proyecto: "Prueba2" },
          { codigo: "GIN-2-Vacaciones", proyecto: "Vacaciones" },
          { codigo: "GIN-2-Licencias", proyecto: "Licencia médica" },
        ],
        { onConflict: "codigo" }
      );

    if (nombresError) {
      console.error("❌ Error insertando nombres:", nombresError);
    } else {
      console.log("✅ Nombres de proyectos insertados correctamente");
    }

    // 2. Insertar datos en proyecto para el usuario actual
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user?.email) {
      const { error: proyectosError } = await supabase.from("proyecto").upsert(
        [
          { correo: user.email, codigo: "AP-69" },
          { correo: user.email, codigo: "AP-29" },
        ],
        { onConflict: "correo,codigo" }
      );

      if (proyectosError) {
        console.error("❌ Error insertando proyectos:", proyectosError);
      } else {
        console.log("✅ Proyectos asignados al usuario correctamente");
      }
    }

    console.log("🎉 === DATOS INICIALIZADOS ===");
  } catch (error) {
    console.error("❌ Error general:", error);
  }
};
