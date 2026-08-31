-- Permite a API (service_role) confirmar pagamento via webhook/sync
grant execute on function public.confirmar_pagamento_pedido(uuid) to service_role;
