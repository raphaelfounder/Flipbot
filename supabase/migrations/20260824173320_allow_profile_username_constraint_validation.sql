-- The profiles check constraint calls this function during authenticated
-- profile updates. Grant only the execution permission that constraint needs.
grant execute on function flipbot_private.is_allowed_username(text) to authenticated;
