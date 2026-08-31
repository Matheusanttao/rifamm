import { Award, Crown, Medal } from 'lucide-react'
import type { SiteSettings } from '../types/settings'
import { getPrizesFromSettings } from '../lib/prizes'

type PrizeShowcaseProps = {
  settings: SiteSettings
}

const placeMeta = [
  { place: '1º lugar', icon: Crown, className: 'is-first' },
  { place: '2º lugar', icon: Award, className: 'is-second' },
  { place: '3º lugar', icon: Medal, className: 'is-third' },
] as const

export function PrizeShowcase({ settings }: PrizeShowcaseProps) {
  const prizes = getPrizesFromSettings(settings)

  return (
    <div className="prize-podium">
      {prizes.map((prize, index) => {
        const meta = placeMeta[index]
        const Icon = meta.icon

        return (
          <article key={prize.place} className={`prize-podium-card ${meta.className}`}>
            <span className="prize-podium-rank">
              <Icon size={18} />
              {meta.place}
            </span>
            <div className="prize-podium-image">
              <img src={prize.imageUrl} alt={prize.name} loading="lazy" />
            </div>
            <div className="prize-podium-body">
              <h3>{prize.name}</h3>
              <p>{prize.description}</p>
            </div>
          </article>
        )
      })}
    </div>
  )
}
