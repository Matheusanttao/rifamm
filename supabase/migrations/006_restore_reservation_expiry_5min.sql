-- Reserva com prazo: números voltam se o pagamento não é feito em X minutos (padrão 5).

update public.site_settings
set reserva_minutos = 5
where id = 1;

create or replace function public.liberar_reservas_expiradas()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int := 0;
  v_pedido record;
begin
  for v_pedido in
    select id
    from public.pedidos
    where status_pagamento = 'aguardando'
      and reservado_ate is not null
      and reservado_ate < now()
  loop
    update public.pedidos
    set status_pagamento = 'expirado', updated_at = now()
    where id = v_pedido.id;

    update public.rifa_numeros
    set status = 'disponivel', pedido_id = null, reservado_ate = null, updated_at = now()
    where pedido_id = v_pedido.id and status = 'reservado';

    v_count := v_count + 1;
  end loop;

  update public.rifa_numeros
  set status = 'disponivel', pedido_id = null, reservado_ate = null, updated_at = now()
  where status = 'reservado'
    and reservado_ate is not null
    and reservado_ate < now();

  return v_count;
end;
$$;

create or replace function public.reservar_numeros(
  p_pedido_id uuid,
  p_numeros int[],
  p_reserva_minutos int default 5
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

  v_minutos := greatest(coalesce(p_reserva_minutos, 5), 1);
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

-- Limpa pedidos antigos presos em aguardando (sem prazo ou prazo vencido)
update public.pedidos
set status_pagamento = 'expirado', updated_at = now()
where status_pagamento = 'aguardando'
  and (reservado_ate is null or reservado_ate < now())
  and created_at < now() - interval '5 minutes';

update public.rifa_numeros
set status = 'disponivel', pedido_id = null, reservado_ate = null, updated_at = now()
where status = 'reservado'
  and pedido_id in (select id from public.pedidos where status_pagamento = 'expirado');
