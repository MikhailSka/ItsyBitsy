/**
 * VideoManager - Handles video loading, optimization, and analytics
 * Following Single Responsibility Principle
 * File path: assets/js/managers/VideoManager.js
 */

class VideoManager {
    constructor(eventManager) {
        this.eventManager = eventManager;
        this.videos = new Map();
        this.intersectionObserver = null;
        this.pauseObserver = null;
        this.init();
    }

    /**
     * Initialize video manager
     */
    init() {
        this.setupIntersectionObserver();
        this.setupPauseObserver();
        this.setupEventListeners();
        this.detectAndSetupVideos();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Listen for mobile menu events to pause videos
        this.eventManager.on('menuOpened', this.pauseAllVideos.bind(this));
        
        // Listen for resize events to optimize videos
        this.eventManager.on('resize', this.handleResize.bind(this));
        
        // Listen for touch events on mobile
        this.eventManager.on('touchend', this.handleTouchEnd.bind(this));
    }

    /**
     * Setup intersection observer for lazy loading
     */
    setupIntersectionObserver() {
        if (!('IntersectionObserver' in window)) {
            console.warn('IntersectionObserver not supported, loading all videos immediately');
            this.loadAllVideos();
            return;
        }

        this.intersectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadVideo(entry.target);
                    this.intersectionObserver.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '100px 0px'
        });
    }

    /**
     * Setup observer to pause videos when not visible
     */
    setupPauseObserver() {
        if (!('IntersectionObserver' in window)) return;

        this.pauseObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const video = entry.target;
                if (!entry.isIntersecting && !video.paused) {
                    video.pause();
                    this.trackVideoEvent('pause', video, { reason: 'not_visible' });
                }
            });
        }, {
            threshold: 0.1
        });
    }

    /**
     * Detect and setup all videos on the page
     */
    detectAndSetupVideos() {
        const videos = document.querySelectorAll('video');
        
        videos.forEach((video, index) => {
            const videoId = video.id || `video-${index}`;
            if (!video.id) {
                video.id = videoId;
            }
            
            this.setupVideo(videoId);
        });
        
        console.log(`VideoManager initialized for ${videos.length} videos`);
    }

    /**
     * Setup a single video
     * @param {string} videoId - Video element ID
     * @param {Object} options - Video configuration options
     */
    setupVideo(videoId, options = {}) {
        const video = document.getElementById(videoId);
        if (!video) {
            console.warn(`Video with ID ${videoId} not found`);
            return;
        }

        const videoConfig = {
            id: videoId,
            element: video,
            loaded: false,
            playing: false,
            error: false,
            autoplay: options.autoplay !== false && video.hasAttribute('autoplay'),
            muted: options.muted !== false || video.hasAttribute('muted'),
            loop: options.loop !== false && video.hasAttribute('loop'),
            preload: options.preload || video.getAttribute('preload') || 'metadata',
            poster: options.poster || video.getAttribute('poster'),
            fallbackContent: options.fallbackContent || null,
            analytics: options.analytics !== false,
            lazyLoad: options.lazyLoad !== false,
            pauseWhenHidden: options.pauseWhenHidden !== false
        };

        // Store video configuration
        this.videos.set(videoId, videoConfig);

        // Setup video handlers
        this.setupVideoHandlers(video, videoConfig);

        // Setup lazy loading if enabled
        if (videoConfig.lazyLoad) {
            this.setupVideoLazyLoading(video);
        } else {
            this.loadVideo(video);
        }

        // Setup pause when hidden if enabled
        if (videoConfig.pauseWhenHidden && this.pauseObserver) {
            this.pauseObserver.observe(video);
        }

        // Optimize for mobile
        this.optimizeVideoForDevice(video, videoConfig);

        console.log(`Video ${videoId} setup complete`);
    }

    /**
     * Setup video event handlers
     * @param {HTMLVideoElement} video - Video element
     * @param {Object} config - Video configuration
     */
    setupVideoHandlers(video, config) {
        // Loading events
        video.addEventListener('loadstart', (e) => {
            console.log('Video loading started:', video.src);
            this.trackVideoEvent('loadstart', video, e);
        });

        video.addEventListener('loadedmetadata', (e) => {
            console.log('Video metadata loaded:', video.src);
            this.trackVideoEvent('loadedmetadata', video, e);
        });

        video.addEventListener('canplay', (e) => {
            console.log('Video can play:', video.src);
            config.loaded = true;
            this.trackVideoEvent('canplay', video, e);
        });

        video.addEventListener('canplaythrough', (e) => {
            this.trackVideoEvent('canplaythrough', video, e);
        });

        // Playback events
        video.addEventListener('play', (e) => {
            config.playing = true;
            this.trackVideoEvent('play', video, e);
        });

        video.addEventListener('pause', (e) => {
            config.playing = false;
            this.trackVideoEvent('pause', video, e);
        });

        video.addEventListener('ended', (e) => {
            config.playing = false;
            this.trackVideoEvent('ended', video, e);
        });

        video.addEventListener('timeupdate', (e) => {
            this.trackVideoEvent('timeupdate', video, e);
        });

        video.addEventListener('volumechange', (e) => {
            this.trackVideoEvent('volumechange', video, e);
        });

        // Error handling
        video.addEventListener('error', (e) => {
            console.error('Video loading error:', e);
            config.error = true;
            this.handleVideoError(video, config, e);
        });

        video.addEventListener('stalled', (e) => {
            console.warn('Video playback stalled');
            this.trackVideoEvent('stalled', video, e);
        });

        video.addEventListener('waiting', (e) => {
            this.trackVideoEvent('waiting', video, e);
        });

        // Network events
        video.addEventListener('loadstart', (e) => {
            this.trackVideoEvent('loadstart', video, e);
        });

        video.addEventListener('progress', (e) => {
            this.trackVideoEvent('progress', video, e);
        });
    }

    /**
     * Setup lazy loading for video
     * @param {HTMLVideoElement} video - Video element
     */
    setupVideoLazyLoading(video) {
        if (this.intersectionObserver) {
            this.intersectionObserver.observe(video);
        } else {
            // Fallback: load immediately if no intersection observer
            this.loadVideo(video);
        }
    }

    /**
     * Load video sources and metadata
     * @param {HTMLVideoElement} video - Video element
     */
    loadVideo(video) {
        const config = this.videos.get(video.id);
        if (!config || config.loaded) return;

        // Set preload attribute
        video.preload = config.preload;

        // Set poster if available
        if (config.poster) {
            video.poster = config.poster;
        }

        // Ensure video is properly loaded
        const sources = video.querySelectorAll('source');

        // Add error handling for each source
        sources.forEach(source => {
            source.addEventListener('error', () => {
                console.warn(`Failed to load video source: ${source.src}`);
            });
        });

        // Force reload the video
        try {
            video.load();
        } catch (error) {
            console.error('Error loading video:', error);
            this.handleVideoError(video, config, error);
        }

        config.loaded = true;
        console.log('Video loaded:', video.src || video.id);
    }

    /**
     * Load all videos immediately
     */
    loadAllVideos() {
        this.videos.forEach((config, videoId) => {
            this.loadVideo(config.element);
        });
    }

    /**
     * Optimize video for current device
     * @param {HTMLVideoElement} video - Video element
     * @param {Object} config - Video configuration
     */
    optimizeVideoForDevice(video, config) {
        const isMobile = window.innerWidth < 768;
        
        if (isMobile) {
            // Mobile optimizations
            video.muted = true;
            video.preload = 'metadata';
            config.muted = true;
            config.preload = 'metadata';
            
            // Disable autoplay on mobile to save bandwidth
            if (config.autoplay) {
                video.removeAttribute('autoplay');
                config.autoplay = false;
            }
        } else {
            // Desktop optimizations
            video.preload = config.preload || 'auto';
            
            // Restore autoplay if originally intended
            if (config.autoplay) {
                video.setAttribute('autoplay', '');
            }
        }
    }

    /**
     * Handle video loading errors
     * @param {HTMLVideoElement} video - Video element
     * @param {Object} config - Video configuration
     * @param {Event} error - Error event
     */
    handleVideoError(video, config, error) {
        const container = video.parentElement;
        
        // Create fallback content
        let fallbackContent = config.fallbackContent;
        
        if (!fallbackContent) {
            fallbackContent = this.createDefaultFallback();
        }
        
        if (typeof fallbackContent === 'string') {
            container.innerHTML = fallbackContent;
        } else if (fallbackContent instanceof HTMLElement) {
            container.appendChild(fallbackContent);
            video.style.display = 'none';
        }
        
        // Track error
        this.trackVideoEvent('error', video, { error, fallback: true });
        
        config.error = true;
        
        console.error(`Video ${video.id} failed to load, fallback displayed`);
    }

    /**
     * Create default fallback content for failed videos
     * @returns {HTMLElement} Fallback element
     */
    createDefaultFallback() {
        const fallback = document.createElement('div');
        fallback.className = 'video-fallback';
        fallback.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: var(--light-gray, #f5f5f5);
            border-radius: var(--border-radius, 8px);
            aspect-ratio: 9 / 21;
            flex-direction: column;
            gap: 1rem;
            padding: 2rem;
            text-align: center;
            color: var(--gray-text, #666);
            font-family: inherit;
        `;
        
        fallback.innerHTML = `
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="23 7 16 12 23 17 23 7"></polygon>
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
            </svg>
            <p style="margin: 1rem 0; font-size: 14px;">Video nie może zostać załadowane</p>
            <button onclick="window.open('tel:732980676')" style="
                background: var(--primary-color, #007cba);
                color: white;
                border: none;
                padding: 0.5rem 1rem;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
            ">
                Skontaktuj się z nami
            </button>
        `;
        
        return fallback;
    }

    /**
     * Pause all videos on the page
     */
    pauseAllVideos() {
        this.videos.forEach((config, videoId) => {
            const video = config.element;
            if (!video.paused) {
                video.pause();
                this.trackVideoEvent('pause', video, { reason: 'pause_all' });
            }
        });
    }

    /**
     * Play specific video
     * @param {string} videoId - Video ID
     * @returns {Promise} Play promise
     */
    async playVideo(videoId) {
        const config = this.videos.get(videoId);
        if (!config) {
            console.warn(`Video ${videoId} not found`);
            return;
        }

        const video = config.element;
        
        try {
            await video.play();
            config.playing = true;
            return true;
        } catch (error) {
            console.error(`Failed to play video ${videoId}:`, error);
            this.trackVideoEvent('play_error', video, { error });
            return false;
        }
    }

    /**
     * Pause specific video
     * @param {string} videoId - Video ID
     */
    pauseVideo(videoId) {
        const config = this.videos.get(videoId);
        if (!config) {
            console.warn(`Video ${videoId} not found`);
            return;
        }

        const video = config.element;
        video.pause();
        config.playing = false;
    }

    /**
     * Mute/unmute specific video
     * @param {string} videoId - Video ID
     * @param {boolean} muted - Mute state
     */
    setVideoMuted(videoId, muted) {
        const config = this.videos.get(videoId);
        if (!config) {
            console.warn(`Video ${videoId} not found`);
            return;
        }

        const video = config.element;
        video.muted = muted;
        config.muted = muted;
        
        this.trackVideoEvent('mute_change', video, { muted });
    }

    /**
     * Set video volume
     * @param {string} videoId - Video ID
     * @param {number} volume - Volume level (0-1)
     */
    setVideoVolume(videoId, volume) {
        const config = this.videos.get(videoId);
        if (!config) {
            console.warn(`Video ${videoId} not found`);
            return;
        }

        const video = config.element;
        video.volume = Math.max(0, Math.min(1, volume));
        
        this.trackVideoEvent('volume_change', video, { volume });
    }

    /**
     * Handle resize events
     * @param {Object} resizeData - Resize event data
     */
    handleResize(resizeData) {
        // Re-optimize all videos for new screen size
        this.videos.forEach((config, videoId) => {
            this.optimizeVideoForDevice(config.element, config);
        });
    }

    /**
     * Handle touch end events on mobile
     * @param {Object} touchData - Touch event data
     */
    handleTouchEnd(touchData) {
        // Force refresh video states after significant scroll
        if (touchData.isSignificantScroll) {
            setTimeout(() => {
                this.refreshVideoStates();
            }, 100);
        }
    }

    /**
     * Refresh video states (useful after scroll or layout changes)
     */
    refreshVideoStates() {
        this.videos.forEach((config, videoId) => {
            const video = config.element;
            const rect = video.getBoundingClientRect();
            const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
            
            // Pause videos that are no longer visible
            if (!isVisible && !video.paused && config.pauseWhenHidden) {
                video.pause();
                this.trackVideoEvent('pause', video, { reason: 'not_visible_after_scroll' });
            }
        });
    }

    /**
     * Track video events for analytics
     * @param {string} eventType - Event type
     * @param {HTMLVideoElement} video - Video element
     * @param {*} eventData - Additional event data
     */
    trackVideoEvent(eventType, video, eventData = {}) {
        const config = this.videos.get(video.id);
        if (!config || !config.analytics) return;

        // Throttle timeupdate events
        if (eventType === 'timeupdate') {
            const now = Date.now();
            if (config.lastTimeUpdate && now - config.lastTimeUpdate < 1000) {
                return; // Skip if less than 1 second since last update
            }
            config.lastTimeUpdate = now;
        }

        const videoData = {
            videoId: video.id,
            src: video.src || 'unknown',
            currentTime: Math.round(video.currentTime),
            duration: Math.round(video.duration) || 0,
            volume: video.volume,
            muted: video.muted,
            paused: video.paused,
            ended: video.ended,
            ...eventData
        };

        // Google Analytics integration
        if (typeof gtag !== 'undefined') {
            gtag('event', eventType, {
                event_category: 'Video',
                event_label: videoData.src,
                value: videoData.currentTime,
                custom_map: {
                    video_id: videoData.videoId,
                    video_duration: videoData.duration
                }
            });
        }

        // Custom analytics
        this.eventManager.emit('videoEvent', {
            type: eventType,
            video: videoData
        });

        // Console logging for development
        if (window.location.hostname === 'localhost' || window.location.hostname.includes('dev')) {
            console.log(`Video ${eventType}:`, videoData);
        }
    }

    /**
     * Get video configuration
     * @param {string} videoId - Video ID
     * @returns {Object|null} Video configuration
     */
    getVideoConfig(videoId) {
        return this.videos.get(videoId) || null;
    }

    /**
     * Get all videos status
     * @returns {Object} Status of all videos
     */
    getAllVideosStatus() {
        const status = {};
        this.videos.forEach((config, videoId) => {
            status[videoId] = {
                loaded: config.loaded,
                playing: config.playing,
                error: config.error,
                muted: config.muted,
                currentTime: config.element.currentTime,
                duration: config.element.duration
            };
        });
        return status;
    }

    /**
     * Remove video from manager
     * @param {string} videoId - Video ID
     */
    removeVideo(videoId) {
        const config = this.videos.get(videoId);
        if (config) {
            // Unobserve from intersection observers
            if (this.intersectionObserver) {
                this.intersectionObserver.unobserve(config.element);
            }
            if (this.pauseObserver) {
                this.pauseObserver.unobserve(config.element);
            }
            
            // Remove from map
            this.videos.delete(videoId);
        }
    }

    /**
     * Get debug information
     * @returns {Object} Debug information
     */
    getDebugInfo() {
        const videos = {};
        this.videos.forEach((config, id) => {
            videos[id] = {
                loaded: config.loaded,
                playing: config.playing,
                error: config.error,
                src: config.element.src || 'no source',
                readyState: config.element.readyState,
                networkState: config.element.networkState
            };
        });
        
        return {
            videos,
            totalVideos: this.videos.size,
            hasIntersectionObserver: !!this.intersectionObserver,
            hasPauseObserver: !!this.pauseObserver
        };
    }

    /**
     * Clean up video manager
     */
    cleanup() {
        // Disconnect observers
        if (this.intersectionObserver) {
            this.intersectionObserver.disconnect();
        }
        if (this.pauseObserver) {
            this.pauseObserver.disconnect();
        }
        
        // Clear videos map
        this.videos.clear();
        
        console.log('VideoManager cleaned up');
    }
}

// Export for module systems or assign to window
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VideoManager;
} else {
    window.VideoManager = VideoManager;
} 