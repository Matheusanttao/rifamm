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

export function ReservationCountdown({
  reservadoAte,
  reservaMinutos,
  onExpire,
  compact = false,
}: ReservationCountdownProps) {
  const { formatted, expired, urgent } = useReservationCountdown(reservadoAte, true)
  const expiredCalled = useRef(false)

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
          <strong>O tempo para pagamento acabou.</strong>
          <p>
            Sua reserva expirou após {reservaMinutos} minutos sem pagamento. Os números já voltaram
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
        <span className="reservation-countdown-label">Tempo restante para pagar</span>
        <strong className="reservation-countdown-time">{formatted}</strong>
        {!compact ? (
          <p className="reservation-countdown-hint">
            Conclua o pagamento em até {reservaMinutos} minutos ou a reserva será cancelada
            automaticamente.
          </p>
        ) : null}
      </div>
    </div>
  )
}
