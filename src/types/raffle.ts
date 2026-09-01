export type NumberStatus = 'disponivel' | 'reservado' | 'vendido'

export type PaymentStatus =
  | 'aguardando'
  | 'aprovado'
  | 'recusado'
  | 'expirado'
  | 'cancelado'

export type PaymentMethod = 'pix' | 'cartao'

export type RaffleNumber = {
  numero: number
  status: NumberStatus
  pedido_id: string | null
  reservado_ate: string | null
}

export type Order = {
  id: string
  codigo: string
  participante_nome: string
  participante_email: string
  participante_telefone: string | null
  participante_cpf: string | null
  numeros: number[]
  valor_total: number
  status_pagamento: PaymentStatus
  metodo_pagamento: PaymentMethod | null
  pix_copia_cola: string | null
  pix_qr_base64: string | null
  checkout_url: string | null
  provider_payment_id: string | null
  reservado_ate: string | null
  pago_em: string | null
  email_enviado?: boolean
  created_at: string
  updated_at: string
}

export type CreateOrderInput = {
  participante_nome: string
  participante_email: string
  participante_telefone: string
  participante_cpf: string
  numeros: number[]
  metodo_pagamento: PaymentMethod
}

export type NumberStats = {
  total: number
  disponivel: number
  reservado: number
  vendido: number
}
