const { contextBridge, ipcRenderer } = require('electron');

// Exposer des API sécurisées pour le processus de rendu
contextBridge.exposeInMainWorld('bioforceAPI', {
  // Récupérer les données de la FAQ
  getFAQData: () => ipcRenderer.invoke('get-faq-data'),
  
  // Ajouter une nouvelle entrée à la FAQ
  addToFAQ: (newEntry) => ipcRenderer.invoke('add-to-faq', newEntry),
  
  // Appel à l'API OpenAI
  callOpenAI: (payload) => ipcRenderer.invoke('call-openai-api', payload)
});