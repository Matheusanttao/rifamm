import type { CSSProperties } from 'react'
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
        <article
          key={prize.place}
          className={`prize-card-simple home-anim${index === 0 ? ' is-first' : ''}`}
          style={{ '--d': `${460 + index * 90}ms` } as CSSProperties}
        >
          <span className="prize-card-simple-rank">
            {String(index + 1).padStart(2, '0')} · lugar
          </span>
          <h3>{prize.name}</h3>
          <p>{prize.description}</p>
        </article>
      ))}
    </div>
  )
}
