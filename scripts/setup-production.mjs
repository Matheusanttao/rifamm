/**
 * Verifica Supabase, habilita pagamentos e inicializa números da rifa.
 * Uso: node scripts/setup-production.mjs
 */
import { loadEnvFiles } from './load-env.mjs'

loadEnvFiles()

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local')
  process.exit(1)
}

const headers = {
  apikey: serviceRoleKey,
  Authorization: `Bearer ${serviceRoleKey}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
}

async function rest(path, options = {}) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers || {}) },
  })
  const text = await response.text()
  if (!response.ok) throw new Error(`${response.status}: ${text}`)
  return text ? JSON.parse(text) : null
}

async function rpc(fn, body) {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
  const text = await response.text()
  if (!response.ok) throw new Error(`${fn} ${response.status}: ${text}`)
  return text ? JSON.parse(text) : null
}

const checks = []

try {
  const settings = await rest('site_settings?id=eq.1&select=*')
  const row = settings?.[0]
  if (!row) throw new Error('Tabela site_settings vazia — rode supabase/schema.sql primeiro.')
  checks.push(`✓ site_settings OK (pagamento_habilitado=${row.pagamento_habilitado})`)

  if (!row.pagamento_habilitado) {
    await rest('site_settings?id=eq.1', {
      method: 'PATCH',
      body: JSON.stringify({ pagamento_habilitado: true }),
    })
    checks.push('✓ Pagamentos habilitados')
  } else {
    checks.push('✓ Pagamentos já estavam habilitados')
  }

  const numbers = await rest('rifa_numeros?select=numero&limit=1')
  if (!numbers?.length) {
    const total = row.total_numeros || 200
    await rpc('inicializar_numeros_rifa', { p_total: total })
    checks.push(`✓ ${total} números inicializados`)
  } else {
    const count = await rest('rifa_numeros?select=numero')
    checks.push(`✓ ${count.length} números já existem na rifa`)
  }

  const pedidos = await rest('pedidos?select=id&limit=1')
  checks.push(`✓ Tabela pedidos OK`)

  console.log('\nSetup concluído:\n')
  for (const line of checks) console.log(`  ${line}`)

  const missing = []
  if (!process.env.MERCADOPAGO_ACCESS_TOKEN) missing.push('MERCADOPAGO_ACCESS_TOKEN')
  if (!process.env.WEBHOOK_BASE_URL) missing.push('WEBHOOK_BASE_URL (URL da Vercel)')
  if (!process.env.RESEND_API_KEY) missing.push('RESEND_API_KEY')
  if (!process.env.CRON_SECRET) missing.push('CRON_SECRET')

  if (missing.length) {
    console.log('\nAinda configure na Vercel / .env.local:')
    for (const key of missing) console.log(`  - ${key}`)
  }

  console.log('\nLembrete: crie um usuário admin em Supabase → Authentication → Users')
  console.log('Webhook MP: https://SEU-SITE.vercel.app/api/mercadopago/webhook\n')
} catch (error) {
  console.error('\nErro no setup:', error.message)
  console.error('\nRode o SQL em supabase/schema.sql e as migrations no painel do Supabase.\n')
  process.exit(1)
}
