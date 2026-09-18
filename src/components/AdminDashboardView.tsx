'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogoBancoNacion } from '@/components/LogoBancoNacion';
import {
  HomeIcon,
  FileTextIcon,
  UsersIcon,
  FileBarChartIcon,
  SearchIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  PrinterIcon,
  LogOutIcon,
  BuildingIcon,
  UserIcon,
} from '@/components/Icons';
import { SupabaseAgencyRepository } from '@/infrastructure/repositories/supabase-agency-repository';
import { SupabaseProcedureRepository } from '@/infrastructure/repositories/supabase-procedure-repository';

export type AdminTab = 'agencias' | 'tramites' | 'personal' | 'reportes';

interface AdminDashboardViewProps {
  forcedRole?: 'ADMIN_GENERAL' | 'ADMIN_AGENCIA';
  showAdminNoticeProp?: boolean;
}

export function AdminDashboardView({ forcedRole = 'ADMIN_GENERAL', showAdminNoticeProp = false }: AdminDashboardViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AdminTab>('agencias');
  const [showAdminNotice, setShowAdminNotice] = useState(showAdminNoticeProp);
  const [operatorName, setOperatorName] = useState('Leonardo Cruz');
  const [operatorLocation, setOperatorLocation] = useState('Sede Central - Lima');
  const [userRole, setUserRole] = useState<'ADMIN_GENERAL' | 'ADMIN_AGENCIA'>(forcedRole);

  // Estados de Búsqueda y Filtros
  const [searchAgencias, setSearchAgencias] = useState('');
  const [filterEstadoAgencias, setFilterEstadoAgencias] = useState('todos');

  const [searchTramites, setSearchTramites] = useState('');
  const [filterEstadoTramites, setFilterEstadoTramites] = useState('todos');

  const [searchPersonal, setSearchPersonal] = useState('');
  const [filterEstadoPersonal, setFilterEstadoPersonal] = useState('todos');

  const [reporteFecha, setReporteFecha] = useState('hoy');
  const [reporteAgencia, setReporteAgencia] = useState('todas');
  const [reporteEstado, setReporteEstado] = useState('todos');

  // Modales CRUD
  const [modalAgenciaOpen, setModalAgenciaOpen] = useState(false);
  const [modalTramiteOpen, setModalTramiteOpen] = useState(false);
  const [modalPersonalOpen, setModalPersonalOpen] = useState(false);
  const [modalReporteDetalleOpen, setModalReporteDetalleOpen] = useState(false);
  const [selectedReporteItem, setSelectedReporteItem] = useState<any>(null);

  // Data para CRUD Agencias (Fiel a Maqueta 1)
  const [agenciasList, setAgenciasList] = useState([
    { id: 1, nombre: 'Agencia Sur', lugar: 'San Jeronimo', ventanillas: 2, estado: 'Activo' },
    { id: 2, nombre: 'Agencia Central Principal', lugar: 'Cercado de Lima', ventanillas: 6, estado: 'Activo' },
    { id: 3, nombre: 'Agencia San Isidro Financiera', lugar: 'San Isidro', ventanillas: 4, estado: 'Activo' },
    { id: 4, nombre: 'Agencia Miraflores Pardo', lugar: 'Miraflores', ventanillas: 3, estado: 'Activo' },
    { id: 5, nombre: 'Agencia Callao Puerto', lugar: 'Callao', ventanillas: 2, estado: 'Inactivo' },
  ]);
  const [editingAgencia, setEditingAgencia] = useState<any>(null);
  const [agenciaForm, setAgenciaForm] = useState({ nombre: '', lugar: '', ventanillas: 2, estado: 'Activo' });

  // Data para CRUD Trámites (Fiel a Maqueta 2)
  const [tramitesList, setTramitesList] = useState([
    { id: 1, nombre: 'Apertura de Cuentas de Ahorros', requisitos: 5, fecha: '31-08-2026', estado: 'Activo' },
    { id: 2, nombre: 'Bloqueo y Reposición de Tarjeta Multired', requisitos: 3, fecha: '28-08-2026', estado: 'Activo' },
    { id: 3, nombre: 'Pago de Tasas y Tributos MTC / Reniec', requisitos: 2, fecha: '15-08-2026', estado: 'Activo' },
    { id: 4, nombre: 'Crédito Multired y Préstamos Personales', requisitos: 6, fecha: '10-08-2026', estado: 'Activo' },
    { id: 5, nombre: 'Actualización de Datos de Titular', requisitos: 4, fecha: '01-08-2026', estado: 'Inactivo' },
  ]);
  const [editingTramite, setEditingTramite] = useState<any>(null);
  const [tramiteForm, setTramiteForm] = useState({ nombre: '', requisitos: 3, fecha: '2026-09-18', estado: 'Activo' });

  // Data para CRUD Personal y Accesos (Fiel a Maqueta 3)
  const [personalList, setPersonalList] = useState([
    { id: 1, nombre: 'Jose Leonardo Cruz Gonzales', agenciaVentanilla: 'Agencia Sur-Ventanilla 2', rol: 'Agente Ventanilla', estado: 'Activo' },
    { id: 2, nombre: 'Ana María Valdivia Torres', agenciaVentanilla: 'Agencia Central - Ventanilla 1', rol: 'Agente Ventanilla', estado: 'Activo' },
    { id: 3, nombre: 'Carlos Eduardo Benítez', agenciaVentanilla: 'Agencia Central', rol: 'Administrador Agencia', estado: 'Activo' },
    { id: 4, nombre: 'Patricia Ramos Solano', agenciaVentanilla: 'Agencia San Isidro - Ventanilla 3', rol: 'Agente Ventanilla', estado: 'Activo' },
    { id: 5, nombre: 'Fernando Quispe Huamán', agenciaVentanilla: 'Agencia Miraflores - Ventanilla 1', rol: 'Agente Ventanilla', estado: 'Inactivo' },
  ]);
  const [editingPersonal, setEditingPersonal] = useState<any>(null);
  const [personalForm, setPersonalForm] = useState({ nombre: '', agenciaVentanilla: '', rol: 'Agente Ventanilla', estado: 'Activo' });

  // Data de Reportes (Fiel a Maqueta 4)
  const [reportesList] = useState([
    { id: 1, hora: '11:00', estado: 'Terminado', cliente: 'Sofía Ramírez', tramite: 'Bloqueo de Tarjeta', agencia: 'Agencia Sur', ventanilla: 'Ventanilla 1', atendidoPor: 'Jose Leonardo Cruz' },
    { id: 2, hora: '11:15', estado: 'Cancelado', cliente: 'Pedro Sánchez', tramite: 'Apertura de Cuenta', agencia: 'Agencia Sur', ventanilla: 'Ventanilla 2', atendidoPor: 'Jose Leonardo Cruz' },
    { id: 3, hora: '11:30', estado: 'Terminado', cliente: 'Lucía Flores', tramite: 'Solicitud de Préstamo', agencia: 'Agencia Central', ventanilla: 'Ventanilla 3', atendidoPor: 'Ana Valdivia' },
    { id: 4, hora: '11:45', estado: 'Denegado', cliente: 'Diego Morales', tramite: 'Transferencia Internacional', agencia: 'Agencia Sur', ventanilla: 'Ventanilla 1', atendidoPor: 'Jose Leonardo Cruz' },
    { id: 5, hora: '12:00', estado: 'Terminado', cliente: 'Elena Castro', tramite: 'Actualización de Datos', agencia: 'Agencia San Isidro', ventanilla: 'Ventanilla 2', atendidoPor: 'Patricia Ramos' },
    { id: 6, hora: '12:30', estado: 'Terminado', cliente: 'Valeria Ruiz', tramite: 'Bloqueo de Tarjeta', agencia: 'Agencia Central', ventanilla: 'Ventanilla 1', atendidoPor: 'Ana Valdivia' },
  ]);

  // Cargar sesión del almacenamiento local si existe
  useEffect(() => {
    try {
      const sessionRaw = localStorage.getItem('bn_user_session');
      if (sessionRaw) {
        const parsed = JSON.parse(sessionRaw);
        if (parsed.nombre) setOperatorName(parsed.nombre);
        if (parsed.role) {
          const roleNormalized = String(parsed.role).toUpperCase();
          if (roleNormalized === 'ADMIN_AGENCIA') {
            setUserRole('ADMIN_AGENCIA');
            setOperatorLocation('Agencia Sur (Asignada)');
            setReporteAgencia('Sur');
          } else {
            setUserRole('ADMIN_GENERAL');
          }
        }
      }
    } catch {
      // Usar valores institucionales seguros
    }
  }, []);

  // Cargar agencias y trámites en vivo de Supabase si están disponibles
  useEffect(() => {
    async function loadLiveSupabaseData() {
      try {
        const agencyRepo = new SupabaseAgencyRepository();
        const liveAgencies = await agencyRepo.getAgencies();
        if (liveAgencies && liveAgencies.length > 0) {
          setAgenciasList(
            liveAgencies.map((a) => ({
              id: a.id_agencia,
              nombre: a.nombre_agencia,
              lugar: a.distrito || 'Lima',
              ventanillas: a.total_ventanillas || 2,
              estado: a.activa ? 'Activo' : 'Inactivo',
            }))
          );
        }

        const procedureRepo = new SupabaseProcedureRepository();
        const liveProcedures = await procedureRepo.getProcedures();
        if (liveProcedures && liveProcedures.length > 0) {
          setTramitesList(
            liveProcedures.map((p) => ({
              id: p.id_tramite,
              nombre: p.nombre_tramite,
              requisitos: p.requisitos ? p.requisitos.length : 3,
              fecha: '31-08-2026',
              estado: p.activo ? 'Activo' : 'Inactivo',
            }))
          );
        }
      } catch (err) {
        console.log('Utilizando registros institucionales para el panel:', err);
      }
    }

    loadLiveSupabaseData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('bn_user_session');
    router.push('/login');
  };

  // CRUD Handlers: Agencias
  const handleSaveAgencia = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAgencia) {
      setAgenciasList((prev) =>
        prev.map((item) => (item.id === editingAgencia.id ? { ...item, ...agenciaForm } : item))
      );
    } else {
      const newId = agenciasList.length > 0 ? Math.max(...agenciasList.map((a) => a.id)) + 1 : 1;
      setAgenciasList((prev) => [{ id: newId, ...agenciaForm }, ...prev]);
    }
    setModalAgenciaOpen(false);
    setEditingAgencia(null);
  };

  const handleDeleteAgencia = (id: number) => {
    if (confirm('¿Estás seguro de dar de baja esta agencia?')) {
      setAgenciasList((prev) => prev.filter((a) => a.id !== id));
    }
  };

  // CRUD Handlers: Trámites
  const handleSaveTramite = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTramite) {
      setTramitesList((prev) =>
        prev.map((item) => (item.id === editingTramite.id ? { ...item, ...tramiteForm } : item))
      );
    } else {
      const newId = tramitesList.length > 0 ? Math.max(...tramitesList.map((t) => t.id)) + 1 : 1;
      setTramitesList((prev) => [{ id: newId, ...tramiteForm }, ...prev]);
    }
    setModalTramiteOpen(false);
    setEditingTramite(null);
  };

  const handleDeleteTramite = (id: number) => {
    if (confirm('¿Estás seguro de eliminar este trámite?')) {
      setTramitesList((prev) => prev.filter((t) => t.id !== id));
    }
  };

  // CRUD Handlers: Personal
  const handleSavePersonal = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPersonal) {
      setPersonalList((prev) =>
        prev.map((item) => (item.id === editingPersonal.id ? { ...item, ...personalForm } : item))
      );
    } else {
      const newId = personalList.length > 0 ? Math.max(...personalList.map((p) => p.id)) + 1 : 1;
      setPersonalList((prev) => [{ id: newId, ...personalForm }, ...prev]);
    }
    setModalPersonalOpen(false);
    setEditingPersonal(null);
  };

  const handleDeletePersonal = (id: number) => {
    if (confirm('¿Estás seguro de desactivar este personal asignado?')) {
      setPersonalList((prev) => prev.filter((p) => p.id !== id));
    }
  };

  // Filtrado de tablas
  const filteredAgencias = agenciasList.filter((ag) => {
    const matchSearch =
      ag.nombre.toLowerCase().includes(searchAgencias.toLowerCase()) ||
      ag.lugar.toLowerCase().includes(searchAgencias.toLowerCase());
    const matchEstado = filterEstadoAgencias === 'todos' || ag.estado.toLowerCase() === filterEstadoAgencias.toLowerCase();
    return matchSearch && matchEstado;
  });

  const filteredTramites = tramitesList.filter((tr) => {
    const matchSearch = tr.nombre.toLowerCase().includes(searchTramites.toLowerCase());
    const matchEstado = filterEstadoTramites === 'todos' || tr.estado.toLowerCase() === filterEstadoTramites.toLowerCase();
    return matchSearch && matchEstado;
  });

  const filteredPersonal = personalList.filter((pe) => {
    const matchSearch =
      pe.nombre.toLowerCase().includes(searchPersonal.toLowerCase()) ||
      pe.agenciaVentanilla.toLowerCase().includes(searchPersonal.toLowerCase());
    const matchEstado = filterEstadoPersonal === 'todos' || pe.estado.toLowerCase() === filterEstadoPersonal.toLowerCase();
    return matchSearch && matchEstado;
  });

  const filteredReportes = reportesList.filter((rep) => {
    const matchAgencia =
      reporteAgencia === 'todas' || rep.agencia.toLowerCase().includes(reporteAgencia.toLowerCase());
    const matchEstado =
      reporteEstado === 'todos' || rep.estado.toLowerCase() === reporteEstado.toLowerCase();
    return matchAgencia && matchEstado;
  });

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col selection:bg-red-600 selection:text-white">
      {/* Banner de Aviso Institucional de Administrador */}
      {showAdminNotice && (
        <div className="bg-amber-500 text-slate-950 py-2.5 px-6 text-xs font-black flex items-center justify-between shadow-sm z-50">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping" />
            <span>
              SESIÓN ADMINISTRATIVA ACTIVA: Has ingresado como{' '}
              <strong>{userRole === 'ADMIN_GENERAL' ? 'Administrador General' : 'Administrador de Agencia'}</strong>. La configuración realizada repercute en el agendamiento y ventanillas.
            </span>
          </div>
          <button
            onClick={() => setShowAdminNotice(false)}
            className="hover:bg-amber-600 px-2 py-0.5 rounded text-[11px] font-extrabold uppercase transition"
          >
            Entendido ✕
          </button>
        </div>
      )}

      {/* TOPBAR INSTITUCIONAL BLANCO CON LOGO OFICIAL */}
      <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/" className="hover:opacity-95 transition">
            <LogoBancoNacion showSubtitle={true} className="h-10 sm:h-11" />
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-extrabold text-slate-800">
              Hola, <span className="text-red-700 font-black">{operatorName}</span> | <span className="text-slate-500 font-medium">{operatorLocation}</span>
            </div>
            <div className="text-[11px] text-slate-400 font-semibold">Banco de la Nación del Perú</div>
          </div>

          <div className="px-3.5 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-black tracking-wider uppercase shadow-sm">
            {userRole === 'ADMIN_GENERAL' ? 'ADMINISTRADOR' : 'ADMIN AGENCIA'}
          </div>
        </div>
      </header>

      {/* CUERPO PRINCIPAL CON SIDEBAR Y PANEL CENTRAL */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* SIDEBAR INSTITUCIONAL (Fiel a la estructura del Wireframe) */}
        <aside className="w-full md:w-64 bg-slate-900 text-slate-200 flex flex-col justify-between p-4 shrink-0 border-r border-slate-800">
          <div className="space-y-1.5">
            <div className="px-3 py-2 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
              Menú de Gestión
            </div>

            {/* Link 1: Agencias */}
            <button
              onClick={() => setActiveTab('agencias')}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-bold text-xs transition text-left ${
                activeTab === 'agencias'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <HomeIcon className="w-5 h-5 shrink-0" />
              <span>Agencias</span>
            </button>

            {/* Link 2: Trámites y Requisitos */}
            <button
              onClick={() => setActiveTab('tramites')}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-bold text-xs transition text-left ${
                activeTab === 'tramites'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <FileTextIcon className="w-5 h-5 shrink-0" />
              <span>Tramites y Requisitos</span>
            </button>

            {/* Link 3: Personal y Accesos */}
            <button
              onClick={() => setActiveTab('personal')}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-bold text-xs transition text-left ${
                activeTab === 'personal'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <UsersIcon className="w-5 h-5 shrink-0" />
              <span>Personal y Accesos</span>
            </button>

            {/* Link 4: Reportes */}
            <button
              onClick={() => setActiveTab('reportes')}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-bold text-xs transition text-left ${
                activeTab === 'reportes'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <FileBarChartIcon className="w-5 h-5 shrink-0" />
              <span>Reportes</span>
            </button>
          </div>

          {/* Botón Inferior: Cerrar Sesión */}
          <div className="pt-4 border-t border-slate-800 mt-6 md:mt-0">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-extrabold text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition text-left"
            >
              <LogOutIcon className="w-5 h-5 shrink-0" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </aside>

        {/* CONTENIDO PRINCIPAL DINÁMICO SEGÚN PESTAÑA */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {/* ========================================================= */}
          {/* VISTA 1: AGENCIAS (Fiel al Boceto 1) */}
          {/* ========================================================= */}
          {activeTab === 'agencias' && (
            <div className="space-y-5 animate-fadeIn">
              {/* Header de la sección */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Agencias
                </h1>
                <button
                  onClick={() => {
                    setEditingAgencia(null);
                    setAgenciaForm({ nombre: '', lugar: '', ventanillas: 2, estado: 'Activo' });
                    setModalAgenciaOpen(true);
                  }}
                  className="inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-extrabold px-5 py-2.5 rounded-xl shadow-md transition text-sm uppercase tracking-wider"
                >
                  <PlusIcon className="w-4 h-4" />
                  <span>Nueva Agencia</span>
                </button>
              </div>

              {/* Barra de Filtros */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-3 relative">
                  <SearchIcon className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchAgencias}
                    onChange={(e) => setSearchAgencias(e.target.value)}
                    placeholder="Buscar por nombre o lugar..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100 transition shadow-sm"
                  />
                </div>
                <div className="sm:col-span-1">
                  <select
                    value={filterEstadoAgencias}
                    onChange={(e) => setFilterEstadoAgencias(e.target.value)}
                    className="w-full py-2.5 px-3.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100 transition shadow-sm"
                  >
                    <option value="todos">Todos los estados</option>
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                  </select>
                </div>
              </div>

              {/* Tabla de Agencias */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-black text-slate-600 uppercase tracking-wider">
                      <tr>
                        <th className="p-4">NOMBRE</th>
                        <th className="p-4">Lugar</th>
                        <th className="p-4">Ventanillas</th>
                        <th className="p-4">ESTADO</th>
                        <th className="p-4 text-center">ACCIONES</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {filteredAgencias.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-slate-400 font-semibold">
                            No se encontraron agencias registradas con los filtros actuales.
                          </td>
                        </tr>
                      ) : (
                        filteredAgencias.map((ag) => (
                          <tr key={ag.id} className="hover:bg-slate-50/80 transition">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
                                  <BuildingIcon className="w-5 h-5 text-red-700" />
                                </div>
                                <span className="font-extrabold text-slate-900">{ag.nombre}</span>
                              </div>
                            </td>
                            <td className="p-4 text-slate-600">{ag.lugar}</td>
                            <td className="p-4 font-bold text-slate-800">{ag.ventanillas}</td>
                            <td className="p-4">
                              <span
                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                                  ag.estado === 'Activo'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : 'bg-slate-200 text-slate-600'
                                }`}
                              >
                                {ag.estado}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => {
                                    setEditingAgencia(ag);
                                    setAgenciaForm({
                                      nombre: ag.nombre,
                                      lugar: ag.lugar,
                                      ventanillas: ag.ventanillas,
                                      estado: ag.estado,
                                    });
                                    setModalAgenciaOpen(true);
                                  }}
                                  title="Editar"
                                  className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-red-700 rounded-lg transition"
                                >
                                  <EditIcon className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteAgencia(ag.id)}
                                  title="Eliminar"
                                  className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition"
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Paginación */}
                <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <span className="font-semibold text-slate-500">
                    Mostrando 1-{filteredAgencias.length} de {agenciasList.length} resultados
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg font-bold text-slate-700 transition">
                      ← Anterior
                    </button>
                    <button className="px-3 py-1.5 bg-red-600 text-white font-black rounded-lg shadow-sm">
                      1
                    </button>
                    <button className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg font-bold text-slate-700 transition">
                      2
                    </button>
                    <button className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg font-bold text-slate-700 transition">
                      3
                    </button>
                    <button className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg font-bold text-slate-700 transition">
                      Siguiente →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* VISTA 2: TRÁMITES Y REQUISITOS (Fiel al Boceto 2) */}
          {/* ========================================================= */}
          {activeTab === 'tramites' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Tramites y Requisitos
                </h1>
                <button
                  onClick={() => {
                    setEditingTramite(null);
                    setTramiteForm({ nombre: '', requisitos: 3, fecha: '2026-09-18', estado: 'Activo' });
                    setModalTramiteOpen(true);
                  }}
                  className="inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-extrabold px-5 py-2.5 rounded-xl shadow-md transition text-sm uppercase tracking-wider"
                >
                  <PlusIcon className="w-4 h-4" />
                  <span>Nuevo Tramite</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-3 relative">
                  <SearchIcon className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTramites}
                    onChange={(e) => setSearchTramites(e.target.value)}
                    placeholder="Buscar por nombre..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100 transition shadow-sm"
                  />
                </div>
                <div className="sm:col-span-1">
                  <select
                    value={filterEstadoTramites}
                    onChange={(e) => setFilterEstadoTramites(e.target.value)}
                    className="w-full py-2.5 px-3.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100 transition shadow-sm"
                  >
                    <option value="todos">Todos los estados</option>
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                  </select>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-black text-slate-600 uppercase tracking-wider">
                      <tr>
                        <th className="p-4">NOMBRE</th>
                        <th className="p-4">Requisitos</th>
                        <th className="p-4">Fecha de Creación</th>
                        <th className="p-4">ESTADO</th>
                        <th className="p-4 text-center">ACCIONES</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {filteredTramites.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-slate-400 font-semibold">
                            No se encontraron trámites registrados.
                          </td>
                        </tr>
                      ) : (
                        filteredTramites.map((tr) => (
                          <tr key={tr.id} className="hover:bg-slate-50/80 transition">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
                                  <FileTextIcon className="w-5 h-5 text-red-700" />
                                </div>
                                <span className="font-extrabold text-slate-900">{tr.nombre}</span>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className="font-bold text-slate-800">{tr.requisitos} requisitos</span>
                            </td>
                            <td className="p-4 text-slate-600 font-mono text-xs">{tr.fecha}</td>
                            <td className="p-4">
                              <span
                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                                  tr.estado === 'Activo'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : 'bg-slate-200 text-slate-600'
                                }`}
                              >
                                {tr.estado}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => {
                                    setEditingTramite(tr);
                                    setTramiteForm({
                                      nombre: tr.nombre,
                                      requisitos: tr.requisitos,
                                      fecha: tr.fecha,
                                      estado: tr.estado,
                                    });
                                    setModalTramiteOpen(true);
                                  }}
                                  title="Editar"
                                  className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-red-700 rounded-lg transition"
                                >
                                  <EditIcon className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteTramite(tr.id)}
                                  title="Eliminar"
                                  className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition"
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <span className="font-semibold text-slate-500">
                    Mostrando 1-{filteredTramites.length} de {tramitesList.length} resultados
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg font-bold text-slate-700 transition">
                      ← Anterior
                    </button>
                    <button className="px-3 py-1.5 bg-red-600 text-white font-black rounded-lg shadow-sm">
                      1
                    </button>
                    <button className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg font-bold text-slate-700 transition">
                      2
                    </button>
                    <button className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg font-bold text-slate-700 transition">
                      3
                    </button>
                    <button className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg font-bold text-slate-700 transition">
                      Siguiente →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* VISTA 3: PERSONAL Y ACCESOS (Fiel al Boceto 3) */}
          {/* ========================================================= */}
          {activeTab === 'personal' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Personal y Accesos
                </h1>
                <button
                  onClick={() => {
                    setEditingPersonal(null);
                    setPersonalForm({ nombre: '', agenciaVentanilla: '', rol: 'Agente Ventanilla', estado: 'Activo' });
                    setModalPersonalOpen(true);
                  }}
                  className="inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-extrabold px-5 py-2.5 rounded-xl shadow-md transition text-sm uppercase tracking-wider"
                >
                  <PlusIcon className="w-4 h-4" />
                  <span>Nuevo Personal</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-3 relative">
                  <SearchIcon className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchPersonal}
                    onChange={(e) => setSearchPersonal(e.target.value)}
                    placeholder="Buscar por nombre..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100 transition shadow-sm"
                  />
                </div>
                <div className="sm:col-span-1">
                  <select
                    value={filterEstadoPersonal}
                    onChange={(e) => setFilterEstadoPersonal(e.target.value)}
                    className="w-full py-2.5 px-3.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100 transition shadow-sm"
                  >
                    <option value="todos">Todos los estados</option>
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                  </select>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-black text-slate-600 uppercase tracking-wider">
                      <tr>
                        <th className="p-4">NOMBRE</th>
                        <th className="p-4">Agencia-Ventanilla</th>
                        <th className="p-4">Rol</th>
                        <th className="p-4">ESTADO</th>
                        <th className="p-4 text-center">ACCIONES</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {filteredPersonal.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-slate-400 font-semibold">
                            No se encontró personal registrado.
                          </td>
                        </tr>
                      ) : (
                        filteredPersonal.map((pe) => (
                          <tr key={pe.id} className="hover:bg-slate-50/80 transition">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
                                  <UserIcon className="w-5 h-5 text-red-700" />
                                </div>
                                <span className="font-extrabold text-slate-900">{pe.nombre}</span>
                              </div>
                            </td>
                            <td className="p-4 text-slate-700 font-semibold">{pe.agenciaVentanilla}</td>
                            <td className="p-4">
                              <span className="font-bold text-slate-800">{pe.rol}</span>
                            </td>
                            <td className="p-4">
                              <span
                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                                  pe.estado === 'Activo'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : 'bg-slate-200 text-slate-600'
                                }`}
                              >
                                {pe.estado}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => {
                                    setEditingPersonal(pe);
                                    setPersonalForm({
                                      nombre: pe.nombre,
                                      agenciaVentanilla: pe.agenciaVentanilla,
                                      rol: pe.rol,
                                      estado: pe.estado,
                                    });
                                    setModalPersonalOpen(true);
                                  }}
                                  title="Editar"
                                  className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-red-700 rounded-lg transition"
                                >
                                  <EditIcon className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeletePersonal(pe.id)}
                                  title="Eliminar"
                                  className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition"
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <span className="font-semibold text-slate-500">
                    Mostrando 1-{filteredPersonal.length} de {personalList.length} resultados
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg font-bold text-slate-700 transition">
                      ← Anterior
                    </button>
                    <button className="px-3 py-1.5 bg-red-600 text-white font-black rounded-lg shadow-sm">
                      1
                    </button>
                    <button className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg font-bold text-slate-700 transition">
                      2
                    </button>
                    <button className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg font-bold text-slate-700 transition">
                      3
                    </button>
                    <button className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg font-bold text-slate-700 transition">
                      Siguiente →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* VISTA 4: REPORTES Y RESUMEN (Fiel al Boceto 4) */}
          {/* ========================================================= */}
          {activeTab === 'reportes' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Reportes y Resumen
                </h1>
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-extrabold px-5 py-2.5 rounded-xl shadow-md transition text-sm uppercase tracking-wider"
                >
                  <PrinterIcon className="w-4 h-4" />
                  <span>Imprimir</span>
                </button>
              </div>

              {/* Fila de Filtros del Boceto 4 */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Rango Temporal</label>
                  <select
                    value={reporteFecha}
                    onChange={(e) => setReporteFecha(e.target.value)}
                    className="w-full py-2.5 px-3.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100 transition shadow-sm"
                  >
                    <option value="hoy">Fecha de Hoy</option>
                    <option value="semana">Esta Semana</option>
                    <option value="mes">Este Mes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Filtro de Agencia</label>
                  <select
                    value={reporteAgencia}
                    onChange={(e) => setReporteAgencia(e.target.value)}
                    disabled={userRole === 'ADMIN_AGENCIA'}
                    className="w-full py-2.5 px-3.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100 transition shadow-sm disabled:bg-slate-100"
                  >
                    <option value="todas">Por Agencia (Todas)</option>
                    <option value="Sur">Agencia Sur</option>
                    <option value="Central">Agencia Central Principal</option>
                    <option value="San Isidro">Agencia San Isidro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Filtro de Estado</label>
                  <select
                    value={reporteEstado}
                    onChange={(e) => setReporteEstado(e.target.value)}
                    className="w-full py-2.5 px-3.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100 transition shadow-sm"
                  >
                    <option value="todos">Estado (Todos)</option>
                    <option value="terminado">Terminado</option>
                    <option value="cancelado">Cancelado</option>
                    <option value="denegado">Denegado</option>
                  </select>
                </div>
              </div>

              {/* Grid de 2 Paneles del Boceto 4 */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Panel Izquierdo: Ilustración/Gráfico de Rendimiento */}
                <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center text-center">
                  <div className="w-36 h-36 rounded-2xl bg-gradient-to-br from-red-50 to-slate-100 border-2 border-red-200 flex items-center justify-center mb-5 shadow-inner">
                    <svg className="w-20 h-20 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {/* Casa con flecha ascendente exactamente como en el boceto 4 */}
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 17l4-4 3 3 5-5m0 0h-4m4 0v4" />
                    </svg>
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-base mb-1">Efectividad Operativa</h3>
                  <p className="text-xs text-slate-500 mb-4">Métricas consolidadas de atención en agencias</p>
                  
                  <div className="w-full grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-left">
                    <div className="bg-slate-50 p-3 rounded-xl">
                      <span className="text-[10px] uppercase font-black text-slate-400">Total Atenciones</span>
                      <p className="text-xl font-black text-slate-900 mt-0.5">{filteredReportes.length * 14}</p>
                    </div>
                    <div className="bg-emerald-50 p-3 rounded-xl">
                      <span className="text-[10px] uppercase font-black text-emerald-600">Tasa Éxito</span>
                      <p className="text-xl font-black text-emerald-700 mt-0.5">94.2%</p>
                    </div>
                  </div>
                </div>

                {/* Panel Derecho: Tabla Detallada de Atenciones */}
                <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-black text-slate-600 uppercase tracking-wider">
                        <tr>
                          <th className="p-3.5">Hora</th>
                          <th className="p-3.5">Estado</th>
                          <th className="p-3.5">Cliente</th>
                          <th className="p-3.5">Trámite</th>
                          <th className="p-3.5 text-center">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700 text-xs">
                        {filteredReportes.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-slate-400 font-semibold">
                              No hay citas registradas para los filtros seleccionados.
                            </td>
                          </tr>
                        ) : (
                          filteredReportes.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50/80 transition">
                              <td className="p-3.5 font-bold font-mono text-slate-900">{item.hora}</td>
                              <td className="p-3.5">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                    item.estado === 'Terminado'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : item.estado === 'Cancelado'
                                      ? 'bg-rose-100 text-rose-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {item.estado}
                                </span>
                              </td>
                              <td className="p-3.5 font-extrabold text-slate-800">{item.cliente}</td>
                              <td className="p-3.5 text-slate-600 font-medium">{item.tramite}</td>
                              <td className="p-3.5 text-center">
                                <button
                                  onClick={() => {
                                    setSelectedReporteItem(item);
                                    setModalReporteDetalleOpen(true);
                                  }}
                                  className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs transition"
                                >
                                  Ver
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ========================================================= */}
      {/* MODALES CRUD INTERACTIVOS */}
      {/* ========================================================= */}

      {/* Modal: Nueva / Editar Agencia */}
      {modalAgenciaOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-scaleUp">
            <h2 className="text-xl font-black text-slate-900 mb-4">
              {editingAgencia ? 'Editar Agencia' : 'Nueva Agencia'}
            </h2>
            <form onSubmit={handleSaveAgencia} className="space-y-4 text-xs font-bold text-slate-700">
              <div>
                <label className="block mb-1 uppercase">Nombre de la Agencia</label>
                <input
                  type="text"
                  required
                  value={agenciaForm.nombre}
                  onChange={(e) => setAgenciaForm({ ...agenciaForm, nombre: e.target.value })}
                  placeholder="Ej: Agencia San Jeronimo"
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100"
                />
              </div>
              <div>
                <label className="block mb-1 uppercase">Lugar / Distrito</label>
                <input
                  type="text"
                  required
                  value={agenciaForm.lugar}
                  onChange={(e) => setAgenciaForm({ ...agenciaForm, lugar: e.target.value })}
                  placeholder="Ej: Cusco / San Jeronimo"
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 uppercase">Ventanillas</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    required
                    value={agenciaForm.ventanillas}
                    onChange={(e) => setAgenciaForm({ ...agenciaForm, ventanillas: parseInt(e.target.value) || 1 })}
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100"
                  />
                </div>
                <div>
                  <label className="block mb-1 uppercase">Estado</label>
                  <select
                    value={agenciaForm.estado}
                    onChange={(e) => setAgenciaForm({ ...agenciaForm, estado: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100"
                  >
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalAgenciaOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-extrabold shadow-md transition"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Nuevo / Editar Trámite */}
      {modalTramiteOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-scaleUp">
            <h2 className="text-xl font-black text-slate-900 mb-4">
              {editingTramite ? 'Editar Trámite' : 'Nuevo Trámite'}
            </h2>
            <form onSubmit={handleSaveTramite} className="space-y-4 text-xs font-bold text-slate-700">
              <div>
                <label className="block mb-1 uppercase">Nombre del Trámite</label>
                <input
                  type="text"
                  required
                  value={tramiteForm.nombre}
                  onChange={(e) => setTramiteForm({ ...tramiteForm, nombre: e.target.value })}
                  placeholder="Ej: Apertura de Cuentas de Ahorros"
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 uppercase">Cant. Requisitos</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    required
                    value={tramiteForm.requisitos}
                    onChange={(e) => setTramiteForm({ ...tramiteForm, requisitos: parseInt(e.target.value) || 1 })}
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100"
                  />
                </div>
                <div>
                  <label className="block mb-1 uppercase">Estado</label>
                  <select
                    value={tramiteForm.estado}
                    onChange={(e) => setTramiteForm({ ...tramiteForm, estado: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100"
                  >
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalTramiteOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-extrabold shadow-md transition"
                >
                  Guardar Trámite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Nuevo / Editar Personal */}
      {modalPersonalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-scaleUp">
            <h2 className="text-xl font-black text-slate-900 mb-4">
              {editingPersonal ? 'Editar Personal' : 'Nuevo Personal'}
            </h2>
            <form onSubmit={handleSavePersonal} className="space-y-4 text-xs font-bold text-slate-700">
              <div>
                <label className="block mb-1 uppercase">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={personalForm.nombre}
                  onChange={(e) => setPersonalForm({ ...personalForm, nombre: e.target.value })}
                  placeholder="Ej: Jose Leonardo Cruz Gonzales"
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100"
                />
              </div>
              <div>
                <label className="block mb-1 uppercase">Agencia y Ventanilla Asignada</label>
                <input
                  type="text"
                  required
                  value={personalForm.agenciaVentanilla}
                  onChange={(e) => setPersonalForm({ ...personalForm, agenciaVentanilla: e.target.value })}
                  placeholder="Ej: Agencia Sur - Ventanilla 2"
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 uppercase">Rol Asignado</label>
                  <select
                    value={personalForm.rol}
                    onChange={(e) => setPersonalForm({ ...personalForm, rol: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100"
                  >
                    <option value="Agente Ventanilla">Agente Ventanilla</option>
                    <option value="Administrador Agencia">Administrador Agencia</option>
                    <option value="Administrador General">Administrador General</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1 uppercase">Estado</label>
                  <select
                    value={personalForm.estado}
                    onChange={(e) => setPersonalForm({ ...personalForm, estado: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100"
                  >
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalPersonalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-extrabold shadow-md transition"
                >
                  Guardar Personal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Detalle de Cita en Reportes ("Ver") */}
      {modalReporteDetalleOpen && selectedReporteItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h2 className="text-lg font-black text-slate-900">
                Detalle de Atención
              </h2>
              <span
                className={`px-3 py-1 rounded-full text-xs font-black ${
                  selectedReporteItem.estado === 'Terminado'
                    ? 'bg-emerald-100 text-emerald-800'
                    : selectedReporteItem.estado === 'Cancelado'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {selectedReporteItem.estado}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl">
                <span className="text-[10px] uppercase font-black text-slate-400">Cliente</span>
                <p className="font-extrabold text-slate-900 text-sm">{selectedReporteItem.cliente}</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl">
                <span className="text-[10px] uppercase font-black text-slate-400">Trámite</span>
                <p className="font-extrabold text-slate-900 text-sm">{selectedReporteItem.tramite}</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-50 p-3 rounded-xl">
                  <span className="text-[10px] uppercase font-black text-slate-400">Hora</span>
                  <p className="font-mono font-bold text-slate-900">{selectedReporteItem.hora}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl">
                  <span className="text-[10px] uppercase font-black text-slate-400">Agencia / Ventanilla</span>
                  <p className="font-bold text-slate-900 truncate">{selectedReporteItem.agencia}</p>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl">
                <span className="text-[10px] uppercase font-black text-slate-400">Atendido Por</span>
                <p className="font-bold text-slate-800">{selectedReporteItem.atendidoPor || 'Agente en Turno'}</p>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setModalReporteDetalleOpen(false)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl text-xs transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
