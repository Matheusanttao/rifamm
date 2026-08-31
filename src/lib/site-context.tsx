import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Heart } from 'lucide-react'
import { fetchSiteSettings } from './settings'
import type { SiteSettings } from '../types/settings'
import { defaultSiteSettings } from '../types/settings'

type SiteContextValue = {
  settings: SiteSettings
  ready: boolean
}

const SiteContext = createContext<SiteContextValue>({
  settings: defaultSiteSettings,
  ready: false,
})

function preloadImage(src: string) {
  return new Promise<void>((resolve) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = () => resolve()
    img.src = src
  })
}

export function SiteProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(defaultSiteSettings)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function boot() {
      try {
        const siteSettings = await fetchSiteSettings()
        if (cancelled) return
        setSettings(siteSettings)

        const hero =
          siteSettings.hero_imagem_url &&
          !/matheus-melissa\.(png|jpg|jpeg|webp)$/i.test(siteSettings.hero_imagem_url)
            ? siteSettings.hero_imagem_url
            : '/matheus-melissa.jpg'

        await preloadImage(hero)
      } catch {
        // Mantém defaults se falhar; ainda libera o site.
      } finally {
        if (!cancelled) setReady(true)
      }
    }

    void boot()
    return () => {
      cancelled = true
    }
  }, [])

  const value = useMemo(() => ({ settings, ready }), [settings, ready])

  if (!ready) {
    return (
      <div className="site-boot" role="status" aria-live="polite" aria-busy="true">
        <div className="site-boot-card">
          <span className="site-boot-mark" aria-hidden="true">
            <Heart size={22} fill="currentColor" />
          </span>
          <div className="site-boot-spinner" aria-hidden="true" />
          <p className="site-boot-brand">Matheus &amp; Melissa</p>
          <p className="site-boot-text">Carregando a rifa...</p>
        </div>
      </div>
    )
  }

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>
}

export function useSite() {
  return useContext(SiteContext)
}
