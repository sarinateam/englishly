// Get prompt for specific action
function getPromptForAction(action) {
  const prompts = {
    'Improve Sentence': "You are an expert writing assistant. Your task is to improve the given text by enhancing its clarity, coherence, and overall quality while maintaining the original meaning. Make it more professional and engaging.",
    'Correct Grammar': "You are an expert in english grammer. Correct the grammar of the following text while preserving its original meaning. Ensure proper punctuation, capitalization, and sentence structure. Do not change the tone or style unless necessary. Keep the formatting clear and natural.",
    'Make it Professional': "Please correct the grammar, punctuation, and sentence structure of the following text to ensure it is clear, polished, and professional. Maintain the original meaning and intent.",
    'Draft an Email': "You are a professional email writer. Your task is to draft a well-formatted email from the given content. Ensure correct spacing and punctuation. Exclude the subject line and signature."
    // Add more actions and their prompts here
  };
  
  return prompts[action] || "You are a helpful assistant that can improve text.";
}

// Call OpenAI API
async function callOpenAI(text, action) {
  try {
    const apiKeyData = await chrome.storage.sync.get('openaiApiKey');
    
    if (!apiKeyData.openaiApiKey) {
      throw new Error('OpenAI API key is not set. Please set it in the extension options.');
    }
    
    console.log('Making API call with action:', getPromptForAction(action));
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKeyData.openaiApiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4", // or another model
        messages: [
          {
            role: "system",
            content: getPromptForAction(action)
          },
          {
            role: "user",
            content: `Please process the following text: "${text}"`
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    console.log('OpenAI API Response:', data);
    
    if (!data.choices || !data.choices.length || !data.choices[0].message) {
      console.error('Unexpected API response format:', data);
      throw new Error('Unexpected API response format');
    }
    
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error in callOpenAI:', error);
    throw error;
  }
}

// Listen for messages from the content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'callOpenAI') {
    callOpenAI(request.text, request.actionType)
      .then(response => sendResponse({ success: true, data: response }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Will respond asynchronously
  }
}); 