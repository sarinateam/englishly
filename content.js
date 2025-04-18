// Create and inject the suggestion popup
const createSuggestionPopup = () => {
  console.log('Creating suggestion popup');
  const popup = document.createElement('div');
  popup.className = 'englishly-popup';
  popup.innerHTML = `
    <div class="englishly-popup-header">
      <div class="englishly-popup-title">Enhance Your Writing</div>
      <div class="englishly-popup-controls">
        <button class="englishly-minimize-btn" title="Minimize">_</button>
        <button class="englishly-close-btn" title="Close">×</button>
      </div>
    </div>
    <div class="englishly-popup-content">
      <div class="englishly-options">
        <div class="englishly-option-group">
          <h4>Writing Style</h4>
          <div class="englishly-tone-buttons">
            <button data-tone="formal">Formal</button>
            <button data-tone="casual">Casual</button>
            <button data-tone="informative">Informative</button>
          </div>
        </div>
        <div class="englishly-option-group">
          <h4>Quick Actions</h4>
          <div class="englishly-action-buttons">
            <button data-action="draft-email">Draft Email</button>
            <button data-action="fix-grammar">Fix Grammar</button>
            <button data-action="summarize">Summarize</button>
          </div>
        </div>
      </div>
      <div class="englishly-actions">
        <button class="englishly-enhance">Enhance</button>
        <button class="englishly-cancel">Cancel</button>
      </div>
    </div>
  `;
  document.body.appendChild(popup);
  console.log('Popup created and added to DOM');
  
  // Make the popup draggable
  makeDraggable(popup);
  
  return popup;
};

// Create and inject the floating icon
const createFloatingIcon = () => {
  console.log('Creating floating icon');
  const icon = document.createElement('div');
  icon.className = 'englishly-floating-icon';
  icon.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="#4CAF50"/>
      <path d="M7 14L12 9L17 14" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;
  document.body.appendChild(icon);
  console.log('Floating icon created and added to DOM');
  
  // Make the icon draggable
  makeDraggable(icon);
  
  // Add click event to show popup
  icon.addEventListener('click', () => {
    if (suggestionPopup) {
      // If popup exists but is minimized, restore it
      if (suggestionPopup.classList.contains('englishly-minimized')) {
        suggestionPopup.classList.remove('englishly-minimized');
        suggestionPopup.style.display = 'block';
        
        // Position the popup near the icon
        const iconRect = icon.getBoundingClientRect();
        suggestionPopup.style.top = `${iconRect.top - suggestionPopup.offsetHeight - 10}px`;
        suggestionPopup.style.left = `${iconRect.left - suggestionPopup.offsetWidth + iconRect.width}px`;
      }
    } else {
      // If popup doesn't exist, create it
      suggestionPopup = createSuggestionPopup();
      positionPopup(lastActiveInput);
    }
  });
  
  return icon;
};

// Function to make an element draggable
const makeDraggable = (element) => {
  let isDragging = false;
  let offsetX, offsetY;
  
  // Add mousedown event to start dragging
  element.addEventListener('mousedown', (e) => {
    // Only allow dragging from the header or icon
    if (element.classList.contains('englishly-popup') && !e.target.closest('.englishly-popup-header')) {
      return;
    }
    
    isDragging = true;
    
    // Calculate the offset from the mouse position to the element's top-left corner
    const rect = element.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    
    // Add a class to indicate dragging
    element.classList.add('englishly-dragging');
  });
  
  // Add mousemove event to move the element
  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    // Calculate the new position
    const x = e.clientX - offsetX;
    const y = e.clientY - offsetY;
    
    // Update the element's position
    element.style.left = `${x}px`;
    element.style.top = `${y}px`;
  });
  
  // Add mouseup event to stop dragging
  document.addEventListener('mouseup', () => {
    if (!isDragging) return;
    
    isDragging = false;
    element.classList.remove('englishly-dragging');
  });
};

