import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { PaymentCard } from '../components/PaymentCard'
import { PaymentPix } from '../components/PaymentPix'
import { PaymentStatusPanel } from '../components/PaymentStatusPanel'
import { initMercadoPagoPayment, syncMercadoPagoPayment } from '../lib/mercadopago'
import { applyPaymentDataToOrder, expireOverdueOrder, fetchOrder } from '../lib/orders'
import { useSite } from '../lib/site-context'
import { isSupabaseConfigured } from '../lib/supabase'
import type { Order } from '../types/raffle'
import type { SiteSettings } from '../types/settings'

export function OrderPage() {
  const { id } = useParams<{ id: string }>()
  const { settings, refreshNumbers } = useSite()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function ensurePayment(pedido: Order, siteSettings: SiteSettings) {
      if (
        !siteSettings.pagamento_habilitado ||
        !isSupabaseConfigured ||
        pedido.status_pagamento !== 'aguardando' ||
        !pedido.metodo_pagamento
      ) {
        return pedido
      }

      const needsPix = pedido.metodo_pagamento === 'pix' && !pedido.pix_copia_cola

      if (!needsPix) return pedido

      setPaymentLoading(true)
      try {
        const payment = await initMercadoPagoPayment(pedido.id, pedido.metodo_pagamento)
        const updated = await applyPaymentDataToOrder(pedido.id, payment)
        return updated || pedido
      } catch (err) {
        console.error(err)
        return pedido
      } finally {
        setPaymentLoading(false)
      }
    }

    async function refreshOrder(orderId: string, withSync: boolean) {
      let pedido = await fetchOrder(orderId)
      if (
        withSync &&
        pedido?.status_pagamento === 'aguardando' &&
        pedido.provider_payment_id &&
        settings.pagamento_habilitado &&
        isSupabaseConfigured
      ) {
        try {
          await syncMercadoPagoPayment(orderId)
          pedido = await fetchOrder(orderId)
        } catch (err) {
          console.error(err)
        }
      }
      return pedido
    }

    async function load() {
      if (!id) return
      try {
        let pedido = await fetchOrder(id)
        if (!pedido) {
          setError('Pedido não encontrado.')
          return
        }
        pedido = (await ensurePayment(pedido, settings)) || pedido
        if (pedido.status_pagamento === 'aguardando') {
          pedido = (await refreshOrder(pedido.id, true)) || pedido
        }
        setOrder(pedido)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar pedido.')
      } finally {
        setLoading(false)
      }
    }
    void load()

    const interval = window.setInterval(() => {
      if (!id) return
      void refreshOrder(id, true).then((pedido) => {
        if (!pedido) return
        if (pedido.metodo_pagamento === 'cartao' && pedido.status_pagamento === 'aguardando') {
          return
        }
        setOrder((current) => {
            if (
              current?.status_pagamento === 'aguardando' &&
              pedido.status_pagamento !== 'aguardando'
            ) {
              void refreshNumbers()
            }
          return pedido
        })
      })
    }, 5000)

    return () => window.clearInterval(interval)
  }, [id, settings, refreshNumbers])

  const handleReservationExpire = useCallback(async () => {
    if (!id) return
    try {
      const pedido = await expireOverdueOrder(id)
      if (pedido) {
        setOrder(pedido)
        if (pedido.status_pagamento === 'expirado') {
          void refreshNumbers()
        }
      }
    } catch (err) {
      console.error(err)
    }
  }, [id, refreshNumbers])

  const handlePaymentApproved = useCallback(async () => {
    if (!id) return
    const pedido = await fetchOrder(id)
    if (pedido) {
      setOrder(pedido)
      void refreshNumbers()
    }
  }, [id, refreshNumbers])

  const handlePaymentError = useCallback((message: string) => {
    setError(message)
  }, [])

  if (loading) return <p className="loading-message container">Carregando pedido...</p>
  if (error || !order) return <p className="form-error container">{error || 'Pedido não encontrado.'}</p>

  return (
    <main className="order-page">
      <div className="container checkout-shell">
        <div className="order-page-nav">
          <Link className="back-link" to="/participar">
            <ArrowLeft size={16} /> Fazer novo pedido
          </Link>
        </div>

        <PaymentStatusPanel order={order} onReservationExpire={handleReservationExpire} />

        {order.status_pagamento === 'aguardando' && order.metodo_pagamento === 'pix' ? (
          <PaymentPix order={order} settings={settings} loading={paymentLoading} />
        ) : null}

        {order.status_pagamento === 'aguardando' && order.metodo_pagamento === 'cartao' ? (
          <PaymentCard
            settings={settings}
            order={order}
            loading={paymentLoading}
            onApproved={() => void handlePaymentApproved()}
            onError={handlePaymentError}
          />
        ) : null}
      </div>
    </main>
  )
}
