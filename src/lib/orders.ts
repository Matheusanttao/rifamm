import type { CreateOrderInput, Order, PaymentMethod } from '../types/raffle'
import type { SiteSettings } from '../types/settings'
import { isValidCpf, normalizeCpf } from './cpf'
import { generateOrderCode } from './format'
import { releaseNumbersLocally, reserveNumbersLocally } from './numbers'
import { isSupabaseConfigured, supabase } from './supabase'

const ORDERS_KEY = 'rifa_pedidos_demo'

function emptyPaymentFields() {
  return {
    pix_copia_cola: null as string | null,
    pix_qr_base64: null as string | null,
    checkout_url: null as string | null,
    provider_payment_id: null as string | null,
  }
}

function readLocalOrders(): Order[] {
  try {
    const raw = localStorage.getItem(ORDERS_KEY)
    return raw ? (JSON.parse(raw) as Order[]) : []
  } catch {
    return []
  }
}

function writeLocalOrders(orders: Order[]) {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders))
}

function buildDemoPixCode(order: Order) {
  return `DEMO-PIX-${order.codigo}-VALOR-${order.valor_total.toFixed(2)}-RIFA-MATHEUS-MELISSA`
}

export async function createOrder(
  input: CreateOrderInput,
  settings: SiteSettings,
): Promise<Order> {
  const telefone = input.participante_telefone.trim()
  if (!telefone) {
    throw new Error('Informe o telefone / WhatsApp.')
  }

  const cpf = normalizeCpf(input.participante_cpf)
  if (!isValidCpf(cpf)) {
    throw new Error('Informe um CPF válido.')
  }

  const valorTotal = input.numeros.length * settings.valor_numero
  const now = new Date().toISOString()

  if (!isSupabaseConfigured) {
    const id = crypto.randomUUID()
    const order: Order = {
      id,
      codigo: generateOrderCode(),
      participante_nome: input.participante_nome.trim(),
      participante_email: input.participante_email.trim(),
      participante_telefone: telefone,
      participante_cpf: cpf,
      numeros: [...input.numeros].sort((a, b) => a - b),
      valor_total: valorTotal,
      status_pagamento: 'aguardando',
      metodo_pagamento: input.metodo_pagamento,
      ...emptyPaymentFields(),
      reservado_ate: null,
      pago_em: null,
      email_enviado: false,
      created_at: now,
      updated_at: now,
    }

    order.pix_copia_cola = buildDemoPixCode(order)
    order.pix_qr_base64 = null
    order.checkout_url = null
    order.provider_payment_id = null
    await reserveNumbersLocally(order.numeros, order.id, settings)

    const orders = readLocalOrders()
    orders.unshift(order)
    writeLocalOrders(orders)
    return order
  }

  const { data: inserted, error: insertError } = await supabase
    .from('pedidos')
    .insert({
      codigo: generateOrderCode(),
      participante_nome: input.participante_nome.trim(),
      participante_email: input.participante_email.trim(),
      participante_telefone: telefone,
      participante_cpf: cpf,
      numeros: input.numeros,
      valor_total: valorTotal,
      status_pagamento: 'aguardando',
      metodo_pagamento: input.metodo_pagamento,
      reservado_ate: null,
    })
    .select('*')
    .single()

  if (insertError || !inserted) throw new Error(insertError?.message || 'Erro ao criar pedido.')

  const { data: reserveResult, error: reserveError } = await supabase.rpc('reservar_numeros', {
    p_pedido_id: inserted.id,
    p_numeros: input.numeros,
    p_reserva_minutos: 0,
  })

  if (reserveError) {
    // Sem policy de delete para anon; falha silenciosa deixa pedido órfão sem números.
    await supabase.from('pedidos').delete().eq('id', inserted.id)
    throw new Error(reserveError.message)
  }

  // RPC RETURNS TABLE → o client devolve array [{ sucesso, mensagem }]
  const reserveRow = (Array.isArray(reserveResult) ? reserveResult[0] : reserveResult) as
    | { sucesso?: boolean; mensagem?: string }
    | undefined

  if (!reserveRow?.sucesso) {
    await supabase.from('pedidos').delete().eq('id', inserted.id)
    throw new Error(reserveRow?.mensagem || 'Números indisponíveis.')
  }

  const { data: reservedOrder } = await supabase
    .from('pedidos')
    .select('*')
    .eq('id', inserted.id)
    .maybeSingle()

  return reservedOrder || inserted
}

