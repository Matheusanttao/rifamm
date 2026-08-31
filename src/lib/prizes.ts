import type { SiteSettings } from '../types/settings'
import { defaultSiteSettings } from '../types/settings'

export type PrizeItem = {
  place: number
  name: string
  description: string
  imageUrl: string
}

export function getPrizesFromSettings(settings: SiteSettings): PrizeItem[] {
  return [
    {
      place: 1,
      name: settings.premio_nome,
      description: settings.premio_descricao,
      imageUrl: settings.premio_imagem_url || defaultSiteSettings.premio_imagem_url!,
    },
    {
      place: 2,
      name: settings.premio_2_nome,
      description: settings.premio_2_descricao,
      imageUrl: settings.premio_2_imagem_url || defaultSiteSettings.premio_2_imagem_url!,
    },
    {
      place: 3,
      name: settings.premio_3_nome,
      description: settings.premio_3_descricao,
      imageUrl: settings.premio_3_imagem_url || defaultSiteSettings.premio_3_imagem_url!,
    },
  ]
}
