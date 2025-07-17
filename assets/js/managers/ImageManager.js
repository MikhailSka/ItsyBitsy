/**
 * ImageManager - Handles image lazy loading, optimization, and error handling
 */

class ImageManager {
    constructor(eventManager) {
        this.eventManager = eventManager;
        this.images = new Map();
        this.intersectionObserver = null;
        this.loadingQueue = [];
        this.isProcessingQueue = false;
        this.isMobile = window.innerWidth < 768;
        this.init();
    }

    /**
     * Initialize image manager
     */
    init() {
        console.log('ImageManager: Initializing...');
        this.setupIntersectionObserver();
        this.setupEventListeners();
        this.detectAndSetupImages();
        this.setupResponsiveHandler();
        
        // Fallback: Load images immediately if on localhost for development
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log('ImageManager: Development mode detected, loading all images after delay');
            setTimeout(() => {
                this.loadAllImagesForDevelopment();
            }, 1000);
        }
        
        console.log('ImageManager: Initialization complete');
    }

    /**
     * Development fallback - load all images
     */
    loadAllImagesForDevelopment() {
        console.log('ImageManager: Loading all images for development');
        this.images.forEach((config, imageId) => {
            if (!config.loaded && !config.loading) {
                console.log(`ImageManager: Force loading image ${imageId}`);
                this.loadImage(config.element, config);
            }
        });
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Listen for resize events to update mobile status
        this.eventManager.on('resize', this.handleResize.bind(this));
        
        // Listen for mobile menu events
        this.eventManager.on('menuOpened', this.pauseImageLoading.bind(this));
        this.eventManager.on('menuClosed', this.resumeImageLoading.bind(this));
        
        // Listen for scroll events to optimize loading
        this.eventManager.on('scroll', this.handleScroll.bind(this));
    }

    /**
     * Setup intersection observer for lazy loading
     */
    setupIntersectionObserver() {
        if (!('IntersectionObserver' in window)) {
            console.warn('IntersectionObserver not supported, loading all images immediately');
            this.loadAllImages();
            return;
        }

        this.intersectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const img = entry.target;
                const config = this.images.get(img.dataset.imageId || img.id);
                
                console.log(`ImageManager: Image ${img.dataset.imageId || img.id} intersection:`, {
                    isIntersecting: entry.isIntersecting,
                    intersectionRatio: entry.intersectionRatio,
                    loaded: config?.loaded
                });
                
                if (entry.isIntersecting && config && !config.loaded && !config.loading) {
                    console.log(`ImageManager: Loading image ${config.id} due to intersection`);
                    this.loadImage(entry.target);
                    this.intersectionObserver.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: this.isMobile ? '50px 0px' : '150px 0px' // Smaller margin on mobile
        });
    }

    /**
     * Setup responsive handler for device orientation changes
     */
    setupResponsiveHandler() {
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.isMobile = window.innerWidth < 768;
                this.refreshImageOptimizations();
            }, 100);
        });
    }

    /**
     * Detect and setup all images on the page
     */
    detectAndSetupImages() {
        // Find both regular images and lazy images
        const allImages = document.querySelectorAll('img');
        
        allImages.forEach((img, index) => {
            const imageId = img.id || img.dataset.imageId || `image-${index}`;
            if (!img.id && !img.dataset.imageId) {
                img.dataset.imageId = imageId;
            }
            
            const priority = this.getImagePriority(img);
            
            this.setupImage(imageId, {
                priority: priority
            });
        });
        
        console.log(`ImageManager: Found ${allImages.length} images to optimize`);
    }

    /**
     * Determine image loading priority based on position and content
     * @param {HTMLImageElement} img - Image element
     * @returns {string} Priority level: 'critical', 'high', 'normal', 'low'
     */
    getImagePriority(img) {
        // Critical: Images that should load immediately
        if (img.closest('header') || 
            img.closest('.hero-section') || 
            img.classList.contains('logo-img') ||
            img.hasAttribute('data-priority-critical')) {
            return 'critical';
        }
        
        const rect = img.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        
        // High: Above the fold or in first section
        if (rect.top < windowHeight || 
            img.closest('#about-us') ||
            img.hasAttribute('data-priority-high')) {
            return 'high';
        }
        
        // Normal: Second or third section
        if (rect.top < windowHeight * 2 || 
            img.closest('#uniqueness') ||
            img.hasAttribute('data-priority-normal')) {
            return 'normal';
        }
        
        // Low: Far down the page (testimonials, contact, etc.)
        return 'low';
    }

    /**
     * Setup a single image for lazy loading
     * @param {string} imageId - Image identifier
     * @param {Object} options - Image configuration options
     */
    setupImage(imageId, options = {}) {
        const img = document.getElementById(imageId) || 
                   document.querySelector(`[data-image-id="${imageId}"]`);
        
        if (!img) {
            console.warn(`Image with ID ${imageId} not found`);
            return;
        }

        // Determine original source - could be in src or data-src
        const originalSrc = img.dataset.src || img.src;
        const isAlreadyLazy = !!img.dataset.src;
        
        const imageConfig = {
            id: imageId,
            element: img,
            originalSrc: originalSrc,
            loaded: false,
            loading: false,
            error: false,
            priority: options.priority || 'normal',
            retryCount: 0,
            maxRetries: 2,
            lazyLoad: options.lazyLoad !== false,
            placeholder: options.placeholder || this.createPlaceholder(img),
            fallbackSrc: options.fallbackSrc || null,
            analytics: options.analytics !== false,
            isAlreadyLazy: isAlreadyLazy
        };

        // Store image configuration
        this.images.set(imageId, imageConfig);

        // Handle different loading scenarios
        if (imageConfig.priority === 'critical') {
            // Critical images should load immediately, regardless of lazy setup
            if (isAlreadyLazy) {
                // Convert back to immediate loading
                img.src = originalSrc;
                img.removeAttribute('data-src');
                img.classList.remove('lazy-loading');
            }
            imageConfig.loaded = true;
            console.log(`ImageManager: Loading critical image ${imageId} immediately`);
        } else if (imageConfig.lazyLoad) {
            // Non-critical images should be lazy loaded
            if (!isAlreadyLazy) {
                // Convert to lazy loading
                this.convertToLazyLoading(img, imageConfig);
            } else {
                // Already set up for lazy loading, just observe
                if (this.intersectionObserver) {
                    this.intersectionObserver.observe(img);
                }
                // Add error handling
                img.addEventListener('error', () => {
                    this.handleImageError(img, imageConfig);
                });
            }
            console.log(`ImageManager: Setup lazy loading for image ${imageId} with priority ${imageConfig.priority}`);
        } else {
            // Load immediately
            this.loadImage(img, imageConfig);
            console.log(`ImageManager: Loading image ${imageId} immediately`);
        }
    }

    /**
     * Convert image to lazy loading format
     * @param {HTMLImageElement} img - Image element
     * @param {Object} config - Image configuration
     */
    convertToLazyLoading(img, config) {
        // Store original src in data attribute
        img.dataset.src = config.originalSrc;
        
        // Create placeholder
        const placeholder = this.createPlaceholder(img);
        img.src = placeholder;
        
        // Add loading class
        img.classList.add('lazy-loading');
        
        // Add to intersection observer
        if (this.intersectionObserver) {
            this.intersectionObserver.observe(img);
        }
        
        // Add error handling
        img.addEventListener('error', () => {
            this.handleImageError(img, config);
        });
    }

    /**
     * Create placeholder for image
     * @param {HTMLImageElement} img - Image element
     * @returns {string} Placeholder data URL
     */
    createPlaceholder(img) {
        const width = img.width || img.getAttribute('width') || 300;
        const height = img.height || img.getAttribute('height') || 200;
        
        // Create SVG placeholder with same aspect ratio
        const svg = `
            <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
                <rect width="100%" height="100%" fill="#f5f5f5"/>
                <rect x="20%" y="45%" width="60%" height="10%" fill="#e0e0e0" rx="4"/>
                <circle cx="50%" cy="30%" r="8%" fill="#e0e0e0"/>
            </svg>
        `;
        
        return `data:image/svg+xml;base64,${btoa(svg)}`;
    }

    /**
     * Load image with optimization
     * @param {HTMLImageElement} img - Image element or image ID
     * @param {Object} config - Image configuration (optional)
     */
    loadImage(img, config = null) {
        if (typeof img === 'string') {
            config = this.images.get(img);
            img = config?.element;
        }
        
        if (!img) {
            console.warn('ImageManager: No image element provided to loadImage');
            return;
        }
        
        if (!config) {
            config = this.images.get(img.dataset.imageId || img.id);
        }
        
        if (!config) {
            console.warn(`ImageManager: No config found for image ${img.dataset.imageId || img.id}`);
            return;
        }
        
        if (config.loaded) {
            console.log(`ImageManager: Image ${config.id} already loaded`);
            return;
        }
        
        if (config.loading) {
            console.log(`ImageManager: Image ${config.id} already loading`);
            return;
        }

        console.log(`ImageManager: Starting to load image ${config.id}`);
        config.loading = true;
        
        // Add to loading queue for priority management
        this.addToLoadingQueue(img, config);
    }

    /**
     * Add image to loading queue with priority handling
     * @param {HTMLImageElement} img - Image element
     * @param {Object} config - Image configuration
     */
    addToLoadingQueue(img, config) {
        this.loadingQueue.push({ img, config });
        
        // Sort queue by priority
        this.loadingQueue.sort((a, b) => {
            const priorities = { 'critical': 0, 'high': 1, 'normal': 2, 'low': 3 };
            return priorities[a.config.priority] - priorities[b.config.priority];
        });
        
        if (!this.isProcessingQueue) {
            this.processLoadingQueue();
        }
    }

    /**
     * Process loading queue with rate limiting
     */
    async processLoadingQueue() {
        if (this.isProcessingQueue || this.loadingQueue.length === 0) {
            return;
        }
        
        this.isProcessingQueue = true;
        
        // Load images in batches to avoid overwhelming the browser
        // Reduce batch size for mobile devices and slow connections
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        const isSlowConnection = connection && (connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g');
        
        let batchSize = 4; // Default for desktop
        if (this.isMobile) {
            batchSize = isSlowConnection ? 1 : 2;
        } else if (isSlowConnection) {
            batchSize = 2;
        }
        
        while (this.loadingQueue.length > 0) {
            const batch = this.loadingQueue.splice(0, batchSize);
            
            // Process batch in parallel
            const loadPromises = batch.map(({ img, config }) => 
                this.loadImageActual(img, config)
            );
            
            await Promise.allSettled(loadPromises);
            
            // Small delay between batches to prevent blocking
            if (this.loadingQueue.length > 0) {
                await new Promise(resolve => setTimeout(resolve, 50));
            }
        }
        
        this.isProcessingQueue = false;
    }

    /**
     * Actually load the image
     * @param {HTMLImageElement} img - Image element
     * @param {Object} config - Image configuration
     */
    async loadImageActual(img, config) {
        try {
            const src = img.dataset.src || config.originalSrc;
            
            // Optimize image URL for mobile if needed
            const optimizedSrc = this.optimizeImageUrl(src);
            
            // Create new image to preload
            const newImg = new Image();
            
            // Setup load handlers
                         return new Promise((resolve, reject) => {
                newImg.onload = () => {
                    console.log(`ImageManager: Successfully loaded image ${config.id}`);
                    
                    // Update original image
                    img.src = optimizedSrc;
                    
                    // Remove data-src if it exists
                    if (img.hasAttribute('data-src')) {
                        img.removeAttribute('data-src');
                    }
                    
                    img.classList.remove('lazy-loading');
                    img.classList.add('lazy-loaded');
                    
                    config.loaded = true;
                    config.loading = false;
                    
                    this.trackImageEvent('loaded', img, config);
                    resolve();
                };
                
                newImg.onerror = () => {
                    console.error(`ImageManager: Failed to load image ${config.id}: ${optimizedSrc}`);
                    this.handleImageError(img, config);
                    reject(new Error(`Failed to load image: ${optimizedSrc}`));
                };
                
                // Start loading
                console.log(`ImageManager: Starting actual load for ${config.id}: ${optimizedSrc}`);
                newImg.src = optimizedSrc;
            });
            
        } catch (error) {
            console.error(`Error loading image ${config.id}:`, error);
            this.handleImageError(img, config);
        }
    }

    /**
     * Optimize image URL for current device and connection
     * @param {string} src - Original image source
     * @returns {string} Optimized image source
     */
    optimizeImageUrl(src) {
        // Check for slow connection
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        const isSlowConnection = connection && (connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g');
        
        // For mobile devices or slow connections, we could:
        // 1. Use smaller image variants if available
        // 2. Use more compressed versions
        // 3. Skip non-critical images entirely
        
        if (this.isMobile || isSlowConnection) {
            // In a real implementation with a CDN, you might add parameters like:
            // - For Cloudinary: src + '?w_800,f_auto,q_auto'
            // - For ImageKit: src + '?tr=w-800,f-auto,q-auto'
            // - For custom setup: check for mobile variants
            
            // Example for custom mobile variants:
            if (src.includes('assets/images/') && !src.includes('logo') && !src.includes('hero')) {
                // Try to use mobile-optimized versions
                const mobileVariant = src.replace(/\.(png|jpg|jpeg)$/i, '_mobile.$1');
                // In a real implementation, you'd check if the mobile variant exists
                // For now, just use original but this shows the pattern
            }
        }
        
        // Support for WebP if browser supports it
        if (this.supportsWebP() && src.includes('assets/images/')) {
            // In a real implementation, you might serve WebP versions
            // const webpSrc = src.replace(/\.(png|jpg|jpeg)$/i, '.webp');
            // return webpSrc;
        }
        
        return src;
    }

    /**
     * Check if browser supports WebP format
     * @returns {boolean} WebP support status
     */
    supportsWebP() {
        if (this._webpSupport !== undefined) {
            return this._webpSupport;
        }
        
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        this._webpSupport = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
        return this._webpSupport;
    }

    /**
     * Handle image loading errors
     * @param {HTMLImageElement} img - Image element
     * @param {Object} config - Image configuration
     */
    handleImageError(img, config) {
        config.retryCount++;
        config.loading = false;
        
        if (config.retryCount < config.maxRetries) {
            // Retry loading after delay
            setTimeout(() => {
                this.loadImage(img, config);
            }, 1000 * config.retryCount);
            return;
        }
        
        config.error = true;
        
        // Try fallback source
        if (config.fallbackSrc) {
            img.src = config.fallbackSrc;
        } else {
            // Use default fallback
            img.src = this.createErrorPlaceholder(img);
        }
        
        img.classList.remove('lazy-loading');
        img.classList.add('lazy-error');
        
        this.trackImageEvent('error', img, config);
        console.error(`Failed to load image ${config.id} after ${config.maxRetries} retries`);
    }

    /**
     * Create error placeholder
     * @param {HTMLImageElement} img - Image element
     * @returns {string} Error placeholder data URL
     */
    createErrorPlaceholder(img) {
        const width = img.width || 300;
        const height = img.height || 200;
        
        const svg = `
            <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
                <rect width="100%" height="100%" fill="#f8f9fa"/>
                <g transform="translate(${width/2}, ${height/2})">
                    <circle r="24" fill="#e9ecef" stroke="#dee2e6" stroke-width="2"/>
                    <path d="M-8,-8 L8,8 M8,-8 L-8,8" stroke="#6c757d" stroke-width="2"/>
                </g>
            </svg>
        `;
        
        return `data:image/svg+xml;base64,${btoa(svg)}`;
    }

    /**
     * Load all images immediately (fallback for browsers without Intersection Observer)
     */
    loadAllImages() {
        this.images.forEach((config, imageId) => {
            if (!config.loaded) {
                this.loadImage(config.element, config);
            }
        });
    }

    /**
     * Pause image loading (e.g., when mobile menu is open)
     */
    pauseImageLoading() {
        this.isProcessingQueue = false;
    }

    /**
     * Resume image loading
     */
    resumeImageLoading() {
        if (this.loadingQueue.length > 0) {
            this.processLoadingQueue();
        }
    }

    /**
     * Handle resize events
     * @param {Object} resizeData - Resize event data
     */
    handleResize(resizeData) {
        const wasMobile = this.isMobile;
        this.isMobile = window.innerWidth < 768;
        
        if (wasMobile !== this.isMobile) {
            this.refreshImageOptimizations();
        }
    }

    /**
     * Handle scroll events
     * @param {Object} scrollData - Scroll event data
     */
    handleScroll(scrollData) {
        // Could implement more sophisticated loading based on scroll speed
        // For now, just ensure intersection observer is working
    }

    /**
     * Refresh image optimizations after device change
     */
    refreshImageOptimizations() {
        // Recreate intersection observer with new margins
        if (this.intersectionObserver) {
            this.intersectionObserver.disconnect();
            this.setupIntersectionObserver();
            
            // Re-observe unloaded images
            this.images.forEach((config, imageId) => {
                if (!config.loaded && config.lazyLoad) {
                    this.intersectionObserver.observe(config.element);
                }
            });
        }
    }

    /**
     * Track image events for analytics
     * @param {string} eventType - Event type
     * @param {HTMLImageElement} img - Image element
     * @param {Object} config - Image configuration
     * @param {*} eventData - Additional event data
     */
    trackImageEvent(eventType, img, config, eventData = {}) {
        if (!config.analytics) return;

        const imageData = {
            imageId: config.id,
            src: config.originalSrc,
            priority: config.priority,
            retryCount: config.retryCount,
            isMobile: this.isMobile,
            ...eventData
        };

        // Custom analytics
        this.eventManager.emit('imageEvent', {
            type: eventType,
            image: imageData
        });

        // Console logging for development
        if (window.location.hostname === 'localhost' || window.location.hostname.includes('dev')) {
            console.log(`ImageManager: ${eventType}`, imageData);
        }
    }

    /**
     * Get image configuration
     * @param {string} imageId - Image ID
     * @returns {Object|null} Image configuration
     */
    getImageConfig(imageId) {
        return this.images.get(imageId) || null;
    }

    /**
     * Get all images status
     * @returns {Object} Status of all images
     */
    getAllImagesStatus() {
        const status = {};
        this.images.forEach((config, imageId) => {
            status[imageId] = {
                loaded: config.loaded,
                loading: config.loading,
                error: config.error,
                priority: config.priority,
                retryCount: config.retryCount
            };
        });
        return status;
    }

    /**
     * Force load image
     * @param {string} imageId - Image ID
     */
    forceLoadImage(imageId) {
        const config = this.images.get(imageId);
        if (config && !config.loaded) {
            this.loadImage(config.element, config);
        }
    }

    /**
     * Get debug information
     * @returns {Object} Debug information
     */
    getDebugInfo() {
        const images = {};
        this.images.forEach((config, id) => {
            const img = config.element;
            images[id] = {
                loaded: config.loaded,
                loading: config.loading,
                error: config.error,
                priority: config.priority,
                retryCount: config.retryCount,
                originalSrc: config.originalSrc,
                currentSrc: img.src,
                hasDataSrc: !!img.dataset.src,
                dataSrc: img.dataset.src,
                isAlreadyLazy: config.isAlreadyLazy,
                classes: img.className,
                visible: this.isElementVisible(img)
            };
        });
        
        return {
            images,
            totalImages: this.images.size,
            queueLength: this.loadingQueue.length,
            isProcessingQueue: this.isProcessingQueue,
            isMobile: this.isMobile,
            hasIntersectionObserver: !!this.intersectionObserver,
            hostname: window.location.hostname
        };
    }

    /**
     * Check if element is visible in viewport
     * @param {HTMLElement} element - Element to check
     * @returns {boolean} Is visible
     */
    isElementVisible(element) {
        const rect = element.getBoundingClientRect();
        return rect.top < window.innerHeight && rect.bottom > 0;
    }

    /**
     * Manual debug function - force load all images
     */
    debugLoadAllImages() {
        console.log('ImageManager: Manually loading all images for debugging');
        this.images.forEach((config, imageId) => {
            if (!config.loaded) {
                console.log(`ImageManager: Force loading ${imageId}`);
                this.loadImage(config.element, config);
            }
        });
    }

    /**
     * Clean up image manager
     */
    cleanup() {
        // Disconnect intersection observer
        if (this.intersectionObserver) {
            this.intersectionObserver.disconnect();
        }
        
        // Clear loading queue
        this.loadingQueue = [];
        this.isProcessingQueue = false;
        
        // Clear images map
        this.images.clear();
        
        console.log('ImageManager: Cleaned up');
    }
}

// Export for module systems or assign to window
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ImageManager;
} else {
    window.ImageManager = ImageManager;
} 