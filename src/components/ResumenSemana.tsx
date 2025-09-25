// Tarjetas superiores con el resumen de la semana.
// Muestra totales de horas, proyectos activos y estado actual.
'use client';

import React from 'react';

interface ResumenSemanaProps {
  totalGeneral: () => number;
  cantidadProyectos: number;
  estado: 'Pendiente' | 'Enviado';
}

/**
 * Componente que muestra el resumen superior:
 * - Total de horas trabajadas en la semana
 * - Cantidad de proyectos activos
 * - Estado del envío (Pendiente o Enviado)
 */
export default function ResumenSemana({ totalGeneral, cantidadProyectos, estado }: ResumenSemanaProps) {
  // totalGeneral: función que calcula todas las horas ingresadas
  // cantidadProyectos: número de proyectos activos del usuario
  // estado: indica si la semana está enviada o pendiente
  return (
    <div className="grid grid-cols-3 gap-6 w-full mb-8">
      {/* Total de horas */}
      <div className="stat-card">
        <p className="text-sm text-[#76787A]">Total horas registradas</p>
        <p className="text-3xl font-bold text-[#802528]">{totalGeneral().toFixed(1)}</p>
      </div>

      {/* Proyectos activos */}
      <div className="stat-card">
        <p className="text-sm text-[#76787A]">Proyectos activos</p>
        <p className="text-3xl font-bold text-[#802528]">{cantidadProyectos}</p>
      </div>

      {/* Estado de envío */}
      <div className="stat-card">
        <p className="text-sm text-[#76787A]">Estado</p>
        <p className={`total-badge-extra ${estado === 'Enviado' ? 'total-badge-enviado' : 'total-badge-pendiente'}`}>
          {estado}
        </p>
      </div>
    </div>
  );
}
