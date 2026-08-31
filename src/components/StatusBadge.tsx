import type { NumberStatus, PaymentStatus } from '../types/raffle'
import { numberStatusLabel, paymentStatusLabel } from '../lib/format'

type StatusBadgeProps = {
  status: NumberStatus | PaymentStatus
  variant?: 'number' | 'payment'
  inline?: boolean
}

export function StatusBadge({ status, variant = 'number', inline }: StatusBadgeProps) {
  const label = variant === 'payment' ? paymentStatusLabel(status) : numberStatusLabel(status)

  return (
    <span className={`badge status-badge status-${status} ${inline ? 'is-inline' : ''}`}>
      {label}
    </span>
  )
}
