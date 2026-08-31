import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { sendOrderThankYouEmail } from '../api/lib/send-order-email.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.join(__dirname, '..', '.env')

if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx === -1) continue
    const key = trimmed.slice(0, idx)
    const value = trimmed.slice(idx + 1)
    if (!process.env[key]) process.env[key] = value
  }
}

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
