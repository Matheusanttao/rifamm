-- Migração: colunas Mercado Pago em pedidos
alter table public.pedidos add column if not exists pix_qr_base64 text;
alter table public.pedidos add column if not exists checkout_url text;
