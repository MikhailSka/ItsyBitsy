/**
 * Touch Manager - Handles touch events, gestures, and mobile optimizations
 * Follows Single Responsibility Principle by focusing solely on touch interactions
 * File path: assets/js/managers/TouchManager.js
 */

class TouchManager {
    constructor(eventManager) {
        this.eventManager = eventManager;
        this.touchState = {
            startX: 0,
            startY: 0,
            currentX: 0,
            currentY: 0,
            touchStarted: false,
            isScrolling: false
        };
        this.gestureThreshold = 75;
        this.swipeEdgeZone = 50; // Pixels from edge to trigger swipe
        this.isInitialized = false;
        
        this.init();
    }

    /**
     * Initialize touch manager
     */
    init() {
        try {
            this.setupTouchSupport();
            this.setupTouchOptimizations();
            this.setupGestureHandling();
            this.isInitialized = true;
            
            console.log('TouchManager initialized successfully');
        } catch (error) {
            console.error('TouchManager initialization failed:', error);
        }
    }

    /**
     * Check for touch support and setup accordingly
     */
    setupTouchSupport() {
        if (!('ontouchstart' in window)) {
            console.log('Touch events not supported, skipping touch optimizations');
            return;
        }

        this.isTouchDevice = true;
        this.setupTouchEventListeners();
        this.setupTouchFeedback();
        this.setupScrollPrevention();
    }

