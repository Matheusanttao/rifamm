/**
 * Envia e-mail de agradecimento via Resend (plano gratuito).
 * Configure RESEND_API_KEY e EMAIL_FROM na Vercel.
 * Teste rápido: from = "Rifa <onboarding@resend.dev>" (só envia para o e-mail da sua conta Resend).
 * Produção: verifique um domínio no Resend e use EMAIL_FROM=Rifa Matheus & Melissa <ola@seudominio.com>
 */
export async function sendOrderThankYouEmail(order) {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM || 'Rifa Matheus & Melissa <onboarding@resend.dev>'

  if (!apiKey) {
    console.warn('RESEND_API_KEY não configurada — e-mail de confirmação não enviado.')
    return { sent: false, skipped: true }
  }

  if (!order?.participante_email) {
    return { sent: false, skipped: true }
  }

  if (order.email_enviado) {
    return { sent: false, skipped: true, reason: 'already_sent' }
  }

  const numeros = [...(order.numeros || [])]
    .sort((a, b) => a - b)
    .map((n) => String(n).padStart(3, '0'))
    .join(', ')

  const nome = (order.participante_nome || 'amigo(a)').trim().split(/\s+/)[0]
  const valor = Number(order.valor_total || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })

  const subject = `Obrigado por participar da rifa — pedido ${order.codigo}`
  const text = [
    `Olá, ${nome}!`,
    '',
    'Muito obrigado por comprar um número da nossa rifa do chá de panela.',
    `Seus números: ${numeros}`,
    `Pedido: ${order.codigo}`,
    `Valor: ${valor}`,
    '',
    'Que Deus abençoe muito você e a sua família. Sua participação significa muito para nós!',
    '',
    'Com carinho,',
    'Matheus & Melissa',
  ].join('\n')

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<body style="margin:0;padding:0;background:#f7efe8;font-family:Georgia,'Times New Roman',serif;color:#463a34;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f7efe8;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#fffaf6;border:1px solid #ead9ce;border-radius:18px;overflow:hidden;">
          <tr>
            <td style="padding:28px 28px 12px;background:linear-gradient(135deg,#b06b6b,#c98989);color:#fff;">
              <p style="margin:0;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;opacity:0.9;">Rifa do Chá de Panela</p>
              <h1 style="margin:8px 0 0;font-size:28px;font-weight:600;">Matheus &amp; Melissa</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <p style="margin:0 0 16px;font-size:18px;">Olá, <strong>${escapeHtml(nome)}</strong>!</p>
              <p style="margin:0 0 16px;line-height:1.6;font-size:16px;">
                Muito obrigado por comprar um número da nossa rifa. Sua participação aquece o nosso coração.
              </p>
              <p style="margin:0 0 20px;line-height:1.6;font-size:16px;">
                <strong>Que Deus abençoe muito</strong> você e a sua família.
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8ece6;border-radius:14px;margin:0 0 20px;">
                <tr>
                  <td style="padding:16px 18px;font-family:Arial,sans-serif;font-size:14px;line-height:1.7;color:#5a4a42;">
                    <div><strong>Pedido:</strong> ${escapeHtml(order.codigo)}</div>
                    <div><strong>Números:</strong> ${escapeHtml(numeros)}</div>
                    <div><strong>Valor:</strong> ${escapeHtml(valor)}</div>
                  </td>
                </tr>
              </table>
              <p style="margin:0;line-height:1.6;font-size:15px;color:#6b5a52;">
                Com carinho,<br/>Matheus &amp; Melissa
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim()

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [order.participante_email],
      subject,
      text,
      html,
    }),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data?.message || data?.error || `Resend error ${response.status}`)
  }

  return { sent: true, id: data.id }
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
