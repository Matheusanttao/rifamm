import { initMercadoPago } from '@mercadopago/sdk-react'

const publicKey = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY as string | undefined
let initialized = false

export function isMercadoPagoConfigured() {
  return Boolean(publicKey)
}

export function initMercadoPagoSdk() {
  if (!publicKey || initialized) return Boolean(publicKey)
  initMercadoPago(publicKey, { locale: 'pt-BR' })
  initialized = true
  return true
}
