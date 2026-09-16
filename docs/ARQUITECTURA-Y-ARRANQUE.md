# Sistema de agendamiento

## Propósito
Construir una aplicación web para orientar a la ciudadanía, consultar trámites y reservar citas en agencias. La solución se despliega como una aplicación Next.js en Vercel y usa Supabase como proveedor de identidad y persistencia.

## Componentes
| Componente | Propósito | Ubicación inicial |
| --- | --- | --- |
| Aplicación cliente | Renderiza pantallas, rutas y componentes accesibles. | `src/app`, `src/components` |
| Servidor de aplicaciones | Ejecuta SSR/SSG, Server Actions y endpoints; coordina casos de uso. | Next.js App Router y `src/application` |
| Autenticación | Registro, sesiones y RBAC con Supabase Auth. | `src/infrastructure/supabase` |
| Base de datos | Persiste usuarios, agencias, trámites, horarios y citas en PostgreSQL. | `src/infrastructure/repositories` |
| Notificaciones | Envía confirmaciones y recordatorios por email o SMS. | `src/infrastructure/notifications` |

## Capas
- **Presentación:** rutas, páginas y componentes; no contiene SQL ni reglas de negocio.
- **Aplicación:** casos de uso; coordina repositorios y servicios mediante interfaces.
- **Dominio:** entidades y reglas independientes de Next.js, Supabase y proveedores externos.
- **Infraestructura:** implementa interfaces con Supabase y servicios de mensajería.

## Cómo empezar
1. Ejecutar `npm install`. Si aparece `ECONNRESET`, revisar red/proxy y repetir.
2. Crear `.env.local` con `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Crear tablas `profiles`, `agencies`, `procedures`, `appointments` y políticas RLS. La tabla de citas debe incluir `citizen_id`, `agency_id`, `procedure_id`, `starts_at` y `status`.
4. Definir roles `citizen`, `agency_staff` y `admin` en `profiles`.
5. Implementar disponibilidad y el formulario de `/agendar` con Server Actions.
6. Elegir proveedor de email/SMS y completar `ExternalNotificationService` con variables de servidor.
7. Validar con `npm run lint`, `npm run build` y `npm run dev`.
8. Conectar el repositorio a Vercel y registrar variables en Preview y Production.

## Reglas técnicas
- La presentación nunca accede directamente a Supabase.
- El dominio no importa Next.js, Supabase ni SDKs externos.
- Las credenciales privadas solo viven en el servidor.
- Toda operación de datos pasa por un repositorio y respeta RLS.
- Las notificaciones deben tolerar fallos y evitar confirmaciones duplicadas.

## Próxima iteración
Agregar migraciones SQL versionadas, autenticación completa, disponibilidad, creación transaccional de citas y pruebas unitarias de `createAppointment`.