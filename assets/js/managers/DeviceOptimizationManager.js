/**
 * Device Optimization Manager - Handles iOS optimizations and mobile-specific tweaks
 * Follows Single Responsibility Principle by focusing solely on device-specific optimizations
 * File path: assets/js/managers/DeviceOptimizationManager.js
 */

class DeviceOptimizationManager {
    constructor(eventManager) {
        this.eventManager = eventManager;
        this.deviceInfo = {};
        this.optimizations = new Set();
        this.isInitialized = false;
        
        this.init();
    }

    /**
     * Initialize device optimization manager
     */
    init() {
        try {
            this.detectDevice();
            this.setupViewportOptimizations();
            this.setupIOSOptimizations();
            this.setupAndroidOptimizations();
            this.setupGeneralMobileOptimizations();
            this.setupPerformanceOptimizations();
            this.isInitialized = true;
            
            console.log('DeviceOptimizationManager initialized successfully', this.deviceInfo);
        } catch (error) {
            console.error('DeviceOptimizationManager initialization failed:', error);
        }
    }

    /**
     * Detect device type and capabilities
     */
    detectDevice() {
        const userAgent = navigator.userAgent;
        const platform = navigator.platform;
        
        this.deviceInfo = {
            // Basic detection
            isMobile: /Mobi|Android/i.test(userAgent),
            isTablet: /Tablet|iPad/i.test(userAgent),
            isDesktop: !/Mobi|Android|Tablet|iPad/i.test(userAgent),
            
            // iOS detection
            isIOS: /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream,
            isIPhone: /iPhone/.test(userAgent),
            isIPad: /iPad/.test(userAgent),
            
            // Android detection
            isAndroid: /Android/.test(userAgent),
            
            // Browser detection
            isSafari: /Safari/.test(userAgent) && !/Chrome/.test(userAgent),
            isChrome: /Chrome/.test(userAgent),
            isFirefox: /Firefox/.test(userAgent),
            
            // Specific iOS versions
            iOSVersion: this.getIOSVersion(userAgent),
            
            // Screen info
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
            devicePixelRatio: window.devicePixelRatio || 1,
            
            // Capabilities
            hasTouch: 'ontouchstart' in window,
            hasOrientationChange: 'onorientationchange' in window,
            hasVisualViewport: 'visualViewport' in window,
            
            // Browser features
            supportsPassiveEvents: this.checkPassiveEventSupport(),
            supportsIntersectionObserver: 'IntersectionObserver' in window,
            supportsResizeObserver: 'ResizeObserver' in window
        };

        // Set CSS classes for device targeting
        this.setDeviceClasses();
    }

    /**
     * Get iOS version from user agent
     */
    getIOSVersion(userAgent) {
        const match = userAgent.match(/OS (\d+)_(\d+)_?(\d+)?/);
        if (match) {
            return {
                major: parseInt(match[1]),
                minor: parseInt(match[2]),
                patch: parseInt(match[3] || 0)
            };
        }
        return null;
    }

    /**
     * Check if browser supports passive event listeners
     */
    checkPassiveEventSupport() {
        let supportsPassive = false;
        try {
            const opts = Object.defineProperty({}, 'passive', {
                get: function() {
                    supportsPassive = true;
                }
            });
            window.addEventListener('testPassive', null, opts);
            window.removeEventListener('testPassive', null, opts);
        } catch (e) {}
        return supportsPassive;
    }

    /**
     * Set CSS classes on body for device targeting
     */
    setDeviceClasses() {
        const classes = [];
        
        if (this.deviceInfo.isMobile) classes.push('mobile-device');
        if (this.deviceInfo.isTablet) classes.push('tablet-device');
        if (this.deviceInfo.isDesktop) classes.push('desktop-device');
        if (this.deviceInfo.isIOS) classes.push('ios-device');
        if (this.deviceInfo.isIPhone) classes.push('iphone-device');
        if (this.deviceInfo.isIPad) classes.push('ipad-device');
        if (this.deviceInfo.isAndroid) classes.push('android-device');
        if (this.deviceInfo.isSafari) classes.push('safari-browser');
        if (this.deviceInfo.hasTouch) classes.push('touch-device');
        
        document.body.classList.add(...classes);
    }

