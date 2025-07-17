/**
 * EventManager - Centralized event handling and communication hub
 */

class EventManager {
    constructor() {
        this.eventListeners = new Map();
        this.domEventListeners = new Map();
        this.init();
    }

    /**
     * Initialize event manager
     */
    init() {
        this.setupThrottleAndDebounce();
        this.setupDOMEventListeners();
        this.setupMobileEventListeners();
    }

    /**
     * Setup throttle and debounce utilities
     */
    setupThrottleAndDebounce() {
        // Store throttled/debounced functions to avoid recreation
        this.throttledFunctions = new Map();
        this.debouncedFunctions = new Map();
    }

    /**
     * Add event listener for custom events
     * @param {string} eventName - Name of the event
     * @param {Function} callback - Callback function
     * @param {Object} options - Options object
     */
    on(eventName, callback, options = {}) {
        if (!this.eventListeners.has(eventName)) {
            this.eventListeners.set(eventName, new Set());
        }
        
        const listenerData = {
            callback,
            once: options.once || false,
            context: options.context || null
        };
        
        this.eventListeners.get(eventName).add(listenerData);
        
        // Return remove function
        return () => this.off(eventName, callback);
    }

    /**
     * Remove event listener
     * @param {string} eventName - Name of the event
     * @param {Function} callback - Callback function to remove
     */
    off(eventName, callback) {
        if (!this.eventListeners.has(eventName)) return;
        
        const listeners = this.eventListeners.get(eventName);
        for (const listenerData of listeners) {
            if (listenerData.callback === callback) {
                listeners.delete(listenerData);
                break;
            }
        }
        
        // Clean up empty event arrays
        if (listeners.size === 0) {
            this.eventListeners.delete(eventName);
        }
    }

    /**
     * Emit custom event
     * @param {string} eventName - Name of the event
     * @param {*} data - Data to pass to event listeners
     */
    emit(eventName, data = null) {
        if (!this.eventListeners.has(eventName)) return;
        
        const listeners = this.eventListeners.get(eventName);
        const listenersToRemove = [];
        
        listeners.forEach(listenerData => {
            try {
                if (listenerData.context) {
                    listenerData.callback.call(listenerData.context, data);
                } else {
                    listenerData.callback(data);
                }
                
                // Mark for removal if it's a 'once' listener
                if (listenerData.once) {
                    listenersToRemove.push(listenerData);
                }
            } catch (error) {
                console.error(`Error in event listener for ${eventName}:`, error);
            }
        });
        
        // Remove 'once' listeners
        listenersToRemove.forEach(listenerData => {
            listeners.delete(listenerData);
        });
    }

    /**
     * Setup DOM event listeners with centralized management
     */
    setupDOMEventListeners() {
        // Scroll event handling
        this.setupScrollHandling();
        
        // Resize event handling
        this.setupResizeHandling();
        
        // Load event handling
        this.setupLoadHandling();
    }

    /**
     * Setup scroll event handling
     */
    setupScrollHandling() {
        const scrollContainer = document.querySelector('#content-wrapper');
        const scrollHandler = this.throttle((event) => {
            const scrollData = {
                scrollTop: scrollContainer ? scrollContainer.scrollTop : window.pageYOffset,
                scrollLeft: scrollContainer ? scrollContainer.scrollLeft : window.pageXOffset,
                target: event.target,
                isCustomContainer: !!scrollContainer
            };
            
            this.emit('scroll', scrollData);
        }, 16);
        
        // Bind to both containers for maximum compatibility
        if (scrollContainer) {
            scrollContainer.addEventListener('scroll', scrollHandler, { passive: true });
            this.domEventListeners.set('content-scroll', {
                element: scrollContainer,
                event: 'scroll',
                handler: scrollHandler
            });
        }
        
        window.addEventListener('scroll', scrollHandler, { passive: true });
        this.domEventListeners.set('window-scroll', {
            element: window,
            event: 'scroll',
            handler: scrollHandler
        });
    }

    /**
     * Setup resize event handling
     */
    setupResizeHandling() {
        const resizeHandler = this.debounce((event) => {
            const resizeData = {
                width: window.innerWidth,
                height: window.innerHeight,
                isMobile: window.innerWidth < 768,
                isTablet: window.innerWidth >= 768 && window.innerWidth < 1024,
                isDesktop: window.innerWidth >= 1024
            };
            
            this.emit('resize', resizeData);
        }, 250);
        
        window.addEventListener('resize', resizeHandler);
        this.domEventListeners.set('window-resize', {
            element: window,
            event: 'resize',
            handler: resizeHandler
        });
    }

