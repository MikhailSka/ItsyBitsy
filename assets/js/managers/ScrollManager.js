/**
 * ScrollManager - Handles scroll events, parallax effects, and scroll-based UI changes
 */

class ScrollManager {
    constructor(eventManager) {
        this.eventManager = eventManager;
        this.scrollEffects = new Map();
        this.parallaxElements = new Map();
        this.lastScrollTop = 0;
        this.scrollDirection = 'down';
        this.isScrolling = false;
        this.scrollTimeout = null;
        this.init();
    }

    /**
     * Initialize scroll manager
     */
    init() {
        this.setupEventListeners();
        this.setupParallaxElements();
        this.setupHeaderEffects();
        this.setupScrollEffects();
        this.updateViewportHeight();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Listen for scroll events from EventManager
        this.eventManager.on('scroll', this.handleScroll.bind(this));
        
        // Listen for resize events
        this.eventManager.on('resize', this.handleResize.bind(this));
        
        // Listen for load events
        this.eventManager.on('load', this.handleLoad.bind(this));
    }

    /**
     * Setup parallax elements
     */
    setupParallaxElements() {
        // Hero background parallax
        const heroBg = document.querySelector('.hero-bg img, .hero-bg');
        const heroSection = document.querySelector('.hero-section');
        
        if (heroBg && heroSection) {
            this.addParallaxElement('hero-bg', {
                element: heroBg,
                container: heroSection,
                speed: 0.5,
                direction: 'vertical',
                bounds: {
                    start: 0,
                    end: null // Will be calculated
                }
            });
        }

        // Additional parallax elements
        const parallaxElements = document.querySelectorAll('[data-parallax]');
        parallaxElements.forEach((element, index) => {
            const speed = parseFloat(element.dataset.parallaxSpeed) || 0.5;
            const direction = element.dataset.parallaxDirection || 'vertical';
            
            this.addParallaxElement(`parallax-${index}`, {
                element,
                container: element.parentElement,
                speed,
                direction,
                bounds: {
                    start: 0,
                    end: null
                }
            });
        });


    }

    /**
     * Setup header scroll effects
     */
    setupHeaderEffects() {
        const header = document.querySelector('.header');
        
        if (header) {
            this.addScrollEffect('header-scroll', {
                trigger: (scrollData) => scrollData.scrollTop > 50,
                onActivate: () => {
                    if (window.innerWidth >= 768) {
                        header.classList.add('scrolled');
                    }
                },
                onDeactivate: () => {
                    header.classList.remove('scrolled');
                },
                requiresDesktop: true
            });
        }
    }

