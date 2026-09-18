'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogoBancoNacion } from '@/components/LogoBancoNacion';
import {
  UserIcon,
  SearchIcon,
  FileTextIcon,
  CheckCircleIcon,
  ClockIcon,
  BuildingIcon,
  CalendarIcon,
} from '@/components/Icons';
import { QRCodeSVG } from '@/components/QRCodeSVG';

interface AppointmentAgendaItem {
  codigo: string;
  hora: string;
  cliente: string;
  dni: string;
  telefono: string;
  email: string;
  tramite: string;
  estado: 'pendiente' | 'en_atencion' | 'atendida' | 'rechazada';
  requisitos: { id: number; descripcion: string; estado: 'ok' | 'baja' | 'pendiente' }[];
}

export default function VentanillaDashboard() {
  const router = useRouter();
  const [operatorName, setOperatorName] = useState('Juan Pérez');
  const [agenciaNombre, setAgenciaNombre] = useState('Agencia Cusco Central');
  const [ventanillaNumero, setVentanillaNumero] = useState('Ventanilla 02');

  // Vista activa: 'agenda' (Vista 1) o 'atencion' (Vista 2)
  const [activeView, setActiveView] = useState<'agenda' | 'atencion'>('agenda');

  // Filtros de la Vista 1 (Agenda)
  const [selectedDate, setSelectedDate] = useState('2026-09-18');
  const [searchQuery, setSearchQuery] = useState('');
  const [manualCodeInput, setManualCodeInput] = useState('');

  // Cita seleccionada para la Vista 2 (Atención)
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentAgendaItem | null>(null);

  // Observaciones y estado del trámite en la Vista 2
  const [observaciones, setObservaciones] = useState('');
  const [resultadoFinal, setResultadoFinal] = useState<'en_proceso' | 'aceptado' | 'rechazado'>('en_proceso');

  // Lista de citas en vivo (sincronizada con las tablas de la agenda)
  const [agendaList, setAgendaList] = useState<AppointmentAgendaItem[]>([
    {
      codigo: 'T-005',
      hora: '11:00',
      cliente: 'Sofía Ramírez',
      dni: '45.678.921',
      telefono: '+51 987 654 321',
      email: 'sofia.ramirez@email.com',
      tramite: 'Bloqueo de Tarjeta Multired',
      estado: 'pendiente',
      requisitos: [
        { id: 1, descripcion: 'DNI original y fotocopia vigente', estado: 'ok' },
        { id: 2, descripcion: 'Denuncia policial o carta de extravío', estado: 'ok' },
        { id: 3, descripcion: 'Formulario de Bloqueo F-101 firmado', estado: 'pendiente' },
      ],
    },
    {
      codigo: 'T-006',
      hora: '11:15',
      cliente: 'Pedro Sánchez',
      dni: '20.304.050',
      telefono: '+51 987 123 456',
      email: 'pedro.sanchez@email.com',
      tramite: 'Apertura de Cuentas de Ahorros',
      estado: 'pendiente',
      requisitos: [
        { id: 1, descripcion: 'DNI original y fotocopia vigente', estado: 'ok' },
        { id: 2, descripcion: 'Constancia o recibo de servicio de domicilio', estado: 'ok' },
        { id: 3, descripcion: 'Recibo de sueldo o sustento de ingresos', estado: 'baja' },
        { id: 4, descripcion: 'Formulario F-201 completado y firmado', estado: 'ok' },
        { id: 5, descripcion: 'Actualización de datos biométricos', estado: 'pendiente' },
        { id: 6, descripcion: 'Monto de apertura mínimo abonado S/ 20.00', estado: 'pendiente' },
      ],
    },
    {
      codigo: 'T-007',
      hora: '11:30',
      cliente: 'Lucía Flores',
      dni: '30.405.060',
      telefono: '+51 955 443 322',
      email: 'lucia.flores@email.com',
      tramite: 'Solicitud de Crédito Hipotecario',
      estado: 'pendiente',
      requisitos: [
        { id: 1, descripcion: 'DNI del titular y cónyuge (original y copia)', estado: 'ok' },
        { id: 2, descripcion: 'Últimas 3 boletas de pago de haberes', estado: 'ok' },
        { id: 3, descripcion: 'HR y PU del inmueble emitido por la municipalidad', estado: 'ok' },
      ],
    },
    {
      codigo: 'T-008',
      hora: '11:45',
      cliente: 'Diego Morales',
      dni: '40.506.070',
      telefono: '+51 912 345 678',
      email: 'diego.morales@email.com',
      tramite: 'Transferencia Internacional / Giro',
      estado: 'pendiente',
      requisitos: [
        { id: 1, descripcion: 'DNI del ordenante vigente', estado: 'ok' },
        { id: 2, descripcion: 'Declaración jurada de origen de fondos', estado: 'ok' },
      ],
    },
    {
      codigo: 'T-009',
      hora: '12:00',
      cliente: 'Elena Castro',
      dni: '10.203.040',
      telefono: '+51 944 556 677',
      email: 'elena.castro@email.com',
      tramite: 'Actualización de Datos de Cuenta',
      estado: 'pendiente',
      requisitos: [
        { id: 1, descripcion: 'DNI original del titular', estado: 'ok' },
        { id: 2, descripcion: 'Firma de ficha de actualización biometrizada', estado: 'ok' },
      ],
    },
    {
      codigo: 'T-011',
      hora: '12:30',
      cliente: 'Valeria Ruiz',
      dni: '50.607.080',
      telefono: '+51 922 334 455',
      email: 'valeria.ruiz@email.com',
      tramite: 'Solicitud de Tarjeta Multired',
      estado: 'pendiente',
      requisitos: [
        { id: 1, descripcion: 'DNI original y fotocopia', estado: 'ok' },
        { id: 2, descripcion: 'Comprobante de domicilio reciente', estado: 'ok' },
      ],
    },
  ]);

  useEffect(() => {
    // Cargar datos de la sesión del usuario guardada en localStorage
    const storedSession = localStorage.getItem('bn_user_session');
    if (storedSession) {
      try {
        const s = JSON.parse(storedSession);
        if (s.nombre) setOperatorName(s.nombre);
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Iniciar atención de una cita seleccionada
  const handleStartAttention = (item: AppointmentAgendaItem) => {
    setSelectedAppointment(item);
    setObservaciones('');
    setResultadoFinal('en_proceso');
    setActiveView('atencion');
  };

  // Buscar manualmente por código ingresado en el input izquierdo
  const handleManualCodeSearch = () => {
    if (!manualCodeInput.trim()) return;
    const match = agendaList.find(
      (a) => a.codigo.toLowerCase() === manualCodeInput.trim().toLowerCase()
    );
    if (match) {
      handleStartAttention(match);
    } else {
      alert(`No se encontró ninguna cita registrada con el código: ${manualCodeInput}`);
    }
  };

  // Cambiar el estado de un requisito individual ('ok' | 'baja')
  const handleToggleRequirementState = (reqId: number, newState: 'ok' | 'baja') => {
    if (!selectedAppointment) return;

    const updatedReqs = selectedAppointment.requisitos.map((r) =>
      r.id === reqId ? { ...r, estado: newState } : r
    );

    setSelectedAppointment({
      ...selectedAppointment,
      requisitos: updatedReqs,
    });
  };

  // Finalizar atención y retornar a la vista de agenda
  const handleFinishAttention = () => {
    if (selectedAppointment) {
      const updatedAgenda = agendaList.map((item) =>
        item.codigo === selectedAppointment.codigo
          ? {
              ...item,
              estado: resultadoFinal === 'rechazado' ? ('rechazada' as const) : ('atendida' as const),
            }
          : item
      );
      setAgendaList(updatedAgenda);
    }
    setActiveView('agenda');
  };

  // Siguiente cliente en cola
  const handleNextClientInQueue = () => {
    const pendingList = agendaList.filter((a) => a.estado === 'pendiente');
    if (pendingList.length > 0) {
      handleStartAttention(pendingList[0]);
    } else {
      alert('No hay más clientes pendientes en la cola de hoy.');
    }
  };

  // Filtrado de la agenda
  const filteredAgenda = agendaList.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.cliente.toLowerCase().includes(q) ||
      item.codigo.toLowerCase().includes(q) ||
      item.tramite.toLowerCase().includes(q)
    );
  });

  // Cálculo dinámico del resumen de requerimientos para la Vista 2
  const totalReqs = selectedAppointment?.requisitos.length || 0;
  const countOk = selectedAppointment?.requisitos.filter((r) => r.estado === 'ok').length || 0;
  const countBaja = selectedAppointment?.requisitos.filter((r) => r.estado === 'baja').length || 0;
  const countPendiente = selectedAppointment?.requisitos.filter((r) => r.estado === 'pendiente').length || 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-red-600 selection:text-white">
      {/* 1. HEADER INSTITUCIONAL CON NOMBRE DEL OPERADOR Y VENTANILLA */}
      <header className="bg-white border-b border-slate-200 py-3 px-6 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:opacity-95 transition-opacity">
              <LogoBancoNacion showSubtitle={false} className="h-10" />
            </Link>
            <div className="h-6 w-px bg-slate-200 hidden sm:block" />
            <div className="text-xs text-slate-700 font-bold hidden sm:block">
              Hola, <strong className="text-slate-900">{operatorName}</strong> | <span className="text-red-700">{agenciaNombre}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-4 py-2 bg-slate-900 text-white font-extrabold text-xs rounded-xl shadow tracking-wider uppercase">
              {ventanillaNumero}
            </span>
          </div>
        </div>
      </header>

      {/* NAVEGACIÓN Y TÍTULO DE LA VISTA */}
      <div className="bg-white border-b border-slate-200 py-3 shadow-inner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
            <button
              onClick={() => setActiveView('agenda')}
              className={`hover:text-red-700 uppercase tracking-wider ${activeView === 'agenda' ? 'text-red-700 font-black underline' : ''}`}
            >
              Agenda
            </button>
            {activeView === 'atencion' && (
              <>
                <span>/</span>
                <span className="text-slate-900 uppercase font-black">Atención de usuario</span>
              </>
            )}
          </div>

          {activeView === 'atencion' && (
            <button
              onClick={handleNextClientInQueue}
              className="px-5 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider shadow-md transition flex items-center gap-2"
            >
              <span>Siguiente Cliente</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* ========================================================================= */}
        {/* VISTA 1: INTERFAZ PRINCIPAL DE AGENDA Y BÚSQUEDA POR CÓDIGO (BOCETO 1) */}
        {/* ========================================================================= */}
        {activeView === 'agenda' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* COLUMNA IZQUIERDA: ESCÁNER / INGRESO MANUAL DE CÓDIGO + RESULTADO */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Caja de Ingreso Manual del Código */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xl space-y-4 text-center">
                <div className="flex justify-center">
                  <QRCodeSVG value={manualCodeInput || 'BN-ESCANER'} size={110} />
                </div>
                <h3 className="font-extrabold text-slate-900 text-sm uppercase">
                  Ingreso Manual del Código
                </h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ingresa Código de Atención (ej: T-005)..."
                    value={manualCodeInput}
                    onChange={(e) => setManualCodeInput(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-red-600"
                  />
                  <button
                    onClick={handleManualCodeSearch}
                    className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider shadow"
                  >
                    Buscar
                  </button>
                </div>
              </div>

              {/* Caja de Tarjeta de Resultado */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xl space-y-4">
                <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider text-center border-b border-slate-100 pb-2">
                  Tarjeta de Resultado
                </h3>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-slate-500 font-bold block">Cliente:</span>
                    <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg font-bold text-slate-900">
                      {selectedAppointment ? selectedAppointment.cliente : 'Ningún cliente seleccionado'}
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-500 font-bold block">Trámite:</span>
                    <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg font-bold text-slate-900">
                      {selectedAppointment ? selectedAppointment.tramite : 'Por seleccionar de la agenda'}
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-500 font-bold block">Fecha y Hora de Atención:</span>
                    <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg font-bold text-slate-900">
                      {selectedAppointment ? `${selectedDate} - ${selectedAppointment.hora} hs` : 'Sin horario activo'}
                    </div>
                  </div>
                </div>

                <button
                  disabled={!selectedAppointment}
                  onClick={() => selectedAppointment && handleStartAttention(selectedAppointment)}
                  className="w-full py-3.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-extrabold rounded-xl shadow-lg transition text-sm uppercase tracking-wider disabled:opacity-40"
                >
                  Iniciar Atención
                </button>
              </div>
            </div>

            {/* COLUMNA DERECHA: LISTA DE AGENDA DE HOY */}
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <h3 className="font-black text-slate-900 text-xl tracking-tight uppercase">
                  Lista de Agenda de Hoy - <span className="text-red-700">{agenciaNombre}</span>
                </h3>

                {/* Filtros de la Agenda */}
                <div className="flex gap-3">
                  <select
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-red-600"
                  >
                    <option value="2026-09-18">18/09/2026 (Hoy)</option>
                    <option value="2026-09-19">19/09/2026 (Mañana)</option>
                  </select>

                  <div className="relative">
                    <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Buscar por nombre..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-medium focus:outline-none focus:border-red-600"
                    />
                  </div>
                </div>
              </div>

              {/* Tabla de la Agenda del Boceto 1 */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-900 text-white uppercase text-[11px] font-black">
                    <tr>
                      <th className="p-3.5 rounded-l-xl">Hora</th>
                      <th className="p-3.5">Código</th>
                      <th className="p-3.5">Cliente</th>
                      <th className="p-3.5">Trámite</th>
                      <th className="p-3.5 text-center rounded-r-xl">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-medium">
                    {filteredAgenda.map((item, idx) => {
                      const isSelected = selectedAppointment?.codigo === item.codigo;
                      return (
                        <React.Fragment key={item.codigo}>
                          {/* Fila de descanso a las 12:00 hs como en la imagen */}
                          {idx === 4 && (
                            <tr className="bg-amber-50 text-amber-800 font-black text-center text-xs">
                              <td colSpan={5} className="py-2.5 tracking-widest uppercase border-y border-amber-200">
                                ☕ Descanso — 12:00 hs
                              </td>
                            </tr>
                          )}

                          <tr
                            onClick={() => setSelectedAppointment(item)}
                            className={`cursor-pointer transition ${
                              isSelected
                                ? 'bg-red-50 border-l-4 border-red-600 font-bold'
                                : 'hover:bg-slate-50'
                            }`}
                          >
                            <td className="p-3.5 font-bold text-slate-900">{item.hora} hs</td>
                            <td className="p-3.5 font-mono font-bold text-red-700">{item.codigo}</td>
                            <td className="p-3.5 font-bold text-slate-900">{item.cliente}</td>
                            <td className="p-3.5">{item.tramite}</td>
                            <td className="p-3.5 text-center">
                              {item.estado === 'atendida' ? (
                                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-black rounded-full text-[10px] uppercase">
                                  ATENDIDO
                                </span>
                              ) : item.estado === 'rechazada' ? (
                                <span className="px-3 py-1 bg-red-100 text-red-800 font-black rounded-full text-[10px] uppercase">
                                  RECHAZADO
                                </span>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStartAttention(item);
                                  }}
                                  className="px-4 py-2 bg-slate-900 hover:bg-red-600 text-white font-extrabold rounded-lg transition text-[11px] uppercase tracking-wider shadow"
                                >
                                  Realizar Trámite
                                </button>
                              )}
                            </td>
                          </tr>
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VISTA 2: INTERFAZ DE ATENCIÓN DEL USUARIO Y VALIDACIÓN (BOCETO 2) */}
        {/* ========================================================================= */}
        {activeView === 'atencion' && selectedAppointment && (
          <div className="space-y-6 animate-fadeIn">
            {/* Sub-header de atención en curso */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-black rounded-full text-xs uppercase tracking-widest border border-emerald-300">
                  ATENCIÓN EN CURSO
                </span>
                <h2 className="text-lg font-black text-slate-900">
                  {selectedAppointment.cliente}
                </h2>
              </div>
              <div className="text-xs font-bold text-slate-600">
                Tiempo de Atención: <strong className="text-red-700">{selectedDate} - {selectedAppointment.hora} hs</strong>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              
              {/* COLUMNA 1: DATOS DEL CLIENTE (BOCETO 2 - IZQUIERDA) */}
              <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-4">
                <div className="space-y-4 text-center">
                  {/* Avatar circular del cliente */}
                  <div className="w-20 h-20 rounded-full bg-slate-800 border-4 border-slate-200 flex items-center justify-center font-black text-white text-2xl mx-auto shadow-md">
                    <UserIcon className="w-10 h-10 text-white" />
                  </div>

                  <div>
                    <h3 className="font-black text-slate-900 text-lg leading-tight">
                      {selectedAppointment.cliente}
                    </h3>
                    <span className="inline-block mt-1 px-3 py-0.5 bg-slate-900 text-white font-extrabold text-[10px] rounded-full uppercase tracking-wider">
                      En atención
                    </span>
                  </div>

                  <div className="space-y-3 text-left text-xs text-slate-700 pt-3 border-t border-slate-100">
                    <div>
                      <span className="text-slate-400 font-bold block text-[10px] uppercase">Código de Turno</span>
                      <strong className="font-mono text-red-700 font-black text-sm">{selectedAppointment.codigo}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block text-[10px] uppercase">DNI / CUIT</span>
                      <strong className="text-slate-900">{selectedAppointment.dni}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block text-[10px] uppercase">Teléfono</span>
                      <strong className="text-slate-900">{selectedAppointment.telefono}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block text-[10px] uppercase">Email</span>
                      <strong className="text-slate-900 truncate block">{selectedAppointment.email}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block text-[10px] uppercase">Trámite Solicitado</span>
                      <strong className="text-slate-900">{selectedAppointment.tramite}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block text-[10px] uppercase">Hora de Turno</span>
                      <strong className="text-slate-900">{selectedAppointment.hora} hs</strong>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => alert('La atención ya ha sido iniciada.')}
                  className="w-full py-3 bg-slate-100 text-slate-800 font-extrabold rounded-xl text-xs uppercase tracking-wider border border-slate-300"
                >
                  INICIAR CON LA ATENCIÓN
                </button>
              </div>

              {/* COLUMNA 2: REQUERIMIENTOS DEL TRÁMITE CON BOTONES ✓ OK / ✕ BAJA (BOCETO 2 - CENTRO) */}
              <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-4">
                <div className="space-y-4">
                  <div className="border-b border-slate-200 pb-3">
                    <h3 className="font-extrabold text-slate-900 text-base uppercase">
                      Requerimientos del Trámite
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      {selectedAppointment.tramite} — Marque cada item o dé de baja si no cumple
                    </p>
                  </div>

                  {/* Lista de Requisitos con Botones ✓ OK y ✕ Baja del Boceto 2 */}
                  <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                    {selectedAppointment.requisitos.map((req) => (
                      <div
                        key={req.id}
                        className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition ${
                          req.estado === 'ok'
                            ? 'bg-emerald-50 border-emerald-300'
                            : req.estado === 'baja'
                            ? 'bg-red-50 border-red-300'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {req.estado === 'ok' ? (
                            <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                              ✓
                            </div>
                          ) : req.estado === 'baja' ? (
                            <div className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                              ✕
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-slate-300 text-slate-600 flex items-center justify-center font-bold text-xs shrink-0">
                              ?
                            </div>
                          )}
                          <span className="text-xs font-extrabold text-slate-900 leading-tight">
                            {req.descripcion}
                          </span>
                        </div>

                        {/* Botones duales ✓ OK y ✕ Baja */}
                        <div className="flex gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleToggleRequirementState(req.id, 'ok')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-black transition border ${
                              req.estado === 'ok'
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow'
                                : 'bg-white text-slate-700 hover:bg-emerald-100 border-slate-300'
                            }`}
                          >
                            ✓ OK
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleRequirementState(req.id, 'baja')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-black transition border ${
                              req.estado === 'baja'
                                ? 'bg-red-600 text-white border-red-600 shadow'
                                : 'bg-white text-slate-700 hover:bg-red-100 border-slate-300'
                            }`}
                          >
                            ✕ Baja
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* COLUMNA 3: ACCIONES, TIEMPO Y RESUMEN DE VERIFICACIÓN (BOCETO 2 - DERECHA) */}
              <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-4">
                <div className="space-y-4">
                  <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider border-b border-slate-200 pb-2">
                    Acciones
                  </h3>

                  {/* Estado del trámite */}
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase block mb-1">Estado del trámite</span>
                    <div className="bg-slate-900 text-amber-400 p-2.5 rounded-xl font-black text-xs text-center uppercase tracking-wider flex items-center justify-center gap-2">
                      <ClockIcon className="w-4 h-4 text-amber-400" />
                      <span>{resultadoFinal === 'aceptado' ? '✓ ACEPTADO' : resultadoFinal === 'rechazado' ? '✕ RECHAZADO' : '⌛ En proceso'}</span>
                    </div>
                  </div>

                  {/* Resumen de verificación dinámico del Boceto 2 */}
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2 text-xs">
                    <span className="font-black text-slate-800 uppercase block border-b border-slate-200 pb-1">
                      Resumen de verificación
                    </span>
                    <div className="flex justify-between font-bold">
                      <span className="text-emerald-700">Cumplidos</span>
                      <span className="text-slate-900 font-black">{countOk} / {totalReqs}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span className="text-red-700">Dados de baja</span>
                      <span className="text-slate-900 font-black">{countBaja} / {totalReqs}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span className="text-slate-500">Pendientes</span>
                      <span className="text-slate-900 font-black">{countPendiente} / {totalReqs}</span>
                    </div>
                  </div>

                  {/* Textarea de Observaciones */}
                  <div>
                    <label className="text-xs font-extrabold text-slate-700 uppercase block mb-1">Observaciones</label>
                    <textarea
                      rows={3}
                      placeholder="Escribir nota opcional..."
                      value={observaciones}
                      onChange={(e) => setObservaciones(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 font-medium focus:outline-none focus:border-red-600"
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    onClick={() => setResultadoFinal('aceptado')}
                    className={`w-full py-2.5 font-extrabold rounded-xl text-xs uppercase tracking-wider shadow transition ${
                      resultadoFinal === 'aceptado'
                        ? 'bg-emerald-700 text-white ring-2 ring-emerald-500'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    ✓ Aceptar Trámite
                  </button>

                  <button
                    onClick={() => setResultadoFinal('rechazado')}
                    className={`w-full py-2.5 font-extrabold rounded-xl text-xs uppercase tracking-wider shadow transition ${
                      resultadoFinal === 'rechazado'
                        ? 'bg-red-800 text-white ring-2 ring-red-500'
                        : 'bg-red-600 hover:bg-red-700 text-white'
                    }`}
                  >
                    ✕ Rechazar Trámite
                  </button>

                  <button
                    onClick={handleFinishAttention}
                    className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider transition mt-2 shadow-md"
                  >
                    Finalizar Atención
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* FOOTER INSTITUCIONAL */}
      <footer className="bg-white border-t border-slate-200 py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <LogoBancoNacion showSubtitle={false} className="h-9" />
          <Link
            href="/login"
            className="flex items-center gap-2 text-xs font-extrabold text-slate-700 hover:text-red-700 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-xl transition uppercase"
          >
            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Cerrar Sesión</span>
          </Link>
        </div>
      </footer>
    </div>
  );
}
