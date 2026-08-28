import { supabase } from '@/lib/supabase';

const AVATAR_BUCKET = 'profile-avatars';
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const sanitizeFileName = (name) =>
  String(name || 'avatar')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

export const validateAvatarFile = (file) => {
  if (!file) throw new Error('Bitte wählen Sie eine Bilddatei aus.');
  if (!ACCEPTED_TYPES.includes(file.type)) {
    throw new Error('Nur JPG, PNG oder WEBP sind erlaubt.');
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('Datei ist zu groß. Maximal 5 MB erlaubt.');
  }
};

export const uploadProfileAvatar = async ({ file, userId }) => {
  validateAvatarFile(file);
  if (!userId) throw new Error('Benutzer-ID fehlt.');

  const extension = file.name?.split('.').pop()?.toLowerCase() || 'jpg';
  const safeBase = sanitizeFileName(file.name?.replace(/\.[^.]+$/, '') || 'avatar');
  const filePath = `${userId}/${Date.now()}-${safeBase}.${extension}`;

  const { error: uploadError } = await supabase
    .storage
    .from(AVATAR_BUCKET)
    .upload(filePath, file, { upsert: false, cacheControl: '3600' });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(filePath);
  if (!data?.publicUrl) throw new Error('Avatar URL konnte nicht erzeugt werden.');
  return data.publicUrl;
};

export const saveProfileAvatarUrl = async ({ userId, avatarUrl }) => {
  const { error } = await supabase
    .from('profiles')
    .update({ avatar_url: avatarUrl || null })
    .eq('id', userId);
  if (error) throw error;
};
