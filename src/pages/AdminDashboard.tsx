import { useEffect, useMemo, useState } from 'react'
import { Hash, ShoppingBag, Ticket, Users } from 'lucide-react'
import { fetchOrders } from '../lib/orders'
import { fetchRaffleNumbers, getNumberStats } from '../lib/numbers'
import { fetchSiteSettings } from '../lib/settings'
import { formatCurrency, formatDateTime } from '../lib/format'
import { StatusBadge } from '../components/StatusBadge'
import type { Order } from '../types/raffle'
import type { SiteSettings } from '../types/settings'
import { defaultSiteSettings } from '../types/settings'

export function AdminDashboard() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSiteSettings)
  const [orders, setOrders] = useState<Order[]>([])
  const [numberStats, setNumberStats] = useState({
    total: 0,
    disponivel: 0,
    reservado: 0,
    vendido: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const siteSettings = await fetchSiteSettings()
        const [pedidos, numbers] = await Promise.all([
          fetchOrders(),
          fetchRaffleNumbers(siteSettings),
        ])
        setSettings(siteSettings)
        setOrders(pedidos)
        setNumberStats(getNumberStats(numbers))
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  const paymentStats = useMemo(() => {
    return orders.reduce(
      (acc, order) => {
        acc[order.status_pagamento] = (acc[order.status_pagamento] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )
  }, [orders])

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1>Visão geral da rifa</h1>
        </div>
        {!settings.pagamento_habilitado ? (
          <span className="badge status-reservado">Modo demonstrativo</span>
        ) : null}
      </header>

      <div className="stats-grid admin-stats">
        <article className="stat-card">
          <span className="stat-icon rose">
            <Hash size={22} />
          </span>
          <div>
            <div className="stat-value">{loading ? '—' : numberStats.disponivel}</div>
            <div className="stat-label">Disponíveis</div>
          </div>
        </article>
        <article className="stat-card">
          <span className="stat-icon gold">
            <Ticket size={22} />
          </span>
          <div>
            <div className="stat-value">{loading ? '—' : numberStats.reservado}</div>
            <div className="stat-label">Reservados</div>
          </div>
        </article>
        <article className="stat-card">
          <span className="stat-icon heart">
            <ShoppingBag size={22} />
          </span>
          <div>
            <div className="stat-value">{loading ? '—' : numberStats.vendido}</div>
            <div className="stat-label">Vendidos</div>
          </div>
        </article>
        <article className="stat-card">
          <span className="stat-icon green">
            <Users size={22} />
          </span>
          <div>
            <div className="stat-value">{loading ? '—' : orders.length}</div>
            <div className="stat-label">Pedidos</div>
          </div>
        </article>
      </div>

      <section className="admin-panel">
        <h2>Pagamentos</h2>
        <div className="admin-chip-row">
          {['aguardando', 'aprovado', 'recusado', 'expirado', 'cancelado'].map((status) => (
            <span key={status} className="admin-chip">
              <StatusBadge status={status as Order['status_pagamento']} variant="payment" inline />
              <strong>{paymentStats[status] || 0}</strong>
            </span>
          ))}
        </div>
        <p className="muted">
          Valor por número: {formatCurrency(settings.valor_numero)} · Total de números:{' '}
          {settings.total_numeros}
        </p>
      </section>

      <section className="admin-panel">
        <h2>Pedidos recentes</h2>
        {orders.length === 0 ? (
          <p className="muted">Nenhum pedido registrado ainda.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Participante</th>
                  <th>Números</th>
                  <th>Total</th>
                  <th>Pagamento</th>
                  <th>Data</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 10).map((order) => (
                  <tr key={order.id}>
                    <td>{order.codigo}</td>
                    <td>{order.participante_nome}</td>
                    <td>{order.numeros.length}</td>
                    <td>{formatCurrency(order.valor_total)}</td>
                    <td>
                      <StatusBadge status={order.status_pagamento} variant="payment" inline />
                    </td>
                    <td>{formatDateTime(order.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
