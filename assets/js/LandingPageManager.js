/**
 * LandingPageManager - Main orchestrator for the landing page
 */

class LandingPageManager {
    constructor() {
        this.managers = new Map();
        this.initialized = false;
        this.currentLanguage = 'pl';
        this.init();
    }

    /**
     * Initialize the landing page manager and all sub-managers
     */
    init() {
        if (this.initialized) {
            console.warn('LandingPageManager already initialized');
            return;
        }

        try {
            // Initialize managers in dependency order
            this.initializeEventManager();
            this.initializeVideoManager();
            this.initializeAnimationManager();
            this.initializeScrollManager();
            this.initializeNavigationManager();
            this.initializeFormManager();
            
            // Setup inter-manager communication
            this.setupManagerCommunication();
            
            // Setup language management
            this.setupLanguageManagement();
            
            // Final initialization steps
            this.finalizeInitialization();
            
            this.initialized = true;
    
            
        } catch (error) {
            console.error('Failed to initialize LandingPageManager:', error);
            this.handleInitializationError(error);
        }
    }

    /**
     * Initialize EventManager - Central communication hub
     */
    initializeEventManager() {
        if (typeof EventManager === 'undefined') {
            throw new Error('EventManager class not found. Please include EventManager.js');
        }
        
        const eventManager = new EventManager();
        this.managers.set('event', eventManager);
        
        // Expose globally for other scripts
        window.eventManager = eventManager;
        

    }



    /**
     * Initialize VideoManager
     */
    initializeVideoManager() {
        if (typeof VideoManager === 'undefined') {
            console.warn('VideoManager class not found. Video functionality will be limited.');
            return;
        }
        
        const videoManager = new VideoManager(this.getManager('event'));
        this.managers.set('video', videoManager);
        

    }

    /**
     * Initialize AnimationManager
     */
    initializeAnimationManager() {
        if (typeof AnimationManager === 'undefined') {
            console.warn('AnimationManager class not found. Animation functionality will be limited.');
            return;
        }
        
        const animationManager = new AnimationManager(this.getManager('event'));
        this.managers.set('animation', animationManager);
        

    }

    /**
     * Initialize ScrollManager
     */
    initializeScrollManager() {
        if (typeof ScrollManager === 'undefined') {
            console.warn('ScrollManager class not found. Scroll effects will be limited.');
            return;
        }
        
        const scrollManager = new ScrollManager(this.getManager('event'));
        this.managers.set('scroll', scrollManager);
        

    }

    /**
     * Initialize NavigationManager
     */
    initializeNavigationManager() {
        if (typeof NavigationManager === 'undefined') {
            console.warn('NavigationManager class not found. Navigation functionality will be limited.');
            return;
        }
        
        const navigationManager = new NavigationManager(this.getManager('event'));
        this.managers.set('navigation', navigationManager);
        

    }

    /**
     * Initialize FormManager
     */
    initializeFormManager() {
        if (typeof FormManager === 'undefined') {
            console.warn('FormManager class not found. Form functionality will be limited.');
            return;
        }
        
        const formManager = new FormManager(
            this.getManager('event'),
            window.translationManager || null
        );
        this.managers.set('form', formManager);
        

    }

    /**
     * Setup communication between managers
     */
    setupManagerCommunication() {
        const eventManager = this.getManager('event');
        if (!eventManager) return;

        // Setup mobile menu integration
        eventManager.on('menuOpened', this.handleMobileMenuOpened.bind(this));
        eventManager.on('menuClosed', this.handleMobileMenuClosed.bind(this));
        
        // Setup form submission events
        eventManager.on('formSubmissionSuccess', this.handleFormSuccess.bind(this));
        eventManager.on('formSubmissionError', this.handleFormError.bind(this));
        
        // Setup video events
        eventManager.on('videoEvent', this.handleVideoEvent.bind(this));
        

        
        // Setup animation events
        eventManager.on('elementAnimated', this.handleElementAnimated.bind(this));
        

    }

    /**
     * Setup language management
     */
    setupLanguageManagement() {
        this.setupLanguageSwitcher();
        this.initializeLanguageDisplay();
        
        // Listen for language change events
        const eventManager = this.getManager('event');
        if (eventManager) {
            eventManager.on('languageChanged', this.handleLanguageChange.bind(this));
        }
    }

