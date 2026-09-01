import { CreditCard, ExternalLink, Shield } from 'lucide-react'
import type { Order } from '../types/raffle'
import type { SiteSettings } from '../types/settings'
import { isReservationExpired } from '../hooks/useReservationCountdown'

type PaymentCardProps = {
  settings: SiteSettings
  order?: Order | null
  loading?: boolean
}

export function PaymentCard({ settings, order, loading }: PaymentCardProps) {
  if (!settings.pagamento_habilitado) {
    return (
      <div className="payment-card-block">
        <div className="payment-method-header">
          <CreditCard size={20} />
          <h3>Cartão de crédito</h3>
        </div>
        <p className="demo-payment-note">
          O checkout seguro com cartão estará disponível quando os pagamentos reais forem
          habilitados no painel administrativo.
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="payment-card-block">
        <p className="muted">Preparando checkout seguro no Mercado Pago...</p>
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

  const checkoutUrl = order?.checkout_url

  return (
    <div className="payment-card-block">
      <div className="payment-method-header">
        <CreditCard size={20} />
        <h3>Checkout seguro — Mercado Pago</h3>
      </div>
      <p>
        Você será redirecionado ao ambiente seguro do Mercado Pago para pagar com cartão de
        crédito. Nenhum dado de cartão é armazenado neste site.
      </p>
      <p className="payment-note">
        <Shield size={14} />
        A confirmação da compra depende da validação do pagamento no servidor via webhook.
      </p>
      {checkoutUrl ? (
        <a className="button primary" href={checkoutUrl}>
          <ExternalLink size={16} />
          Ir para checkout seguro
        </a>
      ) : (
        <p className="form-error">Link de checkout indisponível. Atualize a página.</p>
      )}
    </div>
  )
}
