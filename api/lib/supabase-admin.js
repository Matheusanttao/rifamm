const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export function getSupabaseAdminConfig() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY na Vercel.')
  }

  return { supabaseUrl, serviceRoleKey }
}

export async function supabaseAdminFetch(path, options = {}) {
  const { supabaseUrl, serviceRoleKey } = getSupabaseAdminConfig()
  const url = `${supabaseUrl}/rest/v1/${path}`
  const headers = {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
    ...(options.headers || {}),
  }

  const response = await fetch(url, { ...options, headers })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Supabase error ${response.status}: ${body}`)
  }

  if (response.status === 204) return null
  return response.json()
}

export async function fetchOrderById(orderId) {
  const rows = await supabaseAdminFetch(`pedidos?id=eq.${orderId}&select=*`)
  return rows?.[0] || null
}

export async function fetchSiteSettings() {
  const rows = await supabaseAdminFetch('site_settings?id=eq.1&select=*')
  return rows?.[0] || null
}

export async function updateOrder(orderId, payload) {
  const rows = await supabaseAdminFetch(`pedidos?id=eq.${orderId}`, {
    method: 'PATCH',
    body: JSON.stringify({ ...payload, updated_at: new Date().toISOString() }),
  })
  return rows?.[0] || null
}

export async function confirmOrderPayment(orderId) {
  const { supabaseUrl, serviceRoleKey } = getSupabaseAdminConfig()
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/confirmar_pagamento_pedido`, {
    method: 'POST',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ p_pedido_id: orderId }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Erro ao confirmar pagamento: ${body}`)
  }

  return response.json()
}

export async function releaseOrderNumbers(order) {
  if (!order?.numeros?.length) return

  for (const numero of order.numeros) {
    await supabaseAdminFetch(`rifa_numeros?numero=eq.${numero}`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: 'disponivel',
        pedido_id: null,
        reservado_ate: null,
        updated_at: new Date().toISOString(),
      }),
    })
  }
}

export async function releaseExpiredOrder(orderId) {
  const order = await fetchOrderById(orderId)
  if (!order) return

  await updateOrder(orderId, { status_pagamento: 'expirado' })
  await releaseOrderNumbers(order)
}
