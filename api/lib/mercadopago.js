const MP_API = 'https://api.mercadopago.com'

export function getMercadoPagoToken() {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN
  if (!token) {
    throw new Error('Configure MERCADOPAGO_ACCESS_TOKEN na Vercel.')
  }
  return token
}

export async function mpFetch(path, options = {}) {
  const token = getMercadoPagoToken()
  const response = await fetch(`${MP_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const message =
      data?.message ||
      data?.error ||
      data?.cause?.[0]?.description ||
      `Mercado Pago error ${response.status}`
    throw new Error(message)
  }

  return data
}

export function splitName(fullName) {
  const parts = (fullName || 'Participante').trim().split(/\s+/)
  return {
    first_name: parts[0] || 'Participante',
    last_name: parts.slice(1).join(' ') || parts[0] || 'Participante',
  }
}

function payerIdentification(order) {
  const cpf = String(order.participante_cpf || '').replace(/\D/g, '')
  if (cpf.length !== 11) return undefined
  return { type: 'CPF', number: cpf }
}

export function mapPaymentStatus(mpStatus) {
  switch (mpStatus) {
    case 'approved':
      return 'aprovado'
    case 'rejected':
      return 'recusado'
    case 'cancelled':
      return 'cancelado'
    case 'expired':
      return 'expirado'
    default:
      return 'aguardando'
  }
}

export function resolveMercadoPagoStatus(payment) {
  const mapped = mapPaymentStatus(payment?.status)
  if (mapped !== 'aguardando') return mapped

  const expiration = payment?.date_of_expiration
  if (expiration && new Date(expiration).getTime() <= Date.now()) {
    return 'expirado'
  }

  return 'aguardando'
}

function pixExpirationDate(minutes = 30) {
  return new Date(Date.now() + minutes * 60 * 1000).toISOString()
}

export async function createPixPayment({ order, baseUrl, idempotencyKey }) {
  const payer = splitName(order.participante_nome)
  const identification = payerIdentification(order)

  const payment = await mpFetch('/v1/payments', {
    method: 'POST',
    headers: {
      'X-Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify({
      transaction_amount: Number(order.valor_total),
      description: `Rifa ${order.codigo} — ${order.numeros.length} número(s)`,
      payment_method_id: 'pix',
      external_reference: order.id,
      date_of_expiration: pixExpirationDate(30),
      payer: {
        email: order.participante_email,
        first_name: payer.first_name,
        last_name: payer.last_name,
        ...(identification ? { identification } : {}),
      },
      metadata: {
        pedido_id: order.id,
        codigo: order.codigo,
      },
      notification_url: `${baseUrl}/api/mercadopago/webhook`,
    }),
  })

  const transactionData = payment.point_of_interaction?.transaction_data

  return {
    provider_payment_id: String(payment.id),
    pix_copia_cola: transactionData?.qr_code || null,
    pix_qr_base64: transactionData?.qr_code_base64 || null,
    checkout_url: null,
    mp_status: payment.status,
  }
}

export async function createCardCheckout({ order, baseUrl, idempotencyKey }) {
  const payerName = splitName(order.participante_nome)
  const identification = payerIdentification(order)

  const preference = await mpFetch('/checkout/preferences', {
    method: 'POST',
    headers: {
      'X-Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify({
      items: [
        {
          id: order.id,
          title: `Rifa ${order.codigo}`,
          description: `Números: ${order.numeros.join(', ')}`,
          quantity: 1,
          unit_price: Number(order.valor_total),
          currency_id: 'BRL',
        },
      ],
      payer: {
        email: order.participante_email,
        name: payerName.first_name,
        surname: payerName.last_name,
        ...(identification ? { identification } : {}),
      },
      external_reference: order.id,
      metadata: {
        pedido_id: order.id,
        codigo: order.codigo,
      },
      payment_methods: {
        excluded_payment_types: [
          { id: 'ticket' },
          { id: 'bank_transfer' },
        ],
        installments: 12,
      },
      back_urls: {
        success: `${baseUrl}/pedido/${order.id}?mp=return`,
        failure: `${baseUrl}/pedido/${order.id}?mp=failure`,
        pending: `${baseUrl}/pedido/${order.id}?mp=pending`,
      },
      auto_return: 'approved',
      notification_url: `${baseUrl}/api/mercadopago/webhook`,
    }),
  })

  return {
    provider_payment_id: preference.id,
    pix_copia_cola: null,
    pix_qr_base64: null,
    checkout_url: preference.init_point || preference.sandbox_init_point,
    mp_status: 'pending',
  }
}

export async function fetchMercadoPagoPayment(paymentId) {
  return mpFetch(`/v1/payments/${paymentId}`)
}

export function getBaseUrl(req) {
  const configured = process.env.WEBHOOK_BASE_URL || process.env.VERCEL_URL
  if (process.env.WEBHOOK_BASE_URL) {
    return process.env.WEBHOOK_BASE_URL.replace(/\/$/, '')
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  const host = req.headers['x-forwarded-host'] || req.headers.host
  const proto = req.headers['x-forwarded-proto'] || 'http'
  return `${proto}://${host}`
}
