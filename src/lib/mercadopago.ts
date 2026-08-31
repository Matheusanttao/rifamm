import type { PaymentMethod } from '../types/raffle'

export type MercadoPagoPaymentResult = {
  provider_payment_id: string | null
  pix_copia_cola: string | null
  pix_qr_base64: string | null
  checkout_url: string | null
}

export async function initMercadoPagoPayment(
  orderId: string,
  method: PaymentMethod,
): Promise<MercadoPagoPaymentResult> {
  const response = await fetch('/api/mercadopago/create-payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId, method }),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.error || 'Não foi possível iniciar o pagamento no Mercado Pago.')
  }

  return data as MercadoPagoPaymentResult
}

/** Consulta o Mercado Pago e atualiza o pedido se já estiver pago. */
export async function syncMercadoPagoPayment(orderId: string): Promise<{ status?: string }> {
  const response = await fetch('/api/mercadopago/sync-payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId }),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.error || 'Não foi possível verificar o pagamento.')
  }
  return data as { status?: string }
}
