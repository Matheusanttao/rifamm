import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, CalendarHeart, Hash, Ticket } from 'lucide-react'
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
            <p className="home-brand">{settings.subtitulo_site}</p>
            <h1>{settings.titulo_site}</h1>
            <p className="home-lead">{settings.texto_hero}</p>
            <Link className="button primary large home-cta" to="/participar">
              Participar da rifa
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>

          <figure className="home-hero-photo">
            <img
              src={COUPLE_IMAGE}
              alt={`${settings.subtitulo_site} — foto do casal`}
            />
          </figure>
        </div>
      </section>

      <section className="home-facts-bar" aria-label="Informações da rifa">
        <div className="container home-facts">
          <p>
            <CalendarHeart size={16} aria-hidden="true" />
            Sorteio <strong>{formatDate(settings.data_sorteio)}</strong>
          </p>
          <p>
            <Ticket size={16} aria-hidden="true" />
            <strong>{formatCurrency(settings.valor_numero)}</strong> por número
          </p>
          <p>
            <Hash size={16} aria-hidden="true" />
            <strong>{loading ? '—' : stats.disponivel}</strong> disponíveis
          </p>
        </div>
      </section>

      <section className="container home-block" id="premios">
        <header className="home-block-head">
          <h2>Prêmios</h2>
          <p>Escolha seus números e concorra a três presentes para o nosso lar.</p>
        </header>
        <PrizeShowcase settings={settings} />
      </section>

      <section className="container home-block" id="como-funciona">
        <header className="home-block-head">
          <h2>Como funciona</h2>
        </header>
        <ol className="home-steps">
          <li>
            <span>1</span>
            <div>
              <strong>Escolha os números</strong>
              <p>Na grade ou por quantidade automática.</p>
            </div>
          </li>
          <li>
            <span>2</span>
            <div>
              <strong>Confirme seus dados</strong>
              <p>Nome e contato para identificar sua participação.</p>
            </div>
          </li>
          <li>
            <span>3</span>
            <div>
              <strong>Pague e aguarde</strong>
              <p>PIX ou cartão. Confirmação após validação.</p>
            </div>
          </li>
        </ol>
      </section>

      <section className="container home-block" id="regulamento">
        <details className="home-rules">
          <summary>Regulamento</summary>
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
