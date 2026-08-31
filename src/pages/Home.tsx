import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import {
  ArrowRight,
  CalendarDays,
  Check,
  CreditCard,
  FileText,
  Gift,
  LayoutGrid,
  Tag,
  UserRoundSearch,
  Users,
} from 'lucide-react'
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

function FloralMotif({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 180 180" fill="none" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="86" cy="62" r="20" />
        <circle cx="86" cy="62" r="9" />
        <path d="M78 54c-8-10-6-22 2-28" />
        <path d="M94 52c10-9 22-8 28 2" />
        <path d="M86 82c-2 22-12 40-12 56" />
        <ellipse cx="62" cy="112" rx="18" ry="9" transform="rotate(-28 62 112)" />
        <ellipse cx="108" cy="118" rx="18" ry="9" transform="rotate(32 108 118)" />
        <path d="M74 128c-22-2-36 12-44 28" />
        <path d="M90 136c18 2 34 16 42 32" />
        <circle cx="42" cy="48" r="11" />
        <circle cx="42" cy="48" r="4.5" />
        <circle cx="132" cy="40" r="13" />
        <circle cx="132" cy="40" r="5.5" />
        <path d="M132 54c2 14-4 26-14 34" />
      </g>
    </svg>
  )
}

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
  const heroImage = settings.hero_imagem_url || COUPLE_IMAGE
  const drawDate = settings.data_sorteio ? formatDate(settings.data_sorteio) : '—'

  return (
    <main className={`home-simple${ready ? ' is-ready' : ''}`}>
      <DemoBanner pagamentoHabilitado={settings.pagamento_habilitado} />

      <section className="home-hero">
        <div className="container">
          <div className="home-hero-card">
            <FloralMotif className="home-hero-floral home-hero-floral-bl" />
            <FloralMotif className="home-hero-floral home-hero-floral-tr" />

            <div className="home-hero-copy">
              <p className="home-kicker home-anim" style={{ '--d': '0ms' } as CSSProperties}>
                <span className="home-kicker-dot" aria-hidden="true" />
                Rifa online · {settings.subtitulo_site}
              </p>
              <h1 className="home-anim" style={{ '--d': '90ms' } as CSSProperties}>
                {settings.titulo_site}
              </h1>
              <p className="home-lead home-anim" style={{ '--d': '180ms' } as CSSProperties}>
                {settings.texto_hero.trim() || defaultSiteSettings.texto_hero}
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
              <img src={heroImage} alt={`${settings.subtitulo_site} — foto do casal`} />
            </figure>
          </div>
        </div>
      </section>

      <section className="container home-facts home-anim" style={{ '--d': '360ms' } as CSSProperties} aria-label="Dados da rifa">
        <article className="home-fact-card">
          <span className="home-fact-icon" aria-hidden="true">
            <CalendarDays size={20} />
          </span>
          <div>
            <span className="home-fact-label">Sorteio</span>
            <strong>{drawDate}</strong>
            <span className="home-fact-hint">{settings.data_sorteio ? 'Data do sorteio' : 'Data a definir'}</span>
          </div>
        </article>
        <article className="home-fact-card">
          <span className="home-fact-icon" aria-hidden="true">
            <Tag size={20} />
          </span>
          <div>
            <span className="home-fact-label">Valor unitário</span>
            <strong>{formatCurrency(settings.valor_numero)}</strong>
            <span className="home-fact-hint">por número</span>
          </div>
        </article>
        <article className="home-fact-card">
          <span className="home-fact-icon" aria-hidden="true">
            <Users size={20} />
          </span>
          <div>
            <span className="home-fact-label">Disponíveis</span>
            <strong>{loading ? '—' : stats.disponivel}</strong>
            <span className="home-fact-hint">números</span>
          </div>
        </article>
      </section>

      <section className="container home-block home-prizes home-anim" style={{ '--d': '420ms' } as CSSProperties} id="premios">
        <div className="home-prizes-copy">
          <p className="home-section-id">01 / prêmios</p>
          <h2>O que você concorre</h2>
          <p>Três prêmios em dinheiro. Escolha seus números e participe.</p>
          <span className="home-prizes-gift" aria-hidden="true">
            <Gift size={22} />
          </span>
        </div>
        <PrizeShowcase settings={settings} />
      </section>

      <section className="container home-block home-anim" style={{ '--d': '520ms' } as CSSProperties} id="como-funciona">
        <header className="home-block-head is-center">
          <p className="home-section-id">02 / como funciona</p>
          <h2>Passo a passo</h2>
        </header>
        <ol className="home-steps">
          <li className="home-anim" style={{ '--d': '560ms' } as CSSProperties}>
            <span className="home-step-icon" aria-hidden="true">
              <LayoutGrid size={20} />
            </span>
            <span className="home-step-num">01</span>
            <div>
              <strong>Selecionar números</strong>
              <p>Grade manual ou quantidade automática.</p>
            </div>
          </li>
          <li className="home-anim" style={{ '--d': '640ms' } as CSSProperties}>
            <span className="home-step-icon" aria-hidden="true">
              <UserRoundSearch size={20} />
            </span>
            <span className="home-step-num">02</span>
            <div>
              <strong>Confirmar dados</strong>
              <p>Nome e contato para identificar o pedido.</p>
            </div>
          </li>
          <li className="home-anim" style={{ '--d': '720ms' } as CSSProperties}>
            <span className="home-step-icon" aria-hidden="true">
              <CreditCard size={20} />
            </span>
            <span className="home-step-num">03</span>
            <div>
              <strong>Pagar e aguardar</strong>
              <p>PIX ou cartão. Liberação após validação.</p>
            </div>
          </li>
          <li className="home-anim" style={{ '--d': '800ms' } as CSSProperties}>
            <span className="home-step-icon" aria-hidden="true">
              <Check size={20} />
            </span>
            <span className="home-step-num">04</span>
            <div>
              <strong>Pronto!</strong>
              <p>Seu número entra na rifa. Agora é só torcer.</p>
            </div>
          </li>
        </ol>
      </section>

      <section className="container home-block home-anim" style={{ '--d': '860ms' } as CSSProperties} id="regulamento">
        <details className="home-rules">
          <summary>
            <div>
              <p className="home-section-id">03 / regras</p>
              <h2>Regulamento</h2>
              <p>Consulte as regras completas antes de participar.</p>
            </div>
            <span className="home-rules-btn">
              <FileText size={16} aria-hidden="true" />
              Ver regulamento
            </span>
          </summary>
          <ul>
            {regulamentoLines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </details>
      </section>
    </main>
  )
}
