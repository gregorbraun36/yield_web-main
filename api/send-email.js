export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, subject, html } = req.body || {};

  if (!subject || !html) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.SENDER_EMAIL || 'info@h68-invest.de';
  const toEmail = to || process.env.SENDER_EMAIL || 'info@h68-invest.de';

  if (!apiKey) {
    console.error('RESEND_API_KEY is not set');
    return res.status(500).json({ error: 'Email service not configured' });
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: `H68 Spar Direkt <${fromEmail}>`,
        to: [toEmail],
        subject,
        html: html.includes('h68-logo.png')
          ? html
          : `<div style="font-family:Arial,Helvetica,sans-serif;color:#0B1E33">
               <img src="https://h68-invest.de/assets/logo/h68-logo.png" alt="H68 Vermögensverwaltung" height="40" style="height:40px;width:auto;margin-bottom:20px" />
               ${html}
             </div>`,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Resend API error:', data);
      return res.status(response.status).json({ error: data?.message || 'Failed to send email' });
    }

    return res.status(200).json({ success: true, id: data.id });
  } catch (error) {
    console.error('Email send error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
