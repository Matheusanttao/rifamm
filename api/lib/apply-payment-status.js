import {
  confirmOrderPayment,
  releaseExpiredOrder,
  releaseOrderNumbers,
  updateOrder,
} from './supabase-admin.js'
import { mapPaymentStatus } from './mercadopago.js'
import { sendOrderThankYouEmail } from './send-order-email.js'

export async function applyMercadoPagoStatus(order, payment) {
  const status = mapPaymentStatus(payment.status)
  const orderId = order.id

  if (status === 'aprovado') {
    const firstApproval = order.status_pagamento === 'aguardando'

    await confirmOrderPayment(orderId)
    await updateOrder(orderId, {
      provider_payment_id: String(payment.id),
      pago_em: payment.date_approved || new Date().toISOString(),
    })

    if (firstApproval && !order.email_enviado) {
      try {
        const emailResult = await sendOrderThankYouEmail(order)
        if (emailResult.sent) {
          await updateOrder(orderId, { email_enviado: true })
        }
      } catch (error) {
        console.error('Falha ao enviar e-mail de agradecimento:', error)
      }
    }

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

  return { ok: true, status: 'aguardando', orderId }
}
