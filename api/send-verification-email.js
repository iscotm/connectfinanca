// Vercel Serverless Function para enviar e-mails via Brevo API
export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const BREVO_API_KEY = process.env.BREVO_API_KEY;
  if (!BREVO_API_KEY) {
    console.error('BREVO_API_KEY não configurada nas variáveis de ambiente');
    return res.status(500).json({ error: 'Configuração do servidor de e-mail incompleta.' });
  }

  const { email, code, userName } = req.body;

  if (!email || !code) {
    return res.status(400).json({ error: 'E-mail e código são obrigatórios.' });
  }

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#1e293b;border-radius:16px;border:1px solid #334155;overflow:hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#2563eb,#6366f1);padding:32px 24px;text-align:center;">
              <div style="width:56px;height:56px;background-color:rgba(255,255,255,0.2);border-radius:14px;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;">
                <span style="font-size:28px;">🔐</span>
              </div>
              <h1 style="color:#ffffff;font-size:22px;font-weight:800;margin:0 0 6px;">Código de Verificação</h1>
              <p style="color:rgba(255,255,255,0.8);font-size:13px;margin:0;">Connect Finanças — Gestão Empresarial</p>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding:32px 24px;">
              <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 24px;">
                Olá${userName ? ` <strong style="color:#e2e8f0;">${userName}</strong>` : ''},<br>
                Use o código abaixo para confirmar sua ação no sistema:
              </p>
              
              <!-- Code Box -->
              <div style="background-color:#0f172a;border:2px solid #3b82f6;border-radius:12px;padding:20px;text-align:center;margin:0 0 24px;">
                <span style="font-size:32px;font-weight:900;letter-spacing:8px;color:#ffffff;font-family:'Courier New',monospace;">${code}</span>
              </div>
              
              <p style="color:#64748b;font-size:12px;line-height:1.5;margin:0 0 8px;">
                ⏱ Este código expira em <strong style="color:#94a3b8;">10 minutos</strong>.
              </p>
              <p style="color:#64748b;font-size:12px;line-height:1.5;margin:0;">
                Se você não solicitou este código, ignore este e-mail.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding:16px 24px;border-top:1px solid #334155;text-align:center;">
              <p style="color:#475569;font-size:11px;margin:0;">
                © ${new Date().getFullYear()} Connect Finanças — Todos os direitos reservados.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: 'Connect Finanças',
          email: 'noreply@xconnetfinance.com.br',
        },
        to: [{ email, name: userName || email }],
        subject: `${code} — Código de Verificação | Connect Finanças`,
        htmlContent,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Brevo API error:', response.status, errorData);
      return res.status(500).json({ error: 'Falha ao enviar e-mail. Tente novamente.' });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Email send error:', err);
    return res.status(500).json({ error: 'Erro interno ao enviar e-mail.' });
  }
}
