export type SiteSettings = {
  id: number
  titulo_site: string
  subtitulo_site: string
  texto_hero: string
  texto_casal: string
  assinatura_casal: string
  premio_nome: string
  premio_descricao: string
  premio_imagem_url: string | null
  premio_2_nome: string
  premio_2_descricao: string
  premio_2_imagem_url: string | null
  premio_3_nome: string
  premio_3_descricao: string
  premio_3_imagem_url: string | null
  regulamento: string
  data_sorteio: string | null
  total_numeros: number
  valor_numero: number
  reserva_minutos: number
  hero_imagem_url: string | null
  pagamento_habilitado: boolean
  pix_chave: string | null
  pix_titular: string | null
  pix_mensagem: string | null
  updated_at: string
}

export type SiteSettingsFormValues = {
  titulo_site: string
  subtitulo_site: string
  texto_hero: string
  texto_casal: string
  assinatura_casal: string
  premio_nome: string
  premio_descricao: string
  premio_imagem_url: string
  premio_2_nome: string
  premio_2_descricao: string
  premio_2_imagem_url: string
  premio_3_nome: string
  premio_3_descricao: string
  premio_3_imagem_url: string
  regulamento: string
  data_sorteio: string
  total_numeros: number
  valor_numero: number
  reserva_minutos: number
  hero_imagem_url: string
  pagamento_habilitado: boolean
  pix_chave: string
  pix_titular: string
  pix_mensagem: string
}

export const defaultSiteSettings: SiteSettings = {
  id: 1,
  titulo_site: 'Rifa do Chá de Casa Nova',
  subtitulo_site: 'Matheus & Melissa',
  texto_hero:
    'Com muito carinho, convidamos você a participar da nossa rifa especial do chá de casa nova. Cada número é uma chance de ganhar um prêmio encantador e de fazer parte desse momento tão especial para nós.',
  texto_casal:
    'Obrigado por fazer parte da nossa história e por celebrar conosco esse momento tão especial.',
  assinatura_casal: 'Com amor, Matheus & Melissa ♡',
  premio_nome: 'R$ 500,00',
  premio_descricao: 'Prêmio do 1º lugar',
  premio_imagem_url:
    'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=900&q=80',
  premio_2_nome: 'R$ 400,00',
  premio_2_descricao: 'Prêmio do 2º lugar',
  premio_2_imagem_url:
    'https://images.unsplash.com/photo-1585659722983-3a675dabf23d?auto=format&fit=crop&w=900&q=80',
  premio_3_nome: 'R$ 100,00',
  premio_3_descricao: 'Prêmio do 3º lugar',
  premio_3_imagem_url:
    'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=900&q=80',
  regulamento:
    '1. Cada número custa o valor informado no site.\n2. O sorteio será realizado na data indicada.\n3. O ganhador será contatado pelos dados informados no pedido.\n4. Números só são confirmados após a validação do pagamento.\n5. Ao iniciar o pedido, os números ficam reservados por 15 minutos. Sem pagamento nesse prazo, a reserva expira e os números voltam para a grade.',
  data_sorteio: '2026-09-15',
  total_numeros: 200,
  valor_numero: 15,
  reserva_minutos: 15,
  hero_imagem_url: '/matheus-melissa.jpg',
  pagamento_habilitado: false,
  pix_chave: null,
  pix_titular: null,
  pix_mensagem: null,
  updated_at: new Date().toISOString(),
}