    /**
     * Setup viewport optimizations
     */
    setupViewportOptimizations() {
        this.setupViewportHeight();
        this.setupViewportUnits();
        this.setupOrientationHandling();
        this.setupSafeAreaSupport();
        
        this.optimizations.add('viewport');
    }

    /**
     * Setup viewport height optimization for mobile browsers
     */
    setupViewportHeight() {
        const updateViewportHeight = () => {
            // Use window.innerHeight for better mobile browser compatibility
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
            
            // Also set viewport width
            const vw = window.innerWidth * 0.01;
            document.documentElement.style.setProperty('--vw', `${vw}px`);
            
            this.eventManager.emit('viewportUpdated', {
                vh: vh,
                vw: vw,
                innerHeight: window.innerHeight,
                innerWidth: window.innerWidth
            });
        };
        
        // Initial setup
        updateViewportHeight();
        
        // Update on resize
        window.addEventListener('resize', this.debounce(updateViewportHeight, 100));
        
        // Update on orientation change
        if (this.deviceInfo.hasOrientationChange) {
            window.addEventListener('orientationchange', () => {
                // Delay to allow browser to update dimensions
                setTimeout(updateViewportHeight, 150);
            });
        }
        
        // Visual viewport support for iOS Safari
        if (this.deviceInfo.hasVisualViewport) {
            window.visualViewport.addEventListener('resize', updateViewportHeight);
        }
    }

    /**
     * Setup CSS custom properties for viewport units
     */
    setupViewportUnits() {
        const style = document.createElement('style');
        style.textContent = `
            :root {
                --vh: 1vh;
                --vw: 1vw;
                --safe-area-inset-top: env(safe-area-inset-top, 0px);
                --safe-area-inset-right: env(safe-area-inset-right, 0px);
                --safe-area-inset-bottom: env(safe-area-inset-bottom, 0px);
                --safe-area-inset-left: env(safe-area-inset-left, 0px);
            }
            
            /* Mobile viewport fixes */
            @media screen and (max-width: 768px) {
                .full-height {
                    height: calc(var(--vh, 1vh) * 100);
                }
                
                .min-full-height {
                    min-height: calc(var(--vh, 1vh) * 100);
                }
            }
        `;
        
        document.head.appendChild(style);
        this.viewportStyle = style;
    }

    /**
     * Setup orientation change handling
     */
    setupOrientationHandling() {
        if (!this.deviceInfo.hasOrientationChange) return;
        
        let currentOrientation = window.orientation || 0;
        
        const handleOrientationChange = () => {
            const newOrientation = window.orientation || 0;
            const orientationChanged = currentOrientation !== newOrientation;
            
            if (orientationChanged) {
                document.body.classList.add('orientation-changing');
                
                // Remove class after transition
                setTimeout(() => {
                    document.body.classList.remove('orientation-changing');
                }, 500);
                
                this.eventManager.emit('orientationChanged', {
                    from: currentOrientation,
                    to: newOrientation,
                    isPortrait: Math.abs(newOrientation) !== 90,
                    isLandscape: Math.abs(newOrientation) === 90
                });
                
                currentOrientation = newOrientation;
            }
        };
        
        window.addEventListener('orientationchange', handleOrientationChange);
    }

    /**
     * Setup safe area support for notched devices
     */
    setupSafeAreaSupport() {
        if (!this.deviceInfo.isIOS) return;
        
        const style = document.createElement('style');
        style.textContent = `
            /* Safe area support for iOS devices with notches */
            @supports (padding: max(0px)) {
                .safe-area-padding {
                    padding-top: max(var(--safe-area-inset-top), 1rem);
                    padding-right: max(var(--safe-area-inset-right), 1rem);
                    padding-bottom: max(var(--safe-area-inset-bottom), 1rem);
                    padding-left: max(var(--safe-area-inset-left), 1rem);
                }
                
                .safe-area-top {
                    padding-top: var(--safe-area-inset-top);
                }
                
                .safe-area-bottom {
                    padding-bottom: var(--safe-area-inset-bottom);
                }
            }
        `;
        
        document.head.appendChild(style);
        this.safeAreaStyle = style;
    }

