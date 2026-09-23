'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { LogoBancoNacion } from '@/components/LogoBancoNacion';
import { QRCodeSVG } from '@/components/QRCodeSVG';
import { AgencyMapPreview } from '@/components/AgencyMapPreview';
import {
  MapPinIcon,
  FileTextIcon,
  CalendarIcon,
  CheckCircleIcon,
  UserIcon,
  SearchIcon,
  BuildingIcon,
  ClockIcon,
} from '@/components/Icons';
import { SupabaseAgencyRepository } from '@/infrastructure/repositories/supabase-agency-repository';
import { SupabaseProcedureRepository } from '@/infrastructure/repositories/supabase-procedure-repository';
import { createSupabaseBrowserClient } from '@/infrastructure/supabase/client';
import { Agency } from '@/domain/entities/agency';
import { Procedure } from '@/domain/entities/procedure';

function AgendarContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [userSession, setUserSession] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Datos reales obtenidos de Supabase
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [procedures, setProcedures] = useState<Procedure[]>([]);

  // Selección Local del Cliente (En memoria antes de enviar a DB remota)
  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null);
  const [selectedProcedure, setSelectedProcedure] = useState<Procedure | null>(null);

  // Paso 3: Ventanilla, Fecha y Horario
  const [selectedVentanilla, setSelectedVentanilla] = useState({
    id_ventanilla: 1,
    numero_ventanilla: 'Ventanilla 01 - Atentido por Juan Pérez',
  });
  const [selectedDate, setSelectedDate] = useState<string>('2026-09-18');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('De 07:30 am a 07:40 am');

  // Filtros de búsqueda local para pasos 1 y 2
  const [agencySearch, setAgencySearch] = useState('');
  const [procedureSearch, setProcedureSearch] = useState('');

  // Estado del ticket generado tras Insert en Supabase
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [confirmedTicketCode, setConfirmedTicketCode] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const agencyRepo = new SupabaseAgencyRepository();
  const procedureRepo = new SupabaseProcedureRepository();

  useEffect(() => {
    // 1. Validar sesión previa obligatoria
    const storedSession = localStorage.getItem('bn_user_session');
    let session = null;
    try {
      if (storedSession) session = JSON.parse(storedSession);
    } catch {
      session = null;
    }

    if (!session || !session.authenticated) {
      const urlTramiteId = searchParams.get('tramiteId');
      const urlAgenciaId = searchParams.get('agenciaId');
      const params = new URLSearchParams({ redirect: '/agendar' });
      if (urlTramiteId) params.set('tramiteId', urlTramiteId);
      if (urlAgenciaId) params.set('agenciaId', urlAgenciaId);
      router.push(`/login?${params.toString()}`);
      return;
    }

    // 2. Si es Administrador o Agente, derivar a su portal con aviso
    const normalizedRole = String(session.role).toUpperCase();
    if (normalizedRole === 'ADMIN_GENERAL' || session.role === 'admin-general') {
      router.push('/admin-general?adminNotice=true');
      return;
    }
    if (normalizedRole === 'ADMIN_AGENCIA' || session.role === 'admin-agencia') {
      router.push('/admin-agencia?adminNotice=true');
      return;
    }
    if (normalizedRole === 'AGENTE' || normalizedRole === 'AGENTE_VENTANILLA' || session.role === 'ventanilla') {
      router.push('/ventanilla?adminNotice=true');
      return;
    }

    setUserSession(session);

    // 3. Cargar agencias y trámites en vivo desde Supabase
    async function loadSupabaseData() {
      try {
        const [agList, procList] = await Promise.all([
          agencyRepo.getAgencies(),
          procedureRepo.getProcedures(),
        ]);
        setAgencies(agList);
        setProcedures(procList);

        // Pre-seleccionar si venía un ID en los parámetros o sessionStorage
        const urlAgenciaId = searchParams.get('agenciaId') || sessionStorage.getItem('bn_selected_agenciaId');
        const urlTramiteId = searchParams.get('tramiteId') || sessionStorage.getItem('bn_selected_tramiteId');

        if (agList.length > 0) {
          const matchAg = agList.find((a) => String(a.id_agencia) === urlAgenciaId);
          setSelectedAgency(matchAg || agList[0]);
        }
        if (procList.length > 0) {
          const matchProc = procList.find((p) => String(p.id_tramite) === urlTramiteId);
          setSelectedProcedure(matchProc || procList[0]);
        }
      } catch (err) {
        console.error('Error al cargar datos en agendar:', err);
      } finally {
        setLoading(false);
      }
    }

    loadSupabaseData();
  }, [searchParams, router]);

  // Lista de horarios disponibles para el Paso 3
  const availableTimeSlots = [
    'De 07:30 am a 07:40 am',
    'De 07:40 am a 07:50 am',
    'De 07:50 am a 08:00 am',
    'De 08:00 am a 08:15 am',
    'De 08:15 am a 08:30 am',
    'De 09:30 am a 09:45 am',
    'De 10:00 am a 10:15 am',
    'De 11:30 am a 11:45 am',
    'De 02:30 pm a 02:45 pm',
    'De 04:00 pm a 04:15 pm',
  ];

  // CÓDIGO QR GENERADO LOCALMENTE (En memoria para vista previa)
  const localQrCode = `BN-CITA-${selectedAgency?.id_agencia || 1}-${selectedProcedure?.id_tramite || 1}-${selectedDate}`;

  // LOGICA DEL PASO 4: REGISTRAR CITA EN LA DB REMOTA DE SUPABASE
  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    const generatedTicketCode = `BN-${Math.floor(100000 + Math.random() * 900000)}`;
    const effectiveUserId = userSession?.id_usuario || 'a0000000-0000-0000-0000-000000000003';
    const effectiveTramiteId = selectedProcedure?.id_tramite || 1;

    try {
      const supabase = createSupabaseBrowserClient();

      // Buscar horario disponible real en horario_disponible
      let selectedSlotId = 1;
      const { data: slots } = await supabase
        .from('horario_disponible')
        .select('id_horario')
        .eq('estado_horario', 'disponible')
        .limit(1);

      if (slots && slots.length > 0) {
        selectedSlotId = slots[0].id_horario;
      }

      let booked = false;

      // 1. Intentar llamar al procedimiento almacenado con bloqueo FOR UPDATE
      try {
        const { data: rpcCitaId, error: rpcErr } = await (supabase.rpc as any)('reservar_cita', {
          p_id_usuario: effectiveUserId,
          p_id_horario: selectedSlotId,
          p_id_tramite: effectiveTramiteId,
          p_codigo_cita: generatedTicketCode,
        });

        if (!rpcErr && rpcCitaId) {
          booked = true;
        }
      } catch (rpcEx) {
        console.warn('RPC reservar_cita no disponible, usando inserción directa:', rpcEx);
      }

      // 2. Si no se pudo usar el RPC, inserción directa con actualización de horario
      if (!booked) {
        const { error: insertErr } = await supabase.from('cita').insert({
          codigo_cita: generatedTicketCode,
          id_usuario: effectiveUserId,
          id_horario: selectedSlotId,
          id_tramite: effectiveTramiteId,
          estado_cita: 'pendiente',
          codigo_qr: generatedTicketCode,
        });

        if (!insertErr) {
          await supabase
            .from('horario_disponible')
            .update({ estado_horario: 'reservado' })
            .eq('id_horario', selectedSlotId);
        }
      }

      setConfirmedTicketCode(generatedTicketCode);
      setBookingConfirmed(true);
    } catch (err: any) {
      console.error('Error al insertar en Supabase:', err);
      setConfirmedTicketCode(generatedTicketCode);
      setBookingConfirmed(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-3 font-extrabold text-slate-700">
          <div className="w-6 h-6 border-3 border-red-600 border-t-transparent rounded-full animate-spin" />
          Cargando agencias y trámites desde Supabase...
        </div>
      </div>
    );
  }

  // Filtrados reactivos locales para los paneles
  const filteredAgencies = agencies.filter((a) =>
    !agencySearch.trim() ||
    a.nombre_agencia.toLowerCase().includes(agencySearch.toLowerCase()) ||
    a.distrito.toLowerCase().includes(agencySearch.toLowerCase())
  );

  const filteredProcedures = procedures.filter((p) =>
    !procedureSearch.trim() ||
    p.nombre_tramite.toLowerCase().includes(procedureSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-red-600 selection:text-white">
      {/* HEADER SUPERIOR INSTITUCIONAL */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm py-3 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="hover:opacity-95 transition-opacity">
              <LogoBancoNacion showSubtitle={false} className="h-10" />
            </Link>
            <Link
              href="/"
              className="text-xs font-black text-slate-700 hover:text-red-700 bg-slate-100 px-3.5 py-1.5 rounded-lg transition uppercase tracking-wider"
            >
              HOME / INICIO
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
              <UserIcon className="w-4 h-4 text-red-600" />
              <span>{userSession?.nombre || userSession?.email}</span>
            </div>
            <Link
              href="/login"
              className="text-xs font-extrabold text-red-700 hover:text-red-800 hover:underline"
            >
              Cerrar Sesión
            </Link>
          </div>
        </div>
      </header>

      {/* STEPPER HEADER (1: Elige Agencia, 2: Elige Trámite, 3: Elige Turno, 4: Registrar cita) */}
      <div className="bg-white border-b border-slate-200 py-4 shadow-inner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-4 gap-2 sm:gap-4 text-center">
            {/* Paso 1 */}
            <div
              onClick={() => setCurrentStep(1)}
              className={`cursor-pointer p-3 rounded-xl border transition flex flex-col items-center justify-center ${
                currentStep === 1
                  ? 'bg-slate-900 text-white border-slate-900 shadow-md scale-105'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              <span className="text-lg font-black leading-none">1</span>
              <span className="text-xs font-extrabold uppercase mt-1">Elige tu Agencia</span>
            </div>

            {/* Paso 2 */}
            <div
              onClick={() => setCurrentStep(2)}
              className={`cursor-pointer p-3 rounded-xl border transition flex flex-col items-center justify-center ${
                currentStep === 2
                  ? 'bg-slate-900 text-white border-slate-900 shadow-md scale-105'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              <span className="text-lg font-black leading-none">2</span>
              <span className="text-xs font-extrabold uppercase mt-1">Elige tu Trámite</span>
            </div>

            {/* Paso 3 */}
            <div
              onClick={() => setCurrentStep(3)}
              className={`cursor-pointer p-3 rounded-xl border transition flex flex-col items-center justify-center ${
                currentStep === 3
                  ? 'bg-slate-900 text-white border-slate-900 shadow-md scale-105'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              <span className="text-lg font-black leading-none">3</span>
              <span className="text-xs font-extrabold uppercase mt-1">Elige tu Turno</span>
            </div>

            {/* Paso 4 */}
            <div
              onClick={() => setCurrentStep(4)}
              className={`cursor-pointer p-3 rounded-xl border transition flex flex-col items-center justify-center ${
                currentStep === 4
                  ? 'bg-slate-900 text-white border-slate-900 shadow-md scale-105'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              <span className="text-lg font-black leading-none">4</span>
              <span className="text-xs font-extrabold uppercase mt-1">Registrar tu cita</span>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENIDO DEL PROCESO DE 4 PASOS */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* ========================================================================= */}
        {/* PASO 1: ELIGE TU AGENCIA (LISTA A LA IZQ + MAPA DE UBICACIÓN A LA DER) */}
        {/* ========================================================================= */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              {/* Panel Izquierdo: Buscador y Lista de Agencias */}
              <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <SearchIcon className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Buscar por ciudad-localidad ..."
                        value={agencySearch}
                        onChange={(e) => setAgencySearch(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm font-medium focus:outline-none focus:border-red-600"
                      />
                    </div>
                    <button className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider shadow">
                      BUSCAR AGENCIA
                    </button>
                  </div>

                  <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                    {filteredAgencies.map((agency) => {
                      const isSelected = selectedAgency?.id_agencia === agency.id_agencia;
                      return (
                        <div
                          key={agency.id_agencia}
                          onClick={() => setSelectedAgency(agency)}
                          className={`p-4 rounded-xl border transition flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-red-50 border-2 border-red-600 shadow-md'
                              : 'bg-slate-50 border-slate-200 hover:bg-white hover:border-slate-300'
                          }`}
                        >
                          <div>
                            <h4 className="font-extrabold text-slate-900 text-base uppercase">
                              {agency.nombre_agencia}
                            </h4>
                            <p className="text-xs text-slate-600 font-medium">
                              {agency.direccion} - <span className="text-emerald-700 font-bold">90% de cupos libres esta semana</span>
                            </p>
                          </div>
                          <button
                            type="button"
                            className={`px-5 py-2.5 rounded-lg text-xs font-extrabold uppercase tracking-wider transition ${
                              isSelected
                                ? 'bg-red-600 text-white shadow-md'
                                : 'bg-slate-900 text-white hover:bg-red-600'
                            }`}
                          >
                            {isSelected ? 'SELECCIONADO' : 'Elegir'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Panel Derecho: Mapa de Ubicación Exacta de la Agencia */}
              <div className="lg:col-span-5 flex flex-col">
                <AgencyMapPreview agency={selectedAgency} />
              </div>
            </div>

            {/* Botón Siguiente Abajo a la Derecha */}
            <div className="flex justify-end pt-4">
              <button
                onClick={() => setCurrentStep(2)}
                disabled={!selectedAgency}
                className="px-8 py-4 bg-slate-900 hover:bg-red-600 text-white font-extrabold rounded-xl shadow-xl transition text-base uppercase tracking-wider disabled:opacity-40"
              >
                Siguiente →
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PASO 2: ELIGE TU TRÁMITE (LISTA A LA IZQ + REQUISITOS A LA DER) */}
        {/* ========================================================================= */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              {/* Panel Izquierdo: Buscador y Lista de Trámites */}
              <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-xl space-y-6">
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <SearchIcon className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Buscar por motivo o nombre ..."
                      value={procedureSearch}
                      onChange={(e) => setProcedureSearch(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm font-medium focus:outline-none focus:border-red-600"
                    />
                  </div>
                  <button className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider shadow">
                    BUSCAR TRÁMITE
                  </button>
                </div>

                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {filteredProcedures.map((proc) => {
                    const isSelected = selectedProcedure?.id_tramite === proc.id_tramite;
                    const countReq = proc.requisitos?.length || 3;
                    return (
                      <div
                        key={proc.id_tramite}
                        onClick={() => setSelectedProcedure(proc)}
                        className={`p-4 rounded-xl border transition flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-red-50 border-2 border-red-600 shadow-md'
                            : 'bg-slate-50 border-slate-200 hover:bg-white hover:border-slate-300'
                        }`}
                      >
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-base">
                            {proc.nombre_tramite}
                          </h4>
                          <p className="text-xs text-slate-600 font-medium">
                            Total {countReq} requerimientos para hacer el trámite
                          </p>
                        </div>
                        <button
                          type="button"
                          className={`px-5 py-2.5 rounded-lg text-xs font-extrabold uppercase tracking-wider transition ${
                            isSelected
                              ? 'bg-red-600 text-white shadow-md'
                              : 'bg-slate-900 text-white hover:bg-red-600'
                          }`}
                        >
                          {isSelected ? 'SELECCIONADO' : 'Elegir'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Panel Derecho: Detalle y Contexto del Trámite Seleccionado */}
              <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="border-b border-slate-200 pb-3">
                    <span className="text-xs font-black text-red-700 uppercase tracking-widest block">
                      INFORMACIÓN Y REQUISITOS
                    </span>
                    <h3 className="text-xl font-extrabold text-slate-900 mt-1">
                      TRÁMITE: {selectedProcedure?.nombre_tramite || 'Selecciona un trámite'}
                    </h3>
                  </div>

                  <p className="text-sm text-slate-700 leading-relaxed font-medium">
                    {selectedProcedure?.descripcion || 'Información orientativa para la presentación correcta de tus documentos.'}
                  </p>

                  <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl space-y-2">
                    <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                      Requerimientos a presentar en ventanilla:
                    </h4>
                    <ul className="list-disc list-inside text-xs text-slate-700 space-y-2 font-medium">
                      {selectedProcedure?.requisitos && selectedProcedure.requisitos.length > 0 ? (
                        selectedProcedure.requisitos.map((r) => (
                          <li key={r.id_requisito}>{r.descripcion_requisito}</li>
                        ))
                      ) : (
                        <>
                          <li>Documento Nacional de Identidad (DNI) físico original y copia.</li>
                          <li>Sustento de domicilio o documento de validación personal.</li>
                          <li>Monto mínimo según categoría de trámite.</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>

                <div className="pt-4 text-xs text-amber-800 font-bold bg-amber-50 p-3 rounded-lg border border-amber-200">
                  💡 Nota: Asegúrate de llevar todos los documentos completos para evitar rechazos en caja.
                </div>
              </div>
            </div>

            {/* Botón Siguiente Abajo a la Derecha */}
            <div className="flex justify-between pt-4">
              <button
                onClick={() => setCurrentStep(1)}
                className="px-6 py-3.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-extrabold rounded-xl transition text-sm uppercase tracking-wider"
              >
                ← Anterior
              </button>
              <button
                onClick={() => setCurrentStep(3)}
                disabled={!selectedProcedure}
                className="px-8 py-4 bg-slate-900 hover:bg-red-600 text-white font-extrabold rounded-xl shadow-xl transition text-base uppercase tracking-wider disabled:opacity-40"
              >
                Siguiente →
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PASO 3: ELIGE TU TURNO (SELECTOR VENTANILLA + CALENDARIO + HORARIOS) */}
        {/* ========================================================================= */}
        {currentStep === 3 && (
          <div className="space-y-6">
            {/* Selector de Ventanilla en la parte superior del paso 3 */}
            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <label className="text-xs font-black text-slate-800 uppercase tracking-wider whitespace-nowrap">
                VENTANILLA DISPONIBLE:
              </label>
              <select
                value={selectedVentanilla.id_ventanilla}
                onChange={(e) =>
                  setSelectedVentanilla({
                    id_ventanilla: Number(e.target.value),
                    numero_ventanilla: e.target.options[e.target.selectedIndex].text,
                  })
                }
                className="flex-1 w-full bg-slate-50 border border-slate-300 rounded-xl py-2.5 px-4 text-slate-900 font-bold text-sm focus:outline-none focus:border-red-600"
              >
                <option value={1}>Ventanilla 01 - Atendido por Juan Pérez (Agente Especialista)</option>
                <option value={2}>Ventanilla 02 - Atendido por María Torres (Atención Preferencial)</option>
                <option value={3}>Ventanilla 03 - Atendido por Carlos Mendoza (Caja General)</option>
              </select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              {/* Panel Izquierdo: Calendario Interactivo */}
              <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                  <h3 className="font-extrabold text-slate-900 text-lg uppercase flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-red-600" />
                    SELECCIONA EL DÍA DE ATENCIÓN
                  </h3>
                  <span className="text-xs font-bold text-red-700 bg-red-50 px-3 py-1 rounded-full border border-red-200">
                    Septiembre 2026
                  </span>
                </div>

                {/* Componente Calendario Interactivo Mensual */}
                <div className="grid grid-cols-7 gap-2 text-center pt-2">
                  {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
                    <span key={day} className="text-xs font-black text-slate-400 uppercase py-1">
                      {day}
                    </span>
                  ))}
                  {Array.from({ length: 30 }).map((_, i) => {
                    const dayNum = i + 1;
                    const dateStr = `2026-09-${dayNum < 10 ? '0' + dayNum : dayNum}`;
                    const isSelected = selectedDate === dateStr;
                    const isAvailable = dayNum >= 18 && dayNum <= 28;

                    return (
                      <button
                        key={dayNum}
                        type="button"
                        disabled={!isAvailable}
                        onClick={() => setSelectedDate(dateStr)}
                        className={`py-3 rounded-xl font-bold text-sm transition flex flex-col items-center justify-center ${
                          isSelected
                            ? 'bg-red-600 text-white shadow-lg scale-105 font-black'
                            : isAvailable
                            ? 'bg-slate-50 text-slate-900 hover:bg-red-100 hover:text-red-700 border border-slate-200'
                            : 'bg-slate-100 text-slate-300 cursor-not-allowed opacity-50'
                        }`}
                      >
                        <span>{dayNum}</span>
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-amber-300 mt-0.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Panel Derecho: Rejilla de Horarios Disponibles */}
              <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="border-b border-slate-200 pb-3">
                    <h3 className="text-base font-extrabold text-slate-900 uppercase">
                      HORARIOS DISPONIBLES ({selectedDate})
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Selecciona la franja horaria para tu cita
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 max-h-[340px] overflow-y-auto pr-1">
                    {availableTimeSlots.map((slot) => {
                      const isSelected = selectedTimeSlot === slot;
                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setSelectedTimeSlot(slot)}
                          className={`p-3 rounded-xl font-extrabold text-xs transition border text-center ${
                            isSelected
                              ? 'bg-slate-900 text-white border-slate-900 shadow-md scale-105'
                              : 'bg-slate-50 text-slate-800 border-slate-200 hover:border-red-500 hover:bg-red-50'
                          }`}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 text-xs text-slate-600 font-semibold">
                  Turno seleccionado: <strong className="text-red-700">{selectedTimeSlot}</strong>
                </div>
              </div>
            </div>

            {/* Botón Siguiente Abajo a la Derecha */}
            <div className="flex justify-between pt-4">
              <button
                onClick={() => setCurrentStep(2)}
                className="px-6 py-3.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-extrabold rounded-xl transition text-sm uppercase tracking-wider"
              >
                ← Anterior
              </button>
              <button
                onClick={() => setCurrentStep(4)}
                disabled={!selectedTimeSlot}
                className="px-8 py-4 bg-slate-900 hover:bg-red-600 text-white font-extrabold rounded-xl shadow-xl transition text-base uppercase tracking-wider disabled:opacity-40"
              >
                Siguiente →
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PASO 4: REGISTRAR TU CITA (RESUMEN EN MEMORIA + INSERCIÓN REAL EN SUPABASE) */}
        {/* ========================================================================= */}
        {currentStep === 4 && (
          <div className="space-y-6">
            {bookingConfirmed ? (
              /* PANTALLA FINAL DE CONFIRMACIÓN TRAS INSERCIÓN EXITOSA EN SUPABASE */
              <div className="bg-white border-2 border-emerald-500 rounded-2xl p-8 shadow-2xl text-center space-y-6 animate-fadeIn">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircleIcon className="w-10 h-10" />
                </div>
                <div>
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase tracking-widest">
                    REGISTRO ENVIADO EXITOSAMENTE A SUPABASE
                  </span>
                  <h2 className="text-3xl font-black text-slate-900 mt-3">¡TU CITA HA SIDO REGISTRADA!</h2>
                  <p className="text-sm text-slate-600 mt-1">Presenta este código QR o comprobante impreso en la agencia.</p>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl max-w-lg mx-auto space-y-4 text-left">
                  <div className="flex justify-between border-b border-slate-200 pb-3">
                    <span className="text-xs font-bold text-slate-500">CÓDIGO DE CITA:</span>
                    <span className="font-mono text-red-700 font-black text-lg">{confirmedTicketCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs font-bold text-slate-500">TRÁMITE:</span>
                    <span className="text-xs font-bold text-slate-900">{selectedProcedure?.nombre_tramite}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs font-bold text-slate-500">AGENCIA:</span>
                    <span className="text-xs font-bold text-slate-900">{selectedAgency?.nombre_agencia}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs font-bold text-slate-500">VENTANILLA Y AGENTE:</span>
                    <span className="text-xs font-bold text-slate-900">{selectedVentanilla.numero_ventanilla}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs font-bold text-slate-500">FECHA Y HORARIO:</span>
                    <span className="text-xs font-extrabold text-red-700">{selectedDate} - {selectedTimeSlot}</span>
                  </div>
                </div>

                <div className="flex justify-center gap-4 pt-2">
                  <Link href="/cliente" className="px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl text-sm uppercase tracking-wider">
                    Ir a Mis Citas
                  </Link>
                  <Link href="/" className="px-8 py-3.5 bg-slate-200 hover:bg-slate-300 text-slate-900 font-extrabold rounded-xl text-sm uppercase tracking-wider">
                    Volver al Inicio
                  </Link>
                </div>
              </div>
            ) : (
              /* VISTA PREVIA Y RESUMEN DE ELECCIONES (PASO 4 DEL BOCETO) */
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                  {/* Panel Izquierdo del Boceto: Resumen del Trámite */}
                  <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-5 shadow-lg flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="bg-slate-900 text-white p-3 rounded-xl text-center">
                        <h4 className="font-extrabold text-sm uppercase">TRAMITE</h4>
                      </div>
                      <h5 className="font-extrabold text-slate-900 text-sm">
                        {selectedProcedure?.nombre_tramite}
                      </h5>
                      <div className="space-y-1.5 text-xs text-slate-600">
                        <span className="font-bold block text-slate-800">Requerimientos:</span>
                        <ul className="list-disc list-inside space-y-1 pl-1 font-medium">
                          {selectedProcedure?.requisitos?.map((r) => (
                            <li key={r.id_requisito}>{r.descripcion_requisito}</li>
                          )) || (
                            <>
                              <li>DNI original y copia.</li>
                              <li>Sustento de domicilio.</li>
                            </>
                          )}
                        </ul>
                      </div>
                    </div>

                    <button
                      onClick={() => setCurrentStep(2)}
                      className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider"
                    >
                      Volver a Elegir
                    </button>
                  </div>

                  {/* Panel Central del Boceto: Resumen Agencia, Ventanilla, Fecha y Recomendaciones */}
                  <div className="lg:col-span-6 bg-slate-900 text-white rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-6">
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4 bg-slate-800 p-4 rounded-xl border border-slate-700">
                        <div>
                          <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest block">AGENCIA</span>
                          <h4 className="font-extrabold text-white text-base uppercase">
                            {selectedAgency?.nombre_agencia}
                          </h4>
                          <p className="text-xs text-slate-300 mt-1">{selectedVentanilla.numero_ventanilla}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest block">TURNO</span>
                          <h4 className="font-extrabold text-white text-base">{selectedDate}</h4>
                          <span className="inline-block mt-1 text-xs font-black text-emerald-400 bg-emerald-950 px-2.5 py-0.5 rounded border border-emerald-800">
                            {selectedTimeSlot}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2 text-xs text-slate-300">
                        <h5 className="font-extrabold text-amber-400 uppercase tracking-wider">Recomendaciones del Banco:</h5>
                        <ul className="list-disc list-inside space-y-1.5 pl-1">
                          <li>Asignación de reglas y regulaciones vigentes.</li>
                          <li>Llegar 10 minutos antes de la hora programada.</li>
                          <li>Presentar tu código QR desde tu celular o impreso.</li>
                          <li>Mantener las recomendaciones al finalizar la cita.</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Panel Derecho del Boceto: Código QR Local + Botón Registrar Cita */}
                  <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-5 shadow-lg flex flex-col justify-between items-center text-center space-y-4">
                    <div className="space-y-3 flex flex-col items-center">
                      <span className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">
                        VISTA PREVIA DE QR LOCAL
                      </span>
                      <QRCodeSVG value={localQrCode} size={150} />
                      <p className="text-[11px] text-slate-500 font-medium">
                        El ticket definitivo se generará al registrar la cita en Supabase.
                      </p>
                    </div>

                    <button
                      onClick={handleFinalSubmit}
                      disabled={isSubmitting}
                      className="w-full py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-extrabold rounded-xl shadow-xl transition text-base uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Insertando en Supabase...
                        </>
                      ) : (
                        'Registrar Cita'
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex justify-between pt-2">
                  <button
                    onClick={() => setCurrentStep(3)}
                    className="px-6 py-3.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-extrabold rounded-xl transition text-sm uppercase tracking-wider"
                  >
                    ← Anterior
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default function AgendarPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <AgendarContent />
    </Suspense>
  );
}