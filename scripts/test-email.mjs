import { loadEnvFiles } from './load-env.mjs'
import {
  sendAdminPurchaseNotification,
  sendOrderThankYouEmail,
} from '../api/lib/send-order-email.js'

loadEnvFiles()

const mode = process.argv[2] === 'admin' ? 'admin' : 'thanks'
const to = process.argv[mode === 'admin' ? 3 : 2] || 'matheusantaosilva01@gmail.com'

const sampleOrder = {
  codigo: 'TESTE-001',
  participante_nome: 'Matheus Teste',
  participante_email: to,
  participante_telefone: '(11) 99999-0000',
  participante_cpf: '000.000.000-00',
  numeros: [7, 42, 128],
  valor_total: 45,
  metodo_pagamento: 'pix',
  email_enviado: false,
}

if (mode === 'admin') {
  if (!process.env.EMAIL_NOTIFY_TO) {
    process.env.EMAIL_NOTIFY_TO = to
  }
  const result = await sendAdminPurchaseNotification(sampleOrder)
  console.log(result)
} else {
  const result = await sendOrderThankYouEmail(sampleOrder)
  console.log(result)
}
