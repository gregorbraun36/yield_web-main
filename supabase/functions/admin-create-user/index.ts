import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

type CreateRequest = {
  email?: string;
  firstName?: string | null;
  lastName?: string | null;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const generateTemporaryPassword = (length = 14) => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*?';
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('');
};

function isDuplicateEmailError(message: string | undefined) {
  if (!message) return false;
  const m = message.toLowerCase();
  return m.includes('already') || m.includes('registered') || m.includes('exists') || m.includes('duplicate');
}

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const buildProvisioningMailHtml = ({
  fullName,
  temporaryPassword,
  loginUrl,
}: {
  fullName: string;
  temporaryPassword: string;
  loginUrl: string;
}) => `
  <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;padding:24px;color:#0f172a">
    <h2 style="margin:0 0 10px;color:#0B1E33">Ihr Konto wurde freigeschaltet</h2>
    <p style="margin:0 0 14px;font-size:15px;line-height:1.5">Sehr geehrte(r) ${escapeHtml(fullName)},</p>
    <p style="margin:0 0 14px;font-size:15px;line-height:1.6">
      Ihr Konto bei H68 Vermögensverwaltung h68-invest.de ist jetzt aktiv.
      Bitte verwenden Sie beim ersten Login das unten stehende temporäre Passwort.
    </p>
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px;margin:18px 0">
      <p style="margin:0 0 8px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:.04em">Temporäres Passwort</p>
      <p style="margin:0;font-size:20px;font-weight:700;word-break:break-all;color:#0B1E33">${escapeHtml(temporaryPassword)}</p>
    </div>
    <p style="margin:0 0 16px;font-size:14px;line-height:1.5;color:#334155">
      Aus Sicherheitsgründen müssen Sie dieses Passwort direkt nach dem ersten Login ändern.
    </p>
    <a href="${escapeHtml(loginUrl)}" style="display:inline-block;background:#0B1E33;color:#ffffff;text-decoration:none;padding:11px 18px;border-radius:8px;font-weight:600">
      Jetzt anmelden
    </a>
  </div>
`;

async function sendProvisioningEmail({
  email,
  firstName,
  lastName,
  temporaryPassword,
}: {
  email: string;
  firstName: string | null;
  lastName: string | null;
  temporaryPassword: string;
}) {
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  if (!resendApiKey) {
    return { ok: false, error: 'RESEND_API_KEY is not configured' };
  }

  const sender =
    Deno.env.get('PROVISIONING_FROM_EMAIL')
    || Deno.env.get('OTP_FROM_EMAIL')
    || 'H68 Vermögensverwaltung <info@h68-invest.de>';
  const loginUrl = Deno.env.get('APP_LOGIN_URL') || 'https://h68-invest.de/login';
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim() || 'Kunde';

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: sender,
      to: [email],
      subject: 'H68 Vermögensverwaltung h68-invest.de - Ihr Konto ist aktiv',
      html: buildProvisioningMailHtml({
        fullName,
        temporaryPassword,
        loginUrl,
      }),
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    return { ok: false, error: `mail delivery failed: ${body}` };
  }

  return { ok: true, error: null };
}

