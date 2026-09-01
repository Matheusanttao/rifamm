import { applyMercadoPagoStatus } from '../lib/apply-payment-status.js'
import { createCardPayment, getBaseUrl } from '../lib/mercadopago.js'
import {
  fetchOrderById,
  fetchSiteSettings,
  updateOrder,
} from '../lib/supabase-admin.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { orderId, cardData } = req.body || {}

  try {
    if (!orderId || !cardData?.token) {
      return res.status(400).json({ error: 'Informe orderId e os dados do cartão.' })
    }

    const settings = await fetchSiteSettings()
    if (!settings?.pagamento_habilitado) {
      return res.status(403).json({ error: 'Pagamentos reais estão desabilitados.' })
    }

    const order = await fetchOrderById(orderId)
    if (!order) {
      return res.status(404).json({ error: 'Pedido não encontrado.' })
    }

    if (order.status_pagamento !== 'aguardando') {
      return res.status(400).json({ error: 'Este pedido não está aguardando pagamento.' })
    }

    if (order.metodo_pagamento && order.metodo_pagamento !== 'cartao') {
      return res.status(400).json({ error: 'Este pedido não é de cartão.' })
    }

    const baseUrl = getBaseUrl(req)
    const idempotencyKey = `rifa-${order.id}-cartao-${cardData.token.slice(0, 12)}`

    const paymentData = await createCardPayment({
      order,
      baseUrl,
      idempotencyKey,
      cardData,
    })

    await updateOrder(order.id, {
      metodo_pagamento: 'cartao',
      provider_payment_id: paymentData.provider_payment_id,
      pix_copia_cola: null,
      pix_qr_base64: null,
      checkout_url: null,
    })

    const result = await applyMercadoPagoStatus(order, paymentData.payment)

    return res.status(200).json({
      status: result.status,
      provider_payment_id: paymentData.provider_payment_id,
    })
  } catch (error) {
    console.error('process-card-payment error:', error)
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Erro ao processar pagamento com cartão.',
    })
  }
}
