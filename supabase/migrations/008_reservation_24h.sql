-- Reserva PIX: 24 horas (em vez de minutos curtos)
-- Rode no SQL Editor do Supabase.

alter table public.site_settings
  drop constraint if exists site_settings_reserva_minutos_check;

alter table public.site_settings
  add constraint site_settings_reserva_minutos_check
  check (reserva_minutos between 15 and 10080);

update public.site_settings
set reserva_minutos = 1440, updated_at = now()
where id = 1;

-- Pedidos ainda aguardando: dá mais 24h a partir de agora
update public.pedidos
set
  reservado_ate = now() + interval '24 hours',
  updated_at = now()
where status_pagamento = 'aguardando';

update public.rifa_numeros n
set
  reservado_ate = p.reservado_ate,
  updated_at = now()
from public.pedidos p
where n.pedido_id = p.id
  and p.status_pagamento = 'aguardando'
  and n.status = 'reservado';

create or replace function public.reservar_numeros(
  p_pedido_id uuid,
  p_numeros int[],
  p_reserva_minutos int default 1440
)
returns table (sucesso boolean, mensagem text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_numero int;
  v_minutos int;
  v_expira timestamptz;
begin
  if p_numeros is null or array_length(p_numeros, 1) is null then
    return query select false, 'Nenhum número informado.';
    return;
  end if;

  v_minutos := greatest(coalesce(p_reserva_minutos, 1440), 15);
  v_expira := now() + (v_minutos * interval '1 minute');

  foreach v_numero in array p_numeros loop
    if not exists (select 1 from public.rifa_numeros n where n.numero = v_numero and n.status = 'disponivel') then
      return query select false, format('O número %s não está disponível.', v_numero);
      return;
    end if;
  end loop;

  update public.rifa_numeros
  set status = 'reservado', pedido_id = p_pedido_id, reservado_ate = v_expira
  where numero = any(p_numeros) and status = 'disponivel';

  if (select count(*) from public.rifa_numeros where numero = any(p_numeros) and status = 'reservado' and pedido_id = p_pedido_id) <> array_length(p_numeros, 1) then
    update public.rifa_numeros
    set status = 'disponivel', pedido_id = null, reservado_ate = null
    where pedido_id = p_pedido_id and status = 'reservado';

    return query select false, 'Conflito de reserva. Tente novamente.';
    return;
  end if;

  update public.pedidos
  set reservado_ate = v_expira, updated_at = now()
  where id = p_pedido_id;

  return query select true, 'Números reservados com sucesso.';
end;
$$;
