/**
 * NavigationManager - Handles navigation, scrolling, and active states
 */

class NavigationManager {
    constructor(eventManager) {
        this.eventManager = eventManager;
        this.mobileMenuManager = null;
        this.scrollCheckTimeout = null;
        this.init();
    }

    /**
     * Initialize navigation functionality
     */
    init() {
        this.setupNavigation();
        this.setupSmoothScrolling();
        this.setupMobileMenuIntegration();
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
        
        // Bind navigation events
        this.bindNavigationEvents();
    }

    /**
     * Bind navigation-related events
     */
    bindNavigationEvents() {
        // Navigation clicks
        document.querySelectorAll('a[href^="#"]').forEach(link => {
            link.addEventListener('click', this.handleAnchorClick.bind(this));
        });

        // Listen for scroll events
        this.eventManager.on('scroll', this.handleNavigationScroll.bind(this));
        
        // Listen for resize events
        this.eventManager.on('resize', this.handleNavigationResize.bind(this));
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
        
        // Store navigation update function for scroll handler
        this.updateActiveNavigation = () => {
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
        this.eventManager.on('menuOpened', this.handleMobileMenuOpened.bind(this));
        this.eventManager.on('menuClosed', this.handleMobileMenuClosed.bind(this));
    }

    /**
     * Handle mobile menu opened event
     */
    handleMobileMenuOpened(event) {

    }

    /**
     * Handle mobile menu closed event
     */
    handleMobileMenuClosed(event) {

    }

    /**
     * Handle scroll events for navigation
     */
    handleNavigationScroll() {
        // Enhanced animation checking
        if (!this.scrollCheckTimeout) {
            this.scrollCheckTimeout = setTimeout(() => {
                // Update navigation based on scroll
                if (this.updateActiveNavigation) {
                    this.updateActiveNavigation();
                }
                
                this.scrollCheckTimeout = null;
            }, window.innerWidth < 768 ? 100 : 50);
        }
    }

    /**
     * Handle resize events for navigation
     */
    handleNavigationResize() {
        // Update navigation on resize
        if (this.updateActiveNavigation) {
            setTimeout(this.updateActiveNavigation, 150);
        }
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
     * Load smooth scroll polyfill
     */
    loadSmoothScrollPolyfill() {
        const script = document.createElement('script');
        script.src = 'https://polyfill.io/v3/polyfill.min.js?features=smoothscroll';
        document.head.appendChild(script);
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
        
        console.log('=== End Diagnosis ===');
        
        if (enableDebug) {
            console.log('Navigation debug mode enabled. Scroll to see detailed logs.');
            console.log('To disable: diagnoseNavigation(false)');
        }
    }
}

// Export for module systems or assign to window
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NavigationManager;
} else {
    window.NavigationManager = NavigationManager;
} 