-- CPF do participante (somente dígitos, 11 caracteres)
alter table public.pedidos
  add column if not exists participante_cpf text;
