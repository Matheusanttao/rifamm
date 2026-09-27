import { Shield } from 'lucide-react'

export function DemoBanner() {
  return (
    <div className="demo-banner" role="status">
      <Shield size={18} />
      <div>
        <strong>Este site é somente de demonstração e sem fins lucrativos</strong>
        <p>
          Não há cobrança real, venda nem arrecadação. Nomes, imagens e dados são fictícios e
          existem apenas para mostrar o funcionamento do sistema.
        </p>
      </div>
    </div>
  )
}
