/**
 * PerformanceManager - Handles performance optimizations and monitoring
 * Following Single Responsibility Principle
 * File path: assets/js/managers/PerformanceManager.js
 */

class PerformanceManager {
    constructor(eventManager) {
        this.eventManager = eventManager;
        this.imageObserver = null;
        this.metrics = new Map();
        this.optimizations = new Set();
        this.resourceQueue = [];
        this.isProcessingQueue = false;
        this.init();
    }

    /**
     * Initialize performance manager
     */
    init() {
        this.setupImageLazyLoading();
        this.setupResourcePreloading();
        this.setupServiceWorker();
        this.setupPerformanceMonitoring();
        this.setupEventListeners();
        this.applyInitialOptimizations();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Listen for load events
        this.eventManager.on('load', this.handleLoad.bind(this));
        
        // Listen for resize events for responsive optimizations
        this.eventManager.on('resize', this.handleResize.bind(this));
    }

    /**
     * Setup lazy loading for images
     */
    setupImageLazyLoading() {
        if (!('IntersectionObserver' in window)) {
            console.warn('IntersectionObserver not supported, loading all images immediately');
            this.loadAllImages();
            return;
        }

        this.imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadImage(entry.target);
                    this.imageObserver.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '50px 0px'
        });

        // Observe images with data-src attribute
        this.observeLazyImages();
        
        console.log('Image lazy loading initialized');
    }

    /**
     * Observe lazy loading images
     */
    observeLazyImages() {
        const lazyImages = document.querySelectorAll('img[data-src], img.lazy');
        
        lazyImages.forEach(img => {
            // Set up lazy loading attributes if not already set
            if (!img.dataset.src && img.src) {
                img.dataset.src = img.src;
                img.src = this.generatePlaceholder(img.width || 300, img.height || 200);
                img.classList.add('lazy');
            }
            
            this.imageObserver.observe(img);
        });
        
        console.log(`Observing ${lazyImages.length} lazy images`);
    }

    /**
     * Load a single image
     * @param {HTMLImageElement} img - Image element
     */
    loadImage(img) {
        const src = img.dataset.src;
        if (!src) return;

        // Create new image to test loading
        const newImg = new Image();
        
        newImg.onload = () => {
            img.src = src;
            img.classList.remove('lazy');
            img.classList.add('loaded');
            
            // Remove data-src to prevent reprocessing
            delete img.dataset.src;
            
            this.recordMetric('image_loaded', {
                src,
                loadTime: Date.now() - loadStart
            });
        };
        
        newImg.onerror = () => {
            console.error('Failed to load image:', src);
            img.classList.add('error');
            
            this.recordMetric('image_error', {
                src,
                error: 'load_failed'
            });
        };
        
        const loadStart = Date.now();
        newImg.src = src;
    }

    /**
     * Load all images immediately (fallback)
     */
    loadAllImages() {
        const lazyImages = document.querySelectorAll('img[data-src], img.lazy');
        lazyImages.forEach(img => this.loadImage(img));
    }

    /**
     * Generate placeholder image
     * @param {number} width - Image width
     * @param {number} height - Image height
     * @returns {string} Data URL for placeholder
     */
    generatePlaceholder(width, height) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = width;
        canvas.height = height;
        
        // Create gradient placeholder
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#f0f0f0');
        gradient.addColorStop(1, '#e0e0e0');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        return canvas.toDataURL('image/jpeg', 0.1);
    }

    /**
     * Setup resource preloading
     */
    setupResourcePreloading() {
        this.preloadCriticalResources();
        this.setupDynamicPreloading();
    }

    /**
     * Preload critical resources
     */
    preloadCriticalResources() {
        const criticalResources = [
            {
                href: 'assets/images/logo.png',
                as: 'image',
                type: 'image/png'
            },
            {
                href: 'assets/images/hero.png',
                as: 'image',
                type: 'image/png'
            }
        ];

        criticalResources.forEach(resource => {
            this.preloadResource(resource);
        });
    }

    /**
     * Preload a single resource
     * @param {Object} resource - Resource configuration
     */
    preloadResource(resource) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = resource.href;
        link.as = resource.as;
        
        if (resource.type) {
            link.type = resource.type;
        }
        
        if (resource.crossorigin) {
            link.crossOrigin = resource.crossorigin;
        }
        
        // Add to queue for processing
        this.resourceQueue.push({
            element: link,
            priority: resource.priority || 'low',
            timeout: resource.timeout || 5000
        });
        
        this.processResourceQueue();
    }

    /**
     * Setup dynamic preloading based on user interaction
     */
    setupDynamicPreloading() {
        // Preload resources on hover/focus
        document.addEventListener('mouseover', this.handleResourceHover.bind(this), true);
        document.addEventListener('focus', this.handleResourceFocus.bind(this), true);
    }

    /**
     * Handle resource hover for preloading
     * @param {Event} event - Hover event
     */
    handleResourceHover(event) {
        const target = event.target.closest('a[href]');
        if (target && !target.dataset.preloaded) {
            const href = target.getAttribute('href');
            
            // Only preload internal links
            if (href && !href.startsWith('http') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
                this.preloadPage(href);
                target.dataset.preloaded = 'true';
            }
        }
    }

    /**
     * Handle resource focus for preloading
     * @param {Event} event - Focus event
     */
    handleResourceFocus(event) {
        this.handleResourceHover(event);
    }

    /**
     * Preload a page
     * @param {string} href - Page URL
     */
    preloadPage(href) {
        this.preloadResource({
            href,
            as: 'document',
            priority: 'low'
        });
    }

    /**
     * Process resource preload queue
     */
    async processResourceQueue() {
        if (this.isProcessingQueue || this.resourceQueue.length === 0) return;
        
        this.isProcessingQueue = true;
        
        // Sort by priority
        this.resourceQueue.sort((a, b) => {
            const priorities = { high: 3, medium: 2, low: 1 };
            return priorities[b.priority] - priorities[a.priority];
        });
        
        // Process items with delays to avoid overwhelming
        while (this.resourceQueue.length > 0) {
            const item = this.resourceQueue.shift();
            
            try {
                document.head.appendChild(item.element);
                
                // Add timeout for cleanup
                setTimeout(() => {
                    if (item.element.parentNode) {
                        item.element.remove();
                    }
                }, item.timeout);
                
                // Small delay between requests
                await this.delay(100);
                
            } catch (error) {
                console.warn('Error preloading resource:', error);
            }
        }
        
        this.isProcessingQueue = false;
    }

    /**
     * Setup service worker
     */
    setupServiceWorker() {
        if (!('serviceWorker' in navigator)) {
            console.warn('Service Worker not supported');
            return;
        }

        navigator.serviceWorker.register('/sw.js', {
            scope: '/'
        })
        .then(registration => {
            console.log('Service Worker registered:', registration.scope);
            
            this.recordMetric('service_worker_registered', {
                scope: registration.scope,
                active: !!registration.active
            });
            
            // Listen for updates
            registration.addEventListener('updatefound', () => {
                console.log('Service Worker update found');
                this.handleServiceWorkerUpdate(registration);
            });
        })
        .catch(error => {
            console.warn('Service Worker registration failed:', error);
            
            this.recordMetric('service_worker_error', {
                error: error.message
            });
        });
    }

    /**
     * Handle service worker updates
     * @param {ServiceWorkerRegistration} registration - SW registration
     */
    handleServiceWorkerUpdate(registration) {
        const newWorker = registration.installing;
        
        newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content available, show update notification
                this.showUpdateNotification();
            }
        });
    }

    /**
     * Show update notification
     */
    showUpdateNotification() {
        // Create update notification
        const notification = document.createElement('div');
        notification.className = 'update-notification';
        notification.innerHTML = `
            <div class="update-content">
                <p>New version available!</p>
                <button onclick="window.location.reload()">Update</button>
                <button onclick="this.parentElement.parentElement.remove()">Later</button>
            </div>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #007cba;
            color: white;
            padding: 15px;
            border-radius: 5px;
            z-index: 10000;
            max-width: 300px;
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 10000);
    }

    /**
     * Setup performance monitoring
     */
    setupPerformanceMonitoring() {
        // Monitor navigation timing
        this.monitorNavigationTiming();
        
        // Monitor resource timing
        this.monitorResourceTiming();
        
        // Monitor user interactions
        this.monitorUserInteractions();
        
        // Monitor memory usage
        this.monitorMemoryUsage();
    }

    /**
     * Monitor navigation timing
     */
    monitorNavigationTiming() {
        if (!window.performance || !window.performance.timing) return;
        
        window.addEventListener('load', () => {
            setTimeout(() => {
                const timing = window.performance.timing;
                const navigation = window.performance.navigation;
                
                const metrics = {
                    dns_lookup: timing.domainLookupEnd - timing.domainLookupStart,
                    tcp_connect: timing.connectEnd - timing.connectStart,
                    request_response: timing.responseEnd - timing.requestStart,
                    dom_processing: timing.domComplete - timing.domLoading,
                    page_load: timing.loadEventEnd - timing.navigationStart,
                    navigation_type: navigation.type
                };
                
                this.recordMetric('navigation_timing', metrics);
                
                // Log slow loads
                if (metrics.page_load > 3000) {
                    console.warn('Slow page load detected:', metrics.page_load + 'ms');
                }
            }, 0);
        });
    }

    /**
     * Monitor resource timing
     */
    monitorResourceTiming() {
        if (!window.performance || !window.performance.getEntriesByType) return;
        
        // Monitor resource loading
        const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            
            entries.forEach(entry => {
                if (entry.duration > 1000) {
                    this.recordMetric('slow_resource', {
                        name: entry.name,
                        duration: entry.duration,
                        type: entry.initiatorType
                    });
                }
            });
        });
        
        observer.observe({ entryTypes: ['resource'] });
    }

    /**
     * Monitor user interactions
     */
    monitorUserInteractions() {
        let interactionCount = 0;
        let firstInteraction = null;
        
        const trackInteraction = (event) => {
            if (!firstInteraction) {
                firstInteraction = Date.now();
                this.recordMetric('first_interaction', {
                    type: event.type,
                    time: firstInteraction
                });
            }
            
            interactionCount++;
            
            // Track interaction patterns
            if (interactionCount % 10 === 0) {
                this.recordMetric('interaction_milestone', {
                    count: interactionCount,
                    elapsed: Date.now() - firstInteraction
                });
            }
        };
        
        ['click', 'touchstart', 'keydown'].forEach(eventType => {
            document.addEventListener(eventType, trackInteraction, { passive: true, once: false });
        });
    }

    /**
     * Monitor memory usage
     */
    monitorMemoryUsage() {
        if (!window.performance || !window.performance.memory) return;
        
        const checkMemory = () => {
            const memory = window.performance.memory;
            
            this.recordMetric('memory_usage', {
                used: memory.usedJSHeapSize,
                total: memory.totalJSHeapSize,
                limit: memory.jsHeapSizeLimit,
                usage_percent: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
            });
            
            // Warn about high memory usage
            const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
            if (usagePercent > 80) {
                console.warn('High memory usage detected:', usagePercent.toFixed(2) + '%');
                this.suggestCleanup();
            }
        };
        
        // Check every 30 seconds
        setInterval(checkMemory, 30000);
        
        // Initial check
        setTimeout(checkMemory, 5000);
    }

    /**
     * Apply initial performance optimizations
     */
    applyInitialOptimizations() {
        // DNS prefetch for external domains
        this.addDNSPrefetch([
            'fonts.googleapis.com',
            'www.google-analytics.com'
        ]);
        
        // Optimize images
        this.optimizeImages();
        
        // Minify CSS/JS if in development
        if (window.location.hostname === 'localhost') {
            this.suggestMinification();
        }
        
        // Enable hardware acceleration for animations
        this.enableHardwareAcceleration();
        
        this.optimizations.add('initial_optimizations');
    }

    /**
     * Add DNS prefetch links
     * @param {Array} domains - Array of domain names
     */
    addDNSPrefetch(domains) {
        domains.forEach(domain => {
            const link = document.createElement('link');
            link.rel = 'dns-prefetch';
            link.href = `//${domain}`;
            document.head.appendChild(link);
        });
        
        this.optimizations.add('dns_prefetch');
    }

    /**
     * Optimize images on the page
     */
    optimizeImages() {
        const images = document.querySelectorAll('img');
        
        images.forEach(img => {
            // Add loading="lazy" for native lazy loading
            if (!img.hasAttribute('loading') && img.dataset.src) {
                img.loading = 'lazy';
            }
            
            // Add decoding="async" for better performance
            if (!img.hasAttribute('decoding')) {
                img.decoding = 'async';
            }
        });
        
        this.optimizations.add('image_optimization');
    }

    /**
     * Enable hardware acceleration
     */
    enableHardwareAcceleration() {
        const animatedElements = document.querySelectorAll('.animate, [data-aos]');
        
        animatedElements.forEach(element => {
            element.style.willChange = 'transform, opacity';
        });
        
        this.optimizations.add('hardware_acceleration');
    }

    /**
     * Suggest cleanup for memory optimization
     */
    suggestCleanup() {
        // Remove unused event listeners
        this.cleanupEventListeners();
        
        // Clear old metrics
        this.cleanupOldMetrics();
        
        // Suggest garbage collection (if available)
        if (window.gc) {
            console.log('Suggesting garbage collection');
            window.gc();
        }
    }

    /**
     * Cleanup event listeners
     */
    cleanupEventListeners() {
        // This would be implemented based on specific needs
        console.log('Cleaning up event listeners');
    }

    /**
     * Cleanup old metrics
     */
    cleanupOldMetrics() {
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        
        this.metrics.forEach((metric, key) => {
            if (metric.timestamp < oneHourAgo) {
                this.metrics.delete(key);
            }
        });
    }

    /**
     * Suggest minification for development
     */
    suggestMinification() {
        console.log('Development mode detected. Consider minifying CSS/JS for production.');
    }

    /**
     * Handle load events
     */
    handleLoad() {
        // Perform post-load optimizations
        setTimeout(() => {
            this.performPostLoadOptimizations();
        }, 1000);
    }

    /**
     * Handle resize events
     * @param {Object} resizeData - Resize event data
     */
    handleResize(resizeData) {
        // Re-optimize for new viewport
        if (resizeData.isMobile) {
            this.optimizeForMobile();
        } else {
            this.optimizeForDesktop();
        }
    }

    /**
     * Perform post-load optimizations
     */
    performPostLoadOptimizations() {
        // Preload next likely resources
        this.preloadLikelyResources();
        
        // Optimize animations
        this.optimizeAnimations();
        
        // Record load completion
        this.recordMetric('post_load_optimization', {
            optimizations: Array.from(this.optimizations),
            timestamp: Date.now()
        });
    }

    /**
     * Preload likely next resources
     */
    preloadLikelyResources() {
        // Preload resources that users are likely to need
        const likelyResources = [
            'assets/css/responsive.css',
            'assets/js/mobile-menu.js'
        ];
        
        likelyResources.forEach(resource => {
            this.preloadResource({
                href: resource,
                as: this.guessResourceType(resource),
                priority: 'low'
            });
        });
    }

    /**
     * Guess resource type from URL
     * @param {string} url - Resource URL
     * @returns {string} Resource type
     */
    guessResourceType(url) {
        if (url.endsWith('.css')) return 'style';
        if (url.endsWith('.js')) return 'script';
        if (url.match(/\.(jpg|jpeg|png|gif|webp)$/)) return 'image';
        if (url.endsWith('.woff2')) return 'font';
        return 'fetch';
    }

    /**
     * Optimize animations
     */
    optimizeAnimations() {
        // Reduce motion for users who prefer it
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            document.body.classList.add('reduce-motion');
            
            // Disable AOS animations
            if (typeof AOS !== 'undefined') {
                AOS.init({ disable: true });
            }
        }
    }

    /**
     * Optimize for mobile devices
     */
    optimizeForMobile() {
        // Disable expensive effects on mobile
        document.body.classList.add('mobile-optimized');
        
        // Reduce animation complexity
        const complexAnimations = document.querySelectorAll('.complex-animation');
        complexAnimations.forEach(el => {
            el.classList.add('simplified');
        });
        
        this.optimizations.add('mobile_optimization');
    }

    /**
     * Optimize for desktop devices
     */
    optimizeForDesktop() {
        document.body.classList.remove('mobile-optimized');
        
        // Re-enable complex animations
        const complexAnimations = document.querySelectorAll('.complex-animation');
        complexAnimations.forEach(el => {
            el.classList.remove('simplified');
        });
        
        this.optimizations.add('desktop_optimization');
    }

    /**
     * Record performance metric
     * @param {string} name - Metric name
     * @param {*} data - Metric data
     */
    recordMetric(name, data) {
        const metric = {
            name,
            data,
            timestamp: Date.now()
        };
        
        this.metrics.set(`${name}_${Date.now()}`, metric);
        
        // Emit metric event
        this.eventManager.emit('performanceMetric', metric);
        
        // Log important metrics
        if (['slow_resource', 'high_memory', 'service_worker_error'].includes(name)) {
            console.warn('Performance issue:', metric);
        }
    }

    /**
     * Utility delay function
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise} Delay promise
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get performance report
     * @returns {Object} Performance report
     */
    getPerformanceReport() {
        const report = {
            optimizations: Array.from(this.optimizations),
            metricsCount: this.metrics.size,
            recentMetrics: this.getRecentMetrics(10),
            suggestions: this.getPerformanceSuggestions()
        };
        
        return report;
    }

    /**
     * Get recent metrics
     * @param {number} count - Number of recent metrics
     * @returns {Array} Recent metrics
     */
    getRecentMetrics(count = 10) {
        const sorted = Array.from(this.metrics.values())
            .sort((a, b) => b.timestamp - a.timestamp);
        
        return sorted.slice(0, count);
    }

    /**
     * Get performance suggestions
     * @returns {Array} Performance suggestions
     */
    getPerformanceSuggestions() {
        const suggestions = [];
        
        // Analyze metrics for suggestions
        const slowResources = Array.from(this.metrics.values())
            .filter(m => m.name === 'slow_resource');
        
        if (slowResources.length > 0) {
            suggestions.push('Consider optimizing slow-loading resources');
        }
        
        if (!this.optimizations.has('image_optimization')) {
            suggestions.push('Enable image optimization');
        }
        
        if (!('serviceWorker' in navigator)) {
            suggestions.push('Consider implementing Service Worker for caching');
        }
        
        return suggestions;
    }

    /**
     * Get debug information
     * @returns {Object} Debug information
     */
    getDebugInfo() {
        return {
            ...this.getPerformanceReport(),
            queueLength: this.resourceQueue.length,
            isProcessingQueue: this.isProcessingQueue,
            hasImageObserver: !!this.imageObserver
        };
    }

    /**
     * Clean up performance manager
     */
    cleanup() {
        // Disconnect image observer
        if (this.imageObserver) {
            this.imageObserver.disconnect();
            this.imageObserver = null;
        }
        
        // Clear resource queue
        this.resourceQueue = [];
        
        // Clear metrics
        this.metrics.clear();
        this.optimizations.clear();
        
        console.log('PerformanceManager cleaned up');
    }
}

// Export for module systems or assign to window
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceManager;
} else {
    window.PerformanceManager = PerformanceManager;
} 