    /**
     * Setup iOS-specific optimizations
     */
    setupIOSOptimizations() {
        if (!this.deviceInfo.isIOS) return;
        
        this.setupIOSScrollFix();
        this.setupIOSInputZoomFix();
        this.setupIOSHomeIndicatorFix();
        this.setupIOSBounceScrollFix();
        this.setupIOSStatusBarHandling();
        
        this.optimizations.add('ios');
    }

    /**
     * Fix iOS scroll issues
     */
    setupIOSScrollFix() {
        // Fix momentum scrolling
        const style = document.createElement('style');
        style.textContent = `
            /* iOS scroll fixes */
            body {
                -webkit-overflow-scrolling: touch;
            }
            
            .scrollable {
                -webkit-overflow-scrolling: touch;
                overscroll-behavior: contain;
            }
            
            /* Fix scroll in modal/overlay contexts */
            .ios-scroll-fix {
                -webkit-overflow-scrolling: touch;
                overflow-y: auto;
                overflow-x: hidden;
            }
        `;
        
        document.head.appendChild(style);
        this.iosScrollStyle = style;
    }

    /**
     * Prevent iOS zoom on input focus
     */
    setupIOSInputZoomFix() {
        const viewport = document.querySelector('meta[name=viewport]');
        if (!viewport) return;
        
        const originalContent = viewport.getAttribute('content');
        
        // Store original viewport for restoration
        this.originalViewport = originalContent;
        
        // Prevent zoom on input focus
        const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="password"], input[type="tel"], textarea, select');
        
