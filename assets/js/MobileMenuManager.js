/**
 * Mobile Menu Manager - Orchestrates mobile menu functionality using specialized managers
 * Follows Facade Pattern by coordinating TouchManager, AccessibilityManager, and DeviceOptimizationManager
 * File path: assets/js/MobileMenuManager.js
 */

class MobileMenuManager {
    constructor(eventManager) {
        this.eventManager = eventManager;
        this.isMenuOpen = false;
        this.isTransitioning = false;
        this.menuElements = {};
        this.managers = {};
        this.scrollY = 0;
        this.isInitialized = false;
        
        this.init();
    }

    /**
     * Initialize mobile menu manager and all sub-managers
     */
    async init() {
        try {
            console.log('Initializing MobileMenuManager...');
            
            // Setup DOM elements first
            this.setupElements();
            
            // Initialize managers in dependency order
            await this.initializeManagers();
            
            // Setup event coordination between managers
            this.setupEventCoordination();
            
            // Setup menu-specific functionality
            this.setupMenuFunctionality();
            
            // Setup resize handling
            this.setupResizeHandler();
            
            this.isInitialized = true;
            console.log('MobileMenuManager initialized successfully');
            
        } catch (error) {
            console.error('MobileMenuManager initialization failed:', error);
            this.handleInitializationError(error);
        }
    }

    /**
     * Setup DOM elements with error handling
     */
    setupElements() {
        this.menuElements = {
            toggle: document.getElementById('mobileMenuToggle'),
            menu: document.getElementById('navMenu'),
            overlay: null
        };
        
        if (!this.menuElements.toggle || !this.menuElements.menu) {
            console.warn('Mobile menu elements not found');
            return;
        }

        // Create overlay
        this.createMenuOverlay();
        
        console.log('Mobile menu elements setup complete');
    }