    /**
     * Setup additional scroll effects
     */
    setupScrollEffects() {
        // Scroll to top button
        const scrollToTopBtn = document.querySelector('.scroll-to-top');
        
        if (scrollToTopBtn) {
            this.addScrollEffect('scroll-to-top', {
                trigger: (scrollData) => scrollData.scrollTop > 300,
                onActivate: () => {
                    scrollToTopBtn.classList.add('visible');
                },
                onDeactivate: () => {
                    scrollToTopBtn.classList.remove('visible');
                }
            });

            // Add click handler
            scrollToTopBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.scrollToTop();
            });
        }

        // Reading progress indicator
        const progressBar = document.querySelector('.reading-progress');
        
        if (progressBar) {
            this.addScrollEffect('reading-progress', {
                trigger: () => true, // Always active
                onUpdate: (scrollData) => {
                    const scrollContainer = document.querySelector('#content-wrapper');
                    const scrollHeight = scrollContainer ? 
                        scrollContainer.scrollHeight - scrollContainer.clientHeight :
                        document.documentElement.scrollHeight - window.innerHeight;
                    
                    const progress = (scrollData.scrollTop / scrollHeight) * 100;
                    progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
                }
            });
        }
    }

    /**
     * Add parallax element
     * @param {string} id - Unique identifier
     * @param {Object} config - Parallax configuration
     */
    addParallaxElement(id, config) {
        // Calculate bounds if not provided
        if (!config.bounds.end && config.container) {
            config.bounds.end = config.container.offsetHeight + window.innerHeight;
        }

        this.parallaxElements.set(id, config);
    }

    /**
     * Add scroll effect
     * @param {string} id - Unique identifier
     * @param {Object} config - Scroll effect configuration
     */
    addScrollEffect(id, config) {
        const effect = {
            ...config,
            active: false,
            lastUpdate: 0
        };

        this.scrollEffects.set(id, effect);
    }

    /**
     * Handle scroll events
     * @param {Object} scrollData - Scroll event data
     */
    handleScroll(scrollData) {
        // Update scroll direction
        this.updateScrollDirection(scrollData.scrollTop);
        
        // Mark as scrolling
        this.isScrolling = true;
        
        // Clear existing timeout
        if (this.scrollTimeout) {
            clearTimeout(this.scrollTimeout);
        }
        
        // Update parallax effects (desktop only for performance)
        if (window.innerWidth >= 768) {
            this.updateParallaxEffects(scrollData);
        }
        
        // Update scroll effects
        this.updateScrollEffects(scrollData);
        
        // Set timeout to mark scrolling as stopped
        this.scrollTimeout = setTimeout(() => {
            this.isScrolling = false;
            this.eventManager.emit('scrollStopped', {
                scrollTop: scrollData.scrollTop,
                direction: this.scrollDirection
            });
        }, 150);
        
        // Update last scroll position
        this.lastScrollTop = scrollData.scrollTop;
    }

    /**
     * Update scroll direction
     * @param {number} currentScrollTop - Current scroll position
     */
    updateScrollDirection(currentScrollTop) {
        if (currentScrollTop > this.lastScrollTop) {
            this.scrollDirection = 'down';
        } else if (currentScrollTop < this.lastScrollTop) {
            this.scrollDirection = 'up';
        }
    }

    /**
     * Update parallax effects
     * @param {Object} scrollData - Scroll event data
     */
    updateParallaxEffects(scrollData) {
        this.parallaxElements.forEach((config, id) => {
            try {
                this.updateSingleParallax(config, scrollData);
            } catch (error) {
                console.warn(`Error updating parallax ${id}:`, error);
            }
        });
    }

    /**
     * Update single parallax element
     * @param {Object} config - Parallax configuration
     * @param {Object} scrollData - Scroll data
     */
    updateSingleParallax(config, scrollData) {
        const { element, container, speed, direction, bounds } = config;
        
        // Check if element is in view
        if (container) {
            const containerRect = container.getBoundingClientRect();
            const containerTop = scrollData.scrollTop + containerRect.top;
            const containerBottom = containerTop + container.offsetHeight;
            
            // Only update if container is in viewport or nearby
            if (containerBottom < scrollData.scrollTop - window.innerHeight ||
                containerTop > scrollData.scrollTop + window.innerHeight * 2) {
                return;
            }
        }
        
        // Calculate parallax offset
        let offset;
        if (bounds.start !== null && bounds.end !== null) {
            // Bounded parallax
            const progress = Math.max(0, Math.min(1, 
                (scrollData.scrollTop - bounds.start) / (bounds.end - bounds.start)
            ));
            offset = progress * bounds.end * speed;
        } else {
            // Unbounded parallax
            offset = scrollData.scrollTop * speed;
        }
        
        // Apply transform based on direction
        let transform;
        switch (direction) {
            case 'horizontal':
                transform = `translateX(${offset}px)`;
                break;
            case 'both':
                transform = `translate(${offset * 0.5}px, ${offset}px)`;
                break;
            case 'vertical':
            default:
                transform = `translateY(${offset}px)`;
                break;
        }
        
        // Apply transform with hardware acceleration
        element.style.transform = transform;
        element.style.willChange = 'transform';
    }

    /**
     * Update scroll effects
     * @param {Object} scrollData - Scroll event data
     */
    updateScrollEffects(scrollData) {
        this.scrollEffects.forEach((effect, id) => {
            try {
                this.updateSingleScrollEffect(effect, scrollData, id);
            } catch (error) {
                console.warn(`Error updating scroll effect ${id}:`, error);
            }
        });
    }

    /**
     * Update single scroll effect
     * @param {Object} effect - Scroll effect configuration
     * @param {Object} scrollData - Scroll data
     * @param {string} id - Effect ID
     */
    updateSingleScrollEffect(effect, scrollData, id) {
        // Check if effect should be active
        const shouldBeActive = effect.trigger(scrollData);
        
        // Handle activation/deactivation
        if (shouldBeActive && !effect.active) {
            // Check desktop requirement
            if (effect.requiresDesktop && window.innerWidth < 768) {
                return;
            }
            
            effect.active = true;
            if (effect.onActivate) {
                effect.onActivate(scrollData);
            }
        } else if (!shouldBeActive && effect.active) {
            effect.active = false;
            if (effect.onDeactivate) {
                effect.onDeactivate(scrollData);
            }
        }
        
        // Handle continuous updates
        if (effect.onUpdate) {
            const now = Date.now();
            const updateThrottle = effect.updateThrottle || 16; // ~60fps by default
            
            if (now - effect.lastUpdate >= updateThrottle) {
                effect.onUpdate(scrollData);
                effect.lastUpdate = now;
            }
        }
    }

    /**
     * Handle resize events
     * @param {Object} resizeData - Resize event data
     */
    handleResize(resizeData) {
        // Update viewport height
        this.updateViewportHeight();
        
        // Recalculate parallax bounds
        this.recalculateParallaxBounds();
        
        // Update container sizes
        this.updateContainerSizes();
        
        // Disable parallax on mobile for performance
        if (resizeData.isMobile) {
            this.disableParallaxOnMobile();
        } else {
            this.enableParallaxOnDesktop();
        }
    }

    /**
     * Handle load events
     */
    handleLoad() {
        // Force update all effects after load
        setTimeout(() => {
            const scrollContainer = document.querySelector('#content-wrapper');
            const scrollTop = scrollContainer ? scrollContainer.scrollTop : window.pageYOffset;
            
            this.handleScroll({
                scrollTop,
                scrollLeft: scrollContainer ? scrollContainer.scrollLeft : window.pageXOffset,
                target: scrollContainer || window,
                isCustomContainer: !!scrollContainer
            });
        }, 100);
    }

    /**
     * Update viewport height for mobile
     */
    updateViewportHeight() {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }

    /**
     * Recalculate parallax bounds after resize
     */
    recalculateParallaxBounds() {
        this.parallaxElements.forEach((config, id) => {
            if (config.container && !config.bounds.end) {
                config.bounds.end = config.container.offsetHeight + window.innerHeight;
            }
        });
    }

    /**
     * Update container sizes
     */
    updateContainerSizes() {
        const containers = document.querySelectorAll('.container');
        containers.forEach(container => {
            // Trigger reflow if needed
            container.offsetHeight;
        });
    }

    /**
     * Disable parallax effects on mobile
     */
    disableParallaxOnMobile() {
        this.parallaxElements.forEach((config, id) => {
            config.element.style.transform = 'none';
            config.element.style.willChange = 'auto';
        });
    }

    /**
     * Enable parallax effects on desktop
     */
    enableParallaxOnDesktop() {
        // Re-enable parallax by forcing a scroll update
        const scrollContainer = document.querySelector('#content-wrapper');
        const scrollTop = scrollContainer ? scrollContainer.scrollTop : window.pageYOffset;
        
        this.updateParallaxEffects({
            scrollTop,
            scrollLeft: scrollContainer ? scrollContainer.scrollLeft : window.pageXOffset
        });
    }

    /**
     * Smooth scroll to top
     * @param {number} duration - Animation duration in milliseconds
     */
    scrollToTop(duration = 800) {
        const scrollContainer = document.querySelector('#content-wrapper');
        const target = scrollContainer || window;
        const startPosition = scrollContainer ? scrollContainer.scrollTop : window.pageYOffset;
        const startTime = Date.now();

        const easeInOutQuart = (t) => {
            return t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t;
        };

        const animateScroll = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeProgress = easeInOutQuart(progress);
            const currentPosition = startPosition - (startPosition * easeProgress);

            if (scrollContainer) {
                scrollContainer.scrollTo({
                    top: currentPosition,
                    behavior: 'auto'
                });
            } else {
                window.scrollTo(0, currentPosition);
            }

            if (progress < 1) {
                requestAnimationFrame(animateScroll);
            }
        };

        requestAnimationFrame(animateScroll);
    }

    /**
     * Smooth scroll to element
     * @param {string|HTMLElement} target - Target element or selector
     * @param {number} offset - Offset from element top
     * @param {number} duration - Animation duration
     */
    scrollToElement(target, offset = 0, duration = 800) {
        const element = typeof target === 'string' ? document.querySelector(target) : target;
        if (!element) return;

        const scrollContainer = document.querySelector('#content-wrapper');
        const header = document.querySelector('.header');
        const headerHeight = header ? header.offsetHeight : 80;
        
        let targetPosition;
        if (scrollContainer) {
            const containerRect = scrollContainer.getBoundingClientRect();
            const elementRect = element.getBoundingClientRect();
            targetPosition = scrollContainer.scrollTop + elementRect.top - containerRect.top - headerHeight - offset;
        } else {
            targetPosition = element.offsetTop - headerHeight - offset;
        }

        const startPosition = scrollContainer ? scrollContainer.scrollTop : window.pageYOffset;
        const distance = targetPosition - startPosition;
        const startTime = Date.now();

        const easeInOutQuart = (t) => {
            return t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t;
        };

        const animateScroll = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeProgress = easeInOutQuart(progress);
            const currentPosition = startPosition + (distance * easeProgress);

            if (scrollContainer) {
                scrollContainer.scrollTo({
                    top: currentPosition,
                    behavior: 'auto'
                });
            } else {
                window.scrollTo(0, currentPosition);
            }

            if (progress < 1) {
                requestAnimationFrame(animateScroll);
            }
        };

        requestAnimationFrame(animateScroll);
    }

    /**
     * Get current scroll information
     * @returns {Object} Scroll information
     */
    getScrollInfo() {
        const scrollContainer = document.querySelector('#content-wrapper');
        
        return {
            scrollTop: scrollContainer ? scrollContainer.scrollTop : window.pageYOffset,
            scrollLeft: scrollContainer ? scrollContainer.scrollLeft : window.pageXOffset,
            scrollHeight: scrollContainer ? scrollContainer.scrollHeight : document.documentElement.scrollHeight,
            clientHeight: scrollContainer ? scrollContainer.clientHeight : window.innerHeight,
            direction: this.scrollDirection,
            isScrolling: this.isScrolling,
            progress: this.getScrollProgress()
        };
    }

    /**
     * Get scroll progress as percentage
     * @returns {number} Progress percentage (0-100)
     */
    getScrollProgress() {
        const scrollContainer = document.querySelector('#content-wrapper');
        const scrollTop = scrollContainer ? scrollContainer.scrollTop : window.pageYOffset;
        const scrollHeight = scrollContainer ? 
            scrollContainer.scrollHeight - scrollContainer.clientHeight :
            document.documentElement.scrollHeight - window.innerHeight;
        
        return scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    }

    /**
     * Remove parallax element
     * @param {string} id - Parallax element ID
     */
    removeParallaxElement(id) {
        const config = this.parallaxElements.get(id);
        if (config) {
            config.element.style.transform = 'none';
            config.element.style.willChange = 'auto';
            this.parallaxElements.delete(id);
        }
    }

    /**
     * Remove scroll effect
     * @param {string} id - Scroll effect ID
     */
    removeScrollEffect(id) {
        this.scrollEffects.delete(id);
    }

    /**
     * Get debug information
     * @returns {Object} Debug information
     */
    getDebugInfo() {
        return {
            parallaxElements: Array.from(this.parallaxElements.keys()),
            scrollEffects: Array.from(this.scrollEffects.keys()),
            scrollInfo: this.getScrollInfo(),
            activeEffects: Array.from(this.scrollEffects.entries())
                .filter(([id, effect]) => effect.active)
                .map(([id]) => id)
        };
    }

    /**
     * Clean up scroll manager
     */
    cleanup() {
        // Clear timeout
        if (this.scrollTimeout) {
            clearTimeout(this.scrollTimeout);
        }
        
        // Reset all parallax elements
        this.parallaxElements.forEach((config, id) => {
            config.element.style.transform = 'none';
            config.element.style.willChange = 'auto';
        });
        
        // Clear maps
        this.parallaxElements.clear();
        this.scrollEffects.clear();
        

    }
}

// Export for module systems or assign to window
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ScrollManager;
} else {
    window.ScrollManager = ScrollManager;
} 