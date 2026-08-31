import { defaultSiteSettings, type SiteSettings, type SiteSettingsFormValues } from '../types/settings'
import { isSupabaseConfigured, supabase } from './supabase'

const STORAGE_KEY = 'rifa_site_settings'

function toSettings(values: SiteSettingsFormValues): SiteSettings {
  return {
    id: 1,
    titulo_site: values.titulo_site.trim(),
    subtitulo_site: values.subtitulo_site.trim(),
    texto_hero: values.texto_hero.trim(),
    texto_casal: values.texto_casal.trim(),
    assinatura_casal: values.assinatura_casal.trim(),
    premio_nome: values.premio_nome.trim(),
    premio_descricao: values.premio_descricao.trim(),
    premio_imagem_url: values.premio_imagem_url.trim() || null,
    premio_2_nome: values.premio_2_nome.trim(),
    premio_2_descricao: values.premio_2_descricao.trim(),
    premio_2_imagem_url: values.premio_2_imagem_url.trim() || null,
    premio_3_nome: values.premio_3_nome.trim(),
    premio_3_descricao: values.premio_3_descricao.trim(),
    premio_3_imagem_url: values.premio_3_imagem_url.trim() || null,
    regulamento: values.regulamento.trim(),
    data_sorteio: values.data_sorteio || null,
    total_numeros: values.total_numeros,
    valor_numero: values.valor_numero,
    reserva_minutos: values.reserva_minutos,
    hero_imagem_url: values.hero_imagem_url.trim() || null,
    pagamento_habilitado: values.pagamento_habilitado,
    pix_chave: values.pix_chave.trim() || null,
    pix_titular: values.pix_titular.trim() || null,
    pix_mensagem: values.pix_mensagem.trim() || null,
    updated_at: new Date().toISOString(),
  }
}

function readLocalSettings(): SiteSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultSiteSettings
    return { ...defaultSiteSettings, ...JSON.parse(raw) }
  } catch {
    return defaultSiteSettings
  }
}

function writeLocalSettings(values: SiteSettingsFormValues): SiteSettings {
  const next = toSettings(values)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  return next
}

export function settingsToFormValues(settings: SiteSettings): SiteSettingsFormValues {
  return {
    titulo_site: settings.titulo_site,
    subtitulo_site: settings.subtitulo_site,
    texto_hero: settings.texto_hero,
    texto_casal: settings.texto_casal,
    assinatura_casal: settings.assinatura_casal,
    premio_nome: settings.premio_nome,
    premio_descricao: settings.premio_descricao,
    premio_imagem_url: settings.premio_imagem_url || '',
    premio_2_nome: settings.premio_2_nome,
    premio_2_descricao: settings.premio_2_descricao,
    premio_2_imagem_url: settings.premio_2_imagem_url || '',
    premio_3_nome: settings.premio_3_nome,
    premio_3_descricao: settings.premio_3_descricao,
    premio_3_imagem_url: settings.premio_3_imagem_url || '',
    regulamento: settings.regulamento,
    data_sorteio: settings.data_sorteio || '',
    total_numeros: settings.total_numeros,
    valor_numero: settings.valor_numero,
    reserva_minutos: settings.reserva_minutos,
    hero_imagem_url: settings.hero_imagem_url || '',
    pagamento_habilitado: settings.pagamento_habilitado,
    pix_chave: settings.pix_chave || '',
    pix_titular: settings.pix_titular || '',
    pix_mensagem: settings.pix_mensagem || '',
  }
}

export async function fetchSiteSettings(): Promise<SiteSettings> {
  if (!isSupabaseConfigured) return readLocalSettings()

  const { data, error } = await supabase.from('site_settings').select('*').eq('id', 1).maybeSingle()
  if (error) throw new Error(error.message)
  return data ? { ...defaultSiteSettings, ...data } : defaultSiteSettings
}

export async function saveSiteSettings(values: SiteSettingsFormValues): Promise<SiteSettings> {
  const payload = toSettings(values)

  if (!isSupabaseConfigured) return writeLocalSettings(values)

  const { data, error } = await supabase
    .from('site_settings')
    .upsert(payload, { onConflict: 'id' })
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return data
}
