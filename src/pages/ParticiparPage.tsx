import { useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowLeft, ArrowRight, CreditCard, QrCode } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { NumberGrid } from '../components/NumberGrid'
import { OrderSummary } from '../components/OrderSummary'
import { PaymentCard } from '../components/PaymentCard'
import { initMercadoPagoPayment } from '../lib/mercadopago'
import { applyPaymentDataToOrder, createOrder } from '../lib/orders'
import { useSite } from '../lib/site-context'
import { isSupabaseConfigured } from '../lib/supabase'
import type { PaymentMethod } from '../types/raffle'

type Step = 'numeros' | 'dados' | 'pagamento'

export function ParticiparPage() {
  const navigate = useNavigate()
  const { settings, numbers, refreshNumbers } = useSite()
  const [selected, setSelected] = useState<number[]>([])
  const [step, setStep] = useState<Step>('numeros')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [metodo, setMetodo] = useState<PaymentMethod>('pix')

  async function handleCreateOrder(event: FormEvent) {
    event.preventDefault()
    if (selected.length === 0) {
      setError('Selecione ao menos um número.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const order = await createOrder(
        {
          participante_nome: nome,
          participante_email: email,
          participante_telefone: telefone,
          numeros: selected,
          metodo_pagamento: metodo,
        },
        settings,
      )

      if (settings.pagamento_habilitado && isSupabaseConfigured) {
        const payment = await initMercadoPagoPayment(order.id, metodo)
        await applyPaymentDataToOrder(order.id, payment)

        if (metodo === 'cartao' && payment.checkout_url) {
          window.location.href = payment.checkout_url
          return
        }
      }

      await refreshNumbers()
      navigate(`/pedido/${order.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível criar o pedido.')
      await refreshNumbers()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="participar-page">
      <div className="container checkout-shell">
        <Link className="back-link" to="/">
          <ArrowLeft size={16} /> Voltar ao início
        </Link>

        <div className="checkout-header">
          <h1>Participar da rifa</h1>
          <p className="muted">
            Escolha seus números, confirme os dados e finalize o pagamento.
          </p>
        </div>

        <div className="checkout-steps">
          <span className={step === 'numeros' ? 'active' : ''}>1. Números</span>
          <span className={step === 'dados' ? 'active' : ''}>2. Dados</span>
          <span className={step === 'pagamento' ? 'active' : ''}>3. Pagamento</span>
        </div>

        <div className="checkout-layout">
          <section className="checkout-main">
            {step === 'numeros' ? (
              <NumberGrid
                numbers={numbers}
                selected={selected}
                onChange={setSelected}
                valorNumero={settings.valor_numero}
              />
            ) : null}

            {step === 'dados' ? (
              <form className="stacked-form" onSubmit={(e) => { e.preventDefault(); setStep('pagamento') }}>
                <label>
                  Nome completo
                  <input value={nome} onChange={(e) => setNome(e.target.value)} required />
                </label>
                <label>
                  E-mail
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </label>
                <label>
                  Telefone / WhatsApp
                  <input
                    type="tel"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    required
                  />
                </label>
                <button className="button primary" type="submit">
                  Continuar <ArrowRight size={16} />
                </button>
              </form>
            ) : null}

            {step === 'pagamento' ? (
              <form className="stacked-form" onSubmit={handleCreateOrder}>
                <div className="payment-method-picker">
                  <button
                    type="button"
                    className={`payment-method-option ${metodo === 'pix' ? 'active' : ''}`}
                    onClick={() => setMetodo('pix')}
                  >
                    <QrCode size={18} /> PIX
                  </button>
                  <button
                    type="button"
                    className={`payment-method-option ${metodo === 'cartao' ? 'active' : ''}`}
                    onClick={() => setMetodo('cartao')}
                  >
                    <CreditCard size={18} /> Cartão
                  </button>
                </div>

                {metodo === 'pix' ? (
                  <p className="muted">
                    Após confirmar, você verá o QR Code e o código PIX gerados pelo Mercado Pago.
                  </p>
                ) : (
                  <PaymentCard settings={settings} />
                )}

                {!settings.pagamento_habilitado ? (
                  <p className="demo-payment-note">
                    Modo demonstrativo: o pedido será criado e os números ficarão reservados, mas nenhuma
                    cobrança real será processada.
                  </p>
                ) : !isSupabaseConfigured ? (
                  <p className="demo-payment-note">
                    Para pagamentos reais, configure o Supabase e as variáveis do Mercado Pago na
                    Vercel.
                  </p>
                ) : null}

                {error ? <p className="form-error">{error}</p> : null}

                <button className="button primary large" type="submit" disabled={submitting}>
                  {submitting
                    ? 'Processando...'
                    : metodo === 'cartao' && settings.pagamento_habilitado
                      ? 'Confirmar e ir ao checkout'
                      : 'Confirmar e ir para pagamento'}
                </button>
              </form>
            ) : null}
          </section>

          <aside className="checkout-aside">
            <OrderSummary numeros={selected} valorNumero={settings.valor_numero} />
            <div className="checkout-aside-actions">
              {step !== 'numeros' ? (
                <button
                  type="button"
                  className="button ghost full"
                  onClick={() => setStep(step === 'pagamento' ? 'dados' : 'numeros')}
                >
                  Voltar
                </button>
              ) : null}
              {step === 'numeros' ? (
                <button
                  type="button"
                  className="button primary full"
                  disabled={selected.length === 0}
                  onClick={() => setStep('dados')}
                >
                  Continuar <ArrowRight size={16} />
                </button>
              ) : null}
              {step === 'dados' ? (
                <button
                  type="button"
                  className="button primary full"
                  disabled={!nome.trim() || !email.trim()}
                  onClick={() => setStep('pagamento')}
                >
                  Ir para pagamento <ArrowRight size={16} />
                </button>
              ) : null}
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}