async function finalizeProvisioning(
  adminClient: SupabaseClient,
  actorUserId: string,
  actorEmail: string | undefined,
  userId: string,
  email: string,
  firstName: string | null,
  lastName: string | null,
  temporaryPassword: string,
  reprovisioned: boolean,
) {
  let effectiveFirstName = firstName?.trim() || null;
  let effectiveLastName = lastName?.trim() || null;

  if (reprovisioned && (!effectiveFirstName || !effectiveLastName)) {
    const { data: existingProfile } = await adminClient
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', userId)
      .maybeSingle();
    if (!effectiveFirstName) effectiveFirstName = existingProfile?.first_name || null;
    if (!effectiveLastName) effectiveLastName = existingProfile?.last_name || null;
  }

  const { error: profileUpsertError } = await adminClient.from('profiles').upsert({
    id: userId,
    email,
    first_name: effectiveFirstName,
    last_name: effectiveLastName,
    country: null,
    phone: null,
    address: null,
    role: 'user',
    status: 'approved',
    verified: true,
    rejection_reason: null,
    admin_created: true,
    must_reset_password: true,
    onboarding_required: true,
    onboarding_completed: false,
    temporary_password_updated_at: new Date().toISOString(),
  });

  if (profileUpsertError) {
    return new Response(JSON.stringify({ error: profileUpsertError.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { error: credentialError } = await adminClient.from('admin_provisioned_credentials').upsert({
    user_id: userId,
    temporary_password: temporaryPassword,
    revealed_count: 1,
  });

  if (credentialError) {
    return new Response(JSON.stringify({ error: credentialError.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { error: auditError } = await adminClient.from('admin_audit_events').insert({
    actor_user_id: actorUserId,
    target_user_id: userId,
    event_type: 'admin_user_created',
    payload: { email },
  });

  if (auditError) {
    return new Response(JSON.stringify({ error: auditError.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { error: activityError } = await adminClient.from('admin_activity_feed').insert({
    user_id: userId,
    event_type: 'admin_user_created',
    summary: 'Benutzer wurde vom Admin erstellt bzw. re-provisioned.',
    payload: { email, actor: actorEmail },
  });

  if (activityError) {
    return new Response(JSON.stringify({ error: activityError.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const mailResult = await sendProvisioningEmail({
    email,
    firstName: effectiveFirstName,
    lastName: effectiveLastName,
    temporaryPassword,
  });

  return new Response(
    JSON.stringify({
      user: { id: userId, email },
      profile: { first_name: effectiveFirstName, last_name: effectiveLastName },
      temporaryPassword,
      mustResetPassword: true,
      reprovisioned,
      mailSent: mailResult.ok,
      mailError: mailResult.error,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } },
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing auth header.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: { persistSession: false },
        global: { headers: { Authorization: `Bearer ${token}` } },
      },
    );

    const { data: actorResult, error: actorError } = await userClient.auth.getUser();
    if (actorError || !actorResult.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: actorProfile, error: actorProfileError } = await adminClient
      .from('profiles')
      .select('id, role')
      .eq('id', actorResult.user.id)
      .single();

    if (actorProfileError || actorProfile?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Admin permissions required.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = (await req.json()) as CreateRequest;
    const email = (body.email || '').trim().toLowerCase();
    const firstName = (body.firstName || '').trim() || null;
    const lastName = (body.lastName || '').trim() || null;
    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const temporaryPassword = generateTemporaryPassword();
    let userId: string | null = null;
    let reprovisioned = false;

    const { data: created, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: { provisioned_by_admin: true, first_name: firstName, last_name: lastName },
    });

    if (created?.user?.id) {
      userId = created.user.id;
    } else if (createError && isDuplicateEmailError(createError.message)) {
      reprovisioned = true;

      const { data: existingId, error: lookupError } = await adminClient.rpc('get_auth_user_id_by_email', {
        p_email: email,
      });

      if (lookupError || !existingId) {
        return new Response(
          JSON.stringify({
            error:
              createError.message ||
              'Ein Benutzer mit dieser E-Mail existiert bereits; UUID konnte aber nicht ermittelt werden.',
          }),
          {
            status: 409,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          },
        );
      }

      userId = existingId as string;

      const { error: updateAuthError } = await adminClient.auth.admin.updateUserById(userId, {
        password: temporaryPassword,
        email_confirm: true,
        user_metadata: { provisioned_by_admin: true, first_name: firstName, last_name: lastName },
      });

      if (updateAuthError) {
        return new Response(JSON.stringify({ error: updateAuthError.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else {
      return new Response(JSON.stringify({ error: createError?.message || 'Failed to create user.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return await finalizeProvisioning(
      adminClient,
      actorResult.user.id,
      actorResult.user.email,
      userId,
      email,
      firstName,
      lastName,
      temporaryPassword,
      reprovisioned,
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
