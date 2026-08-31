-- Remove expiração por tempo: números ficam reservados até pagamento/cancelamento.
create or replace function public.liberar_reservas_expiradas()
returns int
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Mantida por compatibilidade; não libera mais por prazo.
  return 0;
end;
$$;

create or replace function public.reservar_numeros(
  p_pedido_id uuid,
  p_numeros int[],
  p_reserva_minutos int default 15
)
returns table (sucesso boolean, mensagem text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_numero int;
begin
  if p_numeros is null or array_length(p_numeros, 1) is null then
    return query select false, 'Nenhum número informado.';
    return;
  end if;

  foreach v_numero in array p_numeros loop
    if not exists (select 1 from public.rifa_numeros n where n.numero = v_numero and n.status = 'disponivel') then
      return query select false, format('O número %s não está disponível.', v_numero);
      return;
    end if;
  end loop;

  update public.rifa_numeros
  set status = 'reservado', pedido_id = p_pedido_id, reservado_ate = null
  where numero = any(p_numeros) and status = 'disponivel';

  if (select count(*) from public.rifa_numeros where numero = any(p_numeros) and status = 'reservado' and pedido_id = p_pedido_id) <> array_length(p_numeros, 1) then
    update public.rifa_numeros
    set status = 'disponivel', pedido_id = null, reservado_ate = null
    where pedido_id = p_pedido_id and status = 'reservado';

    return query select false, 'Conflito de reserva. Tente novamente.';
    return;
  end if;

  update public.pedidos
  set reservado_ate = null, updated_at = now()
  where id = p_pedido_id;

  return query select true, 'Números reservados com sucesso.';
end;
$$;

-- Limpa prazos antigos já gravados
update public.rifa_numeros
set reservado_ate = null
where status = 'reservado' and reservado_ate is not null;

update public.pedidos
set reservado_ate = null
where status_pagamento = 'aguardando' and reservado_ate is not null;
