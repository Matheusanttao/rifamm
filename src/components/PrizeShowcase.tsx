import type { SiteSettings } from '../types/settings'
import { getPrizesFromSettings } from '../lib/prizes'

type PrizeShowcaseProps = {
  settings: SiteSettings
}

const placeLabels = ['1º lugar', '2º lugar', '3º lugar'] as const

export function PrizeShowcase({ settings }: PrizeShowcaseProps) {
  const prizes = getPrizesFromSettings(settings)

  return (
    <div className="prize-grid">
      {prizes.map((prize, index) => (
        <article key={prize.place} className="prize-card-simple">
          <div className="prize-card-simple-image">
            <img src={prize.imageUrl} alt={prize.name} loading="lazy" />
          </div>
          <div className="prize-card-simple-body">
            <span className="prize-card-simple-rank">{placeLabels[index]}</span>
            <h3>{prize.name}</h3>
            <p>{prize.description}</p>
          </div>
        </article>
      ))}
    </div>
  )
}
