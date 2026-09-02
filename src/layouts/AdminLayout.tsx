import { useEffect, useState } from 'react'
import { LayoutDashboard, LogOut, Settings, ShoppingBag, Ticket } from 'lucide-react'
import { Link, NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

export function AdminLayout() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }
    

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession))

    return () => subscription.unsubscribe()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/admin/login')
  }

  if (loading) return <p className="loading-message">Verificando acesso...</p>
  if (!session && isSupabaseConfigured) return <Navigate to="/admin/login" replace />

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="admin-brand" to="/admin">
          <span>
            <Ticket size={22} />
          </span>
          <strong>Rifa M&amp;M</strong>
        </Link>

        {!isSupabaseConfigured ? (
          <p className="admin-warning">Modo local: acesse o painel diretamente. Dados salvos no navegador.</p>
        ) : null}

        <nav>
          <NavLink to="/admin" end>
            <LayoutDashboard size={18} /> Dashboard
          </NavLink>
          <NavLink to="/admin/pedidos">
            <ShoppingBag size={18} /> Pedidos
          </NavLink>
          <NavLink to="/admin/configuracoes">
            <Settings size={18} /> Configurações
          </NavLink>
        </nav>

        <button className="button ghost" type="button" onClick={handleLogout}>
          <LogOut size={17} />
          Sair
        </button>
      </aside>

      <section className="admin-content">
        <Outlet />
      </section>
    </div>
  )
}
