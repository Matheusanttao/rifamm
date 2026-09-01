import { lazy, Suspense, useEffect, useId, useState } from 'react'
import { initMercadoPago } from '@mercadopago/sdk-react'
import { CreditCard, Shield } from 'lucide-react'
import { processCardPayment } from '../lib/mercadopago'
import type { Order } from '../types/raffle'

const CardPayment = lazy(async () => {
  const module = await import('@mercadopago/sdk-react')
  return { default: module.CardPayment }
})

const publicKey = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY as string | undefined
let mercadoPagoReady = false

function ensureMercadoPago() {
  if (!publicKey || mercadoPagoReady) return Boolean(publicKey)
  initMercadoPago(publicKey, { locale: 'pt-BR' })
  mercadoPagoReady = true
  return true
}

type CardPaymentFormProps = {
  order: Order
  onApproved?: () => void
  onError?: (message: string) => void
}

export function CardPaymentForm({ order, onApproved, onError }: CardPaymentFormProps) {
  const brickId = useId().replace(/:/g, '')
  const [ready, setReady] = useState(false)
  const [processing, setProcessing] = useState(false)
  const configured = ensureMercadoPago()

  useEffect(() => {
    ensureMercadoPago()
  }, [])

  async function handleSubmit(formData: {
    token: string
    installments: number
    payment_method_id: string
    issuer_id?: string
    transaction_amount: number
    payer?: { email?: string }
  }) {
    setProcessing(true)
    try {
      const result = await processCardPayment(order.id, formData)
      if (result.status === 'aprovado') {
        onApproved?.()
        return
      }
      if (result.status === 'recusado' || result.status === 'cancelado') {
        throw new Error('Pagamento recusado. Verifique os dados do cartão ou tente outro cartão.')
      }
      onApproved?.()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Não foi possível processar o pagamento.'
      onError?.(message)
      throw err
    } finally {
      setProcessing(false)
    }
  }

  if (!configured) {
    return (
      <p className="form-error">
        Configure VITE_MERCADOPAGO_PUBLIC_KEY para habilitar pagamento com cartão.
      </p>
    )
  }

  return (
    <div className="payment-card-block">
      <div className="payment-method-header">
        <CreditCard size={20} />
        <h3>Cartão de crédito</h3>
      </div>
      <p className="muted">
        Preencha os dados do cartão abaixo. O pagamento é processado com segurança pelo Mercado
        Pago — nenhum dado de cartão fica armazenado neste site.
      </p>
      <p className="payment-note">
        <Shield size={14} />
        Parcelamento em até 12x conforme disponibilidade do cartão.
      </p>

      <div className={`card-payment-brick${ready ? ' is-ready' : ''}`} id={brickId}>
        <Suspense fallback={<p className="muted">Carregando formulário seguro...</p>}>
          <CardPayment
            initialization={{
              amount: Number(order.valor_total),
              payer: {
                email: order.participante_email,
              },
            }}
            customization={{
              visual: {
                style: {
                  theme: 'default',
                },
              },
              paymentMethods: {
                maxInstallments: 12,
              },
            }}
            onReady={() => setReady(true)}
            onError={(error) => {
              console.error('CardPayment brick error:', error)
              onError?.('Erro ao carregar o formulário de cartão. Atualize a página.')
            }}
            onSubmit={handleSubmit}
          />
        </Suspense>
      </div>

      {processing ? <p className="muted">Processando pagamento...</p> : null}
      {!ready ? <p className="muted">Carregando formulário seguro...</p> : null}
    </div>
  )
}
