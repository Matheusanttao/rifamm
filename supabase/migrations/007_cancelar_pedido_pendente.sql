-- Cancela pedido aguardando e devolve os números reservados para disponível.
create or replace function public.cancelar_pedido_pendente(
  p_pedido_id uuid,
  p_status text default 'cancelado'
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text := coalesce(nullif(trim(p_status), ''), 'cancelado');
begin
  if v_status not in ('cancelado', 'expirado', 'recusado') then
    v_status := 'cancelado';
  end if;

  update public.pedidos
  set status_pagamento = v_status, updated_at = now()
  where id = p_pedido_id and status_pagamento = 'aguardando';

  if not found then
    return false;
  end if;

  update public.rifa_numeros
  set status = 'disponivel', pedido_id = null, reservado_ate = null, updated_at = now()
  where pedido_id = p_pedido_id and status = 'reservado';

  return true;
end;
$$;

grant execute on function public.cancelar_pedido_pendente(uuid, text) to service_role;
