import { supabase } from '@/lib/supabase';

const OTP_PURPOSE = 'login_2fa';
const TRUST_DAYS = 30;

const toHex = (buffer) => Array.from(new Uint8Array(buffer))
  .map((b) => b.toString(16).padStart(2, '0'))
  .join('');

export const sha256Hex = async (value) => {
  const data = new TextEncoder().encode(String(value || ''));
  const digest = await crypto.subtle.digest('SHA-256', data);
  return toHex(digest);
};

export const generateOtpCode = () => `${Math.floor(100000 + Math.random() * 900000)}`;

export const getDeviceFingerprintSource = () => {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown';
  const nav = window.navigator;
  const scr = window.screen;
  return [
    nav.userAgent || '',
    nav.platform || '',
    nav.language || '',
    tz,
    `${scr.width || 0}x${scr.height || 0}`,
  ].join('|');
};

export const getDeviceFingerprintHash = async () => sha256Hex(getDeviceFingerprintSource());

export const isDeviceTrusted = async (userId, deviceHash) => {
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from('trusted_devices')
    .select('id')
    .eq('user_id', userId)
    .eq('device_fingerprint_hash', deviceHash)
    .is('revoked_at', null)
    .gt('expires_at', nowIso)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data?.id);
};

export const createLoginOtpChallenge = async ({ userId, email, deviceHash }) => {
  const code = generateOtpCode();
  const otpHash = await sha256Hex(code);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('auth_otp_challenges')
    .insert({
      user_id: userId,
      email,
      purpose: OTP_PURPOSE,
      otp_hash: otpHash,
      code_expires_at: expiresAt,
      device_fingerprint_hash: deviceHash,
    })
    .select('id, code_expires_at')
    .single();

  if (error) throw error;

  const { error: invokeError } = await supabase.functions.invoke('send-auth-otp', {
    body: {
      email,
      code,
      purpose: OTP_PURPOSE,
      userId,
    },
  });

  if (invokeError) throw invokeError;

  return data;
};

export const verifyLoginOtpChallenge = async ({ userId, code, deviceHash }) => {
  const { data: challenge, error } = await supabase
    .from('auth_otp_challenges')
    .select('*')
    .eq('user_id', userId)
    .eq('purpose', OTP_PURPOSE)
    .is('consumed_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!challenge?.id) throw new Error('Keine aktive OTP-Anfrage gefunden.');

  const now = new Date();
  const expiresAt = new Date(challenge.code_expires_at);
  if (expiresAt < now) throw new Error('OTP ist abgelaufen. Bitte neuen Code anfordern.');
  if (challenge.cooldown_until && new Date(challenge.cooldown_until) > now) {
    throw new Error('Zu viele Fehlversuche. Bitte später erneut versuchen.');
  }
  if (challenge.attempts >= challenge.max_attempts) {
    throw new Error('Maximale Anzahl an OTP-Versuchen erreicht.');
  }

  const submittedHash = await sha256Hex(code);
  if (submittedHash !== challenge.otp_hash) {
    const nextAttempts = Number(challenge.attempts || 0) + 1;
    const shouldCooldown = nextAttempts >= Number(challenge.max_attempts || 5);
    await supabase
      .from('auth_otp_challenges')
      .update({
        attempts: nextAttempts,
        cooldown_until: shouldCooldown ? new Date(Date.now() + 5 * 60 * 1000).toISOString() : null,
      })
      .eq('id', challenge.id);
    throw new Error('Ungültiger OTP-Code.');
  }

  await supabase
    .from('auth_otp_challenges')
    .update({
      consumed_at: now.toISOString(),
      attempts: Number(challenge.attempts || 0) + 1,
      cooldown_until: null,
    })
    .eq('id', challenge.id);

  const expiresAtDevice = new Date();
  expiresAtDevice.setDate(expiresAtDevice.getDate() + TRUST_DAYS);

  await supabase
    .from('trusted_devices')
    .upsert({
      user_id: userId,
      device_fingerprint_hash: deviceHash,
      device_label: 'Browser',
      expires_at: expiresAtDevice.toISOString(),
      last_used_at: now.toISOString(),
      revoked_at: null,
    }, { onConflict: 'user_id,device_fingerprint_hash' });
};

export const revokeTrustedDevice = async (deviceId) => {
  const { error } = await supabase
    .from('trusted_devices')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', deviceId);
  if (error) throw error;
};
