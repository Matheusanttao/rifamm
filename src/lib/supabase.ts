import { createClient } from '@supabase/supabase-js'
import type { Order, RaffleNumber } from '../types/raffle'
import type { SiteSettings } from '../types/settings'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      site_settings: {
        Row: SiteSettings
        Insert: SiteSettings
        Update: Partial<Omit<SiteSettings, 'id'>>
        Relationships: []
      }
      rifa_numeros: {
        Row: RaffleNumber
        Insert: RaffleNumber
        Update: Partial<RaffleNumber>
        Relationships: []
      }
      pedidos: {
        Row: Order
        Insert: Partial<Order> & Pick<Order, 'participante_nome' | 'participante_email' | 'numeros' | 'valor_total'>
        Update: Partial<Omit<Order, 'id' | 'created_at'>>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      reservar_numeros: {
        Args: {
          p_pedido_id: string
          p_numeros: number[]
          p_reserva_minutos: number
        }
        Returns: { sucesso: boolean; mensagem: string }
      }
      liberar_reservas_expiradas: {
        Args: Record<string, never>
        Returns: number
      }
      inicializar_numeros_rifa: {
        Args: Record<string, never>
        Returns: undefined
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export const supabase = createClient<Database>(
  supabaseUrl || 'https://example.supabase.co',
  supabaseAnonKey || 'missing-anon-key',
)