    /**
     * Create enhanced overlay
     */
    createMenuOverlay() {
        this.menuElements.overlay = document.querySelector('.mobile-menu-overlay');
        
        if (!this.menuElements.overlay) {
            this.menuElements.overlay = document.createElement('div');
            this.menuElements.overlay.className = 'mobile-menu-overlay';
            this.menuElements.overlay.setAttribute('aria-hidden', 'true');
            this.menuElements.overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100vh;
                background: rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(4px);
                z-index: 1029;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
            `;
            
            document.body.appendChild(this.menuElements.overlay);
        }
    }

    /**
     * Initialize all specialized managers
     */
    async initializeManagers() {
        try {
            // Initialize TouchManager for gesture and touch handling
            if (typeof TouchManager !== 'undefined') {
                this.managers.touch = new TouchManager(this.eventManager);
                console.log('TouchManager initialized');
            } else {
                console.warn('TouchManager not available');
            }

            // Initialize AccessibilityManager for a11y features
            if (typeof AccessibilityManager !== 'undefined') {
                this.managers.accessibility = new AccessibilityManager(this.eventManager);
                console.log('AccessibilityManager initialized');
            } else {
                console.warn('AccessibilityManager not available');
            }

            // Initialize DeviceOptimizationManager for device-specific optimizations
            if (typeof DeviceOptimizationManager !== 'undefined') {
                this.managers.deviceOptimization = new DeviceOptimizationManager(this.eventManager);
                console.log('DeviceOptimizationManager initialized');
            } else {
                console.warn('DeviceOptimizationManager not available');
            }

        } catch (error) {
            console.error('Error initializing managers:', error);
        }
    }

    /**
     * Setup event coordination between managers
     */
    setupEventCoordination() {
        // Listen for touch gestures to control menu
        this.eventManager.on('swipeRight', (data) => {
            if (data.canCloseMenu && this.isMenuOpen) {
                this.closeMenu();
            }
        });

        this.eventManager.on('swipeLeft', (data) => {
            if (data.canOpenMenu && !this.isMenuOpen) {
                this.openMenu();
            }
        });

        // Listen for escape key to close menu
        this.eventManager.on('escapePressed', () => {
            if (this.isMenuOpen) {
                this.closeMenu();
            }
        });

        // Listen for accessibility events
        this.eventManager.on('shortcutToggleMenu', () => {
            this.toggleMenu();
        });

        // Listen for device optimization events
        this.eventManager.on('orientationChanged', () => {
            if (this.isMenuOpen && window.innerWidth >= 768) {
                this.closeMenu();
            }
        });

        // Listen for scroll prevention events
        this.eventManager.on('scrollPreventionEnabled', () => {
            document.body.style.overflow = 'hidden';
        });

        this.eventManager.on('scrollPreventionDisabled', () => {
            document.body.style.overflow = '';
        });

        console.log('Event coordination setup complete');
    }

    /**
     * Setup menu-specific functionality
     */
    setupMenuFunctionality() {
        if (!this.menuElements.toggle || !this.menuElements.menu) return;

        // Toggle button click handler
        this.menuElements.toggle.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleMenu();
        });
        
        // Overlay click handler
        if (this.menuElements.overlay) {
            this.menuElements.overlay.addEventListener('click', () => {
                this.closeMenu();
            });
        }
        
        // Navigation links handler
        this.menuElements.menu.addEventListener('click', (event) => {
            this.handleNavClick(event);
        });

        console.log('Menu functionality setup complete');
    }

    /**
     * Setup resize handler
     */
    setupResizeHandler() {
        const handleResize = this.debounce(() => {
            const isDesktop = window.innerWidth >= 768;
            
            if (isDesktop && this.isMenuOpen) {
                this.closeMenu();
            }
        }, 250);
        
        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', () => {
            setTimeout(handleResize, 500);
        });
    }

    /**
     * Toggle menu state
     */
    toggleMenu() {
        // Only allow menu toggle on mobile devices
        if (window.innerWidth >= 768) return;
        
        if (this.isTransitioning) return;
        
        console.log('Toggle menu called, current state:', this.isMenuOpen);
        
        if (this.isMenuOpen) {
            this.closeMenu();
        } else {
            this.openMenu();
        }
    }

    /**
     * Open menu with coordinated manager actions
     */
    openMenu() {
        if (this.isMenuOpen || this.isTransitioning) return;

        console.log('Opening menu...');
        
        this.isTransitioning = true;
        this.isMenuOpen = true;
        this.scrollY = window.scrollY;
        
        // Enable scroll prevention through TouchManager
        if (this.managers.touch) {
            this.managers.touch.enableScrollPrevention();
        }
        
        // Enable focus trap through AccessibilityManager
        if (this.managers.accessibility) {
            this.managers.accessibility.enableFocusTrap(this.menuElements.menu);
        }
        
        // Add classes with RAF for smooth animation
        requestAnimationFrame(() => {
            this.menuElements.toggle.classList.add('active');
            this.menuElements.menu.classList.add('active');
            
            if (this.menuElements.overlay) {
                this.menuElements.overlay.classList.add('active');
                this.menuElements.overlay.setAttribute('aria-hidden', 'false');
            }
            
            document.body.classList.add('menu-open');
            
            // Update ARIA attributes through AccessibilityManager
            if (this.managers.accessibility) {
                this.managers.accessibility.updateAriaExpanded('mobileMenuToggle', true);
                this.managers.accessibility.updateAriaHidden('navMenu', false);
            }
            
            console.log('Menu opened successfully');
            
            setTimeout(() => {
                this.isTransitioning = false;
            }, 300);
        });
        
        // Dispatch event
        this.eventManager.emit('menuOpened', {
            menuElement: this.menuElements.menu,
            toggleElement: this.menuElements.toggle
        });
    }

    /**
     * Close menu with coordinated manager actions
     */
    closeMenu() {
        if (!this.isMenuOpen || this.isTransitioning) return;

        console.log('Closing menu...');
        
        this.isTransitioning = true;
        this.isMenuOpen = false;
        
        // Disable scroll prevention through TouchManager
        if (this.managers.touch) {
            this.managers.touch.disableScrollPrevention();
        }
        
        // Disable focus trap through AccessibilityManager
        if (this.managers.accessibility) {
            this.managers.accessibility.disableFocusTrap();
        }
        
        // Remove classes
        this.menuElements.toggle.classList.remove('active');
        this.menuElements.menu.classList.remove('active');
        
        if (this.menuElements.overlay) {
            this.menuElements.overlay.classList.remove('active');
            this.menuElements.overlay.setAttribute('aria-hidden', 'true');
        }
        
        document.body.classList.remove('menu-open');
        
        // Update ARIA attributes through AccessibilityManager
        if (this.managers.accessibility) {
            this.managers.accessibility.updateAriaExpanded('mobileMenuToggle', false);
            this.managers.accessibility.updateAriaHidden('navMenu', true);
        }
        
        setTimeout(() => {
            this.isTransitioning = false;
        }, 300);
        
        // Dispatch event
        this.eventManager.emit('menuClosed', {
            menuElement: this.menuElements.menu,
            toggleElement: this.menuElements.toggle
        });
    }

    /**
     * Handle navigation click
     */
    handleNavClick(event) {
        const target = event.target.closest('a');
        
        if (target && target.getAttribute('href') && target.getAttribute('href').startsWith('#')) {
            console.log('Mobile menu navigation clicked:', target.getAttribute('href'));
            
            // Close menu first
            this.closeMenu();
            
            // Let the main navigation handler take over
            if (window.landingPageManager && window.landingPageManager.handleAnchorClick) {
                setTimeout(() => {
                    window.landingPageManager.handleAnchorClick(event);
                }, 100);
            }
        }
    }

    /**
     * Handle initialization errors gracefully
     */
    handleInitializationError(error) {
        console.error('MobileMenuManager failed to initialize:', error);
        
        // Provide basic fallback functionality
        this.setupBasicFallback();
    }

    /**
     * Setup basic fallback functionality if managers fail
     */
    setupBasicFallback() {
        if (!this.menuElements.toggle || !this.menuElements.menu) return;
        
        console.log('Setting up basic mobile menu fallback...');
        
        // Basic toggle functionality
        this.menuElements.toggle.addEventListener('click', (e) => {
            e.preventDefault();
            this.menuElements.menu.classList.toggle('active');
            this.menuElements.toggle.classList.toggle('active');
            
            const isOpen = this.menuElements.menu.classList.contains('active');
            this.menuElements.toggle.setAttribute('aria-expanded', isOpen.toString());
        });
    }

    /**
     * Get current menu state
     */
    getMenuState() {
        return {
            isOpen: this.isMenuOpen,
            isTransitioning: this.isTransitioning,
            elements: this.menuElements
        };
    }

    /**
     * Get manager status
     */
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

    /**
     * Force close menu (for external control)
     */
    forceClose() {
        if (this.isMenuOpen) {
            this.closeMenu();
        }
    }

    /**
     * Check if menu is available
     */
    isAvailable() {
        return this.isInitialized && 
               this.menuElements.toggle && 
               this.menuElements.menu;
    }

    /**
     * Utility: Debounce function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Get debug information
     */
    getDebugInfo() {
        return {
            isInitialized: this.isInitialized,
            menuState: this.getMenuState(),
            managerStatus: this.getManagerStatus(),
            elementCount: Object.keys(this.menuElements).length,
            eventManagerAvailable: !!this.eventManager
        };
    }

    /**
     * Destroy mobile menu manager and all sub-managers
     */
    destroy() {
        try {
            console.log('Destroying MobileMenuManager...');
            
            // Close menu if open
            if (this.isMenuOpen) {
                this.forceClose();
            }
            
            // Destroy all managers
            Object.values(this.managers).forEach(manager => {
                if (manager && typeof manager.destroy === 'function') {
                    manager.destroy();
                }
            });
            
            // Remove event listeners
            if (this.menuElements.toggle) {
                this.menuElements.toggle.removeEventListener('click', this.toggleMenu);
            }
            
            if (this.menuElements.overlay) {
                this.menuElements.overlay.removeEventListener('click', this.closeMenu);
                if (this.menuElements.overlay.parentNode) {
                    this.menuElements.overlay.parentNode.removeChild(this.menuElements.overlay);
                }
            }
            
            if (this.menuElements.menu) {
                this.menuElements.menu.removeEventListener('click', this.handleNavClick);
            }
            
            // Clean up references
            this.managers = {};
            this.menuElements = {};
            this.eventManager = null;
            
            console.log('MobileMenuManager destroyed successfully');
            
        } catch (error) {
            console.error('Error destroying MobileMenuManager:', error);
        }
    }
}

// Initialize mobile menu when DOM is ready (maintain compatibility)
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if EventManager is available (from new architecture)
    if (window.eventManager) {
        window.mobileMenuManager = new MobileMenuManager(window.eventManager);
    } else {
        console.warn('EventManager not available, mobile menu initialization skipped');
    }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MobileMenuManager;
} 