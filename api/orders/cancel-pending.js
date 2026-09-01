import { cancelPendingOrder, fetchOrderById } from '../lib/supabase-admin.js'

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

    if (order.status_pagamento !== 'aguardando') {
      return res.status(200).json({ ok: true, released: false, status: order.status_pagamento })
    }

    const released = await cancelPendingOrder(orderId, 'cancelado')
    return res.status(200).json({ ok: true, released, status: 'cancelado' })
  } catch (error) {
    console.error('cancel-pending error:', error)
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Erro ao cancelar pedido.',
    })
  }
}
