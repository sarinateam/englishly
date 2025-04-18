let actionPopup = null;
let resultPopup = null;
let storedSelectionInfo = null;

// Actions available in the first popup
const ACTIONS = {
  IMPROVE: 'Improve Sentence',
  GRAMMAR: 'Correct Grammar',
  PROFESSIONAL: 'Make it Professional',
  EMAIL: 'Draft an Email'
};

// --- Popup Creation Functions ---

function createActionPopup() {
  if (actionPopup) actionPopup.remove(); // Remove existing

  actionPopup = document.createElement('div');
  actionPopup.className = 'textlyai-action-popup';

  Object.values(ACTIONS).forEach(actionText => {
    const button = document.createElement('button');
    button.textContent = actionText;
    button.addEventListener('click', () => handleActionClick(actionText));
    actionPopup.appendChild(button);
  });

  document.body.appendChild(actionPopup);
}

function createResultPopup(originalText, improvedText, storedSelectionInfo) {

  // Remove existing popup and overlay if they exist
  hideResultPopup();

  // Create overlay if it doesn't exist
  let overlay = document.querySelector('.textlyai-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'textlyai-overlay';
    document.body.appendChild(overlay);
  }

  // Capture the current selection info for the click handler
  const currentSelectionInfo = storedSelectionInfo;

  // Create new result popup
  resultPopup = document.createElement('div');
  resultPopup.className = 'textlyai-result-popup';
  resultPopup.innerHTML = `
    <div>
      <label>Original:</label>
      <div class="original-text">${escapeHtml(originalText)}</div>
    </div>
    <div>
      <label>Suggestion:</label>
      <div class="improved-text">${escapeHtml(improvedText)}</div>
    </div>
    <div class="actions">
      <button class="close-button">Close</button>
      <button class="copy-button">Copy</button>
      <button class="replace-button">Replace</button>
    </div>
  `;

  const replaceButton = resultPopup.querySelector('.replace-button');
  const copyButton = resultPopup.querySelector('.copy-button');
  const closeButton = resultPopup.querySelector('.close-button');

  replaceButton.addEventListener('click', () => handleReplaceClick(currentSelectionInfo, improvedText)); 

  // Add listener for Copy button
  copyButton.addEventListener('click', () => {
    navigator.clipboard.writeText(improvedText)
      .then(() => {
        copyButton.textContent = 'Copied!'; // Provide feedback
        setTimeout(() => {
          copyButton.textContent = 'Copy';
        }, 1500);
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
        // Optionally show an error to the user
      });
  });

  // Add listener for Close button
  closeButton.addEventListener('click', () => {
      hidePopups();
      // No need to clear storedSelectionInfo here, hidePopups does it
  });

  // Add click event to overlay to close popup
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) {
      hidePopups();
      // No need to clear storedSelectionInfo here, hidePopups does it
    }
  });

  document.body.appendChild(resultPopup);
}

// --- Event Handlers ---

function handleMouseUp(event) {
  setTimeout(() => {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    hidePopups();

    if (selectedText.length > 0) {
      const target = event.target;
      if (
        target.isContentEditable ||
        target.nodeName === 'TEXTAREA' ||
        (target.nodeName === 'INPUT' && /^(text|search|url|tel|email|password)$/i.test(target.type))
      ) {
        // Store complete selection information
        storedSelectionInfo = {
          selectedText,
          targetElement: target,
          isContentEditable: target.isContentEditable,
          selectionStart: target.selectionStart,
          selectionEnd: target.selectionEnd,
          value: target.value,
          range: selection.getRangeAt(0).cloneRange()
        };
        
        showActionPopup(selection);
      }
    }
  }, 100);
}

async function handleActionClick(action) {
  if (!storedSelectionInfo) return;

  const originalText = storedSelectionInfo.selectedText;
  hideActionPopup();

  // Show a loading indicator
  const loadingPopup = document.createElement('div');
  loadingPopup.className = 'textlyai-loading-popup';
  loadingPopup.innerHTML = `
    <div class="loading-spinner"></div>
    <div class="loading-text">Processing your request...</div>
  `;
  document.body.appendChild(loadingPopup);
  
  // Position the loading popup
  const rect = storedSelectionInfo.range.getBoundingClientRect();
  loadingPopup.style.top = `${window.scrollY + rect.top}px`;
  loadingPopup.style.left = `${window.scrollX + rect.left}px`;

  const currentSelectionInfos = storedSelectionInfo; // snapshot
  // Send a message to the background script to call the OpenAI API
  chrome.runtime.sendMessage(
    { action: 'callOpenAI', text: originalText, actionType: action },
    response => {
      loadingPopup.remove();
      
      if (response && response.success) {
        showResultPopup(originalText, response.data, currentSelectionInfos);
      } else {
        const errorMessage = response && response.error ? response.error : 'An unknown error occurred';
        console.error('Error calling OpenAI API:', errorMessage);
        
        const errorPopup = document.createElement('div');
        errorPopup.className = 'textlyai-error-popup';
        errorPopup.innerHTML = `
          <div class="error-icon">⚠️</div>
          <div class="error-message">${escapeHtml(errorMessage)}</div>
          <div class="error-actions">
            <button class="error-button">OK</button>
          </div>
        `;
        document.body.appendChild(errorPopup);
        
        errorPopup.style.top = `${window.scrollY + rect.top}px`;
        errorPopup.style.left = `${window.scrollX + rect.left}px`;
        
        const okButton = errorPopup.querySelector('.error-button');
        okButton.addEventListener('click', () => {
          errorPopup.remove();
        });
      }
    }
  );
}

