// Página principal para registrar horas diarias de trabajo.
// Carga proyectos y permite guardar o enviar la semana a Supabase.
'use client';
 
import { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import { supabase } from '../../lib/supabaseClient';

// Componentes reutilizables
import TablaHoras from '../../components/TablaHoras';
import ResumenSemana from '../../components/ResumenSemana';

// Utilidades para fechas (calcular semanas y formato)
import { obtenerFechasSemana, esFeriado} from '../../lib/utils/fechas';

// Funciones de servicio para Supabase
import { obtenerProyectos, obtenerRegistros, insertarOActualizarRegistro, obtenerProyectoMetaMap} from './../../lib/service/registroService';


// Días de la semana en orden
const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];


/* ──────────────────────────────────────────────────────────────────────────────
   Componente principal de la página: Registro de Horas
─────────────────────────────────────────────────────────────────────────────────*/
export default function RegistroHoras() {
  // Lista de códigos de proyectos asociados al usuario
  const [proyectos, setProyectos] = useState<string[]>([]);

  // Mapa de códigos de proyectos a nombres amigables
  const [metaMap, setMetaMap]   = useState<Record<string,string>>({});

  // Matriz de horas por proyecto y día
  const [horas, setHoras] = useState<Record<string, Record<string, number>>>({});

  // Estado del envío: si ya fue enviado o está en borrador
  const [estadoEnvio, setEstadoEnvio] = useState<'Pendiente' | 'Enviado'>('Pendiente');

  // Indica si los inputs deben estar deshabilitados
  const [bloquear, setBloquear] = useState(false);

  // Indica si se está mostrando una semana anterior no enviada
  //const [bloqueoSemanaAnterior, setBloqueoSemanaAnterior] = useState(false);

  // Semana que se está mostrando (como array de fechas)
  const [fechasSemana, setFechasSemana] = useState<string[]>([]);

  // Texto amigable que se muestra como rango de la semana
  const [textoSemana, setTextoSemana] = useState('');

  // Correo de usuario autenticado
  const [correo, setCorreo] = useState<string | null>(null);

  // Mensajes de error y éxito para notificaciones
  const [mensajeError, setMensajeError] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');

  // Número de semanas que se ha desplazado el usuario respecto a la actual
  // (0 = semana actual, -1 = anterior, 1 = siguiente, ...)
  const [offsetSemana, setOffsetSemana] = useState(0);

  // Estado para indicar si la semana anterior ya fue enviada
  const [prevWeekSent, setPrevWeekSent] = useState(false);


  /* ───────────────────────────────
     Efecto de inicialización
  ─────────────────────────────── */
  useEffect(() => {
    const init = async () => {
      // 1) Obtener usuario
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        alert('No hay sesión activa.');
        return;
      }
      setCorreo(user.email);

      // 2) Proyectos y metaMap
      const codigos = await obtenerProyectos(user.email);
      setProyectos(codigos);
      setMetaMap(await obtenerProyectoMetaMap());

      // 3) Inicializar matriz h0
      const h0: Record<string, Record<string, number>> = {};
      codigos.forEach(p => {
        h0[p] = {};
        dias.forEach(d => (h0[p][d] = 0));
      });
      setHoras(h0);

      // 4) Fechas según offsetSemana
      const fechas = obtenerFechasSemana(offsetSemana);
      setFechasSemana(fechas);

      function formatearFecha(fechaISO: string) {
        const fecha = new Date(fechaISO + 'T03:00:00'); // fuerza horario chileno
        const dia = fecha.getDate().toString().padStart(2, '0');
        const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
        return `${dia}/${mes}`;
      }

      const texto = `Semana del ${formatearFecha(fechas[0])} al ${formatearFecha(fechas[4])}`;
      setTextoSemana(texto);

      // 5) Cargar registros de esa semana
      const registrosSemana = await obtenerRegistros(user.email, fechas);
      if (registrosSemana.length > 0) {
        const hNew = { ...h0 };
        registrosSemana.forEach(r => {
          const idx = fechas.indexOf(r.fecha);
          if (idx !== -1) {
            const diaNombre = dias[idx];
            hNew[r.proyecto][diaNombre] = r.horas;
          }
        });
        setHoras(hNew);

        // Si algún registro está “Enviado”, bloqueo total
        if (registrosSemana.some(r => r.estado === 'Enviado')) {
          setEstadoEnvio('Enviado');
          setBloquear(true);
        } else {
          setEstadoEnvio('Pendiente');
          setBloquear(false);
        }
        } else {
          // No hay registros: borrador limpio
          setEstadoEnvio('Pendiente');
          setBloquear(false);
        }

      // 6) Si estamos en la semana actual (offsetSemana=0), cargamos la pasada
      if (offsetSemana === 0) {
        const fechasPrev = obtenerFechasSemana(-1);
        const prevRegs = await obtenerRegistros(user.email, fechasPrev);
        setPrevWeekSent(prevRegs.some(r => r.estado === 'Enviado'));
      } else {
        setPrevWeekSent(false);
      }
    };

    init();
  }, [offsetSemana]);

  /* ───────────────────────────────
     Función para manejar cambios en inputs
  ─────────────────────────────── */
  const handleHoraChange = (proyecto: string, idxDia: number, valor: number) => {
    const fechaDia = fechasSemana[idxDia];
    if (new Date(fechaDia) > new Date()) return;

    const diaNombre = dias[idxDia];
    const limite = diaNombre === 'Viernes' ? 6.5 : 9;
    const totalDia = proyectos.reduce((acc, p) =>
      acc + (p === proyecto ? 0 : horas[p]?.[diaNombre] || 0), 0);

    if (totalDia + valor > limite) {
      setMensajeError(`No puedes registrar más de ${limite} h para ${diaNombre}.`);
      return;
    }

    setHoras(prev => ({
      ...prev,
      [proyecto]: { ...prev[proyecto], [diaNombre]: valor }
    }));
  };

  /* ───────────────────────────────
     Guardar o enviar registros
  ─────────────────────────────── */
  // Guarda los datos ingresados en Supabase. Dependiendo del estado indicado se
  // considerarán borradores o se marcarán como enviados.
  const persistir = async (estado: 'Borrador' | 'Enviado') => {

    for (const p of proyectos) {
      for (let i = 0; i < dias.length; i++) {
        const fechaDia = fechasSemana[i];
        if (estado === 'Borrador' && new Date(fechaDia) > new Date()) continue;

        const fecha = fechasSemana[i];
        const horasDia = horas[p][dias[i]] || 0;
        
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          setCorreo(user.email);
        } else {
          alert('No hay sesión activa.');
        } 
        if (correo) {
          await insertarOActualizarRegistro(user?.email || '', p, fecha, horasDia, estado);
        }
      }
    }

    if (estado === 'Enviado') {
      setEstadoEnvio('Enviado');
      setBloquear(true);
      setMensajeExito('Registro enviado correctamente.');
      setMensajeError('');
      location.reload();
    } else {
      setEstadoEnvio('Pendiente');
      setBloquear(false);
      setMensajeExito('Borrador guardado correctamente.');
    }
  };

  /* ───────────────────────────────
     Render del componente principal
  ─────────────────────────────── */
  const totalGeneral = proyectos.reduce((s, p) => s + dias.reduce((s2, d) => s2 + (horas[p]?.[d] || 0), 0), 0);
  // Función que calcula el total de horas por proyecto
  const totalProyecto = (p: string) => dias.reduce((s, d) => s + (horas[p]?.[d] || 0), 0);

  // Función que calcula el total de horas por día
  const totalDia = (i: number) => proyectos.reduce((s, p) => s + (horas[p]?.[dias[i]] || 0), 0);

  return (
    <div className="flex bg-[#ffffff] min-h-screen">
      <Sidebar />
      <main className="ml-64 flex-1 px-10 py-8 overflow-y-auto max-h-screen">
        <h1 className="text-3xl font-bold text-[#212121] mb-6">Registro de Horas</h1>
        {/* Mensajes de error y éxito */}
        {mensajeError && (
            <div className="relative mb-4 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded">
              <button
                onClick={() => setMensajeError('')}
                className="absolute top-2 right-2 text-red-700 hover:text-red-900 text-lg font-bold focus:outline-none"
                aria-label="Cerrar"
                type="button"
              >
                ×
              </button>
              {mensajeError}
            </div>
          )}

          {mensajeExito && (
            <div className="relative mb-4 p-4 bg-green-100 border-l-4 border-green-500 text-green-700 rounded">
              <button
                onClick={() => setMensajeExito('')}
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
          totalGeneral={() =>totalGeneral}
          cantidadProyectos={proyectos.length}
          estado={estadoEnvio}
        />

        {estadoEnvio === 'Enviado' && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 rounded mb-4 flex justify-between items-center">
            <span>¿Te equivocaste al enviar? Puedes reiniciar la semana.</span>
            <button
              onClick={async () => {
                const confirmacion = confirm('¿Estás seguro de que quieres reiniciar la semana? Esta acción eliminará los registros enviados de esta semana.');
                if (!confirmacion) return;

                const { data: { user } } = await supabase.auth.getUser();
                if (user?.email && fechasSemana.length > 0) {
                  await supabase
                    .from('registro_horas')
                    .delete()
                    .eq('correo', user.email)
                    .in('fecha', fechasSemana);

                  setMensajeExito('Semana reiniciada. Ahora puedes editar nuevamente.');
                  setMensajeError('');
                  setEstadoEnvio('Pendiente');
                  setBloquear(false);

                  // Reinicia horas a cero
                  const h0: Record<string, Record<string, number>> = {};
                  proyectos.forEach(p => {
                    h0[p] = {};
                    dias.forEach(d => (h0[p][d] = 0));
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
            onClick={() => {
              if (bloquear) {
                setMensajeError('Registro ya enviado.');
                setMensajeExito('');
                return;
              }

              // limpiar alertas anteriores
              setMensajeError('');
              setMensajeExito('');

              persistir('Borrador');
              setMensajeExito('Borrador guardado.');
            }}
            className={`btn-outline ${bloquear ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Guardar borrador
          </button>

          {/* BOTÓN ENVIAR REGISTRO */}
          <button
            onClick={() => {
              if (bloquear) {
                setMensajeError('Registro ya enviado.');
                setMensajeExito('');
                return;
              }

              const tot = proyectos.reduce(
                (s, p) => s + dias.reduce((s2, d) => s2 + (horas[p]?.[d] || 0), 0),
                0
              );
              const horasEsperadas = fechasSemana.reduce((t, f, idx) => {
                if (esFeriado(f)) return t;
                return t + (idx === 4 ? 6.5 : 9); // viernes es el índice 4
              }, 0);


              if (tot < horasEsperadas) {
                setMensajeError(
                  `Debes completar al menos ${horasEsperadas} h. Actualmente llevas ${tot.toFixed(1)} h.`
                );
                setMensajeExito('');
                return;
              }

              persistir('Enviado');
              setMensajeExito('Semana enviada correctamente.');
            }}
            className={`btn-primary ${bloquear ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Enviar registro
          </button>
        </div>
      </main>
    </div>
  );
}

