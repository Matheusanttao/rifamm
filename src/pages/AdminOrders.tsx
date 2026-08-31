import { useEffect, useState } from 'react'
import { fetchOrders } from '../lib/orders'
import { fetchRaffleNumbers } from '../lib/numbers'
import { fetchSiteSettings } from '../lib/settings'
import { formatCurrency, formatDateTime, formatNumbersList } from '../lib/format'
import { StatusBadge } from '../components/StatusBadge'
import type { Order, RaffleNumber } from '../types/raffle'

export function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [numbers, setNumbers] = useState<RaffleNumber[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const settings = await fetchSiteSettings()
        const [pedidos, raffleNumbers] = await Promise.all([
          fetchOrders(),
          fetchRaffleNumbers(settings),
        ])
        setOrders(pedidos)
        setNumbers(raffleNumbers)
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <div>
          <p className="eyebrow">Pedidos e números</p>
          <h1>Acompanhamento completo</h1>
        </div>
      </header>

      <section className="admin-panel">
        <h2>Pedidos</h2>
        {loading ? (
          <p className="muted">Carregando...</p>
        ) : orders.length === 0 ? (
          <p className="muted">Nenhum pedido ainda.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Participante</th>
                  <th>Contato</th>
                  <th>Números</th>
                  <th>Total</th>
                  <th>Método</th>
                  <th>Status</th>
                  <th>Criado em</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.codigo}</td>
                    <td>{order.participante_nome}</td>
                    <td>
                      {order.participante_email}
                      {order.participante_telefone ? ` · ${order.participante_telefone}` : ''}
                    </td>
                    <td>{formatNumbersList(order.numeros)}</td>
                    <td>{formatCurrency(order.valor_total)}</td>
                    <td>{order.metodo_pagamento?.toUpperCase() || '—'}</td>
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

      <section className="admin-panel">
        <h2>Mapa de números</h2>
        <div className="admin-number-map">
          {numbers.map((item) => (
            <span key={item.numero} className={`admin-number-chip status-${item.status}`}>
              {String(item.numero).padStart(3, '0')}
            </span>
          ))}
        </div>
      </section>
    </div>
  )
}
