/**
 * Accessibility Manager - Handles focus management, ARIA attributes, and keyboard navigation
 * Follows Single Responsibility Principle by focusing solely on accessibility features
 * File path: assets/js/managers/AccessibilityManager.js
 */

class AccessibilityManager {
    constructor(eventManager) {
        this.eventManager = eventManager;
        this.focusableSelectors = [
            'a[href]',
            'button:not([disabled])',
            'input:not([disabled])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            '[tabindex]:not([tabindex="-1"])',
            '[role="button"]:not([disabled])',
            '[role="menuitem"]:not([disabled])'
        ];
        this.focusTrapActive = false;
        this.lastFocusedElement = null;
        this.focusableElements = [];
        this.isInitialized = false;
        
        this.init();
    }

    /**
     * Initialize accessibility manager
     */
    init() {
        try {
            this.setupARIAAttributes();
            this.setupKeyboardNavigation();
            this.setupFocusManagement();
            this.setupAccessibilityEvents();
            this.isInitialized = true;
            
            console.log('AccessibilityManager initialized successfully');
        } catch (error) {
            console.error('AccessibilityManager initialization failed:', error);
        }
    }

    /**
     * Setup ARIA attributes for better screen reader support
     */
    setupARIAAttributes() {
        this.setupMenuARIA();
        this.setupNavigationARIA();
        this.setupButtonARIA();
        this.setupFormARIA();
    }

    /**
     * Setup ARIA attributes for menu elements
     */
    setupMenuARIA() {
        const menuToggle = document.getElementById('mobileMenuToggle');
        const navMenu = document.getElementById('navMenu');
        
        if (menuToggle) {
            menuToggle.setAttribute('aria-expanded', 'false');
            menuToggle.setAttribute('aria-controls', 'navMenu');
            menuToggle.setAttribute('aria-label', this.getAriaLabel('toggle_menu'));
            menuToggle.setAttribute('role', 'button');
        }
        
        if (navMenu) {
            navMenu.setAttribute('aria-hidden', 'true');
            navMenu.setAttribute('role', 'navigation');
            navMenu.setAttribute('aria-label', this.getAriaLabel('main_navigation'));
        }

        // Setup menu items
        const menuItems = navMenu ? navMenu.querySelectorAll('.nav-link') : [];
        menuItems.forEach((item, index) => {
            item.setAttribute('role', 'menuitem');
            item.setAttribute('tabindex', '-1');
            item.setAttribute('aria-posinset', (index + 1).toString());
            item.setAttribute('aria-setsize', menuItems.length.toString());
        });
    }

    /**
     * Setup ARIA attributes for navigation elements
     */
    setupNavigationARIA() {
        const navElements = document.querySelectorAll('nav, [role="navigation"]');
        
        navElements.forEach(nav => {
            if (!nav.getAttribute('aria-label') && !nav.getAttribute('aria-labelledby')) {
                nav.setAttribute('aria-label', this.getAriaLabel('navigation'));
            }
        });

        // Setup skip links for better navigation
        this.setupSkipLinks();
    }

    /**
     * Setup skip links for keyboard navigation - REMOVED per user request
     * The skip-to-main-content functionality has been removed as requested
     */
    setupSkipLinks() {
        // Skip link functionality removed - user found it unnecessary
        console.log('Skip links functionality disabled per user request');
    }

    /**
     * Setup ARIA attributes for buttons
     */
    setupButtonARIA() {
        const buttons = document.querySelectorAll('button, [role="button"]');
        
        buttons.forEach(button => {
            // Ensure buttons have accessible names
            if (!button.getAttribute('aria-label') && 
                !button.getAttribute('aria-labelledby') && 
                !button.textContent.trim()) {
                console.warn('Button without accessible name found:', button);
            }

            // Add proper button role if missing
            if (!button.getAttribute('role') && button.tagName !== 'BUTTON') {
                button.setAttribute('role', 'button');
            }

            // Ensure keyboard accessibility
            if (!button.hasAttribute('tabindex') && button.tagName !== 'BUTTON') {
                button.setAttribute('tabindex', '0');
            }
        });
    }

