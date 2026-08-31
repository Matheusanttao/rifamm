import { formatCurrency, formatNumbersList } from '../lib/format'

type OrderSummaryProps = {
  numeros: number[]
  valorNumero: number
  compact?: boolean
}

export function OrderSummary({ numeros, valorNumero, compact }: OrderSummaryProps) {
  const total = numeros.length * valorNumero

  return (
    <div className={`order-summary ${compact ? 'is-compact' : ''}`}>
      <div className="order-summary-row">
        <span>Quantidade</span>
        <strong>{numeros.length}</strong>
      </div>
      <div className="order-summary-row">
        <span>Valor por número</span>
        <strong>{formatCurrency(valorNumero)}</strong>
      </div>
      {!compact ? (
        <div className="order-summary-row numbers">
          <span>Números escolhidos</span>
          <strong>{formatNumbersList(numeros)}</strong>
        </div>
      ) : null}
      <div className="order-summary-row total">
        <span>Total</span>
        <strong>{formatCurrency(total)}</strong>
      </div>
    </div>
  )
}
