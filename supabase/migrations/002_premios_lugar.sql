-- Prêmios 2º e 3º lugar
alter table public.site_settings add column if not exists premio_2_nome text not null default '';
alter table public.site_settings add column if not exists premio_2_descricao text not null default '';
alter table public.site_settings add column if not exists premio_2_imagem_url text;
alter table public.site_settings add column if not exists premio_3_nome text not null default '';
alter table public.site_settings add column if not exists premio_3_descricao text not null default '';
alter table public.site_settings add column if not exists premio_3_imagem_url text;
