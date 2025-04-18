// Log that background script is loaded
console.log('Englishly background script loaded');

// Function to enhance text using AI
const enhanceTextWithAI = async (text, tone, enhanceAction) => {
  console.log('Enhancing text with tone:', tone, 'and action:', enhanceAction);
  
  try {
    // Get API key from storage
    const result = await chrome.storage.sync.get(['apiKey']);
    const apiKey = result.apiKey;
    
    if (!apiKey) {
      console.error('API key not found');
      return { error: 'API key not found. Please set your API key in the extension options.' };
    }
    
    // Validate API key format
    if (!apiKey.startsWith('sk-')) {
      console.error('Invalid API key format');
      return { error: 'Invalid API key format. Please check your API key in the extension options.' };
    }
    
    // Prepare the prompt based on the tone and action
    let prompt = '';
    if (enhanceAction) {
      switch (enhanceAction) {
        case 'draft-email':
          prompt = `Draft a professional email based on the following context. Include a proper greeting, body, and closing. No need to include subject in the response, also please keep proper spacing and line breaks:\n\n${text}`;
          break;
        case 'fix-grammar':
          prompt = `Fix any grammar, spelling, or punctuation errors in the following text while maintaining the same meaning:\n\n${text}`;
          break;
        case 'summarize':
          prompt = `Summarize the following text concisely while maintaining the key points:\n\n${text}`;
          break;
      }
    } else if (tone) {
      switch (tone) {
        case 'formal':
          prompt = `Rewrite the following text in a formal tone, maintaining the same meaning but using more professional language:\n\n${text}`;
          break;
        case 'casual':
          prompt = `Rewrite the following text in a casual, friendly tone, maintaining the same meaning but using more conversational language:\n\n${text}`;
          break;
        case 'informative':
          prompt = `Rewrite the following text to be more informative and clear, maintaining the same meaning but using more descriptive language:\n\n${text}`;
          break;
        default:
          prompt = `Improve the following text while maintaining the same meaning:\n\n${text}`;
      }
    }
    
    console.log('Sending request to OpenAI API');
    
    // Make the API request
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful assistant that improves and elaborates text while maintaining the original meaning.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });
    
    // Check if the response is OK
    if (!response.ok) {
      const errorData = await response.json();
      console.error('API error:', errorData);
      
      // Handle specific error cases
      if (response.status === 401) {
        return { error: 'Invalid API key. Please check your API key in the extension options.' };
      } else if (response.status === 429) {
        return { error: 'Rate limit exceeded. Please try again later.' };
      } else {
        return { error: `API error: ${errorData.error?.message || 'Unknown error'}` };
      }
    }
    
    // Parse the response
    const data = await response.json();
    console.log('API response:', data);
    
    // Check if the response contains the expected data
    if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
      console.error('Unexpected API response format:', data);
      return { error: 'Unexpected API response format. Please try again.' };
    }
    
    // Return the enhanced text
    return { enhancedText: data.choices[0].message.content.trim() };
  } catch (error) {
    console.error('Error enhancing text:', error);
    
    // Handle specific error types
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      return { error: 'Network error. Please check your internet connection and try again.' };
    } else if (error.message.includes('Extension context invalidated')) {
      return { error: 'Extension context was invalidated. Please reload the page and try again.' };
    } else {
      return { error: `Error: ${error.message}` };
    }
  }
};

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received from content script:', request);
  
  if (request.action === 'enhanceText') {
    console.log('Enhancing text with tone:', request.tone, 'and action:', request.enhanceAction);
    
    // Handle the enhancement request
    enhanceTextWithAI(request.text, request.tone, request.enhanceAction)
      .then(response => {
        console.log('Sending response back to content script:', response);
        sendResponse(response);
      })
      .catch(error => {
        console.error('Error in message handler:', error);
        sendResponse({ error: `Error: ${error.message}` });
      });
    
    // Return true to indicate that the response will be sent asynchronously
    return true;
  }
});

// Listen for extension updates
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Extension installed or updated:', details.reason);
  
  if (details.reason === 'update') {
    console.log('Extension updated from version', details.previousVersion, 'to', chrome.runtime.getManifest().version);
  }
});

// Listen for extension unload
chrome.runtime.onSuspend.addListener(() => {
  console.log('Extension is being unloaded');
}); 