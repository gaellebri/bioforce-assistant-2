const fs = require('fs');
const path = require('path');
const imageToIco = require('image-to-ico');

// Chemins des fichiers
const sourceImage = path.join(__dirname, 'src', 'assets', 'bioforce-app-icon.png');
const outputDir = path.join(__dirname, 'build', 'icons');

// Créer le dossier de sortie s'il n'existe pas
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
  console.log('Dossier build/icons créé');
}

// Vérifier si l'image source existe
if (!fs.existsSync(sourceImage)) {
  console.error('ERREUR: Image source introuvable:', sourceImage);
  process.exit(1);
}

console.log('Conversion de', sourceImage, 'en ICO...');

// Copier l'image source en PNG
fs.copyFileSync(sourceImage, path.join(outputDir, 'icon.png'));
console.log('✅ Fichier PNG copié vers build/icons/icon.png');

// Convertir en ICO
imageToIco(sourceImage)
  .then(buffer => {
    fs.writeFileSync(path.join(outputDir, 'icon.ico'), buffer);
    console.log('✅ Fichier ICO créé: build/icons/icon.ico');
    
    // Copier également en tant qu'icns pour macOS (solution temporaire)
    fs.copyFileSync(path.join(outputDir, 'icon.png'), path.join(outputDir, 'icon.icns'));
    console.log('✅ Fichier ICNS créé: build/icons/icon.icns (copie du PNG)');
    
    console.log('Conversion terminée avec succès!');
  })
  .catch(error => {
    console.error('❌ Erreur lors de la conversion en ICO:', error);
    
    // Fallback: copier le PNG en ICO
    console.log('Tentative de solution de secours...');
    fs.copyFileSync(path.join(outputDir, 'icon.png'), path.join(outputDir, 'icon.ico'));
    fs.copyFileSync(path.join(outputDir, 'icon.png'), path.join(outputDir, 'icon.icns'));
    console.log('⚠️ Fichiers ICO et ICNS créés comme copies du PNG (solution de secours)');
  });