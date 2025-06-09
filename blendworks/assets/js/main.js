/**
 * BlendWorks Main Application - GitHub Pages Version
 * Core functionality and application initialization
 */

class BlendWorksApp {
    constructor() {
        this.version = '1.0.0';
        this.environment = window.location.hostname === 'localhost' ? 'development' : 'production';
        this.initialized = false;
        this.modules = {};
        this.currentUser = null;
        this.features = {
            analytics: true,
            leadCapture: true,
            payments: true,
            multiLanguage: true,
            geoAds: true
        };
    }

    async init() {
        console.log(`🚀 BlendWorks v${this.version} starting...`);
        
        try {
            // Show loading indicator
            this.showLoadingScreen();
            
            // Initialize core systems in order
            await this.initializeCoreModules();
            await this.loadExternalServices();
            await this.setupGlobalEventListeners();
            await this.initializePageSpecificFeatures();
            
            // Hide loading and show content
            this.hideLoadingScreen();
            
            this.initialized = true;
            console.log('✅ BlendWorks initialized successfully');
            
            // Track initialization
            this.trackInitialization();
            
        } catch (error) {
            console.error('❌ BlendWorks initialization failed:', error);
            this.handleInitializationError(error);
        }
    }

    async initializeCoreModules() {
        console.log('📦 Loading core modules...');
        
        // Initialize in order of dependency
        const moduleInitOrder = [
            'utils',
            'i18n', 
            'analytics',
            'geoAds',
            'leadSystem',
            'payments'
        ];
        
        for (const moduleName of moduleInitOrder) {
            try {
                await this.initializeModule(moduleName);
            } catch (error) {
                console.warn(`⚠️ Module ${moduleName} failed to initialize:`, error);
                // Continue with other modules
            }
        }
    }

    async initializeModule(moduleName) {
        const moduleMap = {
            'utils': () => window.utils,
            'i18n': () => window.i18n?.init(),
            'analytics': () => window.analytics?.init(),
            'geoAds': () => window.geoAds?.init(),
            'leadSystem': () => window.leadSystem?.init(),
            'payments': () => window.payments?.init()
        };
        
        const initializer = moduleMap[moduleName];
        if (initializer) {
            const result = await initializer();
            this.modules[moduleName] = result || true;
            console.log(`✅ ${moduleName} initialized`);
        }
    }

    async loadExternalServices() {
        console.log('🌐 Loading external services...');
        
        const services = [];
        
        // Load Supabase if not already loaded
        if (!window.supabase) {
            services.push(this.loadSupabase());
        }
        
        // Load Stripe if not already loaded
        if (!window.Stripe) {
            services.push(this.loadStripe());
        }
        
        // Load other external libraries as needed
        services.push(this.loadOptionalServices());
        
        await Promise.allSettled(services);
    }

    async loadSupabase() {
        try {
            if (typeof supabase === 'undefined') {
                await window.utils.loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');
            }
            
            // Initialize Supabase client
            const supabaseUrl = 'https://your-project.supabase.co';
            const supabaseAnonKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...'; // Your anon key
            
            window.supabase = supabase.createClient(supabaseUrl, supabaseAnonKey);
            console.log('🗄️ Supabase loaded');
            
        } catch (error) {
            console.warn('⚠️ Supabase loading failed:', error);
        }
    }

    async loadStripe() {
        try {
            if (typeof Stripe === 'undefined') {
                await window.utils.loadScript('https://js.stripe.com/v3/');
            }
            console.log('💳 Stripe loaded');
        } catch (error) {
            console.warn('⚠️ Stripe loading failed:', error);
        }
    }

    async loadOptionalServices() {
        const optionalServices = [];
        
        // Load Google Analytics if configured
        if (this.shouldLoadGoogleAnalytics()) {
            optionalServices.push(this.loadGoogleAnalytics());
        }
        
        // Load other optional services
        await Promise.allSettled(optionalServices);
    }

    shouldLoadGoogleAnalytics() {
        return this.environment === 'production' && 
               !window.location.search.includes('notrack') &&
               !localStorage.getItem('blendworks_opt_out_analytics');
    }

