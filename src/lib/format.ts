export function formatCurrency(value: number | null) {
  if (value === null || value === undefined) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function formatDate(value: string | null) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value))
}

export function formatDateTime(value: string | null) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function numberStatusLabel(status: string) {
  const labels: Record<string, string> = {
    disponivel: 'Disponível',
    reservado: 'Reservado',
    vendido: 'Vendido',
  }
  return labels[status] || status
}

export function paymentStatusLabel(status: string) {
  const labels: Record<string, string> = {
    aguardando: 'Aguardando pagamento',
    aprovado: 'Pagamento aprovado',
    recusado: 'Pagamento recusado',
    expirado: 'Pagamento expirado',
    cancelado: 'Pedido cancelado',
  }
  return labels[status] || status
}

export function formatNumbersList(numbers: number[]) {
  return [...numbers].sort((a, b) => a - b).map((n) => String(n).padStart(3, '0')).join(', ')
}

export function generateOrderCode() {
  const part = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `RF-${part}`
}
