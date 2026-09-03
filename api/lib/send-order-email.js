/**
 * Envia e-mail de agradecimento via Resend (plano gratuito).
 * Configure RESEND_API_KEY e EMAIL_FROM na Vercel.
 * Teste rápido: from = "Rifa <onboarding@resend.dev>" (só envia para o e-mail da sua conta Resend).
 * Produção: verifique um domínio no Resend e use EMAIL_FROM=Rifa Matheus & Melissa <ola@seudominio.com>
 *
 * EMAIL_NOTIFY_TO: e-mails do casal (separados por vírgula) que recebem aviso de cada compra aprovada.
 */
const DEFAULT_NOTIFY_TO = [
  'matheusantaosilva18@gmail.com',
  'melissaalcantara17@gmail.com',
]

function getNotifyEmails() {
  const raw = process.env.EMAIL_NOTIFY_TO || DEFAULT_NOTIFY_TO.join(',')
  return raw
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
}

async function sendResendEmail({ apiKey, from, to, subject, text, html }) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to, subject, text, html }),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data?.message || data?.error || `Resend error ${response.status}`)
  }
  return data
}

function buildOrderDetails(order) {
  const numeros = [...(order.numeros || [])]
    .sort((a, b) => a - b)
    .map((n) => String(n).padStart(3, '0'))
    .join(', ')

  const nome = (order.participante_nome || 'amigo(a)').trim()
  const primeiroNome = nome.split(/\s+/)[0]
  const valor = Number(order.valor_total || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })

  return { numeros, nome, primeiroNome, valor }
}

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

  const { numeros, nome, primeiroNome, valor } = buildOrderDetails(order)

  const subject = `Obrigado por participar da rifa — pedido ${order.codigo}`
  const text = [
    `Olá, ${primeiroNome}!`,
    '',
    'Muito obrigado por comprar um número da nossa rifa do chá de casa nova.',
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
              <p style="margin:0;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;opacity:0.9;">Rifa do Chá de Casa Nova</p>
              <h1 style="margin:8px 0 0;font-size:28px;font-weight:600;">Matheus &amp; Melissa</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <p style="margin:0 0 16px;font-size:18px;">Olá, <strong>${escapeHtml(primeiroNome)}</strong>!</p>
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

  const buyerResult = await sendResendEmail({
    apiKey,
    from,
    to: [order.participante_email],
    subject,
    text,
    html,
  })

  // Aviso separado para o casal (não depende do e-mail do comprador)
  try {
    await sendCoupleNotificationEmail({
      apiKey,
      from,
      order,
      numeros,
      nome,
      valor,
    })
  } catch (error) {
    console.error('Falha ao notificar o casal por e-mail:', error)
  }

  return { sent: true, id: buyerResult.id }
}

async function sendCoupleNotificationEmail({ apiKey, from, order, numeros, nome, valor }) {
  const notifyTo = getNotifyEmails()
  if (notifyTo.length === 0) return { sent: false, skipped: true }

  const telefone = order.participante_telefone || '—'
  const email = order.participante_email || '—'
  const cpf = order.participante_cpf || '—'
  const metodo = (order.metodo_pagamento || 'pix').toUpperCase()

  const subject = `Nova compra aprovada — ${order.codigo}`
  const text = [
    'Nova compra aprovada na rifa!',
    '',
    `Pedido: ${order.codigo}`,
    `Nome: ${nome}`,
    `E-mail: ${email}`,
    `Telefone: ${telefone}`,
    `CPF: ${cpf}`,
    `Números: ${numeros}`,
    `Valor: ${valor}`,
    `Método: ${metodo}`,
  ].join('\n')

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<body style="margin:0;padding:0;background:#f7efe8;font-family:Arial,sans-serif;color:#463a34;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f7efe8;padding:28px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:560px;background:#fffaf6;border:1px solid #ead9ce;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="padding:22px 24px;background:#8f5559;color:#fff;">
              <p style="margin:0;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;opacity:0.9;">Aviso interno</p>
              <h1 style="margin:6px 0 0;font-size:22px;">Nova compra aprovada</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:24px;font-size:14px;line-height:1.7;">
              <div><strong>Pedido:</strong> ${escapeHtml(order.codigo)}</div>
              <div><strong>Nome:</strong> ${escapeHtml(nome)}</div>
              <div><strong>E-mail:</strong> ${escapeHtml(email)}</div>
              <div><strong>Telefone:</strong> ${escapeHtml(telefone)}</div>
              <div><strong>CPF:</strong> ${escapeHtml(cpf)}</div>
              <div><strong>Números:</strong> ${escapeHtml(numeros)}</div>
              <div><strong>Valor:</strong> ${escapeHtml(valor)}</div>
              <div><strong>Método:</strong> ${escapeHtml(metodo)}</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim()

  return sendResendEmail({
    apiKey,
    from,
    to: notifyTo,
    subject,
    text,
    html,
  })
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
