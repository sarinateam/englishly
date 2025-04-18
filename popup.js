document.addEventListener('DOMContentLoaded', () => {
  const apiKeyInput = document.getElementById('api-key');
  const saveButton = document.getElementById('save-key');
  const statusElement = document.getElementById('status');

  // Load saved API key
  chrome.storage.sync.get(['apiKey'], (result) => {
    if (result.apiKey) {
      apiKeyInput.value = result.apiKey;
    }
  });

  // Save API key
  saveButton.addEventListener('click', () => {
    const apiKey = apiKeyInput.value.trim();
    if (apiKey) {
      chrome.storage.sync.set({ apiKey }, () => {
        statusElement.textContent = 'API Key Saved';
        setTimeout(() => {
          statusElement.textContent = 'Active';
        }, 2000);
      });
    }
  });

  // Update status based on API key
  chrome.storage.sync.get(['apiKey'], (result) => {
    if (!result.apiKey) {
      statusElement.textContent = 'Inactive - API Key Required';
      statusElement.style.color = 'red';
    }
  });
}); 