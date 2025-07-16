/**
 * Main JavaScript - Landing Page Functionality
 * Following SOLID principles and DRY methodology
 * File path: assets/js/main.js
 */

class LandingPageManager {
    constructor() {
        this.currentLanguage = 'pl';
        this.mobileMenuManager = null;
        this.init();
    }

    /**
     * Initialize the landing page functionality
     */
    init() {
        this.setupEventListeners();
        this.setupSmoothScrolling();
        this.setupFormValidation();
        this.setupIntersectionObserver();
        this.setupPerformanceOptimizations();
        this.setupVideoHandlers();
        this.setupMobileMenuIntegration();
        this.setupLanguageSwitcher();
        this.setupNavigation();
        this.checkUrlHash();
    }

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Language switching
        document.addEventListener('languageChanged', this.handleLanguageChange.bind(this));
        
        // Form submission
        const contactForm = document.getElementById('contactForm');
        if (contactForm) {
            contactForm.addEventListener('submit', this.handleFormSubmission.bind(this));
        }

        // Navigation clicks
        document.querySelectorAll('a[href^="#"]').forEach(link => {
            link.addEventListener('click', this.handleAnchorClick.bind(this));
        });

        // Window events
        window.addEventListener('scroll', this.throttle(this.handleScroll.bind(this), 16));
        window.addEventListener('resize', this.debounce(this.handleResize.bind(this), 250));
        window.addEventListener('load', this.handleWindowLoad.bind(this));
    }

    /**
     * Setup mobile menu integration
     */
    setupMobileMenuIntegration() {
        // Wait for mobile menu manager to be initialized
        if (window.mobileMenuManager) {
            this.mobileMenuManager = window.mobileMenuManager;
        } else {
            // Listen for mobile menu manager initialization
            document.addEventListener('DOMContentLoaded', () => {
                this.mobileMenuManager = window.mobileMenuManager;
            });
        }

        // Listen for mobile menu events
        document.addEventListener('menuOpened', this.handleMobileMenuOpened.bind(this));
        document.addEventListener('menuClosed', this.handleMobileMenuClosed.bind(this));
    }

    /**
     * Handle mobile menu opened event
     */
    handleMobileMenuOpened(event) {
        // Additional logic when mobile menu opens
        console.log('Mobile menu opened');
        
        // Pause any playing videos
        this.pauseAllVideos();
    }

    /**
     * Handle mobile menu closed event
     */
    handleMobileMenuClosed(event) {
        // Additional logic when mobile menu closes
        console.log('Mobile menu closed');
    }

    /**
     * Pause all videos on the page
     */
    pauseAllVideos() {
        const videos = document.querySelectorAll('video');
        videos.forEach(video => {
            if (!video.paused) {
                video.pause();
            }
        });
    }

    /**
     * Setup language switcher
     */
    setupLanguageSwitcher() {
        const langToggle = document.getElementById('langToggle');
        const currentLangSpan = langToggle?.querySelector('.current-lang');
        
        if (!langToggle || !currentLangSpan) return;
        
        langToggle.addEventListener('click', () => {
            // Toggle between PL and EN
            this.currentLanguage = this.currentLanguage === 'pl' ? 'en' : 'pl';
            currentLangSpan.textContent = this.currentLanguage.toUpperCase();
            
            // Dispatch language change event
            const event = new CustomEvent('languageChanged', {
                detail: { language: this.currentLanguage }
            });
            document.dispatchEvent(event);
            
            // Store preference
            try {
                localStorage.setItem('preferredLanguage', this.currentLanguage);
            } catch (error) {
                document.cookie = `preferredLanguage=${this.currentLanguage}; path=/; max-age=31536000`;
            }
        });
        
        // Set initial language from storage or detected language
        const initialLanguage = this.getStoredLanguage() || this.detectBrowserLanguage() || 'pl';
        this.currentLanguage = initialLanguage;
        
        // Update language button display
        if (currentLangSpan) {
            currentLangSpan.textContent = this.currentLanguage.toUpperCase();
        }
        
        // Trigger initial translation
        setTimeout(() => {
            const event = new CustomEvent('languageChanged', {
                detail: { language: this.currentLanguage }
            });
            document.dispatchEvent(event);
        }, 100);
    }
    
    /**
     * Get stored language preference
     */
    getStoredLanguage() {
        try {
            return localStorage.getItem('preferredLanguage');
        } catch (error) {
            const cookies = document.cookie.split(';');
            for (let cookie of cookies) {
                const [name, value] = cookie.trim().split('=');
                if (name === 'preferredLanguage' && (value === 'pl' || value === 'en')) {
                    return value;
                }
            }
            return null;
        }
    }
    
    /**
     * Detect browser language
     */
    detectBrowserLanguage() {
        const browserLanguage = navigator.language || navigator.userLanguage;
        const languageCode = browserLanguage.split('-')[0];
        return (languageCode === 'pl' || languageCode === 'en') ? languageCode : null;
    }

    /**
     * Setup smooth navigation
     */
    setupNavigation() {
        // Add active state to nav links based on scroll position
        const navLinks = document.querySelectorAll('.nav-menu a[href^="#"]');
        const sections = Array.from(navLinks).map(link => {
            const id = link.getAttribute('href').substring(1);
            return document.getElementById(id);
        }).filter(Boolean);
        
        if (sections.length === 0) return;
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const navLink = document.querySelector(`.nav-menu a[href="#${entry.target.id}"]`);
                if (navLink) {
                    if (entry.isIntersecting) {
                        // Remove active class from all links
                        navLinks.forEach(link => link.classList.remove('active'));
                        // Add active class to current link
                        navLink.classList.add('active');
                    }
                }
            });
        }, {
            threshold: 0.3,
            rootMargin: '-80px 0px -50% 0px'
        });
        
        sections.forEach(section => observer.observe(section));
    }

    /**
     * Setup smooth scrolling behavior
     */
    setupSmoothScrolling() {
        // Polyfill for browsers that don't support smooth scrolling
        if (!('scrollBehavior' in document.documentElement.style)) {
            this.loadSmoothScrollPolyfill();
        }
    }

    /**
     * Handle anchor link clicks with smooth scrolling
     */
    handleAnchorClick(event) {
        const target = event.target.closest('a');
        if (!target) return;

        const href = target.getAttribute('href');
        if (!href || !href.startsWith('#')) return;

        event.preventDefault();
        
        const targetId = href.substring(1);
        const targetElement = document.getElementById(targetId);
        
        if (targetElement) {
            // Get current header height
            const header = document.querySelector('.header');
            const headerHeight = header ? header.offsetHeight : 80;
            const targetPosition = targetElement.offsetTop - headerHeight - 20;
            
            window.scrollTo({
                top: Math.max(0, targetPosition),
                behavior: 'smooth'
            });

            // Update URL without triggering scroll
            history.pushState(null, null, href);
            
            // Close mobile menu if open
            if (this.mobileMenuManager) {
                this.mobileMenuManager.closeMenu();
            }
        }
    }

    /**
     * Setup form validation
     */
    setupFormValidation() {
        const form = document.getElementById('contactForm');
        if (!form) return;

        const inputs = form.querySelectorAll('input, textarea');
        
        inputs.forEach(input => {
            input.addEventListener('blur', this.validateField.bind(this));
            input.addEventListener('input', this.debounce(this.validateField.bind(this), 300));
        });
    }

    /**
     * Validate individual form field
     */
    validateField(event) {
        const field = event.target;
        const value = field.value.trim();
        const fieldName = field.name;
        
        // Remove existing error styling
        this.removeFieldError(field);
        
        // Validation rules
        const validators = {
            name: (value) => value.length >= 2,
            email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
            message: (value) => value.length >= 10
        };

        const validator = validators[fieldName];
        if (validator && !validator(value)) {
            this.addFieldError(field, this.getErrorMessage(fieldName));
            return false;
        }

        return true;
    }

    /**
     * Add error styling and message to field
     */
    addFieldError(field, message) {
        field.classList.add('error');
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.textContent = message;
        
        field.parentNode.appendChild(errorDiv);
    }

    /**
     * Remove error styling and message from field
     */
    removeFieldError(field) {
        field.classList.remove('error');
        
        const errorDiv = field.parentNode.querySelector('.field-error');
        if (errorDiv) {
            errorDiv.remove();
        }
    }

    /**
     * Get error message for field
     */
    getErrorMessage(fieldName) {
        const messages = {
            name: this.translate('error_name'),
            email: this.translate('error_email'),
            message: this.translate('error_message')
        };
        
        return messages[fieldName] || 'Invalid input';
    }

    /**
     * Handle form submission
     */
    async handleFormSubmission(event) {
        event.preventDefault();
        
        const form = event.target;
        const formData = new FormData(form);
        
        // Validate all fields
        const isValid = this.validateForm(form);
        if (!isValid) {
            this.showNotification(this.translate('form_validation_error'), 'error');
            return;
        }

        // Show loading state
        const submitButton = form.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.textContent = this.translate('form_sending');
        submitButton.disabled = true;

        try {
            // Simulate form submission (replace with actual endpoint)
            await this.submitForm(formData);
            
            // Success feedback
            this.showNotification(this.translate('form_success'), 'success');
            form.reset();
            
        } catch (error) {
            console.error('Form submission error:', error);
            this.showNotification(this.translate('form_error'), 'error');
        } finally {
            // Reset button state
            submitButton.textContent = originalText;
            submitButton.disabled = false;
        }
    }

    /**
     * Validate entire form
     */
    validateForm(form) {
        const inputs = form.querySelectorAll('input, textarea');
        let isValid = true;
        
        inputs.forEach(input => {
            const fieldValid = this.validateField({ target: input });
            if (!fieldValid) {
                isValid = false;
            }
        });
        
        return isValid;
    }

    /**
     * Submit form data
     */
    async submitForm(formData) {
        // This would be replaced with actual form submission logic
        // For example, sending to WordPress admin-ajax.php or REST API
        
        const response = await fetch(window.ajaxurl || '/wp-admin/admin-ajax.php', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error('Form submission failed');
        }
        
        return response.json();
    }

    /**
     * Setup intersection observer for animations
     */
    setupIntersectionObserver() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, observerOptions);

        // Observe elements for animation
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
                observer.observe(el);
            });
        });
    }

    /**
     * Setup video handlers
     */
    setupVideoHandlers() {
        const videos = document.querySelectorAll('video');
        
        videos.forEach(video => {
            // Simple error handling
            video.addEventListener('error', (e) => {
                console.error('Video loading error:', e);
                this.handleVideoError(video);
            });
            
            // Enable loading
            video.addEventListener('loadstart', () => {
                console.log('Video loading started:', video.src);
            });
            
            video.addEventListener('canplay', () => {
                console.log('Video can play:', video.src);
            });
            
            // For mobile optimization
            if (window.innerWidth < 768) {
                video.muted = true;
            }
        });
    }

    /**
     * Setup handler for a single video element
     */
    setupSingleVideoHandler(video) {
        // Lazy loading for videos
        this.setupVideoLazyLoading(video);
        
        // Performance optimization
        this.optimizeVideoPerformance(video);
        
        // Error handling
        this.setupVideoErrorHandling(video);
        
        // Analytics tracking
        this.setupVideoAnalytics(video);
    }

    /**
     * Setup lazy loading for video
     */
    setupVideoLazyLoading(video) {
        // For videos with direct src attributes, just optimize loading
        if (!('IntersectionObserver' in window)) {
            this.loadVideo(video);
            return;
        }

        const videoObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadVideo(entry.target);
                    videoObserver.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '100px 0px'
        });

        videoObserver.observe(video);
    }

    /**
     * Load video sources
     */
    loadVideo(video) {
        if (video.dataset.loaded === 'true') return;
        
        // Ensure video is properly loaded
        const sources = video.querySelectorAll('source');
        
        // Add error handling for each source
        sources.forEach(source => {
            source.addEventListener('error', () => {
                console.warn(`Failed to load video source: ${source.src}`);
            });
        });
        
        // Force reload the video
        video.load();
        
        // Add load event listener
        video.addEventListener('loadedmetadata', () => {
            console.log('Video metadata loaded:', video.src);
        });
        
        video.addEventListener('canplay', () => {
            console.log('Video can start playing:', video.src);
        });
        
        video.addEventListener('error', (e) => {
            console.error('Video error:', e);
            this.handleVideoError(video);
        });
        
        video.dataset.loaded = 'true';
    }

    /**
     * Optimize video performance
     */
    optimizeVideoPerformance(video) {
        // Reduce quality on mobile
        if (window.innerWidth < 768) {
            video.preload = 'metadata';
        }
        
        // Pause video when not visible
        const pauseObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting && !video.paused) {
                    video.pause();
                }
            });
        }, {
            threshold: 0.1
        });
        
        pauseObserver.observe(video);
    }

    /**
     * Setup video error handling
     */
    setupVideoErrorHandling(video) {
        video.addEventListener('error', (e) => {
            console.error('Video loading error:', e);
            this.handleVideoError(video);
        });
        
        video.addEventListener('stalled', () => {
            console.warn('Video playback stalled');
        });
    }

    /**
     * Handle video loading errors
     */
    handleVideoError(video) {
        const container = video.parentElement;
        
        // Create fallback content
        const fallback = document.createElement('div');
        fallback.className = 'video-fallback';
        fallback.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: var(--light-gray);
            border-radius: var(--border-radius);
            aspect-ratio: 9 / 21;
            flex-direction: column;
            gap: 1rem;
            padding: 2rem;
            text-align: center;
        `;
        
        fallback.innerHTML = `
            <div class="fallback-content" style="color: var(--gray-text);">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="23 7 16 12 23 17 23 7"></polygon>
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                </svg>
                <p style="margin: 1rem 0;">Video nie może zostać załadowane</p>
                <button onclick="window.open('tel:732980676')" class="btn-primary">
                    Skontaktuj się z nami
                </button>
            </div>
        `;
        
        container.appendChild(fallback);
        video.style.display = 'none';
    }

    /**
     * Setup video analytics tracking
     */
    setupVideoAnalytics(video) {
        const events = ['play', 'pause', 'ended', 'timeupdate'];
        
        events.forEach(eventType => {
            video.addEventListener(eventType, (e) => {
                this.trackVideoEvent(eventType, video, e);
            });
        });
    }

    /**
     * Track video events for analytics
     */
    trackVideoEvent(eventType, video, event) {
        // Integration with analytics platforms
        if (typeof gtag !== 'undefined') {
            gtag('event', eventType, {
                event_category: 'Video',
                event_label: video.src || 'ItsyBitsy Video',
                value: Math.round(video.currentTime)
            });
        }
        
        // Custom analytics
        console.log(`Video ${eventType}:`, {
            currentTime: video.currentTime,
            duration: video.duration,
            src: video.src
        });
    }

    /**
     * Handle scroll events
     */
    handleScroll() {
        const scrollTop = window.pageYOffset;
        const header = document.querySelector('.header');
        
        // Add scrolled class to header
        if (scrollTop > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }

        // Parallax effect for hero background
        const heroBackground = document.querySelector('.hero-bg-image');
        if (heroBackground && scrollTop < window.innerHeight) {
            heroBackground.style.transform = `translateY(${scrollTop * 0.5}px)`;
        }
    }

    /**
     * Handle window resize
     */
    handleResize() {
        // Update any size-dependent calculations
        this.updateViewportHeight();
        this.updateContainerSizes();
        this.optimizeVideosForDevice();
    }

    /**
     * Optimize videos based on device capabilities
     */
    optimizeVideosForDevice() {
        const videos = document.querySelectorAll('video');
        const isMobile = window.innerWidth < 768;
        
        videos.forEach(video => {
            if (isMobile) {
                video.muted = true;
                video.preload = 'metadata';
            } else {
                video.preload = 'auto';
            }
        });
    }

    /**
     * Handle window load
     */
    handleWindowLoad() {
        // Remove loading class if present
        document.body.classList.remove('loading');
        
        // Clear any initial focus states
        this.clearAllFocus();
        
        // Trigger any load-dependent animations
        this.triggerLoadAnimations();
    }

    /**
     * Clear all focus states
     */
    clearAllFocus() {
        const focusedElements = document.querySelectorAll(':focus');
        focusedElements.forEach(element => {
            element.blur();
        });
    }

    /**
     * Handle language change
     */
    handleLanguageChange(event) {
        this.currentLanguage = event.detail.language;
        this.updatePageContent();
        
        // Update language button text
        const currentLangSpan = document.querySelector('.current-lang');
        if (currentLangSpan) {
            currentLangSpan.textContent = this.currentLanguage.toUpperCase();
        }
    }

    /**
     * Update page content based on current language
     */
    updatePageContent() {
        const elementsToTranslate = document.querySelectorAll('[data-translate]');
        
        elementsToTranslate.forEach(element => {
            const key = element.getAttribute('data-translate');
            const translation = this.translate(key);
            
            if (element.tagName === 'INPUT' && element.type === 'submit') {
                element.value = translation;
            } else if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.placeholder = translation;
            } else {
                element.textContent = translation;
            }
        });

        // Update document title
        const titleTranslation = this.translate('page_title');
        if (titleTranslation !== 'page_title') {
            document.title = titleTranslation;
        }
        
        // Update meta description
        const metaDescription = document.querySelector('meta[name="description"]');
        const descTranslation = this.translate('meta_description');
        if (metaDescription && descTranslation !== 'meta_description') {
            metaDescription.setAttribute('content', descTranslation);
        }
    }

    /**
     * Get translation for key
     */
    translate(key) {
        // This would interface with the translations.js module
        if (window.translations && window.translations[this.currentLanguage]) {
            return window.translations[this.currentLanguage][key] || key;
        }
        
        // Fallback translations
        const fallbackTranslations = {
            pl: {
                nav_home: 'Strona Główna',
                nav_about: 'O Nas', 
                nav_services: 'Nasza Wyjątkowość',
                nav_testimonials: 'Opinie',
                nav_contact: 'Kontakt'
            },
            en: {
                nav_home: 'Home',
                nav_about: 'About Us',
                nav_services: 'Our Uniqueness', 
                nav_testimonials: 'Testimonials',
                nav_contact: 'Contact'
            }
        };
        
        if (fallbackTranslations[this.currentLanguage] && fallbackTranslations[this.currentLanguage][key]) {
            return fallbackTranslations[this.currentLanguage][key];
        }
        
        return key;
    }

    /**
     * Show notification to user
     */
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Trigger animation
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Remove after delay
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    /**
     * Check URL hash and scroll to section
     */
    checkUrlHash() {
        const hash = window.location.hash;
        if (hash) {
            setTimeout(() => {
                const target = document.querySelector(hash);
                if (target) {
                    const header = document.querySelector('.header');
                    const headerHeight = header ? header.offsetHeight : 80;
                    const targetPosition = target.offsetTop - headerHeight - 20;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            }, 100);
        }
    }

    /**
     * Setup performance optimizations
     */
    setupPerformanceOptimizations() {
        // Lazy load images
        this.setupLazyLoading();
        
        // Preload critical resources
        this.preloadCriticalResources();
        
        // Setup service worker if available
        this.setupServiceWorker();
    }

    /**
     * Setup lazy loading for images
     */
    setupLazyLoading() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.classList.remove('lazy');
                        imageObserver.unobserve(img);
                    }
                });
            });

            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
        }
    }

    /**
     * Preload critical resources
     */
    preloadCriticalResources() {
        const criticalImages = [
            'assets/images/hero-bg.jpg',
            'assets/images/logo.png'
        ];

        criticalImages.forEach(src => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = src;
            document.head.appendChild(link);
        });
    }

    /**
     * Setup service worker
     */
    setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('SW registered:', registration);
                })
                .catch(error => {
                    console.log('SW registration failed:', error);
                });
        }
    }

    /**
     * Update viewport height for mobile
     */
    updateViewportHeight() {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }

    /**
     * Update container sizes
     */
    updateContainerSizes() {
        // Update any container-dependent calculations
        const containers = document.querySelectorAll('.container');
        containers.forEach(container => {
            // Trigger reflow if needed
            container.offsetHeight;
        });
    }

    /**
     * Trigger load animations
     */
    triggerLoadAnimations() {
        const animatedElements = document.querySelectorAll('.animate-on-load');
        animatedElements.forEach(element => {
            element.classList.add('animated');
        });
    }

    /**
     * Load smooth scroll polyfill
     */
    loadSmoothScrollPolyfill() {
        const script = document.createElement('script');
        script.src = 'https://polyfill.io/v3/polyfill.min.js?features=smoothscroll';
        document.head.appendChild(script);
    }

    /**
     * Throttle function calls
     */
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * Debounce function calls
     */
    debounce(func, wait) {
        let timeout;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(function() {
                func.apply(context, args);
            }, wait);
        };
    }
}

// Initialize the landing page manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new LandingPageManager();
});

// WordPress integration
if (typeof jQuery !== 'undefined') {
    jQuery(document).ready(() => {
        // WordPress specific initialization
        console.log('WordPress integration loaded');
    });
}