    /**
     * Setup load event handling
     */
    setupLoadHandling() {
        const loadHandler = (event) => {
            this.emit('load', event);
        };
        
        if (document.readyState === 'loading') {
            window.addEventListener('load', loadHandler);
            this.domEventListeners.set('window-load', {
                element: window,
                event: 'load',
                handler: loadHandler
            });
        } else {
            // Document already loaded, emit immediately
            setTimeout(() => this.emit('load', null), 0);
        }
    }

    /**
     * Setup mobile-specific event listeners
     */
    setupMobileEventListeners() {
        if ('ontouchstart' in window) {
            this.setupTouchHandling();
        }
        
        // Orientation change
        const orientationHandler = this.debounce(() => {
            const orientationData = {
                orientation: screen.orientation ? screen.orientation.angle : window.orientation,
                isPortrait: window.innerHeight > window.innerWidth,
                isLandscape: window.innerWidth > window.innerHeight
            };
            
            this.emit('orientationchange', orientationData);
        }, 300);
        
        window.addEventListener('orientationchange', orientationHandler);
        this.domEventListeners.set('orientation', {
            element: window,
            event: 'orientationchange',
            handler: orientationHandler
        });
    }

    /**
     * Setup touch event handling
     */
    setupTouchHandling() {
        let touchStartTime = null;
        let touchStartY = null;
        
        const touchStartHandler = (event) => {
            touchStartTime = Date.now();
            touchStartY = event.touches[0].clientY;
            
            this.emit('touchstart', {
                time: touchStartTime,
                y: touchStartY,
                touches: event.touches.length,
                originalEvent: event
            });
        };
        
        const touchEndHandler = (event) => {
            if (!touchStartTime || !touchStartY) return;
            
            const touchEndTime = Date.now();
            const touchDuration = touchEndTime - touchStartTime;
            const touchEndY = event.changedTouches[0].clientY;
            const touchDistance = Math.abs(touchEndY - touchStartY);
            
            const touchData = {
                startTime: touchStartTime,
                endTime: touchEndTime,
                duration: touchDuration,
                startY: touchStartY,
                endY: touchEndY,
                distance: touchDistance,
                isSignificantScroll: touchDuration < 1000 && touchDistance > 50,
                originalEvent: event
            };
            
            this.emit('touchend', touchData);
            
            // Reset tracking
            touchStartTime = null;
            touchStartY = null;
        };
        
        window.addEventListener('touchstart', touchStartHandler, { passive: true });
        window.addEventListener('touchend', touchEndHandler, { passive: true });
        
        this.domEventListeners.set('touch-start', {
            element: window,
            event: 'touchstart',
            handler: touchStartHandler
        });
        
        this.domEventListeners.set('touch-end', {
            element: window,
            event: 'touchend',
            handler: touchEndHandler
        });
    }

    /**
     * Setup form event delegation
     * @param {string} formSelector - CSS selector for forms
     */
    setupFormEvents(formSelector = 'form') {
        const formHandler = (event) => {
            if (event.target.matches(formSelector)) {
                this.emit('formSubmit', {
                    form: event.target,
                    formData: new FormData(event.target),
                    originalEvent: event
                });
            }
        };
        
        document.addEventListener('submit', formHandler);
        this.domEventListeners.set('form-submit', {
            element: document,
            event: 'submit',
            handler: formHandler
        });
    }

    /**
     * Setup click event delegation
     * @param {string} selector - CSS selector for clickable elements
     * @param {string} eventName - Custom event name to emit
     */
    setupClickEvents(selector, eventName) {
        const clickHandler = (event) => {
            const target = event.target.closest(selector);
            if (target) {
                this.emit(eventName, {
                    target,
                    originalEvent: event
                });
            }
        };
        
        document.addEventListener('click', clickHandler);
        this.domEventListeners.set(`click-${eventName}`, {
            element: document,
            event: 'click',
            handler: clickHandler
        });
    }