export async function fetchOrder(id: string): Promise<Order | null> {
  if (!isSupabaseConfigured) {
    const order = readLocalOrders().find((item) => item.id === id) || null
    if (!order) return null
    return refreshLocalOrderStatus(order)
  }

  const { data, error } = await supabase.from('pedidos').select('*').eq('id', id).maybeSingle()
  if (error) throw new Error(error.message)
  return data
}

export async function fetchOrders(): Promise<Order[]> {
  if (!isSupabaseConfigured) {
    const orders = readLocalOrders()
    return Promise.all(orders.map((order) => refreshLocalOrderStatus(order)))
  }

  const { data, error } = await supabase.from('pedidos').select('*').order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data || []
}

export async function searchOrders(codigo: string, email: string): Promise<Order[]> {
  const code = codigo.trim().toUpperCase()
  const mail = email.trim().toLowerCase()
  if (!code || !mail) return []

  if (!isSupabaseConfigured) {
    const orders = await fetchOrders()
    return orders.filter(
      (order) =>
        order.codigo.toUpperCase() === code && order.participante_email.toLowerCase() === mail,
    )
  }

  const { data, error } = await supabase
    .from('pedidos')
    .select('*')
    .eq('codigo', code)
    .ilike('participante_email', mail)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}

async function refreshLocalOrderStatus(order: Order): Promise<Order> {
  return order
}

export function getPixQrUrl(copiaCola: string, base64?: string | null) {
  if (base64) return `data:image/png;base64,${base64}`
  const encoded = encodeURIComponent(copiaCola)
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encoded}`
}

export async function applyPaymentDataToOrder(
  orderId: string,
  payment: {
    pix_copia_cola?: string | null
    pix_qr_base64?: string | null
    checkout_url?: string | null
    provider_payment_id?: string | null
  },
): Promise<Order | null> {
  if (!isSupabaseConfigured) {
    const orders = readLocalOrders()
    const index = orders.findIndex((item) => item.id === orderId)
    if (index === -1) return null
    orders[index] = { ...orders[index], ...payment, updated_at: new Date().toISOString() }
    writeLocalOrders(orders)
    return orders[index]
  }

  // O PIX/checkout já é gravado pela API (/api/mercadopago/create-payment) com service role.
  // Anon não tem policy de UPDATE em pedidos — buscar evita "Cannot coerce to single JSON object".
  return fetchOrder(orderId)
}

export async function cancelPendingOrder(orderId: string, settings: SiteSettings): Promise<boolean> {
  if (!isSupabaseConfigured) {
    const orders = readLocalOrders()
    const index = orders.findIndex((item) => item.id === orderId)
    if (index === -1) return false
    if (orders[index].status_pagamento !== 'aguardando') return false

    await releaseNumbersLocally(orders[index].numeros, settings)
    orders[index] = {
      ...orders[index],
      status_pagamento: 'cancelado',
      updated_at: new Date().toISOString(),
    }
    writeLocalOrders(orders)
    return true
  }

  const response = await fetch('/api/orders/cancel-pending', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId }),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.error || 'Não foi possível cancelar o pedido.')
  }

  return Boolean(data.released)
}

export function paymentMethodLabel(method: PaymentMethod | null) {
  if (method === 'pix') return 'PIX'
  if (method === 'cartao') return 'Cartão de crédito'
  return '—'
}
