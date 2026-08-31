import { useEffect, useState } from 'react'
import { RaffleSettingsForm } from '../components/RaffleSettingsForm'
import { fetchSiteSettings, saveSiteSettings } from '../lib/settings'
import type { SiteSettings } from '../types/settings'
import { defaultSiteSettings } from '../types/settings'

export function AdminSettings() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSiteSettings)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchSiteSettings()
      .then(setSettings)
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="loading-message">Carregando configurações...</p>
  if (error) return <p className="form-error">{error}</p>

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <div>
          <p className="eyebrow">Configurações</p>
          <h1>Prêmio, textos e pagamentos</h1>
        </div>
      </header>
      <RaffleSettingsForm
        settings={settings}
        onSubmit={async (values) => {
          const saved = await saveSiteSettings(values)
          setSettings(saved)
        }}
      />
    </div>
  )
}
