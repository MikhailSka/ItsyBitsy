/**
 * Mobile Menu Manager - Responsive Navigation Handler
 * Handles mobile menu functionality with accessibility support
 * File path: assets/js/mobile-menu.js
 */

class MobileMenuManager {
    constructor() {
        this.isMenuOpen = false;
        this.menuToggle = null;
        this.menuOverlay = null;
        this.navMenu = null;
        this.focusableElements = [];
        this.lastFocusedElement = null;
        
        this.init();
    }

    /**
     * Initialize mobile menu functionality
     */
    init() {
        this.setupElements();
        this.setupEventListeners();
        this.setupAccessibility();
        this.setupResizeHandler();
    }

    /**
     * Setup DOM elements
     */
    setupElements() {
        this.menuToggle = document.getElementById('mobileMenuToggle');
        this.navMenu = document.getElementById('headerNav');
        
        if (!this.menuToggle || !this.navMenu) {
            console.warn('Mobile menu elements not found');
            return;
        }

        // Create overlay element
        this.createOverlay();
        
        // Get focusable elements within menu
        this.updateFocusableElements();
    }

    /**
     * Create overlay element for mobile menu
     */
    createOverlay() {
        // Check if overlay already exists
        this.menuOverlay = document.querySelector('.mobile-menu-overlay');
        
        if (!this.menuOverlay) {
            this.menuOverlay = document.createElement('div');
            this.menuOverlay.className = 'mobile-menu-overlay';
            this.menuOverlay.setAttribute('aria-hidden', 'true');
            
            document.body.appendChild(this.menuOverlay);
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        if (!this.menuToggle || !this.navMenu) return;

        // Toggle button click
        this.menuToggle.addEventListener('click', this.toggleMenu.bind(this));
        
        // Overlay click to close menu
        if (this.menuOverlay) {
            this.menuOverlay.addEventListener('click', this.closeMenu.bind(this));
        }
        
        // Navigation links click
        this.navMenu.addEventListener('click', this.handleNavClick.bind(this));
        
        // Keyboard events
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        
        // Touch events for swipe gestures
        this.setupTouchEvents();
    }

    /**
     * Setup touch events for swipe gestures
     */
    setupTouchEvents() {
        let startX = 0;
        let currentX = 0;
        let touchStarted = false;

        this.navMenu.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            touchStarted = true;
        }, { passive: true });

        this.navMenu.addEventListener('touchmove', (e) => {
            if (!touchStarted) return;
            currentX = e.touches[0].clientX;
        }, { passive: true });