// Track the last active input element
let lastActiveInput = null;
let suggestionPopup = null;
let floatingIcon = null;
let extensionContextValid = true;

// Function to check if extension context is valid
const checkExtensionContext = () => {
  try {
    // Try to access chrome.runtime to check if context is valid
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
      return true;
    }
    return false;
  } catch (e) {
    console.error('Extension context error:', e);
    return false;
  }
};

// Listen for input events
document.addEventListener('focusin', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.contentEditable === 'true') {
    console.log('Input element focused:', e.target);
    lastActiveInput = e.target;
  }
});

// Handle text input
document.addEventListener('input', (e) => {
  console.log('Input event detected');
  if (e.target === lastActiveInput) {
    // Get text content properly, including innerText for better text extraction
    const text = e.target.value || e.target.textContent || e.target.innerText || '';
    console.log('Text length:', text.length);
    if (text.length > 20) { // Only show popup for substantial text
      console.log('Text is long enough to show popup');
      if (!suggestionPopup) {
        // Check if extension context is valid before creating popup
        if (checkExtensionContext()) {
          suggestionPopup = createSuggestionPopup();
          positionPopup(e.target);
        } else {
          console.error('Extension context is invalid, cannot create popup');
          // Try to reload the extension context
          reloadExtensionContext();
        }
      }
    }
  }
});

// Position the popup near the input element
const positionPopup = (inputElement) => {
  console.log('Positioning popup');
  if (!suggestionPopup) return;
  
  const rect = inputElement.getBoundingClientRect();
  
  // Calculate position
  let top = rect.bottom + window.scrollY + 10;
  let left = rect.left + window.scrollX;
  
  // Ensure popup stays within viewport
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const popupWidth = 300; // min-width from CSS
  const popupHeight = 250; // approximate height
  
  // Adjust horizontal position if needed
  if (left + popupWidth > viewportWidth) {
    left = viewportWidth - popupWidth - 10;
  }
  
  // Adjust vertical position if needed
  if (top + popupHeight > viewportHeight + window.scrollY) {
    // Position above the input if below would be off-screen
    top = rect.top + window.scrollY - popupHeight - 10;
  }
  
  // Apply position
  suggestionPopup.style.top = `${top}px`;
  suggestionPopup.style.left = `${left}px`;
  console.log('Popup positioned at:', top, left);
};

// Handle popup interactions
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('englishly-enhance')) {
    console.log('Enhance button clicked');
    const selectedTone = document.querySelector('.englishly-tone-buttons button.selected')?.dataset.tone;
    const selectedAction = document.querySelector('.englishly-action-buttons button.selected')?.dataset.action;
    console.log('Selected tone:', selectedTone);
    console.log('Selected action:', selectedAction);
    
    if ((selectedTone || selectedAction) && lastActiveInput) {
      const text = lastActiveInput.value || lastActiveInput.textContent;
      enhanceText(text, selectedTone, lastActiveInput, selectedAction);
    } else {
      console.log('No tone or action selected');
      alert('Please select a tone or action before enhancing.');
    }
  } else if (e.target.classList.contains('englishly-cancel')) {
    console.log('Cancel button clicked');
    suggestionPopup?.remove();
    suggestionPopup = null;
  } else if (e.target.classList.contains('englishly-minimize-btn')) {
    console.log('Minimize button clicked');
    if (suggestionPopup) {
      suggestionPopup.classList.add('englishly-minimized');
      suggestionPopup.style.display = 'none';
      
      // Show a notification that the popup is minimized
      const notification = document.createElement('div');
      notification.className = 'englishly-notification';
      notification.textContent = 'Englishly minimized. Click the icon to restore.';
      document.body.appendChild(notification);
      
      // Remove the notification after 3 seconds
      setTimeout(() => {
        notification.classList.add('englishly-notification-fade');
        setTimeout(() => {
          notification.remove();
        }, 500);
      }, 3000);
    }
  } else if (e.target.classList.contains('englishly-close-btn')) {
    console.log('Close button clicked');
    suggestionPopup?.remove();
    suggestionPopup = null;
  } else if (e.target.matches('.englishly-tone-buttons button')) {
    console.log('Tone button clicked:', e.target.dataset.tone);
    document.querySelectorAll('.englishly-tone-buttons button').forEach(btn => btn.classList.remove('selected'));
    e.target.classList.add('selected');
    // Clear action selection when tone is selected
    document.querySelectorAll('.englishly-action-buttons button').forEach(btn => btn.classList.remove('selected'));
  } else if (e.target.matches('.englishly-action-buttons button')) {
    console.log('Action button clicked:', e.target.dataset.action);
    document.querySelectorAll('.englishly-action-buttons button').forEach(btn => btn.classList.remove('selected'));
    e.target.classList.add('selected');
    // Clear tone selection when action is selected
    document.querySelectorAll('.englishly-tone-buttons button').forEach(btn => btn.classList.remove('selected'));
  }
});

