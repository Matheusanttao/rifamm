import {
  AlertCircle,
  Ban,
  CheckCircle2,
  Clock3,
  XCircle,
} from 'lucide-react'
import type { Order } from '../types/raffle'
import { formatDateTime, formatNumbersList } from '../lib/format'
import { StatusBadge } from './StatusBadge'

type PaymentStatusPanelProps = {
  order: Order
}

const statusCopy: Record<Order['status_pagamento'], { title: string; text: string; icon: typeof Clock3 }> = {
  aguardando: {
    title: 'Aguardando pagamento',
    text: 'Seus números estão reservados (não vendidos). Conclua o PIX em até 30 minutos ou eles voltam a ficar disponíveis.',
    icon: Clock3,
  },
  aprovado: {
    title: 'Pagamento aprovado',
    text: 'Sua participação foi confirmada! Enviamos um e-mail de agradecimento com os seus números. Que Deus abençoe muito você!',
    icon: CheckCircle2,
  },
  recusado: {
    title: 'Pagamento recusado',
    text: 'O pagamento não foi aprovado. Os números serão liberados e você pode tentar novamente.',
    icon: XCircle,
  },
  expirado: {
    title: 'Reserva expirada',
    text: 'O prazo para pagamento terminou e os números foram liberados. Você pode fazer um novo pedido.',
    icon: AlertCircle,
  },
  cancelado: {
    title: 'Pedido cancelado',
    text: 'Este pedido foi cancelado e os números já estão disponíveis para outras pessoas comprarem.',
    icon: Ban,
  },
}

export function PaymentStatusPanel({ order }: PaymentStatusPanelProps) {
  const copy = statusCopy[order.status_pagamento]
  const Icon = copy.icon

  return (
    <div className={`payment-status-panel status-${order.status_pagamento}`}>
      <div className="payment-status-header">
        <span className="payment-status-icon">
          <Icon size={24} />
        </span>
        <div>
          <StatusBadge status={order.status_pagamento} variant="payment" inline />
          <h2>{copy.title}</h2>
          <p>{copy.text}</p>
        </div>
      </div>

      <div className="order-confirmation-details">
        <div>
          <span>Pedido</span>
          <strong>{order.codigo}</strong>
        </div>
        <div>
          <span>Números</span>
          <strong>{formatNumbersList(order.numeros)}</strong>
        </div>
        {order.pago_em ? (
          <div>
            <span>Pago em</span>
            <strong>{formatDateTime(order.pago_em)}</strong>
          </div>
        ) : null}
      </div>
    </div>
  )
}
