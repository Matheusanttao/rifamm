import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Heart } from 'lucide-react'
import { fetchRaffleNumbers, syncNumbersWithSettings } from './numbers'
import { fetchSiteSettings } from './settings'
import type { RaffleNumber } from '../types/raffle'
import type { SiteSettings } from '../types/settings'
import { defaultSiteSettings } from '../types/settings'

type SiteContextValue = {
  settings: SiteSettings
  numbers: RaffleNumber[]
  ready: boolean
  refreshNumbers: () => Promise<void>
}

const SiteContext = createContext<SiteContextValue>({
  settings: defaultSiteSettings,
  numbers: [],
  ready: false,
  refreshNumbers: async () => undefined,
})

function preloadImage(src: string) {
  return new Promise<void>((resolve) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = () => resolve()
    img.src = src
  })
}

function resolveHeroUrl(settings: SiteSettings) {
  if (
    settings.hero_imagem_url &&
    !/matheus-melissa\.(png|jpg|jpeg|webp)$/i.test(settings.hero_imagem_url)
  ) {
    return settings.hero_imagem_url
  }
  return '/matheus-melissa.jpg'
}

export function SiteProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(defaultSiteSettings)
  const [numbers, setNumbers] = useState<RaffleNumber[]>([])
  const [ready, setReady] = useState(false)

  const refreshNumbers = useCallback(async (nextSettings?: SiteSettings) => {
    const current = nextSettings || settings
    await syncNumbersWithSettings(current)
    const raffleNumbers = await fetchRaffleNumbers(current)
    setNumbers(raffleNumbers)
  }, [settings])

  useEffect(() => {
    let cancelled = false

    async function boot() {
      try {
        const siteSettings = await fetchSiteSettings()
        if (cancelled) return
        setSettings(siteSettings)

        await Promise.all([
          preloadImage(resolveHeroUrl(siteSettings)),
          (async () => {
            await syncNumbersWithSettings(siteSettings)
            const raffleNumbers = await fetchRaffleNumbers(siteSettings)
            if (!cancelled) setNumbers(raffleNumbers)
          })(),
        ])
      } catch (err) {
        console.warn('Falha ao iniciar o site:', err)
      } finally {
        if (!cancelled) setReady(true)
      }
    }

    void boot()

    const interval = window.setInterval(() => {
      void refreshNumbers()
    }, 30000)

    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [refreshNumbers])

  const value = useMemo(
    () => ({
      settings,
      numbers,
      ready,
      refreshNumbers: async () => {
        await refreshNumbers()
      },
    }),
    [settings, numbers, ready, refreshNumbers],
  )

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
