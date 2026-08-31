import {
  fetchMercadoPagoPayment,
  mapPaymentStatus,
} from '../lib/mercadopago.js'
import {
  confirmOrderPayment,
  fetchOrderById,
  releaseExpiredOrder,
  releaseOrderNumbers,
  updateOrder,
} from '../lib/supabase-admin.js'

async function processPaymentNotification(paymentId) {
  const payment = await fetchMercadoPagoPayment(paymentId)
  const orderId = payment.external_reference || payment.metadata?.pedido_id

  if (!orderId) {
    console.warn('Pagamento sem external_reference:', paymentId)
    return { ok: true, skipped: true }
  }

  const order = await fetchOrderById(orderId)
  if (!order) {
    console.warn('Pedido não encontrado para pagamento:', orderId)
    return { ok: true, skipped: true }
  }

  const status = mapPaymentStatus(payment.status)

  if (status === 'aprovado') {
    await confirmOrderPayment(orderId)
    await updateOrder(orderId, {
      provider_payment_id: String(payment.id),
      pago_em: payment.date_approved || new Date().toISOString(),
    })
    return { ok: true, status: 'aprovado', orderId }
  }

  if (status === 'expirado' || status === 'cancelado') {
    if (order.status_pagamento === 'aguardando') {
      await releaseExpiredOrder(orderId)
    }
    return { ok: true, status, orderId }
  }

  if (status === 'recusado') {
    await updateOrder(orderId, {
      status_pagamento: 'recusado',
      provider_payment_id: String(payment.id),
    })
    await releaseOrderNumbers(order)
    return { ok: true, status: 'recusado', orderId }
  }

  await updateOrder(orderId, {
    provider_payment_id: String(payment.id),
    status_pagamento: 'aguardando',
  })

  return { ok: true, status: 'aguardando', orderId }
}

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const body = req.method === 'POST' ? req.body : req.query
    const topic = body?.type || body?.topic || req.query?.topic
    const dataId = body?.data?.id || body?.['data.id'] || req.query?.id

    if (topic === 'payment' && dataId) {
      const result = await processPaymentNotification(dataId)
      return res.status(200).json(result)
    }

    if (topic === 'merchant_order' && dataId) {
      return res.status(200).json({ ok: true, message: 'Merchant order recebido.' })
    }

    if (req.query?.['data.id'] || req.query?.id) {
      const paymentId = req.query['data.id'] || req.query.id
      const result = await processPaymentNotification(paymentId)
      return res.status(200).json(result)
    }

    return res.status(200).json({ ok: true, message: 'Notificação recebida.' })
  } catch (error) {
    console.error('webhook error:', error)
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Erro no webhook.',
    })
  }
}
