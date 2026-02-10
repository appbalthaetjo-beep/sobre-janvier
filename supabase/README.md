## Daily Reset Push (Supabase)

### 1) Table

Exécuter `supabase/sql/user_devices.sql` dans le SQL editor Supabase.

### 2) Edge Function

Déployer la fonction `trigger-daily-reset` (dossier `supabase/functions/trigger-daily-reset`).

Variables à définir côté Supabase (Edge Function secrets) :
- `SUPABASE_SERVICE_ROLE_KEY` (requis pour lire `user_devices` sans JWT)

Note : `verify_jwt = false` est configuré pour permettre l’appel depuis l’extension iOS.

