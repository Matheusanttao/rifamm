import { Link } from 'react-router-dom'
import {
  AlertCircle,
  Ban,
  CheckCircle2,
  Clock3,
  XCircle,
} from 'lucide-react'
import type { Order } from '../types/raffle'
import { formatDateTime, formatNumbersList } from '../lib/format'
import { useSite } from '../lib/site-context'
import { ReservationCountdown } from './ReservationCountdown'
import { StatusBadge } from './StatusBadge'

type PaymentStatusPanelProps = {
  order: Order
  onReservationExpire?: () => void
}

const statusCopy: Record<Order['status_pagamento'], { title: string; text: string; icon: typeof Clock3 }> = {
  aguardando: {
    title: 'Aguardando pagamento',
    text: 'Seus números estão reservados. Conclua o pagamento no prazo para confirmar a participação.',
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
    text: 'O prazo para pagamento terminou e os números foram liberados. Faça um novo pedido para participar novamente.',
    icon: AlertCircle,
  },
  cancelado: {
    title: 'Pedido cancelado',
    text: 'Este pedido foi cancelado e os números já estão disponíveis para outras pessoas comprarem.',
    icon: Ban,
  },
}

export function PaymentStatusPanel({ order, onReservationExpire }: PaymentStatusPanelProps) {
  const { settings } = useSite()
  const copy = statusCopy[order.status_pagamento]
  const Icon = copy.icon
  const showCountdown =
    order.status_pagamento === 'aguardando' && Boolean(order.reservado_ate)
  const aguardandoText =
    order.status_pagamento === 'aguardando'
      ? `Seus números estão reservados por ${settings.reserva_minutos} minutos. Use o cronômetro abaixo e conclua o pagamento nesse prazo.`
      : copy.text

  return (
    <div className={`payment-status-panel status-${order.status_pagamento}`}>
      <div className="payment-status-header">
        <span className="payment-status-icon">
          <Icon size={24} />
        </span>
        <div>
          <StatusBadge status={order.status_pagamento} variant="payment" inline />
          <h2>{copy.title}</h2>
          <p>{aguardandoText}</p>
        </div>
      </div>

      {showCountdown ? (
        <ReservationCountdown
          reservadoAte={order.reservado_ate!}
          reservaMinutos={settings.reserva_minutos}
          onExpire={onReservationExpire}
        />
      ) : null}

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
        {order.status_pagamento === 'aguardando' && order.reservado_ate ? (
          <div>
            <span>Reserva até</span>
            <strong>{formatDateTime(order.reservado_ate)}</strong>
          </div>
        ) : null}
      </div>

      {order.status_pagamento === 'expirado' || order.status_pagamento === 'recusado' ? (
        <div className="payment-status-actions">
          <Link className="button primary" to="/participar">
            Fazer novo pedido
          </Link>
        </div>
      ) : null}
    </div>
  )
}
