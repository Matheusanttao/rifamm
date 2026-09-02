import { Heart, Search, Ticket } from 'lucide-react'
import { Link, NavLink, Outlet, Route, Routes, Navigate } from 'react-router-dom'
import { DemoBanner } from './components/DemoBanner'
import { AdminLayout } from './layouts/AdminLayout'
import { SiteProvider, useSite } from './lib/site-context'
import { AdminDashboard } from './pages/AdminDashboard'
import { AdminLogin } from './pages/AdminLogin'
import { AdminOrders } from './pages/AdminOrders'
import { AdminSettings } from './pages/AdminSettings'
import { Home } from './pages/Home'
import { MeusNumerosPage } from './pages/MeusNumerosPage'
import { OrderPage } from './pages/OrderPage'
import { ParticiparPage } from './pages/ParticiparPage'

function PublicLayout() {
  const { settings } = useSite()

  return (
    <div className="site-shell">
      <header className="site-header">
        <Link className="brand" to="/">
          <span className="brand-text">
            <span className="brand-name">
              Rifa do Chá de Casa Nova <Heart size={16} fill="currentColor" />
            </span>
            <span className="brand-sub">Matheus &amp; Melissa</span>
          </span>
        </Link>

        <nav className="site-nav">
          <NavLink to="/">Início</NavLink>
          <a href="/#premios">Prêmios</a>
          <NavLink to="/participar">Participar</NavLink>
          <NavLink to="/meus-numeros">Meus números</NavLink>
          <a href="/#regulamento">Regulamento</a>
        </nav>

        <div className="header-actions">
          <Link className="button ghost header-search" to="/meus-numeros" aria-label="Consultar por CPF">
            <Search size={18} aria-hidden="true" /> <span>Meus números</span>
          </Link>
          <Link className="button primary header-cta" to="/participar" aria-label="Escolher números">
            <Ticket size={18} aria-hidden="true" /> <span>Escolher números</span>
          </Link>
        </div>
      </header>

      <DemoBanner pagamentoHabilitado={settings.pagamento_habilitado} />

      <Outlet />

      <footer className="site-footer">
        <div className="site-footer-heart" aria-hidden="true">
          <Heart size={22} fill="currentColor" />
        </div>
        <p className="site-footer-thanks">Obrigado por apoiar nosso chá!</p>
        <p className="site-footer-names">Matheus &amp; Melissa</p>
        <p className="site-footer-copy">
          © 2026 Rifa do Chá de Casa Nova — Matheus &amp; Melissa. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route
        element={
          <SiteProvider>
            <PublicLayout />
          </SiteProvider>
        }
      >
        <Route path="/" element={<Home />} />
        <Route path="/participar" element={<ParticiparPage />} />
        <Route path="/meus-numeros" element={<MeusNumerosPage />} />
        <Route path="/buscar" element={<Navigate to="/meus-numeros" replace />} />
        <Route path="/pedido/:id" element={<OrderPage />} />
      </Route>
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="pedidos" element={<AdminOrders />} />
        <Route path="configuracoes" element={<AdminSettings />} />
      </Route>
    </Routes>
  )
}

export default App
