/**
 * BlendWorks Private Analytics System
 * Complete behavioral tracking with privacy focus
 */

class BlendWorksAnalytics {
    constructor() {
        this.apiEndpoint = '/api/analytics/track';
        this.sessionId = this.generateSessionId();
        this.userId = null;
        this.userCountry = null;
        this.userCity = null;
        this.userTimezone = null;
        this.startTime = Date.now();
        this.events = [];
        this.batchSize = 10;
        this.flushInterval = 30000; // 30 seconds
        this.isOnline = navigator.onLine;
        
        // Performance tracking
        this.pageLoadTime = null;
        this.firstContentfulPaint = null;
        this.largestContentfulPaint = null;
    }

    async init() {
        console.log('📊 Initializing Analytics System...');
        
        try {
            await this.detectUserLocation();
            this.setupPerformanceTracking();
            this.setupEventListeners();
            this.setupBatchFlush();
            this.trackPageView();
            
            console.log('✅ Analytics System initialized');
        } catch (error) {
            console.error('❌ Analytics initialization failed:', error);
        }
    }

    async detectUserLocation() {
        try {
            const response = await fetch('https://ipapi.co/json/');
            const data = await response.json();
            
            this.userCountry = data.country_code;
            this.userCity = data.city;
            this.userTimezone = data.timezone;
            
            // Update document attributes for geo-targeted features
            document.documentElement.setAttribute('data-country', this.userCountry);
            document.documentElement.setAttribute('data-timezone', this.userTimezone);
            
            console.log(`📍 Location detected: ${this.userCity}, ${this.userCountry}`);
            
        } catch (error) {
            console.warn('⚠️ Location detection failed:', error);
            this.userCountry = 'Unknown';
            this.userCity = 'Unknown';
            this.userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        }
    }

    setupPerformanceTracking() {
        // Track page load performance
        window.addEventListener('load', () => {
            const perfData = performance.timing;
            this.pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
            
            this.trackEvent('page_performance', {
                load_time: this.pageLoadTime,
                dom_ready: perfData.domContentLoadedEventEnd - perfData.navigationStart,
                first_byte: perfData.responseStart - perfData.navigationStart
            });
        });

        // Track Web Vitals if available
        if ('PerformanceObserver' in window) {
            this.trackWebVitals();
        }
    }

