import { useEffect, useState } from 'react'

function remainingMs(reservadoAte: string | null): number {
  if (!reservadoAte) return 0
  return Math.max(0, new Date(reservadoAte).getTime() - Date.now())
}

export function formatCountdown(ms: number): string {
  if (ms <= 0) return '00:00'
  const totalSec = Math.ceil(ms / 1000)
  const min = Math.floor(totalSec / 60)
  const sec = totalSec % 60
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

export function isReservationExpired(reservadoAte: string | null): boolean {
  if (!reservadoAte) return false
  return new Date(reservadoAte).getTime() <= Date.now()
}

export function useReservationCountdown(reservadoAte: string | null, active: boolean) {
  const [ms, setMs] = useState(() => remainingMs(reservadoAte))

  useEffect(() => {
    if (!active || !reservadoAte) {
      setMs(0)
      return
    }

    const tick = () => setMs(remainingMs(reservadoAte))
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [reservadoAte, active])

  return {
    remainingMs: ms,
    expired: ms <= 0,
    formatted: formatCountdown(ms),
    urgent: ms > 0 && ms <= 60_000,
  }
}
