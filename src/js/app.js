// Éléments du DOM
const questionInput = document.getElementById('questionInput');
const generateBtn = document.getElementById('generateBtn');
const addToDbBtn = document.getElementById('addToDbBtn');
const responseSection = document.getElementById('responseSection');
const responseContainer = document.getElementById('responseContainer');
const copyBtn = document.getElementById('copyBtn');
const editBtn = document.getElementById('editBtn');

// Éléments DOM supplémentaires
const addToDbModal = document.getElementById('addToDbModal');
const addToDbForm = document.getElementById('addToDbForm');
const cancelAddBtn = document.getElementById('cancelAddBtn');
const closeModalBtn = document.querySelector('.close-modal');
// Éléments DOM pour le thème
const themeToggle = document.getElementById('theme-toggle');
const themeLabel = document.getElementById('theme-label');
// Importer le module chatbot
import { generateResponse } from './chatbot.js';

// Variables globales
let faqData = [];
let isGenerating = false;

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Initialisation du thème - sans redéclarer les variables
    function getThemePreference() {
      return localStorage.getItem('theme') || 'light';
    }

    function applyTheme(theme) {
      document.documentElement.setAttribute('data-theme', theme);
      if (themeToggle) { // Vérifier si l'élément existe
        themeToggle.checked = theme === 'dark';
      }
      if (themeLabel) { // Vérifier si l'élément existe
        themeLabel.textContent = theme === 'dark' ? 'Mode clair' : 'Mode sombre';
      }
    }

    // Initialiser le thème
    const currentTheme = getThemePreference();
    applyTheme(currentTheme);

    // Écouter les changements de thème
    if (themeToggle) {
      themeToggle.addEventListener('change', function() {
        const theme = this.checked ? 'dark' : 'light';
        applyTheme(theme);
        localStorage.setItem('theme', theme);
      });
    }

    // Charger les données de la FAQ
    const data = await window.bioforceAPI.getFAQData();
    if (data.error) {
      showError(data.error);
      return;
    }
    faqData = data.faqs;
    console.log('FAQ chargée avec succès:', faqData.length, 'entrées');
  } catch (error) {
    showError('Erreur lors du chargement de la FAQ');
    console.error(error);
  }
});

// Fonction pour mettre à jour l'état des boutons
function updateButtonsState(generating) {
  isGenerating = generating;
  
  if (generating) {
    generateBtn.disabled = true;
    generateBtn.innerHTML = '<span class="spinner-inline"></span> Génération...';
  } else {
    generateBtn.disabled = false;
    generateBtn.innerHTML = 'Générer une réponse';
  }
}

// Événement - Clic sur le bouton "Générer une réponse"
generateBtn.addEventListener('click', async () => {
  const question = questionInput.value.trim();
  
  if (!question) {
    showError('Veuillez entrer une question ou un commentaire');
    return;
  }
  
  if (isGenerating) return; // Éviter les clics multiples
  
  try {
    // Mettre à jour l'état
    updateButtonsState(true);
    
    // Afficher un indicateur de chargement
    responseContainer.innerHTML = '<div class="loading-spinner"></div><p class="loading-text">Génération de la réponse en cours...</p>';
    responseSection.style.display = 'block';
    
    // Générer une réponse avec ChatGPT
    const response = await generateResponse(question, faqData);
    
    // Vérifier s'il y a une erreur
    if (response.error) {
      responseContainer.innerHTML = `<p class="error-message">${response.answer}</p>`;
      return;
    }
    
    // Afficher la réponse
    displayResponse(response);
  } catch (error) {
    showError('Erreur lors de la génération de la réponse');
    console.error(error);
    responseContainer.innerHTML = '<p class="error-message">Une erreur est survenue lors de la génération de la réponse.</p>';
  } finally {
    // Réinitialiser l'état
    updateButtonsState(false);
  }
});

// Événement - Clic sur le bouton "Copier"
copyBtn.addEventListener('click', () => {
  // Sélectionner uniquement le paragraphe contenant la réponse (sans les métadonnées)
  const responseTextElement = responseContainer.querySelector('.response-text');
  
  if (responseTextElement) {
    const responseText = responseTextElement.innerText;
    
    navigator.clipboard.writeText(responseText)
      .then(() => {
        // Animation de confirmation
        copyBtn.textContent = 'Copié ✓';
        setTimeout(() => {
          copyBtn.textContent = 'Copier';
        }, 1500);
      })
      .catch(err => {
        showError('Erreur lors de la copie');
        console.error(err);
      });
  }
});

// Événement - Clic sur le bouton "Modifier"
editBtn.addEventListener('click', () => {
  // Rendre le contenu éditable
  responseContainer.contentEditable = !responseContainer.isContentEditable;
  
  if (responseContainer.isContentEditable) {
    editBtn.textContent = 'Terminer';
    responseContainer.focus();
  } else {
    editBtn.textContent = 'Modifier';
  }
});

// Fonction - Afficher une réponse
function displayResponse(responseData) {
  // Formater les mots-clés
  const keywordsDisplay = responseData.keywords && responseData.keywords.length > 0 
    ? `<p class="keywords-info">Mots-clés: ${responseData.keywords.join(', ')}</p>` 
    : '';
  
  // Formater la sous-catégorie secondaire si elle existe
  const subcategory2Display = responseData.subcategory2 && responseData.subcategory2.trim() !== '' 
    ? ` > ${responseData.subcategory2}` 
    : '';
  
  // Afficher la réponse avec plus d'informations
  responseContainer.innerHTML = `
    <p class="response-text">${responseData.answer}</p>
    <div class="response-metadata">
      <p class="match-info">Fiabilité : ${Math.round(responseData.score * 100)}%</p>
      <p class="question-match">Question originale : "${responseData.question}"</p>
      <p class="category-info">Catégorie : ${responseData.category} > ${responseData.subcategory}${subcategory2Display}</p>
      ${keywordsDisplay}
    </div>
  `;
  
  // Mettre en évidence les liens dans la réponse
  highlightLinks();
  
  // Mettre à jour le style CSS
  responseContainer.style.padding = '20px';
  responseSection.style.display = 'block';
}

