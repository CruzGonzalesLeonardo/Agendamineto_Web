'use client';

import React from 'react';
import Link from 'next/link';

export default function ClienteDashboard() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header Rol Cliente */}
      <header className="bg-slate-900 border-b border-slate-800 py-4 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-600 flex items-center justify-center font-bold text-white">
            BN
          </div>
          <div>
            <h1 className="font-extrabold text-white text-base">MI PORTAL CIUDADANO</h1>
            <span className="text-xs text-amber-400 font-semibold">ROL 1: CLIENTE</span>
          </div>
        </div>
        <Link href="/login" className="text-xs text-slate-400 hover:text-white border border-slate-700 px-3 py-1.5 rounded-md">
          Cerrar Sesión
        </Link>
      </header>

      {/* Contenido Cliente */}
      <main className="max-w-6xl w-full mx-auto p-6 space-y-6 flex-1">
        <div className="flex justify-between items-center bg-slate-900 p-6 rounded-xl border border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white">Bienvenido, Juan Pérez</h2>
            <p className="text-xs text-slate-400 mt-1">DNI: 45892301 | Correo: juan.perez@email.com</p>
          </div>
          <Link href="/agendar" className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-sm transition">
            + Agendar Nueva Cita
          </Link>
        </div>

        {/* Citas Pendientes */}
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <h3 className="font-extrabold text-amber-400 text-sm uppercase tracking-wider">
            MIS CITAS REGISTRADAS
          </h3>

          <div className="border border-slate-800 rounded-lg p-4 bg-slate-950 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                PENDIENTE DE ATENCIÓN
              </span>
              <h4 className="font-bold text-white text-lg mt-2">Solicitud de Tarjeta de Débito Preferencial</h4>
              <p className="text-xs text-slate-400 mt-1">Agencia Ovalo Sur - Cusco (Ventanilla 02)</p>
              <p className="text-xs text-slate-400">Fecha: 18/09/2026 - 09:30 AM</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg text-center space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">CÓDIGO CITA</span>
              <span className="font-mono text-amber-400 font-extrabold text-sm">BN-893021</span>
              <button className="block text-[11px] text-red-400 hover:underline pt-1">Ver Código QR</button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
