-- Controle de e-mail de confirmação após pagamento
alter table public.pedidos
  add column if not exists email_enviado boolean not null default false;
