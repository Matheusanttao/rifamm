import { loadMercadoPago } from '@mercadopago/sdk-js'
import { initMercadoPago } from '@mercadopago/sdk-react'

const publicKey = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY as string | undefined
let initPromise: Promise<boolean> | null = null

export function isMercadoPagoConfigured() {
  return Boolean(publicKey?.trim())
}

export function isProductionMercadoPagoKey() {
  return publicKey?.startsWith('APP_USR') ?? false
}

export function getMercadoPagoSetupHint() {
  if (!publicKey) {
    return 'Configure VITE_MERCADOPAGO_PUBLIC_KEY no .env.local e na Vercel.'
  }

  const host = typeof window !== 'undefined' ? window.location.hostname : ''
  const isLocalhost = host === 'localhost' || host === '127.0.0.1'

  if (isProductionMercadoPagoKey() && isLocalhost) {
    return 'Você está usando chave de produção em localhost. Para testar localmente, use credenciais TEST- do Mercado Pago, ou teste no site publicado na Vercel.'
  }

  if (isProductionMercadoPagoKey()) {
    return 'No painel do Mercado Pago, cadastre o domínio do site em Suas integrações → Configurações → URLs de produção.'
  }

  return ''
}

export function initMercadoPagoSdk() {
  if (!publicKey) return Promise.resolve(false)

  if (!initPromise) {
    initPromise = (async () => {
      await loadMercadoPago()
      initMercadoPago(publicKey, { locale: 'pt-BR' })
      return true
    })().catch((error) => {
      initPromise = null
      console.error('Falha ao iniciar Mercado Pago SDK:', error)
      return false
    })
  }

  return initPromise
}
