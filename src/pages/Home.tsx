import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import {
  ArrowRight,
  CalendarDays,
  Check,
  CreditCard,
  FileText,
  Gift,
  LayoutGrid,
  Search,
  Tag,
  UserRoundSearch,
  Users,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { PrizeShowcase } from '../components/PrizeShowcase'
import { getNumberStats } from '../lib/numbers'
import { useSite } from '../lib/site-context'
import { formatCurrency, formatDate } from '../lib/format'
import { defaultSiteSettings } from '../types/settings'

const COUPLE_IMAGE = '/matheus-melissa.jpg'

export function Home() {
  const { settings, numbers } = useSite()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => setReady(true))
    })
    return () => cancelAnimationFrame(frame)
  }, [])

  const stats = useMemo(() => getNumberStats(numbers), [numbers])
  const regulamentoLines = settings.regulamento.split('\n').filter(Boolean)
  const heroImage =
    settings.hero_imagem_url && !/matheus-melissa\.(png|jpg|jpeg|webp)$/i.test(settings.hero_imagem_url)
      ? settings.hero_imagem_url
      : COUPLE_IMAGE
  const drawDate = settings.data_sorteio ? formatDate(settings.data_sorteio) : '—'

  return (
    <main className={`home-simple${ready ? ' is-ready' : ''}`}>
      <section className="home-hero">
        <figure className="home-hero-media home-anim home-anim-photo" style={{ '--d': '0ms' } as CSSProperties}>
          <img src={heroImage} alt={`${settings.subtitulo_site} — foto do casal`} />
        </figure>
        <div className="home-hero-scrim" aria-hidden="true" />

        <div className="container home-hero-content">
          <p className="home-hero-brand home-anim" style={{ '--d': '80ms' } as CSSProperties}>
            {settings.subtitulo_site}
          </p>
          <h1 className="home-anim" style={{ '--d': '160ms' } as CSSProperties}>
            {settings.titulo_site}
          </h1>
          <p className="home-lead home-anim" style={{ '--d': '240ms' } as CSSProperties}>
            {(settings.texto_hero.trim() || defaultSiteSettings.texto_hero).split(/(?<=[.!?])\s+/)[0]}
          </p>
          <Link
            className="home-cta home-anim"
            style={{ '--d': '320ms' } as CSSProperties}
            to="/participar"
          >
            Entrar na rifa
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
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
            <strong>{stats.disponivel}</strong>
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

      <section className="container home-block home-anim" style={{ '--d': '920ms' } as CSSProperties} id="buscar">
        <div className="home-lookup">
          <div>
            <p className="home-section-id">04 / consulta</p>
            <h2>Já participou?</h2>
            <p>Digite seu CPF para ver os números que você comprou e acessar o comprovante do pedido.</p>
          </div>
          <Link className="button primary" to="/meus-numeros">
            <Search size={16} aria-hidden="true" />
            Consultar por CPF
          </Link>
        </div>
      </section>
    </main>
  )
}
