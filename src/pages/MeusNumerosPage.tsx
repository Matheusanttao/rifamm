import { useMemo, useState, type CSSProperties, type FormEvent } from 'react'
import { ArrowRight, Search, Ticket } from 'lucide-react'
import { Link } from 'react-router-dom'
import { StatusBadge } from '../components/StatusBadge'
import { formatCpf, isValidCpf, normalizeCpf } from '../lib/cpf'
import { formatCurrency, formatDateTime, formatNumbersList } from '../lib/format'
import { paymentMethodLabel, searchOrdersByCpf } from '../lib/orders'
import type { Order } from '../types/raffle'

function collectApprovedNumbers(orders: Order[]): number[] {
  const numbers = new Set<number>()
  for (const order of orders) {
    if (order.status_pagamento !== 'aprovado') continue
    for (const numero of order.numeros) numbers.add(numero)
  }
  return [...numbers].sort((a, b) => a - b)
}

export function MeusNumerosPage() {
  const [cpf, setCpf] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [orders, setOrders] = useState<Order[]>([])
  const [searched, setSearched] = useState(false)

  const cpfValido = isValidCpf(cpf)
  const approvedOrders = useMemo(
    () => orders.filter((order) => order.status_pagamento === 'aprovado'),
    [orders],
  )
  const pendingOrders = useMemo(
    () => orders.filter((order) => order.status_pagamento === 'aguardando'),
    [orders],
  )
  const numerosComprados = useMemo(() => collectApprovedNumbers(orders), [orders])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!cpfValido) {
      setError('Informe um CPF válido.')
      return
    }

    setError('')
    setLoading(true)
    setSearched(true)

    try {
      const found = await searchOrdersByCpf(cpf)
      setOrders(found)
      if (found.length === 0) {
        setError('Nenhuma participação encontrada para este CPF.')
      }
    } catch (err) {
      setOrders([])
      setError(err instanceof Error ? err.message : 'Não foi possível consultar seus números.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="buscar-page meus-numeros-page">
      <div className="container buscar-shell">
        <section className="buscar-card" style={{ '--d': '0ms' } as CSSProperties}>
          <p className="home-section-id">Consulta</p>
          <h1>Meus números</h1>
          <p className="muted">
            Digite seu CPF para ver os números que você comprou na rifa.
          </p>

          <form className="stacked-form buscar-form" onSubmit={handleSubmit}>
            <label>
              CPF
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={cpf}
                onChange={(e) => setCpf(formatCpf(e.target.value))}
                placeholder="000.000.000-00"
                maxLength={14}
                required
              />
            </label>
            {!cpfValido && normalizeCpf(cpf).length === 11 ? (
              <p className="form-error">CPF inválido. Confira os números digitados.</p>
            ) : null}
            {error ? <p className="form-error">{error}</p> : null}
            <button className="button primary" type="submit" disabled={loading || !cpfValido}>
              <Search size={16} />
              {loading ? 'Consultando...' : 'Ver meus números'}
            </button>
          </form>
        </section>

        {searched && orders.length > 0 ? (
          <section className="buscar-results">
            {numerosComprados.length > 0 ? (
              <article className="buscar-result-card meus-numeros-summary">
                <header className="buscar-result-head">
                  <div>
                    <p className="home-section-id">Números confirmados</p>
                    <h2>{approvedOrders[0]?.participante_nome || 'Participante'}</h2>
                    <p className="muted">CPF {formatCpf(cpf)}</p>
                  </div>
                  <span className="meus-numeros-count">
                    <Ticket size={18} />
                    {numerosComprados.length}
                  </span>
                </header>

                <div className="meus-numeros-grid" aria-label="Seus números comprados">
                  {numerosComprados.map((numero) => (
                    <span key={numero} className="meus-numero-chip">
                      {String(numero).padStart(3, '0')}
                    </span>
                  ))}
                </div>

                <p className="muted meus-numeros-hint">
                  Estes são os números com pagamento aprovado. Guarde-os para o sorteio!
                </p>
              </article>
            ) : (
              <article className="buscar-result-card">
                <p className="form-error">
                  Nenhum número confirmado ainda. Se você já pagou, aguarde alguns minutos e
                  consulte de novo.
                </p>
              </article>
            )}

            {approvedOrders.map((order) => (
              <article key={order.id} className="buscar-result-card">
                <header className="buscar-result-head">
                  <div>
                    <p className="home-section-id">{order.codigo}</p>
                    <h2>Pedido confirmado</h2>
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
                    <span>Confirmado em</span>
                    <strong>{formatDateTime(order.pago_em || order.updated_at)}</strong>
                  </div>
                </div>

                <div className="buscar-result-actions">
                  <Link className="button ghost" to={`/pedido/${order.id}`}>
                    Ver comprovante <ArrowRight size={16} />
                  </Link>
                </div>
              </article>
            ))}

            {pendingOrders.map((order) => (
              <article key={order.id} className="buscar-result-card">
                <header className="buscar-result-head">
                  <div>
                    <p className="home-section-id">{order.codigo}</p>
                    <h2>Pagamento pendente</h2>
                  </div>
                  <StatusBadge status={order.status_pagamento} variant="payment" inline />
                </header>

                <div className="order-confirmation-details">
                  <div>
                    <span>Números reservados</span>
                    <strong>{formatNumbersList(order.numeros)}</strong>
                  </div>
                  <div>
                    <span>Total</span>
                    <strong>{formatCurrency(order.valor_total)}</strong>
                  </div>
                </div>

                <div className="buscar-result-actions">
                  <Link className="button primary" to={`/pedido/${order.id}`}>
                    Concluir pagamento <ArrowRight size={16} />
                  </Link>
                </div>
              </article>
            ))}
          </section>
        ) : null}
      </div>
    </main>
  )
}
