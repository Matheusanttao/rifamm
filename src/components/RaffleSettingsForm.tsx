import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Eye, Save } from 'lucide-react'
import type { SiteSettings, SiteSettingsFormValues } from '../types/settings'
import { defaultSiteSettings } from '../types/settings'
import { settingsToFormValues } from '../lib/settings'
import { formatCurrency, formatDate } from '../lib/format'
import { getPrizesFromSettings } from '../lib/prizes'

type RaffleSettingsFormProps = {
  settings: SiteSettings
  onSubmit: (values: SiteSettingsFormValues) => Promise<void>
}

export function RaffleSettingsForm({ settings, onSubmit }: RaffleSettingsFormProps) {
  const initial = useMemo(() => settingsToFormValues(settings), [settings])
  const [values, setValues] = useState<SiteSettingsFormValues>(initial)
  const [preview, setPreview] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  function setField<Key extends keyof SiteSettingsFormValues>(
    field: Key,
    value: SiteSettingsFormValues[Key],
  ) {
    setValues((current) => ({ ...current, [field]: value }))
    setSuccess('')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      await onSubmit(values)
      setSuccess('Configurações salvas com sucesso.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="settings-layout">
      <form className="product-form" onSubmit={handleSubmit}>
        <div className="settings-toolbar">
          <p className="muted">
            Configure textos, prêmios, regulamento e parâmetros da rifa. Use links de imagem (URL)
            para as fotos. Use a prévia antes de salvar.
          </p>
          <button type="button" className="button ghost" onClick={() => setPreview((v) => !v)}>
            <Eye size={16} /> {preview ? 'Ocultar prévia' : 'Prévia visual'}
          </button>
        </div>

        <fieldset>
          <legend>Identidade do site</legend>
          <label>
            Título
            <input value={values.titulo_site} onChange={(e) => setField('titulo_site', e.target.value)} />
          </label>
          <label>
            Subtítulo
            <input
              value={values.subtitulo_site}
              onChange={(e) => setField('subtitulo_site', e.target.value)}
            />
          </label>
          <label>
            Texto principal
            <textarea
              rows={4}
              value={values.texto_hero}
              onChange={(e) => setField('texto_hero', e.target.value)}
            />
          </label>
          <label>
            URL da imagem do hero
            <input
              value={values.hero_imagem_url}
              onChange={(e) => setField('hero_imagem_url', e.target.value)}
              placeholder="https://..."
            />
          </label>
        </fieldset>

        <fieldset>
          <legend>Prêmios do sorteio</legend>
          <p className="muted">Configure os prêmios do 1º, 2º e 3º lugar exibidos na página inicial.</p>

          <h4 className="fieldset-subtitle">1º lugar</h4>
          <label>
            Nome do prêmio
            <input value={values.premio_nome} onChange={(e) => setField('premio_nome', e.target.value)} />
          </label>
          <label>
            Descrição
            <textarea
              rows={2}
              value={values.premio_descricao}
              onChange={(e) => setField('premio_descricao', e.target.value)}
            />
          </label>
          <label>
            URL da imagem
            <input
              value={values.premio_imagem_url}
              onChange={(e) => setField('premio_imagem_url', e.target.value)}
              placeholder="https://..."
            />
          </label>

          <h4 className="fieldset-subtitle">2º lugar</h4>
          <label>
            Nome do prêmio
            <input
              value={values.premio_2_nome}
              onChange={(e) => setField('premio_2_nome', e.target.value)}
            />
          </label>
          <label>
            Descrição
            <textarea
              rows={2}
              value={values.premio_2_descricao}
              onChange={(e) => setField('premio_2_descricao', e.target.value)}
            />
          </label>
          <label>
            URL da imagem
            <input
              value={values.premio_2_imagem_url}
              onChange={(e) => setField('premio_2_imagem_url', e.target.value)}
              placeholder="https://..."
            />
          </label>

          <h4 className="fieldset-subtitle">3º lugar</h4>
          <label>
            Nome do prêmio
            <input
              value={values.premio_3_nome}
              onChange={(e) => setField('premio_3_nome', e.target.value)}
            />
          </label>
          <label>
            Descrição
            <textarea
              rows={2}
              value={values.premio_3_descricao}
              onChange={(e) => setField('premio_3_descricao', e.target.value)}
            />
          </label>
          <label>
            URL da imagem
            <input
              value={values.premio_3_imagem_url}
              onChange={(e) => setField('premio_3_imagem_url', e.target.value)}
              placeholder="https://..."
            />
          </label>

          <label>
            Data do sorteio
            <input
              type="date"
              value={values.data_sorteio}
              onChange={(e) => setField('data_sorteio', e.target.value)}
            />
          </label>
          <label>
            Regulamento
            <textarea
              rows={6}
              value={values.regulamento}
              onChange={(e) => setField('regulamento', e.target.value)}
            />
          </label>
        </fieldset>

        <fieldset>
          <legend>Números</legend>
          <div className="form-grid-2">
            <label>
              Total de números
              <input
                type="number"
                min={10}
                max={10000}
                value={values.total_numeros}
                onChange={(e) => setField('total_numeros', Number(e.target.value))}
              />
            </label>
            <label>
              Valor por número (R$)
              <input
                type="number"
                min={1}
                step="0.01"
                value={values.valor_numero}
                onChange={(e) => setField('valor_numero', Number(e.target.value))}
              />
            </label>
          </div>
        </fieldset>

        <fieldset>
          <legend>Textos do casal</legend>
          <label>
            Mensagem do casal
            <textarea
              rows={3}
              value={values.texto_casal}
              onChange={(e) => setField('texto_casal', e.target.value)}
            />
          </label>
          <label>
            Assinatura
            <input
              value={values.assinatura_casal}
              onChange={(e) => setField('assinatura_casal', e.target.value)}
            />
          </label>
        </fieldset>

        <fieldset>
          <legend>Pagamentos</legend>
          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={values.pagamento_habilitado}
              onChange={(e) => setField('pagamento_habilitado', e.target.checked)}
            />
            Habilitar cobranças reais (requer validação jurídica e provedor aprovado)
          </label>
          {!values.pagamento_habilitado ? (
            <p className="admin-warning">
              Enquanto desabilitado, o site permanece em modo demonstrativo sem PIX de recebimento.
            </p>
          ) : null}
          <label>
            Chave PIX (somente com pagamentos habilitados)
            <input
              value={values.pix_chave}
              onChange={(e) => setField('pix_chave', e.target.value)}
              disabled={!values.pagamento_habilitado}
            />
          </label>
          <label>
            Titular PIX
            <input
              value={values.pix_titular}
              onChange={(e) => setField('pix_titular', e.target.value)}
              disabled={!values.pagamento_habilitado}
            />
          </label>
          <label>
            Mensagem PIX
            <textarea
              rows={2}
              value={values.pix_mensagem}
              onChange={(e) => setField('pix_mensagem', e.target.value)}
              disabled={!values.pagamento_habilitado}
            />
          </label>
        </fieldset>

        {error ? <p className="form-error">{error}</p> : null}
        {success ? <p className="form-success">{success}</p> : null}

        <button className="button primary large" type="submit" disabled={loading}>
          <Save size={18} />
          {loading ? 'Salvando...' : 'Salvar configurações'}
        </button>
      </form>

      {preview ? (
        <aside className="settings-preview">
          <p className="eyebrow">Prévia</p>
          <h2>{values.titulo_site}</h2>
          <p className="brand-sub preview-sub">{values.subtitulo_site}</p>
          {values.hero_imagem_url ? (
            <img className="preview-hero" src={values.hero_imagem_url} alt="Prévia do hero" />
          ) : null}
          <p>{values.texto_hero}</p>
          <div className="preview-prize">
            {getPrizesFromSettings({
              ...defaultSiteSettings,
              ...values,
              premio_imagem_url: values.premio_imagem_url || null,
              premio_2_imagem_url: values.premio_2_imagem_url || null,
              premio_3_imagem_url: values.premio_3_imagem_url || null,
            } as SiteSettings).map((prize) => (
              <div key={prize.place} className="preview-prize-item">
                <img src={prize.imageUrl} alt={prize.name} />
                <div>
                  <strong>
                    {prize.place}º lugar — {prize.name}
                  </strong>
                  <p>{prize.description}</p>
                </div>
              </div>
            ))}
            <p>
              <strong>{formatCurrency(values.valor_numero)}</strong> por número · Sorteio em{' '}
              {formatDate(values.data_sorteio || null)}
            </p>
          </div>
        </aside>
      ) : null}
    </div>
  )
}
