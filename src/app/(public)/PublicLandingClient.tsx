'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogoBancoNacion } from '@/components/LogoBancoNacion';
import {
  MapPinIcon,
  FileTextIcon,
  CalendarIcon,
  CheckCircleIcon,
  UserIcon,
  SearchIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  BuildingIcon,
  ClockIcon,
} from '@/components/Icons';
import { SupabaseAgencyRepository } from '@/infrastructure/repositories/supabase-agency-repository';
import { SupabaseProcedureRepository } from '@/infrastructure/repositories/supabase-procedure-repository';
import { Agency } from '@/domain/entities/agency';
import { Procedure } from '@/domain/entities/procedure';

export default function PublicLandingClient() {
  const router = useRouter();

  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Filtros de Trámites
  const [procedureSearch, setProcedureSearch] = useState('');
  const [expandedProcedureId, setExpandedProcedureId] = useState<number | null>(null);

  // Filtros de Agencias
  const [districtFilter, setDistrictFilter] = useState('Todas las agencias');
  const [agencySearch, setAgencySearch] = useState('');

  const agencyRepo = new SupabaseAgencyRepository();
  const procedureRepo = new SupabaseProcedureRepository();

  // Consulta en tiempo real directa a Supabase al cargar la página
  useEffect(() => {
    async function fetchSupabaseData() {
      setLoading(true);
      setFetchError(null);
      try {
        const [agData, procData] = await Promise.all([
          agencyRepo.getAgencies(),
          procedureRepo.getProcedures(),
        ]);
        setAgencies(agData);
        setProcedures(procData);

        if (procData.length > 0) {
          setExpandedProcedureId(procData[0].id_tramite);
        }
      } catch (err: any) {
        console.error('Error al conectar con Supabase:', err);
        setFetchError(err?.message || 'Error de conexión con la base de datos de Supabase.');
      } finally {
        setLoading(false);
      }
    }

    fetchSupabaseData();
  }, []);

  // Búsquedas dinámicas directo a Supabase
  const handleSearchProcedures = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      const results = await procedureRepo.getProcedures(procedureSearch);
      setProcedures(results);
    } catch (err: any) {
      setFetchError(err?.message);
    }
  };

  const handleSearchAgencies = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      const results = await agencyRepo.getAgencies(districtFilter, agencySearch);
      setAgencies(results);
    } catch (err: any) {
      setFetchError(err?.message);
    }
  };

  // Distritos extraídos en vivo de la consulta a Supabase
  const availableDistricts = Array.from(
    new Set(agencies.map((a) => a.distrito).filter(Boolean))
  );

  const handleBookingAction = (e: React.MouseEvent, tramiteId?: number, agenciaId?: number) => {
    e.preventDefault();

    if (tramiteId) sessionStorage.setItem('bn_selected_tramiteId', String(tramiteId));
    if (agenciaId) sessionStorage.setItem('bn_selected_agenciaId', String(agenciaId));

    const storedSession = localStorage.getItem('bn_user_session');
    let session = null;
    try {
      if (storedSession) session = JSON.parse(storedSession);
    } catch {
      session = null;
    }

    if (!session || !session.authenticated) {
      const params = new URLSearchParams({ redirect: '/agendar' });
      if (tramiteId) params.set('tramiteId', String(tramiteId));
      if (agenciaId) params.set('agenciaId', String(agenciaId));
      router.push(`/login?${params.toString()}`);
      return;
    }

    if (session.role === 'ADMIN_GENERAL' || session.role === 'admin-general') {
      router.push('/admin-general?adminNotice=true');
      return;
    }
    if (session.role === 'ADMIN_AGENCIA' || session.role === 'admin-agencia') {
      router.push('/admin-agencia?adminNotice=true');
      return;
    }
    if (session.role === 'AGENTE' || session.role === 'ventanilla') {
      router.push('/ventanilla?adminNotice=true');
      return;
    }

    const params = new URLSearchParams();
    if (tramiteId) params.set('tramiteId', String(tramiteId));
    if (agenciaId) params.set('agenciaId', String(agenciaId));
    router.push(`/agendar?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-red-600 selection:text-white">
      {/* HEADER INSTITUCIONAL */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <Link href="/" className="hover:opacity-95 transition-opacity shrink-0">
            <LogoBancoNacion showSubtitle={true} />
          </Link>

          <nav className="flex items-center gap-3 sm:gap-6">
            <a
              href="#agencias"
              className="flex items-center gap-2 px-3.5 py-2 text-sm font-bold text-slate-700 hover:text-red-700 hover:bg-slate-100 rounded-lg transition"
            >
              <BuildingIcon className="w-4 h-4 text-red-600" />
              <span>Agencias</span>
            </a>
            <a
              href="#tramites"
              className="flex items-center gap-2 px-3.5 py-2 text-sm font-bold text-slate-700 hover:text-red-700 hover:bg-slate-100 rounded-lg transition"
            >
              <FileTextIcon className="w-4 h-4 text-red-600" />
              <span>Trámites</span>
            </a>
            <Link
              href="/login"
              className="px-5 py-2.5 text-sm font-extrabold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-xl shadow-md hover:shadow-red-200 transition flex items-center gap-2"
            >
              <UserIcon className="w-4 h-4 text-white" />
              <span>Iniciar Sesión</span>
            </Link>
          </nav>
        </div>
      </header>

      {/* AVISO DE ERROR DE CONEXIÓN A SUPABASE SI OCURRE */}
      {fetchError && (
        <div className="max-w-7xl mx-auto mt-4 px-4 sm:px-6 lg:px-8 w-full">
          <div className="bg-red-100 border border-red-300 p-4 rounded-xl text-red-800 text-xs font-bold flex items-center justify-between">
            <span>⚠️ Error al consultar Supabase: {fetchError}</span>
            <span className="text-[10px] text-red-600 font-normal">Verifica RLS / Permisos en Supabase</span>
          </div>
        </div>
      )}

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        {/* PANEL 1: HERO & ATENCIÓN PREFERENCIAL */}
        <section className="relative rounded-2xl overflow-hidden border border-slate-200 bg-white p-8 sm:p-12 shadow-xl">
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-red-100/40 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-12 w-64 h-64 bg-amber-100/30 rounded-full blur-2xl pointer-events-none" />

          <div className="grid md:grid-cols-12 gap-8 items-center relative z-10">
            <div className="md:col-span-5 space-y-4">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-red-50 text-red-700 border border-red-200 shadow-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
                CONEXIÓN SUPABASE EN VIVO
              </span>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
                ATENCIÓN <br />
                <span className="text-red-700">PREFERENCIAL</span>
              </h1>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                Optimiza tu tiempo agendando una cita previa o informándote sobre los requisitos vigentes antes de visitar la agencia.
              </p>
            </div>

            <div className="md:col-span-7 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 text-white rounded-2xl p-6 sm:p-8 shadow-xl border-l-4 border-red-600">
              <h2 className="text-lg sm:text-xl font-extrabold text-amber-400 uppercase tracking-wide flex items-center gap-2">
                <ClockIcon className="w-6 h-6 text-amber-400" />
                ACCEDE A UNA ATENCIÓN RÁPIDA Y PRIORITARIA
              </h2>
              <p className="mt-3 text-slate-300 text-sm leading-relaxed">
                Información sobre turnos preferenciales para adultos mayores, gestantes, persona común y trámites prioritarios. Conoce los requisitos o asegura tu turno antes de ir.
              </p>
              <div className="mt-6 flex flex-wrap gap-4">
                <button
                  onClick={(e) => handleBookingAction(e)}
                  className="px-6 py-3.5 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-xl shadow-lg hover:shadow-red-900/30 transition transform hover:-translate-y-0.5 text-sm uppercase tracking-wider flex items-center gap-2 cursor-pointer"
                >
                  <CalendarIcon className="w-4 h-4" />
                  <span>AGENDAR CITA</span>
                </button>
                <a
                  href="#tramites"
                  className="px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-extrabold rounded-xl border border-slate-600 transition text-sm uppercase tracking-wider flex items-center gap-2"
                >
                  <FileTextIcon className="w-4 h-4" />
                  <span>Ver Trámites y Requisitos</span>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* PANEL 2: AGENDA TU CITA EN 4 PASOS */}
        <section className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-10 shadow-lg">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-wider uppercase">
              AGENDA TU CITA EN 4 PASOS
            </h2>
            <div className="w-24 h-1.5 bg-red-600 mx-auto mt-3 rounded-full" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center flex flex-col items-center justify-between group hover:border-red-500 hover:bg-white bn-shadow-hover transition">
              <div className="w-20 h-20 rounded-2xl bg-white border border-red-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-md">
                <MapPinIcon className="w-10 h-10 text-red-600" />
              </div>
              <span className="text-xs font-black text-red-700 bg-red-100 px-3 py-1 rounded-full uppercase tracking-widest mb-2">PASO 01</span>
              <h3 className="font-extrabold text-slate-900 text-base uppercase tracking-wider">
                BUSCA TU AGENCIA
              </h3>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center flex flex-col items-center justify-between group hover:border-red-500 hover:bg-white bn-shadow-hover transition">
              <div className="w-20 h-20 rounded-2xl bg-white border border-amber-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-md">
                <FileTextIcon className="w-10 h-10 text-amber-600" />
              </div>
              <span className="text-xs font-black text-amber-800 bg-amber-100 px-3 py-1 rounded-full uppercase tracking-widest mb-2">PASO 02</span>
              <h3 className="font-extrabold text-slate-900 text-base uppercase tracking-wider">
                ELIGE TU TRÁMITE
              </h3>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center flex flex-col items-center justify-between group hover:border-red-500 hover:bg-white bn-shadow-hover transition">
              <div className="w-20 h-20 rounded-2xl bg-white border border-emerald-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-md">
                <CalendarIcon className="w-10 h-10 text-emerald-600" />
              </div>
              <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full uppercase tracking-widest mb-2">PASO 03</span>
              <h3 className="font-extrabold text-slate-900 text-base uppercase tracking-wider">
                ELIGE TU FECHA Y HORA
              </h3>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center flex flex-col items-center justify-between group hover:border-red-500 hover:bg-white bn-shadow-hover transition">
              <div className="w-20 h-20 rounded-2xl bg-white border border-red-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-md">
                <CheckCircleIcon className="w-10 h-10 text-red-600" />
              </div>
              <span className="text-xs font-black text-red-700 bg-red-100 px-3 py-1 rounded-full uppercase tracking-widest mb-2">PASO 04</span>
              <h3 className="font-extrabold text-slate-900 text-base uppercase tracking-wider">
                REGISTRAR TU CITA
              </h3>
            </div>
          </div>
        </section>

        {/* PANEL 3: CATÁLOGO DE TRÁMITES (DESDE SUPABASE) */}
        <section id="tramites" className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-10 shadow-lg space-y-8">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-wider uppercase">
              CATÁLOGO DE TRÁMITES
            </h2>
            <div className="w-24 h-1.5 bg-red-600 mx-auto mt-3 rounded-full" />
          </div>

          <form onSubmit={handleSearchProcedures} className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <SearchIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o código de trámite..."
                value={procedureSearch}
                onChange={(e) => setProcedureSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100 transition text-sm font-medium"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl transition shadow-md uppercase tracking-wider text-sm flex items-center gap-2 justify-center"
            >
              <SearchIcon className="w-4 h-4" />
              <span>BUSCAR TRÁMITE</span>
            </button>
          </form>

          {loading ? (
            <div className="py-12 text-center text-slate-500 font-semibold flex items-center justify-center gap-3">
              <div className="w-6 h-6 border-3 border-red-600 border-t-transparent rounded-full animate-spin" />
              Consultando trámites directamente desde Supabase...
            </div>
          ) : procedures.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl text-slate-600 font-medium">
              No se encontraron trámites registrados en Supabase.
            </div>
          ) : (
            <div className="space-y-4">
              {procedures.map((proc) => {
                const isExpanded = expandedProcedureId === proc.id_tramite;
                return (
                  <div
                    key={proc.id_tramite}
                    className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm transition hover:border-slate-400"
                  >
                    <div
                      onClick={() => setExpandedProcedureId(isExpanded ? null : proc.id_tramite)}
                      className="p-5 flex items-center justify-between cursor-pointer select-none bg-white hover:bg-slate-50 transition"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-transform ${isExpanded ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                          {isExpanded ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
                        </div>
                        <div>
                          <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                            {proc.nombre_tramite}
                          </h3>
                          {proc.duracion_minutos && (
                            <span className="text-xs text-slate-500 font-medium">Duración estimada: {proc.duracion_minutos} min</span>
                          )}
                        </div>
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-3.5 py-1.5 rounded-lg transition flex items-center gap-1">
                        {isExpanded ? 'Ocultar detalles' : 'Ver más detalles'}
                      </span>
                    </div>

                    {isExpanded && (
                      <div className="px-6 pb-6 pt-3 bg-slate-50 border-t border-slate-200 space-y-4">
                        {proc.descripcion && (
                          <p className="text-sm text-slate-700 font-medium">{proc.descripcion}</p>
                        )}

                        {proc.requisitos && proc.requisitos.length > 0 ? (
                          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-2 shadow-inner">
                            <h4 className="text-xs font-extrabold uppercase tracking-wider text-red-700 flex items-center gap-2">
                              <CheckCircleIcon className="w-4 h-4 text-red-600" />
                              Requisitos vigentes:
                            </h4>
                            <ul className="list-disc list-inside text-sm text-slate-700 space-y-1.5 pl-2 font-medium">
                              {proc.requisitos.map((req) => (
                                <li key={req.id_requisito} className="leading-relaxed">
                                  {req.descripcion_requisito}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : (
                          <div className="text-xs text-slate-500 italic bg-white p-3 rounded border border-slate-200">
                            Sin requisitos adicionales registrados para este trámite.
                          </div>
                        )}

                        <div className="flex justify-end pt-2">
                          <button
                            onClick={(e) => handleBookingAction(e, proc.id_tramite, undefined)}
                            className="px-6 py-2.5 bg-slate-900 hover:bg-red-600 text-white font-extrabold rounded-xl shadow transition text-sm uppercase tracking-wider flex items-center gap-2 cursor-pointer"
                          >
                            <span>Generar Cita</span>
                            <CalendarIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* PANEL 4: DIRECTORIO DE AGENCIAS DISPONIBLES (DESDE SUPABASE) */}
        <section id="agencias" className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-10 shadow-lg space-y-8">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-wider uppercase">
              DIRECTORIO DE AGENCIAS DISPONIBLES
            </h2>
            <div className="w-24 h-1.5 bg-red-600 mx-auto mt-3 rounded-full" />
          </div>

          <form onSubmit={handleSearchAgencies} className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-4">
              <select
                value={districtFilter}
                onChange={(e) => setDistrictFilter(e.target.value)}
                className="w-full py-3.5 px-4 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold text-sm focus:outline-none focus:border-red-600 transition"
              >
                <option value="Todas las agencias">Todas las agencias</option>
                {availableDistricts.map((dist) => (
                  <option key={dist} value={dist}>
                    {dist}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-5 relative">
              <SearchIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por ciudad o localidad..."
                value={agencySearch}
                onChange={(e) => setAgencySearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-600 transition text-sm font-medium"
              />
            </div>

            <div className="md:col-span-3">
              <button
                type="submit"
                className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl transition shadow-md uppercase tracking-wider text-sm flex items-center justify-center gap-2"
              >
                <BuildingIcon className="w-4 h-4" />
                <span>BUSCAR AGENCIA</span>
              </button>
            </div>
          </form>

          {loading ? (
            <div className="py-12 text-center text-slate-500 font-semibold flex items-center justify-center gap-3">
              <div className="w-6 h-6 border-3 border-red-600 border-t-transparent rounded-full animate-spin" />
              Consultando agencias directamente desde Supabase...
            </div>
          ) : agencies.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl text-slate-600 font-medium">
              No se encontraron agencias registradas en Supabase.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {agencies.map((agency) => (
                <div
                  key={agency.id_agencia}
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col justify-between shadow-md hover:border-red-500 bn-shadow-hover transition"
                >
                  <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-4 text-center">
                    <h3 className="font-extrabold text-white text-base tracking-wide uppercase flex items-center justify-center gap-2">
                      <BuildingIcon className="w-4 h-4 text-amber-400" />
                      <span>{agency.nombre_agencia}</span>
                    </h3>
                  </div>

                  <div className="p-6 text-center space-y-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-1 text-slate-700 text-sm">
                      <p className="font-extrabold text-red-700 flex items-center justify-center gap-1">
                        <MapPinIcon className="w-4 h-4 text-red-600" />
                        <span>{agency.distrito}</span>
                      </p>
                      <p className="text-slate-600 text-xs font-medium">{agency.direccion}</p>
                      {agency.telefono && (
                        <p className="text-slate-500 text-xs font-semibold">Tel: {agency.telefono}</p>
                      )}
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-[11px] font-extrabold text-slate-600 uppercase tracking-widest block">HORARIOS DE ATENCIÓN</span>
                      <p className="text-xs text-slate-800 font-bold">7:30 am - 12:00 am / 2:00 pm - 6:00 pm</p>
                      <p className="text-[11px] font-black text-emerald-700 pt-1 tracking-widest uppercase">L M MI J V S</p>
                    </div>

                    <button
                      onClick={(e) => handleBookingAction(e, undefined, agency.id_agencia)}
                      className="w-full py-2.5 bg-slate-900 hover:bg-red-600 text-white font-extrabold rounded-xl shadow transition text-xs uppercase tracking-wider block text-center cursor-pointer"
                    >
                      Generar Cita
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* FOOTER INSTITUCIONAL BLANCO */}
      <footer className="bg-white border-t border-slate-200 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <LogoBancoNacion showSubtitle={false} />
          <p className="text-xs text-slate-500 font-medium text-center">
            Todos los derechos reservados © {new Date().getFullYear()} Banco de la Nación Perú.
          </p>
        </div>
      </footer>
    </div>
  );
}
