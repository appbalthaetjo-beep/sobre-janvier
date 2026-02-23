## Daily Reset Push (Supabase)

### 1) Table

Executer `supabase/sql/user_devices.sql` dans le SQL editor Supabase.

### 2) Edge Function

Deployer la fonction `trigger-daily-reset` (dossier `supabase/functions/trigger-daily-reset`).

Variables a definir cote Supabase (Edge Function secrets):
- `SUPABASE_SERVICE_ROLE_KEY` (requis pour lire `user_devices` sans JWT)

Note: `verify_jwt = false` est configure pour permettre l'appel depuis l'extension iOS.

## Community Feed (Supabase)

Executer `supabase/sql/community_messages.sql` dans le SQL editor Supabase.

Ce script ajoute:
- policies de lecture/ecriture explicites pour `anon` et `authenticated` sur `public.community_messages`
- RPC `public.community_whoami()` pour verifier role/JWT cote app
- RPC `public.community_feed(limit)` pour une lecture stable en production
