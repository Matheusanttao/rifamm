import { useEffect, useMemo, useState } from 'react'
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
    <main className="home-simple">
      <DemoBanner pagamentoHabilitado={settings.pagamento_habilitado} />

      <section className="home-hero">
        <div className="container home-hero-grid">
          <div className="home-hero-copy">
            <p className="home-kicker">
              <span className="home-kicker-dot" aria-hidden="true" />
              sistema online · {settings.subtitulo_site}
            </p>
            <h1>{settings.titulo_site}</h1>
            <p className="home-lead">{settings.texto_hero}</p>
            <Link className="home-cta" to="/participar">
              Entrar na rifa
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>

          <figure className="home-hero-photo">
            <div className="home-hero-photo-meta" aria-hidden="true">
              <span>IMG_01</span>
              <span>LIVE</span>
            </div>
            <img
              src={COUPLE_IMAGE}
              alt={`${settings.subtitulo_site} — foto do casal`}
            />
          </figure>
        </div>
      </section>

      <section className="home-facts-bar" aria-label="Dados da rifa">
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

      <section className="container home-block" id="premios">
        <header className="home-block-head">
          <p className="home-section-id">01 / prêmios</p>
          <h2>O que você concorre</h2>
          <p>Três prêmios em dinheiro. Escolha seus números e participe.</p>
        </header>
        <PrizeShowcase settings={settings} />
      </section>

      <section className="container home-block" id="como-funciona">
        <header className="home-block-head">
          <p className="home-section-id">02 / fluxo</p>
          <h2>Como funciona</h2>
        </header>
        <ol className="home-steps">
          <li>
            <span>01</span>
            <div>
              <strong>Selecionar números</strong>
              <p>Grade manual ou quantidade automática.</p>
            </div>
          </li>
          <li>
            <span>02</span>
            <div>
              <strong>Confirmar dados</strong>
              <p>Nome e contato para identificar o pedido.</p>
            </div>
          </li>
          <li>
            <span>03</span>
            <div>
              <strong>Pagar e aguardar</strong>
              <p>PIX ou cartão. Liberação após validação.</p>
            </div>
          </li>
        </ol>
      </section>

      <section className="container home-block" id="regulamento">
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

      <section className="container home-signoff">
        <p>{settings.texto_casal}</p>
        <p className="home-signoff-name">{settings.assinatura_casal}</p>
      </section>
    </main>
  )
}
