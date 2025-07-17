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
        this.setupParallax();
        this.initializeAOS();
        this.checkUrlHash();
        
        // Set initial active state after a short delay
        setTimeout(() => {
            if (!window.location.hash) {
                const firstNavLink = document.querySelector('.nav-menu a[href^="#"]');
                if (firstNavLink) {
                    this.setActiveNavLink(firstNavLink);
                }
            }
        }, 200);
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

        // Scroll events - always bind to both for maximum compatibility
        const scrollContainer = document.querySelector('#content-wrapper');
        const scrollHandler = this.throttle(this.handleScroll.bind(this), 16);
        
        if (scrollContainer) {
            // Primary scroll handler on content wrapper
            scrollContainer.addEventListener('scroll', scrollHandler, { passive: true });
            console.log('Scroll handler bound to content wrapper');
        }
        
        // Also bind to window as fallback
        window.addEventListener('scroll', scrollHandler, { passive: true });
        
        window.addEventListener('resize', this.debounce(this.handleResize.bind(this), 250));
        window.addEventListener('load', this.handleWindowLoad.bind(this));
        
        // Mobile-specific events for better scroll detection
        if ('ontouchstart' in window) {
            window.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
            window.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });
        }
        
        // Enhanced mobile support
        window.addEventListener('orientationchange', this.debounce(() => {
            this.handleResize();
            // Force refresh animations after orientation change
            if (typeof AOS !== 'undefined') {
                setTimeout(() => {
                    AOS.refresh();
                }, 300);
            }
        }, 300));
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
        
        // Remove any existing event listeners
        langToggle.replaceWith(langToggle.cloneNode(true));
        const newLangToggle = document.getElementById('langToggle');
        const newCurrentLangSpan = newLangToggle?.querySelector('.current-lang');
        
        if (!newLangToggle || !newCurrentLangSpan) return;
        
        newLangToggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Get current language from the translation manager if available
            let currentLang = 'pl';
            if (window.translationManager && window.translationManager.getCurrentLanguage) {
                currentLang = window.translationManager.getCurrentLanguage();
            } else {
                currentLang = this.getStoredLanguage() || 'pl';
            }
            
            // Toggle between PL and EN
            const newLanguage = currentLang === 'pl' ? 'en' : 'pl';
            
            // Update the display immediately
            newCurrentLangSpan.textContent = newLanguage.toUpperCase();
            
            // Use translation manager if available
            if (window.translationManager && window.translationManager.switchLanguage) {
                window.translationManager.switchLanguage(newLanguage);
            } else {
                // Fallback: store language and try again later
                this.storeLanguage(newLanguage);
                this.currentLanguage = newLanguage;
                
                // Retry with translation manager in a moment
                setTimeout(() => {
                    if (window.translationManager && window.translationManager.switchLanguage) {
                        window.translationManager.switchLanguage(newLanguage);
                    }
                }, 100);
            }
        });
        
        // Initialize language display
        this.initializeLanguageDisplay();
    }
    
    /**
     * Initialize language display
     */
    initializeLanguageDisplay() {
        const currentLangSpan = document.querySelector('.current-lang');
        if (!currentLangSpan) return;
        
        // Try to get language from translation manager first
        let initialLanguage = 'pl';
        
        if (window.translationManager && window.translationManager.getCurrentLanguage) {
            initialLanguage = window.translationManager.getCurrentLanguage();
        } else {
            initialLanguage = this.getStoredLanguage() || this.detectBrowserLanguage() || 'pl';
        }
        
        this.currentLanguage = initialLanguage;
        currentLangSpan.textContent = this.currentLanguage.toUpperCase();
        
        // Set up a retry mechanism for translation initialization
        this.setupTranslationRetry();
    }
    
    /**
     * Setup translation retry mechanism
     */
    setupTranslationRetry() {
        let retries = 0;
        const maxRetries = 10;
        
        const tryInitializeTranslations = () => {
            if (window.translationManager && window.translationManager.switchLanguage) {
                // Translation manager is ready, trigger translation
                window.translationManager.switchLanguage(this.currentLanguage);
                return true;
            } else if (retries < maxRetries) {
                // Not ready yet, try again
                retries++;
                setTimeout(tryInitializeTranslations, 200);
                return false;
            } else {
                console.warn('Translation manager not available after maximum retries');
                return false;
            }
        };
        
        // Start the retry process
        setTimeout(tryInitializeTranslations, 100);
    }
    
    /**
     * Store language preference
     */
    storeLanguage(language) {
        try {
            localStorage.setItem('preferredLanguage', language);
        } catch (error) {
            document.cookie = `preferredLanguage=${language}; path=/; max-age=31536000`;
        }
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
     * Setup smooth navigation with improved accuracy
     */
    setupNavigation() {
        // Add active state to nav links based on scroll position
        const navLinks = document.querySelectorAll('.nav-menu a[href^="#"]');
        const sections = Array.from(navLinks).map(link => {
            const id = link.getAttribute('href').substring(1);
            return document.getElementById(id);
        }).filter(Boolean);
        
        if (sections.length === 0) return;
        
        // Set initial active state
        this.setActiveNavLink(navLinks[0]);
        
        // Use a more accurate scroll-based approach instead of just Intersection Observer
        this.setupScrollBasedNavigation(sections, navLinks);
    }

    /**
     * Setup scroll-based navigation highlighting with better accuracy
     */
    setupScrollBasedNavigation(sections, navLinks) {
        const scrollContainer = document.querySelector('#content-wrapper');
        const headerHeight = 80;
        
        // Define section groups - sections that should be considered as one navigation group
        const sectionGroups = {
            'home': ['home'],
            'about-us': ['about-us'],
            'uniqueness': ['uniqueness'], // Will be extended with related sections
            'reviews': ['reviews'],
            'contact': ['contact']
        };
        
        // Add sections without IDs that belong to specific navigation groups
        const sectionGroupMapping = {
            'uniqueness': [
                '.why-us-section',
                '.visit-us-section', 
                '.listen-children-section'
            ],
            'reviews': [
                '.lets-meet-section'  // "Let's get to know each other" belongs to reviews
            ]
        };
        
        // Apply grouping to sections
        Object.entries(sectionGroupMapping).forEach(([navGroup, selectors]) => {
            selectors.forEach(selector => {
                const element = document.querySelector(selector);
                if (element) {
                    // Add a temporary ID for tracking
                    if (!element.id) {
                        element.setAttribute('data-nav-group', navGroup);
                    }
                }
            });
        });
        
        const updateActiveNavigation = () => {
            // Get current scroll position
            const scrollTop = scrollContainer ? scrollContainer.scrollTop : window.pageYOffset;
            const containerHeight = scrollContainer ? scrollContainer.clientHeight : window.innerHeight;
            
            // Special case: if we're at the very top, always highlight first section (Home)
            if (scrollTop <= 50) {
                this.setActiveNavLink(navLinks[0]);
                return;
            }
            
            // Get all sections to check (including grouped sections)
            const allSectionsToCheck = [...sections];
            
            // Add grouped sections (sections without IDs that belong to navigation groups)
            const groupedSections = document.querySelectorAll('[data-nav-group]');
            groupedSections.forEach(section => {
                if (!allSectionsToCheck.includes(section)) {
                    allSectionsToCheck.push(section);
                }
            });
            
            // Find the section that should be active based on position
            let activeSection = null;
            let bestScore = -1;
            let activeNavGroup = null;
            
            allSectionsToCheck.forEach((section, index) => {
                if (!section) return;
                
                const rect = section.getBoundingClientRect();
                const scrollContainerRect = scrollContainer ? scrollContainer.getBoundingClientRect() : { top: 0 };
                
                // Calculate section position relative to viewport
                const sectionTop = rect.top - scrollContainerRect.top;
                const sectionBottom = rect.bottom - scrollContainerRect.top;
                const sectionHeight = rect.height;
                
                // Calculate how much of the section is in the "active zone"
                // Active zone is the top 60% of the viewport, accounting for header
                const activeZoneTop = headerHeight;
                const activeZoneBottom = containerHeight * 0.6;
                
                // Calculate overlap with active zone
                const overlapTop = Math.max(activeZoneTop, sectionTop);
                const overlapBottom = Math.min(activeZoneBottom, sectionBottom);
                const overlap = Math.max(0, overlapBottom - overlapTop);
                
                // Calculate score based on:
                // 1. How much section is in active zone
                // 2. How close the section top is to the ideal position (header + small offset)
                const visibilityRatio = overlap / Math.min(sectionHeight, activeZoneBottom - activeZoneTop);
                const positionScore = sectionTop <= activeZoneTop + 100 ? 1 : Math.max(0, 1 - Math.abs(sectionTop - activeZoneTop) / 200);
                
                // Combined score with bias towards sections that start near the top
                let score = visibilityRatio * 0.7 + positionScore * 0.3;
                
                // Bonus for sections that are well-positioned
                if (sectionTop <= activeZoneTop + 50 && sectionBottom >= activeZoneTop + 200) {
                    score += 0.2;
                }
                
                // Special handling for very large sections (like hero)
                if (sectionHeight > containerHeight * 1.5 && sectionTop <= activeZoneTop) {
                    score += 0.3;
                }
                
                // Special bonus for grouped sections that are well-positioned
                if (section.hasAttribute('data-nav-group') && overlap > 100) {
                    score += 0.2; // Give grouped sections a boost when they're visible
                }
                
                if (score > bestScore) {
                    bestScore = score;
                    activeSection = section;
                    
                    // Determine which navigation group this section belongs to
                    if (section.id) {
                        activeNavGroup = section.id;
                    } else if (section.hasAttribute('data-nav-group')) {
                        activeNavGroup = section.getAttribute('data-nav-group');
                    }
                }
                
                // Debug logging (only for significant score changes)
                if (window.debugNavigation) {
                    const sectionName = section.id || section.className || 'unknown';
                    const navGroup = section.hasAttribute('data-nav-group') ? section.getAttribute('data-nav-group') : (section.id || 'none');
                    console.log(`Section ${sectionName} (group: ${navGroup}): top=${Math.round(sectionTop)}, overlap=${Math.round(overlap)}, score=${score.toFixed(2)}`);
                }
            });
            
            // Update active navigation link only if it's actually changing
            if (activeSection && activeNavGroup) {
                const activeNavLink = document.querySelector(`.nav-menu a[href="#${activeNavGroup}"]`);
                const currentActiveLink = document.querySelector('.nav-menu a.active');
                
                if (activeNavLink && activeNavLink !== currentActiveLink) {
                    if (window.debugNavigation) {
                        const sectionName = activeSection.id || activeSection.className || 'unknown';
                        console.log(`Setting active nav group: ${activeNavGroup} (from section: ${sectionName}, score: ${bestScore.toFixed(2)})`);
                    }
                    this.setActiveNavLink(activeNavLink);
                }
            }
        };
        
        // Throttled scroll handler for better performance
        const throttledUpdate = this.throttle(updateActiveNavigation, 50);
        
        // Attach scroll listener
        if (scrollContainer) {
            scrollContainer.addEventListener('scroll', throttledUpdate, { passive: true });
        }
        window.addEventListener('scroll', throttledUpdate, { passive: true });
        
        // Initial update
        setTimeout(updateActiveNavigation, 100);
        
        // Update on resize
        window.addEventListener('resize', this.debounce(updateActiveNavigation, 150));
    }

    /**
     * Set active navigation link
     */
    setActiveNavLink(activeLink) {
        const navLinks = document.querySelectorAll('.nav-menu a[href^="#"]');
        
        // Remove active class from all links
        navLinks.forEach(link => {
            link.classList.remove('active');
        });
        
        // Add active class to current link
        if (activeLink) {
            activeLink.classList.add('active');
        }
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
        
        console.log('Navigation clicked:', href, 'Target element:', targetElement);
        
        if (targetElement) {
            // Set active state immediately
            this.setActiveNavLink(target);
            
            // Get current header height
            const header = document.querySelector('.header');
            const headerHeight = header ? header.offsetHeight : 80;
            
            // Use content wrapper for scrolling if it exists
            const scrollContainer = document.querySelector('#content-wrapper');
            
            // Calculate target position relative to the scroll container
            let targetPosition;
            if (scrollContainer) {
                // For content wrapper, we need to calculate position relative to the container
                const containerRect = scrollContainer.getBoundingClientRect();
                const elementRect = targetElement.getBoundingClientRect();
                targetPosition = scrollContainer.scrollTop + elementRect.top - containerRect.top - headerHeight - 20;
            } else {
                // For window scroll, use offsetTop
                targetPosition = targetElement.offsetTop - headerHeight - 20;
            }
            
            console.log('Scrolling to position:', targetPosition, 'Header height:', headerHeight);
            
            if (scrollContainer) {
                // Scroll the content wrapper
                scrollContainer.scrollTo({
                    top: Math.max(0, targetPosition),
                    behavior: 'smooth'
                });
            } else {
                // Fallback to window scroll
                window.scrollTo({
                    top: Math.max(0, targetPosition),
                    behavior: 'smooth'
                });
            }

            // Update URL without triggering scroll
            history.pushState(null, null, href);
            
            // Close mobile menu if open
            if (this.mobileMenuManager) {
                this.mobileMenuManager.closeMenu();
            }
        } else {
            console.warn('Target element not found for:', targetId);
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
     * Setup intersection observer for animations with mobile optimization
     */
    setupIntersectionObserver() {
        // Check if Intersection Observer is supported
        if (!('IntersectionObserver' in window)) {
            console.warn('IntersectionObserver not supported, showing all elements');
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

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Immediate animation for better responsiveness
                    entry.target.classList.add('animate-in');
                    observer.unobserve(entry.target);
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
        
        // Set up observer with error handling
        let observedCount = 0;
        animateElements.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                try {
                    observer.observe(el);
                    observedCount++;
                } catch (error) {
                    console.warn(`Failed to observe element ${selector}:`, error);
                    el.classList.add('animate-in');
                }
            });
        });
        
        console.log(`Intersection Observer set up for ${observedCount} elements (mobile: ${isMobile})`);
        
        // Immediate check for visible elements
        setTimeout(() => {
            this.forceCheckVisibleElements(observer, animateElements);
        }, 200);
        
        // Additional checks for mobile
        if (isMobile) {
            window.addEventListener('orientationchange', () => {
                setTimeout(() => {
                    this.forceCheckVisibleElements(observer, animateElements);
                }, 300);
            });
            
            // Extra safety check for mobile
            setTimeout(() => {
                this.forceCheckVisibleElements(observer, animateElements);
            }, 1000);
        }
    }
    
    /**
     * Fallback method to show all animated elements immediately
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
                el.classList.add('animate-in');
            });
        });
    }
    
    /**
     * Force check for visible elements that may have been missed
     */
    forceCheckVisibleElements(observer, animateElements) {
        animateElements.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => {
                if (!el.classList.contains('animate-in')) {
                    const rect = el.getBoundingClientRect();
                    const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
                    
                    if (isVisible) {
                        el.classList.add('animate-in');
                        try {
                            observer.unobserve(el);
                        } catch (error) {
                            // Element may not be observed, ignore error
                        }
                    }
                }
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
     * Handle scroll events with mobile optimization
     */
    handleScroll() {
        // Get scroll position from content wrapper or window
        const scrollContainer = document.querySelector('#content-wrapper');
        const scrollTop = scrollContainer ? scrollContainer.scrollTop : window.pageYOffset;
        const header = document.querySelector('.header');
        
        // Header scroll effects (desktop only)
        if (window.innerWidth >= 768 && header) {
            if (scrollTop > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        } else if (header) {
            header.classList.remove('scrolled');
        }

        // Parallax effect for hero background (desktop only)
        if (window.innerWidth >= 768) {
            const heroBackground = document.querySelector('.hero-bg img');
            if (heroBackground && scrollTop < window.innerHeight) {
                heroBackground.style.transform = `translateY(${scrollTop * 0.3}px)`;
            }
        }
        
        // Enhanced animation checking
        if (!this.scrollCheckTimeout) {
            this.scrollCheckTimeout = setTimeout(() => {
                // Check our custom animations
                this.checkVisibleAnimations();
                
                // Also refresh AOS if available
                if (typeof AOS !== 'undefined') {
                    AOS.refresh();
                }
                
                this.scrollCheckTimeout = null;
            }, window.innerWidth < 768 ? 100 : 50);
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
     * Handle touch start for mobile scroll detection
     */
    handleTouchStart(event) {
        this.touchStartTime = Date.now();
        this.touchStartY = event.touches[0].clientY;
    }

    /**
     * Handle touch end for mobile scroll detection
     */
    handleTouchEnd(event) {
        if (!this.touchStartTime || !this.touchStartY) return;
        
        const touchEndTime = Date.now();
        const touchDuration = touchEndTime - this.touchStartTime;
        const touchEndY = event.changedTouches[0].clientY;
        const touchDistance = Math.abs(touchEndY - this.touchStartY);
        
        // If it was a significant scroll gesture, force check animations
        if (touchDuration < 1000 && touchDistance > 50) {
            setTimeout(() => {
                // Force refresh AOS animations
                if (typeof AOS !== 'undefined') {
                    AOS.refresh();
                }
                
                // Force check our custom animations
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
                
                this.forceCheckVisibleElements(null, animateElements);
            }, 100);
        }
        
        // Reset touch tracking
        this.touchStartTime = null;
        this.touchStartY = null;
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
            } else if ((element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') && key.includes('placeholder')) {
                element.placeholder = translation;
            } else if (element.tagName === 'OPTION') {
                element.textContent = translation;
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
        // Wait for translations to be loaded
        if (!window.translations) {
            // If translations aren't loaded yet, try to initialize them
            if (window.TranslationManager) {
                window.translationManager = new window.TranslationManager();
            }
            // Return the key as fallback
            return key;
        }
        
        if (window.translations[this.currentLanguage]) {
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
     * Diagnostic function for debugging navigation
     */
    diagnoseNavigation(enableDebug = false) {
        console.log('=== Navigation Diagnosis ===');
        
        // Enable/disable debug mode
        window.debugNavigation = enableDebug;
        console.log('Debug navigation logging:', enableDebug ? 'ENABLED' : 'DISABLED');
        
        // Check if sections exist
        const sections = ['home', 'about-us', 'uniqueness', 'reviews', 'contact'];
        sections.forEach(id => {
            const element = document.getElementById(id);
            console.log(`Section ${id}:`, element ? 'Found' : 'NOT FOUND', element);
            if (element) {
                const rect = element.getBoundingClientRect();
                console.log(`  Position: top=${Math.round(rect.top)}, height=${Math.round(rect.height)}`);
            }
        });
        
        // Check grouped sections
        console.log('\nGrouped sections:');
        const groupedSections = document.querySelectorAll('[data-nav-group]');
        const groupsByNav = {};
        
        groupedSections.forEach(section => {
            const navGroup = section.getAttribute('data-nav-group');
            const className = section.className.split(' ')[0];
            const rect = section.getBoundingClientRect();
            
            if (!groupsByNav[navGroup]) {
                groupsByNav[navGroup] = [];
            }
            groupsByNav[navGroup].push({
                className,
                top: Math.round(rect.top),
                height: Math.round(rect.height)
            });
        });
        
        Object.entries(groupsByNav).forEach(([navGroup, sections]) => {
            console.log(`  Navigation group "${navGroup}":`);
            sections.forEach(section => {
                console.log(`    - ${section.className}: top=${section.top}, height=${section.height}`);
            });
        });
        
        // Check navigation links
        const navLinks = document.querySelectorAll('.nav-menu a[href^="#"]');
        console.log('Navigation links found:', navLinks.length);
        navLinks.forEach(link => {
            const isActive = link.classList.contains('active');
            console.log(`Nav link: ${link.getAttribute('href')} -> ${link.textContent.trim()} ${isActive ? '(ACTIVE)' : ''}`);
        });
        
        // Check scroll container
        const scrollContainer = document.querySelector('#content-wrapper');
        console.log('Scroll container:', scrollContainer ? 'Found' : 'NOT FOUND');
        if (scrollContainer) {
            console.log(`  Scroll position: ${scrollContainer.scrollTop}`);
            console.log(`  Container height: ${scrollContainer.clientHeight}`);
        }
        
        // Check current scroll position
        const currentScroll = scrollContainer ? scrollContainer.scrollTop : window.pageYOffset;
        console.log('Current scroll position:', currentScroll);
        
        // Check if event listeners are attached
        console.log('LandingPageManager instance:', this);
        console.log('Mobile menu manager:', window.mobileMenuManager);
        
        console.log('=== End Diagnosis ===');
        
        if (enableDebug) {
            console.log('Navigation debug mode enabled. Scroll to see detailed logs.');
            console.log('To disable: diagnoseNavigation(false)');
        }
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
                const navLink = document.querySelector(`.nav-menu a[href="${hash}"]`);
                
                if (target) {
                    // Set active state
                    if (navLink) {
                        this.setActiveNavLink(navLink);
                    }
                    
                    const header = document.querySelector('.header');
                    const headerHeight = header ? header.offsetHeight : 80;
                    const scrollContainer = document.querySelector('#content-wrapper');
                    
                    // Calculate target position relative to the scroll container
                    let targetPosition;
                    if (scrollContainer) {
                        const containerRect = scrollContainer.getBoundingClientRect();
                        const elementRect = target.getBoundingClientRect();
                        targetPosition = scrollContainer.scrollTop + elementRect.top - containerRect.top - headerHeight - 20;
                        
                        scrollContainer.scrollTo({
                            top: Math.max(0, targetPosition),
                            behavior: 'smooth'
                        });
                    } else {
                        targetPosition = target.offsetTop - headerHeight - 20;
                        
                        window.scrollTo({
                            top: Math.max(0, targetPosition),
                            behavior: 'smooth'
                        });
                    }
                }
            }, 100);
        } else {
            // Set first nav link as active by default
            const firstNavLink = document.querySelector('.nav-menu a[href^="#"]');
            if (firstNavLink) {
                this.setActiveNavLink(firstNavLink);
            }
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

    /**
     * Setup parallax scrolling effect for hero section
     */
    setupParallax() {
        const heroBg = document.querySelector('.hero-bg');
        const heroSection = document.querySelector('.hero-section');
        
        if (!heroBg || !heroSection) {
            console.log('Hero elements not found');
            return;
        }
        
        const updateParallax = () => {
            const scrollTop = window.pageYOffset;
            const windowHeight = window.innerHeight;
            const heroHeight = heroSection.offsetHeight;
            
            // Only apply parallax when hero section is in view
            if (scrollTop < heroHeight + windowHeight) {
                const parallaxSpeed = 0.5;
                const yPos = scrollTop * parallaxSpeed;
                
                // Apply transform
                heroBg.style.transform = `translate3d(0, ${yPos}px, 0)`;
            }
        };
        
        // Throttled scroll handler
        let ticking = false;
        const handleScroll = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    updateParallax();
                    ticking = false;
                });
                ticking = true;
            }
        };
        
        // Initialize
        updateParallax();
        
        // Add event listeners
        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('resize', updateParallax, { passive: true });
        
        console.log('Clean parallax initialized successfully');
    }
    
    /**
     * Initialize AOS (Animate On Scroll) library with custom scroll container
     */
    initializeAOS() {
        // Check if AOS is available
        if (typeof AOS === 'undefined') {
            console.warn('AOS library not loaded');
            this.setupFallbackAnimations();
            return;
        }
        
        // Get the custom scroll container
        const scrollContainer = document.getElementById('content-wrapper');
        const isMobile = window.innerWidth < 768;
        
        // AOS doesn't natively support custom scroll containers well,
        // so we'll use a hybrid approach
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
        
        // Setup custom scroll handling for AOS
        if (scrollContainer) {
            // Custom scroll handler for AOS
            const handleCustomScroll = this.throttle(() => {
                // Manually trigger AOS refresh
                AOS.refresh();
                
                // Also check our custom animations
                this.checkVisibleAnimations();
            }, 16);
            
            scrollContainer.addEventListener('scroll', handleCustomScroll, { passive: true });
            console.log('AOS initialized with custom scroll container');
        } else {
            console.log('AOS initialized with window scroll (fallback)');
        }
        
        // Setup immediate animation check
        this.setupImmediateAnimationCheck();
        
        // Force refresh on resize
        window.addEventListener('resize', this.debounce(() => {
            AOS.refresh();
            this.checkVisibleAnimations();
        }, 300));
        
        // Force initial refresh
        setTimeout(() => {
            AOS.refresh();
            this.checkVisibleAnimations();
        }, 100);
    }
    
    /**
     * Setup fallback animations if AOS fails
     */
    setupFallbackAnimations() {
        console.log('Setting up fallback animations');
        
        // Show all AOS elements immediately
        const aosElements = document.querySelectorAll('[data-aos]');
        aosElements.forEach(element => {
            element.style.opacity = '1';
            element.style.transform = 'none';
            element.classList.add('aos-animate');
        });
        
        // Also trigger our custom animation system
        this.setupImmediateAnimationCheck();
    }
    
    /**
     * Setup immediate animation check for visible elements
     */
    setupImmediateAnimationCheck() {
        // Check animations immediately for visible elements
        setTimeout(() => {
            this.checkVisibleAnimations();
        }, 50);
        
        // Setup periodic checks to catch any missed animations
        const checkInterval = setInterval(() => {
            this.checkVisibleAnimations();
        }, 500);
        
        // Stop checking after 10 seconds
        setTimeout(() => {
            clearInterval(checkInterval);
        }, 10000);
    }
    
    /**
     * Check and animate visible elements
     */
    checkVisibleAnimations() {
        // Get scroll container or fallback to window
        const scrollContainer = document.getElementById('content-wrapper');
        const scrollTop = scrollContainer ? scrollContainer.scrollTop : window.pageYOffset;
        const containerHeight = scrollContainer ? scrollContainer.clientHeight : window.innerHeight;
        
        // Check AOS elements
        const aosElements = document.querySelectorAll('[data-aos]:not(.aos-animate)');
        aosElements.forEach(element => {
            const rect = element.getBoundingClientRect();
            const elementTop = scrollContainer ? 
                rect.top + scrollTop : 
                rect.top + window.pageYOffset;
            
            // Check if element is in viewport
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
                    element.classList.add('animate-in');
                }
            });
        });
    }
}

// Initialize the landing page manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.landingPageManager = new LandingPageManager();
    console.log('LandingPageManager initialized and exposed globally');
    
    // Expose diagnostic function for debugging
    window.diagnoseNavigation = (enableDebug = false) => {
        if (window.landingPageManager) {
            window.landingPageManager.diagnoseNavigation(enableDebug);
        } else {
            console.error('LandingPageManager not found');
        }
    };
    
    console.log('Navigation diagnostic available via: diagnoseNavigation() or diagnoseNavigation(true) for debug mode');
});

// WordPress integration
if (typeof jQuery !== 'undefined') {
    jQuery(document).ready(() => {
        // WordPress specific initialization
        console.log('WordPress integration loaded');
    });
}