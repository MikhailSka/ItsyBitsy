/**
 * Enhanced Mobile Menu Manager - Optimized for Performance and UX
 * Handles responsive navigation with smooth animations and accessibility
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
        this.scrollY = 0;
        this.isTransitioning = false;
        
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
        this.optimizeForMobile();
        
        // Initial setup based on screen size
        this.handleResize();
    }

    /**
     * Setup DOM elements with error handling
     */
    setupElements() {
        this.menuToggle = document.getElementById('mobileMenuToggle');
        this.navMenu = document.getElementById('navMenu');
        
        if (!this.menuToggle || !this.navMenu) {
            console.warn('Mobile menu elements not found');
            return;
        }

        // Create enhanced overlay
        this.createOverlay();
        
        // Setup menu positioning
        this.setupMenuPosition();
        
        // Get focusable elements
        this.updateFocusableElements();
    }

    /**
     * Create enhanced overlay with blur effect
     */
    createOverlay() {
        this.menuOverlay = document.querySelector('.mobile-menu-overlay');
        
        if (!this.menuOverlay) {
            this.menuOverlay = document.createElement('div');
            this.menuOverlay.className = 'mobile-menu-overlay';
            this.menuOverlay.setAttribute('aria-hidden', 'true');
            this.menuOverlay.style.cssText = `
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
            
            document.body.appendChild(this.menuOverlay);
        }
    }

    /**
     * Setup menu positioning for mobile
     */
    setupMenuPosition() {
        if (!this.navMenu) return;
        
        // Let CSS handle positioning, just ensure menu is ready
        // Remove any conflicting inline styles
        if (window.innerWidth >= 768) {
            this.navMenu.style.position = '';
            this.navMenu.style.top = '';
            this.navMenu.style.right = '';
            this.navMenu.style.width = '';
            this.navMenu.style.height = '';
            this.navMenu.style.zIndex = '';
            this.navMenu.style.transition = '';
            this.navMenu.style.willChange = '';
        }
    }

    /**
     * Optimize for mobile devices
     */
    optimizeForMobile() {
        // Improve touch handling
        if ('ontouchstart' in window) {
            this.setupTouchOptimizations();
        }
        
        // Optimize for iOS Safari
        this.setupIOSOptimizations();
        
        // Setup scroll behavior
        this.setupScrollBehavior();
    }

    /**
     * Setup touch optimizations
     */
    setupTouchOptimizations() {
        // Prevent bounce scrolling when menu is open
        document.addEventListener('touchmove', (e) => {
            if (this.isMenuOpen && !this.navMenu.contains(e.target)) {
                e.preventDefault();
            }
        }, { passive: false });

        // Improve touch responsiveness
        if (this.menuToggle) {
            this.menuToggle.style.touchAction = 'manipulation';
        }

        // Add touch feedback
        this.addTouchFeedback();
    }

    /**
     * Add visual touch feedback
     */
    addTouchFeedback() {
        const navLinks = this.navMenu.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            link.addEventListener('touchstart', function() {
                this.style.transform = 'scale(0.98)';
            }, { passive: true });
            
            link.addEventListener('touchend', function() {
                this.style.transform = 'scale(1)';
            }, { passive: true });
        });
    }

    /**
     * Setup iOS Safari optimizations
     */
    setupIOSOptimizations() {
        // Fix iOS viewport height issues
        const updateViewportHeight = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };
        
        updateViewportHeight();
        window.addEventListener('resize', updateViewportHeight);
        window.addEventListener('orientationchange', () => {
            setTimeout(updateViewportHeight, 500);
        });

        // Prevent iOS zoom on input focus
        const viewport = document.querySelector('meta[name=viewport]');
        if (viewport) {
            const content = viewport.getAttribute('content');
            viewport.setAttribute('content', content + ', maximum-scale=1.0, user-scalable=no');
        }
    }

    /**
     * Setup scroll behavior optimization
     */
    setupScrollBehavior() {
        let ticking = false;
        
        const handleScroll = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    // Close menu on scroll (optional UX improvement)
                    if (this.isMenuOpen && window.scrollY > this.scrollY + 50) {
                        this.closeMenu();
                    }
                    ticking = false;
                });
                ticking = true;
            }
        };
        
        window.addEventListener('scroll', handleScroll, { passive: true });
    }

    /**
     * Enhanced event listeners setup
     */
    setupEventListeners() {
        if (!this.menuToggle || !this.navMenu) return;

        // Toggle button with debouncing
        this.menuToggle.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Menu toggle clicked');
            this.toggleMenu();
        });
        
        // Overlay click
        if (this.menuOverlay) {
            this.menuOverlay.addEventListener('click', this.closeMenu.bind(this));
        }
        
        // Navigation links with smooth closing
        this.navMenu.addEventListener('click', this.handleNavClick.bind(this));
        
        // Enhanced keyboard events
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        
        // Touch gestures
        this.setupAdvancedTouchEvents();
        
        // Window events
        window.addEventListener('resize', this.debounce(this.handleResize.bind(this), 250));
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.handleResize(), 500);
        });
    }

    /**
     * Setup advanced touch events with swipe gestures
     */
    setupAdvancedTouchEvents() {
        let startX = 0;
        let startY = 0;
        let currentX = 0;
        let currentY = 0;
        let touchStarted = false;
        let isScrolling = false;

        const handleTouchStart = (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            touchStarted = true;
            isScrolling = false;
        };

        const handleTouchMove = (e) => {
            if (!touchStarted) return;
            
            currentX = e.touches[0].clientX;
            currentY = e.touches[0].clientY;
            
            // Determine if user is scrolling vertically
            const deltaY = Math.abs(currentY - startY);
            const deltaX = Math.abs(currentX - startX);
            
            if (deltaY > deltaX && deltaY > 10) {
                isScrolling = true;
            }
        };

        const handleTouchEnd = (e) => {
            if (!touchStarted || isScrolling) {
                touchStarted = false;
                return;
            }
            
            const deltaX = currentX - startX;
            const threshold = 75;
            
            // Swipe right to close menu (when menu is open)
            if (deltaX > threshold && this.isMenuOpen) {
                this.closeMenu();
            }
            
            // Swipe left from edge to open menu (when menu is closed)
            if (deltaX < -threshold && !this.isMenuOpen && startX > window.innerWidth - 50) {
                this.openMenu();
            }
            
            touchStarted = false;
        };

        // Add touch events to document for global swipe detection
        document.addEventListener('touchstart', handleTouchStart, { passive: true });
        document.addEventListener('touchmove', handleTouchMove, { passive: true });
        document.addEventListener('touchend', handleTouchEnd, { passive: true });
    }

    /**
     * Enhanced accessibility setup
     */
    setupAccessibility() {
        if (!this.menuToggle || !this.navMenu) return;

        // Set ARIA attributes
        this.menuToggle.setAttribute('aria-expanded', 'false');
        this.menuToggle.setAttribute('aria-controls', 'navMenu');
        this.menuToggle.setAttribute('aria-label', 'Toggle navigation menu');
        
        this.navMenu.setAttribute('aria-hidden', 'true');
        this.navMenu.setAttribute('role', 'navigation');
        this.navMenu.setAttribute('aria-label', 'Main navigation menu');

        // Add role and aria-label to nav links
        const navLinks = this.navMenu.querySelectorAll('.nav-link');
        navLinks.forEach((link, index) => {
            link.setAttribute('role', 'menuitem');
            link.setAttribute('tabindex', '-1');
        });

        // Setup focus trap
        this.setupFocusTrap();
    }

    /**
     * Enhanced focus trap implementation
     */
    setupFocusTrap() {
        const handleTabKey = (e) => {
            if (!this.isMenuOpen) return;
            
            const focusableElements = this.getFocusableElements();
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];
            
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstElement) {
                        e.preventDefault();
                        lastElement.focus();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        e.preventDefault();
                        firstElement.focus();
                    }
                }
            }
        };
        
        document.addEventListener('keydown', handleTabKey);
    }

    /**
     * Get focusable elements within menu
     */
    getFocusableElements() {
        if (!this.navMenu) return [];
        
        const focusableSelectors = [
            'a[href]',
            'button:not([disabled])',
            'input:not([disabled])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            '[tabindex]:not([tabindex="-1"])'
        ];
        
        return Array.from(this.navMenu.querySelectorAll(focusableSelectors.join(',')))
            .filter(el => !el.hasAttribute('disabled') && el.offsetParent !== null);
    }

    /**
     * Enhanced toggle with animation state management
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
     * Enhanced open menu with performance optimizations
     */
    openMenu() {
        if (this.isMenuOpen || this.isTransitioning) return;

        console.log('Opening menu...');
        
        this.isTransitioning = true;
        this.isMenuOpen = true;
        this.lastFocusedElement = document.activeElement;
        this.scrollY = window.scrollY;
        
        // Simple body scroll prevention without aggressive positioning
        document.body.style.overflow = 'hidden';
        
        // Add classes with RAF for smooth animation
        requestAnimationFrame(() => {
            this.menuToggle.classList.add('active');
            this.navMenu.classList.add('active');
            
            if (this.menuOverlay) {
                this.menuOverlay.classList.add('active');
                this.menuOverlay.setAttribute('aria-hidden', 'false');
            }
            
            document.body.classList.add('menu-open');
            
            // Update ARIA attributes
            this.menuToggle.setAttribute('aria-expanded', 'true');
            this.navMenu.setAttribute('aria-hidden', 'false');
            
            console.log('Menu classes added, navMenu active:', this.navMenu.classList.contains('active'));
            
            // Focus management
            setTimeout(() => {
                this.focusFirstMenuItem();
                this.isTransitioning = false;
            }, 300);
        });
        
        // Dispatch event
        this.dispatchMenuEvent('menuOpened');
    }

    /**
     * Enhanced close menu
     */
    closeMenu() {
        if (!this.isMenuOpen || this.isTransitioning) return;

        console.log('Closing menu...');
        
        this.isTransitioning = true;
        this.isMenuOpen = false;
        
        // Remove classes
        this.menuToggle.classList.remove('active');
        this.navMenu.classList.remove('active');
        
        if (this.menuOverlay) {
            this.menuOverlay.classList.remove('active');
            this.menuOverlay.setAttribute('aria-hidden', 'true');
        }
        
        document.body.classList.remove('menu-open');
        
        // Simple scroll restoration without jumping
        document.body.style.overflow = '';
        
        // Update ARIA attributes
        this.menuToggle.setAttribute('aria-expanded', 'false');
        this.navMenu.setAttribute('aria-hidden', 'true');
        
        if (this.lastFocusedElement) {
            this.lastFocusedElement.focus();
        }
        
        setTimeout(() => {
            this.isTransitioning = false;
        }, 300);
        
        // Dispatch event
        this.dispatchMenuEvent('menuClosed');
    }

    /**
     * Simple body scroll prevention (removed - using overflow: hidden instead)
     */
    preventBodyScroll() {
        // Moved to openMenu() - using simple overflow: hidden
    }

    /**
     * Simple scroll restoration (removed - using overflow: '' instead)
     */
    restoreBodyScroll() {
        // Moved to closeMenu() - using simple overflow restoration
    }

    /**
     * Focus first menu item
     */
    focusFirstMenuItem() {
        const focusableElements = this.getFocusableElements();
        if (focusableElements.length > 0) {
            focusableElements[0].focus();
        }
    }

    /**
     * Handle navigation click with smooth scrolling
     */
    handleNavClick(event) {
        const target = event.target.closest('a');
        
        if (target && target.getAttribute('href') && target.getAttribute('href').startsWith('#')) {
            // Smooth close menu
            this.closeMenu();
            
            // Add small delay for better UX
            setTimeout(() => {
                // Let the main scroll handler take over
                if (window.landingPageManager && window.landingPageManager.handleAnchorClick) {
                    window.landingPageManager.handleAnchorClick(event);
                }
            }, 150);
        }
    }

    /**
     * Enhanced keyboard handling
     */
    handleKeyDown(event) {
        if (event.key === 'Escape' && this.isMenuOpen) {
            event.preventDefault();
            this.closeMenu();
        }
        
        // Handle arrow keys for menu navigation
        if (this.isMenuOpen && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
            event.preventDefault();
            this.handleArrowNavigation(event.key);
        }
    }

    /**
     * Handle arrow key navigation
     */
    handleArrowNavigation(key) {
        const focusableElements = this.getFocusableElements();
        const currentIndex = focusableElements.findIndex(el => el === document.activeElement);
        let nextIndex;
        
        if (key === 'ArrowDown') {
            nextIndex = currentIndex < focusableElements.length - 1 ? currentIndex + 1 : 0;
        } else {
            nextIndex = currentIndex > 0 ? currentIndex - 1 : focusableElements.length - 1;
        }
        
        focusableElements[nextIndex].focus();
    }

    /**
     * Handle resize with debouncing
     */
    handleResize() {
        const isDesktop = window.innerWidth >= 768;
        
        if (isDesktop) {
            // Close menu if open
            if (this.isMenuOpen) {
                this.closeMenu();
            }
            // Remove mobile-specific inline styles on desktop
            this.setupMenuPosition();
        }
        
        this.updateFocusableElements();
    }

    /**
     * Update focusable elements list
     */
    updateFocusableElements() {
        this.focusableElements = this.getFocusableElements();
    }

    /**
     * Dispatch custom menu events
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
     * Destroy mobile menu with cleanup
     */
    destroy() {
        // Close menu if open
        if (this.isMenuOpen) {
            this.closeMenu();
        }
        
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
        window.removeEventListener('resize', this.handleResize);
        
        // Clean up references
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