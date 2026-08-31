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
        <strong>Modo demonstrativo</strong>
        <p>
          Esta rifa está em versão de demonstração. Nenhum pagamento real será processado e nenhuma
          chave PIX de recebimento é exibida até validação jurídica e aprovação do provedor.
        </p>
      </div>
    </div>
  )
}