// Function to reload extension context
const reloadExtensionContext = () => {
  console.log('Attempting to reload extension context');
  // Remove any existing popup
  if (suggestionPopup) {
    suggestionPopup.remove();
    suggestionPopup = null;
  }
  
  // Try to reload the page after a short delay
  setTimeout(() => {
    console.log('Reloading page to restore extension context');
    window.location.reload();
  }, 1000);
};

// Function to enhance text using AI
const enhanceText = async (text, tone, inputElement, action) => {
  console.log('Enhancing text with tone:', tone, 'and action:', action);
  try {
    // Check if extension context is valid
    if (!checkExtensionContext()) {
      console.error('Extension context is invalid, cannot enhance text');
      alert('Extension context is invalid. Please reload the page and try again.');
      reloadExtensionContext();
      return;
    }
    
    // Check if chrome.runtime is available
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      console.log('Sending message to background script');
      
      let signature = '';
      let contentToEnhance = text;
      
      // Check if this is likely an email (contains common email signature markers)
      const isEmail = /(gmail\.com|outlook\.com|yahoo\.com|hotmail\.com|mail\.com|email\.com|@)/i.test(text) || 
                     /(Dear|Hello|Hi|Regards|Best|Sincerely|Thanks|Thank you)/i.test(text);
      
      if (isEmail) {
        console.log('Email content detected, attempting to preserve signature');
        
        // For rich text editors (contentEditable elements)
        if (inputElement.contentEditable === 'true') {
          // Clone the input element to work with its content
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = inputElement.innerHTML;
          
          // First try to find signature with name and title pattern
          const nameTitlePattern = /([A-Za-z\s]+(?:Project Manager|Manager|Director|CEO|CTO|CFO|COO|President|Vice President|VP|Head|Lead|Senior|Junior|Associate|Consultant|Engineer|Developer|Designer|Analyst|Architect|Specialist|Expert|Officer|Coordinator|Administrator|Admin|Assistant|Executive|Officer|Officer|Representative|Rep)[\s\S]*?--[\s\S]*$)/i;
          const nameTitleMatch = tempDiv.innerHTML.match(nameTitlePattern);
          
          if (nameTitleMatch) {
            console.log('Signature detected with name and title pattern');
            signature = nameTitleMatch[0];
            contentToEnhance = tempDiv.innerHTML.substring(0, nameTitleMatch.index).trim();
          } else {
            // If no name-title pattern found, try just the "--" delimiter
            const doubleDashIndex = tempDiv.innerHTML.lastIndexOf('--');
            if (doubleDashIndex !== -1) {
              console.log('Signature detected with -- delimiter');
              signature = tempDiv.innerHTML.substring(doubleDashIndex);
              contentToEnhance = tempDiv.innerHTML.substring(0, doubleDashIndex).trim();
            } else {
              // If no "--" found, try other delimiters
              const signatureDelimiters = ['++', '__', '||'];
              let signatureStartIndex = -1;
              
              for (const delimiter of signatureDelimiters) {
                const delimiterIndex = tempDiv.innerHTML.lastIndexOf(delimiter);
                if (delimiterIndex !== -1) {
                  signatureStartIndex = delimiterIndex;
                  break;
                }
              }
              
              // If still no signature found, try common signature phrases
              if (signatureStartIndex === -1) {
                const signaturePhrases = [
                  'Thanks & Regards',
                  'Best regards',
                  'Regards',
                  'Sincerely',
                  'Thanks',
                  'Thank you',
                  'Cheers',
                  'Yours truly',
                  'Yours sincerely',
                  'Yours faithfully',
                  'Cordially',
                  'Warm regards',
                  'Kind regards'
                ];
                
                for (const phrase of signaturePhrases) {
                  const phraseIndex = tempDiv.innerHTML.lastIndexOf(phrase);
                  if (phraseIndex !== -1) {
                    signatureStartIndex = phraseIndex;
                    break;
                  }
                }
              }
              
              // If signature found with other methods, split the content
              if (signatureStartIndex !== -1) {
                signature = tempDiv.innerHTML.substring(signatureStartIndex);
                contentToEnhance = tempDiv.innerHTML.substring(0, signatureStartIndex).trim();
              }
            }
          }
          
          // Clean up any broken HTML tags in the signature
          signature = signature.replace(/<[^>]*$/g, '');
        } else {
          // For regular input/textarea elements
          // First try to find signature with name and title pattern
          const nameTitlePattern = /([A-Za-z\s]+(?:Project Manager|Manager|Director|CEO|CTO|CFO|COO|President|Vice President|VP|Head|Lead|Senior|Junior|Associate|Consultant|Engineer|Developer|Designer|Analyst|Architect|Specialist|Expert|Officer|Coordinator|Administrator|Admin|Assistant|Executive|Officer|Officer|Representative|Rep)[\s\S]*?--[\s\S]*$)/i;
          const nameTitleMatch = text.match(nameTitlePattern);
          
          if (nameTitleMatch) {
            console.log('Signature detected with name and title pattern');
            signature = nameTitleMatch[0];
            contentToEnhance = text.substring(0, nameTitleMatch.index).trim();
          } else {
            // If no name-title pattern found, try just the "--" delimiter
            const doubleDashIndex = text.lastIndexOf('--');
            if (doubleDashIndex !== -1) {
              console.log('Signature detected with -- delimiter');
              signature = text.substring(doubleDashIndex);
              contentToEnhance = text.substring(0, doubleDashIndex).trim();
            } else {
              // If no "--" found, use the existing text-based signature detection
              const signaturePatterns = [
                // Specific pattern for "Thanks & Regards" followed by name and title
                /(Thanks & Regards|Thanks and Regards|Thanks,\s*Regards)[\s\S]*?(Project Manager|Manager|Director|CEO|CTO|CFO|COO|President|Vice President|VP|Head|Lead|Senior|Junior|Associate|Consultant|Engineer|Developer|Designer|Analyst|Architect|Specialist|Expert|Officer|Coordinator|Administrator|Admin|Assistant|Executive|Officer|Officer|Representative|Rep)[\s\S]*$/i,
                // Standard signature delimiter
                /(--|\+\+|__|\|\|)\s*\n[\s\S]*$/,
                // Common signature phrases
                /(Best regards|Regards|Sincerely|Thanks|Thank you|Cheers|Yours truly|Yours sincerely|Yours faithfully|Cordially|Warm regards|Kind regards)[\s\S]*$/i,
                // HTML signature (if in rich text editor)
                /<div class="signature|id="signature"|class="signature"[\s\S]*$/i,
                // Look for common signature elements
                /(www\.|http:\/\/|https:\/\/|@)[\s\S]*$/i,
                // Additional patterns for common signature formats
                /(Mobile|Phone|Tel|Fax|Email|E-mail|Web|Website)[\s\S]*$/i,
                /(Company|Inc\.|LLC|Ltd\.|Limited|Corp\.|Corporation)[\s\S]*$/i,
                /(Address|Street|Avenue|Road|Boulevard|Lane|Drive|Way)[\s\S]*$/i,
                // Look for multiple consecutive lines with contact information
                /(?:[\w\.-]+@[\w\.-]+\.\w+|[\+]?[\d\s\-\(\)]+|www\.[\w\.-]+\.\w+)[\s\S]*$/i
              ];
              
              // Try each pattern
              for (const pattern of signaturePatterns) {
                const match = text.match(pattern);
                if (match) {
                  console.log('Signature detected with pattern:', pattern);
                  signature = match[0];
                  contentToEnhance = text.substring(0, match.index).trim();
                  break;
                }
              }
            }
          }
        }
      }
      
      console.log('Content to enhance:', contentToEnhance);
      console.log('Signature to preserve:', signature);
      
      try {
        const response = await chrome.runtime.sendMessage({
          action: 'enhanceText',
          text: contentToEnhance,
          tone: tone,
          enhanceAction: action
        });
        console.log('Response received:', response);

        if (response.enhancedText && inputElement) {
          console.log('Updating input with enhanced text');
          
          if (inputElement.contentEditable === 'true') {
            // For rich text editors, preserve HTML formatting
            let enhancedContent = response.enhancedText;
            
            // Add line breaks after greetings
            enhancedContent = enhancedContent.replace(/(Hello|Hi|Dear|Greetings)\s+([^<]*)/gi, '$1 $2<br><br>');
            
            // Add line breaks after sentences
            enhancedContent = enhancedContent.replace(/([.!?])\s+/g, '$1<br><br>');
            
            // Add the signature with proper spacing
            inputElement.innerHTML = enhancedContent + (signature ? '<br><br>' + signature : '');
          } else {
            // For regular input/textarea elements
            let enhancedText = response.enhancedText;
            
            // Add line breaks after greetings
            enhancedText = enhancedText.replace(/(Hello|Hi|Dear|Greetings)\s+([^\n]*)/gi, '$1 $2\n\n');
            
            // Add line breaks after sentences
            enhancedText = enhancedText.replace(/([.!?])\s+/g, '$1\n\n');
            
            // Add the signature with proper spacing
            enhancedText = enhancedText + (signature ? '\n\n' + signature : '');
            
            if (inputElement.tagName === 'INPUT' || inputElement.tagName === 'TEXTAREA') {
              inputElement.value = enhancedText;
            } else {
              inputElement.textContent = enhancedText;
            }
          }
        } else if (response.error) {
          console.error('Error from background script:', response.error);
          alert('Error: ' + response.error);
        }
      } catch (error) {
        console.error('Error sending message to background script:', error);
        if (error.message.includes('Extension context invalidated')) {
          alert('Extension context was invalidated. Please reload the page and try again.');
          reloadExtensionContext();
        } else {
          alert('Error: ' + error.message);
        }
      }
    } else {
      console.error('chrome.runtime is not available');
      alert('Extension communication error. Please reload the page and try again.');
      reloadExtensionContext();
    }
    
    suggestionPopup?.remove();
    suggestionPopup = null;
  } catch (error) {
    console.error('Error enhancing text:', error);
    if (error.message.includes('Extension context invalidated')) {
      alert('Extension context was invalidated. Please reload the page and try again.');
      reloadExtensionContext();
    } else {
      alert('Error: ' + error.message);
    }
  }
};

// Initialize the extension
const initializeExtension = () => {
  console.log('Initializing extension');
  
  // Create the floating icon
  floatingIcon = createFloatingIcon();
  
  // Position the icon in the bottom right corner
  floatingIcon.style.bottom = '20px';
  floatingIcon.style.right = '20px';
};

// Log that content script is loaded
console.log('Englishly content script loaded');

// Initialize the extension
initializeExtension();

// Listen for extension context invalidation
window.addEventListener('unload', () => {
  console.log('Page unloading, extension context may be invalidated');
}); 