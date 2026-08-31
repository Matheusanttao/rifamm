import { useMemo, useState } from 'react'
import { Eraser, Hash, Search, Shuffle } from 'lucide-react'
import type { RaffleNumber } from '../types/raffle'
import { pickRandomAvailable } from '../lib/numbers'

type NumberGridProps = {
  numbers: RaffleNumber[]
  selected: number[]
  onChange: (next: number[]) => void
  valorNumero: number
  disabled?: boolean
}

type Filter = 'todos' | 'disponivel' | 'reservado' | 'vendido'

export function NumberGrid({ numbers, selected, onChange, valorNumero, disabled }: NumberGridProps) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('disponivel')
  const [autoQty, setAutoQty] = useState(5)

  const filtered = useMemo(() => {
    return numbers.filter((item) => {
      if (filter !== 'todos' && item.status !== filter) return false
      if (!search.trim()) return true
      return String(item.numero).includes(search.trim())
    })
  }, [numbers, filter, search])

  const total = selected.length * valorNumero

  function toggleNumber(numero: number) {
    if (disabled) return
    const item = numbers.find((n) => n.numero === numero)
    if (!item || item.status !== 'disponivel') return

    if (selected.includes(numero)) {
      onChange(selected.filter((n) => n !== numero))
    } else {
      onChange([...selected, numero].sort((a, b) => a - b))
    }
  }

  function handleAutoPick() {
    if (disabled) return
    try {
      const picked = pickRandomAvailable(numbers, autoQty)
      onChange(picked)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Não foi possível selecionar números.')
    }
  }

  function handleClear() {
    if (disabled || selected.length === 0) return
    onChange([])
  }

  return (
    <div className="number-grid-panel">
      <div className="number-grid-toolbar">
        <div className="number-grid-filters">
          {(['disponivel', 'reservado', 'vendido', 'todos'] as Filter[]).map((item) => (
            <button
              key={item}
              type="button"
              className={`filter-pill ${filter === item ? 'active' : ''}`}
              onClick={() => setFilter(item)}
            >
              {item === 'todos' ? 'Todos' : item.charAt(0).toUpperCase() + item.slice(1)}
            </button>
          ))}
        </div>

        <label className="search-field">
          <Search size={16} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar número..."
          />
        </label>
      </div>

      <div className="auto-pick-row">
        <label>
          Selecionar automaticamente
          <input
            type="number"
            min={1}
            max={numbers.filter((n) => n.status === 'disponivel').length}
            value={autoQty}
            onChange={(e) => setAutoQty(Math.max(1, Number(e.target.value) || 1))}
          />
        </label>
        <button type="button" className="button ghost" onClick={handleAutoPick} disabled={disabled}>
          <Shuffle size={16} /> Sortear números
        </button>
      </div>

      <div className="number-grid">
        {filtered.map((item) => {
          const isSelected = selected.includes(item.numero)
          return (
            <button
              key={item.numero}
              type="button"
              className={`number-cell status-${item.status} ${isSelected ? 'is-selected' : ''}`}
              onClick={() => toggleNumber(item.numero)}
              disabled={disabled || item.status !== 'disponivel'}
              title={`Número ${item.numero}`}
            >
              {String(item.numero).padStart(3, '0')}
            </button>
          )
        })}
      </div>

      <div className="number-summary-bar">
        <div>
          <Hash size={16} />
          <span>
            <strong>{selected.length}</strong> número(s) selecionado(s)
          </span>
        </div>
        <div className="number-summary-actions">
          <button
            type="button"
            className="button ghost number-clear-btn"
            onClick={handleClear}
            disabled={disabled || selected.length === 0}
          >
            <Eraser size={16} /> Limpar
          </button>
          <div className="number-summary-total">
            Total:{' '}
            <strong>{total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
          </div>
        </div>
      </div>
    </div>
  )
}
