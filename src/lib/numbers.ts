import type { NumberStats, RaffleNumber } from '../types/raffle'
import type { SiteSettings } from '../types/settings'
import { isSupabaseConfigured, supabase } from './supabase'

const NUMBERS_KEY = 'rifa_numeros_demo'
const DEMO_RESERVED = [7, 12, 23, 45, 67, 88, 101, 134, 156, 178]
const DEMO_SOLD = [3, 15, 28, 42, 55, 72, 99, 120, 145, 190]

function buildDemoNumbers(total: number): RaffleNumber[] {
  return Array.from({ length: total }, (_, index) => {
    const numero = index + 1
    let status: RaffleNumber['status'] = 'disponivel'
    if (DEMO_SOLD.includes(numero)) status = 'vendido'
    else if (DEMO_RESERVED.includes(numero)) status = 'reservado'

    return {
      numero,
      status,
      pedido_id: status === 'disponivel' ? null : 'demo',
      reservado_ate: status === 'reservado' ? new Date(Date.now() + 10 * 60_000).toISOString() : null,
    }
  })
}

function readLocalNumbers(total: number): RaffleNumber[] {
  try {
    const raw = localStorage.getItem(NUMBERS_KEY)
    if (!raw) {
      const demo = buildDemoNumbers(total)
      localStorage.setItem(NUMBERS_KEY, JSON.stringify(demo))
      return demo
    }
    return JSON.parse(raw) as RaffleNumber[]
  } catch {
    return buildDemoNumbers(total)
  }
}

function writeLocalNumbers(numbers: RaffleNumber[]) {
  localStorage.setItem(NUMBERS_KEY, JSON.stringify(numbers))
}

export function getNumberStats(numbers: RaffleNumber[]): NumberStats {
  return numbers.reduce<NumberStats>(
    (acc, item) => {
      acc.total += 1
      acc[item.status] += 1
      return acc
    },
    { total: 0, disponivel: 0, reservado: 0, vendido: 0 },
  )
}

export async function fetchRaffleNumbers(settings: SiteSettings): Promise<RaffleNumber[]> {
  if (!isSupabaseConfigured) {
    const numbers = readLocalNumbers(settings.total_numeros)
    const now = Date.now()
    const updated = numbers.map((item) => {
      if (item.status === 'reservado' && item.reservado_ate && new Date(item.reservado_ate).getTime() < now) {
        return { ...item, status: 'disponivel' as const, pedido_id: null, reservado_ate: null }
      }
      return item
    })
    writeLocalNumbers(updated)
    return updated
  }

  await supabase.rpc('liberar_reservas_expiradas')

  const { data, error } = await supabase
    .from('rifa_numeros')
    .select('*')
    .order('numero', { ascending: true })

  if (error) throw new Error(error.message)
  return data || []
}

export function pickRandomAvailable(numbers: RaffleNumber[], quantity: number): number[] {
  const available = numbers.filter((n) => n.status === 'disponivel').map((n) => n.numero)
  if (quantity > available.length) {
    throw new Error(`Apenas ${available.length} números disponíveis.`)
  }

  const shuffled = [...available]
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  return shuffled.slice(0, quantity).sort((a, b) => a - b)
}

export async function reserveNumbersLocally(
  numeros: number[],
  pedidoId: string,
  reservaMinutos: number,
  settings: SiteSettings,
): Promise<void> {
  const all = await fetchRaffleNumbers(settings)
  const now = Date.now()
  const reservadoAte = new Date(now + reservaMinutos * 60_000).toISOString()

  const unavailable = numeros.filter((numero) => {
    const item = all.find((n) => n.numero === numero)
    return !item || item.status !== 'disponivel'
  })

  if (unavailable.length > 0) {
    throw new Error(`Os números ${unavailable.join(', ')} não estão mais disponíveis.`)
  }

  const updated = all.map((item) =>
    numeros.includes(item.numero)
      ? { ...item, status: 'reservado' as const, pedido_id: pedidoId, reservado_ate: reservadoAte }
      : item,
  )

  writeLocalNumbers(updated)
}

export async function confirmNumbersLocally(numeros: number[], settings: SiteSettings): Promise<void> {
  const all = await fetchRaffleNumbers(settings)
  const updated = all.map((item) =>
    numeros.includes(item.numero)
      ? { ...item, status: 'vendido' as const, reservado_ate: null }
      : item,
  )
  writeLocalNumbers(updated)
}

export async function releaseNumbersLocally(numeros: number[], settings: SiteSettings): Promise<void> {
  const all = await fetchRaffleNumbers(settings)
  const updated = all.map((item) =>
    numeros.includes(item.numero) && item.status === 'reservado'
      ? { ...item, status: 'disponivel' as const, pedido_id: null, reservado_ate: null }
      : item,
  )
  writeLocalNumbers(updated)
}

export async function syncNumbersWithSettings(settings: SiteSettings): Promise<void> {
  if (isSupabaseConfigured) {
    const { error } = await supabase.rpc('inicializar_numeros_rifa')
    // Sem grant a função falha; não bloqueia a home — só deixa a grade antiga.
    if (error) console.warn('Não foi possível sincronizar números:', error.message)
    return
  }

  const current = readLocalNumbers(settings.total_numeros)
  if (current.length === settings.total_numeros) return

  const next = buildDemoNumbers(settings.total_numeros)
  const preserved = new Map(current.map((item) => [item.numero, item]))
  const merged = next.map((item) => preserved.get(item.numero) || item)
  writeLocalNumbers(merged)
}
