import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  CalendarHeart,
  Gift,
  Hash,
  Heart,
  Sparkles,
  Ticket,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { DemoBanner } from '../components/DemoBanner'
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
    <main>
      <DemoBanner pagamentoHabilitado={settings.pagamento_habilitado} />

      <section className="hero">
        <div className="container hero-inner">
          <div>
            <p className="eyebrow">{settings.subtitulo_site}</p>
            <h1 className="hero-title">
              {settings.titulo_site} <span className="heart">♡</span>
            </h1>
            <div className="divider left" />
            <p className="hero-text">{settings.texto_hero}</p>
            <div className="hero-actions">
              <Link className="button primary large" to="/participar">
                <Ticket size={18} /> Escolher meus números
              </Link>
              <a className="button ghost large" href="#premio">
                <Gift size={18} /> Ver prêmio
              </a>
            </div>
          </div>

          <div className="hero-media">
            <div className="hero-media-frame">
              <img
                src={settings.hero_imagem_url || defaultSiteSettings.hero_imagem_url!}
                alt="Chá de panela Matheus e Melissa"
              />
            </div>
          </div>
        </div>
      </section>

      <div className="container stats-wrap">
        <div className="stats-grid">
          <article className="stat-card">
            <span className="stat-icon rose">
              <Hash size={24} />
            </span>
            <div>
              <div className="stat-value">{loading ? '—' : stats.total}</div>
              <div className="stat-label">Números totais</div>
            </div>
          </article>
          <article className="stat-card">
            <span className="stat-icon green">
              <Sparkles size={24} />
            </span>
            <div>
              <div className="stat-value">{loading ? '—' : stats.disponivel}</div>
              <div className="stat-label">Disponíveis</div>
            </div>
          </article>
          <article className="stat-card">
            <span className="stat-icon gold">
              <CalendarHeart size={24} />
            </span>
            <div>
              <div className="stat-value">{formatCurrency(settings.valor_numero)}</div>
              <div className="stat-label">Por número</div>
            </div>
          </article>
          <article className="stat-card">
            <span className="stat-icon heart">
              <Heart size={24} fill="currentColor" />
            </span>
            <div>
              <div className="stat-value">{formatDate(settings.data_sorteio)}</div>
              <div className="stat-label">Data do sorteio</div>
            </div>
          </article>
        </div>
      </div>

      <section className="container section" id="premio">
        <div className="prize-section">
          <div className="section-title">
            <h2>Prêmio da rifa</h2>
            <div className="divider" />
          </div>
          <div className="prize-card">
            <div className="prize-image">
              <img
                src={settings.premio_imagem_url || defaultSiteSettings.premio_imagem_url!}
                alt={settings.premio_nome}
              />
            </div>
            <div>
              <h3>{settings.premio_nome}</h3>
              <p>{settings.premio_descricao}</p>
              <p className="prize-price">
                Participe por apenas <strong>{formatCurrency(settings.valor_numero)}</strong> por número
              </p>
              <Link className="button primary" to="/participar">
                Participar agora <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

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
              por fazer parte!
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
