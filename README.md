## Sobre

### Variables d'environnement (Expo)

1) Copie `\.env.example` en `\.env` puis renseigne au minimum :
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

2) Démarre en local :
- `npm run dev` (ou `npx expo start -c` si tu dois vider le cache)

### EAS Build

Sur EAS, le fichier `\.env` n’est pas utilisé : ajoute tes variables `EXPO_PUBLIC_*` dans les `env` du profil (`eas.json`) ou via **EAS Secrets**.

Note : tout ce qui commence par `EXPO_PUBLIC_` est embarqué côté client (donc public). N’y mets pas de secrets serveur (ex: clé OpenAI) : utilise un backend/proxy.
