create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Configurações do site / rifa
create table if not exists public.site_settings (
  id int primary key default 1 check (id = 1),
  titulo_site text not null default 'Rifa do Chá de Panela',
  subtitulo_site text not null default 'Matheus & Melissa',
  texto_hero text not null default '',
  texto_casal text not null default '',
  assinatura_casal text not null default '',
  premio_nome text not null default '',
  premio_descricao text not null default '',
  premio_imagem_url text,
  premio_2_nome text not null default '',
  premio_2_descricao text not null default '',
  premio_2_imagem_url text,
  premio_3_nome text not null default '',
  premio_3_descricao text not null default '',
  premio_3_imagem_url text,
  regulamento text not null default '',
  data_sorteio date,
  total_numeros int not null default 200 check (total_numeros between 10 and 10000),
  valor_numero numeric(12, 2) not null default 15 check (valor_numero > 0),
  reserva_minutos int not null default 5 check (reserva_minutos between 5 and 120),
  hero_imagem_url text,
  pagamento_habilitado boolean not null default false,
  pix_chave text,
  pix_titular text,
  pix_mensagem text,
  updated_at timestamptz not null default now()
);

drop trigger if exists site_settings_set_updated_at on public.site_settings;
create trigger site_settings_set_updated_at
before update on public.site_settings
for each row
execute function public.set_updated_at();

alter table public.site_settings enable row level security;

drop policy if exists "Leitura publica das configuracoes" on public.site_settings;
create policy "Leitura publica das configuracoes"
on public.site_settings for select to anon, authenticated using (true);

drop policy if exists "Admin pode inserir configuracoes" on public.site_settings;
create policy "Admin pode inserir configuracoes"
on public.site_settings for insert to authenticated with check (true);

drop policy if exists "Admin pode atualizar configuracoes" on public.site_settings;
create policy "Admin pode atualizar configuracoes"
on public.site_settings for update to authenticated using (true) with check (true);

insert into public.site_settings (id) values (1) on conflict (id) do nothing;

-- Pedidos
create table if not exists public.pedidos (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  participante_nome text not null,
  participante_email text not null,
  participante_telefone text,
  numeros int[] not null,
  valor_total numeric(12, 2) not null,
  status_pagamento text not null default 'aguardando'
    check (status_pagamento in ('aguardando', 'aprovado', 'recusado', 'expirado', 'cancelado')),
  metodo_pagamento text check (metodo_pagamento in ('pix', 'cartao')),
  pix_copia_cola text,
  pix_qr_base64 text,
  checkout_url text,
  provider_payment_id text,
  reservado_ate timestamptz,
  pago_em timestamptz,
  email_enviado boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pedidos_status_idx on public.pedidos (status_pagamento);
create index if not exists pedidos_created_idx on public.pedidos (created_at desc);

drop trigger if exists pedidos_set_updated_at on public.pedidos;
create trigger pedidos_set_updated_at
before update on public.pedidos
for each row
execute function public.set_updated_at();

alter table public.pedidos enable row level security;

drop policy if exists "Leitura publica de pedidos proprios" on public.pedidos;
create policy "Leitura publica de pedidos proprios"
on public.pedidos for select to anon, authenticated using (true);

drop policy if exists "Inserir pedidos" on public.pedidos;
create policy "Inserir pedidos"
on public.pedidos for insert to anon, authenticated with check (true);

drop policy if exists "Admin atualiza pedidos" on public.pedidos;
create policy "Admin atualiza pedidos"
on public.pedidos for update to authenticated using (true) with check (true);

-- Números da rifa
create table if not exists public.rifa_numeros (
  numero int primary key,
  status text not null default 'disponivel'
    check (status in ('disponivel', 'reservado', 'vendido')),
  pedido_id uuid references public.pedidos(id) on delete set null,
  reservado_ate timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists rifa_numeros_status_idx on public.rifa_numeros (status);
create index if not exists rifa_numeros_pedido_idx on public.rifa_numeros (pedido_id);

drop trigger if exists rifa_numeros_set_updated_at on public.rifa_numeros;
create trigger rifa_numeros_set_updated_at
before update on public.rifa_numeros
for each row
execute function public.set_updated_at();

alter table public.rifa_numeros enable row level security;

drop policy if exists "Leitura publica dos numeros" on public.rifa_numeros;
create policy "Leitura publica dos numeros"
on public.rifa_numeros for select to anon, authenticated using (true);

drop policy if exists "Admin atualiza numeros" on public.rifa_numeros;
create policy "Admin atualiza numeros"
on public.rifa_numeros for update to authenticated using (true) with check (true);

-- Libera reservas expiradas (pedidos aguardando sem pagamento no prazo)
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

grant execute on function public.liberar_reservas_expiradas() to anon, authenticated;

-- Reserva atômica de números (com expiração por tempo)
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

grant execute on function public.reservar_numeros(uuid, int[], int) to anon, authenticated;

-- Confirma venda após pagamento validado (chamado por webhook/admin)
create or replace function public.confirmar_pagamento_pedido(p_pedido_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.pedidos
  set status_pagamento = 'aprovado', pago_em = now(), updated_at = now()
  where id = p_pedido_id and status_pagamento = 'aguardando';

  if not found then
    return false;
  end if;

  update public.rifa_numeros
  set status = 'vendido', reservado_ate = null
  where pedido_id = p_pedido_id;

  return true;
end;
$$;

grant execute on function public.confirmar_pagamento_pedido(uuid) to authenticated, service_role;

-- Inicializa números com base nas configurações
create or replace function public.inicializar_numeros_rifa()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total int;
  i int;
begin
  select total_numeros into v_total from public.site_settings where id = 1;
  if v_total is null then v_total := 200; end if;

  for i in 1..v_total loop
    insert into public.rifa_numeros (numero, status)
    values (i, 'disponivel')
    on conflict (numero) do nothing;
  end loop;
end;
$$;

select public.inicializar_numeros_rifa();

grant execute on function public.inicializar_numeros_rifa() to anon, authenticated;