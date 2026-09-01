import { useCallback, useEffect, useMemo, useState } from 'react'
import { CardPayment } from '@mercadopago/sdk-react'
import { CreditCard, Shield } from 'lucide-react'
import { initMercadoPagoSdk, isMercadoPagoConfigured } from '../lib/mercadopago-init'
import { processCardPayment } from '../lib/mercadopago'
import type { Order } from '../types/raffle'

type CardPaymentFormProps = {
  order: Order
  onApproved?: () => void
  onError?: (message: string) => void
}

export function CardPaymentForm({ order, onApproved, onError }: CardPaymentFormProps) {
  const [sdkReady, setSdkReady] = useState(false)
  const [brickReady, setBrickReady] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [brickError, setBrickError] = useState('')

  useEffect(() => {
    if (!isMercadoPagoConfigured()) return
    initMercadoPagoSdk()
    setSdkReady(true)
  }, [])

  const initialization = useMemo(
    () => ({
      amount: Number(order.valor_total),
      payer: {
        email: order.participante_email,
        ...(order.participante_cpf
          ? {
              identification: {
                type: 'CPF' as const,
                number: order.participante_cpf.replace(/\D/g, ''),
              },
            }
          : {}),
      },
    }),
    [order.valor_total, order.participante_email, order.participante_cpf],
  )

  const customization = useMemo(
    () => ({
      visual: {
        style: {
          theme: 'default' as const,
        },
      },
      paymentMethods: {
        maxInstallments: 12,
      },
    }),
    [],
  )

  const handleReady = useCallback(() => {
    setBrickReady(true)
    setBrickError('')
  }, [])

  const handleBrickError = useCallback(
    (error: { message?: string; type?: string }) => {
      console.error('CardPayment brick error:', error)
      const message =
        error?.message ||
        'Erro ao carregar o formulário de cartão. Verifique a chave pública do Mercado Pago.'
      setBrickError(message)
      onError?.(message)
    },
    [onError],
  )

  const handleSubmit = useCallback(
    async (formData: {
      token: string
      installments: number
      payment_method_id: string
      issuer_id?: string
      transaction_amount: number
      payer?: { email?: string }
    }) => {
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
    },
    [order.id, onApproved, onError],
  )

  if (!isMercadoPagoConfigured()) {
    return (
      <p className="form-error">
        Configure VITE_MERCADOPAGO_PUBLIC_KEY para habilitar pagamento com cartão.
      </p>
    )
  }

  if (!sdkReady) {
    return <p className="muted">Iniciando checkout seguro...</p>
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

      <div className={`card-payment-brick${brickReady ? ' is-ready' : ''}`}>
        <CardPayment
          id={`card-payment-${order.id}`}
          initialization={initialization}
          customization={customization}
          onReady={handleReady}
          onError={handleBrickError}
          onSubmit={handleSubmit}
        />
      </div>

      {brickError ? <p className="form-error">{brickError}</p> : null}
      {processing ? <p className="muted">Processando pagamento...</p> : null}
      {!brickReady && !brickError ? <p className="muted">Carregando formulário seguro...</p> : null}
    </div>
  )
}
