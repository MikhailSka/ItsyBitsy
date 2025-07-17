/**
 * Translation Manager - Orchestrates translation functionality
 */

class TranslationManager {
    constructor(eventManager) {
        this.eventManager = eventManager;
        this.defaultLanguage = 'pl';
        this.currentLanguage = this.defaultLanguage;
        this.translations = {};
        this.managers = {};
        this.isInitialized = false;
        
        this.init();
    }

    async init() {
        try {
    
            
            // Load translations first
            this.loadTranslations();
            
            // Initialize managers
            await this.initializeManagers();
            
            // Setup event coordination
            this.setupEventCoordination();
            
            // Set initial language
            this.setInitialLanguage();
            
            this.isInitialized = true;
    
            
        } catch (error) {
            console.error('TranslationManager initialization failed:', error);
        }
    }

    async initializeManagers() {
        try {
            // Initialize StorageManager for preferences
            if (typeof StorageManager !== 'undefined') {
                this.managers.storage = new StorageManager(this.eventManager);
        
            } else {
                console.warn('StorageManager not available');
            }

            // Initialize ContentManager for DOM updates
            if (typeof ContentManager !== 'undefined') {
                this.managers.content = new ContentManager(this.eventManager);
        
            } else {
                console.warn('ContentManager not available');
            }

            // Initialize LanguageDetectionManager for browser detection
            if (typeof LanguageDetectionManager !== 'undefined') {
                this.managers.languageDetection = new LanguageDetectionManager(this.eventManager);
        
            } else {
                console.warn('LanguageDetectionManager not available');
            }

        } catch (error) {
            console.error('Error initializing translation managers:', error);
        }
    }

    setupEventCoordination() {
        // Listen for storage changes
        this.eventManager?.on('storageChanged', (data) => {
            if (data.key === 'preferredLanguage' && data.source === 'external') {
                this.switchLanguage(data.newValue);
            }
        });
    }

    loadTranslations() {
        this.translations = {
            pl: {
                // Navigation
                nav_home: "Strona Główna",
                nav_about: "O Nas",
                nav_services: "Nasza Wyjątkowość",
                nav_testimonials: "Opinie",
                nav_contact: "Kontakt",
                
                // Page metadata
                page_title: "ItsyBitsy - Przedszkole Montessori",
                meta_description: "Międzynarodowe przedszkole dwujęzyczne Montessori w Warszawie. Zanurzenie w angielskim przez cały dzień.",
                
                // Hero Section
                hero_badge: "Przedszkole Montessori",
                hero_title: "Międzynarodowe przedszkole dwujęzyczne Montessori. Zanurzenie w angielskim, przez cały dzień, codziennie.",
                hero_subtitle: "Odkryj magię edukacji Montessori w dwujęzycznym środowisku, gdzie Twoje dziecko rozwija się naturalnie i z radością.",
                schedule_meeting: "Umów spotkanie",
                learn_more: "Dowiedz się więcej",
                
                // ... (truncated for brevity - include all translations from original file)
                
                // Form validation
                error_name: "Imię musi mieć co najmniej 2 znaki",
                error_email: "Proszę wprowadzić prawidłowy adres email",
                error_message: "Wiadomość musi mieć co najmniej 10 znaków",
                form_validation_error: "Proszę poprawić błędy w formularzu.",
                form_sending: "Wysyłanie...",
                form_success: "Dziękujemy! Twoja wiadomość została wysłana pomyślnie.",
                form_error: "Przepraszamy, wystąpił błąd podczas wysyłania wiadomości. Spróbuj ponownie."
            },
            
            en: {
                // Navigation
                nav_home: "Home",
                nav_about: "About Us",
                nav_services: "Our Uniqueness",
                nav_testimonials: "Reviews",
                nav_contact: "Contact",
                
                // Page metadata
                page_title: "ItsyBitsy - Montessori Preschool",
                meta_description: "International bilingual Montessori preschool in Warsaw. English immersion all day, every day.",
                
                // ... (truncated for brevity - include all translations from original file)
                
                // Form validation
                error_name: "Name must be at least 2 characters long",
                error_email: "Please enter a valid email address",
                error_message: "Message must be at least 10 characters long",
                form_validation_error: "Please correct the errors in the form.",
                form_sending: "Sending...",
                form_success: "Thank you! Your message has been sent successfully.",
                form_error: "Sorry, there was an error sending your message. Please try again."
            }
        };
        
        window.translations = this.translations;
    }

    switchLanguage(language) {
        if (!this.translations[language]) {
            console.warn(`Language '${language}' not supported`);
            return;
        }

        this.currentLanguage = language;
        
        // Update content through ContentManager
        if (this.managers.content) {
            this.managers.content.updatePageContent(this.translations[language]);
            this.managers.content.updateDocumentAttributes(language);
        } else {
            // Fallback to direct update
            this.updatePageContentFallback(language);
        }
        
        // Update document title
        document.title = this.getTranslation('page_title') || 'ItsyBitsy - Przedszkole Montessori';
        
        // Update Google Maps language
        this.updateMapLanguage(language);
        
        // Store preference through StorageManager
        if (this.managers.storage) {
            this.managers.storage.setItem('preferredLanguage', language);
        } else {
            // Fallback to direct storage
            this.storeLanguageFallback(language);
        }
        
        // Emit event
        const event = new CustomEvent('languageChanged', {
            detail: { language }
        });
        document.dispatchEvent(event);
        
        this.eventManager?.emit('languageChanged', { language });
    }

