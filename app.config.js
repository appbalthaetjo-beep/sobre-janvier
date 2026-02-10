const path = require('path');

function loadDotEnv() {
  try {
    // Load local `.env` when running `expo start` / `expo run:*`.
    // For EAS builds, prefer `eas.json` `env` or EAS Secrets.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('dotenv').config({ path: path.join(__dirname, '.env') });
  } catch {
    // If `dotenv` isn't installed, fall back to the shell environment.
  }
}

function collectExpoPublicEnv(env) {
  const publicEnv = {};
  for (const [key, value] of Object.entries(env ?? {})) {
    if (!key.startsWith('EXPO_PUBLIC_')) continue;
    if (typeof value !== 'string') continue;
    publicEnv[key] = value;
  }
  return publicEnv;
}

module.exports = ({ config }) => {
  loadDotEnv();

  return {
    // `config` is derived from app.json/app.config, so spreading it keeps all values from app.json.
    ...(config ?? {}),
    extra: {
      ...((config ?? {}).extra ?? {}),
      publicEnv: collectExpoPublicEnv(process.env),
    },
  };
};
