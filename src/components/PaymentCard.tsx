import { CreditCard } from 'lucide-react'
import type { Order } from '../types/raffle'
import type { SiteSettings } from '../types/settings'
import { isReservationExpired } from '../hooks/useReservationCountdown'
import { CardPaymentForm } from './CardPaymentForm'

type PaymentCardProps = {
  settings: SiteSettings
  order?: Order | null
  loading?: boolean
  onApproved?: () => void
  onError?: (message: string) => void
}

export function PaymentCard({ settings, order, loading, onApproved, onError }: PaymentCardProps) {
  if (!settings.pagamento_habilitado) {
    return (
      <div className="payment-card-block">
        <div className="payment-method-header">
          <CreditCard size={20} />
          <h3>Cartão de crédito</h3>
        </div>
        <p className="demo-payment-note">
          O pagamento com cartão estará disponível quando os pagamentos reais forem habilitados no
          painel administrativo.
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="payment-card-block">
        <p className="muted">Preparando pagamento com cartão...</p>
      </div>
    )
  }

  if (
    order?.reservado_ate &&
    isReservationExpired(order.reservado_ate) &&
    order.status_pagamento === 'aguardando'
  ) {
    return null
  }

  if (!order) {
    return (
      <div className="payment-card-block">
        <p className="muted">
          Confirme o pedido para carregar o formulário de cartão com o valor total da compra.
        </p>
      </div>
    )
  }

  return <CardPaymentForm order={order} onApproved={onApproved} onError={onError} />
}
