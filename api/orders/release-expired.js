import { syncPendingOrders } from '../lib/sync-pending-orders.js'

export default async function handler(_req, res) {
  try {
    const summary = await syncPendingOrders()
    return res.status(200).json({ ok: true, ...summary })
  } catch (error) {
    console.error('release-expired error:', error)
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Erro ao liberar reservas expiradas.',
    })
  }
}
