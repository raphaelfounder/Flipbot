revoke all on function public.spend_credits(integer, text, text)
from public, anon, service_role;

grant execute on function public.spend_credits(integer, text, text)
to authenticated;
