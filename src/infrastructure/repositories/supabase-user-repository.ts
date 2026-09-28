import { UserProfile, roleIdToEnum } from '@/domain/entities/user';
import { createSupabaseBrowserClient } from '@/infrastructure/supabase/client';

export class SupabaseUserRepository {
  async authenticateUser(identifier: string, contrasenia?: string): Promise<UserProfile | null> {
    const cleanIdentifier = identifier.trim();
    const cleanPassword = (contrasenia || '').trim();

    if (!cleanIdentifier || !cleanPassword) {
      return null;
    }

    const supabase = createSupabaseBrowserClient();

    // 1. Consultar perfil en perfil_usuario relacionando rol y agencia
    // Permitir ingresar tanto DNI como Correo electrónico
    let query = supabase
      .from('perfil_usuario')
      .select('*, rol:id_rol(nombre_rol), agencia:id_agencia(nombre_agencia)');

    if (cleanIdentifier.includes('@')) {
      query = query.ilike('correo', cleanIdentifier);
    } else if (/^\d+$/.test(cleanIdentifier)) {
      query = query.eq('dni', cleanIdentifier);
    } else {
      query = query.or(`dni.eq.${cleanIdentifier},correo.ilike.${cleanIdentifier}`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error de consulta remota en Supabase perfil_usuario:', error.message);
      throw new Error(`Error en servidor remoto Supabase: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return null;
    }

    const item = data[0];

    // 2. Validación de contraseña tradicional almacenada en perfil_usuario (password_hash)
    const dbPassword = item.password_hash ?? item.contraseña ?? (item as any)['contrasenia'] ?? null;
    let isValidPassword = false;

    if (dbPassword !== null && dbPassword !== undefined) {
      if (String(dbPassword).trim() === cleanPassword) {
        isValidPassword = true;
      }
    }

    // Respaldo secundario con Supabase Auth si está configurado
    if (!isValidPassword) {
      try {
        const { error: authErr } = await supabase.auth.signInWithPassword({
          email: item.correo,
          password: cleanPassword,
        });
        if (!authErr) {
          isValidPassword = true;
        }
      } catch (authErr) {
        // Ignorar si auth no está sincronizado
      }
    }

    // Si la contraseña no coincide con la base de datos ni con auth, denegar acceso
    if (!isValidPassword) {
      return null;
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
      password_hash: item.password_hash ?? item.contraseña ?? null,
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
      password_hash: item.password_hash ?? item.contraseña ?? null,
    };
  }
}
