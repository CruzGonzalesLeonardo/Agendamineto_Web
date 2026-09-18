import { UserProfile } from '@/domain/entities/user';
import { createSupabaseBrowserClient } from '@/infrastructure/supabase/client';

export class SupabaseUserRepository {
  async authenticateUser(identifier: string, contrasenia: string): Promise<UserProfile | null> {
    const cleanIdentifier = identifier.trim();
    const supabase = createSupabaseBrowserClient();

    // Consulta directa en vivo al servidor de Supabase https://jrbzqhpacyejeahusvkc.supabase.co
    const { data, error } = await supabase
      .from('perfil_usuario')
      .select('*')
      .or(`dni.eq.${cleanIdentifier},correo.eq.${cleanIdentifier}`)
      .eq('contrasenia', contrasenia);

    if (error) {
      console.error('Error de consulta remota en Supabase:', error.message);
      throw new Error(`Error en servidor remoto Supabase: ${error.message}`);
    }

    if (data && data.length > 0) {
      return data[0] as UserProfile;
    }

    return null;
  }
}
