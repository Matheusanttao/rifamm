import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  CalendarHeart,
  Hash,
  Heart,
  Sparkles,
  Ticket,
  UtensilsCrossed,
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
    <main className="home-page">
      <DemoBanner pagamentoHabilitado={settings.pagamento_habilitado} />

      {/* Hero — Chá de Panela */}
      <section className="cha-hero">
        <div className="cha-hero-bg" aria-hidden="true" />
        <div className="container cha-hero-inner">
          <div className="cha-hero-content">
            <p className="cha-hero-tag">
              <UtensilsCrossed size={15} />
              Chá de Panela
            </p>
            <p className="cha-hero-script">{settings.subtitulo_site}</p>
            <h1 className="cha-hero-title">
              {settings.titulo_site}
              <span className="heart"> ♡</span>
            </h1>
            <div className="divider left" />
            <p className="cha-hero-text">{settings.texto_hero}</p>

            <div className="cha-hero-meta">
              <span>
                <CalendarHeart size={16} />
                Sorteio em <strong>{formatDate(settings.data_sorteio)}</strong>
              </span>
              <span>
                <Ticket size={16} />
                <strong>{formatCurrency(settings.valor_numero)}</strong> por número
              </span>
            </div>
          </div>

          <div className="cha-hero-visual">
            <div className="cha-hero-frame">
              <img
                src={settings.hero_imagem_url || defaultSiteSettings.hero_imagem_url!}
                alt="Chá de panela Matheus e Melissa"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="container stats-wrap">
        <div className="stats-grid">
          <article className="stat-card">
            <span className="stat-icon rose">
              <Hash size={24} />
            </span>
            <div>
              <div className="stat-value">{loading ? '—' : stats.disponivel}</div>
              <div className="stat-label">Números disponíveis</div>
            </div>
          </article>
          <article className="stat-card">
            <span className="stat-icon gold">
              <Sparkles size={24} />
            </span>
            <div>
              <div className="stat-value">{loading ? '—' : stats.total}</div>
              <div className="stat-label">Total da rifa</div>
            </div>
          </article>
          <article className="stat-card">
            <span className="stat-icon green">
              <Ticket size={24} />
            </span>
            <div>
              <div className="stat-value">{formatCurrency(settings.valor_numero)}</div>
              <div className="stat-label">Valor por número</div>
            </div>
          </article>
          <article className="stat-card">
            <span className="stat-icon heart">
              <Heart size={24} fill="currentColor" />
            </span>
            <div>
              <div className="stat-value cha-stat-date">{formatDate(settings.data_sorteio)}</div>
              <div className="stat-label">Data do sorteio</div>
            </div>
          </article>
        </div>
      </div>

      {/* Prêmios 1º, 2º e 3º */}
      <section className="container section" id="premios">
        <div className="cha-prizes-section">
          <div className="section-title">
            <p className="eyebrow">Premiação</p>
            <h2>Prêmios do sorteio</h2>
            <div className="divider" />
            <p className="section-subtitle">
              Três ganhadores levarão para casa presentes especiais para o nosso lar. Escolha seus
              números e boa sorte!
            </p>
          </div>

          <PrizeShowcase settings={settings} />

          <div className="cha-participate-cta">
            <div className="cha-participate-copy">
              <h3>Pronto para participar?</h3>
              <p>
                Escolha seus números na grade, confirme seus dados e finalize o pagamento. Cada
                número é uma chance de ganhar.
              </p>
            </div>
            <Link className="button primary large cha-cta-button" to="/participar">
              <Ticket size={20} />
              Participar da rifa
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Regulamento */}
      <section className="container section" id="regulamento">
        <div className="rules-section">
          <div className="section-title">
            <h2>Regulamento</h2>
            <div className="divider" />
          </div>
          <ul className="rules-list">
            {regulamentoLines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* Como funciona */}
      <section className="container section" id="como-funciona">
        <div className="how-section">
          <div className="section-title">
            <h2>Como participar</h2>
            <div className="divider" />
          </div>
          <div className="how-grid">
            <div className="how-step">
              <span className="how-icon">
                <Hash size={28} />
              </span>
              <span className="how-num">01</span>
              <h3>Escolha os números</h3>
              <p>Selecione na grade ou informe uma quantidade para sorteio automático.</p>
            </div>
            <div className="how-step">
              <span className="how-icon">
                <Ticket size={28} />
              </span>
              <span className="how-num">02</span>
              <h3>Confirme seus dados</h3>
              <p>Informe nome e contato para identificar sua participação.</p>
            </div>
            <div className="how-step">
              <span className="how-icon">
                <Heart size={28} fill="currentColor" />
              </span>
              <span className="how-num">03</span>
              <h3>Pague e aguarde</h3>
              <p>Escolha PIX ou cartão. A confirmação ocorre após validação do pagamento.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Casal */}
      <section className="container section">
        <div className="couple-banner">
          <div className="couple-left">
            <img className="couple-photo" src={COUPLE_IMAGE} alt="Matheus e Melissa" />
            <div>
              <h2>{settings.subtitulo_site}</h2>
              <p>{settings.texto_casal}</p>
              <p className="couple-signature">{settings.assinatura_casal}</p>
            </div>
          </div>
          <div className="couple-right">
            <span className="heart-circle">
              <Heart size={22} fill="currentColor" />
            </span>
            <p>
              Cada número é um gesto de carinho que nos aproxima desse momento especial. Obrigado
              por fazer parte do nosso chá de panela!
            </p>
            <Link className="button ghost" to="/participar">
              Quero participar <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
