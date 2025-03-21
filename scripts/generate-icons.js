const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { ico } = require('@fiahfy/ico');
const png2icons = require('png2icons');

// Logs pour le débogage
console.log('Répertoire courant :', process.cwd());

// Créer le dossier des icônes s'il n'existe pas
const iconDir = path.join(__dirname, '..', 'build', 'icons');
console.log('Chemin du dossier des icônes :', iconDir);

if (!fs.existsSync(iconDir)){
    fs.mkdirSync(iconDir, { recursive: true });
    console.log('Dossier des icônes créé');
}

// Chemin vers le logo source
const sourceLogo = path.join(__dirname, '..', 'src', 'assets', 'bioforce-app-icon.png');
console.log('Chemin du logo source :', sourceLogo);

// Vérifier si le fichier existe
if (!fs.existsSync(sourceLogo)) {
    console.error('ERREUR : Fichier logo introuvable !');
    process.exit(1);
}

// Tailles d'icônes pour différentes plateformes
const sizes = {
    mac: [16, 32, 64, 128, 256, 512, 1024],
    windows: [16, 32, 48, 64, 128, 256],
    linux: [16, 32, 48, 64, 128, 256],
    web: [16, 32, 48, 64, 128]
};

// Générer les icônes
async function generateIcons() {
    try {
        // Générer les icônes PNG
        const generatePNGIcons = async (platformSizes) => {
            const iconPromises = platformSizes.map(size =>
                sharp(sourceLogo)
                    .resize(size, size)
                    .toFile(path.join(iconDir, `icon_${size}x${size}.png`))
            );
            await Promise.all(iconPromises);
        };

        // Icônes macOS
        await generatePNGIcons(sizes.mac);
        console.log('Icônes macOS générées');

        // Icônes Windows
        await generatePNGIcons(sizes.windows);
        
        // Icône principale pour Windows (PNG)
        await sharp(sourceLogo)
            .resize(256, 256)
            .toFile(path.join(iconDir, 'icon.png'));
        console.log('Icône Windows générée');

        // Icônes Linux
        await generatePNGIcons(sizes.linux);
        
        // Icône principale Linux
        await sharp(sourceLogo)
            .resize(256, 256)
            .toFile(path.join(iconDir, 'icon-linux.png'));
        
        // Créer l'icône Windows au format ICO
        const pngBuffer = fs.readFileSync(path.join(iconDir, 'icon.png'));
        const winIcon = await ico.from([{ data: pngBuffer, size: 256 }]);
        fs.writeFileSync(path.join(iconDir, 'icon.ico'), winIcon);
        console.log('Icône Windows ICO générée');
        
        // Créer l'icône macOS au format ICNS (si png2icons fonctionne bien)
        try {
            const macIcon = png2icons.createICNS(pngBuffer, png2icons.BILINEAR, 0);
            if (macIcon) {
                fs.writeFileSync(path.join(iconDir, 'icon.icns'), macIcon);
                console.log('Icône macOS ICNS générée');
            }
        } catch (err) {
            console.error('Erreur lors de la génération de l\'icône ICNS :', err);
            console.log('Vous devrez peut-être créer manuellement l\'icône macOS');
        }
        
        console.log('Génération des icônes terminée avec succès !');
    } catch (error) {
        console.error('Erreur lors de la génération des icônes :', error);
        console.error(error.stack);
    }
}

generateIcons();