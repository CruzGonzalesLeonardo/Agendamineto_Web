'use client';

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
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
  CheckCircleIcon,
  ClockIcon,
} from '@/components/Icons';
import { SupabaseAgencyRepository } from '@/infrastructure/repositories/supabase-agency-repository';
import { SupabaseProcedureRepository } from '@/infrastructure/repositories/supabase-procedure-repository';
import { createSupabaseBrowserClient } from '@/infrastructure/supabase/client';
import { PERU_UBIGEO } from '@/data/peru-locations';

const AgencyLocationPicker = dynamic(() => import('@/components/AgencyLocationPicker'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-56 bg-slate-100 animate-pulse rounded-xl border border-slate-200 flex flex-col items-center justify-center text-slate-400 font-bold text-xs gap-2">
      <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
      <span>Cargando mapa interactivo...</span>
    </div>
  ),
});

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
  const [filterRegionAgencias, setFilterRegionAgencias] = useState('todos');

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

  // Data para CRUD Agencias
  const [agenciasList, setAgenciasList] = useState<any[]>([
    { id: 1, nombre: 'Agencia Sur', lugar: 'San Jeronimo', direccion: 'Av. Manco Cápac 123', departamento: 'Cusco', provincia: 'Cusco', distrito: 'San Jeronimo', ventanillas: 2, estado: 'Activo', latitud: -13.535, longitud: -71.91 },
    { id: 2, nombre: 'Agencia Central Principal', lugar: 'Cercado de Lima', direccion: 'Jr. Lampa 450', departamento: 'Lima', provincia: 'Lima', distrito: 'Cercado de Lima', ventanillas: 6, estado: 'Activo', latitud: -12.046, longitud: -77.03 },
    { id: 3, nombre: 'Agencia San Isidro Financiera', lugar: 'San Isidro', direccion: 'Av. Rivera Navarrete 525', departamento: 'Lima', provincia: 'Lima', distrito: 'San Isidro', ventanillas: 4, estado: 'Activo', latitud: -12.095, longitud: -77.032 },
    { id: 4, nombre: 'Agencia Miraflores Pardo', lugar: 'Miraflores', direccion: 'Av. José Pardo 450', departamento: 'Lima', provincia: 'Lima', distrito: 'Miraflores', ventanillas: 3, estado: 'Activo', latitud: -12.121, longitud: -77.03 },
    { id: 5, nombre: 'Agencia Callao Puerto', lugar: 'Callao', direccion: 'Av. Sáenz Peña 320', departamento: 'Callao', provincia: 'Callao', distrito: 'Callao', ventanillas: 2, estado: 'Inactivo', latitud: -12.06, longitud: -77.14 },
  ]);
  const [editingAgencia, setEditingAgencia] = useState<any>(null);
  const [agenciaModalTab, setAgenciaModalTab] = useState<'datos' | 'horario' | 'tramites'>('datos');
  const [isSavingAgencia, setIsSavingAgencia] = useState(false);
  const [agenciaForm, setAgenciaForm] = useState({
    nombre: '',
    departamento: 'Lima',
    provincia: 'Lima',
    distrito: 'Cercado de Lima',
    direccion: '',
    telefono: '',
    latitud: -12.046374,
    longitud: -77.042793,
    ventanillas: 2,
    estado: 'Activo',
    diasSemana: [1, 2, 3, 4, 5], // Lunes a Viernes
    horaApertura: '08:30',
    horaCierre: '17:30',
    horaInicioAlmuerzo: '13:00',
    horaFinAlmuerzo: '14:00',
    tramitesSeleccionados: [] as number[],
  });

  // Provincias disponibles según el departamento seleccionado en el formulario
  const availableProvincias = useMemo(() => {
    const dep = PERU_UBIGEO.find((d) => d.nombre === agenciaForm.departamento);
    return dep ? dep.provincias : [];
  }, [agenciaForm.departamento]);

  // Distritos disponibles según la provincia seleccionada en el formulario
  const availableDistritos = useMemo(() => {
    const prov = availableProvincias.find((p) => p.nombre === agenciaForm.provincia);
    return prov ? prov.distritos : [];
  }, [availableProvincias, agenciaForm.provincia]);

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
        const liveAgencies = await agencyRepo.getAgencies(undefined, undefined, true);
        if (liveAgencies && liveAgencies.length > 0) {
          setAgenciasList(
            liveAgencies.map((a) => ({
              id: a.id_agencia,
              nombre: a.nombre_agencia,
              direccion: a.direccion,
              distrito: a.distrito,
              provincia: a.provincia,
              departamento: a.departamento,
              telefono: a.telefono,
              lugar: `${a.distrito}${a.provincia ? ', ' + a.provincia : ''}`,
              ventanillas: a.total_ventanillas || 1,
              estado: a.activa ? 'Activo' : 'Inactivo',
              latitud: a.latitud,
              longitud: a.longitud,
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

        const supabase = createSupabaseBrowserClient();
        const { data: usersData } = await supabase
          .from('perfil_usuario')
          .select('*, rol:id_rol(nombre_rol), agencia:id_agencia(nombre_agencia)');

        if (usersData && usersData.length > 0) {
          setPersonalList(
            usersData.map((u: any, idx: number) => ({
              id: idx + 1,
              nombre: `${u.nombres || ''} ${u.apellidos || ''}`.trim() || u.correo,
              agenciaVentanilla: u.agencia?.nombre_agencia || 'Sede Central',
              rol: u.rol?.nombre_rol || 'Personal',
              estado: 'Activo',
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

  // CRUD Handlers: Agencias conectados a Supabase
  const handleSaveAgencia = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingAgencia(true);
    try {
      const agencyRepo = new SupabaseAgencyRepository();
      if (editingAgencia) {
        await agencyRepo.updateAgency(editingAgencia.id, {
          nombre_agencia: agenciaForm.nombre,
          direccion: agenciaForm.direccion,
          distrito: agenciaForm.distrito,
          provincia: agenciaForm.provincia,
          departamento: agenciaForm.departamento,
          telefono: agenciaForm.telefono,
          latitud: agenciaForm.latitud,
          longitud: agenciaForm.longitud,
          activa: agenciaForm.estado === 'Activo',
        });
        setAgenciasList((prev) =>
          prev.map((item) =>
            item.id === editingAgencia.id
              ? {
                  ...item,
                  nombre: agenciaForm.nombre,
                  direccion: agenciaForm.direccion,
                  distrito: agenciaForm.distrito,
                  provincia: agenciaForm.provincia,
                  departamento: agenciaForm.departamento,
                  telefono: agenciaForm.telefono,
                  lugar: `${agenciaForm.distrito}, ${agenciaForm.provincia}`,
                  ventanillas: agenciaForm.ventanillas,
                  estado: agenciaForm.estado,
                  latitud: agenciaForm.latitud,
                  longitud: agenciaForm.longitud,
                }
              : item
          )
        );
      } else {
        const created = await agencyRepo.createAgencyWithDependencies({
          nombre_agencia: agenciaForm.nombre,
          direccion: agenciaForm.direccion,
          distrito: agenciaForm.distrito,
          provincia: agenciaForm.provincia,
          departamento: agenciaForm.departamento,
          telefono: agenciaForm.telefono,
          latitud: agenciaForm.latitud,
          longitud: agenciaForm.longitud,
          total_ventanillas: agenciaForm.ventanillas,
          dias_semana: agenciaForm.diasSemana,
          hora_apertura: agenciaForm.horaApertura,
          hora_cierre: agenciaForm.horaCierre,
          hora_inicio_almuerzo: agenciaForm.horaInicioAlmuerzo,
          hora_fin_almuerzo: agenciaForm.horaFinAlmuerzo,
          tramite_ids: agenciaForm.tramitesSeleccionados,
        });

        const newRow = {
          id: created.id_agencia,
          nombre: created.nombre_agencia,
          direccion: created.direccion,
          distrito: created.distrito,
          provincia: created.provincia,
          departamento: created.departamento,
          telefono: created.telefono,
          lugar: `${created.distrito}, ${created.provincia || created.departamento || ''}`,
          ventanillas: created.total_ventanillas || agenciaForm.ventanillas,
          estado: 'Activo',
          latitud: created.latitud,
          longitud: created.longitud,
        };
        setAgenciasList((prev) => [newRow, ...prev]);
      }
      setModalAgenciaOpen(false);
      setEditingAgencia(null);
    } catch (err: any) {
      alert('Error al guardar la agencia: ' + (err.message || 'Error desconocido'));
    } finally {
      setIsSavingAgencia(false);
    }
  };

  // Borrado Lógico: Marca la agencia como Inactiva
  const handleDeleteAgencia = async (id: number) => {
    if (confirm('¿Estás seguro de dar de baja esta agencia? (Borrado lógico: pasará a estado Inactivo sin perder citas ni historial)')) {
      try {
        const agencyRepo = new SupabaseAgencyRepository();
        await agencyRepo.softDeleteAgency(id);
        setAgenciasList((prev) =>
          prev.map((a) => (a.id === id ? { ...a, estado: 'Inactivo' } : a))
        );
      } catch (err: any) {
        alert('Error al dar de baja la agencia: ' + err.message);
      }
    }
  };

  // Reactivar Agencia
  const handleReactivateAgencia = async (id: number) => {
    if (confirm('¿Deseas reactivar esta agencia para que vuelva a recibir citas?')) {
      try {
        const agencyRepo = new SupabaseAgencyRepository();
        await agencyRepo.reactivateAgency(id);
        setAgenciasList((prev) =>
          prev.map((a) => (a.id === id ? { ...a, estado: 'Activo' } : a))
        );
      } catch (err: any) {
        alert('Error al reactivar la agencia: ' + err.message);
      }
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
    const term = searchAgencias.toLowerCase();
    const matchSearch =
      !term ||
      ag.nombre.toLowerCase().includes(term) ||
      (ag.lugar && ag.lugar.toLowerCase().includes(term)) ||
      (ag.distrito && ag.distrito.toLowerCase().includes(term)) ||
      (ag.provincia && ag.provincia.toLowerCase().includes(term)) ||
      (ag.departamento && ag.departamento.toLowerCase().includes(term)) ||
      (ag.direccion && ag.direccion.toLowerCase().includes(term));
    const matchEstado =
      filterEstadoAgencias === 'todos' || ag.estado.toLowerCase() === filterEstadoAgencias.toLowerCase();
    const matchRegion =
      filterRegionAgencias === 'todos' ||
      (ag.departamento && ag.departamento.toLowerCase() === filterRegionAgencias.toLowerCase()) ||
      (ag.lugar && ag.lugar.toLowerCase().includes(filterRegionAgencias.toLowerCase()));
    return matchSearch && matchEstado && matchRegion;
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
                    setAgenciaModalTab('datos');
                    setAgenciaForm({
                      nombre: '',
                      departamento: 'Lima',
                      provincia: 'Lima',
                      distrito: 'Cercado de Lima',
                      direccion: '',
                      telefono: '',
                      latitud: -12.046374,
                      longitud: -77.042793,
                      ventanillas: 2,
                      estado: 'Activo',
                      diasSemana: [1, 2, 3, 4, 5],
                      horaApertura: '08:30',
                      horaCierre: '17:30',
                      horaInicioAlmuerzo: '13:00',
                      horaFinAlmuerzo: '14:00',
                      tramitesSeleccionados: tramitesList.filter((t) => t.estado === 'Activo').map((t) => t.id),
                    });
                    setModalAgenciaOpen(true);
                  }}
                  className="inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-extrabold px-5 py-2.5 rounded-xl shadow-md transition text-sm uppercase tracking-wider"
                >
                  <PlusIcon className="w-4 h-4" />
                  <span>Nueva Agencia</span>
                </button>
              </div>

              {/* Barra de Filtros Avanzada con Segmentación Territorial */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-6 relative">
                  <SearchIcon className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchAgencias}
                    onChange={(e) => setSearchAgencias(e.target.value)}
                    placeholder="Buscar por nombre, distrito o dirección..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100 transition shadow-sm"
                  />
                </div>
                <div className="sm:col-span-3">
                  <select
                    value={filterRegionAgencias}
                    onChange={(e) => setFilterRegionAgencias(e.target.value)}
                    className="w-full py-2.5 px-3 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100 transition shadow-sm"
                  >
                    <option value="todos">Todas las Regiones</option>
                    {PERU_UBIGEO.map((d) => (
                      <option key={d.nombre} value={d.nombre}>
                        {d.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-3">
                  <select
                    value={filterEstadoAgencias}
                    onChange={(e) => setFilterEstadoAgencias(e.target.value)}
                    className="w-full py-2.5 px-3 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100 transition shadow-sm"
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
                        <th className="p-4">NOMBRE DE AGENCIA</th>
                        <th className="p-4">UBICACIÓN (Distrito / Región)</th>
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
                                <div>
                                  <span className="font-extrabold text-slate-900 block">{ag.nombre}</span>
                                  {ag.direccion && (
                                    <span className="text-[11px] text-slate-500 font-normal">{ag.direccion}</span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="p-4 text-slate-600">
                              <div className="font-extrabold text-slate-800">{ag.distrito || ag.lugar}</div>
                              {(ag.departamento || ag.provincia) && (
                                <div className="text-[11px] text-slate-400 font-medium">
                                  {[ag.provincia, ag.departamento].filter(Boolean).join(' • ')}
                                </div>
                              )}
                            </td>
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
                                    setAgenciaModalTab('datos');
                                    setAgenciaForm({
                                      nombre: ag.nombre,
                                      departamento: ag.departamento || 'Lima',
                                      provincia: ag.provincia || 'Lima',
                                      distrito: ag.distrito || ag.lugar || 'Cercado de Lima',
                                      direccion: ag.direccion || ag.lugar,
                                      telefono: ag.telefono || '',
                                      latitud: ag.latitud || -12.046374,
                                      longitud: ag.longitud || -77.042793,
                                      ventanillas: ag.ventanillas || 1,
                                      estado: ag.estado,
                                      diasSemana: [1, 2, 3, 4, 5],
                                      horaApertura: '08:30',
                                      horaCierre: '17:30',
                                      horaInicioAlmuerzo: '13:00',
                                      horaFinAlmuerzo: '14:00',
                                      tramitesSeleccionados: [],
                                    });
                                    setModalAgenciaOpen(true);
                                  }}
                                  title="Editar"
                                  className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-red-700 rounded-lg transition"
                                >
                                  <EditIcon className="w-4 h-4" />
                                </button>
                                {ag.estado === 'Inactivo' ? (
                                  <button
                                    onClick={() => handleReactivateAgencia(ag.id)}
                                    title="Reactivar Agencia"
                                    className="p-1.5 hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700 rounded-lg transition"
                                  >
                                    <CheckCircleIcon className="w-4 h-4" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleDeleteAgencia(ag.id)}
                                    title="Dar de baja (Borrado Lógico)"
                                    className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition"
                                  >
                                    <TrashIcon className="w-4 h-4" />
                                  </button>
                                )}
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl border border-slate-200 animate-scaleUp my-6 max-h-[92vh] flex flex-col">
            {/* Cabecera del modal */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  {editingAgencia ? 'Editar Agencia' : 'Nueva Agencia Operativa'}
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {editingAgencia
                    ? 'Modifica los datos principales y geolocalización de la sede bancaria.'
                    : 'Configura la agencia, geolocalízala en el mapa, define ventanillas, horarios y sus trámites.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalAgenciaOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold transition shrink-0"
              >
                ✕
              </button>
            </div>

            {/* Pestañas de navegación interna si es creación */}
            {!editingAgencia && (
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl my-3 text-xs font-bold shrink-0">
                <button
                  type="button"
                  onClick={() => setAgenciaModalTab('datos')}
                  className={`flex-1 py-2 rounded-lg transition text-center ${
                    agenciaModalTab === 'datos'
                      ? 'bg-white text-red-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  1. Sede y Mapa
                </button>
                <button
                  type="button"
                  onClick={() => setAgenciaModalTab('horario')}
                  className={`flex-1 py-2 rounded-lg transition text-center ${
                    agenciaModalTab === 'horario'
                      ? 'bg-white text-red-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  2. Ventanillas y Horario
                </button>
                <button
                  type="button"
                  onClick={() => setAgenciaModalTab('tramites')}
                  className={`flex-1 py-2 rounded-lg transition text-center ${
                    agenciaModalTab === 'tramites'
                      ? 'bg-white text-red-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  3. Trámites ({agenciaForm.tramitesSeleccionados.length})
                </button>
              </div>
            )}

            <form onSubmit={handleSaveAgencia} className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs font-bold text-slate-700">
              {/* PESTAÑA 1: DATOS GENERALES Y MAPA */}
              {(editingAgencia || agenciaModalTab === 'datos') && (
                <div className="space-y-3.5 animate-fadeIn">
                  <div>
                    <label className="block mb-1 uppercase tracking-wider text-[11px] text-slate-600">Nombre de la Agencia *</label>
                    <input
                      type="text"
                      required
                      value={agenciaForm.nombre}
                      onChange={(e) => setAgenciaForm({ ...agenciaForm, nombre: e.target.value })}
                      placeholder="Ej: Agencia San Isidro Financiera"
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-100"
                    />
                  </div>

                  {/* Selectores Territoriales Cascadas: Región, Provincia, Distrito */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-slate-50/80 p-3 rounded-2xl border border-slate-200">
                    <div>
                      <label className="block mb-1 uppercase tracking-wider text-[10px] text-slate-600">
                        1. Región / Depto *
                      </label>
                      <select
                        value={agenciaForm.departamento}
                        onChange={(e) => {
                          const newDep = e.target.value;
                          const depObj = PERU_UBIGEO.find((d) => d.nombre === newDep);
                          const firstProv = depObj?.provincias[0]?.nombre || '';
                          const firstDist = depObj?.provincias[0]?.distritos[0] || '';
                          setAgenciaForm({
                            ...agenciaForm,
                            departamento: newDep,
                            provincia: firstProv,
                            distrito: firstDist,
                          });
                        }}
                        className="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-red-600 shadow-sm"
                      >
                        {PERU_UBIGEO.map((d) => (
                          <option key={d.nombre} value={d.nombre}>
                            {d.nombre}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block mb-1 uppercase tracking-wider text-[10px] text-slate-600">
                        2. Provincia *
                      </label>
                      <select
                        value={agenciaForm.provincia}
                        onChange={(e) => {
                          const newProv = e.target.value;
                          const provObj = availableProvincias.find((p) => p.nombre === newProv);
                          const firstDist = provObj?.distritos[0] || '';
                          setAgenciaForm({
                            ...agenciaForm,
                            provincia: newProv,
                            distrito: firstDist,
                          });
                        }}
                        className="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-red-600 shadow-sm"
                      >
                        {availableProvincias.map((p) => (
                          <option key={p.nombre} value={p.nombre}>
                            {p.nombre}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block mb-1 uppercase tracking-wider text-[10px] text-slate-600">
                        3. Distrito *
                      </label>
                      <select
                        value={agenciaForm.distrito}
                        onChange={(e) => {
                          setAgenciaForm({
                            ...agenciaForm,
                            distrito: e.target.value,
                          });
                        }}
                        className="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-red-600 shadow-sm"
                      >
                        {availableDistritos.map((dist) => (
                          <option key={dist} value={dist}>
                            {dist}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block mb-1 uppercase tracking-wider text-[11px] text-slate-600">Dirección Física *</label>
                      <input
                        type="text"
                        required
                        value={agenciaForm.direccion}
                        onChange={(e) => setAgenciaForm({ ...agenciaForm, direccion: e.target.value })}
                        placeholder="Ej: Av. Rivera Navarrete 525"
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-100"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 uppercase tracking-wider text-[11px] text-slate-600">Teléfono (Opcional)</label>
                      <input
                        type="text"
                        value={agenciaForm.telefono}
                        onChange={(e) => setAgenciaForm({ ...agenciaForm, telefono: e.target.value })}
                        placeholder="Ej: 01-315-9000"
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-100"
                      />
                    </div>
                  </div>

                  {/* Mapa Interactivo con Leaflet y Auto-desplazamiento territorial */}
                  <div className="pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="uppercase tracking-wider text-[11px] text-slate-600">
                        Geolocalización en Mapa (Se orienta al elegir distrito)
                      </label>
                      <span className="text-[10px] text-slate-400 font-medium">
                        Zona: {agenciaForm.distrito}, {agenciaForm.provincia}
                      </span>
                    </div>
                    <AgencyLocationPicker
                      initialLat={agenciaForm.latitud}
                      initialLng={agenciaForm.longitud}
                      departamento={agenciaForm.departamento}
                      provincia={agenciaForm.provincia}
                      distrito={agenciaForm.distrito}
                      direccion={agenciaForm.direccion}
                      onChange={({ lat, lng }) => {
                        setAgenciaForm((prev) => ({ ...prev, latitud: lat, longitud: lng }));
                      }}
                    />
                  </div>

                  {editingAgencia && (
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div>
                        <label className="block mb-1 uppercase tracking-wider text-[11px] text-slate-600">Ventanillas Registradas</label>
                        <input
                          type="number"
                          min="1"
                          max="30"
                          value={agenciaForm.ventanillas}
                          onChange={(e) => setAgenciaForm({ ...agenciaForm, ventanillas: parseInt(e.target.value) || 1 })}
                          className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block mb-1 uppercase tracking-wider text-[11px] text-slate-600">Estado</label>
                        <select
                          value={agenciaForm.estado}
                          onChange={(e) => setAgenciaForm({ ...agenciaForm, estado: e.target.value })}
                          className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900"
                        >
                          <option value="Activo">Activo</option>
                          <option value="Inactivo">Inactivo</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* PESTAÑA 2: VENTANILLAS Y HORARIO (Solo al crear nueva agencia) */}
              {!editingAgencia && agenciaModalTab === 'horario' && (
                <div className="space-y-4 animate-fadeIn">
                  {/* Ventanillas */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                    <label className="block uppercase tracking-wider text-[11px] text-slate-700">
                      Ventanillas Iniciales a Habilitar
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="1"
                        max="20"
                        required
                        value={agenciaForm.ventanillas}
                        onChange={(e) => setAgenciaForm({ ...agenciaForm, ventanillas: Math.max(1, parseInt(e.target.value) || 1) })}
                        className="w-24 p-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-red-600"
                      />
                      <span className="text-xs text-slate-500 font-medium">
                        Se registrarán automáticamente: {Array.from({ length: agenciaForm.ventanillas }, (_, i) => `V-${String(i + 1).padStart(2, '0')}`).join(', ')}.
                      </span>
                    </div>
                  </div>

                  {/* Horario de Atención */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="uppercase tracking-wider text-[11px] text-slate-700">
                        Días de Atención al Público
                      </span>
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-700">
                          <input
                            type="checkbox"
                            checked={agenciaForm.diasSemana.includes(6)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setAgenciaForm({ ...agenciaForm, diasSemana: [...agenciaForm.diasSemana, 6] });
                              } else {
                                setAgenciaForm({ ...agenciaForm, diasSemana: agenciaForm.diasSemana.filter((d) => d !== 6) });
                              }
                            }}
                            className="rounded text-red-600 focus:ring-red-500"
                          />
                          Incluir Sábado (Día 6)
                        </label>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200">
                      <div>
                        <label className="block mb-1 text-[10px] text-slate-500 uppercase">Apertura</label>
                        <input
                          type="time"
                          required
                          value={agenciaForm.horaApertura}
                          onChange={(e) => setAgenciaForm({ ...agenciaForm, horaApertura: e.target.value })}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block mb-1 text-[10px] text-slate-500 uppercase">Cierre</label>
                        <input
                          type="time"
                          required
                          value={agenciaForm.horaCierre}
                          onChange={(e) => setAgenciaForm({ ...agenciaForm, horaCierre: e.target.value })}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block mb-1 text-[10px] text-slate-500 uppercase">Inicio Almuerzo</label>
                        <input
                          type="time"
                          value={agenciaForm.horaInicioAlmuerzo}
                          onChange={(e) => setAgenciaForm({ ...agenciaForm, horaInicioAlmuerzo: e.target.value })}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block mb-1 text-[10px] text-slate-500 uppercase">Fin Almuerzo</label>
                        <input
                          type="time"
                          value={agenciaForm.horaFinAlmuerzo}
                          onChange={(e) => setAgenciaForm({ ...agenciaForm, horaFinAlmuerzo: e.target.value })}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                        />
                      </div>
                    </div>

                    <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-xl text-[11px] text-blue-900 font-medium flex items-center gap-2">
                      <ClockIcon className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>
                        <strong>Intervalo de Turnos:</strong> 15 minutos por defecto. La duración de las citas se adapta al tiempo establecido en el trámite.
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* PESTAÑA 3: TRÁMITES ASOCIADOS (Solo al crear nueva agencia) */}
              {!editingAgencia && agenciaModalTab === 'tramites' && (
                <div className="space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600 font-medium">
                      Elige los trámites disponibles en esta agencia:
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setAgenciaForm({
                            ...agenciaForm,
                            tramitesSeleccionados: tramitesList.filter((t) => t.estado === 'Activo').map((t) => t.id),
                          })
                        }
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold"
                      >
                        Marcar Todos
                      </button>
                      <button
                        type="button"
                        onClick={() => setAgenciaForm({ ...agenciaForm, tramitesSeleccionados: [] })}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold"
                      >
                        Desmarcar
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-1">
                    {tramitesList.map((tr) => {
                      const isSelected = agenciaForm.tramitesSeleccionados.includes(tr.id);
                      return (
                        <label
                          key={tr.id}
                          className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition text-xs ${
                            isSelected
                              ? 'bg-red-50/60 border-red-300 text-red-950 font-bold'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setAgenciaForm({
                                  ...agenciaForm,
                                  tramitesSeleccionados: [...agenciaForm.tramitesSeleccionados, tr.id],
                                });
                              } else {
                                setAgenciaForm({
                                  ...agenciaForm,
                                  tramitesSeleccionados: agenciaForm.tramitesSeleccionados.filter((id) => id !== tr.id),
                                });
                              }
                            }}
                            className="mt-0.5 rounded text-red-600 focus:ring-red-500"
                          />
                          <div>
                            <span className="block leading-tight">{tr.nombre}</span>
                            <span className="text-[10px] text-slate-400 font-normal">
                              Duración estándar (múltiplos de 15 min)
                            </span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Botonera de Acción */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-4">
                <button
                  type="button"
                  onClick={() => setModalAgenciaOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition"
                >
                  Cancelar
                </button>

                <div className="flex gap-2">
                  {!editingAgencia && agenciaModalTab !== 'datos' && (
                    <button
                      type="button"
                      onClick={() => {
                        if (agenciaModalTab === 'tramites') setAgenciaModalTab('horario');
                        else if (agenciaModalTab === 'horario') setAgenciaModalTab('datos');
                      }}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition"
                    >
                      ← Anterior
                    </button>
                  )}

                  {!editingAgencia && agenciaModalTab !== 'tramites' ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (!agenciaForm.nombre || !agenciaForm.distrito || !agenciaForm.direccion) {
                          alert('Por favor completa el nombre, distrito y dirección antes de avanzar.');
                          return;
                        }
                        if (agenciaModalTab === 'datos') setAgenciaModalTab('horario');
                        else if (agenciaModalTab === 'horario') setAgenciaModalTab('tramites');
                      }}
                      className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-md transition"
                    >
                      Siguiente →
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isSavingAgencia}
                      className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-extrabold shadow-md transition disabled:opacity-50 flex items-center gap-2"
                    >
                      {isSavingAgencia && (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      )}
                      <span>{editingAgencia ? 'Guardar Cambios' : 'Crear Agencia Completa'}</span>
                    </button>
                  )}
                </div>
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
