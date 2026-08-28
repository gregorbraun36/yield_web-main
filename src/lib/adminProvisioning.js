import { supabase } from '@/lib/supabase';

const ADMIN_CREATE_USER_FUNCTION = process.env.REACT_APP_ADMIN_CREATE_USER_FUNCTION || 'admin-create-user';

export const createAdminProvisionedUser = async ({ email, firstName, lastName }) => {
  const normalizedEmail = (email || '').trim().toLowerCase();
  const normalizedFirstName = (firstName || '').trim();
  const normalizedLastName = (lastName || '').trim();
  if (!normalizedEmail) {
    throw new Error('E-Mail ist erforderlich.');
  }

  const { data, error } = await supabase.functions.invoke(ADMIN_CREATE_USER_FUNCTION, {
    body: {
      email: normalizedEmail,
      firstName: normalizedFirstName || null,
      lastName: normalizedLastName || null,
    },
  });

  if (error) {
    let detailedMessage = error.message || 'Benutzer konnte nicht erstellt werden.';
    try {
      if (error.context) {
        const payload = await error.context.json();
        if (payload?.error) detailedMessage = payload.error;
      }
    } catch {
      // Keep fallback error message.
    }
    throw new Error(detailedMessage);
  }

  if (!data?.user || !data?.temporaryPassword) {
    throw new Error('Unvollständige Antwort vom Provisioning-Service.');
  }

  return data;
};

export const getProvisionedCredential = async (userId) => {
  const { data, error } = await supabase
    .from('admin_provisioned_credentials')
    .select('user_id, temporary_password, revealed_count, updated_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new Error(
      'Kein gespeichertes temporäres Passwort für diesen Benutzer (ältere Konten ohne Eintrag oder keine Admin-Berechtigung).'
    );
  }
  return data;
};
