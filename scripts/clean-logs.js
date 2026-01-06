#!/usr/bin/env node

/**
 * Script pour nettoyer automatiquement tous les console.log
 * et les remplacer par des logs sécurisés
 */

const fs = require('fs');
const path = require('path');

// Fonction pour nettoyer un fichier
function cleanFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Remplacer console.log par des logs sécurisés
    content = content.replace(
      /console\.log\(/g,
      'if (__DEV__) console.log('
    );
    
    content = content.replace(
      /console\.warn\(/g,
      'if (__DEV__) console.warn('
    );
    
    content = content.replace(
      /console\.error\(/g,
      'if (__DEV__) console.error('
    );
    
    content = content.replace(
      /console\.info\(/g,
      'if (__DEV__) console.info('
    );
    
    // Éviter les doubles conditions
    content = content.replace(
      /if \(__DEV__\) if \(__DEV__\)/g,
      'if (__DEV__)'
    );
    
    fs.writeFileSync(filePath, content);
    console.log(`✅ Nettoyé: ${filePath}`);
  } catch (error) {
    console.error(`❌ Erreur avec ${filePath}:`, error.message);
  }
}

// Fonction pour parcourir récursivement les dossiers
function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    
    if (isDirectory && !f.startsWith('.') && f !== 'node_modules') {
      walkDir(dirPath, callback);
    } else if (f.endsWith('.tsx') || f.endsWith('.ts') || f.endsWith('.js')) {
      callback(dirPath);
    }
  });
}

// Nettoyer tous les fichiers
console.log('🧹 Nettoyage des logs en cours...');
walkDir('./app', cleanFile);
walkDir('./components', cleanFile);
walkDir('./hooks', cleanFile);
walkDir('./utils', cleanFile);

console.log('✅ Nettoyage terminé !');
