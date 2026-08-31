import { applyMercadoPagoStatus } from '../lib/apply-payment-status.js'
import { fetchMercadoPagoPayment } from '../lib/mercadopago.js'
import {
  cancelPendingOrder,
  fetchAwaitingOrders,
} from '../lib/supabase-admin.js'

const STALE_MINUTES_WITHOUT_PAYMENT = 30
const STALE_HOURS_CARD = 48

function isPixPaymentId(providerPaymentId) {
  return /^\d+$/.test(String(providerPaymentId || ''))
}

function minutesSince(isoDate) {
  return (Date.now() - new Date(isoDate).getTime()) / 60000
}

function hoursSince(isoDate) {
  return minutesSince(isoDate) / 60
}

export default async function handler(req, res) {
  const cronSecret = process.env.CRON_SECRET
  const auth = req.headers.authorization

  if (cronSecret && auth !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' })
  }

  try {
    const orders = await fetchAwaitingOrders()
    const summary = {
      checked: orders.length,
      synced: 0,
      released: 0,
      errors: 0,
    }

    for (const order of orders) {
      try {
        if (!order.provider_payment_id) {
          if (minutesSince(order.created_at) >= STALE_MINUTES_WITHOUT_PAYMENT) {
            const released = await cancelPendingOrder(order.id, 'expirado')
            if (released) summary.released += 1
          }
          continue
        }

        if (order.metodo_pagamento === 'cartao' && !isPixPaymentId(order.provider_payment_id)) {
          if (hoursSince(order.created_at) >= STALE_HOURS_CARD) {
            const released = await cancelPendingOrder(order.id, 'expirado')
            if (released) summary.released += 1
          }
          continue
        }

        if (!isPixPaymentId(order.provider_payment_id)) continue

        const payment = await fetchMercadoPagoPayment(order.provider_payment_id)
        const result = await applyMercadoPagoStatus(order, payment)
        summary.synced += 1

        if (result.status === 'expirado' || result.status === 'cancelado' || result.status === 'recusado') {
          summary.released += 1
        }
      } catch (error) {
        summary.errors += 1
        console.error(`sync-pending order ${order.id}:`, error)
      }
    }

    return res.status(200).json({ ok: true, ...summary, at: new Date().toISOString() })
  } catch (error) {
    console.error('sync-pending-payments error:', error)
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Erro ao sincronizar pedidos pendentes.',
    })
  }
}