    /**
     * Setup core touch event listeners
     */
    setupTouchEventListeners() {
        // Global touch events for swipe gestures
        document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
        document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: true });
        document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });
        
        // Touch cancel for edge cases
        document.addEventListener('touchcancel', this.handleTouchCancel.bind(this), { passive: true });
    }

    /**
     * Handle touch start events
     */
    handleTouchStart(e) {
        if (!e.touches || e.touches.length === 0) return;
        
        this.touchState.startX = e.touches[0].clientX;
        this.touchState.startY = e.touches[0].clientY;
        this.touchState.currentX = this.touchState.startX;
        this.touchState.currentY = this.touchState.startY;
        this.touchState.touchStarted = true;
        this.touchState.isScrolling = false;

        // Emit touch start event
        this.eventManager.emit('touchStart', {
            x: this.touchState.startX,
            y: this.touchState.startY,
            target: e.target
        });
    }

    /**
     * Handle touch move events
     */
    handleTouchMove(e) {
        if (!this.touchState.touchStarted || !e.touches || e.touches.length === 0) return;
        
        this.touchState.currentX = e.touches[0].clientX;
        this.touchState.currentY = e.touches[0].clientY;
        
        // Determine if user is scrolling vertically
        const deltaY = Math.abs(this.touchState.currentY - this.touchState.startY);
        const deltaX = Math.abs(this.touchState.currentX - this.touchState.startX);
        
        if (deltaY > deltaX && deltaY > 10) {
            this.touchState.isScrolling = true;
        }

        // Emit touch move event
        this.eventManager.emit('touchMove', {
            startX: this.touchState.startX,
            startY: this.touchState.startY,
            currentX: this.touchState.currentX,
            currentY: this.touchState.currentY,
            deltaX: this.touchState.currentX - this.touchState.startX,
            deltaY: this.touchState.currentY - this.touchState.startY,
            isScrolling: this.touchState.isScrolling
        });
    }

    /**
     * Handle touch end events
     */
    handleTouchEnd(e) {
        if (!this.touchState.touchStarted) {
            this.resetTouchState();
            return;
        }
        
        // Skip if user was scrolling
        if (this.touchState.isScrolling) {
            this.resetTouchState();
            return;
        }
        
        const deltaX = this.touchState.currentX - this.touchState.startX;
        const deltaY = this.touchState.currentY - this.touchState.startY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // Detect swipe gestures
        if (distance > this.gestureThreshold) {
            this.handleSwipeGesture(deltaX, deltaY);
        }

        // Emit touch end event
        this.eventManager.emit('touchEnd', {
            deltaX,
            deltaY,
            distance,
            startX: this.touchState.startX,
            startY: this.touchState.startY,
            target: e.target
        });

        this.resetTouchState();
    }

    /**
     * Handle touch cancel events
     */
    handleTouchCancel(e) {
        this.eventManager.emit('touchCancel', {
            touchState: { ...this.touchState }
        });
        this.resetTouchState();
    }

    /**
     * Reset touch state
     */
    resetTouchState() {
        this.touchState = {
            startX: 0,
            startY: 0,
            currentX: 0,
            currentY: 0,
            touchStarted: false,
            isScrolling: false
        };
    }

    /**
     * Handle swipe gestures
     */
    handleSwipeGesture(deltaX, deltaY) {
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);
        
        // Horizontal swipe is more dominant
        if (absX > absY) {
            if (deltaX > 0) {
                this.handleSwipeRight();
            } else {
                this.handleSwipeLeft();
            }
        } else {
            // Vertical swipe
            if (deltaY > 0) {
                this.handleSwipeDown();
            } else {
                this.handleSwipeUp();
            }
        }
    }

    /**
     * Handle swipe right gesture
     */
    handleSwipeRight() {
        this.eventManager.emit('swipeRight', {
            gesture: 'swipeRight',
            startX: this.touchState.startX,
            canCloseMenu: true // Usually used to close menu
        });
    }

    /**
     * Handle swipe left gesture
     */
    handleSwipeLeft() {
        const isEdgeSwipe = this.touchState.startX > window.innerWidth - this.swipeEdgeZone;
        
        this.eventManager.emit('swipeLeft', {
            gesture: 'swipeLeft',
            startX: this.touchState.startX,
            isEdgeSwipe,
            canOpenMenu: isEdgeSwipe // Only open menu from edge
        });
    }

    /**
     * Handle swipe up gesture
     */
    handleSwipeUp() {
        this.eventManager.emit('swipeUp', {
            gesture: 'swipeUp',
            startY: this.touchState.startY
        });
    }

    /**
     * Handle swipe down gesture
     */
    handleSwipeDown() {
        this.eventManager.emit('swipeDown', {
            gesture: 'swipeDown',
            startY: this.touchState.startY
        });
    }

    /**
     * Setup touch feedback for interactive elements
     */
    setupTouchFeedback() {
        // Add touch feedback to navigation links
        const addTouchFeedbackToElements = (selector, feedbackClass = 'touch-active') => {
            const elements = document.querySelectorAll(selector);
            
            elements.forEach(element => {
                element.addEventListener('touchstart', function() {
                    this.classList.add(feedbackClass);
                    this.style.transform = 'scale(0.98)';
                }, { passive: true });
                
                element.addEventListener('touchend', function() {
                    this.classList.remove(feedbackClass);
                    this.style.transform = 'scale(1)';
                }, { passive: true });
                
                element.addEventListener('touchcancel', function() {
                    this.classList.remove(feedbackClass);
                    this.style.transform = 'scale(1)';
                }, { passive: true });
            });
        };

        // Apply to common interactive elements
        addTouchFeedbackToElements('.nav-link');
        addTouchFeedbackToElements('button');
        addTouchFeedbackToElements('.btn');
        addTouchFeedbackToElements('[role="button"]');
    }

    /**
     * Setup scroll prevention for menu interactions
     */
    setupScrollPrevention() {
        this.scrollPreventionHandler = (e) => {
            // This will be controlled by external managers
            // when they need to prevent scrolling
            if (this.shouldPreventScroll) {
                const target = e.target;
                const isInScrollableContainer = target.closest('.scrollable-content');
                
                if (!isInScrollableContainer) {
                    e.preventDefault();
                }
            }
        };

        document.addEventListener('touchmove', this.scrollPreventionHandler, { passive: false });
    }

    /**
     * Enable scroll prevention
     */
    enableScrollPrevention() {
        this.shouldPreventScroll = true;
        this.eventManager.emit('scrollPreventionEnabled');
    }

    /**
     * Disable scroll prevention
     */
    disableScrollPrevention() {
        this.shouldPreventScroll = false;
        this.eventManager.emit('scrollPreventionDisabled');
    }

    /**
     * Setup touch optimizations
     */
    setupTouchOptimizations() {
        this.optimizeTouchTargets();
        this.setupTouchActionOptimizations();
        this.setupTapHighlightOptimizations();
    }

    /**
     * Optimize touch targets
     */
    optimizeTouchTargets() {
        const touchTargets = document.querySelectorAll('button, .nav-link, .btn, [role="button"]');
        
        touchTargets.forEach(target => {
            // Ensure minimum touch target size (44px recommended)
            const computedStyle = window.getComputedStyle(target);
            const height = parseInt(computedStyle.height);
            const width = parseInt(computedStyle.width);
            
            if (height < 44 || width < 44) {
                target.style.minHeight = '44px';
                target.style.minWidth = '44px';
                target.style.display = target.style.display || 'inline-flex';
                target.style.alignItems = 'center';
                target.style.justifyContent = 'center';
            }
            
            // Improve touch responsiveness
            target.style.touchAction = 'manipulation';
        });
    }

    /**
     * Setup touch-action optimizations
     */
    setupTouchActionOptimizations() {
        // Optimize common interactive elements
        const style = document.createElement('style');
        style.textContent = `
            .nav-link, button, .btn, [role="button"] {
                touch-action: manipulation;
                -webkit-tap-highlight-color: transparent;
            }
            
            .scrollable-content {
                touch-action: pan-y;
            }
            
            .draggable-element {
                touch-action: pan-x pan-y;
            }
            
            .pinch-zoom-element {
                touch-action: pinch-zoom;
            }
        `;
        
        document.head.appendChild(style);
        this.optimizationStyle = style;
    }

    /**
     * Setup tap highlight optimizations
     */
    setupTapHighlightOptimizations() {
        // Remove default webkit tap highlighting and add custom feedback
        const elements = document.querySelectorAll('a, button, .nav-link, .btn, [role="button"]');
        
        elements.forEach(element => {
            element.style.webkitTapHighlightColor = 'transparent';
            element.style.tapHighlightColor = 'transparent';
        });
    }

    /**
     * Get current touch state
     */
    getTouchState() {
        return { ...this.touchState };
    }

    /**
     * Check if device supports touch
     */
    isTouchSupported() {
        return this.isTouchDevice || false;
    }

    /**
     * Get gesture configuration
     */
    getGestureConfig() {
        return {
            threshold: this.gestureThreshold,
            edgeZone: this.swipeEdgeZone
        };
    }

    /**
     * Update gesture configuration
     */
    updateGestureConfig(config) {
        if (config.threshold !== undefined) {
            this.gestureThreshold = Math.max(10, config.threshold);
        }
        if (config.edgeZone !== undefined) {
            this.swipeEdgeZone = Math.max(10, config.edgeZone);
        }
        
        this.eventManager.emit('gestureConfigUpdated', this.getGestureConfig());
    }

    /**
     * Setup additional gesture handling
     */
    setupGestureHandling() {
        // Long press detection
        this.setupLongPressDetection();
        
        // Double tap detection
        this.setupDoubleTapDetection();
    }

    /**
     * Setup long press detection
     */
    setupLongPressDetection() {
        let longPressTimer = null;
        const longPressDelay = 800; // milliseconds
        
        this.eventManager.on('touchStart', (data) => {
            longPressTimer = setTimeout(() => {
                this.eventManager.emit('longPress', {
                    x: data.x,
                    y: data.y,
                    target: data.target
                });
            }, longPressDelay);
        });

        this.eventManager.on('touchMove', () => {
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
        });

        this.eventManager.on('touchEnd', () => {
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
        });
    }

    /**
     * Setup double tap detection
     */
    setupDoubleTapDetection() {
        let lastTapTime = 0;
        let lastTapX = 0;
        let lastTapY = 0;
        const doubleTapDelay = 300; // milliseconds
        const doubleTapDistance = 50; // pixels
        
        this.eventManager.on('touchEnd', (data) => {
            const currentTime = Date.now();
            const timeDiff = currentTime - lastTapTime;
            const distance = Math.sqrt(
                Math.pow(data.startX - lastTapX, 2) + 
                Math.pow(data.startY - lastTapY, 2)
            );
            
            if (timeDiff < doubleTapDelay && distance < doubleTapDistance) {
                this.eventManager.emit('doubleTap', {
                    x: data.startX,
                    y: data.startY,
                    target: data.target
                });
            }
            
            lastTapTime = currentTime;
            lastTapX = data.startX;
            lastTapY = data.startY;
        });
    }

    /**
     * Destroy touch manager
     */
    destroy() {
        try {
            // Remove event listeners
            document.removeEventListener('touchstart', this.handleTouchStart);
            document.removeEventListener('touchmove', this.handleTouchMove);
            document.removeEventListener('touchend', this.handleTouchEnd);
            document.removeEventListener('touchcancel', this.handleTouchCancel);
            
            if (this.scrollPreventionHandler) {
                document.removeEventListener('touchmove', this.scrollPreventionHandler);
            }

            // Remove optimization styles
            if (this.optimizationStyle && this.optimizationStyle.parentNode) {
                this.optimizationStyle.parentNode.removeChild(this.optimizationStyle);
            }

            // Clean up references
            this.eventManager = null;
            this.touchState = null;
            this.optimizationStyle = null;
            
            console.log('TouchManager destroyed successfully');
        } catch (error) {
            console.error('Error destroying TouchManager:', error);
        }
    }

    /**
     * Get debug information
     */
    getDebugInfo() {
        return {
            isInitialized: this.isInitialized,
            isTouchDevice: this.isTouchDevice || false,
            touchState: this.getTouchState(),
            gestureConfig: this.getGestureConfig(),
            scrollPreventionActive: this.shouldPreventScroll || false
        };
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TouchManager;
} 