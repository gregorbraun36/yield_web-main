type OtpRequest = {
  email?: string;
  code?: string;
  purpose?: string;
  userId?: string;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const htmlTemplate = (code: string, purpose: string) => `
  <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#0f172a">
    <h2 style="margin:0 0 12px;color:#0B1E33">Vitruvian Invest Sicherheitscode</h2>
    <p style="margin:0 0 16px;font-size:14px;line-height:1.5">
      Bitte verwenden Sie den folgenden OTP-Code, um den Login (${purpose}) abzuschließen.
      Der Code ist 10 Minuten gültig.
    </p>
    <div style="font-size:32px;letter-spacing:6px;font-weight:700;padding:14px 18px;border-radius:10px;background:#f1f5f9;display:inline-block">
      ${code}
    </div>
    <p style="margin-top:20px;font-size:12px;color:#64748b">
      Wenn Sie diese Anfrage nicht gestellt haben, ignorieren Sie diese E-Mail.
    </p>
  </div>
`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { email, code, purpose = 'login_2fa', userId } = (await req.json()) as OtpRequest;
    const targetEmail = (email || '').trim().toLowerCase();
    const otp = (code || '').trim();
    if (!targetEmail || !otp) {
      return new Response(JSON.stringify({ error: 'email and code are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const sender = Deno.env.get('OTP_FROM_EMAIL') || 'Vitruvian Invest <no-reply@vitruvianinvest.com>';
    if (!resendApiKey) {
      return new Response(JSON.stringify({ error: 'RESEND_API_KEY is not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: sender,
        to: [targetEmail],
        subject: 'Ihr OTP-Code für Vitruvian Invest',
        html: htmlTemplate(otp, purpose),
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      return new Response(JSON.stringify({ error: `mail delivery failed: ${body}` }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true, userId, email: targetEmail }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message || 'unexpected error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
