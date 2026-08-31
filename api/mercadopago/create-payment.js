import {
  createCardCheckout,
  createPixPayment,
  getBaseUrl,
} from '../lib/mercadopago.js'
import {
  cancelPendingOrder,
  fetchOrderById,
  fetchSiteSettings,
  updateOrder,
} from '../lib/supabase-admin.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { orderId, method } = req.body || {}

  try {
    if (!orderId || !method) {
      return res.status(400).json({ error: 'Informe orderId e method (pix ou cartao).' })
    }

    if (!['pix', 'cartao'].includes(method)) {
      return res.status(400).json({ error: 'Método inválido. Use pix ou cartao.' })
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

    if (order.provider_payment_id && method === 'pix' && order.pix_copia_cola) {
      return res.status(200).json({
        provider_payment_id: order.provider_payment_id,
        pix_copia_cola: order.pix_copia_cola,
        pix_qr_base64: order.pix_qr_base64,
        checkout_url: order.checkout_url,
      })
    }

    if (order.checkout_url && method === 'cartao') {
      return res.status(200).json({
        provider_payment_id: order.provider_payment_id,
        pix_copia_cola: null,
        pix_qr_base64: null,
        checkout_url: order.checkout_url,
      })
    }

    const baseUrl = getBaseUrl(req)
    const idempotencyKey = `rifa-${order.id}-${method}`

    const paymentData =
      method === 'pix'
        ? await createPixPayment({ order, baseUrl, idempotencyKey })
        : await createCardCheckout({ order, baseUrl, idempotencyKey })

    const updated = await updateOrder(order.id, {
      metodo_pagamento: method,
      provider_payment_id: paymentData.provider_payment_id,
      pix_copia_cola: paymentData.pix_copia_cola,
      pix_qr_base64: paymentData.pix_qr_base64,
      checkout_url: paymentData.checkout_url,
    })

    return res.status(200).json({
      provider_payment_id: updated.provider_payment_id,
      pix_copia_cola: updated.pix_copia_cola,
      pix_qr_base64: updated.pix_qr_base64,
      checkout_url: updated.checkout_url,
    })
  } catch (error) {
    console.error('create-payment error:', error)
    if (orderId) {
      try {
        await cancelPendingOrder(orderId, 'cancelado')
      } catch (cancelError) {
        console.error('Falha ao liberar números após erro no pagamento:', cancelError)
      }
    }
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Erro ao criar pagamento.',
    })
  }
}
