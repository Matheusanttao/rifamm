import { useEffect, useMemo, useState } from 'react'
import { Download, FileSpreadsheet, Users } from 'lucide-react'
import { fetchOrders } from '../lib/orders'
import { fetchSiteSettings } from '../lib/settings'
import { formatCurrency } from '../lib/format'
import type { Order } from '../types/raffle'
import type { SiteSettings } from '../types/settings'
import { defaultSiteSettings } from '../types/settings'

export function AdminExport() {
  const [orders, setOrders] = useState<Order[]>([])
  const [settings, setSettings] = useState<SiteSettings>(defaultSiteSettings)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const [pedidos, siteSettings] = await Promise.all([fetchOrders(), fetchSiteSettings()])
        setOrders(pedidos)
        setSettings(siteSettings)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Não foi possível carregar os pedidos.')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  const stats = useMemo(() => {
    const approved = orders.filter((o) => o.status_pagamento === 'aprovado')
    return {
      total: orders.length,
      approved: approved.length,
      numbers: approved.reduce((sum, o) => sum + (o.numeros?.length || 0), 0),
      amount: approved.reduce((sum, o) => sum + Number(o.valor_total || 0), 0),
    }
  }, [orders])

  async function handleExport(onlyApproved: boolean) {
    setError('')
    setExporting(true)
    try {
      const { downloadOrdersExcel } = await import('../lib/exportOrdersExcel')
      await downloadOrdersExcel(orders, settings, { onlyApproved })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível gerar o Excel.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <div>
          <p className="eyebrow">Relatórios</p>
          <h1>Exportar Excel</h1>
          <p className="muted">
            Baixe a lista completa de participantes com números, contatos e status de pagamento.
          </p>
        </div>
      </header>

      <section className="admin-panel">
        {loading ? (
          <p className="muted">Carregando pedidos...</p>
        ) : (
          <>
            <div className="dashboard-grid" style={{ marginBottom: '1.5rem' }}>
              <article className="dashboard-card">
                <span>Pedidos</span>
                <strong>{stats.total}</strong>
              </article>
              <article className="dashboard-card">
                <span>Aprovados</span>
                <strong>{stats.approved}</strong>
              </article>
              <article className="dashboard-card">
                <span>Números vendidos</span>
                <strong>{stats.numbers}</strong>
              </article>
              <article className="dashboard-card">
                <span>Total arrecadado</span>
                <strong>{formatCurrency(stats.amount)}</strong>
              </article>
            </div>

            <div className="export-actions">
              <button
                type="button"
                className="button primary large"
                disabled={exporting || stats.approved === 0}
                onClick={() => void handleExport(true)}
              >
                <Users size={18} />
                {exporting ? 'Gerando...' : 'Exportar compradores (aprovados)'}
              </button>

              <button
                type="button"
                className="button ghost large"
                disabled={exporting || stats.total === 0}
                onClick={() => void handleExport(false)}
              >
                <FileSpreadsheet size={18} />
                {exporting ? 'Gerando...' : 'Exportar todos os pedidos'}
              </button>
            </div>

            <ul className="export-notes muted">
              <li>
                <Download size={14} /> O arquivo tem 2 abas: <strong>Participantes</strong> e{' '}
                <strong>Números vendidos</strong>.
              </li>
              <li>
                Use <strong>compradores (aprovados)</strong> para a lista oficial de quem pagou.
              </li>
              <li>
                Use <strong>todos os pedidos</strong> se quiser incluir aguardando, expirados e
                cancelados.
              </li>
            </ul>

            {error ? <p className="form-error">{error}</p> : null}
          </>
        )}
      </section>
    </div>
  )
}