    /**
     * Setup ARIA attributes for forms
     */
    setupFormARIA() {
        const forms = document.querySelectorAll('form');
        
        forms.forEach(form => {
            const inputs = form.querySelectorAll('input, select, textarea');
            
            inputs.forEach(input => {
                // Link labels with inputs
                const label = form.querySelector(`label[for="${input.id}"]`) || 
                            input.closest('label') ||
                            form.querySelector(`[aria-labelledby="${input.id}"]`);
                
                if (!label && !input.getAttribute('aria-label')) {
                    console.warn('Input without accessible label found:', input);
                }

                // Add required indicators
                if (input.hasAttribute('required')) {
                    input.setAttribute('aria-required', 'true');
                    
                    // Add visual indicator if not present
                    const requiredIndicator = input.parentNode.querySelector('.required-indicator');
                    if (!requiredIndicator) {
                        const indicator = document.createElement('span');
                        indicator.className = 'required-indicator';
                        indicator.setAttribute('aria-hidden', 'true');
                        indicator.textContent = '*';
                        indicator.style.color = 'red';
                        input.parentNode.appendChild(indicator);
                    }
                }

                // Setup error handling
                this.setupInputErrorHandling(input);
            });
        });
    }

    /**
     * Setup error handling for form inputs
     */
    setupInputErrorHandling(input) {
        const errorId = `${input.id || 'input'}-error`;
        let errorElement = document.getElementById(errorId);
        
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.id = errorId;
            errorElement.className = 'error-message';
            errorElement.setAttribute('role', 'alert');
            errorElement.setAttribute('aria-live', 'polite');
            errorElement.style.display = 'none';
            input.parentNode.appendChild(errorElement);
        }

