import { useCallback, useEffect, useMemo, useState } from 'react'
import { CardPayment } from '@mercadopago/sdk-react'
import { CreditCard, Shield } from 'lucide-react'
import {
  getMercadoPagoSetupHint,
  initMercadoPagoSdk,
  isMercadoPagoConfigured,
  shouldBlockMercadoPagoBrick,
} from '../lib/mercadopago-init'
import { processCardPayment } from '../lib/mercadopago'
import type { Order } from '../types/raffle'

const BRICK_CONTAINER_ID = 'cardPaymentBrick_container'

type CardPaymentFormProps = {
  order: Order
  onApproved?: () => void
  onError?: (message: string) => void
}

function formatBrickError(error: { message?: string; type?: string }) {
  const message = error?.message || ''
  if (message.includes('Secure Fields') || message.includes('fields_setup_failed')) {
    const hint = getMercadoPagoSetupHint()
    return hint
      ? `Não foi possível carregar o formulário de cartão. ${hint}`
      : 'Não foi possível carregar o formulário de cartão. Verifique a chave pública e o domínio cadastrado no Mercado Pago.'
  }
  return message || 'Erro ao carregar o formulário de cartão.'
}

export function CardPaymentForm({ order, onApproved, onError }: CardPaymentFormProps) {
  const [canMountBrick, setCanMountBrick] = useState(false)
  const [brickReady, setBrickReady] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [brickError, setBrickError] = useState('')

  const amount = Number(order.valor_total)
  const amountValid = Number.isFinite(amount) && amount > 0

  useEffect(() => {
    if (!isMercadoPagoConfigured() || !amountValid || shouldBlockMercadoPagoBrick()) return

    let cancelled = false

    void initMercadoPagoSdk().then((ready) => {
      if (!ready || cancelled) return

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!cancelled) setCanMountBrick(true)
        })
      })
    })

    return () => {
      cancelled = true
      setCanMountBrick(false)
      setBrickReady(false)
    }
  }, [amountValid, order.id])

  const initialization = useMemo(
    () => ({
      amount,
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
    [amount, order.participante_email, order.participante_cpf],
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
      const message = formatBrickError(error)
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

  if (!amountValid) {
    return <p className="form-error">Valor do pedido inválido para pagamento com cartão.</p>
  }

  const setupHint = getMercadoPagoSetupHint()
  const blockedLocally = shouldBlockMercadoPagoBrick()

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

      {setupHint ? <p className="demo-payment-note">{setupHint}</p> : null}

      {blockedLocally ? (
        <p className="form-error">
          Pagamento com cartão indisponível em localhost com chave de produção. Use credenciais
          TEST- no .env.local ou teste no site publicado na Vercel.
        </p>
      ) : (
        <div className={`card-payment-brick${brickReady ? ' is-ready' : ''}`}>
          {canMountBrick ? (
            <CardPayment
              id={BRICK_CONTAINER_ID}
              locale="pt-BR"
              initialization={initialization}
              customization={customization}
              onReady={handleReady}
              onError={handleBrickError}
              onSubmit={handleSubmit}
            />
          ) : (
            <p className="muted">Carregando formulário seguro...</p>
          )}
        </div>
      )}

      {brickError ? <p className="form-error">{brickError}</p> : null}
      {processing ? <p className="muted">Processando pagamento...</p> : null}
    </div>
  )
}
