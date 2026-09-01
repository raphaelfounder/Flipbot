-- Run the legacy catalogue view with the querying role's permissions instead
-- of the view owner's permissions. The active Product Finder uses the private
-- runtime RPC, so this view is retained only as a service-role fallback.
alter view public.flipbot_product_catalogue_for_finder
  set (security_invoker = true);

revoke all on public.flipbot_product_catalogue_for_finder from public;
revoke all on public.flipbot_product_catalogue_for_finder from anon;
revoke all on public.flipbot_product_catalogue_for_finder from authenticated;
revoke all on public.flipbot_product_catalogue_for_finder from service_role;

grant select on public.flipbot_product_catalogue_for_finder to service_role;
