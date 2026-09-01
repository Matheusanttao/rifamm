import { syncPendingOrders } from '../lib/sync-pending-orders.js'

export default async function handler(req, res) {
  const cronSecret = process.env.CRON_SECRET
  const auth = req.headers.authorization

  if (cronSecret && auth !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' })
  }

  try {
    const summary = await syncPendingOrders()
    return res.status(200).json({ ok: true, ...summary, at: new Date().toISOString() })
  } catch (error) {
    console.error('sync-pending-payments error:', error)
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Erro ao sincronizar pedidos pendentes.',
    })
  }
}
