import { useEffect, useRef } from 'react'
import { AlertCircle, Clock3 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useReservationCountdown } from '../hooks/useReservationCountdown'

type ReservationCountdownProps = {
  reservadoAte: string
  reservaMinutos: number
  onExpire?: () => void
  compact?: boolean
}

function formatReservaPrazo(minutos: number): string {
  if (minutos >= 1440 && minutos % 1440 === 0) {
    const dias = minutos / 1440
    return dias === 1 ? '24 horas' : `${dias} dias`
  }
  if (minutos >= 60 && minutos % 60 === 0) {
    const horas = minutos / 60
    return horas === 1 ? '1 hora' : `${horas} horas`
  }
  return `${minutos} minutos`
}

export function ReservationCountdown({
  reservadoAte,
  reservaMinutos,
  onExpire,
  compact = false,
}: ReservationCountdownProps) {
  const { formatted, expired, urgent } = useReservationCountdown(reservadoAte, true)
  const expiredCalled = useRef(false)
  const prazoLabel = formatReservaPrazo(reservaMinutos)

  useEffect(() => {
    if (!expired || !onExpire || expiredCalled.current) return
    expiredCalled.current = true
    onExpire()
  }, [expired, onExpire])

  if (expired) {
    return (
      <div className="reservation-expired-banner" role="alert">
        <AlertCircle size={20} />
        <div>
          <strong>O prazo para pagamento acabou.</strong>
          <p>
            Não recebemos a confirmação do pagamento em até {prazoLabel}. Os números já voltaram
            para a grade — faça um novo pedido para tentar novamente.
          </p>
          <Link className="button primary reservation-retry-link" to="/participar">
            Fazer novo pedido
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={`reservation-countdown${urgent ? ' urgent' : ''}${compact ? ' compact' : ''}`}>
      <Clock3 size={compact ? 16 : 20} />
      <div>
        <span className="reservation-countdown-label">Prazo para confirmação do PIX</span>
        <strong className="reservation-countdown-time">{formatted}</strong>
        {!compact ? (
          <p className="reservation-countdown-hint">
            Assim que o banco confirmar o pagamento, sua participação é aprovada. Se não houver
            confirmação em até {prazoLabel}, a reserva expira automaticamente.
          </p>
        ) : null}
      </div>
    </div>
  )
}
