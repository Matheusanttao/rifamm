import { applyMercadoPagoStatus } from '../lib/apply-payment-status.js'
import { fetchMercadoPagoPayment } from '../lib/mercadopago.js'
import { fetchOrderById } from '../lib/supabase-admin.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { orderId } = req.body || {}
    if (!orderId) {
      return res.status(400).json({ error: 'Informe orderId.' })
    }

    const order = await fetchOrderById(orderId)
    if (!order) {
      return res.status(404).json({ error: 'Pedido não encontrado.' })
    }

    if (order.status_pagamento === 'aprovado') {
      return res.status(200).json({ ok: true, status: 'aprovado', orderId })
    }

    if (!order.provider_payment_id) {
      return res.status(400).json({ error: 'Pedido sem pagamento no Mercado Pago.' })
    }

    const payment = await fetchMercadoPagoPayment(order.provider_payment_id)
    const result = await applyMercadoPagoStatus(order, payment)
    return res.status(200).json(result)
  } catch (error) {
    console.error('sync-payment error:', error)
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Erro ao sincronizar pagamento.',
    })
  }
}