function handleReplaceClick(selectionInfo, newText) {
  
  if (!selectionInfo || !selectionInfo.targetElement) {
    console.error('Missing target element info for replacement.');
    hidePopups();
    storedSelectionInfo = null; 
    return;
  }

  const { targetElement, selectedText: originalText } = selectionInfo;
  let success = false;

  try {
    if (targetElement.isContentEditable) {
      // For contentEditable, finding and replacing text reliably without breaking
      // HTML can be complex. Let's try a simple textContent approach first.
      // A more robust solution might involve traversing the DOM within the range.
      const currentContent = targetElement.innerHTML; // Use innerHTML to potentially preserve structure
      const index = currentContent.indexOf(originalText);

      if (index !== -1) {
        // Simple replacement - might break structure if originalText spans tags.
        targetElement.innerHTML = currentContent.substring(0, index) + newText + currentContent.substring(index + originalText.length);
        success = true;
      } else {
          // Fallback: Try using the range if available (less reliable after delay)
          try {
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(selectionInfo.range);
            if (document.queryCommandSupported('insertText')) {
                document.execCommand('insertText', false, newText);
                success = true;
            } else {
                 console.warn('Fallback execCommand failed: insertText not supported or range invalid.');
            }
          } catch (rangeError) {
               console.warn('Fallback execCommand failed due to range error:', rangeError);
          }
      }
      
      if (!success) {
          console.error('Could not replace text in contentEditable element.');
      }
    } 
    else if (targetElement.nodeName === 'TEXTAREA' || targetElement.nodeName === 'INPUT') {
      const currentValue = targetElement.value;
      const index = currentValue.indexOf(originalText);

      if (index !== -1) {
        // Found the original text, replace the first occurrence
        // Using setRangeText is often better for undo/redo and events
        targetElement.focus(); // Ensure element is focused for setRangeText
        targetElement.setSelectionRange(index, index + originalText.length);
        targetElement.setRangeText(newText);
        
        // Manually dispatch events as setRangeText might not do it consistently
        targetElement.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
        targetElement.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
        success = true;
      } else {
        console.error('Could not find original text in input/textarea value:', originalText);
      }
    }
  } catch (error) {
    console.error('Error during text-based replacement:', error);
  }

  hidePopups();
  storedSelectionInfo = null; // Clear the global stored selection after replacement attempt
}

function handleClickOutside(event) {
  // If clicking outside all relevant elements
  if (
    (!actionPopup || !actionPopup.contains(event.target)) &&
    (!resultPopup || !resultPopup.contains(event.target)) &&
    (!storedSelectionInfo || event.target !== storedSelectionInfo.targetElement)
  ) {
    hidePopups(); // This will now clear storedSelectionInfo
  }
}

// --- Popup Visibility and Positioning ---

function showActionPopup(selection) {
  if (!actionPopup) {
    createActionPopup();
  }

  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  actionPopup.style.display = 'block';
  actionPopup.style.top = `${window.scrollY + rect.top}px`;
  actionPopup.style.left = `${window.scrollX + rect.left}px`;
}

function showResultPopup(originalText, improvedText, storedSelectionInfo) {
  createResultPopup(originalText, improvedText, storedSelectionInfo);
  
  // Show overlay and popup
  const overlay = document.querySelector('.textlyai-overlay');
  if (overlay) {
    overlay.style.display = 'block';
  }
  if (resultPopup) {
    resultPopup.style.display = 'block';
  }
}

function hideActionPopup() {
  if (actionPopup) {
    actionPopup.style.display = 'none';
  }
}

function hideResultPopup() {
  if (resultPopup) {
    resultPopup.remove();
    resultPopup = null;
  }
  const overlay = document.querySelector('.textlyai-overlay');
  if (overlay) {
    overlay.remove();
  }
}

function hidePopups() {
  hideActionPopup();
  hideResultPopup();
  storedSelectionInfo = null; // Clear selection info when popups are hidden
}

// --- Utility Functions ---

// Basic HTML escaping
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
 }

// --- Event Listeners Initialization ---

document.addEventListener('mouseup', handleMouseUp);
document.addEventListener('mousedown', handleClickOutside); // Use mousedown to catch clicks before mouseup potentially triggers a new selection