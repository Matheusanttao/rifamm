import { loadEnvFiles } from './load-env.mjs'
import { sendOrderThankYouEmail } from '../api/lib/send-order-email.js'

loadEnvFiles()

const to = process.argv[2] || 'matheusantaosilva01@gmail.com'

const result = await sendOrderThankYouEmail({
  codigo: 'TESTE-001',
  participante_nome: 'Matheus',
  participante_email: to,
  numeros: [7, 42, 128],
  valor_total: 15,
  email_enviado: false,
})

console.log(result)
