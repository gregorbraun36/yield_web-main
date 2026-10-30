import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { logActivityEvent } from '@/lib/activityFeed';
import {
  createLoginOtpChallenge,
  getDeviceFingerprintHash,
  isDeviceTrusted,
  revokeTrustedDevice as revokeTrustedDeviceRecord,
  verifyLoginOtpChallenge,
} from '@/lib/twoFactorAuth';

const AuthContext = createContext();
const PENDING_2FA_KEY = 'pending_2fa_login';

const readPendingTwoFactor = () => {
  try {
    const raw = sessionStorage.getItem(PENDING_2FA_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writePendingTwoFactor = (payload) => {
  if (!payload) {
    sessionStorage.removeItem(PENDING_2FA_KEY);
    return;
  }
  sessionStorage.setItem(PENDING_2FA_KEY, JSON.stringify(payload));
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [twoFactorPending, setTwoFactorPending] = useState(readPendingTwoFactor());

  const setPresenceStatus = async (userId, isOnline) => {
    if (!userId) return;
    try {
      await supabase.from('user_presence').upsert({
        user_id: userId,
        is_online: isOnline,
        last_seen_at: new Date().toISOString(),
      });
    } catch {
      // Presence is best-effort only.
    }
  };

  useEffect(() => {
    const sessionTimeout = new Promise((resolve) => {
      setTimeout(() => resolve({ data: { session: null } }), 8000);
    });
    Promise.race([supabase.auth.getSession(), sessionTimeout]).then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchProfile(session.user);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user?.id) return undefined;

    const beat = () => setPresenceStatus(user.id, true);
    beat();
    const intervalId = setInterval(beat, 45000);

    const handleVisible = () => {
      if (document.visibilityState === 'visible') beat();
    };
    document.addEventListener('visibilitychange', handleVisible);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisible);
      setPresenceStatus(user.id, false);
    };
  }, [user?.id]);

  const fetchProfile = async (authUser) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      const pending = readPendingTwoFactor();
      if (pending?.userId === authUser.id) {
        setTwoFactorPending(pending);
        setUser(null);
        setLoading(false);
        return;
      }

      // Onay bekleyen, reddedilen veya kapatılan hesapların oturumunu kapat.
      if (profile?.status === 'pending' || profile?.status === 'rejected' || profile?.status === 'deleted' || profile?.deleted_at) {
        await supabase.auth.signOut();
        setUser(null);
        setLoading(false);
        return;
      }

      setUser({
        id: authUser.id,
        email: authUser.email,
        role: profile?.role || 'user',
        first_name: profile?.first_name || null,
        last_name: profile?.last_name || null,
        country: profile?.country || null,
        address: profile?.address || null,
        phone: profile?.phone || null,
        avatar_url: profile?.avatar_url || null,
        verified: profile?.verified || false,
        status: profile?.status || 'pending',
        favorites: profile?.favorites || [],
        admin_created: profile?.admin_created || false,
        must_reset_password: Boolean(profile?.must_reset_password || profile?.must_change_password),
        onboarding_required: profile?.role === 'admin' ? false : (profile?.onboarding_required ?? true),
        onboarding_completed: profile?.onboarding_completed || false,
        two_factor_enabled: profile?.two_factor_enabled || false,
        two_factor_channel: profile?.two_factor_channel || 'email',
        two_factor_enabled_at: profile?.two_factor_enabled_at || null,
        created_at: authUser.created_at,
      });
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      setUser({ id: authUser.id, email: authUser.email, role: 'user', favorites: [] });
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.message?.includes('Invalid login credentials')) {
        await logActivityEvent({
          event_type: 'failed_login',
          summary: 'Fehlgeschlagene Anmeldung',
          payload: { email, reason: error.message },
        });
      }
      throw error;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profile?.status === 'pending') {
      await supabase.auth.signOut();
      const err = new Error(
        'Ihr Konto wartet noch auf Freischaltung durch einen Administrator. Sie erhalten eine E-Mail, sobald Ihr Konto aktiviert wurde.'
      );
      err.status = 'pending';
      throw err;
    }

    if (profile?.status === 'rejected') {
      await supabase.auth.signOut();
      const err = new Error(
        'Ihre Registrierung wurde leider nicht genehmigt. Bitte kontaktieren Sie uns unter info@h68-invest.de.'
      );
      err.status = 'rejected';
      throw err;
    }

    if (profile?.status === 'deleted' || profile?.deleted_at) {
      await supabase.auth.signOut();
      const err = new Error(
        'Dieses Konto wurde geschlossen. Bitte kontaktieren Sie uns unter info@h68-invest.de.'
      );
      err.status = 'deleted';
      throw err;
    }

    if (profile?.must_reset_password || profile?.must_change_password) {
      await logActivityEvent({
        event_type: 'user_login',
        summary: 'Benutzer angemeldet',
        payload: { email: data.user.email || email, requires_password_reset: true },
        user_id: data.user.id,
      });
      await logActivityEvent({
        event_type: 'first_login_reset_required',
        summary: 'Passwort-Reset beim ersten Login erforderlich',
        payload: { email },
        user_id: data.user.id,
      });
      return { redirectTo: '/auth/first-password-reset', user: data.user };
    }

    if (profile?.two_factor_enabled) {
      const deviceHash = await getDeviceFingerprintHash();
      const trusted = await isDeviceTrusted(data.user.id, deviceHash);
      if (!trusted) {
        await createLoginOtpChallenge({
          userId: data.user.id,
          email: data.user.email || email,
          deviceHash,
        });
        const pendingPayload = {
          userId: data.user.id,
          email: data.user.email || email,
          deviceHash,
          createdAt: new Date().toISOString(),
        };
        writePendingTwoFactor(pendingPayload);
        setTwoFactorPending(pendingPayload);
        await logActivityEvent({
          event_type: 'otp_sent',
          summary: '2FA OTP versendet',
          payload: { email: data.user.email || email },
          user_id: data.user.id,
        });
        return { requiresTwoFactor: true };
      }
    }

    await logActivityEvent({
      event_type: 'user_login',
      summary: 'Benutzer angemeldet',
      payload: {
        email: data.user.email || email,
        with_two_factor: Boolean(profile?.two_factor_enabled),
      },
      user_id: data.user.id,
    });

    if (profile?.onboarding_required && !profile?.onboarding_completed && profile?.role !== 'admin') {
      return { redirectTo: '/onboarding', user: data.user };
    }
    return { redirectTo: profile?.role === 'admin' ? '/admin' : '/dashboard', user: data.user };
  };

  const resendTwoFactorOtp = async () => {
    const pending = readPendingTwoFactor();
    if (!pending?.userId || !pending?.email) throw new Error('Keine ausstehende OTP-Anfrage.');
    await createLoginOtpChallenge({
      userId: pending.userId,
      email: pending.email,
      deviceHash: pending.deviceHash || (await getDeviceFingerprintHash()),
    });
  };

  const verifyTwoFactorOtp = async (code) => {
    const pending = readPendingTwoFactor();
    if (!pending?.userId) throw new Error('Keine ausstehende OTP-Anfrage.');
    const deviceHash = pending.deviceHash || (await getDeviceFingerprintHash());
    await verifyLoginOtpChallenge({
      userId: pending.userId,
      code,
      deviceHash,
    });
    writePendingTwoFactor(null);
    setTwoFactorPending(null);
    await logActivityEvent({
      event_type: 'otp_verified',
      summary: '2FA OTP verifiziert',
      payload: { user_id: pending.userId },
      user_id: pending.userId,
    });
    await logActivityEvent({
      event_type: 'user_login',
      summary: 'Benutzer angemeldet (2FA)',
      payload: { user_id: pending.userId, with_two_factor: true },
      user_id: pending.userId,
    });
    await refreshUser();

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', pending.userId)
      .single();

    if (profile?.must_reset_password || profile?.must_change_password) return { redirectTo: '/auth/first-password-reset' };
    if (profile?.onboarding_required && !profile?.onboarding_completed && profile?.role !== 'admin') {
      return { redirectTo: '/onboarding' };
    }
    return { redirectTo: profile?.role === 'admin' ? '/admin' : '/dashboard' };
  };

  const cancelTwoFactor = async () => {
    writePendingTwoFactor(null);
    setTwoFactorPending(null);
    await supabase.auth.signOut();
    setUser(null);
  };

  const updateTwoFactorSettings = async (enabled) => {
    const { data: authData } = await supabase.auth.getUser();
    const currentUserId = authData?.user?.id;
    if (!currentUserId) throw new Error('Aktiver Benutzer nicht gefunden.');
    const payload = {
      two_factor_enabled: Boolean(enabled),
      two_factor_channel: 'email',
      two_factor_enabled_at: enabled ? new Date().toISOString() : null,
    };
    const { error } = await supabase.from('profiles').update(payload).eq('id', currentUserId);
    if (error) throw error;
    await refreshUser();
  };

  const fetchTrustedDevices = useCallback(async () => {
    if (!user?.id) return [];
    const { data, error } = await supabase
      .from('trusted_devices')
      .select('id, device_label, created_at, last_used_at, expires_at, revoked_at')
      .eq('user_id', user.id)
      .order('last_used_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }, [user?.id]);

  const revokeTrustedDevice = async (deviceId) => {
    await revokeTrustedDeviceRecord(deviceId);
  };

  const register = async ({ email, password, first_name, last_name, country, phone, address }) => {
    // 1. Supabase Auth'da kullanıcı oluştur
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;

    if (data.user) {
      // 2. profiles tablosunu güncelle — status: 'pending'
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          email,
          first_name: first_name || null,
          last_name: last_name || null,
          country: country || null,
          phone: phone || null,
          address: address || null,
          role: 'user',
          verified: false,
          status: 'pending',
          onboarding_required: true,
          onboarding_completed: false,
        })
        .eq('id', data.user.id);

      if (profileError) throw profileError;

      // 3. Kayıt sonrası oturumu kapat — admin onayına kadar giriş yapılamaz
      await supabase.auth.signOut();
    }

    return { pendingApproval: true };
  };

  const logout = async () => {
    const currentUserId = user?.id || null;
    const currentEmail = user?.email || null;
    await setPresenceStatus(user?.id, false);
    writePendingTwoFactor(null);
    setTwoFactorPending(null);
    await supabase.auth.signOut();
    await logActivityEvent({
      event_type: 'user_logout',
      summary: 'Benutzer abgemeldet',
      payload: { email: currentEmail },
      user_id: currentUserId,
    });
    setUser(null);
  };

  const refreshUser = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) await fetchProfile(authUser);
  };

  const completeFirstPasswordReset = async (nextPassword) => {
    const { error } = await supabase.auth.updateUser({ password: nextPassword });
    if (error) throw error;

    const { data: authData } = await supabase.auth.getUser();
    const currentUserId = authData?.user?.id;
    if (!currentUserId) throw new Error('Aktiver Benutzer nicht gefunden.');

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        must_reset_password: false,
        temporary_password_updated_at: new Date().toISOString(),
      })
      .eq('id', currentUserId);

    if (profileError) throw profileError;
    await logActivityEvent({
      event_type: 'password_reset_completed',
      summary: 'Passwort beim ersten Login geändert',
      payload: { email: authData?.user?.email || null },
      user_id: currentUserId,
    });
    await refreshUser();
  };

  const completeOnboarding = async ({ first_name, last_name, country, phone, address }) => {
    const { data: authData } = await supabase.auth.getUser();
    const currentUserId = authData?.user?.id;
    if (!currentUserId) throw new Error('Aktiver Benutzer nicht gefunden.');

    const { error } = await supabase
      .from('profiles')
      .update({
        first_name: first_name?.trim() || null,
        last_name: last_name?.trim() || null,
        country: country?.trim() || null,
        phone: phone?.trim() || null,
        address: address?.trim() || null,
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
      })
      .eq('id', currentUserId);

    if (error) throw error;
    await logActivityEvent({
      event_type: 'onboarding_completed',
      summary: 'Onboarding abgeschlossen',
      payload: { email: authData?.user?.email || null },
      user_id: currentUserId,
    });
    await refreshUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        loading,
        twoFactorPending,
        resendTwoFactorOtp,
        verifyTwoFactorOtp,
        cancelTwoFactor,
        updateTwoFactorSettings,
        fetchTrustedDevices,
        revokeTrustedDevice,
        refreshUser,
        completeFirstPasswordReset,
        completeOnboarding,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);