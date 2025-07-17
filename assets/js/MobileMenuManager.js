/**
 * Mobile Menu Manager - Simple, lightweight mobile menu functionality
 */

class MobileMenuManager {
    constructor(eventManager) {
        this.eventManager = eventManager;
        this.isMenuOpen = false;
        this.isTransitioning = false;
        this.menuElements = {};
        this.scrollY = 0;
        this.isInitialized = false;
        
        this.init();
    }

    /**
     * Initialize mobile menu manager
     */
    async init() {
        try {
            this.setupElements();
            this.setupMenuFunctionality();
            this.setupEventListeners();
            this.setupResizeHandler();
            
            this.isInitialized = true;
        } catch (error) {
            console.error('MobileMenuManager initialization failed:', error);
            this.setupBasicFallback();
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
    }

    /**
     * Setup essential event listeners
     */
    setupEventListeners() {
        // Escape key handler
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isMenuOpen) {
                this.closeMenu();
            }
        });

        // Touch events for swipe gestures
        if ('ontouchstart' in window) {
            this.setupSwipeGestures();
        }
    }

    /**
     * Setup basic swipe gestures
     */
    setupSwipeGestures() {
        let touchStartX = 0;
        let touchStartY = 0;

        document.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            if (!e.changedTouches) return;
            
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;
            
            // Check if it's a horizontal swipe (not vertical scroll)
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
                if (deltaX > 0 && touchStartX < 50 && !this.isMenuOpen) {
                    // Swipe right from left edge - open menu
                    this.openMenu();
                } else if (deltaX < 0 && this.isMenuOpen) {
                    // Swipe left when menu is open - close menu
                    this.closeMenu();
                }
            }
        }, { passive: true });
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
        
        if (this.isMenuOpen) {
            this.closeMenu();
        } else {
            this.openMenu();
        }
    }

    /**
     * Open menu
     */
    openMenu() {
        if (this.isMenuOpen || this.isTransitioning) return;
        
        this.isTransitioning = true;
        this.isMenuOpen = true;
        this.scrollY = window.scrollY;
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.top = `-${this.scrollY}px`;
        document.body.style.width = '100%';
        
        // Add classes with RAF for smooth animation
        requestAnimationFrame(() => {
            this.menuElements.toggle.classList.add('active');
            this.menuElements.toggle.setAttribute('aria-expanded', 'true');
            
            this.menuElements.menu.classList.add('active');
            this.menuElements.menu.setAttribute('aria-hidden', 'false');
            
            if (this.menuElements.overlay) {
                this.menuElements.overlay.classList.add('active');
                this.menuElements.overlay.setAttribute('aria-hidden', 'false');
            }
            
            document.body.classList.add('menu-open');
            
            setTimeout(() => {
                this.isTransitioning = false;
            }, 300);
        });
        
        // Dispatch event
        if (this.eventManager) {
            this.eventManager.emit('menuOpened', {
                menuElement: this.menuElements.menu,
                toggleElement: this.menuElements.toggle
            });
        }
    }

    /**
     * Close menu
     */
    closeMenu() {
        if (!this.isMenuOpen || this.isTransitioning) return;
        
        this.isTransitioning = true;
        this.isMenuOpen = false;
        
        // Restore body scroll
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, this.scrollY);
        
        // Remove classes
        this.menuElements.toggle.classList.remove('active');
        this.menuElements.toggle.setAttribute('aria-expanded', 'false');
        
        this.menuElements.menu.classList.remove('active');
        this.menuElements.menu.setAttribute('aria-hidden', 'true');
        
        if (this.menuElements.overlay) {
            this.menuElements.overlay.classList.remove('active');
            this.menuElements.overlay.setAttribute('aria-hidden', 'true');
        }
        
        document.body.classList.remove('menu-open');
        
        setTimeout(() => {
            this.isTransitioning = false;
        }, 300);
        
        // Dispatch event
        if (this.eventManager) {
            this.eventManager.emit('menuClosed', {
                menuElement: this.menuElements.menu,
                toggleElement: this.menuElements.toggle
            });
        }
    }

    /**
     * Handle navigation click
     */
    handleNavClick(event) {
        const target = event.target.closest('a');
        
        if (target && target.getAttribute('href') && target.getAttribute('href').startsWith('#')) {
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
     * Setup basic fallback functionality if initialization fails
     */
    setupBasicFallback() {
        if (!this.menuElements.toggle || !this.menuElements.menu) return;
        
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
            elementCount: Object.keys(this.menuElements).length,
            eventManagerAvailable: !!this.eventManager
        };
    }

    /**
     * Destroy mobile menu manager
     */
    destroy() {
        try {
            // Close menu if open
            if (this.isMenuOpen) {
                this.forceClose();
            }
            
            // Remove event listeners
            if (this.menuElements.toggle) {
                this.menuElements.toggle.removeEventListener('click', this.toggleMenu);
            }
            
            if (this.menuElements.overlay && this.menuElements.overlay.parentNode) {
                this.menuElements.overlay.parentNode.removeChild(this.menuElements.overlay);
            }
            
            if (this.menuElements.menu) {
                this.menuElements.menu.removeEventListener('click', this.handleNavClick);
            }
            
            // Clean up references
            this.menuElements = {};
            this.eventManager = null;
            
        } catch (error) {
            console.error('Error destroying MobileMenuManager:', error);
        }
    }
}

// Initialize mobile menu when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if EventManager is available
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