    /**
     * Setup language switcher
     */
    setupLanguageSwitcher() {
        const langToggle = document.getElementById('langToggle');
        const currentLangSpan = langToggle?.querySelector('.current-lang');
        
        if (!langToggle || !currentLangSpan) return;
        
        // Remove any existing event listeners by cloning
        langToggle.replaceWith(langToggle.cloneNode(true));
        const newLangToggle = document.getElementById('langToggle');
        const newCurrentLangSpan = newLangToggle?.querySelector('.current-lang');
        
        if (!newLangToggle || !newCurrentLangSpan) return;
        
        newLangToggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Get current language
            let currentLang = 'pl';
            if (window.translationManager && window.translationManager.getCurrentLanguage) {
                currentLang = window.translationManager.getCurrentLanguage();
            } else {
                currentLang = this.getStoredLanguage() || 'pl';
            }
            
            // Toggle language
            const newLanguage = currentLang === 'pl' ? 'en' : 'pl';
            
            // Update display immediately
            newCurrentLangSpan.textContent = newLanguage.toUpperCase();
            
            // Switch language
            this.switchLanguage(newLanguage);
        });
        

    }

    /**
     * Initialize language display
     */
    initializeLanguageDisplay() {
        const currentLangSpan = document.querySelector('.current-lang');
        if (!currentLangSpan) return;
        
        let initialLanguage = 'pl';
        
        if (window.translationManager && window.translationManager.getCurrentLanguage) {
            initialLanguage = window.translationManager.getCurrentLanguage();
        } else {
            initialLanguage = this.getStoredLanguage() || this.detectBrowserLanguage() || 'pl';
        }
        
        this.currentLanguage = initialLanguage;
        currentLangSpan.textContent = this.currentLanguage.toUpperCase();
        
        // Setup translation retry mechanism
        this.setupTranslationRetry();
    }

    /**
     * Setup translation retry mechanism
     */
    setupTranslationRetry() {
        let retries = 0;
        const maxRetries = 10;
        
        const tryInitializeTranslations = () => {
            if (window.translationManager && window.translationManager.switchLanguage) {
                window.translationManager.switchLanguage(this.currentLanguage);
                return true;
            } else if (retries < maxRetries) {
                retries++;
                setTimeout(tryInitializeTranslations, 200);
                return false;
            } else {
                console.warn('Translation manager not available after maximum retries');
                return false;
            }
        };
        
        setTimeout(tryInitializeTranslations, 100);
    }

    /**
     * Switch language
     * @param {string} newLanguage - New language code
     */
    switchLanguage(newLanguage) {
        this.currentLanguage = newLanguage;
        this.storeLanguage(newLanguage);
        
        // Use translation manager if available
        if (window.translationManager && window.translationManager.switchLanguage) {
            window.translationManager.switchLanguage(newLanguage);
        }
        
        // Emit language change event
        const eventManager = this.getManager('event');
        if (eventManager) {
            eventManager.emit('languageChanged', {
                language: newLanguage,
                previousLanguage: this.currentLanguage
            });
        }
        

    }

    /**
     * Finalize initialization
     */
    finalizeInitialization() {
        // Clear any loading states
        document.body.classList.remove('loading');
        
        // Clear focus states
        this.clearAllFocus();
        
        // Trigger initial load events
        this.triggerLoadEvents();
        
        // Setup global error handling
        this.setupGlobalErrorHandling();
        
        // Expose debug functions
        this.exposeDebugFunctions();
    }

    /**
     * Trigger load events
     */
    triggerLoadEvents() {
        const eventManager = this.getManager('event');
        if (eventManager) {
            // Trigger load event for all managers
            setTimeout(() => {
                eventManager.emit('load', {
                    timestamp: Date.now(),
                    source: 'LandingPageManager'
                });
            }, 100);
        }
    }

    /**
     * Setup global error handling
     */
    setupGlobalErrorHandling() {
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            this.handleGlobalError(event.error);
        });
        
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.handleGlobalError(event.reason);
        });
    }

    /**
     * Expose debug functions
     */
    exposeDebugFunctions() {
        // Expose diagnostic function for navigation
        window.diagnoseNavigation = (enableDebug = false) => {
            const navigationManager = this.getManager('navigation');
            if (navigationManager && navigationManager.diagnoseNavigation) {
                navigationManager.diagnoseNavigation(enableDebug);
            } else {
                console.error('NavigationManager not available or missing diagnoseNavigation method');
            }
        };
        
        // Expose general debug function
        window.debugLandingPage = () => {
            return this.getDebugInfo();
        };
        

    }

    /**
     * Handle mobile menu opened event
     */
    handleMobileMenuOpened(eventData) {

        
        // Pause videos when menu opens
        const videoManager = this.getManager('video');
        if (videoManager && videoManager.pauseAllVideos) {
            videoManager.pauseAllVideos();
        }
    }

    /**
     * Handle mobile menu closed event
     */
    handleMobileMenuClosed(eventData) {

    }

    /**
     * Handle form submission success
     */
    handleFormSuccess(eventData) {
        // Could trigger analytics events, notifications, etc.
    }

    /**
     * Handle form submission error
     */
    handleFormError(eventData) {
        console.error('Form submission error:', eventData.formId, eventData.error);
    }

    /**
     * Handle video events
     */
    handleVideoEvent(eventData) {
        // Could be used for analytics, performance monitoring, etc.
    }



    /**
     * Handle element animated events
     */
    handleElementAnimated(eventData) {

    }

    /**
     * Handle language change
     */
    handleLanguageChange(eventData) {
        this.currentLanguage = eventData.language;
        
        // Update language display
        const currentLangSpan = document.querySelector('.current-lang');
        if (currentLangSpan) {
            currentLangSpan.textContent = this.currentLanguage.toUpperCase();
        }
        

    }

    /**
     * Handle global errors
     */
    handleGlobalError(error) {
        // Log global errors for debugging
        console.error('Global application error:', error);
    }

    /**
     * Handle initialization error
     */
    handleInitializationError(error) {
        console.error('Initialization error details:', error);
        
        // Show user-friendly error message
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: #f44336;
            color: white;
            padding: 15px;
            border-radius: 5px;
            z-index: 10000;
            max-width: 300px;
        `;
        errorDiv.textContent = 'Some features may not work properly. Please refresh the page.';
        
        document.body.appendChild(errorDiv);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 10000);
    }

    /**
     * Get manager instance
     * @param {string} name - Manager name
     * @returns {Object|null} Manager instance
     */
    getManager(name) {
        return this.managers.get(name) || null;
    }

    /**
     * Check if manager exists
     * @param {string} name - Manager name
     * @returns {boolean} Manager exists
     */
    hasManager(name) {
        return this.managers.has(name);
    }

    /**
     * Store language preference
     */
    storeLanguage(language) {
        try {
            localStorage.setItem('preferredLanguage', language);
        } catch (error) {
            document.cookie = `preferredLanguage=${language}; path=/; max-age=31536000`;
        }
    }

    /**
     * Get stored language preference
     */
    getStoredLanguage() {
        try {
            return localStorage.getItem('preferredLanguage');
        } catch (error) {
            const cookies = document.cookie.split(';');
            for (let cookie of cookies) {
                const [name, value] = cookie.trim().split('=');
                if (name === 'preferredLanguage' && (value === 'pl' || value === 'en')) {
                    return value;
                }
            }
            return null;
        }
    }

    /**
     * Detect browser language
     */
    detectBrowserLanguage() {
        const browserLanguage = navigator.language || navigator.userLanguage;
        const languageCode = browserLanguage.split('-')[0];
        return (languageCode === 'pl' || languageCode === 'en') ? languageCode : null;
    }

    /**
     * Clear all focus states
     */
    clearAllFocus() {
        const focusedElements = document.querySelectorAll(':focus');
        focusedElements.forEach(element => {
            element.blur();
        });
    }

    /**
     * Get current status of all managers
     * @returns {Object} Status information
     */
    getManagerStatus() {
        const status = {};
        
        this.managers.forEach((manager, name) => {
            status[name] = {
                initialized: !!manager,
                hasDebugInfo: typeof manager.getDebugInfo === 'function'
            };
            
            if (status[name].hasDebugInfo) {
                try {
                    status[name].debugInfo = manager.getDebugInfo();
                } catch (error) {
                    status[name].debugError = error.message;
                }
            }
        });
        
        return status;
    }

    /**
     * Get comprehensive debug information
     * @returns {Object} Debug information
     */
    getDebugInfo() {
        return {
            initialized: this.initialized,
            currentLanguage: this.currentLanguage,
            managersCount: this.managers.size,
            managerStatus: this.getManagerStatus(),
            browserInfo: {
                userAgent: navigator.userAgent,
                language: navigator.language,
                viewport: {
                    width: window.innerWidth,
                    height: window.innerHeight
                }
            },
            performance: {
                loadTime: window.performance ? window.performance.now() : 'Not available',
                timing: window.performance && window.performance.timing ? {
                    navigationStart: window.performance.timing.navigationStart,
                    loadEventEnd: window.performance.timing.loadEventEnd,
                    totalLoadTime: window.performance.timing.loadEventEnd - window.performance.timing.navigationStart
                } : 'Not available'
            }
        };
    }

    /**
     * Cleanup all managers
     */
    cleanup() {

        
        // Cleanup all managers
        this.managers.forEach((manager, name) => {
            if (manager && typeof manager.cleanup === 'function') {
                try {
                    manager.cleanup();
                } catch (error) {
                    console.error(`Error cleaning up ${name} manager:`, error);
                }
            }
        });
        
        // Clear managers map
        this.managers.clear();
        
        // Reset state
        this.initialized = false;
        

    }

    /**
     * Reinitialize the landing page manager
     */
    reinitialize() {
        this.cleanup();
        setTimeout(() => {
            this.init();
        }, 100);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.landingPageManager = new LandingPageManager();

    } catch (error) {
        console.error('Failed to initialize LandingPageManager:', error);
    }
});

// WordPress integration
if (typeof jQuery !== 'undefined') {
    jQuery(document).ready(() => {

    });
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LandingPageManager;
} else {
    window.LandingPageManager = LandingPageManager;
} 