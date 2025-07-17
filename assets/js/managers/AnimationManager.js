/**
 * AnimationManager - Handles AOS and custom animations
 * Following Single Responsibility Principle
 * File path: assets/js/managers/AnimationManager.js
 */

class AnimationManager {
    constructor(eventManager) {
        this.eventManager = eventManager;
        this.intersectionObserver = null;
        this.animatedElements = new Set();
        this.customAnimations = new Map();
        this.checkInterval = null;
        this.init();
    }

    /**
     * Initialize animation manager
     */
    init() {
        this.initializeAOS();
        this.setupIntersectionObserver();
        this.setupEventListeners();
        this.setupCustomAnimations();
        this.setupPeriodicCheck();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Listen for scroll events
        this.eventManager.on('scroll', this.handleScroll.bind(this));
        
        // Listen for resize events
        this.eventManager.on('resize', this.handleResize.bind(this));
        
        // Listen for touch events on mobile
        this.eventManager.on('touchend', this.handleTouchEnd.bind(this));
        
        // Listen for orientation change
        this.eventManager.on('orientationchange', this.handleOrientationChange.bind(this));
    }

    /**
     * Initialize AOS (Animate On Scroll) library
     */
    initializeAOS() {
        // Check if AOS is available
        if (typeof AOS === 'undefined') {
            console.warn('AOS library not loaded, using fallback animations');
            this.setupFallbackAnimations();
            return;
        }

        const isMobile = window.innerWidth < 768;
        
        // Initialize AOS with optimized settings
        AOS.init({
            duration: isMobile ? 600 : 800,
            once: true,
            offset: isMobile ? 30 : 80,
            delay: 0,
            disable: false,
            easing: 'ease-out-cubic',
            mirror: false,
            anchorPlacement: 'top-bottom',
            debounceDelay: 50,
            throttleDelay: 50
        });

        // Setup custom scroll handling for AOS with custom scroll container
        this.setupAOSCustomScrolling();
        
        console.log('AOS initialized with custom configuration');
    }

    /**
     * Setup AOS with custom scroll container
     */
    setupAOSCustomScrolling() {
        const scrollContainer = document.getElementById('content-wrapper');
        
        if (scrollContainer) {
            // Custom scroll handler for AOS
            const handleCustomScroll = this.eventManager.throttle(() => {
                // Manually trigger AOS refresh
                if (typeof AOS !== 'undefined') {
                    AOS.refresh();
                }
                
                // Also check our custom animations
                this.checkVisibleAnimations();
            }, 16);
            
            scrollContainer.addEventListener('scroll', handleCustomScroll, { passive: true });
            console.log('AOS setup with custom scroll container');
        }
        
        // Force initial refresh
        this.forceInitialRefresh();
    }

    /**
     * Force initial refresh of animations
     */
    forceInitialRefresh() {
        setTimeout(() => {
            if (typeof AOS !== 'undefined') {
                AOS.refresh();
            }
            this.checkVisibleAnimations();
        }, 100);
        
        // Additional refresh for mobile devices
        if (window.innerWidth < 768) {
            setTimeout(() => {
                if (typeof AOS !== 'undefined') {
                    AOS.refresh();
                }
                this.checkVisibleAnimations();
            }, 300);
        }
    }

    /**
     * Setup fallback animations if AOS fails
     */
    setupFallbackAnimations() {
        console.log('Setting up fallback animations');
        
        // Show all AOS elements immediately with fallback
        const aosElements = document.querySelectorAll('[data-aos]');
        aosElements.forEach(element => {
            element.style.opacity = '1';
            element.style.transform = 'none';
            element.classList.add('aos-animate');
        });
    }