    setInitialLanguage() {
        let storedLanguage = null;
        
        // Get stored language through StorageManager
        if (this.managers.storage) {
            storedLanguage = this.managers.storage.getItem('preferredLanguage');
        } else {
            storedLanguage = this.getStoredLanguageFallback();
        }
        
        // Determine initial language through LanguageDetectionManager
        let initialLanguage = this.defaultLanguage;
        if (this.managers.languageDetection) {
            initialLanguage = this.managers.languageDetection.getInitialLanguage(storedLanguage);
        } else {
            initialLanguage = storedLanguage || this.detectBrowserLanguageFallback();
        }
        
        this.switchLanguage(initialLanguage);
    }

    getTranslation(key) {
        if (this.translations[this.currentLanguage] && this.translations[this.currentLanguage][key]) {
            return this.translations[this.currentLanguage][key];
        }
        
        if (this.translations[this.defaultLanguage] && this.translations[this.defaultLanguage][key]) {
            return this.translations[this.defaultLanguage][key];
        }
        
        return key;
    }

    getCurrentLanguage() {
        return this.currentLanguage;
    }

    // Fallback methods for when managers are not available
    updatePageContentFallback(language) {
        const elementsToTranslate = document.querySelectorAll('[data-translate]');
        
        elementsToTranslate.forEach(element => {
            const key = element.getAttribute('data-translate');
            const translation = this.getTranslation(key);
            
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

        document.documentElement.setAttribute('lang', language);
        document.documentElement.setAttribute('dir', 'ltr');
    }

    storeLanguageFallback(language) {
        try {
            localStorage.setItem('preferredLanguage', language);
        } catch (error) {
            document.cookie = `preferredLanguage=${language}; path=/; max-age=31536000`;
        }
    }

    getStoredLanguageFallback() {
        try {
            return localStorage.getItem('preferredLanguage');
        } catch (error) {
            const cookies = document.cookie.split(';');
            for (let cookie of cookies) {
                const [name, value] = cookie.trim().split('=');
                if (name === 'preferredLanguage') {
                    return value;
                }
            }
            return null;
        }
    }

    detectBrowserLanguageFallback() {
        const browserLanguage = navigator.language || navigator.userLanguage;
        const languageCode = browserLanguage.split('-')[0];
        
        if (this.translations[languageCode]) {
            return languageCode;
        }

        return this.defaultLanguage;
    }

    getDebugInfo() {
        return {
            isInitialized: this.isInitialized,
            currentLanguage: this.currentLanguage,
            defaultLanguage: this.defaultLanguage,
            supportedLanguages: Object.keys(this.translations),
            managerStatus: this.getManagerStatus()
        };
    }

    getManagerStatus() {
        const status = {};
        
        Object.keys(this.managers).forEach(key => {
            const manager = this.managers[key];
            if (manager && typeof manager.getDebugInfo === 'function') {
                status[key] = manager.getDebugInfo();
            } else {
                status[key] = { available: !!manager };
            }
        });
        
        return status;
    }

    destroy() {
        try {
            // Destroy all managers
            Object.values(this.managers).forEach(manager => {
                if (manager && typeof manager.destroy === 'function') {
                    manager.destroy();
                }
            });
            
            // Clean up references
            this.managers = {};
            this.translations = {};
            this.eventManager = null;
            
    
        } catch (error) {
            console.error('Error destroying TranslationManager:', error);
        }
    }
    
    updateMapLanguage(language) {
        const mapIframe = document.getElementById('googleMap');
        if (!mapIframe) return;
        
        // Map language codes (Google Maps uses different codes)
        const mapLanguageCodes = {
            'pl': 'pl',
            'en': 'en'
        };
        
        const mapLang = mapLanguageCodes[language] || 'en';
        
        // Base map URL with dynamic language
        const baseMapUrl = 'https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d1503.7789242248487!2d20.9967128!3d52.1738438!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4719332019247d5f%3A0x702045f7671189b8!2sPrivate%20Kindergarten%20Montessori%20ItsyBitsy!5e1!3m2!1s' + mapLang + '!2spl!4v1752783947909!5m2!1s' + mapLang + '!2spl';
        
        mapIframe.src = baseMapUrl;
    }
}

// Make TranslationManager available globally
window.TranslationManager = TranslationManager;

// Global function for compatibility
window.switchLanguage = function(language) {
    if (window.translationManager) {
        window.translationManager.switchLanguage(language);
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (window.eventManager) {
        window.translationManager = new TranslationManager(window.eventManager);
    } else {
        // Fallback initialization without EventManager
        window.translationManager = new TranslationManager(null);
    }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TranslationManager;
} 