    async loadGoogleAnalytics() {
        try {
            const gaId = 'G-XXXXXXXXXX'; // Your GA4 ID
            
            // Load gtag
            await window.utils.loadScript(`https://www.googletagmanager.com/gtag/js?id=${gaId}`, true);
            
            // Initialize gtag
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', gaId, {
                anonymize_ip: true,
                respect_privacy: true
            });
            
            console.log('📊 Google Analytics loaded');
            
        } catch (error) {
            console.warn('⚠️ Google Analytics loading failed:', error);
        }
    }

    setupGlobalEventListeners() {
        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.handlePageHidden();
            } else {
                this.handlePageVisible();
            }
        });
        
        // Handle online/offline status
        window.addEventListener('online', () => {
            this.handleOnlineStatus(true);
        });
        
        window.addEventListener('offline', () => {
            this.handleOnlineStatus(false);
        });
        
        // Handle window resize
        window.addEventListener('resize', window.utils.debounce(() => {
            this.handleWindowResize();
        }, 250));
        
        // Handle page errors
        window.addEventListener('error', (e) => {
            this.handleGlobalError(e.error, 'global_error');
        });
        
        window.addEventListener('unhandledrejection', (e) => {
            this.handleGlobalError(e.reason, 'unhandled_promise');
        });
        
        // Handle keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
        
        console.log('🎧 Global event listeners setup');
    }

    async initializePageSpecificFeatures() {
        const currentPage = this.getCurrentPage();
        console.log(`📄 Initializing features for: ${currentPage}`);
        
        switch (currentPage) {
            case 'homepage':
                await this.initializeHomepage();
                break;
            case 'app':
                await this.initializeAppPage();
                break;
            case 'pricing':
                await this.initializePricingPage();
                break;
            case 'admin':
                await this.initializeAdminPage();
                break;
            default:
                await this.initializeGenericPage();
        }
    }

    getCurrentPage() {
        const path = window.location.pathname;
        
        if (path === '/' || path === '/index.html') return 'homepage';
        if (path.includes('app.html')) return 'app';
        if (path.includes('pricing.html')) return 'pricing';
        if (path.includes('admin.html')) return 'admin';
        if (path.includes('auth.html')) return 'auth';
        if (path.includes('success.html')) return 'success';
        if (path.includes('affiliate.html')) return 'affiliate';
        
        return 'generic';
    }

    async initializeHomepage() {
        // Homepage specific features
        this.setupVideoDemo();
        this.setupScrollAnimations();
        this.setupHeroInteractions();
        this.setupTestimonialSlider();
        
        console.log('🏠 Homepage features initialized');
    }

    async initializeAppPage() {
        // Load generator module
        if (!window.generator) {
            await this.loadGeneratorModule();
        }
        
        // Initialize generator UI
        if (window.generator) {
            await window.generator.init();
        }
        
        console.log('⚙️ App page features initialized');
    }

    async initializePricingPage() {
        // Pricing page specific features
        this.setupPricingToggles();
        this.setupPricingAnimations();
        this.setupComparisonTable();
        
        console.log('💰 Pricing page features initialized');
    }

    async initializeAdminPage() {
        // Admin authentication check
        if (!this.isUserAuthenticated()) {
            window.location.href = 'auth.html?redirect=admin.html';
            return;
        }
        
        // Load admin modules
        await this.loadAdminModules();
        
        console.log('👑 Admin page features initialized');
    }

    async initializeGenericPage() {
        // Generic page features
        this.setupGenericInteractions();
        console.log('📄 Generic page features initialized');
    }

    async loadGeneratorModule() {
        try {
            await window.utils.loadScript('assets/js/generator.js');
            console.log('🔧 Generator module loaded');
        } catch (error) {
            console.error('❌ Generator module loading failed:', error);
        }
    }

    async loadAdminModules() {
        try {
            const adminModules = [
                'assets/js/admin-dashboard.js',
                'assets/js/admin-analytics.js',
                'assets/js/admin-users.js'
            ];
            
            await Promise.all(
                adminModules.map(module => window.utils.loadScript(module))
            );
            
            console.log('👑 Admin modules loaded');
        } catch (error) {
            console.error('❌ Admin modules loading failed:', error);
        }
    }

    // ===== UI INTERACTIONS =====
    
    setupVideoDemo() {
        const videoDemoButton = document.querySelector('[onclick="openVideoDemo()"]');
        if (videoDemoButton) {
            videoDemoButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.openVideoDemo();
            });
        }
    }

    openVideoDemo() {
        const modal = document.getElementById('videoModal') || this.createVideoModal();
        const iframe = modal.querySelector('#demoVideo');
        
        // Set video source
        iframe.src = 'https://www.youtube.com/embed/YOUR_VIDEO_ID?autoplay=1';
        modal.style.display = 'flex';
        
        // Track video demo view
        if (window.analytics) {
            window.analytics.trackEvent('video_demo_opened', {
                source: 'homepage',
                timestamp: Date.now()
            });
        }
    }

    createVideoModal() {
        const modal = window.utils.createElement('div', {
            id: 'videoModal',
            className: 'video-modal',
            innerHTML: `
                <div class="modal-overlay" onclick="closeVideoDemo()"></div>
                <div class="modal-content">
                    <button class="close-btn" onclick="closeVideoDemo()">×</button>
                    <div class="video-container">
                        <iframe id="demoVideo" width="800" height="450" frameborder="0" allowfullscreen></iframe>
                    </div>
                </div>
            `
        });
        
        document.body.appendChild(modal);
        return modal;
    }

    setupScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, observerOptions);
        
        // Observe all elements with animation classes
        document.querySelectorAll('.fade-in-up, .fade-in-left, .fade-in-right').forEach(el => {
            observer.observe(el);
        });
    }

    setupHeroInteractions() {
        // Floating background elements animation
        const floatingElements = document.querySelectorAll('.floating-elements .element');
        
        floatingElements.forEach((element, index) => {
            // Add random movement
            setInterval(() => {
                const x = Math.sin(Date.now() / 1000 + index) * 20;
                const y = Math.cos(Date.now() / 1500 + index) * 15;
                element.style.transform = `translate(${x}px, ${y}px) rotate(${x}deg)`;
            }, 100);
        });
    }

    setupTestimonialSlider() {
        const testimonials = document.querySelectorAll('.testimonial-card');
        if (testimonials.length <= 1) return;
        
        let currentTestimonial = 0;
        
        setInterval(() => {
            testimonials[currentTestimonial].classList.remove('active');
            currentTestimonial = (currentTestimonial + 1) % testimonials.length;
            testimonials[currentTestimonial].classList.add('active');
        }, 5000);
    }

    setupPricingToggles() {
        // Currency toggle
        const currencyToggle = document.querySelector('.currency-toggle');
        if (currencyToggle) {
            currencyToggle.addEventListener('change', (e) => {
                this.switchCurrency(e.target.value);
            });
        }
        
        // Plan comparison toggle
        const comparisonToggle = document.querySelector('.comparison-toggle');
        if (comparisonToggle) {
            comparisonToggle.addEventListener('click', () => {
                this.togglePricingComparison();
            });
        }
    }

    setupPricingAnimations() {
        // Animate pricing cards on scroll
        const pricingCards = document.querySelectorAll('.pricing-card');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.classList.add('animate-in');
                    }, index * 150);
                }
            });
        });
        
        pricingCards.forEach(card => observer.observe(card));
    }

    setupComparisonTable() {
        const table = document.querySelector('.comparison-table');
        if (!table) return;
        
        // Add sticky header behavior
        const header = table.querySelector('thead');
        if (header) {
            const observer = new IntersectionObserver(
                ([entry]) => {
                    header.classList.toggle('sticky', !entry.isIntersecting);
                },
                { threshold: 1 }
            );
            
            observer.observe(table);
        }
    }

    setupGenericInteractions() {
        // Setup common interactions for all pages
        this.setupLanguageSelector();
        this.setupMobileNavigation();
        this.setupTooltips();
    }

    setupLanguageSelector() {
        // Already handled in i18n.js, but we can add page-specific enhancements
        const languageSelector = document.querySelector('.language-selector');
        if (languageSelector) {
            languageSelector.addEventListener('mouseenter', () => {
                // Preload language files on hover
                this.preloadLanguageFiles();
            });
        }
    }

    setupMobileNavigation() {
        // Mobile menu toggle
        const mobileMenuButton = document.querySelector('.mobile-menu-btn');
        const mobileNav = document.querySelector('.mobile-nav');
        
        if (mobileMenuButton && mobileNav) {
            mobileMenuButton.addEventListener('click', () => {
                mobileNav.classList.toggle('active');
                mobileMenuButton.classList.toggle('active');
            });
            
            // Close mobile menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!mobileMenuButton.contains(e.target) && !mobileNav.contains(e.target)) {
                    mobileNav.classList.remove('active');
                    mobileMenuButton.classList.remove('active');
                }
            });
        }
    }

    setupTooltips() {
        // Simple tooltip system
        document.querySelectorAll('[data-tooltip]').forEach(element => {
            element.addEventListener('mouseenter', (e) => {
                this.showTooltip(e.target, e.target.dataset.tooltip);
            });
            
            element.addEventListener('mouseleave', () => {
                this.hideTooltip();
            });
        });
    }

    // ===== EVENT HANDLERS =====
    
    handlePageHidden() {
        console.log('👁️ Page hidden');
        // Pause animations, reduce activity
        if (window.analytics) {
            window.analytics.trackEvent('page_hidden', {
                timestamp: Date.now()
            });
        }
    }

    handlePageVisible() {
        console.log('👁️ Page visible');
        // Resume animations, sync data
        if (window.analytics) {
            window.analytics.trackEvent('page_visible', {
                timestamp: Date.now()
            });
        }
    }

    handleOnlineStatus(online) {
        console.log(`🌐 Connection status: ${online ? 'online' : 'offline'}`);
        
        if (online) {
            // Sync pending data
            this.syncPendingData();
            window.utils.showToast('Connection restored', 'success');
        } else {
            window.utils.showToast('You are offline', 'warning');
        }
    }

    handleWindowResize() {
        // Update mobile/desktop specific features
        const isMobile = window.utils.isMobile();
        document.body.classList.toggle('mobile', isMobile);
        document.body.classList.toggle('desktop', !isMobile);
        
        // Recalculate layouts if needed
        this.recalculateLayouts();
    }

    handleGlobalError(error, context) {
        console.error(`❌ Global error (${context}):`, error);
        
        // Track error
        if (window.analytics) {
            window.analytics.trackEvent('global_error', {
                context,
                message: error.message || 'Unknown error',
                stack: error.stack,
                url: window.location.href
            });
        }
        
        // Show user notification for critical errors
        if (this.isCriticalError(error)) {
            window.utils.showToast(
                'Something went wrong. Please refresh the page if problems persist.',
                'error',
                6000
            );
        }
    }

    handleKeyboardShortcuts(e) {
        // Global keyboard shortcuts
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'k':
                    e.preventDefault();
                    this.openSearch();
                    break;
                case '/':
                    e.preventDefault();
                    this.openHelp();
                    break;
            }
        }
        
        // Escape key handlers
        if (e.key === 'Escape') {
            this.closeModals();
        }
    }

    // ===== UTILITY METHODS =====
    
    showLoadingScreen() {
        const existingLoader = document.querySelector('.app-loader');
        if (existingLoader) return;
        
        const loader = window.utils.createElement('div', {
            className: 'app-loader',
            innerHTML: `
                <div class="loader-content">
                    <div class="loader-logo">
                        <i class="fas fa-cogs"></i>
                        <span>BlendWorks</span>
                    </div>
                    <div class="loader-spinner"></div>
                    <div class="loader-text">Loading amazing combinations...</div>
                </div>
            `
        });
        
        // Add loader styles
        window.utils.addCSS(`
            .app-loader {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(135deg, var(--primary), var(--primary-light));
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                color: white;
            }
            .loader-content {
                text-align: center;
            }
            .loader-logo {
                font-size: 2rem;
                font-weight: bold;
                margin-bottom: 2rem;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.5rem;
            }
            .loader-spinner {
                width: 40px;
                height: 40px;
                border: 3px solid rgba(255,255,255,0.3);
                border-top: 3px solid white;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto 1rem;
            }
            .loader-text {
                opacity: 0.8;
                font-size: 0.9rem;
            }
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        `);
        
        document.body.appendChild(loader);
    }

    hideLoadingScreen() {
        const loader = document.querySelector('.app-loader');
        if (loader) {
            window.utils.fadeOut(loader, 500);
            setTimeout(() => {
                if (loader.parentNode) {
                    loader.remove();
                }
            }, 500);
        }
    }

    handleInitializationError(error) {
        this.hideLoadingScreen();
        
        // Show critical error message
        const errorScreen = window.utils.createElement('div', {
            className: 'error-screen',
            innerHTML: `
                <div class="error-content">
                    <h1>🚫 Oops! Something went wrong</h1>
                    <p>BlendWorks failed to load properly. This might be due to:</p>
                    <ul>
                        <li>Poor internet connection</li>
                        <li>Ad blocker interference</li>
                        <li>Browser compatibility issues</li>
                    </ul>
                    <div class="error-actions">
                        <button class="btn btn-primary" onclick="window.location.reload()">
                            🔄 Try Again
                        </button>
                        <button class="btn btn-outline" onclick="window.app.contactSupport()">
                            💬 Contact Support
                        </button>
                    </div>
                    <details class="error-details">
                        <summary>Technical Details</summary>
                        <pre>${error.message}</pre>
                    </details>
                </div>
            `
        });
        
        document.body.appendChild(errorScreen);
    }

    async syncPendingData() {
        // Sync any data that was stored offline
        try {
            if (window.leadSystem) {
                await window.leadSystem.retryStoredLeads();
            }
            
            if (window.analytics) {
                await window.analytics.retryStoredEvents();
            }
        } catch (error) {
            console.warn('Data sync failed:', error);
        }
    }

    recalculateLayouts() {
        // Trigger layout recalculations for responsive components
        window.dispatchEvent(new Event('resize-complete'));
    }

    isCriticalError(error) {
        const criticalPatterns = [
            'ChunkLoadError',
            'Loading chunk',
            'Network request failed',
            'Script error'
        ];
        
        const message = error.message || '';
        return criticalPatterns.some(pattern => message.includes(pattern));
    }

    isUserAuthenticated() {
        return localStorage.getItem('blendworks_auth_token') !== null;
    }

    openSearch() {
        console.log('🔍 Opening search...');
        // Implement search functionality
    }

    openHelp() {
        console.log('❓ Opening help...');
        // Implement help functionality
    }

    closeModals() {
        document.querySelectorAll('.modal, .popup').forEach(modal => {
            modal.style.display = 'none';
        });
    }

    switchCurrency(currency) {
        if (window.payments) {
            window.payments.switchCurrency(currency);
        }
    }

    togglePricingComparison() {
        const comparisonTable = document.querySelector('.comparison-table');
        if (comparisonTable) {
            comparisonTable.classList.toggle('visible');
        }
    }

    showTooltip(element, text) {
        // Implementation for tooltip system
        console.log(`💡 Tooltip: ${text}`);
    }

    hideTooltip() {
        // Hide tooltip implementation
    }

    preloadLanguageFiles() {
        // Preload language files for faster switching
        if (window.i18n) {
            window.i18n.preloadLanguages();
        }
    }

    trackInitialization() {
        if (window.analytics) {
            window.analytics.trackEvent('app_initialized', {
                version: this.version,
                environment: this.environment,
                page: this.getCurrentPage(),
                features: this.features,
                loadTime: Date.now() - (window.performance?.timing?.navigationStart || 0)
            });
        }
    }

    contactSupport() {
        // Open support contact
        window.open('mailto:support@blendworks.com?subject=Technical Issue', '_blank');
    }

    // Public API
    getVersion() {
        return this.version;
    }

    isInitialized() {
        return this.initialized;
    }

    getModules() {
        return this.modules;
    }
}

// Global functions for HTML onclick handlers
function openVideoDemo() {
    if (window.app) {
        window.app.openVideoDemo();
    }
}

function closeVideoDemo() {
    const modal = document.getElementById('videoModal');
    if (modal) {
        modal.style.display = 'none';
        const iframe = modal.querySelector('#demoVideo');
        if (iframe) {
            iframe.src = '';
        }
    }
}

function toggleMobileMenu() {
    if (window.app) {
        window.app.setupMobileNavigation();
    }
}

// Initialize BlendWorks App
window.app = new BlendWorksApp();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.app.init();
    });
} else {
    window.app.init();
}

// Global error handler
window.addEventListener('error', (e) => {
    if (window.app) {
        window.app.handleGlobalError(e.error, 'window_error');
    }
});