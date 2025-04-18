# Textly AI Content Enhancer Chrome Extension

This Chrome extension enhances selected text on web pages using the OpenAI API. It allows users to quickly improve sentences, correct grammar, make text more professional, or draft emails based on selected content.

## Features

*   **Action Popup:** Appears when text is selected in editable fields (inputs, textareas, contenteditable divs).
*   **AI Actions:** Offers options like "Improve Sentence", "Correct Grammar", "Make it Professional", and "Draft an Email".
*   **Result Popup:** Shows the original text and the AI-generated suggestion in a centered modal.
*   **Replace Functionality:** Allows replacing the original selected text with the AI suggestion directly on the page.
*   **Copy & Close:** Easily copy the suggestion or close the result popup.
*   **Configurable API Key:** Uses an options page to securely store the user's OpenAI API key.

## Installation

Since this extension is not yet published on the Chrome Web Store, you need to load it manually in Developer Mode:

1.  **Download or Clone:** Get the extension files onto your local machine.
2.  **Open Chrome Extensions:** Navigate to `chrome://extensions/` in your Chrome browser.
3.  **Enable Developer Mode:** Ensure the "Developer mode" toggle in the top-right corner is enabled.
4.  **Load Unpacked:** Click the "Load unpacked" button.
5.  **Select Directory:** Browse to and select the directory containing the extension's files (the one with `manifest.json` inside).
6.  The extension icon should now appear in your Chrome toolbar.

## Configuration

Before using the extension, you need to configure your OpenAI API key:

1.  **Right-click** the Textly AI extension icon in your Chrome toolbar.
2.  Select **"Options"**.
3.  Enter your valid **OpenAI API key** in the input field.
4.  Click **"Save"**.

*Note: Your API key is stored locally using Chrome's storage API. Ensure you protect your API key.* 

## Usage

1.  Go to any webpage with a text input field (`<input>`, `<textarea>`) or a content-editable area (`<div contenteditable="true">`).
2.  **Select** the text you want to modify.
3.  The **Action Popup** will appear near (usually above) the selected text.
4.  Click on the desired action (e.g., "Improve Sentence").
5.  A **Loading indicator** will appear briefly while communicating with the OpenAI API.
6.  The **Result Popup** will appear in the center of the screen, showing the original text and the AI suggestion.
7.  From the Result Popup, you can:
    *   Click **"Replace"** to substitute the original text on the page with the suggestion.
    *   Click **"Copy"** to copy the suggested text to your clipboard.
    *   Click **"Close"** or click the background overlay to dismiss the popup.

## Development Notes

*   Built using Manifest V3.
*   Uses content scripts to interact with web pages.
*   Uses background service worker for API calls.
*   Relies on `chrome.storage.sync` for API key storage.
*   Replace logic attempts text-based replacement for robustness. 