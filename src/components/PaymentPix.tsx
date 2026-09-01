import { useState } from 'react'
import { Check, Copy, CreditCard, QrCode } from 'lucide-react'
import type { Order } from '../types/raffle'
import type { SiteSettings } from '../types/settings'
import { getPixQrUrl } from '../lib/orders'
import { formatCurrency } from '../lib/format'
import { isReservationExpired } from '../hooks/useReservationCountdown'

type PaymentPixProps = {
  order: Order
  settings: SiteSettings
  loading?: boolean
}

export function PaymentPix({ order, settings, loading }: PaymentPixProps) {
  const [copied, setCopied] = useState(false)
  const [keyCopied, setKeyCopied] = useState(false)
  const copiaCola = order.pix_copia_cola || ''
  const showPixKey =
    settings.pagamento_habilitado && settings.pix_chave && settings.pix_chave.trim().length > 0

  async function copyText(text: string, setter: (v: boolean) => void) {
    await navigator.clipboard.writeText(text)
    setter(true)
    setTimeout(() => setter(false), 2000)
  }

  if (loading) {
    return (
      <div className="payment-pix">
        <p className="muted">Gerando cobrança PIX no Mercado Pago...</p>
      </div>
    )
  }

  if (!copiaCola) {
    return (
      <div className="payment-pix">
        <p className="form-error">Não foi possível gerar o PIX. Atualize a página ou tente novamente.</p>
      </div>
    )
  }

  if (
    order.reservado_ate &&
    isReservationExpired(order.reservado_ate) &&
    order.status_pagamento === 'aguardando'
  ) {
    return null
  }

  return (
    <div className="payment-pix">
      <div className="payment-method-header">
        <QrCode size={20} />
        <h3>Pagamento via PIX — Mercado Pago</h3>
      </div>

      {!settings.pagamento_habilitado ? (
        <p className="demo-payment-note">
          No modo demonstrativo, o QR Code e o código abaixo são apenas ilustrativos.
        </p>
      ) : null}

      <div className="pix-qr-wrap">
        <img
          src={getPixQrUrl(copiaCola, order.pix_qr_base64)}
          alt="QR Code PIX do pedido"
          width={220}
          height={220}
        />
      </div>

      <label className="pix-copy-field">
        <span>PIX Copia e Cola</span>
        <div className="pix-copy-row">
          <input readOnly value={copiaCola} />
          <button type="button" className="button ghost" onClick={() => copyText(copiaCola, setCopied)}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copiado' : 'Copiar'}
          </button>
        </div>
      </label>

      {showPixKey ? (
        <div className="pix-key-block">
          <p>
            <strong>Chave PIX:</strong> {settings.pix_chave}
            {settings.pix_titular ? ` — ${settings.pix_titular}` : ''}
          </p>
          <button
            type="button"
            className="button ghost"
            onClick={() => copyText(settings.pix_chave || '', setKeyCopied)}
          >
            {keyCopied ? <Check size={16} /> : <Copy size={16} />}
            {keyCopied ? 'Chave copiada' : 'Copiar chave'}
          </button>
        </div>
      ) : null}

      <p className="payment-amount">
        Valor: <strong>{formatCurrency(order.valor_total)}</strong>
      </p>

      <p className="payment-note">
        <CreditCard size={14} />
        O pagamento só será confirmado após validação no Mercado Pago. Se você não pagar em até{' '}
        {settings.reserva_minutos} minutos, os números voltam a ficar disponíveis para outras pessoas.
      </p>
    </div>
  )
}
