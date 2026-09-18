import React from 'react';

interface LogoProps {
  className?: string;
  showSubtitle?: boolean;
}

export function LogoBancoNacion({ className = '', showSubtitle = true }: LogoProps) {
  return (
    <div className={`inline-flex items-center bg-white border-2 border-red-600 rounded-2xl px-3.5 py-2 shadow-sm ${className}`}>
      {/* Icono del Calendario y Reloj de Agendamiento */}
      <div className="relative w-11 h-11 shrink-0 mr-3 flex items-center justify-center">
        <svg className="w-full h-full text-red-600" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Cuerpo del Calendario */}
          <rect x="8" y="18" width="70" height="68" rx="12" fill="#C8102E" />
          <rect x="22" y="10" width="7" height="16" rx="3.5" fill="#C8102E" />
          <rect x="57" y="10" width="7" height="16" rx="3.5" fill="#C8102E" />

          {/* Cuadrícula interna */}
          <rect x="16" y="42" width="54" height="38" rx="5" fill="#FFFFFF" />
          <rect x="21" y="47" width="8" height="8" rx="2" fill="#C8102E" />
          <rect x="33" y="47" width="8" height="8" rx="2" fill="#C8102E" />
          <rect x="45" y="47" width="8" height="8" rx="2" fill="#C8102E" />
          <rect x="57" y="47" width="8" height="8" rx="2" fill="#C8102E" />
          <rect x="21" y="59" width="8" height="8" rx="2" fill="#C8102E" />
          <rect x="33" y="59" width="8" height="8" rx="2" fill="#C8102E" />
          <rect x="21" y="71" width="8" height="8" rx="2" fill="#C8102E" />
          <rect x="33" y="71" width="8" height="8" rx="2" fill="#C8102E" />

          {/* Escudo simplificado superior */}
          <circle cx="43" cy="27" r="7" fill="#F59E0B" />

          {/* Reloj con Checkmark */}
          <circle cx="68" cy="65" r="23" fill="#FFFFFF" stroke="#C8102E" strokeWidth="5.5" />
          <circle cx="68" cy="65" r="2" fill="#C8102E" />
          <path d="M68 65L58 55" stroke="#C8102E" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M68 65L77 57" stroke="#C8102E" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M72 70L78 76L89 61" stroke="#C8102E" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Contenedor Tipográfico perfectamente acotado sin desbordamiento */}
      <div className="flex flex-col justify-center text-left">
        <span className="text-red-600 font-black tracking-tight text-lg leading-none uppercase">
          BANCO
        </span>
        <span className="text-red-600 font-black tracking-tight text-sm leading-tight uppercase">
          DE LA NACIÓN
        </span>

        {showSubtitle && (
          <div className="pt-0.5">
            <div className="w-full h-[1.5px] bg-red-600 mb-1 rounded-full" />
            <span className="block text-red-600 font-bold text-[8.5px] tracking-wider uppercase leading-tight whitespace-nowrap">
              AGENDAMIENTO DE CITAS
            </span>
            <span className="block text-red-600 font-bold text-[8.5px] tracking-wider uppercase leading-tight whitespace-nowrap">
              Y ORIENTACIÓN
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
