import { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { DemoBanner } from '../components/DemoBanner'
import { PaymentCard } from '../components/PaymentCard'
import { PaymentPix } from '../components/PaymentPix'
import { PaymentStatusPanel } from '../components/PaymentStatusPanel'
import { initMercadoPagoPayment } from '../lib/mercadopago'
import { applyPaymentDataToOrder, fetchOrder } from '../lib/orders'
import { fetchSiteSettings } from '../lib/settings'
import { isSupabaseConfigured } from '../lib/supabase'
import type { Order } from '../types/raffle'
import type { SiteSettings } from '../types/settings'
import { defaultSiteSettings } from '../types/settings'

export function OrderPage() {
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<Order | null>(null)
  const [settings, setSettings] = useState<SiteSettings>(defaultSiteSettings)
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
      const needsCard = pedido.metodo_pagamento === 'cartao' && !pedido.checkout_url

      if (!needsPix && !needsCard) return pedido

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

    async function load() {
      if (!id) return
      try {
        const siteSettings = await fetchSiteSettings()
        let pedido = await fetchOrder(id)
        if (!pedido) {
          setError('Pedido não encontrado.')
          return
        }
        pedido = (await ensurePayment(pedido, siteSettings)) || pedido
        setSettings(siteSettings)
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
      void fetchOrder(id).then((pedido) => {
        if (pedido) setOrder(pedido)
      })
    }, 10000)

    return () => window.clearInterval(interval)
  }, [id])

  if (loading) return <p className="loading-message container">Carregando pedido...</p>
  if (error || !order) return <p className="form-error container">{error || 'Pedido não encontrado.'}</p>

  return (
    <main className="order-page">
      <DemoBanner pagamentoHabilitado={settings.pagamento_habilitado} />

      <div className="container checkout-shell">
        <Link className="back-link" to="/participar">
          <ArrowLeft size={16} /> Fazer novo pedido
        </Link>

        <PaymentStatusPanel order={order} />

        {order.status_pagamento === 'aguardando' && order.metodo_pagamento === 'pix' ? (
          <PaymentPix order={order} settings={settings} loading={paymentLoading} />
        ) : null}

        {order.status_pagamento === 'aguardando' && order.metodo_pagamento === 'cartao' ? (
          <PaymentCard settings={settings} order={order} loading={paymentLoading} />
        ) : null}
      </div>
    </main>
  )
}
