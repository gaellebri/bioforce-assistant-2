/**
 * Module chatbot unifié pour l'application Bioforce Assistant
 * Gère la génération de réponses en utilisant l'API OpenAI
 */

/**
 * Génère une réponse basée sur la question et la base de connaissances
 * @param {string} question - La question posée
 * @param {Array} faqData - Les données de la FAQ
 * @returns {Promise<Object>} - La réponse générée
 */
async function generateResponse(question, faqData) {
  try {
    // Vérification des données
    if (!Array.isArray(faqData) || faqData.length === 0) {
      throw new Error('La base de connaissances est vide ou invalide');
    }
    
    if (!question || typeof question !== 'string') {
      throw new Error('La question est vide ou invalide');
    }
    
    // Préparer le contexte avec les FAQ pertinentes
    const context = prepareContext(question, faqData);
    
    // Construire le prompt pour l'API
    const messages = [
      {
        role: "system",
        content: `Tu es un assistant spécialisé pour l'organisation Bioforce. 
Tu réponds aux questions concernant Bioforce, ses formations, et ses activités.
Ta tâche est de fournir des réponses précises et utiles basées exclusivement sur les informations contenues dans la base de connaissances suivante:
${context}

Si tu ne trouves pas d'information pertinente dans la base de connaissances, indique poliment que tu ne peux pas répondre à cette question spécifique.
N'invente jamais d'information qui n'est pas dans la base de connaissances.
Réponds en français et de manière professionnelle.`
      },
      {
        role: "user",
        content: question
      }
    ];

    // Appel à l'API via notre fonction sécurisée d'Electron
    const payload = {
      model: "gpt-3.5-turbo",
      messages: messages,
      temperature: 0.5,  // Équilibre entre créativité et fidélité
      max_tokens: 800    // Un peu plus long pour des réponses complètes
    };

    // Utiliser l'API sécurisée d'Electron
    const response = await window.bioforceAPI.callOpenAI(payload);
    
    // Trouver la FAQ la plus pertinente pour la métadonnée
    const bestMatch = findBestMatchingFAQ(question, response.choices[0].message.content, faqData);
    
    // Créer l'objet de réponse
    return {
      answer: response.choices[0].message.content,
      question: bestMatch ? bestMatch.question : "Question générée par IA",
      score: bestMatch ? 0.95 : 0.8,
      category: bestMatch ? bestMatch.category : "AI",
      subcategory: bestMatch ? bestMatch.subcategory : "Réponse générée",
      subcategory2: bestMatch ? bestMatch.subcategory2 : "",
      keywords: bestMatch ? bestMatch.keywords : ["ia", "chatgpt", "assistant"]
    };
  } catch (error) {
    console.error("Erreur lors de la génération de la réponse:", error);
    
    // Retourner un objet d'erreur formaté
    return {
      error: true,
      message: error.message || 'Une erreur est survenue',
      answer: "Désolé, je n'ai pas pu générer de réponse. Veuillez réessayer ou reformuler votre question.",
      question: question || "",
      score: 0,
      category: "ERROR",
      subcategory: "Erreur technique",
      subcategory2: "",
      keywords: []
    };
  }
}

/**
 * Prépare le contexte en sélectionnant les FAQ les plus pertinentes
 * @param {string} question - La question posée
 * @param {Array} faqData - Les données de la FAQ
 * @returns {string} - Le contexte formaté
 */
function prepareContext(question, faqData) {
  // Version améliorée: sélection des FAQ les plus pertinentes
  const normalizedQuestion = question.toLowerCase();
  
  // Calculer un score simple pour chaque FAQ
  const scoredFAQs = faqData.map(faq => {
    const questionWords = normalizedQuestion.split(/\s+/).filter(word => word.length > 3);
    const faqQuestionLower = faq.question.toLowerCase();
    const faqAnswerLower = faq.answer.toLowerCase();
    
    // Compter combien de mots de la question apparaissent dans la FAQ
    let matchCount = 0;
    questionWords.forEach(word => {
      if (faqQuestionLower.includes(word) || faqAnswerLower.includes(word)) {
        matchCount++;
      }
    });
    
    // Donner un bonus aux FAQ avec des mots-clés correspondants
    if (faq.keywords && Array.isArray(faq.keywords)) {
      const keywordMatches = faq.keywords.filter(keyword => 
        normalizedQuestion.includes(keyword.toLowerCase())
      ).length;
      
      matchCount += keywordMatches * 2; // Bonus pour les mots-clés
    }
    
    return { ...faq, relevanceScore: matchCount };
  });
  
  // Trier par score décroissant et prendre les 15 meilleurs résultats
  scoredFAQs.sort((a, b) => b.relevanceScore - a.relevanceScore);
  const relevantFAQs = scoredFAQs.slice(0, 15);
  
  // Formater le contexte
  return relevantFAQs.map(faq => (
    `Question: ${faq.question}\nRéponse: ${faq.answer}\nCatégorie: ${faq.category} > ${faq.subcategory}${faq.subcategory2 ? ' > ' + faq.subcategory2 : ''}\n`
  )).join("\n");
}

/**
 * Trouve la FAQ la plus pertinente pour la question et la réponse générée
 * @param {string} question - La question posée
 * @param {string} generatedAnswer - La réponse générée par l'API
 * @param {Array} faqData - Les données de la FAQ
 * @returns {Object|null} - La FAQ la plus pertinente
 */
function findBestMatchingFAQ(question, generatedAnswer, faqData) {
  // Normaliser les entrées
  const normalizedQuestion = question.toLowerCase();
  const normalizedAnswer = generatedAnswer ? generatedAnswer.toLowerCase() : '';
  
  // Calculer le score pour chaque FAQ
  const scoredFAQs = faqData.map(faq => {
    const faqQuestion = faq.question.toLowerCase();
    const faqAnswer = faq.answer.toLowerCase();
    
    // Diviser les phrases en mots significatifs (plus de 3 caractères)
    const questionWords = normalizedQuestion.split(/\s+/).filter(word => word.length > 3);
    
    // Calculer un score de similarité basé sur les mots communs
    let matchScore = 0;
    let totalWords = questionWords.length;
    
    // Donner plus de poids aux correspondances exactes de phrases
    if (faqQuestion.includes(normalizedQuestion) || normalizedQuestion.includes(faqQuestion)) {
      matchScore += 5;  // Bonus pour correspondance partielle de phrase
    }
    
    // Compter les mots correspondants
    questionWords.forEach(word => {
      if (faqQuestion.includes(word)) {
        matchScore += 1;
      }
    });
    
    // Calculer un score normalisé
    const score = totalWords > 0 ? matchScore / totalWords : 0;
    
    return { ...faq, score };
  });
  
  // Trier par score décroissant
  scoredFAQs.sort((a, b) => b.score - a.score);
  
  // Retourner le meilleur match s'il est assez pertinent (seuil plus élevé)
  if (scoredFAQs[0] && scoredFAQs[0].score > 0.5) {  // Augmenter le seuil de 0.3 à 0.5
    return scoredFAQs[0];
  }
  
  return null;
}

// Exporter les fonctions
export { generateResponse };