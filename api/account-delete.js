import { createClient } from '@supabase/supabase-js';

const parseToken = (authHeader = '') => {
  if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) return null;
  return authHeader.slice(7).trim() || null;
};

const toNumber = (value) => Number(value || 0);

const buildChecks = ({ activeContracts, availableBalance, pendingTransactions, activeSavingsPlans, errors = {} }) => ([
  {
    key: 'active_contracts',
    title: 'Keine offenen Anlagen',
    description: errors.activeContracts
      ? `Prüfung fehlgeschlagen: ${errors.activeContracts}`
      : activeContracts > 0
        ? `${activeContracts} aktive Anlage(n) vorhanden.`
        : 'Sie haben keine aktiven Anlagen oder alle Anlagen wurden beendet.',
    passed: !errors.activeContracts && activeContracts === 0,
  },
  {
    key: 'available_balance',
    title: 'Kein vorhandenes Guthaben',
    description: errors.availableBalance
      ? `Prüfung fehlgeschlagen: ${errors.availableBalance}`
      : availableBalance > 0
        ? `Ihr verfügbares Guthaben beträgt ${availableBalance.toFixed(2)} €.`
        : 'Ihr Guthaben beträgt 0,00 €.',
    passed: !errors.availableBalance && availableBalance <= 0.009,
  },
  {
    key: 'pending_transactions',
    title: 'Keine ausstehenden Transaktionen',
    description: errors.pendingTransactions
      ? `Prüfung fehlgeschlagen: ${errors.pendingTransactions}`
      : pendingTransactions > 0
        ? `${pendingTransactions} ausstehende Transaktion(en) gefunden.`
        : 'Es sind keine Transaktionen in Bearbeitung.',
    passed: !errors.pendingTransactions && pendingTransactions === 0,
  },
  {
    key: 'active_savings_plans',
    title: 'Keine laufenden Sparpläne',
    description: activeSavingsPlans > 0
      ? `${activeSavingsPlans} laufende Sparpläne vorhanden.`
      : 'Sie haben keine aktiven Sparpläne.',
    passed: activeSavingsPlans === 0,
  },
]);

const computeDeleteChecks = async ({ adminClient, userId }) => {
  const errors = {};
  let activeContracts = 0;
  let availableBalance = 0;
  let pendingTransactions = 0;

  const [activeContractsResult, latestSnapshotResult, pendingTransactionsResult] = await Promise.all([
    adminClient
      .from('portfolio_contracts')
      .select('id, status, is_active')
      .eq('user_id', userId)
      .eq('is_active', true),
    adminClient
      .from('portfolio_daily_snapshots')
      .select('available_eur')
      .eq('user_id', userId)
      .order('snapshot_date', { ascending: false })
      .limit(1)
      .maybeSingle(),
    adminClient
      .from('portfolio_cashflows')
      .select('id, flow_date')
      .eq('user_id', userId)
      .gte('flow_date', new Date().toISOString().slice(0, 10)),
  ]);

  if (activeContractsResult.error) {
    errors.activeContracts = activeContractsResult.error.message;
  } else {
    const endedStatuses = new Set(['rejected', 'beendet', 'gekündigt', 'closed']);
    activeContracts = (activeContractsResult.data || []).filter((row) => !endedStatuses.has(String(row.status || '').toLowerCase())).length;
  }

  if (latestSnapshotResult.error) {
    errors.availableBalance = latestSnapshotResult.error.message;
  } else {
    availableBalance = toNumber(latestSnapshotResult.data?.available_eur);
  }

  if (pendingTransactionsResult.error) {
    errors.pendingTransactions = pendingTransactionsResult.error.message;
  } else {
    pendingTransactions = (pendingTransactionsResult.data || []).length;
  }

  const activeSavingsPlans = 0;
  const checks = buildChecks({
    activeContracts,
    availableBalance,
    pendingTransactions,
    activeSavingsPlans,
    errors,
  });
  const canDelete = checks.every((row) => row.passed);
  return {
    checks,
    canDelete,
    hasErrors: Object.keys(errors).length > 0,
    errors,
    snapshot: {
      activeContracts,
      availableBalance,
      pendingTransactions,
      activeSavingsPlans,
    },
  };
};

export default async function handler(req, res) {
  if (!['GET', 'POST'].includes(req.method)) {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    return res.status(500).json({ error: 'Supabase server environment is not configured' });
  }

  const token = parseToken(req.headers.authorization);
  if (!token) {
    return res.status(401).json({ error: 'Missing or invalid authorization token' });
  }

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  try {
    const { data: authResult, error: authError } = await userClient.auth.getUser();
    if (authError || !authResult?.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const actor = authResult.user;

    if (req.method === 'GET') {
      const payload = await computeDeleteChecks({ adminClient, userId: actor.id });
      return res.status(200).json(payload);
    }

    const password = String(req.body?.password || '').trim();
    if (!password) {
      return res.status(400).json({ error: 'Passwort ist erforderlich.' });
    }

    const verifyClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    });
    const { data: verifyResult, error: verifyError } = await verifyClient.auth.signInWithPassword({
      email: actor.email,
      password,
    });
    await verifyClient.auth.signOut();
    if (verifyError || verifyResult?.user?.id !== actor.id) {
      return res.status(401).json({ error: 'Passwort ist ungültig.' });
    }

    const checkPayload = await computeDeleteChecks({ adminClient, userId: actor.id });
    if (!checkPayload.canDelete) {
      return res.status(409).json({
        error: 'Konto kann aufgrund offener Bedingungen nicht gelöscht werden.',
        ...checkPayload,
      });
    }

    const nowIso = new Date().toISOString();
    const { error: profileError } = await adminClient
      .from('profiles')
      .update({
        status: 'deleted',
        deleted_at: nowIso,
        delete_requested_at: nowIso,
        delete_reason: 'self_service_soft_delete',
      })
      .eq('id', actor.id);
    if (profileError) {
      return res.status(500).json({ error: profileError.message || 'Profil konnte nicht aktualisiert werden.' });
    }

    await adminClient
      .from('trusted_devices')
      .update({ revoked_at: nowIso })
      .eq('user_id', actor.id)
      .is('revoked_at', null);

    await adminClient
      .from('user_presence')
      .upsert({
        user_id: actor.id,
        is_online: false,
        last_seen_at: nowIso,
      });

    return res.status(200).json({
      ok: true,
      completedAt: nowIso,
      ...checkPayload,
    });
  } catch (error) {
    return res.status(500).json({ error: error?.message || 'Internal server error' });
  }
}
