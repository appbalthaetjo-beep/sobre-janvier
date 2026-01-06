/**
 * Utilitaire de logging sécurisé pour la production
 * Les logs ne s'affichent qu'en mode développement
 */

const isDev = __DEV__;

export const logger = {
  log: (message: string, ...args: any[]) => {
    if (isDev) {
      console.log(`[SOBRE] ${message}`, ...args);
    }
  },
  
  warn: (message: string, ...args: any[]) => {
    if (isDev) {
      console.warn(`[SOBRE] ${message}`, ...args);
    }
  },
  
  error: (message: string, ...args: any[]) => {
    if (isDev) {
      console.error(`[SOBRE] ${message}`, ...args);
    }
  },
  
  info: (message: string, ...args: any[]) => {
    if (isDev) {
      console.info(`[SOBRE] ${message}`, ...args);
    }
  }
};

// Fonction pour logger les erreurs critiques (toujours affichées)
export const logCriticalError = (error: Error, context?: string) => {
  console.error(`[SOBRE CRITICAL] ${context || 'Unknown context'}:`, error.message);
  // En production, vous pourriez envoyer ces erreurs à un service de monitoring
};

export default logger;
