import React from 'react';
import { Agency } from '@/domain/entities/agency';
import { MapPinIcon, BuildingIcon, ClockIcon } from '@/components/Icons';

interface MapProps {
  agency: Agency | null;
}

export function AgencyMapPreview({ agency }: MapProps) {
  if (!agency) {
    return (
      <div className="w-full h-full bg-slate-100 border border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center text-slate-500 space-y-3">
        <MapPinIcon className="w-12 h-12 text-slate-400" />
        <p className="font-bold text-sm">Selecciona una agencia de la lista para ver su ubicación en el mapa.</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between h-full">
      {/* Visualizador de Mapa interactivo simulación vectorial GPS */}
      <div className="relative w-full h-64 bg-slate-900 overflow-hidden flex items-center justify-center">
        {/* Patrón de mapa satelital / vectorial */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `radial-gradient(#C8102E 1px, transparent 1px), radial-gradient(#64748B 1px, #0F172A 1px)`,
            backgroundSize: '24px 24px',
            backgroundPosition: '0 0, 12px 12px',
          }}
        />

        {/* Líneas de calles del mapa */}
        <svg className="absolute inset-0 w-full h-full opacity-40 stroke-slate-500" strokeWidth="2">
          <line x1="0" y1="30%" x2="100%" y2="30%" />
          <line x1="0" y1="70%" x2="100%" y2="70%" />
          <line x1="40%" y1="0" x2="40%" y2="100%" strokeWidth="4" />
          <line x1="75%" y1="0" x2="75%" y2="100%" />
        </svg>

        {/* Marcador de Pin central animado */}
        <div className="relative z-10 flex flex-col items-center animate-bounce">
          <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center shadow-2xl border-2 border-white">
            <MapPinIcon className="w-7 h-7" />
          </div>
          <span className="bg-slate-950 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-amber-400 mt-1 shadow-md whitespace-nowrap">
            {agency.nombre_agencia}
          </span>
        </div>

        {/* Badge GPS Latitud / Longitud */}
        <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-md text-amber-400 text-[10px] font-mono px-3 py-1 rounded-md border border-slate-700">
          GPS: {agency.latitud || '-13.5226'}, {agency.longitud || '-71.9673'}
        </div>
      </div>

      {/* Detalle Informativo de la Agencia Seleccionada */}
      <div className="p-6 space-y-4 bg-white">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-extrabold text-red-700 uppercase tracking-wider block">
              {agency.distrito}
            </span>
            <h3 className="text-xl font-extrabold text-slate-900 leading-tight mt-0.5">
              {agency.nombre_agencia}
            </h3>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
            90% Cupos Libres Esta Semana
          </span>
        </div>

        <div className="space-y-2 text-sm text-slate-600 pt-2 border-t border-slate-100">
          <p className="flex items-center gap-2">
            <MapPinIcon className="w-4 h-4 text-red-600 shrink-0" />
            <strong className="text-slate-800">Dirección:</strong> {agency.direccion}
          </p>
          <p className="flex items-center gap-2">
            <ClockIcon className="w-4 h-4 text-amber-600 shrink-0" />
            <strong className="text-slate-800">Horario:</strong> 7:30 am - 12:00 am / 2:00 pm - 6:00 pm (L - S)
          </p>
          {agency.telefono && (
            <p className="flex items-center gap-2">
              <BuildingIcon className="w-4 h-4 text-slate-500 shrink-0" />
              <strong className="text-slate-800">Teléfono:</strong> {agency.telefono}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
