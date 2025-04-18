# Englishly - AI Writing Enhancement Extension

Englishly is a browser extension that enhances your writing in real-time using AI. It provides suggestions to improve your text based on different tones and writing styles.

## Features

- **Real-time Writing Enhancement**: Get AI-powered suggestions as you type
- **Multiple Writing Tones**: Choose from formal, casual, or informative writing styles
- **Signature Preservation**: Automatically detects and preserves email signatures
- **Context-Aware**: Works across various platforms including email clients, document editors, and more
- **User-Friendly Interface**: Simple popup interface with intuitive controls

## Installation

### Chrome Web Store
1. Visit the Chrome Web Store (link coming soon)
2. Click "Add to Chrome"
3. Confirm the installation

### Manual Installation (Developer Mode)
1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension directory

## Usage

1. Start typing in any text field on a webpage
2. When you've typed enough text (20+ characters), the Englishly popup will appear
3. Select your preferred writing tone (formal, casual, or informative)
4. Click "Enhance" to get AI-powered suggestions
5. The enhanced text will replace your original text while preserving any signatures

## Supported Platforms

- Gmail
- Outlook
- Google Docs
- Microsoft Word Online
- And many other text editors and email clients

## Development

### Project Structure
- `manifest.json`: Extension configuration
- `background.js`: Background service worker
- `content.js`: Content script injected into web pages
- `popup.html` & `popup.js`: Extension popup interface
- `styles.css`: Styling for the extension

### Building
No build step is required. The extension can be loaded directly in developer mode.

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

[MIT License](LICENSE)

## Support

For support, feature requests, or bug reports, please open an issue on the GitHub repository. 