// Fonction - Mettre en évidence les liens dans la réponse
function highlightLinks() {
  const responseText = responseContainer.querySelector('.response-text');
  if (!responseText) return;
  
  // Rechercher les URLs dans le texte et les remplacer par des liens cliquables
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  responseText.innerHTML = responseText.innerHTML.replace(
    urlRegex, 
    '<a href="$1" class="bioforce-link" target="_blank">$1</a>'
  );
}

// Fonction - Afficher une erreur
function showError(message) {
  // Créer un élément d'alerte
  const alertElement = document.createElement('div');
  alertElement.className = 'alert';
  alertElement.textContent = message;
  
  // Ajouter l'alerte au document
  document.body.appendChild(alertElement);
  
  // Supprimer l'alerte après 3 secondes
  setTimeout(() => {
    alertElement.classList.add('fade-out');
    setTimeout(() => {
      document.body.removeChild(alertElement);
    }, 300);
  }, 3000);
}

// Ajouter des styles pour l'application
const style = document.createElement('style');
style.innerHTML = `
  .alert {
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    padding: 10px 20px;
    background-color: #f44336;
    color: white;
    border-radius: 4px;
    z-index: 1000;
    animation: slide-in 0.3s ease-out;
  }
  
  .fade-out {
    opacity: 0;
    transition: opacity 0.3s ease-out;
  }
  
  @keyframes slide-in {
    from { top: -50px; opacity: 0; }
    to { top: 20px; opacity: 1; }
  }
  
  .spinner-inline {
    display: inline-block;
    width: 12px;
    height: 12px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: #fff;
    animation: spin 1s linear infinite;
    margin-right: 8px;
  }
  
  .loading-text {
    text-align: center;
    color: #666;
    margin-top: 10px;
  }
  
  .response-text {
    margin-bottom: 15px;
    line-height: 1.6;
  }
  
  .response-metadata {
    font-size: 12px;
    color: #666;
    border-top: 1px solid #eee;
    padding-top: 10px;
    margin-top: 15px;
  }
  
  .loading-spinner {
    border: 4px solid rgba(233, 78, 27, 0.3);
    border-radius: 50%;
    border-top: 4px solid var(--bioforce-orange);
    width: 40px;
    height: 40px;
    animation: spin 1s linear infinite;
    margin: 30px auto;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .error-message {
    color: #f44336;
    font-style: italic;
  }
  
  .bioforce-link {
    color: var(--bioforce-orange);
    text-decoration: underline;
  }
`;
document.head.appendChild(style);

// Événement - Clic sur le bouton "Ajouter à la base de connaissances"
addToDbBtn.addEventListener('click', () => {
  // Si la question actuelle est remplie, pré-remplir le champ question du formulaire
  const currentQuestion = questionInput.value.trim();
  if (currentQuestion) {
    document.getElementById('newQuestion').value = currentQuestion;
  }
  
  // Afficher le modal
  addToDbModal.classList.add('show');
});

// Fermer le modal
function closeModal() {
  addToDbModal.classList.remove('show');
}

// Événements pour fermer le modal
closeModalBtn.addEventListener('click', closeModal);
cancelAddBtn.addEventListener('click', closeModal);
window.addEventListener('click', (event) => {
  if (event.target === addToDbModal) {
    closeModal();
  }
});

// Événement - Soumission du formulaire d'ajout à la base de connaissances
addToDbForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  
  // Récupérer les valeurs du formulaire
  const category = document.getElementById('newCategory').value;
  const subcategory = document.getElementById('newSubcategory').value;
  const subcategory2 = document.getElementById('newSubcategory2').value;
  const question = document.getElementById('newQuestion').value;
  const answer = document.getElementById('newAnswer').value;
  const keywordsString = document.getElementById('newKeywords').value;
  
  // Convertir la chaîne de mots-clés en tableau
  const keywords = keywordsString
    .split(',')
    .map(keyword => keyword.trim())
    .filter(keyword => keyword !== '');
  
  // Créer l'objet de nouvelle entrée FAQ
  const newEntry = {
    category,
    subcategory,
    subcategory2,
    question,
    answer,
    keywords
  };
  
  try {
    // Envoyer la nouvelle entrée au processus principal
    const result = await window.bioforceAPI.addToFAQ(newEntry);
    
    if (result.error) {
      showError(result.error);
      return;
    }
    
    // Afficher un message de succès
    alert('La nouvelle entrée a été ajoutée avec succès à la base de connaissances.');
    
    // Fermer le modal et réinitialiser le formulaire
    closeModal();
    addToDbForm.reset();
    
    // Recharger les données de la FAQ pour refléter les changements
    const data = await window.bioforceAPI.getFAQData();
    if (data.error) {
      showError(data.error);
      return;
    }
    faqData = data.faqs;
    console.log('FAQ rechargée avec succès:', faqData.length, 'entrées');
  } catch (error) {
    showError('Erreur lors de l\'ajout à la base de connaissances');
    console.error(error);
  }
});