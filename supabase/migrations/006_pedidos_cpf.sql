-- CPF do participante (somente dígitos, 11 caracteres)
alter table public.pedidos
  add column if not exists participante_cpf text;

create index if not exists pedidos_cpf_idx on public.pedidos (participante_cpf);
