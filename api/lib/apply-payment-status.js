import {
  confirmOrderPayment,
  releaseExpiredOrder,
  updateOrder,
} from './supabase-admin.js'
import { resolveMercadoPagoStatus } from './mercadopago.js'
import { sendAdminPurchaseNotification, sendOrderThankYouEmail } from './send-order-email.js'

export async function applyMercadoPagoStatus(order, payment) {
  const status = resolveMercadoPagoStatus(payment)
  const orderId = order.id

  if (status === 'aprovado') {
    const firstApproval = order.status_pagamento === 'aguardando'

    await confirmOrderPayment(orderId)
    await updateOrder(orderId, {
      provider_payment_id: String(payment.id),
      pago_em: payment.date_approved || new Date().toISOString(),
    })

    if (firstApproval) {
      if (!order.email_enviado) {
        try {
          const emailResult = await sendOrderThankYouEmail(order)
          if (emailResult.sent) {
            await updateOrder(orderId, { email_enviado: true })
          }
        } catch (error) {
          console.error('Falha ao enviar e-mail de agradecimento:', error)
        }
      }

      try {
        await sendAdminPurchaseNotification(order)
      } catch (error) {
        console.error('Falha ao enviar notificação de compra:', error)
      }
    }

    return { ok: true, status: 'aprovado', orderId }
  }

  if (status === 'expirado' || status === 'cancelado' || status === 'recusado') {
    if (order.status_pagamento === 'aguardando') {
      await releaseExpiredOrder(orderId, status)
      if (status === 'recusado') {
        await updateOrder(orderId, { provider_payment_id: String(payment.id) })
      }
    }
    return { ok: true, status, orderId }
  }

  return { ok: true, status: 'aguardando', orderId }
}
