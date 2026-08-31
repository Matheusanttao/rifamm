import type { CSSProperties } from 'react'
import type { SiteSettings } from '../types/settings'
import { defaultSiteSettings } from '../types/settings'
import { getPrizesFromSettings } from '../lib/prizes'

type PrizeShowcaseProps = {
  settings: SiteSettings
}

export function PrizeShowcase({ settings }: PrizeShowcaseProps) {
  const prizes = getPrizesFromSettings(settings)
  const fallbacks = getPrizesFromSettings(defaultSiteSettings)

  return (
    <div className="prize-stack">
      {prizes.map((prize, index) => (
        <article
          key={prize.place}
          className={`prize-row home-anim${index === 0 ? ' is-first' : ''}`}
          style={{ '--d': `${460 + index * 90}ms` } as CSSProperties}
        >
          <span className="prize-row-num">{String(index + 1).padStart(2, '0')}</span>
          <div className="prize-row-body">
            <span className="prize-row-place">{index + 1}º Prêmio</span>
            <h3>{prize.name.trim() || fallbacks[index].name}</h3>
            <p>{prize.description.trim() || fallbacks[index].description}</p>
          </div>
        </article>
      ))}
    </div>
  )
}
