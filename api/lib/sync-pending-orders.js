import { applyMercadoPagoStatus } from './apply-payment-status.js'
import { fetchMercadoPagoPayment, resolveMercadoPagoStatus } from './mercadopago.js'
import {
  cancelPendingOrder,
  fetchAwaitingOrders,
} from './supabase-admin.js'

export const PIX_RESERVATION_MINUTES = 30
export const STALE_MINUTES_WITHOUT_PAYMENT = 30
export const STALE_HOURS_CARD = 48

function isPixPaymentId(providerPaymentId) {
  return /^\d+$/.test(String(providerPaymentId || ''))
}

function minutesSince(isoDate) {
  return (Date.now() - new Date(isoDate).getTime()) / 60000
}

function hoursSince(isoDate) {
  return minutesSince(isoDate) / 60
}

export async function syncPendingOrders() {
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
      const resolvedStatus = resolveMercadoPagoStatus(payment)

      if (resolvedStatus === 'aguardando' && minutesSince(order.created_at) >= PIX_RESERVATION_MINUTES + 5) {
        const released = await cancelPendingOrder(order.id, 'expirado')
        if (released) summary.released += 1
        continue
      }

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

  return summary
}