    trackWebVitals() {
        // First Contentful Paint
        new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (entry.name === 'first-contentful-paint') {
                    this.firstContentfulPaint = entry.startTime;
                    this.trackEvent('web_vitals', {
                        metric: 'FCP',
                        value: entry.startTime
                    });
                }
            }
        }).observe({ entryTypes: ['paint'] });

        // Largest Contentful Paint
        new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            this.largestContentfulPaint = lastEntry.startTime;
            
            this.trackEvent('web_vitals', {
                metric: 'LCP',
                value: lastEntry.startTime
            });
        }).observe({ entryTypes: ['largest-contentful-paint'] });

        // Cumulative Layout Shift
        new PerformanceObserver((list) => {
            let clsValue = 0;
            for (const entry of list.getEntries()) {
                if (!entry.hadRecentInput) {
                    clsValue += entry.value;
                }
            }
            
            this.trackEvent('web_vitals', {
                metric: 'CLS',
                value: clsValue
            });
        }).observe({ entryTypes: ['layout-shift'] });
    }

    setupEventListeners() {
        // Click tracking
        document.addEventListener('click', (e) => {
            this.trackClick(e);
        });

        // Form interactions
        document.addEventListener('submit', (e) => {
            this.trackFormSubmit(e);
        });

        // Scroll depth tracking
        this.setupScrollTracking();

        // Page visibility changes
        document.addEventListener('visibilitychange', () => {
            this.trackEvent('page_visibility', {
                state: document.visibilityState,
                time_on_page: Date.now() - this.startTime
            });
        });

        // Beforeunload (page exit)
        window.addEventListener('beforeunload', () => {
            this.trackPageExit();
        });

        // Online/offline status
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.flushEventsBatch(); // Flush any queued events
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
        });

        // Error tracking
        window.addEventListener('error', (e) => {
            this.trackError(e);
        });

        // Unhandled promise rejections
        window.addEventListener('unhandledrejection', (e) => {
            this.trackError(e, 'promise_rejection');
        });
    }

    setupScrollTracking() {
        let maxScroll = 0;
        let scrollTimer = null;
        const scrollMilestones = [25, 50, 75, 90];
        const triggeredMilestones = new Set();

        window.addEventListener('scroll', () => {
            const scrollPercent = Math.round(
                (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
            );

            if (scrollPercent > maxScroll) {
                maxScroll = scrollPercent;
            }

            // Track scroll milestones
            scrollMilestones.forEach(milestone => {
                if (scrollPercent >= milestone && !triggeredMilestones.has(milestone)) {
                    triggeredMilestones.add(milestone);
                    this.trackEvent('scroll_depth', {
                        percentage: milestone,
                        time_to_scroll: Date.now() - this.startTime
                    });
                }
            });

            // Debounced scroll end tracking
            clearTimeout(scrollTimer);
            scrollTimer = setTimeout(() => {
                this.trackEvent('scroll_end', {
                    max_scroll: maxScroll,
                    final_position: scrollPercent
                });
            }, 1000);
        });
    }

    setupBatchFlush() {
        // Flush events periodically
        setInterval(() => {
            this.flushEventsBatch();
        }, this.flushInterval);

        // Flush on page unload
        window.addEventListener('beforeunload', () => {
            this.flushEventsBatch(true); // Synchronous flush
        });
    }

    // Event tracking methods
    trackEvent(eventType, data = {}) {
        const event = {
            session_id: this.sessionId,
            user_id: this.userId,
            event_type: eventType,
            timestamp: new Date().toISOString(),
            
            // Page context
            page: window.location.pathname,
            page_title: document.title,
            referrer: document.referrer,
            
            // User context
            country: this.userCountry,
            city: this.userCity,
            timezone: this.userTimezone,
            
            // Device context
            user_agent: navigator.userAgent,
            language: navigator.language,
            screen_resolution: `${screen.width}x${screen.height}`,
            window_size: `${window.innerWidth}x${window.innerHeight}`,
            
            // Connection info
            connection_type: this.getConnectionType(),
            
            // Custom event data
            event_data: data,
            
            // Privacy hash
            ip_hash: this.getPrivacyHash()
        };

        // Add to batch
        this.events.push(event);

        // Console log for debugging (remove in production)
        console.log(`📊 Event tracked: ${eventType}`, data);

        // Flush if batch is full
        if (this.events.length >= this.batchSize) {
            this.flushEventsBatch();
        }
    }

    trackPageView() {
        this.trackEvent('page_view', {
            page_type: this.getPageType(),
            utm_source: this.getURLParam('utm_source'),
            utm_medium: this.getURLParam('utm_medium'),
            utm_campaign: this.getURLParam('utm_campaign'),
            utm_content: this.getURLParam('utm_content'),
            utm_term: this.getURLParam('utm_term'),
            gclid: this.getURLParam('gclid'), // Google Ads
            fbclid: this.getURLParam('fbclid'), // Facebook Ads
            time_on_previous_page: this.getPreviousPageTime()
        });
    }

    trackClick(event) {
        const element = event.target;
        const elementInfo = this.getElementInfo(element);
        
        if (elementInfo.trackable) {
            this.trackEvent('click', {
                element_type: elementInfo.type,
                element_text: elementInfo.text,
                element_id: elementInfo.id,
                element_class: elementInfo.className,
                element_href: elementInfo.href,
                element_position: this.getElementPosition(element),
                click_coordinates: {
                    x: event.clientX,
                    y: event.clientY
                }
            });
        }
    }

    trackFormSubmit(event) {
        const form = event.target;
        const formData = new FormData(form);
        
        this.trackEvent('form_submit', {
            form_id: form.id,
            form_class: form.className,
            form_action: form.action,
            form_method: form.method,
            field_count: formData.entries().length,
            form_type: this.getFormType(form)
        });
    }

    trackPageExit() {
        const timeOnPage = Date.now() - this.startTime;
        const scrollDepth = this.getMaxScrollDepth();
        
        this.trackEvent('page_exit', {
            time_on_page: timeOnPage,
            scroll_depth: scrollDepth,
            exit_type: 'beforeunload'
        });
        
        // Force flush remaining events
        this.flushEventsBatch(true);
    }

    trackError(error, type = 'javascript_error') {
        this.trackEvent('error', {
            error_type: type,
            error_message: error.message || error.reason?.message,
            error_filename: error.filename,
            error_line: error.lineno,
            error_column: error.colno,
            error_stack: error.error?.stack,
            user_agent: navigator.userAgent
        });
    }

    // Specialized tracking methods for BlendWorks
    trackPackageView(packageName, price, currency = 'USD') {
        this.trackEvent('package_view', {
            package: packageName,
            price: price,
            currency: currency,
            converted_price: this.convertPrice(price, currency)
        });
    }

    trackGeneratorUsage(listsCount, itemsCount, combinationsGenerated, format, timeToGenerate) {
        this.trackEvent('generator_usage', {
            lists_count: listsCount,
            items_count: itemsCount,
            combinations_generated: combinationsGenerated,
            format: format,
            generation_time_ms: timeToGenerate,
            complexity_score: this.calculateComplexityScore(listsCount, itemsCount)
        });
    }

    trackPaymentAttempt(gateway, packageName, amount, currency) {
        this.trackEvent('payment_attempt', {
            gateway: gateway,
            package: packageName,
            amount: amount,
            currency: currency,
            converted_amount: this.convertPrice(amount, currency)
        });
    }

    trackConversion(packageName, amount, currency, gateway, transactionId) {
        this.trackEvent('conversion', {
            package: packageName,
            amount: amount,
            currency: currency,
            gateway: gateway,
            transaction_id: transactionId,
            funnel_duration: Date.now() - this.startTime,
            conversion_path: this.getConversionPath()
        });
    }

    trackLeadCapture(email, source, leadScore, interest) {
        this.trackEvent('lead_capture', {
            source: source,
            lead_score: leadScore,
            interest: interest,
            time_to_capture: Date.now() - this.startTime,
            // Email is hashed for privacy
            email_hash: this.hashEmail(email)
        });
    }

    trackLanguageChange(fromLang, toLang, method) {
        this.trackEvent('language_change', {
            from_language: fromLang,
            to_language: toLang,
            change_method: method, // auto_detect, manual
            page_when_changed: window.location.pathname
        });
    }

        trackSearch(query, results, filters) {
        this.trackEvent('search', {
            query_length: query.length,
            results_count: results,
            filters_used: filters,
            // Query is hashed for privacy
            query_hash: this.hashString(query)
        });
    }

    // Batch processing and API communication
    async flushEventsBatch(synchronous = false) {
        if (this.events.length === 0 || !this.isOnline) {
            return;
        }

        const eventsToSend = [...this.events];
        this.events = []; // Clear the batch

        try {
            if (synchronous) {
                // Use sendBeacon for synchronous sends (page unload)
                this.sendEventsBeacon(eventsToSend);
            } else {
                await this.sendEventsAsync(eventsToSend);
            }
            
            console.log(`📤 Sent ${eventsToSend.length} analytics events`);
            
        } catch (error) {
            console.warn('📊 Analytics batch send failed:', error);
            
            // Store failed events locally for retry
            this.storeEventsLocally(eventsToSend);
        }
    }

    async sendEventsAsync(events) {
        const response = await fetch(this.apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ events })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response.json();
    }

    sendEventsBeacon(events) {
        if ('sendBeacon' in navigator) {
            const blob = new Blob([JSON.stringify({ events })], {
                type: 'application/json'
            });
            
            navigator.sendBeacon(this.apiEndpoint, blob);
        } else {
            // Fallback for browsers without sendBeacon
            this.sendEventsSync(events);
        }
    }

    sendEventsSync(events) {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', this.apiEndpoint, false); // Synchronous
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify({ events }));
    }

    storeEventsLocally(events) {
        try {
            const storedEvents = JSON.parse(localStorage.getItem('blendworks_analytics_queue') || '[]');
            storedEvents.push(...events);
            
            // Keep only last 100 events to avoid storage bloat
            const recentEvents = storedEvents.slice(-100);
            localStorage.setItem('blendworks_analytics_queue', JSON.stringify(recentEvents));
        } catch (error) {
            console.warn('Failed to store events locally:', error);
        }
    }

    async retryStoredEvents() {
        try {
            const storedEvents = JSON.parse(localStorage.getItem('blendworks_analytics_queue') || '[]');
            
            if (storedEvents.length > 0 && this.isOnline) {
                await this.sendEventsAsync(storedEvents);
                localStorage.removeItem('blendworks_analytics_queue');
                console.log(`📤 Retried ${storedEvents.length} stored events`);
            }
        } catch (error) {
            console.warn('Failed to retry stored events:', error);
        }
    }

    // Utility methods
    generateSessionId() {
        // Check if session already exists
        let sessionId = sessionStorage.getItem('blendworks_session_id');
        
        if (!sessionId) {
            sessionId = Date.now().toString(36) + Math.random().toString(36).substr(2);
            sessionStorage.setItem('blendworks_session_id', sessionId);
        }
        
        return sessionId;
    }

    getPrivacyHash() {
        // Create a privacy-friendly hash based on session and timestamp
        const data = `${this.sessionId}-${Date.now()}`;
        return this.hashString(data).substring(0, 8);
    }

    hashString(str) {
        let hash = 0;
        if (str.length === 0) return hash;
        
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        
        return Math.abs(hash).toString(36);
    }

    hashEmail(email) {
        // Hash email for privacy while maintaining uniqueness
        return this.hashString(email.toLowerCase());
    }

    getElementInfo(element) {
        const info = {
            trackable: false,
            type: 'unknown',
            text: '',
            id: element.id || '',
            className: element.className || '',
            href: null
        };

        // Determine if element should be tracked
        if (element.matches('button, .btn, a[href], [data-track], [onclick]')) {
            info.trackable = true;
        }

        // Get element type
        if (element.matches('button, .btn')) info.type = 'button';
        else if (element.matches('a[href]')) {
            info.type = 'link';
            info.href = element.href;
        }
        else if (element.matches('[data-package]')) info.type = 'package_selector';
        else if (element.matches('[data-i18n*="cta"]')) info.type = 'cta';
        else if (element.matches('.pay-button')) info.type = 'payment_button';

        // Get element text (truncated)
        info.text = (element.textContent || element.alt || element.title || '').trim().substring(0, 100);

        return info;
    }

    getElementPosition(element) {
        const rect = element.getBoundingClientRect();
        return {
            x: Math.round(rect.left + rect.width / 2),
            y: Math.round(rect.top + rect.height / 2),
            width: Math.round(rect.width),
            height: Math.round(rect.height)
        };
    }

    getFormType(form) {
        if (form.classList.contains('lead-form')) return 'lead_capture';
        if (form.classList.contains('inline-lead-form')) return 'inline_lead';
        if (form.classList.contains('payment-form')) return 'payment';
        if (form.classList.contains('contact-form')) return 'contact';
        return 'unknown';
    }

    getPageType() {
        const path = window.location.pathname;
        
        if (path === '/' || path === '/index.html') return 'homepage';
        if (path.includes('pricing')) return 'pricing';
        if (path.includes('app')) return 'application';
        if (path.includes('course')) return 'course';
        if (path.includes('affiliate')) return 'affiliate';
        if (path.includes('auth')) return 'authentication';
        if (path.includes('admin')) return 'admin';
        
        return 'other';
    }

    getConnectionType() {
        if ('connection' in navigator) {
            return navigator.connection.effectiveType || 'unknown';
        }
        return 'unknown';
    }

    getURLParam(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    }

    getPreviousPageTime() {
        const prevTime = sessionStorage.getItem('blendworks_page_start_time');
        if (prevTime) {
            return Date.now() - parseInt(prevTime);
        }
        return null;
    }

    getMaxScrollDepth() {
        return Math.round(
            (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
        );
    }

    calculateComplexityScore(lists, items) {
        // Simple complexity score based on lists and items
        return lists * items;
    }

    convertPrice(amount, fromCurrency) {
        // This would connect to exchange rate API in real implementation
        // For now, return as-is
        return amount;
    }

    getConversionPath() {
        // Track the path user took to conversion
        const path = sessionStorage.getItem('blendworks_conversion_path');
        return path ? JSON.parse(path) : [];
    }

    // Public API methods
    setUserId(userId) {
        this.userId = userId;
        console.log(`👤 User ID set: ${userId}`);
    }

    identifyUser(userInfo) {
        this.userId = userInfo.id;
        
        this.trackEvent('user_identify', {
            user_id: userInfo.id,
            email_hash: userInfo.email ? this.hashEmail(userInfo.email) : null,
            plan: userInfo.plan || 'free',
            signup_date: userInfo.signupDate,
            country: userInfo.country || this.userCountry
        });
    }

    trackCustomEvent(eventName, properties = {}) {
        this.trackEvent(`custom_${eventName}`, properties);
    }

    // A/B Testing support
    trackExperiment(experimentName, variant, converted = false) {
        this.trackEvent('experiment', {
            experiment_name: experimentName,
            variant: variant,
            converted: converted
        });
    }

    // Revenue tracking
    trackRevenue(amount, currency, source, transactionId) {
        this.trackEvent('revenue', {
            amount: amount,
            currency: currency,
            source: source,
            transaction_id: transactionId,
            converted_amount: this.convertPrice(amount, currency)
        });
    }

    // Performance monitoring
    trackPerformanceMetric(metricName, value, unit = 'ms') {
        this.trackEvent('performance_metric', {
            metric_name: metricName,
            value: value,
            unit: unit
        });
    }

    // Feature usage tracking
    trackFeatureUsage(featureName, action, metadata = {}) {
        this.trackEvent('feature_usage', {
            feature: featureName,
            action: action,
            ...metadata
        });
    }

    // Error reporting with context
    reportError(error, context = {}) {
        this.trackEvent('error_report', {
            error_message: error.message,
            error_stack: error.stack,
            context: context,
            user_action: context.userAction || 'unknown',
            component: context.component || 'unknown'
        });
    }

    // Get analytics summary for debugging
    getAnalyticsSummary() {
        return {
            sessionId: this.sessionId,
            userId: this.userId,
            country: this.userCountry,
            eventsQueued: this.events.length,
            timeOnSite: Date.now() - this.startTime,
            pageViews: this.getEventCount('page_view'),
            interactions: this.getEventCount('click')
        };
    }

    getEventCount(eventType) {
        return this.events.filter(event => event.event_type === eventType).length;
    }

    // Cleanup method
    destroy() {
        // Flush remaining events
        this.flushEventsBatch(true);
        
        // Clear intervals
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
        }
        
        console.log('📊 Analytics system destroyed');
    }
}

// Initialize analytics system globally
window.analytics = new BlendWorksAnalytics();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.analytics.init();
    });
} else {
    window.analytics.init();
}

// Store page start time for next page calculations
sessionStorage.setItem('blendworks_page_start_time', Date.now().toString());

// Global helper functions for easy tracking
window.trackEvent = (eventName, properties = {}) => {
    if (window.analytics) {
        window.analytics.trackCustomEvent(eventName, properties);
    }
};

window.trackConversion = (package, amount, currency, gateway) => {
    if (window.analytics) {
        window.analytics.trackConversion(package, amount, currency, gateway);
    }
};

window.trackFeature = (feature, action, metadata = {}) => {
    if (window.analytics) {
        window.analytics.trackFeatureUsage(feature, action, metadata);
    }
};