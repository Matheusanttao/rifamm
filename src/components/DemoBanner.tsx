import { Shield } from 'lucide-react'

type DemoBannerProps = {
  pagamentoHabilitado: boolean
}

export function DemoBanner({ pagamentoHabilitado }: DemoBannerProps) {
  if (pagamentoHabilitado) return null

  return (
    <div className="demo-banner" role="status">
      <Shield size={18} />
      <div>
        <strong>Versão de demonstração — sem fins lucrativos</strong>
        <p>
          Nomes, imagens e dados desta rifa são fictícios e servem apenas para demonstração do
          sistema. Nenhum pagamento real será processado e nenhuma chave PIX de recebimento é
          exibida.
        </p>
      </div>
    </div>
  )
}
