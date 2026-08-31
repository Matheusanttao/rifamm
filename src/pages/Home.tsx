import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { DemoBanner } from '../components/DemoBanner'
import { PrizeShowcase } from '../components/PrizeShowcase'
import { fetchRaffleNumbers, getNumberStats, syncNumbersWithSettings } from '../lib/numbers'
import { fetchSiteSettings } from '../lib/settings'
import { formatCurrency, formatDate } from '../lib/format'
import type { RaffleNumber } from '../types/raffle'
import type { SiteSettings } from '../types/settings'
import { defaultSiteSettings } from '../types/settings'

const COUPLE_IMAGE = '/matheus-melissa.png'

export function Home() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSiteSettings)
  const [numbers, setNumbers] = useState<RaffleNumber[]>([])
  const [loading, setLoading] = useState(true)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => setReady(true))
    })
    return () => cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    async function load() {
      try {
        const siteSettings = await fetchSiteSettings()
        await syncNumbersWithSettings(siteSettings)
        const raffleNumbers = await fetchRaffleNumbers(siteSettings)
        setSettings(siteSettings)
        setNumbers(raffleNumbers)
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  const stats = useMemo(() => getNumberStats(numbers), [numbers])
  const regulamentoLines = settings.regulamento.split('\n').filter(Boolean)

  return (
    <main className={`home-simple${ready ? ' is-ready' : ''}`}>
      <DemoBanner pagamentoHabilitado={settings.pagamento_habilitado} />

      <section className="home-hero">
        <div className="container home-hero-grid">
          <div className="home-hero-copy">
            <p className="home-kicker home-anim" style={{ '--d': '0ms' } as CSSProperties}>
              <span className="home-kicker-dot" aria-hidden="true" />
              rifa online · {settings.subtitulo_site}
            </p>
            <h1 className="home-anim" style={{ '--d': '90ms' } as CSSProperties}>
              {settings.titulo_site}
            </h1>
            <p className="home-lead home-anim" style={{ '--d': '180ms' } as CSSProperties}>
              {settings.texto_hero}
            </p>
            <Link
              className="home-cta home-anim"
              style={{ '--d': '270ms' } as CSSProperties}
              to="/participar"
            >
              Entrar na rifa
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>

          <figure className="home-hero-photo home-anim home-anim-photo" style={{ '--d': '140ms' } as CSSProperties}>
            <div className="home-hero-photo-frame" aria-hidden="true" />
            <div className="home-hero-photo-meta" aria-hidden="true">
              <span>{settings.subtitulo_site}</span>
              <span>LIVE</span>
            </div>
            <img
              src={COUPLE_IMAGE}
              alt={`${settings.subtitulo_site} — foto do casal`}
            />
          </figure>
        </div>
      </section>

      <section className="home-facts-bar home-anim" style={{ '--d': '360ms' } as CSSProperties} aria-label="Dados da rifa">
        <div className="container home-facts">
          <div className="home-fact">
            <span className="home-fact-label">sorteio</span>
            <strong>{formatDate(settings.data_sorteio)}</strong>
          </div>
          <div className="home-fact">
            <span className="home-fact-label">unitário</span>
            <strong>{formatCurrency(settings.valor_numero)}</strong>
          </div>
          <div className="home-fact">
            <span className="home-fact-label">disponíveis</span>
            <strong>{loading ? '—' : stats.disponivel}</strong>
          </div>
        </div>
      </section>

      <section className="container home-block home-anim" style={{ '--d': '420ms' } as CSSProperties} id="premios">
        <header className="home-block-head">
          <p className="home-section-id">01 / prêmios</p>
          <h2>O que você concorre</h2>
          <p>Três prêmios em dinheiro. Escolha seus números e participe.</p>
        </header>
        <PrizeShowcase settings={settings} />
      </section>

      <section className="container home-block home-anim" style={{ '--d': '520ms' } as CSSProperties} id="como-funciona">
        <header className="home-block-head">
          <p className="home-section-id">02 / fluxo</p>
          <h2>Como funciona</h2>
        </header>
        <ol className="home-steps">
          <li className="home-anim" style={{ '--d': '560ms' } as CSSProperties}>
            <span>01</span>
            <div>
              <strong>Selecionar números</strong>
              <p>Grade manual ou quantidade automática.</p>
            </div>
          </li>
          <li className="home-anim" style={{ '--d': '640ms' } as CSSProperties}>
            <span>02</span>
            <div>
              <strong>Confirmar dados</strong>
              <p>Nome e contato para identificar o pedido.</p>
            </div>
          </li>
          <li className="home-anim" style={{ '--d': '720ms' } as CSSProperties}>
            <span>03</span>
            <div>
              <strong>Pagar e aguardar</strong>
              <p>PIX ou cartão. Liberação após validação.</p>
            </div>
          </li>
        </ol>
      </section>

      <section className="container home-block home-anim" style={{ '--d': '780ms' } as CSSProperties} id="regulamento">
        <details className="home-rules">
          <summary>
            <span className="home-section-id">03 / regras</span>
            Regulamento
          </summary>
          <ul>
            {regulamentoLines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </details>
      </section>

      <section className="container home-signoff home-anim" style={{ '--d': '860ms' } as CSSProperties}>
        <p>{settings.texto_casal}</p>
        <p className="home-signoff-name">{settings.assinatura_casal}</p>
      </section>
    </main>
  )
}
