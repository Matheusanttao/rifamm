/**
 * Teste unitário sem Resend: mocka fetch e valida o payload da notificação.
 */
import assert from 'node:assert/strict'
import { sendAdminPurchaseNotification } from '../api/lib/send-order-email.js'

process.env.RESEND_API_KEY = 're_test_key'
process.env.EMAIL_FROM = 'Rifa Teste <onboarding@resend.dev>'
process.env.EMAIL_NOTIFY_TO = 'admin@example.com, melissa@example.com'

const calls = []
globalThis.fetch = async (url, options) => {
  calls.push({ url, options })
  return {
    ok: true,
    status: 200,
    json: async () => ({ id: 'email_mock_1' }),
  }
}

const order = {
  codigo: 'RIFA-42',
  participante_nome: 'Ana Silva',
  participante_email: 'ana@email.com',
  participante_telefone: '(21) 98888-7777',
  participante_cpf: '123.456.789-00',
  numeros: [15, 3],
  valor_total: 30,
  metodo_pagamento: 'pix',
}

const result = await sendAdminPurchaseNotification(order)
assert.equal(result.sent, true)
assert.equal(result.id, 'email_mock_1')
assert.equal(calls.length, 1)
assert.equal(calls[0].url, 'https://api.resend.com/emails')

const body = JSON.parse(calls[0].options.body)
assert.deepEqual(body.to, ['admin@example.com', 'melissa@example.com'])
assert.match(body.subject, /Nova compra na rifa — RIFA-42/)
assert.match(body.text, /Ana Silva/)
assert.match(body.text, /ana@email.com/)
assert.match(body.text, /003, 015/)
assert.match(body.html, /Nova compra aprovada/)

// Sem EMAIL_NOTIFY_TO → skip
process.env.EMAIL_NOTIFY_TO = ''
const skipped = await sendAdminPurchaseNotification(order)
assert.equal(skipped.skipped, true)
assert.equal(calls.length, 1)

console.log('OK: notificação admin monta e envia o payload esperado')
