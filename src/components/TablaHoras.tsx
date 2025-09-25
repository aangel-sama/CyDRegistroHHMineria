// Tabla editable donde se ingresan las horas por proyecto y día.
'use client';

import React from 'react';
import { esFeriado } from '../lib/utils/feriados';
import Image from 'next/image';

type TablaHorasProps = {
  proyectos: string[];
  metaMap: Record<string, string>;
  dias: string[];
  horas: Record<string, Record<string, number>>;
  fechasSemana: string[];
  estadoEnvio: 'Pendiente' | 'Enviado';
  bloquear: boolean;
  prevWeekSent: boolean;
  totalProyecto: (p: string) => number;
  totalDia: (i: number) => number;
  totalGeneral: () => number;
  handleHoraChange: (proyecto: string, idxDia: number, valor: number) => void;
  textoSemana: string;
  setOffsetSemana: React.Dispatch<React.SetStateAction<number>>;
  offsetSemana: number;
};

export default function TablaHoras({
  proyectos,
  metaMap,
  dias,
  horas,
  fechasSemana,
  estadoEnvio,
  bloquear,
  prevWeekSent,
  totalProyecto,
  totalDia,
  totalGeneral,
  handleHoraChange,
  textoSemana,
  setOffsetSemana,
  offsetSemana,
}: TablaHorasProps) {
  // Renderiza una tabla editable con los proyectos y los días de la semana.
  // Permite modificar horas y navegar entre semanas mediante offsetSemana.
  return (
    <div className="w-full overflow-hidden rounded-2xl shadow">
      {/* Encabezado */}
      <div className="flex items-center justify-between bg-[#fff] px-6 pt-6">
        <h2 className="text-xl font-semibold text-[#212121]">Detalle de horas</h2>

        {/* Selector de semana */}
        <div className="flex items-center gap-2 text-sm text-[#802528] font-medium">
          <button
            onClick={() => offsetSemana > -1 && !prevWeekSent && setOffsetSemana(offsetSemana - 1)}
            disabled={offsetSemana <= -1 || prevWeekSent}
            className={`text-lg hover:text-[#a33838] ${
              (offsetSemana <= -1 || prevWeekSent) ? 'opacity-30 cursor-not-allowed' : ''
            }`}
            aria-label="Semana anterior"
          >
            &lt;
          </button>

          <Image
            src="/today-outline.svg"
            alt="Calendario"
            width={16}
            height={16}
            className="w-4 h-4"
          />
          <span>{textoSemana}</span>

          <button
            onClick={() => offsetSemana < 0 && setOffsetSemana(offsetSemana + 1)}
            disabled={offsetSemana >= 0}
            className={`text-lg hover:text-[#a33838] ${offsetSemana >= 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
            aria-label="Semana siguiente"
          >
            &gt;
          </button>
        </div>
      </div>

      {/* Tabla */}
      <table className="min-w-full bg-white">
        <thead className="table-header">
          <tr>
            <th className="p-4 text-center">Proyecto</th>
            <th className="p-4 text-center">Nombre</th>
            {dias.map((dia) => (
              <th key={dia} className="p-4 text-center">{dia}</th>
            ))}
            <th className="p-4 text-center">Total</th>
          </tr>
        </thead>

        <tbody>
          {proyectos.map((proyecto) => (
            <tr key={proyecto} className="table-row border-b border-[#DCDDDE]">
              <td className="p-4 text-center font-medium text-[#374151]">{proyecto}</td>
              <td className="p-4 text-center text-[#6B7280]">{metaMap[proyecto] ?? '-'}</td>
              {dias.map((dia, idx) => {
                const fecha = fechasSemana[idx];
                const esFeriadoDia = Boolean(fecha && esFeriado(new Date(fecha)));
                const isFuture    = Boolean(fecha && new Date(fecha) > new Date());


                return (
                  <td key={dia} className="p-2 text-center">
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={horas[proyecto]?.[dia] || ''}
                      disabled={
                        bloquear ||
                        esFeriadoDia ||
                        (estadoEnvio === 'Enviado') ||
                        (offsetSemana === 0 && isFuture)
                      }
                      onChange={(e) =>
                        handleHoraChange(proyecto, idx, parseFloat(e.target.value) || 0)
                      }
                      className="input-hora"
                    />
                  </td>
                );
              })}
              <td className="p-4 text-center">
                <span className="total-badge">{totalProyecto(proyecto).toFixed(1)}</span>
              </td>
            </tr>
          ))}
        </tbody>

        <tfoot>
          <tr className="bg-white text-[#212121] font-semibold">
            <td className="p-4 text-center">Total diario</td>
            <td className="p-4 text-center"></td>
            {dias.map((_, i) => (
              <td key={i} className="p-4 text-center text-[#802528]">
                {totalDia(i).toFixed(1)}
              </td>
            ))}
            <td className="p-4 text-center">
              <span className="total-badge">{totalGeneral().toFixed(1)}</span>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}