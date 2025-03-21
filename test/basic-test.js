const https = require('https');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Test de connectivité à l'API OpenAI
function testOpenAIConnection() {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      reject(new Error('API key not found in .env file'));
      return;
    }
    
    const options = {
      hostname: 'api.openai.com',
      port: 443,
      path: '/v1/models',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve('✅ OpenAI API connection successful');
        } else {
          reject(new Error(`❌ OpenAI API connection failed: ${res.statusCode} ${data}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(new Error(`❌ OpenAI API connection failed: ${error.message}`));
    });
    
    req.end();
  });
}

// Test d'accès au fichier FAQ
function testFAQAccess() {
  return new Promise((resolve, reject) => {
    const faqPath = path.join(__dirname, '../data/bioforce-faq.json');
    
    fs.access(faqPath, fs.constants.R_OK, (err) => {
      if (err) {
        reject(new Error(`❌ Cannot access FAQ file: ${err.message}`));
      } else {
        fs.readFile(faqPath, 'utf8', (err, data) => {
          if (err) {
            reject(new Error(`❌ Cannot read FAQ file: ${err.message}`));
          } else {
            try {
              const faqData = JSON.parse(data);
              if (faqData && faqData.faqs && Array.isArray(faqData.faqs)) {
                resolve(`✅ FAQ file accessed successfully: ${faqData.faqs.length} entries found`);
              } else {
                reject(new Error('❌ FAQ file has invalid format'));
              }
            } catch (e) {
              reject(new Error(`❌ Cannot parse FAQ file as JSON: ${e.message}`));
            }
          }
        });
      }
    });
  });
}

// Exécuter les tests
async function runTests() {
  console.log('Running basic tests...');
  
  try {
    const faqResult = await testFAQAccess();
    console.log(faqResult);
  } catch (error) {
    console.error(error.message);
  }
  
  try {
    const apiResult = await testOpenAIConnection();
    console.log(apiResult);
  } catch (error) {
    console.error(error.message);
  }
}

runTests();