        this.navMenu.addEventListener('touchend', (e) => {
            if (!touchStarted) return;
            
            const deltaX = currentX - startX;
            const threshold = 50;
            
            // Swipe right to close menu
            if (deltaX > threshold && this.isMenuOpen) {
                this.closeMenu();
            }
            
            touchStarted = false;
        }, { passive: true });
    }

    /**
     * Setup accessibility features
     */
    setupAccessibility() {
        if (!this.menuToggle || !this.navMenu) return;

        // Set initial ARIA attributes
        this.menuToggle.setAttribute('aria-expanded', 'false');
        this.menuToggle.setAttribute('aria-controls', 'headerNav');
        this.menuToggle.setAttribute('aria-label', 'Toggle navigation menu');
        
        this.navMenu.setAttribute('aria-hidden', 'true');
        this.navMenu.setAttribute('role', 'navigation');
        this.navMenu.setAttribute('aria-labelledby', 'mobileMenuToggle');
    }

    /**
     * Setup resize handler
     */
    setupResizeHandler() {
        let resizeTimer;
        
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                this.handleResize();
            }, 250);
        });
    }

    /**
     * Handle window resize
     */
    handleResize() {
        const isDesktop = window.innerWidth >= 768;
        
        if (isDesktop && this.isMenuOpen) {
            this.closeMenu();
        }
        
        // Update focusable elements
        this.updateFocusableElements();
    }

    /**
     * Toggle mobile menu
     */
    toggleMenu() {
        if (this.isMenuOpen) {
            this.closeMenu();
        } else {
            this.openMenu();
        }
    }

    /**
     * Open mobile menu
     */
    openMenu() {
        if (this.isMenuOpen) return;

        this.isMenuOpen = true;
        this.lastFocusedElement = document.activeElement;
        
        // Add classes
        this.menuToggle.classList.add('active');
        this.navMenu.classList.add('active');
        
        if (this.menuOverlay) {
            this.menuOverlay.classList.add('active');
        }
        
        document.body.classList.add('menu-open');
        
        // Update ARIA attributes
        this.menuToggle.setAttribute('aria-expanded', 'true');
        this.navMenu.setAttribute('aria-hidden', 'false');
        
        if (this.menuOverlay) {
            this.menuOverlay.setAttribute('aria-hidden', 'false');
        }
        
        // Focus first menu item
        setTimeout(() => {
            this.focusFirstMenuItem();
        }, 100);
        
        // Prevent body scroll
        this.preventBodyScroll();
        
        // Dispatch custom event
        this.dispatchMenuEvent('menuOpened');
    }

    /**
     * Close mobile menu
     */
    closeMenu() {
        if (!this.isMenuOpen) return;

        this.isMenuOpen = false;
        
        // Remove classes
        this.menuToggle.classList.remove('active');
        this.navMenu.classList.remove('active');
        
        if (this.menuOverlay) {
            this.menuOverlay.classList.remove('active');
        }
        
        document.body.classList.remove('menu-open');
        
        // Update ARIA attributes
        this.menuToggle.setAttribute('aria-expanded', 'false');
        this.navMenu.setAttribute('aria-hidden', 'true');
        
        if (this.menuOverlay) {
            this.menuOverlay.setAttribute('aria-hidden', 'true');
        }
        
        // Restore focus
        if (this.lastFocusedElement) {
            this.lastFocusedElement.focus();
        }
        
        // Restore body scroll
        this.restoreBodyScroll();
        
        // Dispatch custom event
        this.dispatchMenuEvent('menuClosed');
    }

    /**
     * Handle navigation click
     */
    handleNavClick(event) {
        const target = event.target.closest('a');
        
        if (target && target.getAttribute('href') && target.getAttribute('href').startsWith('#')) {
            // Close menu when clicking internal links
            this.closeMenu();
        }
    }

    /**
     * Handle keyboard events
     */
    handleKeyDown(event) {
        if (!this.isMenuOpen) return;

        switch (event.key) {
            case 'Escape':
                event.preventDefault();
                this.closeMenu();
                break;
                
            case 'Tab':
                this.handleTabKey(event);
                break;
                
            case 'ArrowUp':
                if (this.isMenuOpen) {
                    event.preventDefault();
                    this.focusPreviousMenuItem();
                }
                break;
                
            case 'ArrowDown':
                if (this.isMenuOpen) {
                    event.preventDefault();
                    this.focusNextMenuItem();
                }
                break;
                
            case 'Home':
                if (this.isMenuOpen) {
                    event.preventDefault();
                    this.focusFirstMenuItem();
                }
                break;
                
            case 'End':
                if (this.isMenuOpen) {
                    event.preventDefault();
                    this.focusLastMenuItem();
                }
                break;
        }
    }

    /**
     * Handle tab key for focus trapping
     */
    handleTabKey(event) {
        if (this.focusableElements.length === 0) return;

        const firstFocusable = this.focusableElements[0];
        const lastFocusable = this.focusableElements[this.focusableElements.length - 1];

        if (event.shiftKey) {
            // Shift + Tab
            if (document.activeElement === firstFocusable) {
                event.preventDefault();
                lastFocusable.focus();
            }
        } else {
            // Tab
            if (document.activeElement === lastFocusable) {
                event.preventDefault();
                firstFocusable.focus();
            }
        }
    }

    /**
     * Update focusable elements
     */
    updateFocusableElements() {
        if (!this.navMenu) return;

        const focusableSelectors = [
            'a[href]',
            'button:not([disabled])',
            'input:not([disabled])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            '[tabindex]:not([tabindex="-1"])'
        ];

        this.focusableElements = Array.from(
            this.navMenu.querySelectorAll(focusableSelectors.join(', '))
        ).filter(element => {
            return element.offsetParent !== null && !element.hidden;
        });
    }

    /**
     * Focus first menu item
     */
    focusFirstMenuItem() {
        if (this.focusableElements.length > 0) {
            this.focusableElements[0].focus();
        }
    }

    /**
     * Focus last menu item
     */
    focusLastMenuItem() {
        if (this.focusableElements.length > 0) {
            this.focusableElements[this.focusableElements.length - 1].focus();
        }
    }

    /**
     * Focus next menu item
     */
    focusNextMenuItem() {
        const currentIndex = this.focusableElements.indexOf(document.activeElement);
        const nextIndex = (currentIndex + 1) % this.focusableElements.length;
        this.focusableElements[nextIndex].focus();
    }

    /**
     * Focus previous menu item
     */
    focusPreviousMenuItem() {
        const currentIndex = this.focusableElements.indexOf(document.activeElement);
        const prevIndex = currentIndex === 0 ? this.focusableElements.length - 1 : currentIndex - 1;
        this.focusableElements[prevIndex].focus();
    }

    /**
     * Prevent body scroll
     */
    preventBodyScroll() {
        const scrollY = window.scrollY;
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.width = '100%';
        document.body.setAttribute('data-scroll-y', scrollY.toString());
    }

    /**
     * Restore body scroll
     */
    restoreBodyScroll() {
        const scrollY = document.body.getAttribute('data-scroll-y');
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.removeAttribute('data-scroll-y');
        
        if (scrollY) {
            window.scrollTo(0, parseInt(scrollY));
        }
    }

    /**
     * Dispatch custom menu event
     */
    dispatchMenuEvent(eventName) {
        const event = new CustomEvent(eventName, {
            detail: {
                isOpen: this.isMenuOpen,
                menuElement: this.navMenu,
                toggleElement: this.menuToggle
            }
        });
        
        document.dispatchEvent(event);
    }

    /**
     * Get menu state
     */
    getMenuState() {
        return {
            isOpen: this.isMenuOpen,
            hasOverlay: !!this.menuOverlay,
            focusableCount: this.focusableElements.length
        };
    }

    /**
     * Destroy mobile menu
     */
    destroy() {
        // Remove event listeners
        if (this.menuToggle) {
            this.menuToggle.removeEventListener('click', this.toggleMenu);
        }
        
        if (this.menuOverlay) {
            this.menuOverlay.removeEventListener('click', this.closeMenu);
            this.menuOverlay.remove();
        }
        
        if (this.navMenu) {
            this.navMenu.removeEventListener('click', this.handleNavClick);
        }
        
        document.removeEventListener('keydown', this.handleKeyDown);
        
        // Close menu if open
        if (this.isMenuOpen) {
            this.closeMenu();
        }
        
        // Clean up
        this.menuToggle = null;
        this.navMenu = null;
        this.menuOverlay = null;
        this.focusableElements = [];
        this.lastFocusedElement = null;
    }
}

// Initialize mobile menu when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.mobileMenuManager = new MobileMenuManager();
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MobileMenuManager;
}