    /**
     * Setup intersection observer for custom animations
     */
    setupIntersectionObserver() {
        if (!('IntersectionObserver' in window)) {
            console.warn('IntersectionObserver not supported, showing all elements immediately');
            this.showAllAnimatedElements();
            return;
        }

        const isMobile = window.innerWidth < 768;
        const scrollContainer = document.querySelector('#content-wrapper');
        
        // Observer options optimized for custom scroll container
        const observerOptions = {
            threshold: isMobile ? [0, 0.05] : [0.05, 0.2],
            rootMargin: isMobile ? '0px 0px -10px 0px' : '0px 0px -30px 0px',
            root: scrollContainer // Use custom scroll container
        };

        this.intersectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Immediate animation for better responsiveness
                    this.animateElement(entry.target);
                    this.intersectionObserver.unobserve(entry.target);
                }
            });
        }, observerOptions);

        // Start observing elements
        this.observeAnimationElements();
        
        console.log(`Intersection Observer set up for custom animations (mobile: ${isMobile})`);
    }

    /**
     * Setup custom animation definitions
     */
    setupCustomAnimations() {
        // Define custom animation classes
        this.customAnimations.set('fadeInUp', {
            initial: {
                opacity: 0,
                transform: 'translateY(20px)'
            },
            final: {
                opacity: 1,
                transform: 'translateY(0)'
            },
            transition: 'all 0.6s ease-out'
        });

        this.customAnimations.set('fadeInLeft', {
            initial: {
                opacity: 0,
                transform: 'translateX(-20px)'
            },
            final: {
                opacity: 1,
                transform: 'translateX(0)'
            },
            transition: 'all 0.6s ease-out'
        });

        this.customAnimations.set('fadeInRight', {
            initial: {
                opacity: 0,
                transform: 'translateX(20px)'
            },
            final: {
                opacity: 1,
                transform: 'translateX(0)'
            },
            transition: 'all 0.6s ease-out'
        });

        this.customAnimations.set('scaleIn', {
            initial: {
                opacity: 0,
                transform: 'scale(0.9)'
            },
            final: {
                opacity: 1,
                transform: 'scale(1)'
            },
            transition: 'all 0.6s ease-out'
        });

        // Apply initial styles to elements with custom animations
        this.applyInitialAnimationStyles();
    }

    /**
     * Apply initial styles to animation elements
     */
    applyInitialAnimationStyles() {
        const animateElements = [
            '.service-card', 
            '.stat-item', 
            '.about-content', 
            '.contact-content',
            '.grid-image-item',
            '.testimonial-card',
            '.why-us-text',
            '.visit-us-text',
            '.listen-children-text',
            '.lets-meet-text',
            '.join-us-content'
        ];
        
        animateElements.forEach(selector => {
            document.querySelectorAll(selector).forEach(element => {
                if (!element.classList.contains('animate-in')) {
                    // Apply initial animation state
                    const animationType = element.dataset.animation || 'fadeInUp';
                    const animation = this.customAnimations.get(animationType);
                    
                    if (animation) {
                        Object.assign(element.style, animation.initial);
                        element.style.transition = animation.transition;
                    }
                }
            });
        });
    }

    /**
     * Observe elements for animation
     */
    observeAnimationElements() {
        const animateElements = [
            '.service-card', 
            '.stat-item', 
            '.about-content', 
            '.contact-content',
            '.grid-image-item',
            '.testimonial-card',
            '.why-us-text',
            '.visit-us-text',
            '.listen-children-text',
            '.lets-meet-text',
            '.join-us-content'
        ];
        
        let observedCount = 0;
        animateElements.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                try {
                    if (this.intersectionObserver && !el.classList.contains('animate-in')) {
                        this.intersectionObserver.observe(el);
                        observedCount++;
                    }
                } catch (error) {
                    console.warn(`Failed to observe element ${selector}:`, error);
                    this.animateElement(el);
                }
            });
        });
        
        console.log(`Observing ${observedCount} elements for custom animations`);
    }

    /**
     * Animate a single element
     * @param {HTMLElement} element - Element to animate
     */
    animateElement(element) {
        if (element.classList.contains('animate-in')) return;
        
        element.classList.add('animate-in');
        this.animatedElements.add(element);
        
        // Apply final animation state
        const animationType = element.dataset.animation || 'fadeInUp';
        const animation = this.customAnimations.get(animationType);
        
        if (animation) {
            Object.assign(element.style, animation.final);
        }
        
        // Emit animation event
        this.eventManager.emit('elementAnimated', {
            element,
            animationType,
            selector: element.className
        });
    }

    /**
     * Show all animated elements immediately
     */
    showAllAnimatedElements() {
        const animateElements = [
            '.service-card', 
            '.stat-item', 
            '.about-content', 
            '.contact-content',
            '.grid-image-item',
            '.testimonial-card',
            '.why-us-text',
            '.visit-us-text',
            '.listen-children-text',
            '.lets-meet-text',
            '.join-us-content'
        ];
        
        animateElements.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => {
                this.animateElement(el);
            });
        });
    }

    /**
     * Check and animate visible elements
     */
    checkVisibleAnimations() {
        const scrollContainer = document.getElementById('content-wrapper');
        const scrollTop = scrollContainer ? scrollContainer.scrollTop : window.pageYOffset;
        const containerHeight = scrollContainer ? scrollContainer.clientHeight : window.innerHeight;
        
        // Check AOS elements
        const aosElements = document.querySelectorAll('[data-aos]:not(.aos-animate)');
        aosElements.forEach(element => {
            const rect = element.getBoundingClientRect();
            const isVisible = rect.top < containerHeight && rect.bottom > 0;
            
            if (isVisible) {
                element.classList.add('aos-animate');
                element.style.opacity = '1';
                element.style.transform = 'none';
            }
        });
        
        // Check custom animation elements
        const animateElements = [
            '.service-card:not(.animate-in)', 
            '.stat-item:not(.animate-in)', 
            '.about-content:not(.animate-in)', 
            '.contact-content:not(.animate-in)',
            '.grid-image-item:not(.animate-in)',
            '.testimonial-card:not(.animate-in)',
            '.why-us-text:not(.animate-in)',
            '.visit-us-text:not(.animate-in)',
            '.listen-children-text:not(.animate-in)',
            '.lets-meet-text:not(.animate-in)',
            '.join-us-content:not(.animate-in)'
        ];
        
        animateElements.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                const rect = element.getBoundingClientRect();
                const isVisible = rect.top < containerHeight && rect.bottom > 0;
                
                if (isVisible) {
                    this.animateElement(element);
                }
            });
        });
    }

    /**
     * Setup periodic check for missed animations
     */
    setupPeriodicCheck() {
        // Check animations immediately for visible elements
        setTimeout(() => {
            this.checkVisibleAnimations();
        }, 50);
        
        // Setup periodic checks to catch any missed animations
        this.checkInterval = setInterval(() => {
            this.checkVisibleAnimations();
        }, 500);
        
        // Stop checking after 10 seconds
        setTimeout(() => {
            if (this.checkInterval) {
                clearInterval(this.checkInterval);
                this.checkInterval = null;
            }
        }, 10000);
    }

    /**
     * Handle scroll events
     * @param {Object} scrollData - Scroll event data
     */
    handleScroll(scrollData) {
        // Throttled animation check
        if (!this.scrollAnimationTimeout) {
            this.scrollAnimationTimeout = setTimeout(() => {
                this.checkVisibleAnimations();
                this.scrollAnimationTimeout = null;
            }, 50);
        }
    }

    /**
     * Handle resize events
     * @param {Object} resizeData - Resize event data
     */
    handleResize(resizeData) {
        // Re-initialize AOS with new settings if needed
        if (typeof AOS !== 'undefined') {
            const wasMobile = this.wasMobile;
            this.wasMobile = resizeData.isMobile;
            
            if (wasMobile !== resizeData.isMobile) {
                // Device type changed, reinitialize AOS
                setTimeout(() => {
                    this.reinitializeAOS(resizeData.isMobile);
                }, 100);
            } else {
                // Just refresh
                setTimeout(() => {
                    AOS.refresh();
                    this.checkVisibleAnimations();
                }, 150);
            }
        } else {
            // No AOS, just check custom animations
            setTimeout(() => {
                this.checkVisibleAnimations();
            }, 150);
        }
    }

    /**
     * Handle touch end events on mobile
     * @param {Object} touchData - Touch event data
     */
    handleTouchEnd(touchData) {
        // Force refresh animations after significant scroll
        if (touchData.isSignificantScroll) {
            setTimeout(() => {
                if (typeof AOS !== 'undefined') {
                    AOS.refresh();
                }
                this.checkVisibleAnimations();
            }, 100);
        }
    }

    /**
     * Handle orientation change
     * @param {Object} orientationData - Orientation event data
     */
    handleOrientationChange(orientationData) {
        // Force refresh after orientation change
        setTimeout(() => {
            if (typeof AOS !== 'undefined') {
                AOS.refresh();
            }
            this.checkVisibleAnimations();
        }, 300);
    }

    /**
     * Reinitialize AOS with mobile-specific settings
     * @param {boolean} isMobile - Is mobile device
     */
    reinitializeAOS(isMobile) {
        if (typeof AOS === 'undefined') return;
        
        AOS.refresh();
        
        // Update settings based on device type
        AOS.init({
            duration: isMobile ? 600 : 800,
            once: true,
            offset: isMobile ? 30 : 80,
            delay: 0,
            disable: false,
            easing: 'ease-out-cubic',
            mirror: false,
            anchorPlacement: 'top-bottom',
            debounceDelay: 50,
            throttleDelay: 50
        });
        
        // Force check visible animations
        setTimeout(() => {
            this.checkVisibleAnimations();
        }, 100);
        
        console.log('AOS reinitialized for', isMobile ? 'mobile' : 'desktop');
    }

    /**
     * Add custom animation
     * @param {string} name - Animation name
     * @param {Object} definition - Animation definition
     */
    addCustomAnimation(name, definition) {
        this.customAnimations.set(name, definition);
    }

    /**
     * Trigger animation on specific element
     * @param {string} selector - CSS selector
     * @param {string} animationType - Animation type
     */
    triggerAnimation(selector, animationType = 'fadeInUp') {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
            element.dataset.animation = animationType;
            this.animateElement(element);
        });
    }

    /**
     * Reset animation for element (useful for re-triggering)
     * @param {HTMLElement} element - Element to reset
     */
    resetAnimation(element) {
        element.classList.remove('animate-in', 'aos-animate');
        this.animatedElements.delete(element);
        
        // Apply initial state
        const animationType = element.dataset.animation || 'fadeInUp';
        const animation = this.customAnimations.get(animationType);
        
        if (animation) {
            Object.assign(element.style, animation.initial);
        }
    }

    /**
     * Get animation status
     * @returns {Object} Animation status information
     */
    getAnimationStatus() {
        const totalElements = document.querySelectorAll('[data-aos], .service-card, .stat-item, .about-content, .contact-content, .grid-image-item, .testimonial-card, .why-us-text, .visit-us-text, .listen-children-text, .lets-meet-text, .join-us-content').length;
        
        const aosAnimated = document.querySelectorAll('[data-aos].aos-animate').length;
        const customAnimated = document.querySelectorAll('.animate-in').length;
        
        return {
            totalElements,
            aosAnimated,
            customAnimated,
            totalAnimated: aosAnimated + customAnimated,
            hasAOS: typeof AOS !== 'undefined',
            hasIntersectionObserver: !!this.intersectionObserver
        };
    }

    /**
     * Get debug information
     * @returns {Object} Debug information
     */
    getDebugInfo() {
        return {
            ...this.getAnimationStatus(),
            animatedElements: this.animatedElements.size,
            customAnimations: Array.from(this.customAnimations.keys()),
            intervalActive: !!this.checkInterval
        };
    }

    /**
     * Clean up animation manager
     */
    cleanup() {
        // Clear interval
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
        
        // Disconnect observer
        if (this.intersectionObserver) {
            this.intersectionObserver.disconnect();
            this.intersectionObserver = null;
        }
        
        // Clear sets and maps
        this.animatedElements.clear();
        this.customAnimations.clear();
        
        console.log('AnimationManager cleaned up');
    }
}

// Export for module systems or assign to window
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnimationManager;
} else {
    window.AnimationManager = AnimationManager;
} 