/**
 * Content Manager - Handles DOM content updates with translations
 */

class ContentManager {
    constructor(eventManager) {
        this.eventManager = eventManager;
        this.isInitialized = false;
        
        this.init();
    }

    init() {
        try {
            this.isInitialized = true;
    
        } catch (error) {
            console.error('ContentManager initialization failed:', error);
        }
    }

    updatePageContent(translations) {
        const elementsToTranslate = document.querySelectorAll('[data-translate]');
        
        elementsToTranslate.forEach(element => {
            const key = element.getAttribute('data-translate');
            const translation = translations[key];
            
            if (translation) {
                if (element.tagName === 'INPUT' && element.type === 'submit') {
                    element.value = translation;
                } else if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                    element.placeholder = translation;
                } else if (element.tagName === 'TITLE') {
                    element.textContent = translation;
                } else {
                    element.textContent = translation;
                }
            }
        });
    }

    updateDocumentAttributes(language) {
        document.documentElement.setAttribute('lang', language);
        document.documentElement.setAttribute('dir', 'ltr');
    }

    destroy() {
        this.eventManager = null;

    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ContentManager;
} 