        input.setAttribute('aria-describedby', errorId);
    }

    /**
     * Setup keyboard navigation
     */
    setupKeyboardNavigation() {
        this.setupGlobalKeyboardEvents();
        this.setupArrowKeyNavigation();
        this.setupEscapeKeyHandling();
        this.setupEnterSpaceHandling();
    }

    /**
     * Setup global keyboard event listeners
     */
    setupGlobalKeyboardEvents() {
        document.addEventListener('keydown', this.handleGlobalKeyDown.bind(this));
        document.addEventListener('keyup', this.handleGlobalKeyUp.bind(this));
    }

    /**
     * Handle global keydown events
     */
    handleGlobalKeyDown(event) {
        const { key, ctrlKey, metaKey, altKey, shiftKey } = event;
        
        // Escape key handling
        if (key === 'Escape') {
            this.handleEscapeKey(event);
            return;
        }

        // Tab key handling for focus trap
        if (key === 'Tab' && this.focusTrapActive) {
            this.handleTabInFocusTrap(event);
            return;
        }

        // Arrow key navigation
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
            this.handleArrowKeys(event);
            return;
        }

        // Enter/Space on custom buttons
        if ((key === 'Enter' || key === ' ') && this.isCustomButton(event.target)) {
            this.handleEnterSpace(event);
            return;
        }

        // Custom keyboard shortcuts
        this.handleKeyboardShortcuts(event);
    }

    /**
     * Handle global keyup events
     */
    handleGlobalKeyUp(event) {
        // Can be used for key release actions
        this.eventManager.emit('keyUp', {
            key: event.key,
            target: event.target,
            ctrlKey: event.ctrlKey,
            metaKey: event.metaKey,
            altKey: event.altKey,
            shiftKey: event.shiftKey
        });
    }

    /**
     * Handle escape key
     */
    handleEscapeKey(event) {
        event.preventDefault();
        
        this.eventManager.emit('escapePressed', {
            target: event.target,
            focusTrapActive: this.focusTrapActive
        });
    }

    /**
     * Handle tab key in focus trap
     */
    handleTabInFocusTrap(event) {
        if (!this.focusableElements.length) {
            this.updateFocusableElements();
        }

        const firstElement = this.focusableElements[0];
        const lastElement = this.focusableElements[this.focusableElements.length - 1];
        
        if (event.shiftKey) {
            // Shift + Tab (backward)
            if (document.activeElement === firstElement) {
                event.preventDefault();
                lastElement.focus();
            }
        } else {
            // Tab (forward)
            if (document.activeElement === lastElement) {
                event.preventDefault();
                firstElement.focus();
            }
        }
    }

    /**
     * Handle arrow key navigation
     */
    handleArrowKeys(event) {
        const currentElement = event.target;
        const isInMenu = currentElement.closest('#navMenu, [role="menu"], [role="menubar"]');
        
        if (isInMenu) {
            event.preventDefault();
            this.handleMenuArrowNavigation(event);
        }
    }

    /**
     * Handle arrow navigation within menus
     */
    handleMenuArrowNavigation(event) {
        const menu = event.target.closest('#navMenu, [role="menu"], [role="menubar"]');
        if (!menu) return;

        const menuItems = Array.from(menu.querySelectorAll('[role="menuitem"]:not([disabled])'));
        const currentIndex = menuItems.findIndex(item => item === event.target);
        
        if (currentIndex === -1) return;

        let nextIndex;
        
        switch (event.key) {
            case 'ArrowDown':
                nextIndex = currentIndex < menuItems.length - 1 ? currentIndex + 1 : 0;
                break;
            case 'ArrowUp':
                nextIndex = currentIndex > 0 ? currentIndex - 1 : menuItems.length - 1;
                break;
            case 'Home':
                nextIndex = 0;
                break;
            case 'End':
                nextIndex = menuItems.length - 1;
                break;
            default:
                return;
        }
        
        menuItems[nextIndex].focus();
        
        this.eventManager.emit('menuNavigated', {
            from: currentIndex,
            to: nextIndex,
            item: menuItems[nextIndex]
        });
    }

    /**
     * Handle Enter/Space on custom buttons
     */
    handleEnterSpace(event) {
        if (event.key === ' ') {
            event.preventDefault(); // Prevent page scroll
        }
        
        const button = event.target;
        button.click();
        
        this.eventManager.emit('customButtonActivated', {
            button,
            key: event.key
        });
    }

    /**
     * Check if element is a custom button
     */
    isCustomButton(element) {
        return element.getAttribute('role') === 'button' && 
               element.tagName !== 'BUTTON' &&
               !element.hasAttribute('disabled');
    }

    /**
     * Handle keyboard shortcuts
     */
    handleKeyboardShortcuts(event) {
        // Add common keyboard shortcuts
        const shortcuts = {
            // Alt + M = Toggle menu
            'm': () => {
                if (event.altKey) {
                    event.preventDefault();
                    this.eventManager.emit('shortcutToggleMenu');
                }
            },
            // Alt + 1-9 = Navigate to sections
            '1': () => this.handleNumberShortcut(event, 0),
            '2': () => this.handleNumberShortcut(event, 1),
            '3': () => this.handleNumberShortcut(event, 2),
            '4': () => this.handleNumberShortcut(event, 3),
            '5': () => this.handleNumberShortcut(event, 4)
        };

        const handler = shortcuts[event.key.toLowerCase()];
        if (handler) {
            handler();
        }
    }

    /**
     * Handle number key shortcuts for navigation
     */
    handleNumberShortcut(event, index) {
        if (event.altKey) {
            event.preventDefault();
            const navLinks = document.querySelectorAll('.nav-link');
            if (navLinks[index]) {
                navLinks[index].focus();
                navLinks[index].click();
            }
        }
    }

    /**
     * Setup focus management
     */
    setupFocusManagement() {
        this.setupFocusVisible();
        this.setupFocusTrapping();
        this.updateFocusableElements();
    }

    /**
     * Setup focus-visible for better keyboard navigation
     */
    setupFocusVisible() {
        // Add focus-visible polyfill if needed
        if (!CSS.supports('selector(:focus-visible)')) {
            this.addFocusVisiblePolyfill();
        }

        // Add custom focus styles
        const style = document.createElement('style');
        style.textContent = `
            .focus-visible-polyfill,
            *:focus-visible {
                outline: 2px solid #005fcc;
                outline-offset: 2px;
                border-radius: 2px;
            }
            
            *:focus:not(:focus-visible) {
                outline: none;
            }
            
            /* High contrast mode support */
            @media (prefers-contrast: high) {
                .focus-visible-polyfill,
                *:focus-visible {
                    outline: 3px solid;
                    outline-offset: 3px;
                }
            }
        `;
        
        document.head.appendChild(style);
        this.focusStyle = style;
    }

    /**
     * Add focus-visible polyfill for older browsers
     */
    addFocusVisiblePolyfill() {
        let isKeyboardUser = false;
        
        document.addEventListener('keydown', () => {
            isKeyboardUser = true;
        });
        
        document.addEventListener('mousedown', () => {
            isKeyboardUser = false;
        });
        
        document.addEventListener('focusin', (event) => {
            if (isKeyboardUser) {
                event.target.classList.add('focus-visible-polyfill');
            }
        });
        
        document.addEventListener('focusout', (event) => {
            event.target.classList.remove('focus-visible-polyfill');
        });
    }

    /**
     * Setup focus trapping
     */
    setupFocusTrapping() {
        // Listen for events that require focus trapping
        this.eventManager.on('menuOpened', () => {
            this.enableFocusTrap();
        });
        
        this.eventManager.on('menuClosed', () => {
            this.disableFocusTrap();
        });
    }

    /**
     * Enable focus trap
     */
    enableFocusTrap(container = '#navMenu') {
        this.focusTrapActive = true;
        this.lastFocusedElement = document.activeElement;
        
        const trapContainer = typeof container === 'string' ? 
                            document.querySelector(container) : container;
        
        if (trapContainer) {
            this.updateFocusableElements(trapContainer);
            
            // Focus first element
            if (this.focusableElements.length > 0) {
                this.focusableElements[0].focus();
            }
        }
        
        this.eventManager.emit('focusTrapEnabled', {
            container: trapContainer,
            focusableCount: this.focusableElements.length
        });
    }

    /**
     * Disable focus trap
     */
    disableFocusTrap() {
        this.focusTrapActive = false;
        
        // Restore focus to last focused element
        if (this.lastFocusedElement && typeof this.lastFocusedElement.focus === 'function') {
            try {
                this.lastFocusedElement.focus();
            } catch (error) {
                console.warn('Could not restore focus:', error);
            }
        }
        
        this.focusableElements = [];
        this.lastFocusedElement = null;
        
        this.eventManager.emit('focusTrapDisabled');
    }

    /**
     * Update list of focusable elements
     */
    updateFocusableElements(container = document) {
        this.focusableElements = Array.from(
            container.querySelectorAll(this.focusableSelectors.join(','))
        ).filter(element => {
            return !element.hasAttribute('disabled') && 
                   element.offsetParent !== null &&
                   element.tabIndex !== -1;
        });
    }

    /**
     * Setup accessibility events
     */
    setupAccessibilityEvents() {
        // Listen for screen reader announcements
        this.setupScreenReaderSupport();
        
        // Listen for high contrast mode changes
        this.setupHighContrastSupport();
        
        // Listen for reduced motion preferences
        this.setupReducedMotionSupport();
    }

    /**
     * Setup screen reader support
     */
    setupScreenReaderSupport() {
        // Create live region for announcements
        if (!document.getElementById('aria-live-region')) {
            const liveRegion = document.createElement('div');
            liveRegion.id = 'aria-live-region';
            liveRegion.setAttribute('aria-live', 'polite');
            liveRegion.setAttribute('aria-atomic', 'true');
            liveRegion.style.cssText = `
                position: absolute;
                left: -10000px;
                width: 1px;
                height: 1px;
                overflow: hidden;
            `;
            document.body.appendChild(liveRegion);
        }
    }

    /**
     * Announce message to screen readers
     */
    announceToScreenReader(message, priority = 'polite') {
        const liveRegion = document.getElementById('aria-live-region');
        if (liveRegion) {
            liveRegion.setAttribute('aria-live', priority);
            liveRegion.textContent = message;
            
            // Clear after announcement
            setTimeout(() => {
                liveRegion.textContent = '';
            }, 1000);
        }
    }

    /**
     * Setup high contrast mode support
     */
    setupHighContrastSupport() {
        const supportsHighContrast = window.matchMedia('(prefers-contrast: high)');
        
        const handleHighContrastChange = (e) => {
            document.body.classList.toggle('high-contrast', e.matches);
            this.eventManager.emit('highContrastChanged', { enabled: e.matches });
        };
        
        handleHighContrastChange(supportsHighContrast);
        supportsHighContrast.addEventListener('change', handleHighContrastChange);
    }

    /**
     * Setup reduced motion support
     */
    setupReducedMotionSupport() {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        
        const handleReducedMotionChange = (e) => {
            document.body.classList.toggle('reduced-motion', e.matches);
            this.eventManager.emit('reducedMotionChanged', { enabled: e.matches });
        };
        
        handleReducedMotionChange(prefersReducedMotion);
        prefersReducedMotion.addEventListener('change', handleReducedMotionChange);
    }

    /**
     * Get ARIA label based on current language
     */
    getAriaLabel(key) {
        const labels = {
            toggle_menu: 'Toggle navigation menu',
            main_navigation: 'Main navigation menu',
            navigation: 'Navigation',

            required_field: 'Required field',
            error_message: 'Error message'
        };
        
        // If translation manager is available, use it
        if (window.translationManager) {
            return window.translationManager.getTranslation(`aria_${key}`) || labels[key] || key;
        }
        
        return labels[key] || key;
    }

    /**
     * Update ARIA expanded state
     */
    updateAriaExpanded(elementId, expanded) {
        const element = document.getElementById(elementId);
        if (element) {
            element.setAttribute('aria-expanded', expanded.toString());
        }
    }

    /**
     * Update ARIA hidden state
     */
    updateAriaHidden(elementId, hidden) {
        const element = document.getElementById(elementId);
        if (element) {
            element.setAttribute('aria-hidden', hidden.toString());
        }
    }

    /**
     * Show error message for form field
     */
    showFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        const errorElement = document.getElementById(`${fieldId}-error`);
        
        if (field && errorElement) {
            field.setAttribute('aria-invalid', 'true');
            errorElement.textContent = message;
            errorElement.style.display = 'block';
            
            // Announce error to screen reader
            this.announceToScreenReader(message, 'assertive');
        }
    }

    /**
     * Clear error message for form field
     */
    clearFieldError(fieldId) {
        const field = document.getElementById(fieldId);
        const errorElement = document.getElementById(`${fieldId}-error`);
        
        if (field && errorElement) {
            field.setAttribute('aria-invalid', 'false');
            errorElement.textContent = '';
            errorElement.style.display = 'none';
        }
    }

    /**
     * Get debug information
     */
    getDebugInfo() {
        return {
            isInitialized: this.isInitialized,
            focusTrapActive: this.focusTrapActive,
            focusableElementsCount: this.focusableElements.length,
            lastFocusedElement: this.lastFocusedElement ? this.lastFocusedElement.tagName : null,
            reducedMotionEnabled: document.body.classList.contains('reduced-motion'),
            highContrastEnabled: document.body.classList.contains('high-contrast')
        };
    }

    /**
     * Destroy accessibility manager
     */
    destroy() {
        try {
            // Disable focus trap if active
            if (this.focusTrapActive) {
                this.disableFocusTrap();
            }

            // Remove event listeners
            document.removeEventListener('keydown', this.handleGlobalKeyDown);
            document.removeEventListener('keyup', this.handleGlobalKeyUp);

            // Remove styles
            if (this.focusStyle && this.focusStyle.parentNode) {
                this.focusStyle.parentNode.removeChild(this.focusStyle);
            }

            // Clean up references
            this.eventManager = null;
            this.focusableElements = [];
            this.lastFocusedElement = null;
            
            console.log('AccessibilityManager destroyed successfully');
        } catch (error) {
            console.error('Error destroying AccessibilityManager:', error);
        }
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AccessibilityManager;
} 