    /**
     * Bridge DOM events to custom events
     * @param {Element} element - DOM element
     * @param {string} domEventName - DOM event name
     * @param {string} customEventName - Custom event name to emit
     * @param {Object} options - Event options
     */
    bridgeEvent(element, domEventName, customEventName, options = {}) {
        const handler = (event) => {
            const eventData = {
                originalEvent: event,
                target: event.target,
                ...options.data
            };
            
            this.emit(customEventName, eventData);
        };
        
        const eventOptions = {
            passive: options.passive !== false,
            once: options.once || false,
            capture: options.capture || false
        };
        
        element.addEventListener(domEventName, handler, eventOptions);
        
        const key = `bridge-${customEventName}-${Date.now()}`;
        this.domEventListeners.set(key, {
            element,
            event: domEventName,
            handler
        });
        
        return key;
    }

    /**
     * Remove bridged event
     * @param {string} bridgeKey - Key returned from bridgeEvent
     */
    removeBridgedEvent(bridgeKey) {
        const listenerData = this.domEventListeners.get(bridgeKey);
        if (listenerData) {
            listenerData.element.removeEventListener(listenerData.event, listenerData.handler);
            this.domEventListeners.delete(bridgeKey);
        }
    }

    /**
     * Throttle function calls
     * @param {Function} func - Function to throttle
     * @param {number} limit - Throttle limit in milliseconds
     * @returns {Function} Throttled function
     */
    throttle(func, limit) {
        const key = func.toString() + limit;
        
        if (this.throttledFunctions.has(key)) {
            return this.throttledFunctions.get(key);
        }
        
        let inThrottle;
        const throttled = function(...args) {
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
        
        this.throttledFunctions.set(key, throttled);
        return throttled;
    }

    /**
     * Debounce function calls
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function} Debounced function
     */
    debounce(func, wait) {
        const key = func.toString() + wait;
        
        if (this.debouncedFunctions.has(key)) {
            return this.debouncedFunctions.get(key);
        }
        
        let timeout;
        const debounced = function(...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
        
        this.debouncedFunctions.set(key, debounced);
        return debounced;
    }

    /**
     * Create a one-time event listener
     * @param {string} eventName - Name of the event
     * @param {Function} callback - Callback function
     * @returns {Function} Remove function
     */
    once(eventName, callback) {
        return this.on(eventName, callback, { once: true });
    }

    /**
     * Wait for an event to be emitted
     * @param {string} eventName - Name of the event
     * @param {number} timeout - Optional timeout in milliseconds
     * @returns {Promise} Promise that resolves when event is emitted
     */
    waitForEvent(eventName, timeout = null) {
        return new Promise((resolve, reject) => {
            let timeoutId = null;
            
            const removeListener = this.once(eventName, (data) => {
                if (timeoutId) clearTimeout(timeoutId);
                resolve(data);
            });
            
            if (timeout) {
                timeoutId = setTimeout(() => {
                    removeListener();
                    reject(new Error(`Event '${eventName}' timeout after ${timeout}ms`));
                }, timeout);
            }
        });
    }

    /**
     * Get information about current event listeners
     * @returns {Object} Debug information
     */
    getDebugInfo() {
        const customEvents = {};
        this.eventListeners.forEach((listeners, eventName) => {
            customEvents[eventName] = listeners.size;
        });
        
        const domEvents = {};
        this.domEventListeners.forEach((data, key) => {
            const elementType = data.element === window ? 'window' : 
                               data.element === document ? 'document' : 
                               data.element.tagName || 'element';
            domEvents[key] = `${elementType}.${data.event}`;
        });
        
        return {
            customEvents,
            domEvents,
            totalCustomListeners: Array.from(this.eventListeners.values())
                .reduce((sum, listeners) => sum + listeners.size, 0),
            totalDOMListeners: this.domEventListeners.size
        };
    }

    /**
     * Clean up all event listeners
     */
    cleanup() {
        // Remove all DOM event listeners
        this.domEventListeners.forEach((data, key) => {
            data.element.removeEventListener(data.event, data.handler);
        });
        
        // Clear all maps
        this.eventListeners.clear();
        this.domEventListeners.clear();
        this.throttledFunctions.clear();
        this.debouncedFunctions.clear();
        

    }
}

// Export for module systems or assign to window
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EventManager;
} else {
    window.EventManager = EventManager;
} 