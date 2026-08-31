import { Heart, Ticket } from 'lucide-react'
import { Link, NavLink, Outlet, Route, Routes } from 'react-router-dom'
import { AdminLayout } from './layouts/AdminLayout'
import { AdminDashboard } from './pages/AdminDashboard'
import { AdminLogin } from './pages/AdminLogin'
import { AdminOrders } from './pages/AdminOrders'
import { AdminSettings } from './pages/AdminSettings'
import { Home } from './pages/Home'
import { OrderPage } from './pages/OrderPage'
import { ParticiparPage } from './pages/ParticiparPage'

function BrandMark() {
  return (
    <svg width="40" height="40" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <circle cx="24" cy="24" r="18" stroke="currentColor" strokeWidth="2" />
      <path
        d="M16 24h16M24 16v16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M24 30c-2.5-1.8-4-3.2-4-5a2.5 2.5 0 0 1 4-1.8A2.5 2.5 0 0 1 28 25c0 1.8-1.5 3.2-4 5Z"
        fill="currentColor"
        opacity="0.8"
      />
    </svg>
  )
}

function PublicLayout() {
  return (
    <div className="site-shell">
      <header className="site-header">
        <Link className="brand" to="/">
          <span className="brand-mark">
            <BrandMark />
          </span>
          <span className="brand-text">
            <span className="brand-name">
              Rifa do Chá <Heart size={16} fill="currentColor" />
            </span>
            <span className="brand-sub">Matheus &amp; Melissa</span>
          </span>
        </Link>

        <nav className="site-nav">
          <NavLink to="/">Início</NavLink>
          <a href="/#premios">Prêmios</a>
          <NavLink to="/participar">Participar</NavLink>
          <a href="/#regulamento">Regulamento</a>
        </nav>

        <Link className="button primary" to="/participar">
          <Ticket size={18} /> Escolher números
        </Link>
      </header>

      <Outlet />

      <footer className="site-footer">
        <p>
          © 2026 Rifa do Chá de Panela — Matheus &amp; Melissa. Todos os direitos reservados.{' '}
          <Heart size={15} fill="currentColor" />
        </p>
      </footer>
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/participar" element={<ParticiparPage />} />
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
