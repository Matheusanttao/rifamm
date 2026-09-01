/**
 * Ping diario no Supabase para evitar pausa por inatividade (plano free).
 * Agendado via cron no vercel.json — roda 1x por dia.
 */
export default async function handler(req, res) {
  const cronSecret = process.env.CRON_SECRET
  const auth = req.headers.authorization

  if (cronSecret && auth !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' })
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const supabaseKey =
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({
      ok: false,
      error: 'Configure SUPABASE_URL e SUPABASE_ANON_KEY na Vercel.',
    })
  }

  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/rpc/liberar_reservas_expiradas`,
      {
        method: 'POST',
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
      },
    )

    let liberados = 0
    if (response.ok) {
      const body = await response.json().catch(() => null)
      liberados = typeof body === 'number' ? body : 0
    }

    const ping = await fetch(
      `${supabaseUrl}/rest/v1/site_settings?select=id&limit=1`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      },
    )

    if (!ping.ok) {
      const body = await ping.text()
      return res.status(502).json({
        ok: false,
        error: 'Supabase respondeu com erro.',
        status: ping.status,
        body,
      })
    }

    return res.status(200).json({
      ok: true,
      message: 'Supabase pingado com sucesso.',
      reservas_liberadas: liberados,
      at: new Date().toISOString(),
    })
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Erro ao pingar Supabase.',
    })
  }
}
