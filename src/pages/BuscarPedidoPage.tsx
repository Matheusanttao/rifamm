import { useState, type CSSProperties, type FormEvent } from 'react'
import { ArrowRight, FileDown, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { DemoBanner } from '../components/DemoBanner'
import { StatusBadge } from '../components/StatusBadge'
import { formatCurrency, formatDateTime, formatNumbersList } from '../lib/format'
import { downloadOrderPdf } from '../lib/orderPdf'
import { paymentMethodLabel, searchOrders } from '../lib/orders'
import { fetchSiteSettings } from '../lib/settings'
import type { Order } from '../types/raffle'
import type { SiteSettings } from '../types/settings'
import { defaultSiteSettings } from '../types/settings'

export function BuscarPedidoPage() {
  const [codigo, setCodigo] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [orders, setOrders] = useState<Order[]>([])
  const [settings, setSettings] = useState<SiteSettings>(defaultSiteSettings)
  const [searched, setSearched] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setLoading(true)
    setSearched(true)

    try {
      const siteSettings = await fetchSiteSettings()
      setSettings(siteSettings)
      const found = await searchOrders(codigo, email)
      setOrders(found)
      if (found.length === 0) {
        setError('Nenhum pedido encontrado com esse código e e-mail.')
      }
    } catch (err) {
      setOrders([])
      setError(err instanceof Error ? err.message : 'Não foi possível buscar o pedido.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="buscar-page">
      <DemoBanner pagamentoHabilitado={settings.pagamento_habilitado} />

      <div className="container buscar-shell">
        <section className="buscar-card" style={{ '--d': '0ms' } as CSSProperties}>
          <p className="home-section-id">Consulta</p>
          <h1>Buscar pedido</h1>
          <p className="muted">
            Informe o código do pedido e o e-mail usados na compra para ver o status e baixar o
            comprovante em PDF.
          </p>

          <form className="stacked-form buscar-form" onSubmit={handleSubmit}>
            <label>
              Código do pedido
              <input
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder="Ex.: RF-ABC123"
                required
                autoComplete="off"
              />
            </label>
            <label>
              E-mail
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="mesmo e-mail da compra"
                required
              />
            </label>
            {error ? <p className="form-error">{error}</p> : null}
            <button className="button primary" type="submit" disabled={loading}>
              <Search size={16} />
              {loading ? 'Buscando...' : 'Buscar pedido'}
            </button>
          </form>
        </section>

        {searched && orders.length > 0 ? (
          <section className="buscar-results">
            {orders.map((order) => (
              <article key={order.id} className="buscar-result-card">
                <header className="buscar-result-head">
                  <div>
                    <p className="home-section-id">{order.codigo}</p>
                    <h2>{order.participante_nome}</h2>
                  </div>
                  <StatusBadge status={order.status_pagamento} variant="payment" inline />
                </header>

                <div className="order-confirmation-details">
                  <div>
                    <span>Números</span>
                    <strong>{formatNumbersList(order.numeros)}</strong>
                  </div>
                  <div>
                    <span>Total</span>
                    <strong>{formatCurrency(order.valor_total)}</strong>
                  </div>
                  <div>
                    <span>Método</span>
                    <strong>{paymentMethodLabel(order.metodo_pagamento)}</strong>
                  </div>
                  <div>
                    <span>Criado em</span>
                    <strong>{formatDateTime(order.created_at)}</strong>
                  </div>
                </div>

                <div className="buscar-result-actions">
                  <Link className="button ghost" to={`/pedido/${order.id}`}>
                    Ver pedido <ArrowRight size={16} />
                  </Link>
                  <button
                    type="button"
                    className="button primary"
                    onClick={() => downloadOrderPdf(order, settings)}
                  >
                    <FileDown size={16} /> Baixar PDF
                  </button>
                </div>
              </article>
            ))}
          </section>
        ) : null}
      </div>
    </main>
  )
}