        inputs.forEach(input => {
            input.addEventListener('focus', () => {
                viewport.setAttribute('content', originalContent + ', maximum-scale=1.0, user-scalable=no');
            });
            
            input.addEventListener('blur', () => {
                viewport.setAttribute('content', originalContent);
            });
        });
    }

    /**
     * Handle iOS home indicator
     */
    setupIOSHomeIndicatorFix() {
        // Add padding for home indicator on iOS devices
        if (this.deviceInfo.iOSVersion && this.deviceInfo.iOSVersion.major >= 11) {
            const style = document.createElement('style');
            style.textContent = `
                @media screen and (max-width: 768px) {
                    .ios-home-indicator-padding {
                        padding-bottom: calc(var(--safe-area-inset-bottom) + 1rem);
                    }
                }
            `;
            
            document.head.appendChild(style);
            this.homeIndicatorStyle = style;
        }
    }

    /**
     * Fix iOS bounce scroll behavior
     */
    setupIOSBounceScrollFix() {
        document.addEventListener('touchstart', (e) => {
            // Allow scrolling in specific containers
            const scrollableElement = e.target.closest('.scrollable, .ios-scroll-fix');
            if (scrollableElement) return;
            
            // Prevent bounce scroll on body
            if (e.target === document.body) {
                e.preventDefault();
            }
        }, { passive: false });
    }

    /**
     * Handle iOS status bar
     */
    setupIOSStatusBarHandling() {
        // Detect if running in standalone mode (PWA)
        const isStandalone = window.navigator.standalone || 
                           window.matchMedia('(display-mode: standalone)').matches;
        
        if (isStandalone) {
            document.body.classList.add('ios-standalone');
            
            const style = document.createElement('style');
            style.textContent = `
                .ios-standalone {
                    padding-top: var(--safe-area-inset-top);
                }
            `;
            
            document.head.appendChild(style);
            this.standaloneStyle = style;
        }
    }

    /**
     * Setup Android-specific optimizations
     */
    setupAndroidOptimizations() {
        if (!this.deviceInfo.isAndroid) return;
        
        this.setupAndroidKeyboardHandling();
        this.setupAndroidPerformanceOptimizations();
        
        this.optimizations.add('android');
    }

    /**
     * Handle Android keyboard behavior
     */
    setupAndroidKeyboardHandling() {
        // Android keyboard handling
        const originalHeight = window.innerHeight;
        
        const handleResize = () => {
            const currentHeight = window.innerHeight;
            const heightDifference = originalHeight - currentHeight;
            
            // Keyboard is likely open if height decreased significantly
            const keyboardOpen = heightDifference > 150;
            
            document.body.classList.toggle('android-keyboard-open', keyboardOpen);
            
            this.eventManager.emit('androidKeyboardToggle', {
                open: keyboardOpen,
                heightDifference: heightDifference
            });
        };
        
        window.addEventListener('resize', handleResize);
    }

    /**
     * Setup Android performance optimizations
     */
    setupAndroidPerformanceOptimizations() {
        // Disable hardware acceleration on older Android devices
        const androidVersion = this.getAndroidVersion();
        
        if (androidVersion && androidVersion < 7) {
            const style = document.createElement('style');
            style.textContent = `
                /* Disable problematic animations on older Android */
                * {
                    -webkit-transform: translateZ(0);
                    transform: translateZ(0);
                    -webkit-backface-visibility: hidden;
                    backface-visibility: hidden;
                }
            `;
            
            document.head.appendChild(style);
            this.androidOptimizationStyle = style;
        }
    }

    /**
     * Get Android version
     */
    getAndroidVersion() {
        const match = navigator.userAgent.match(/Android (\d+)\.(\d+)/);
        return match ? parseInt(match[1]) : null;
    }

    /**
     * Setup general mobile optimizations
     */
    setupGeneralMobileOptimizations() {
        if (!this.deviceInfo.isMobile) return;
        
        this.setupTouchOptimizations();
        this.setupMobilePerformanceOptimizations();
        this.setupMobileNetworkOptimizations();
        
        this.optimizations.add('mobile');
    }

    /**
     * Setup touch optimizations
     */
    setupTouchOptimizations() {
        const style = document.createElement('style');
        style.textContent = `
            /* Touch optimizations */
            button, .btn, a, [role="button"] {
                min-height: 44px;
                min-width: 44px;
                touch-action: manipulation;
            }
            
            /* Remove tap highlights */
            * {
                -webkit-tap-highlight-color: transparent;
                -webkit-touch-callout: none;
                -webkit-user-select: none;
                user-select: none;
            }
            
            /* Allow text selection where needed */
            input, textarea, .selectable-text {
                -webkit-user-select: text;
                user-select: text;
            }
        `;
        
        document.head.appendChild(style);
        this.touchOptimizationStyle = style;
    }

    /**
     * Setup mobile performance optimizations
     */
    setupMobilePerformanceOptimizations() {
        // Enable hardware acceleration for smooth animations
        const style = document.createElement('style');
        style.textContent = `
            /* Hardware acceleration for mobile */
            .mobile-optimized {
                -webkit-transform: translateZ(0);
                transform: translateZ(0);
                will-change: transform;
            }
            
            /* Optimize repaints */
            .mobile-device .animated {
                -webkit-backface-visibility: hidden;
                backface-visibility: hidden;
                perspective: 1000px;
            }
        `;
        
        document.head.appendChild(style);
        this.mobilePerformanceStyle = style;
    }

    /**
     * Setup mobile network optimizations
     */
    setupMobileNetworkOptimizations() {
        // Check connection type if supported
        if ('connection' in navigator) {
            const connection = navigator.connection;
            
            const handleConnectionChange = () => {
                const isSlowConnection = connection.effectiveType === 'slow-2g' || 
                                       connection.effectiveType === '2g';
                
                document.body.classList.toggle('slow-connection', isSlowConnection);
                
                this.eventManager.emit('connectionChanged', {
                    effectiveType: connection.effectiveType,
                    downlink: connection.downlink,
                    rtt: connection.rtt,
                    saveData: connection.saveData
                });
            };
            
            handleConnectionChange();
            connection.addEventListener('change', handleConnectionChange);
        }
    }

    /**
     * Setup performance optimizations
     */
    setupPerformanceOptimizations() {
        this.setupRequestIdleCallback();
        this.setupIntersectionObserver();
        this.setupMemoryOptimizations();
        
        this.optimizations.add('performance');
    }

    /**
     * Setup requestIdleCallback polyfill if needed
     */
    setupRequestIdleCallback() {
        if (!window.requestIdleCallback) {
            window.requestIdleCallback = function(cb) {
                const start = Date.now();
                return setTimeout(function() {
                    cb({
                        didTimeout: false,
                        timeRemaining: function() {
                            return Math.max(0, 50 - (Date.now() - start));
                        }
                    });
                }, 1);
            };
        }
    }

    /**
     * Setup optimized intersection observer
     */
    setupIntersectionObserver() {
        if (!this.deviceInfo.supportsIntersectionObserver) return;
        
        // Create a shared intersection observer for performance
        this.intersectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const element = entry.target;
                element.classList.toggle('in-viewport', entry.isIntersecting);
                
                this.eventManager.emit('elementVisibilityChanged', {
                    element: element,
                    isVisible: entry.isIntersecting,
                    intersectionRatio: entry.intersectionRatio
                });
            });
        }, {
            rootMargin: '50px',
            threshold: [0, 0.1, 0.5, 1]
        });
    }

    /**
     * Setup memory optimizations
     */
    setupMemoryOptimizations() {
        // Clean up unused event listeners and DOM references
        const cleanupUnusedElements = () => {
            // Remove event listeners from hidden elements
            const hiddenElements = document.querySelectorAll('[style*="display: none"], .hidden');
            hiddenElements.forEach(element => {
                if (element._eventListeners) {
                    element._eventListeners.forEach(listener => {
                        element.removeEventListener(listener.type, listener.handler);
                    });
                    element._eventListeners = [];
                }
            });
        };
        
        // Run cleanup periodically
        setInterval(cleanupUnusedElements, 60000); // Every minute
    }

    /**
     * Get device information
     */
    getDeviceInfo() {
        return { ...this.deviceInfo };
    }

    /**
     * Check if specific optimization is enabled
     */
    hasOptimization(name) {
        return this.optimizations.has(name);
    }

    /**
     * Force refresh of device detection
     */
    refreshDeviceInfo() {
        this.detectDevice();
        this.eventManager.emit('deviceInfoRefreshed', this.deviceInfo);
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
            deviceInfo: this.getDeviceInfo(),
            optimizations: Array.from(this.optimizations),
            viewportHeight: window.innerHeight,
            viewportWidth: window.innerWidth,
            currentOrientation: window.orientation || 0
        };
    }

    /**
     * Destroy device optimization manager
     */
    destroy() {
        try {
            // Remove styles
            const styles = [
                this.viewportStyle,
                this.safeAreaStyle,
                this.iosScrollStyle,
                this.homeIndicatorStyle,
                this.standaloneStyle,
                this.androidOptimizationStyle,
                this.touchOptimizationStyle,
                this.mobilePerformanceStyle
            ];
            
            styles.forEach(style => {
                if (style && style.parentNode) {
                    style.parentNode.removeChild(style);
                }
            });

            // Disconnect observers
            if (this.intersectionObserver) {
                this.intersectionObserver.disconnect();
            }

            // Restore original viewport
            if (this.originalViewport) {
                const viewport = document.querySelector('meta[name=viewport]');
                if (viewport) {
                    viewport.setAttribute('content', this.originalViewport);
                }
            }

            // Clean up references
            this.eventManager = null;
            this.deviceInfo = null;
            this.optimizations.clear();
            
            console.log('DeviceOptimizationManager destroyed successfully');
        } catch (error) {
            console.error('Error destroying DeviceOptimizationManager:', error);
        }
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DeviceOptimizationManager;
} 