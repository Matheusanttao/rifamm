import type { SiteSettings } from '../types/settings'
import { getPrizesFromSettings } from '../lib/prizes'

type PrizeShowcaseProps = {
  settings: SiteSettings
}

export function PrizeShowcase({ settings }: PrizeShowcaseProps) {
  const prizes = getPrizesFromSettings(settings)

  return (
    <div className="prize-grid">
      {prizes.map((prize, index) => (
        <article key={prize.place} className="prize-card-simple">
          <span className="prize-card-simple-rank">
            {String(index + 1).padStart(2, '0')}
          </span>
          <h3>{prize.name}</h3>
          <p>{prize.description}</p>
        </article>
      ))}
    </div>
  )
}
