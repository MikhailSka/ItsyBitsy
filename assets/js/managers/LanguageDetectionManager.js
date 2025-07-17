/**
 * Language Detection Manager - Handles browser language detection logic
 * Follows Single Responsibility Principle by focusing solely on language detection
 * File path: assets/js/managers/LanguageDetectionManager.js
 */

class LanguageDetectionManager {
    constructor(eventManager) {
        this.eventManager = eventManager;
        this.supportedLanguages = ['pl', 'en'];
        this.defaultLanguage = 'pl';
        this.isInitialized = false;
        
        this.init();
    }

    init() {
        try {
            this.isInitialized = true;
            console.log('LanguageDetectionManager initialized successfully');
        } catch (error) {
            console.error('LanguageDetectionManager initialization failed:', error);
        }
    }

    detectBrowserLanguage() {
        const browserLanguage = navigator.language || navigator.userLanguage;
        const languageCode = browserLanguage.split('-')[0];
        
        if (this.supportedLanguages.includes(languageCode)) {
            return languageCode;
        }
        
        return this.defaultLanguage;
    }

    getInitialLanguage(storedLanguage) {
        if (storedLanguage && this.supportedLanguages.includes(storedLanguage)) {
            return storedLanguage;
        }

        const browserLanguage = this.detectBrowserLanguage();
        return browserLanguage || this.defaultLanguage;
    }

    destroy() {
        this.eventManager = null;
        console.log('LanguageDetectionManager destroyed successfully');
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = LanguageDetectionManager;
} 