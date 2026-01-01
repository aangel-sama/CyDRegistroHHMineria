// Página principal para registrar horas diarias de trabajo.
// Carga proyectos y permite guardar o enviar la semana a Supabase.
"use client";

import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import { supabase } from "../../lib/supabaseClient";

// Componentes reutilizables
import TablaHoras from "../../components/TablaHoras";
import ResumenSemana from "../../components/ResumenSemana";

// Utilidades para fechas (calcular semanas y formato)
import { obtenerFechasSemana, esFeriado } from "../../lib/utils/fechas";

// Funciones de servicio para Supabase
import {
  obtenerProyectos,
  obtenerRegistros,
  insertarOActualizarRegistro,
  obtenerProyectoMetaMap,
} from "./../../lib/service/registroService";

// Días de la semana en orden
const dias = ["Lunes", "Martes", "Miércoles", "Jueves"];

/* ──────────────────────────────────────────────────────────────────────────────
   Componente principal de la página: Registro de Horas
─────────────────────────────────────────────────────────────────────────────────*/
export default function RegistroHoras() {
  // Lista de códigos de proyectos asociados al usuario
  const [proyectos, setProyectos] = useState<string[]>([]);

  // Mapa de códigos de proyectos a nombres amigables
  const [metaMap, setMetaMap] = useState<Record<string, string>>({});

  // Matriz de horas por proyecto y día
  const [horas, setHoras] = useState<Record<string, Record<string, number>>>(
    {}
  );

  // Estado del envío: si ya fue enviado o está en borrador
  const [estadoEnvio, setEstadoEnvio] = useState<"Pendiente" | "Enviado">(
    "Pendiente"
  );

  // Indica si los inputs deben estar deshabilitados
  const [bloquear, setBloquear] = useState(false);

  // Indica si se está mostrando una semana anterior no enviada
  //const [bloqueoSemanaAnterior, setBloqueoSemanaAnterior] = useState(false);

  // Semana que se está mostrando (como array de fechas)
  const [fechasSemana, setFechasSemana] = useState<string[]>([]);

  // Texto amigable que se muestra como rango de la semana
  const [textoSemana, setTextoSemana] = useState("");

  // Correo de usuario autenticado
  const [correo, setCorreo] = useState<string | null>(null);

  // Mensajes de error y éxito para notificaciones
  const [mensajeError, setMensajeError] = useState("");
  const [mensajeExito, setMensajeExito] = useState("");

  // Número de semanas que se ha desplazado el usuario respecto a la actual
  // (0 = semana actual, -1 = anterior, 1 = siguiente, ...)
  const [offsetSemana, setOffsetSemana] = useState(0);

  // Estado para indicar si la semana anterior ya fue enviada
  const [prevWeekSent, setPrevWeekSent] = useState(false);

  // Estado de carga para evitar múltiples envíos/guardados simultáneos
  const [isSaving, setIsSaving] = useState(false);
  const [savingAccion, setSavingAccion] = useState<
    "Borrador" | "Enviado" | null
  >(null);

  /* ───────────────────────────────
     Efecto de inicialización
  ─────────────────────────────── */
  useEffect(() => {
    const init = async () => {
      // 1) Obtener usuario
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.email) {
        alert("No hay sesión activa.");
        return;
      }
      setCorreo(user.email);

      // 2) Proyectos y metaMap
      const codigos = await obtenerProyectos(user.email);
      setProyectos(codigos);
      setMetaMap(await obtenerProyectoMetaMap());

      // 3) Inicializar matriz h0
      const h0: Record<string, Record<string, number>> = {};
      codigos.forEach((p) => {
        h0[p] = {};
        dias.forEach((d) => (h0[p][d] = 0));
      });
      setHoras(h0);

      // 4) Fechas según offsetSemana
      const fechas = obtenerFechasSemana(offsetSemana);
      setFechasSemana(fechas);

      function formatearFecha(fechaISO: string) {
        const fecha = new Date(fechaISO + "T03:00:00"); // fuerza horario chileno
        const dia = fecha.getDate().toString().padStart(2, "0");
        const mes = (fecha.getMonth() + 1).toString().padStart(2, "0");
        return `${dia}/${mes}`;
      }

      const texto = `Semana del ${formatearFecha(
        fechas[0]
      )} al ${formatearFecha(fechas[3])}`;
      setTextoSemana(texto);

      // 5) Cargar registros de esa semana
      const registrosSemana = await obtenerRegistros(user.email, fechas);
      if (registrosSemana.length > 0) {
        const hNew = { ...h0 };
        registrosSemana.forEach((r) => {
          const idx = fechas.indexOf(r.fecha);
          if (idx !== -1) {
            const diaNombre = dias[idx];
            hNew[r.proyecto][diaNombre] = r.horas;
          }
        });
        setHoras(hNew);

        // Si algún registro está “Enviado”, bloqueo total
        if (registrosSemana.some((r) => r.estado === "Enviado")) {
          setEstadoEnvio("Enviado");
          setBloquear(true);
        } else {
          setEstadoEnvio("Pendiente");
          setBloquear(false);
        }
      } else {
        // No hay registros: borrador limpio
        setEstadoEnvio("Pendiente");
        setBloquear(false);
      }

      // 6) Si estamos en la semana actual (offsetSemana=0), cargamos la pasada
      if (offsetSemana === 0) {
        const fechasPrev = obtenerFechasSemana(-1);
        const prevRegs = await obtenerRegistros(user.email, fechasPrev);
        setPrevWeekSent(prevRegs.some((r) => r.estado === "Enviado"));
      } else {
        setPrevWeekSent(false);
      }
    };

    init();
  }, [offsetSemana]);

  /* ───────────────────────────────
     Función para manejar cambios en inputs
  ─────────────────────────────── */
  const handleHoraChange = (
    proyecto: string,
    idxDia: number,
    valor: number
  ) => {
    const fechaDia = fechasSemana[idxDia];
    if (new Date(fechaDia) > new Date()) return;

    // Validar que no sea día feriado
    if (esFeriado(fechaDia)) {
      setMensajeError("No se pueden registrar horas en días feriados.");
      return;
    }

    const diaNombre = dias[idxDia];
    const limite = diaNombre === "Jueves" ? 8 : 12;
    const totalDia = proyectos.reduce(
      (acc, p) => acc + (p === proyecto ? 0 : horas[p]?.[diaNombre] || 0),
      0
    );

    if (totalDia + valor > limite) {
      setMensajeError(
        `No puedes registrar más de ${limite} h para ${diaNombre}.`
      );
      return;
    }

    setHoras((prev) => ({
      ...prev,
      [proyecto]: { ...prev[proyecto], [diaNombre]: valor },
    }));
  };

  /* ───────────────────────────────
     Validaciones antes del envío
  ─────────────────────────────── */
  // Función que valida todas las condiciones antes de permitir el envío
  const validarAntesDeEnviar = () => {
    const errores: string[] = [];

    // 1. Verificar límites diarios
    for (let i = 0; i < dias.length; i++) {
      const diaNombre = dias[i];
      const limite = diaNombre === "Jueves" ? 8 : 12;
      const totalDia = proyectos.reduce(
        (acc, p) => acc + (horas[p]?.[diaNombre] || 0),
        0
      );

      if (totalDia > limite) {
        errores.push(
          `${diaNombre}: ${totalDia}h registradas (máximo ${limite}h)`
        );
      }
    }

    // 2. Verificar horas mínimas requeridas
    const tot = proyectos.reduce(
      (s, p) => s + dias.reduce((s2, d) => s2 + (horas[p]?.[d] || 0), 0),
      0
    );
    const horasEsperadas = fechasSemana.reduce((t, f, idx) => {
      if (esFeriado(f)) return t;
      return t + (idx === 3 ? 8 : 12); // jueves es el índice 3
    }, 0);

    if (tot < horasEsperadas) {
      errores.push(
        `Horas insuficientes: ${tot.toFixed(
          1
        )}h registradas (mínimo ${horasEsperadas}h)`
      );
    }

    // 3. Verificar que no haya días con 0 horas cuando debería haber
    for (let i = 0; i < dias.length; i++) {
      const fechaDia = fechasSemana[i];
      if (esFeriado(fechaDia)) continue; // Saltar feriados

      const diaNombre = dias[i];
      const totalDia = proyectos.reduce(
        (acc, p) => acc + (horas[p]?.[diaNombre] || 0),
        0
      );

      if (totalDia === 0) {
        errores.push(`${diaNombre}: No hay horas registradas`);
      }
    }

    return errores;
  };

  /* ───────────────────────────────
     Limpieza de registros Borrador
  ─────────────────────────────── */
  // Fuerza la actualización de todos los registros Borrador a Enviado
  const limpiarRegistrosBorrador = async (correoUsuario: string) => {
    try {
      const registrosSemana = await obtenerRegistros(
        correoUsuario,
        fechasSemana
      );
      const registrosBorrador = registrosSemana.filter(
        (r) => r.estado === "Borrador"
      );

      if (registrosBorrador.length === 0) {
        return { exito: true, procesados: 0 };
      }

      console.log(
        `🔄 Limpiando ${registrosBorrador.length} registros Borrador...`
      );

      // Actualizar cada registro Borrador a Enviado
      for (const registro of registrosBorrador) {
        await insertarOActualizarRegistro(
          correoUsuario,
          registro.proyecto,
          registro.fecha,
          registro.horas,
          "Enviado"
        );
      }

      return { exito: true, procesados: registrosBorrador.length };
    } catch (error) {
      console.error("Error limpiando registros Borrador:", error);
      return { exito: false, procesados: 0 };
    }
  };

  /* ───────────────────────────────
     Verificación post-envío
  ─────────────────────────────── */
  // Verifica que todos los registros de la semana estén en estado "Enviado"
  const verificarEstadoEnviado = async (correoUsuario: string) => {
    try {
      const registrosSemana = await obtenerRegistros(
        correoUsuario,
        fechasSemana
      );
      const registrosBorrador = registrosSemana.filter(
        (r) => r.estado === "Borrador"
      );

      if (registrosBorrador.length > 0) {
        console.error(
          "Registros que no cambiaron a Enviado:",
          registrosBorrador
        );
        return {
          exito: false,
          mensaje: `Error: ${registrosBorrador.length} registro(s) siguen en estado Borrador`,
        };
      }

      return {
        exito: true,
        mensaje: "Todos los registros cambiaron a Enviado correctamente",
      };
    } catch (error) {
      console.error("Error verificando estado:", error);
      return {
        exito: false,
        mensaje: "Error verificando el cambio de estado",
      };
    }
  };

  /* ───────────────────────────────
     Guardar o enviar registros
  ─────────────────────────────── */
  // Guarda los datos ingresados en Supabase. Dependiendo del estado indicado se
  // considerarán borradores o se marcarán como enviados.
  const persistir = async (estado: "Borrador" | "Enviado") => {
    // VALIDACIÓN ADICIONAL: Si es envío, verificar una vez más antes de persistir
    if (estado === "Enviado") {
      const errores = validarAntesDeEnviar();
      if (errores.length > 0) {
        setMensajeError(`Error de validación: ${errores.join(", ")}`);
        setMensajeExito("");
        return;
      }
    }

    for (const p of proyectos) {
      for (let i = 0; i < dias.length; i++) {
        const fechaDia = fechasSemana[i];
        if (estado === "Borrador" && new Date(fechaDia) > new Date()) continue;

        // No guardar horas en días feriados
        if (esFeriado(fechaDia)) continue;

        const fecha = fechasSemana[i];
        const horasDia = horas[p][dias[i]] || 0;

        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user?.email) {
          setCorreo(user.email);
        } else {
          alert("No hay sesión activa.");
        }
        if (correo) {
          await insertarOActualizarRegistro(
            user?.email || "",
            p,
            fecha,
            horasDia,
            estado
          );
        }
      }
    }

    if (estado === "Enviado") {
      // LIMPIEZA PREVIA: Asegurar que todos los registros Borrador cambien a Enviado
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.email) {
        // Primero limpiar registros Borrador que puedan haber quedado
        const limpieza = await limpiarRegistrosBorrador(user.email);

        if (limpieza.procesados > 0) {
          console.log(
            `✅ Limpieza completada: ${limpieza.procesados} registros actualizados`
          );
        }

        // Luego verificar que todo esté correcto
        const verificacion = await verificarEstadoEnviado(user.email);

        if (!verificacion.exito) {
          setMensajeError(
            `⚠️ ${verificacion.mensaje}. Intenta enviar nuevamente.`
          );
          setMensajeExito("");
          console.error("Error en verificación post-envío:", verificacion);
          return;
        }

        console.log("✅ Verificación exitosa:", verificacion.mensaje);
      }

      setEstadoEnvio("Enviado");
      setBloquear(true);
      setMensajeExito("Registro enviado correctamente.");
      setMensajeError("");
      location.reload();
    } else {
      setEstadoEnvio("Pendiente");
      setBloquear(false);
      setMensajeExito("Borrador guardado correctamente.");
    }
  };

  /* ───────────────────────────────
     Render del componente principal
  ─────────────────────────────── */
  const totalGeneral = proyectos.reduce(
    (s, p) => s + dias.reduce((s2, d) => s2 + (horas[p]?.[d] || 0), 0),
    0
  );
  // Función que calcula el total de horas por proyecto
  const totalProyecto = (p: string) =>
    dias.reduce((s, d) => s + (horas[p]?.[d] || 0), 0);

  // Función que calcula el total de horas por día
  const totalDia = (i: number) =>
    proyectos.reduce((s, p) => s + (horas[p]?.[dias[i]] || 0), 0);

  return (
    <div className="flex bg-[#ffffff] min-h-screen">
      <Sidebar />
      <main className="ml-64 flex-1 px-10 py-8 overflow-y-auto max-h-screen">
        {/* Overlay de carga bloqueante */}
        {isSaving && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-lg shadow-lg px-6 py-5 flex items-center gap-3">
              <div className="h-6 w-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
              <span className="text-gray-800 font-medium">
                {savingAccion === "Enviado"
                  ? "Enviando registro..."
                  : "Guardando borrador..."}
              </span>
            </div>
          </div>
        )}
        <h1 className="text-3xl font-bold text-[#212121] mb-6">
          Registro de Horas
        </h1>
        {/* Mensajes de error y éxito */}
        {mensajeError && (
          <div className="relative mb-4 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded">
            <button
              onClick={() => setMensajeError("")}
              className="absolute top-2 right-2 text-red-700 hover:text-red-900 text-lg font-bold focus:outline-none"
              aria-label="Cerrar"
              type="button"
            >
              ×
            </button>
            <div className="whitespace-pre-line">{mensajeError}</div>
          </div>
        )}

        {mensajeExito && (
          <div className="relative mb-4 p-4 bg-green-100 border-l-4 border-green-500 text-green-700 rounded">
            <button
              onClick={() => setMensajeExito("")}
              className="absolute top-2 right-2 text-green-700 hover:text-green-900 text-lg font-bold focus:outline-none"
              aria-label="Cerrar"
              type="button"
            >
              ×
            </button>
            {mensajeExito}
          </div>
        )}

        {/* Contadores de resumen */}
        <ResumenSemana
          totalGeneral={() => totalGeneral}
          cantidadProyectos={proyectos.length}
          estado={estadoEnvio}
        />

        {estadoEnvio === "Enviado" && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 rounded mb-4 flex justify-between items-center">
            <span>¿Te equivocaste al enviar? Puedes reiniciar la semana.</span>
            <button
              onClick={async () => {
                const confirmacion = confirm(
                  "¿Estás seguro de que quieres reiniciar la semana? Esta acción eliminará los registros enviados de esta semana."
                );
                if (!confirmacion) return;

                const {
                  data: { user },
                } = await supabase.auth.getUser();
                if (user?.email && fechasSemana.length > 0) {
                  await supabase
                    .from("registro_horas")
                    .delete()
                    .eq("correo", user.email)
                    .in("fecha", fechasSemana);

                  setMensajeExito(
                    "Semana reiniciada. Ahora puedes editar nuevamente."
                  );
                  setMensajeError("");
                  setEstadoEnvio("Pendiente");
                  setBloquear(false);

                  // Reinicia horas a cero
                  const h0: Record<string, Record<string, number>> = {};
                  proyectos.forEach((p) => {
                    h0[p] = {};
                    dias.forEach((d) => (h0[p][d] = 0));
                  });
                  setHoras(h0);
                }
              }}
              className="btn-outline"
            >
              Reiniciar semana
            </button>
          </div>
        )}

        {/* Tabla de ingreso de horas */}
        <TablaHoras
          proyectos={proyectos}
          metaMap={metaMap}
          dias={dias}
          horas={horas}
          fechasSemana={fechasSemana}
          estadoEnvio={estadoEnvio}
          bloquear={bloquear}
          prevWeekSent={prevWeekSent}
          totalProyecto={totalProyecto}
          totalDia={totalDia}
          totalGeneral={() => totalGeneral}
          handleHoraChange={handleHoraChange}
          textoSemana={textoSemana}
          setOffsetSemana={setOffsetSemana}
          offsetSemana={offsetSemana}
        />

        {/* Botones de acción */}
        <div className="flex justify-end w-full gap-4 mt-6">
          {/* BOTÓN GUARDAR BORRADOR */}
          <button
            disabled={bloquear || isSaving}
            onClick={async () => {
              if (bloquear) {
                setMensajeError("Registro ya enviado.");
                setMensajeExito("");
                return;
              }

              // limpiar alertas anteriores
              setMensajeError("");
              setMensajeExito("");

              try {
                setIsSaving(true);
                setSavingAccion("Borrador");
                await persistir("Borrador");
              } finally {
                setIsSaving(false);
                setSavingAccion(null);
              }
            }}
            className={`btn-outline ${
              bloquear || isSaving ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            Guardar borrador
          </button>

          {/* BOTÓN ENVIAR REGISTRO */}
          <button
            disabled={bloquear || isSaving}
            onClick={async () => {
              if (bloquear) {
                setMensajeError("Registro ya enviado.");
                setMensajeExito("");
                return;
              }

              // Calcular total excluyendo días feriados para validación consistente
              const tot = proyectos.reduce((s, p) => {
                return (
                  s +
                  dias.reduce((s2, d, idx) => {
                    const fechaDia = fechasSemana[idx];
                    // Excluir horas de días feriados del total
                    if (fechaDia && esFeriado(fechaDia)) return s2;
                    return s2 + (horas[p]?.[d] || 0);
                  }, 0)
                );
              }, 0);
              const horasEsperadas = fechasSemana.reduce((t, f, idx) => {
                if (esFeriado(f)) return t;
                return t + (idx === 3 ? 8 : 12); // jueves es el índice 3
              }, 0);

              if (tot < horasEsperadas) {
                setMensajeError(
                  `Debes completar al menos ${horasEsperadas} h. Actualmente llevas ${tot.toFixed(
                    1
                  )} h.`
                );
                setMensajeExito("");
                return;
              }

              // Si todas las validaciones pasan, proceder con el envío
              try {
                setIsSaving(true);
                setSavingAccion("Enviado");
                await persistir("Enviado");
              } finally {
                setIsSaving(false);
                setSavingAccion(null);
              }
            }}
            className={`btn-primary ${
              bloquear || isSaving ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            Enviar registro
          </button>
        </div>
      </main>
    </div>
  );
}
