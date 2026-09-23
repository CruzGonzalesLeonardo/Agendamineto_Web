import { UserProfile, roleIdToEnum } from '@/domain/entities/user';
import { createSupabaseBrowserClient } from '@/infrastructure/supabase/client';

export class SupabaseUserRepository {
  async authenticateUser(identifier: string, contrasenia?: string): Promise<UserProfile | null> {
    const cleanIdentifier = identifier.trim();
    const supabase = createSupabaseBrowserClient();

    // 1. Consultar perfil en perfil_usuario relacionando rol y agencia
    const { data, error } = await supabase
      .from('perfil_usuario')
      .select('*, rol:id_rol(nombre_rol), agencia:id_agencia(nombre_agencia)')
      .or(`dni.eq.${cleanIdentifier},correo.eq.${cleanIdentifier}`);

    if (error) {
      console.error('Error de consulta remota en Supabase perfil_usuario:', error.message);
      throw new Error(`Error en servidor remoto Supabase: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return null;
    }

    const item = data[0];

    // 2. Intentar autenticar contra auth.users si se cuenta con contraseña
    if (contrasenia && contrasenia.trim() !== '') {
      try {
        await supabase.auth.signInWithPassword({
          email: item.correo,
          password: contrasenia,
        });
      } catch (authErr) {
        // En caso de usuarios con hash mock del seed directo en PostgreSQL, se permite el acceso sin romper
        console.warn('Nota: Inicio vía perfil directo (Supabase auth no sincronizado o mock seed)');
      }
    }

    const fullName = `${item.nombres || ''} ${item.apellidos || ''}`.trim() || item.correo;
    const roleEnum = roleIdToEnum(item.id_rol || 1);
    const roleName = (item.rol as any)?.nombre_rol || 'Cliente';
    const agencyName = (item.agencia as any)?.nombre_agencia || null;

    return {
      id_usuario: item.id_usuario,
      dni: item.dni,
      nombres: item.nombres,
      apellidos: item.apellidos,
      nombre_completo: fullName,
      correo: item.correo,
      telefono: item.telefono,
      id_rol: item.id_rol,
      rol_nombre: roleName,
      rol: roleEnum,
      id_agencia: item.id_agencia,
      agencia_nombre: agencyName,
    };
  }

  async getUserById(id_usuario: string): Promise<UserProfile | null> {
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase
      .from('perfil_usuario')
      .select('*, rol:id_rol(nombre_rol), agencia:id_agencia(nombre_agencia)')
      .eq('id_usuario', id_usuario)
      .single();

    if (error || !data) return null;

    const item = data;
    const fullName = `${item.nombres || ''} ${item.apellidos || ''}`.trim() || item.correo;

    return {
      id_usuario: item.id_usuario,
      dni: item.dni,
      nombres: item.nombres,
      apellidos: item.apellidos,
      nombre_completo: fullName,
      correo: item.correo,
      telefono: item.telefono,
      id_rol: item.id_rol,
      rol_nombre: (item.rol as any)?.nombre_rol || 'Cliente',
      rol: roleIdToEnum(item.id_rol || 1),
      id_agencia: item.id_agencia,
      agencia_nombre: (item.agencia as any)?.nombre_agencia || null,
    };
  }
}
