const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs').promises; // Utilisation de fs avec Promises
const https = require('https');
const crypto = require('crypto');

// Chargement de dotenv avec gestion d'erreur
let dotenvLoaded = false;
try {
  require('dotenv').config({ 
    path: app.isPackaged 
      ? path.join(process.resourcesPath, '.env')
      : path.join(app.getAppPath(), '.env')
  });
  dotenvLoaded = true;
} catch (error) {
  console.log('Dotenv non disponible, utilisation des variables d\'environnement système');
}

// Détermination du chemin d'accès aux ressources
const APP_PATH = app.getAppPath();
const IS_PACKAGED = app.isPackaged;

function getResourcePath(filename) {
  console.log('Mode packaged :', IS_PACKAGED);
  console.log('App Path :', APP_PATH);
  console.log('Process Resources Path :', process.resourcesPath);

  const resolvedPath = IS_PACKAGED 
    ? path.join(process.resourcesPath, 'data', filename)
    : path.join(APP_PATH, 'data', filename);
  
  console.log('Chemin résolu pour', filename, ':', resolvedPath);
  return resolvedPath;
}

// Définir ENCRYPTION_KEY avant de l'utiliser
const ENCRYPTION_KEY = 'bioforce-secure-key-12345';

function decryptApiKey(encryptedKey) {
  try {
    const parts = encryptedKey.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = Buffer.from(parts[1], 'hex');

    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      crypto.createHash('sha256').update(ENCRYPTION_KEY).digest().slice(0, 32),
      iv
    );

    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString();
  } catch (error) {
    console.error('Erreur lors du déchiffrement:', error);
    return null;
  }
}

const ENCRYPTED_API_KEY = 'cb14f16e8768844668e8d8f62a0ab9a5:61e4dd816bbca1669f26fbf38f3c8a32b5c8d5111fdb579471ba60fefa70ef720429ceed1409927e0e4ae49cc163aa4c2b7a24a9a974c75e59c4274337d41777753e95223210a6c7ac45787fc839e733e4eeabdf4980ab28eca22ba317b7e8943c3e3bee250d9033b58cc630d6d74e9b5298e349bf3a8d561ba5829797ff639d46403adb56f3f24169ee19a8bec26dc7e5823b4b437598ce617e6ecd33962f96dc33424221ef77f95583c0ae75ec0d62';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || decryptApiKey(ENCRYPTED_API_KEY);

const isTestMode = process.env.NODE_ENV === 'test';
const faqPath = getResourcePath(isTestMode ? 'bioforce-faq-test.json' : 'bioforce-faq.json');
console.log('Vérification du chemin FAQ utilisé par l\'application:', faqPath);
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    icon: path.join(__dirname, '../src/assets/app-icon.png'), 
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile(path.join(__dirname, '../src/index.html'));
  
  // Décommenter la ligne suivante pour ouvrir les outils de développement
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Gestion des messages IPC pour la FAQ
ipcMain.handle('get-faq-data', async () => {
  try {
    console.log('🔍 Requête reçue: get-faq-data');
    console.log('📂 Chemin utilisé pour la FAQ:', faqPath);
    
    const data = await fs.readFile(faqPath, 'utf8');
    console.log('📄 Contenu brut du fichier FAQ:', data.substring(0, 100) + '...');
    
    const jsonData = JSON.parse(data);
    console.log('✅ Données JSON parsées:', jsonData.faqs ? `${jsonData.faqs.length} entrées trouvées` : 'Structure non reconnue');

    return jsonData;
  } catch (error) {
    console.error('❌ Erreur lors de la lecture de la FAQ:', error);
    return { 
      error: 'Impossible de lire la base de données FAQ',
      details: error.message,
      path: faqPath
    };
  }
});

ipcMain.handle('add-to-faq', async (event, newEntry) => {
  try {
    const data = await fs.readFile(faqPath, 'utf8');
    const faqData = JSON.parse(data);
    faqData.faqs.push(newEntry);
    await fs.writeFile(faqPath, JSON.stringify(faqData, null, 2), 'utf8');
    return { success: true };
  } catch (error) {
    console.error('Erreur lors de l\'ajout à la FAQ:', error);
    return { 
      error: 'Impossible d\'ajouter à la base de données FAQ',
      details: error.message 
    };
  }
});

ipcMain.handle('call-openai-api', async (event, payload) => {
  return new Promise((resolve, reject) => {
    const apiKey = OPENAI_API_KEY;
    if (!apiKey) {
      reject({ status: 401, message: 'Clé API OpenAI non disponible' });
      return;
    }
    const postData = JSON.stringify({ ...payload, apiKey: undefined });
    const options = {
      hostname: 'api.openai.com',
      port: 443,
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (error) {
          reject({ message: 'Erreur de parsing API', error });
        }
      });
    });
    req.on('error', (error) => { reject({ message: 'Erreur réseau', error }); });
    req.write(postData);
    req.end();
  });
});