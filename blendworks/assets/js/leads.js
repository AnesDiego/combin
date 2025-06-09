/**
 * BlendWorks Lead Capture System - GitHub Pages Version
 * Uses Formspree + EmailJS + Supabase for complete lead management
 */

class BlendWorksLeadSystem {
    constructor() {
        this.formspreeEndpoint = 'https://formspree.io/f/YOUR_FORM_ID'; // Configure with your Formspree ID
        this.emailjsServiceId = 'YOUR_EMAILJS_SERVICE_ID';
        this.emailjsTemplateId = 'YOUR_EMAILJS_TEMPLATE_ID';
        this.emailjsPublicKey = 'YOUR_EMAILJS_PUBLIC_KEY';
        
        this.supabase = null;
        this.userBehavior = {
            timeOnSite: 0,
            startTime: Date.now(),
            pagesViewed: 0,
            scrollDepth: 0,
            packageInterest: null,
            clicksCount: 0,
            formsStarted: 0,
            videoPlayed: false
        };
        
        this.triggers = {
            exitIntent: false,
            timeBasedPopup: false,
            scrollPopup50: false,
            scrollPopup75: false
        };
        
        this.leadCaptured = false;
        this.isHighValueLead = false;
    }

    async init() {
        console.log('🎯 Initializing Lead Capture System (GitHub Pages)...');
        
        try {
            // Initialize Supabase (optional - for advanced tracking)
            await this.initSupabase();
            
            // Initialize EmailJS
            await this.initEmailJS();
            
            this.checkExistingLead();
            this.setupBehaviorTracking();
            this.setupTriggers();
            this.setupFormHandlers();
            this.startBehaviorTimer();
            
            console.log('✅ Lead Capture System initialized');
        } catch (error) {
            console.error('❌ Lead System initialization failed:', error);
        }
    }

    async initSupabase() {
        try {
            if (window.supabase) {
                this.supabase = window.supabase;
            } else {
                // Initialize Supabase if not already done
                const supabaseUrl = 'https://your-project.supabase.co';
                const supabaseAnonKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...';
                this.supabase = supabase.createClient(supabaseUrl, supabaseAnonKey);
            }
            console.log('🗄️ Supabase connected for lead tracking');
        } catch (error) {
            console.warn('⚠️ Supabase connection failed:', error);
        }
    }

    async initEmailJS() {
        try {
            // Load EmailJS library if not already loaded
            if (typeof emailjs === 'undefined') {
                await this.loadEmailJSLibrary();
            }
            
            // Initialize EmailJS
            emailjs.init(this.emailjsPublicKey);
            console.log('📧 EmailJS initialized');
        } catch (error) {
            console.warn('⚠️ EmailJS initialization failed:', error);
        }
    }

    loadEmailJSLibrary() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    checkExistingLead() {
        this.leadCaptured = localStorage.getItem('blendworks_lead_captured') === 'true';
        
        if (this.leadCaptured) {
            console.log('👤 Returning user detected');
            this.adjustTriggersForReturningUser();
        }
    }

    adjustTriggersForReturningUser() {
        // Less aggressive for returning users
        this.triggers.exitIntent = false;
        this.triggers.timeBasedPopup = false;
        
        // Show value-driven content instead
        setTimeout(() => {
            this.showReturningUserContent();
        }, 60000);
    }

    setupBehaviorTracking() {
        this.userBehavior.pagesViewed++;
        
        // Track clicks
        document.addEventListener('click', (e) => {
            this.userBehavior.clicksCount++;
            this.trackElementClick(e.target);
        });
        
        // Track scroll depth
        this.setupScrollTracking();
        
        // Track form interactions
        this.setupFormTracking();
        
        // Track package interest
        this.setupPackageTracking();
    }

    setupScrollTracking() {
        let maxScroll = 0;
        let scrollTimer = null;
        
        window.addEventListener('scroll', () => {
            const scrollPercent = Math.round(
                (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
            );
            
            if (scrollPercent > maxScroll) {
                maxScroll = scrollPercent;
                this.userBehavior.scrollDepth = scrollPercent;
            }
            
            clearTimeout(scrollTimer);
            scrollTimer = setTimeout(() => {
                this.checkScrollTriggers(scrollPercent);
            }, 500);
        });
    }

    checkScrollTriggers(scrollPercent) {
        // 50% scroll trigger
        if (scrollPercent >= 50 && !this.triggers.scrollPopup50 && !this.leadCaptured) {
            this.triggers.scrollPopup50 = true;
            setTimeout(() => {
                this.showScrollBasedPopup('50%');
            }, 2000);
        }
        
        // 75% scroll trigger (high intent)
        if (scrollPercent >= 75 && !this.triggers.scrollPopup75) {
            this.triggers.scrollPopup75 = true;
            this.isHighValueLead = true;
            
            if (!this.leadCaptured) {
                this.showFloatingOffer();
            }
        }
    }

    setupFormTracking() {
        document.querySelectorAll('form').forEach(form => {
            form.addEventListener('focusin', () => {
                if (!form.dataset.formStarted) {
                    form.dataset.formStarted = 'true';
                    this.userBehavior.formsStarted++;
                }
            });
        });
    }

    setupPackageTracking() {
        document.querySelectorAll('[data-package]').forEach(element => {
            element.addEventListener('click', (e) => {
                const packageName = e.target.getAttribute('data-package');
                this.userBehavior.packageInterest = packageName;
                this.isHighValueLead = true;
                
                console.log(`💰 Package interest detected: ${packageName}`);
                
                if (!this.leadCaptured) {
                    this.showPackageTargetedPopup(packageName);
                }
            });
        });
    }

    setupTriggers() {
        this.setupExitIntentTrigger();
        this.setupTimeBasedTriggers();
        this.setupFloatingElements();
    }

    setupExitIntentTrigger() {
        let exitShown = false;
        
        document.addEventListener('mouseleave', (e) => {
            if (
                e.clientY <= 0 && 
                !exitShown && 
                this.shouldShowExitIntent() &&
                !this.leadCaptured
            ) {
                exitShown = true;
                this.showExitIntentPopup();
            }
        });
    }

    shouldShowExitIntent() {
        const timeOnSite = Date.now() - this.userBehavior.startTime;
        return (
            timeOnSite > 30000 && // At least 30 seconds
            this.userBehavior.scrollDepth > 25 && // Scrolled at least 25%
            this.userBehavior.clicksCount > 2 // Some engagement
        );
    }

    setupTimeBasedTriggers() {
        // 45 second popup for engaged users
        setTimeout(() => {
            if (this.isEngagedUser() && !this.leadCaptured) {
                this.showTimeBasedPopup();
            }
        }, 45000);
    }

    isEngagedUser() {
        return (
            this.userBehavior.scrollDepth > 40 ||
            this.userBehavior.clicksCount > 3 ||
            this.userBehavior.formsStarted > 0
        );
    }

    setupFloatingElements() {
        // Show floating lead button after engagement
        setTimeout(() => {
            const floatingBtn = document.getElementById('floatingLead');
            if (floatingBtn && !this.leadCaptured) {
                floatingBtn.style.display = 'flex';
                floatingBtn.classList.add('fade-in-up');
            }
        }, 15000);
    }

    setupFormHandlers() {
        // Handle all lead forms (both inline and popup)
        document.addEventListener('submit', (e) => {
            if (e.target.classList.contains('lead-form') || 
                e.target.classList.contains('inline-lead-form')) {
                e.preventDefault();
                this.handleLeadFormSubmission(e.target);
            }
        });
    }

    async handleLeadFormSubmission(form) {
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        
        try {
            // Show loading state
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner"></span> Sending...';
            
            // Get form data
            const formData = new FormData(form);
            const leadData = this.prepareLeadData(formData, form);
            
            // Submit via multiple channels
            await this.submitLeadMultiChannel(leadData, form);
            
            // Handle success
            this.handleSuccessfulCapture(leadData, form);
            
        } catch (error) {
            console.error('❌ Lead submission error:', error);
            this.handleSubmissionError(error, submitBtn, originalText);
        }
    }

    prepareLeadData(formData, form) {
        const source = this.getLeadSource(form);
        
        return {
            email: formData.get('email'),
            name: formData.get('name') || '',
            interest: formData.get('interest') || 'general',
            source: source,
            
            // Behavioral data
            timeOnSite: Date.now() - this.userBehavior.startTime,
            scrollDepth: this.userBehavior.scrollDepth,
            packageInterest: this.userBehavior.packageInterest,
            clicksCount: this.userBehavior.clicksCount,
            
            // Device info
            userAgent: navigator.userAgent,
            language: navigator.language,
            referrer: document.referrer,
            
            // Lead scoring
            leadScore: this.calculateLeadScore(),
            isHighValue: this.isHighValueLead,
            
            // Timestamps
            timestamp: new Date().toISOString(),
            page: window.location.pathname
        };
    }

    async submitLeadMultiChannel(leadData, form) {
        const promises = [];
        
        // 1. Submit to Formspree
        promises.push(this.submitToFormspree(leadData, form));
        
        // 2. Submit to Supabase (if available)
        if (this.supabase) {
            promises.push(this.submitToSupabase(leadData));
        }
        
        // 3. Send welcome email via EmailJS
        promises.push(this.sendWelcomeEmail(leadData));
        
        // Wait for at least one to succeed
        const results = await Promise.allSettled(promises);
        
        // Check if at least one succeeded
        const hasSuccess = results.some(result => result.status === 'fulfilled');
        
        if (!hasSuccess) {
            throw new Error('All submission methods failed');
        }
        
        console.log('✅ Lead submitted via multiple channels');
    }

    async submitToFormspree(leadData, form) {
        try {
            // Prepare form data for Formspree
            const formData = new FormData();
            formData.append('email', leadData.email);
            formData.append('name', leadData.name);
            formData.append('interest', leadData.interest);
            formData.append('source', leadData.source);
            formData.append('leadScore', leadData.leadScore);
            formData.append('_subject', `New BlendWorks Lead: ${leadData.email}`);
            
            const response = await fetch(this.formspreeEndpoint, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Formspree error: ${response.status}`);
            }
            
            console.log('📝 Lead submitted to Formspree');
            
        } catch (error) {
            console.error('❌ Formspree submission failed:', error);
            throw error;
        }
    }

    async submitToSupabase(leadData) {
        try {
            if (!this.supabase) return;
            
            const { data, error } = await this.supabase
                .from('leads')
                .insert([{
                    email: leadData.email,
                    name: leadData.name,
                    source: leadData.source,
                    interest: leadData.interest,
                    time_on_site: leadData.timeOnSite,
                    scroll_depth: leadData.scrollDepth,
                    package_interest: leadData.packageInterest,
                    lead_score: leadData.leadScore,
                    lead_grade: this.calculateLeadGrade(leadData.leadScore),
                    country_code: document.documentElement.getAttribute('data-country') || 'Unknown',
                    user_agent: leadData.userAgent,
                    language: leadData.language,
                    referrer: leadData.referrer,
                    status: 'new',
                    created_at: leadData.timestamp
                }]);
            
            if (error) {
                throw error;
            }
            
            console.log('🗄️ Lead saved to Supabase');
            
        } catch (error) {
            console.error('❌ Supabase submission failed:', error);
            throw error;
        }
    }

    async sendWelcomeEmail(leadData) {
        try {
            if (typeof emailjs === 'undefined') return;
            
            const templateParams = {
                to_name: leadData.name || 'Friend',
                to_email: leadData.email,
                from_name: 'Diego from BlendWorks',
                message: this.getWelcomeMessage(leadData),
                download_link: this.getDownloadLink(leadData.source),
                source: leadData.source
            };
            
            await emailjs.send(
                this.emailjsServiceId,
                this.emailjsTemplateId,
                templateParams
            );
            
            console.log('📧 Welcome email sent via EmailJS');
            
        } catch (error) {
            console.error('❌ EmailJS sending failed:', error);
            throw error;
        }
    }

    getWelcomeMessage(leadData) {
        const messages = {
            'templates': `Here are your 50 professional templates! These will save you hours of work.`,
            'exit-intent': `Thanks for your interest in BlendWorks! Here's your free access.`,
            'package-interest': `I noticed you're interested in ${leadData.packageInterest}. Let me help you get started!`,
            'default': `Welcome to BlendWorks! Here's your free starter pack.`
        };
        
        return messages[leadData.source] || messages['default'];
    }

    getDownloadLink(source) {
        const links = {
            'templates': 'https://github.com/AnesDiego/blendworks/releases/download/v1.0/templates-pack.zip',
            'exit-intent': 'https://github.com/AnesDiego/blendworks/releases/download/v1.0/starter-pack.zip',
            'default': 'https://github.com/AnesDiego/blendworks/releases/download/v1.0/free-pack.zip'
        };
        
        return links[source] || links['default'];
    }

    calculateLeadScore() {
        let score = 0;
        
        // Time on site
        const timeOnSite = Date.now() - this.userBehavior.startTime;
        if (timeOnSite > 30000) score += 10;
        if (timeOnSite > 60000) score += 10;
        if (timeOnSite > 180000) score += 5;
        
        // Engagement
        if (this.userBehavior.scrollDepth > 25) score += 5;
        if (this.userBehavior.scrollDepth > 50) score += 10;
        if (this.userBehavior.scrollDepth > 75) score += 5;
        
        if (this.userBehavior.clicksCount > 2) score += 10;
        if (this.userBehavior.formsStarted > 0) score += 5;
        
        // Package interest
        if (this.userBehavior.packageInterest) {
            score += 15;
            if (this.userBehavior.packageInterest.includes('enterprise')) score += 10;
        }
        
        return Math.min(score, 100);
    }

    calculateLeadGrade(score) {
        if (score >= 80) return 'A';
        if (score >= 60) return 'B';
        if (score >= 40) return 'C';
        return 'D';
    }

    getLeadSource(form) {
        if (form.dataset.source) return form.dataset.source;
        if (form.closest('.lead-popup')) return 'exit-intent';
        if (form.closest('.lead-magnet-section')) return 'templates';
        if (form.closest('.hero')) return 'hero-cta';
        return 'unknown';
    }

    handleSuccessfulCapture(leadData, form) {
        // Mark lead as captured
        this.leadCaptured = true;
        localStorage.setItem('blendworks_lead_captured', 'true');
        localStorage.setItem('blendworks_lead_email', leadData.email);
        
        // Close popups
        this.closeAllPopups();
        
        // Show success message
        this.showSuccessMessage(leadData);
        
        // Track conversion
        if (window.analytics) {
            window.analytics.trackEvent('lead_captured', {
                source: leadData.source,
                email: leadData.email,
                score: leadData.leadScore
            });
        }
    }

    handleSubmissionError(error, submitBtn, originalText) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        
        this.showErrorMessage('Something went wrong. Please try again.');
        console.error('Lead submission error:', error);
    }

    // UI Methods
    showExitIntentPopup() {
        const popup = document.getElementById('exitIntentPopup');
        if (popup) {
            popup.style.display = 'flex';
            popup.classList.add('fade-in-up');
        }
    }

    showScrollBasedPopup(percentage) {
        this.createCustomPopup({
            title: '🎯 Interested in Combinations?',
            subtitle: 'You scrolled this far, want to test for free?',
            source: `scroll-${percentage}`
        });
    }

    showPackageTargetedPopup(packageName) {
        const messages = {
            'starter': {
                title: '🚀 Perfect to Get Started!',
                subtitle: 'Get the starter pack with 50% discount'
            },
            'professional': {
                title: '💼 Professional Choice!',
                subtitle: 'Boost your productivity with Professional'
            },
            'enterprise': {
                title: '🏢 Enterprise Solution',
                subtitle: 'Let\'s talk about your needs?'
            }
        };
        
        const message = messages[packageName] || messages['starter'];
        this.createCustomPopup({
            ...message,
            source: `package-${packageName}`
        });
    }

    showTimeBasedPopup() {
        this.createCustomPopup({
            title: '⏰ Still Here?',
            subtitle: 'Get our free templates before leaving',
            source: 'time-based'
        });
    }

    createCustomPopup(config) {
        const popup = document.createElement('div');
        popup.className = 'custom-popup';
        popup.innerHTML = `
            <div class="popup-overlay" onclick="this.parentElement.remove()"></div>
            <div class="popup-content">
                <button class="close-btn" onclick="this.parentElement.parentElement.remove()">×</button>
                <div class="popup-header">
                    <h2>${config.title}</h2>
                    <p>${config.subtitle}</p>
                </div>
                <form class="lead-form" data-source="${config.source}">
                    <input type="email" name="email" placeholder="Your best email" required>
                    <input type="text" name="name" placeholder="Your name" required>
                    <select name="interest">
                        <option value="business">Business/Company</option>
                        <option value="marketing">Digital Marketing</option>
                        <option value="development">Development</option>
                        <option value="personal">Personal Use</option>
                    </select>
                    <button type="submit" class="btn btn-accent">
                        🎁 I Want It Free!
                    </button>
                </form>
            </div>
        `;
        
        document.body.appendChild(popup);
        
        // Auto-remove after 30 seconds
        setTimeout(() => {
            if (popup.parentNode) {
                popup.remove();
            }
        }, 30000);
    }

    showSuccessMessage(leadData) {
        const modal = document.createElement('div');
        modal.className = 'success-modal';
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content success-content">
                <div class="success-icon">🎉</div>
                <h2>Success!</h2>
                <p>We sent the templates to <strong>${leadData.email}</strong></p>
                <p>Check your inbox (and spam folder too!)</p>
                <div class="success-actions">
                    <button class="btn btn-accent" onclick="this.parentElement.parentElement.parentElement.remove()">
                        Got it!
                    </button>
                    <a href="app.html" class="btn btn-outline">
                        Try the Generator
                    </a>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Auto-remove after 8 seconds
        setTimeout(() => {
            if (modal.parentNode) {
                modal.remove();
            }
        }, 8000);
    }

    showErrorMessage(message) {
        const toast = document.createElement('div');
        toast.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: var(--error);
                color: white;
                padding: 12px 16px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 9999;
                font-size: 14px;
                max-width: 300px;
            ">
                ❌ ${message}
            </div>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 4000);
    }

    closeAllPopups() {
        document.querySelectorAll('.lead-popup, .custom-popup').forEach(popup => {
            popup.remove();
        });
    }

    showFloatingOffer() {
        const floatingBtn = document.getElementById('floatingLead');
        if (floatingBtn) {
            floatingBtn.innerHTML = `
                <div class="fab-icon">🔥</div>
                <div class="fab-text">Special Offer</div>
                <div class="fab-pulse"></div>
            `;
        }
    }

    showReturningUserContent() {
        // Show personalized content for returning users
        console.log('👋 Showing returning user content');
    }

    startBehaviorTimer() {
        setInterval(() => {
            this.userBehavior.timeOnSite = Date.now() - this.userBehavior.startTime;
        }, 10000);
    }

    trackElementClick(element) {
        if (element.matches('[data-package]')) {
            console.log('📦 Package clicked:', element.getAttribute('data-package'));
        }
    }
}

// Global functions for HTML onclick handlers
function submitLead(event, source) {
    event.preventDefault();
    if (window.leadSystem) {
        window.leadSystem.handleLeadFormSubmission(event.target);
    }
}

function openLeadPopup(type) {
    if (window.leadSystem) {
        window.leadSystem.showTimeBasedPopup();
    }
}

function closePopup() {
    const popup = document.querySelector('.lead-popup, .custom-popup');
    if (popup) {
        popup.remove();
    }
}

// Initialize lead system
window.leadSystem = new BlendWorksLeadSystem();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.leadSystem.init();
    });
} else {
    window.leadSystem.init();
}/**
 * BlendWorks Lead Capture System - GitHub Pages Version
 * Captures leads, manages email collection, and handles user journey
 * Updated: 2025-06-07 22:45:14 UTC by AnesDiego
 */

class BlendWorksLeadSystem {
    constructor() {
        this.supabase = null;
        this.currentLead = null;
        this.leadSource = 'organic';
        this.leadMedium = 'direct';
        this.leadCampaign = null;
        this.sessionId = this.generateSessionId();
        this.pageViewCount = 0;
        this.timeOnSite = 0;
        this.siteEntryTime = Date.now();
        
        // Lead capture configuration
        this.captureConfig = {
            exitIntentEnabled: true,
            scrollThresholdEnabled: true,
            timeBasedEnabled: true,
            scrollThreshold: 70, // %
            timeThreshold: 45000, // 45 seconds
            maxPopupsPerSession: 2,
            cooldownPeriod: 300000 // 5 minutes
        };
        
        // A/B testing for lead magnets
        this.leadMagnets = {
            freeCredits: {
                title: '🎁 Get 100 Free Combinations!',
                description: 'Enter your email to receive 100 free combinations instantly.',
                buttonText: 'Get Free Combinations',
                variant: 'A'
            },
            guide: {
                title: '📚 Free Combination Guide!',
                description: 'Download our complete guide to creating professional combinations.',
                buttonText: 'Download Free Guide',
                variant: 'B'
            },
            trial: {
                title: '⚡ Start Free Trial!',
                description: 'Get full access to BlendWorks for 7 days, no credit card required.',
                buttonText: 'Start Free Trial',
                variant: 'C'
            }
        };
        
        this.currentMagnet = this.selectLeadMagnet();
        this.popupShownCount = 0;
        this.lastPopupTime = 0;
    }

    async init() {
        console.log('📧 Initializing Lead Capture System...');
        
        try {
            // Initialize Supabase connection
            await this.initializeSupabase();
            
            // Detect lead source and campaign
            this.detectLeadSource();
            
            // Load existing lead data
            await this.loadExistingLead();
            
            // Setup tracking and capture mechanisms
            this.setupPageTracking();
            this.setupLeadCapture();
            this.setupFormHandlers();
            
            // Start session tracking
            this.startSessionTracking();
            
            console.log('✅ Lead system initialized');
            
        } catch (error) {
            console.error('❌ Lead system initialization failed:', error);
            // Continue without lead capture
        }
    }

    async initializeSupabase() {
        try {
            if (window.supabase) {
                this.supabase = window.supabase;
            } else {
                const supabaseUrl = 'https://your-project.supabase.co';
                const supabaseAnonKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...'; // Safe anon key
                this.supabase = supabase.createClient(supabaseUrl, supabaseAnonKey);
            }
            
            console.log('🗄️ Supabase connected for leads');
            
        } catch (error) {
            console.warn('⚠️ Supabase connection failed, using localStorage fallback');
            this.supabase = null;
        }
    }

    detectLeadSource() {
        const urlParams = new URLSearchParams(window.location.search);
        const referrer = document.referrer;
        
        // UTM parameters
        this.leadSource = urlParams.get('utm_source') || this.detectSourceFromReferrer(referrer);
        this.leadMedium = urlParams.get('utm_medium') || this.detectMediumFromReferrer(referrer);
        this.leadCampaign = urlParams.get('utm_campaign');
        
        // Additional tracking
        const gclid = urlParams.get('gclid'); // Google Ads
        const fbclid = urlParams.get('fbclid'); // Facebook Ads
        const msclkid = urlParams.get('msclkid'); // Microsoft Ads
        
        if (gclid) {
            this.leadSource = 'google';
            this.leadMedium = 'cpc';
        } else if (fbclid) {
            this.leadSource = 'facebook';
            this.leadMedium = 'cpc';
        } else if (msclkid) {
            this.leadSource = 'microsoft';
            this.leadMedium = 'cpc';
        }
        
        // Store in session
        sessionStorage.setItem('lead_source', this.leadSource);
        sessionStorage.setItem('lead_medium', this.leadMedium);
        if (this.leadCampaign) {
            sessionStorage.setItem('lead_campaign', this.leadCampaign);
        }
        
        console.log(`📊 Lead source: ${this.leadSource}/${this.leadMedium}${this.leadCampaign ? '/' + this.leadCampaign : ''}`);
    }

    detectSourceFromReferrer(referrer) {
        if (!referrer) return 'direct';
        
        const domain = new URL(referrer).hostname.toLowerCase();
        
        // Search engines
        if (domain.includes('google.')) return 'google';
        if (domain.includes('bing.')) return 'bing';
        if (domain.includes('yahoo.')) return 'yahoo';
        if (domain.includes('duckduckgo.')) return 'duckduckgo';
        
        // Social media
        if (domain.includes('facebook.') || domain.includes('fb.')) return 'facebook';
        if (domain.includes('twitter.') || domain.includes('t.co')) return 'twitter';
        if (domain.includes('linkedin.')) return 'linkedin';
        if (domain.includes('instagram.')) return 'instagram';
        if (domain.includes('youtube.')) return 'youtube';
        if (domain.includes('tiktok.')) return 'tiktok';
        if (domain.includes('reddit.')) return 'reddit';
        
        // Developer communities
        if (domain.includes('github.')) return 'github';
        if (domain.includes('stackoverflow.')) return 'stackoverflow';
        if (domain.includes('dev.to')) return 'devto';
        if (domain.includes('medium.')) return 'medium';
        
        return 'referral';
    }

    detectMediumFromReferrer(referrer) {
        if (!referrer) return 'direct';
        
        const domain = new URL(referrer).hostname.toLowerCase();
        
        // Search engines
        if (domain.includes('google.') || domain.includes('bing.') || 
            domain.includes('yahoo.') || domain.includes('duckduckgo.')) {
            return 'organic';
        }
        
        // Social media
        if (domain.includes('facebook.') || domain.includes('twitter.') || 
            domain.includes('linkedin.') || domain.includes('instagram.')) {
            return 'social';
        }
        
        return 'referral';
    }

    async loadExistingLead() {
        try {
            // Try to load from localStorage first
            const storedEmail = localStorage.getItem('blendworks_lead_email');
            const storedId = localStorage.getItem('blendworks_lead_id');
            
            if (storedEmail) {
                this.currentLead = {
                    id: storedId,
                    email: storedEmail,
                    status: 'existing',
                    source: this.leadSource,
                    medium: this.leadMedium,
                    campaign: this.leadCampaign
                };
                
                console.log(`👤 Existing lead loaded: ${storedEmail}`);
                
                // Update lead activity if connected to Supabase
                if (this.supabase && storedId) {
                    await this.updateLeadActivity(storedId);
                }
            }
            
        } catch (error) {
            console.warn('⚠️ Failed to load existing lead:', error);
        }
    }

    setupPageTracking() {
        // Track page views
        this.trackPageView();
        
        // Track time on site
        setInterval(() => {
            this.timeOnSite = Date.now() - this.siteEntryTime;
        }, 5000);
        
        // Track scroll depth
        this.setupScrollTracking();
        
        // Track exit intent
        if (this.captureConfig.exitIntentEnabled) {
            this.setupExitIntentTracking();
        }
    }

    trackPageView() {
        this.pageViewCount++;
        
        const pageData = {
            url: window.location.href,
            title: document.title,
            referrer: document.referrer,
            timestamp: new Date().toISOString(),
            session_id: this.sessionId,
            lead_source: this.leadSource,
            lead_medium: this.leadMedium,
            lead_campaign: this.leadCampaign,
            user_agent: navigator.userAgent,
            screen_resolution: `${screen.width}x${screen.height}`,
            viewport_size: `${window.innerWidth}x${window.innerHeight}`,
            language: navigator.language,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };
        
        // Store page view
        this.storePageView(pageData);
        
        // Track with analytics if available
        if (window.analytics) {
            window.analytics.trackPageView(pageData);
        }
    }

    async storePageView(pageData) {
        try {
            if (this.supabase) {
                const { error } = await this.supabase
                    .from('page_views')
                    .insert([pageData]);
                
                if (error) {
                    throw error;
                }
            }
            
            // Store in localStorage as backup
            const pageViews = JSON.parse(localStorage.getItem('blendworks_page_views') || '[]');
            pageViews.push(pageData);
            
            // Keep only last 10 page views
            if (pageViews.length > 10) {
                pageViews.splice(0, pageViews.length - 10);
            }
            
            localStorage.setItem('blendworks_page_views', JSON.stringify(pageViews));
            
        } catch (error) {
            console.warn('⚠️ Failed to store page view:', error);
        }
    }

    setupScrollTracking() {
        let maxScrollDepth = 0;
        let scrollCheckTriggered = false;
        
        const handleScroll = window.utils.throttle(() => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrollDepth = Math.round((scrollTop / documentHeight) * 100);
            
            maxScrollDepth = Math.max(maxScrollDepth, scrollDepth);
            
            // Trigger lead capture at scroll threshold
            if (this.captureConfig.scrollThresholdEnabled && 
                scrollDepth >= this.captureConfig.scrollThreshold && 
                !scrollCheckTriggered && 
                !this.currentLead) {
                
                scrollCheckTriggered = true;
                this.triggerLeadCapture('scroll', { depth: scrollDepth });
            }
        }, 100);
        
        window.addEventListener('scroll', handleScroll);
        
        // Store max scroll depth when leaving page
        window.addEventListener('beforeunload', () => {
            sessionStorage.setItem('max_scroll_depth', maxScrollDepth.toString());
        });
    }

    setupExitIntentTracking() {
        let exitIntentTriggered = false;
        
        const handleMouseLeave = (e) => {
            if (e.clientY <= 0 && !exitIntentTriggered && !this.currentLead) {
                exitIntentTriggered = true;
                this.triggerLeadCapture('exit_intent');
            }
        };
        
        document.addEventListener('mouseleave', handleMouseLeave);
    }

    setupLeadCapture() {
        // Time-based trigger
        if (this.captureConfig.timeBasedEnabled && !this.currentLead) {
            setTimeout(() => {
                if (!this.currentLead) {
                    this.triggerLeadCapture('time_based', { 
                        timeOnSite: this.captureConfig.timeThreshold 
                    });
                }
            }, this.captureConfig.timeThreshold);
        }
    }

    setupFormHandlers() {
        // Setup all email capture forms
        document.querySelectorAll('form[data-lead-capture]').forEach(form => {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleFormSubmission(form);
            });
        });
        
        // Setup newsletter forms
        document.querySelectorAll('.newsletter-form').forEach(form => {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleNewsletterSignup(form);
            });
        });
        
        // Setup early access forms
        document.querySelectorAll('.early-access-form').forEach(form => {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleEarlyAccessSignup(form);
            });
        });
    }

    triggerLeadCapture(trigger, data = {}) {
        // Check cooldown and popup limits
        if (!this.canShowPopup()) {
            return;
        }
        
        // Select appropriate lead magnet
        const magnet = this.currentMagnet;
        
        // Show lead capture popup
        this.showLeadCapturePopup(magnet, trigger, data);
        
        // Track trigger
        this.trackLeadCaptureTrigger(trigger, data);
    }

    canShowPopup() {
        const now = Date.now();
        
        // Check max popups per session
        if (this.popupShownCount >= this.captureConfig.maxPopupsPerSession) {
            return false;
        }
        
        // Check cooldown period
        if (this.lastPopupTime && (now - this.lastPopupTime) < this.captureConfig.cooldownPeriod) {
            return false;
        }
        
        // Check if user already converted
        if (this.currentLead) {
            return false;
        }
        
        return true;
    }

    showLeadCapturePopup(magnet, trigger, data) {
        const modal = window.utils.createElement('div', {
            className: 'modal lead-capture-modal',
            innerHTML: `
                <div class="modal-overlay" onclick="window.leadSystem.closeLeadCapture()"></div>
                <div class="modal-content lead-capture-content">
                    <button class="close-btn" onclick="window.leadSystem.closeLeadCapture()">×</button>
                    
                    <div class="lead-capture-header">
                        <div class="magnet-icon">${this.getMagnetIcon(magnet)}</div>
                        <h2>${magnet.title}</h2>
                        <p>${magnet.description}</p>
                    </div>
                    
                    <form class="lead-capture-form" id="leadCaptureForm">
                        <div class="form-group">
                            <label for="leadEmail">Email Address</label>
                            <input 
                                type="email" 
                                id="leadEmail" 
                                name="email" 
                                placeholder="Enter your email address"
                                required 
                                autocomplete="email"
                            >
                        </div>
                        
                        <div class="form-group">
                            <label for="leadName">First Name (Optional)</label>
                            <input 
                                type="text" 
                                id="leadName" 
                                name="name" 
                                placeholder="Your first name"
                                autocomplete="given-name"
                            >
                        </div>
                        
                        <button type="submit" class="btn btn-primary btn-large lead-submit-btn">
                            <span class="btn-text">${magnet.buttonText}</span>
                            <span class="btn-loading" style="display: none;">
                                <i class="fas fa-spinner fa-spin"></i> Processing...
                            </span>
                        </button>
                        
                        <div class="lead-benefits">
                            <div class="benefit-item">
                                <i class="fas fa-check"></i>
                                <span>Instant access</span>
                            </div>
                            <div class="benefit-item">
                                <i class="fas fa-shield-alt"></i>
                                <span>No spam, ever</span>
                            </div>
                            <div class="benefit-item">
                                <i class="fas fa-times-circle"></i>
                                <span>Unsubscribe anytime</span>
                            </div>
                        </div>
                        
                        <p class="privacy-note">
                            By submitting your email, you agree to our 
                            <a href="/privacy" target="_blank">Privacy Policy</a>
                        </p>
                    </form>
                    
                    <div class="social-proof">
                        <div class="proof-stats">
                            <div class="stat">
                                <strong>5,247+</strong>
                                <span>Happy users</span>
                            </div>
                            <div class="stat">
                                <strong>50M+</strong>
                                <span>Combinations generated</span>
                            </div>
                        </div>
                    </div>
                </div>
            `
        });
        
        document.body.appendChild(modal);
        
        // Setup form handler
        const form = modal.querySelector('#leadCaptureForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLeadCaptureSubmission(form, magnet, trigger);
        });
        
        // Show modal
        setTimeout(() => {
            modal.classList.add('active');
        }, 100);
        
        // Focus on email input
        setTimeout(() => {
            const emailInput = modal.querySelector('#leadEmail');
            if (emailInput) {
                emailInput.focus();
            }
        }, 500);
        
        // Update counters
        this.popupShownCount++;
        this.lastPopupTime = Date.now();
        
        // Track popup show
        if (window.analytics) {
            window.analytics.trackEvent('lead_popup_shown', {
                trigger: trigger,
                magnet_variant: magnet.variant,
                session_id: this.sessionId
            });
        }
    }

    getMagnetIcon(magnet) {
        const icons = {
            freeCredits: '🎁',
            guide: '📚',
            trial: '⚡'
        };
        
        return icons[Object.keys(this.leadMagnets).find(key => 
            this.leadMagnets[key] === magnet
        )] || '🎯';
    }

    async handleLeadCaptureSubmission(form, magnet, trigger) {
        const formData = new FormData(form);
        const email = formData.get('email');
        const name = formData.get('name');
        
        // Show loading state
        this.setFormLoading(form, true);
        
        try {
            // Create lead
            const leadData = await this.createLead({
                email: email,
                name: name,
                source: this.leadSource,
                medium: this.leadMedium,
                campaign: this.leadCampaign,
                magnet_type: Object.keys(this.leadMagnets).find(key => 
                    this.leadMagnets[key] === magnet
                ),
                magnet_variant: magnet.variant,
                trigger: trigger,
                page_url: window.location.href,
                session_id: this.sessionId
            });
            
            if (leadData.success) {
                // Store lead data
                this.currentLead = leadData.lead;
                localStorage.setItem('blendworks_lead_email', email);
                localStorage.setItem('blendworks_lead_id', leadData.lead.id);
                
                // Show success message
                this.showLeadCaptureSuccess(magnet);
                
                // Deliver lead magnet
                await this.deliverLeadMagnet(magnet, leadData.lead);
                
                // Track conversion
                this.trackLeadConversion(leadData.lead, magnet, trigger);
                
            } else {
                throw new Error(leadData.error || 'Lead creation failed');
            }
            
        } catch (error) {
            console.error('❌ Lead capture failed:', error);
            this.showLeadCaptureError(error.message);
            
        } finally {
            this.setFormLoading(form, false);
        }
    }

    async createLead(leadData) {
        try {
            // Validate email
            if (!this.isValidEmail(leadData.email)) {
                throw new Error('Please enter a valid email address');
            }
            
            // Check for existing lead
            const existingLead = await this.checkExistingLead(leadData.email);
            if (existingLead) {
                return {
                    success: true,
                    lead: existingLead,
                    existing: true
                };
            }
            
            const leadRecord = {
                id: this.generateLeadId(),
                email: leadData.email.toLowerCase().trim(),
                name: leadData.name?.trim() || null,
                source: leadData.source,
                medium: leadData.medium,
                campaign: leadData.campaign,
                magnet_type: leadData.magnet_type,
                magnet_variant: leadData.magnet_variant,
                trigger: leadData.trigger,
                page_url: leadData.page_url,
                session_id: leadData.session_id,
                ip_address: await this.getClientIP(),
                user_agent: navigator.userAgent,
                language: navigator.language,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                created_at: new Date().toISOString(),
                status: 'active',
                tags: [leadData.source, leadData.medium],
                custom_fields: {
                    signup_page: window.location.pathname,
                    referrer: document.referrer,
                    time_on_site: this.timeOnSite,
                    page_views: this.pageViewCount
                }
            };
            
            // Store in Supabase
            if (this.supabase) {
                const { data, error } = await this.supabase
                    .from('leads')
                    .insert([leadRecord])
                    .select()
                    .single();
                
                if (error) {
                    throw error;
                }
                
                leadRecord.id = data.id;
            }
            
            // Store in localStorage as backup
            const storedLeads = JSON.parse(localStorage.getItem('blendworks_leads') || '[]');
            storedLeads.push(leadRecord);
            localStorage.setItem('blendworks_leads', JSON.stringify(storedLeads));
            
            console.log(`📧 Lead created: ${leadRecord.email}`);
            
            return {
                success: true,
                lead: leadRecord
            };
            
        } catch (error) {
            console.error('❌ Lead creation failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async checkExistingLead(email) {
        try {
            if (this.supabase) {
                const { data, error } = await this.supabase
                    .from('leads')
                    .select('*')
                    .eq('email', email.toLowerCase().trim())
                    .single();
                
                if (!error && data) {
                    return data;
                }
            }
            
            // Check localStorage
            const storedLeads = JSON.parse(localStorage.getItem('blendworks_leads') || '[]');
            return storedLeads.find(lead => lead.email === email.toLowerCase().trim());
            
        } catch (error) {
            console.warn('⚠️ Failed to check existing lead:', error);
            return null;
        }
    }

    async deliverLeadMagnet(magnet, leadData) {
        try {
            const deliveryMethods = {
                freeCredits: () => this.deliverFreeCredits(leadData),
                guide: () => this.deliverGuide(leadData),
                trial: () => this.deliverTrial(leadData)
            };
            
            const magnetType = Object.keys(this.leadMagnets).find(key => 
                this.leadMagnets[key] === magnet
            );
            
            const deliveryMethod = deliveryMethods[magnetType];
            if (deliveryMethod) {
                await deliveryMethod();
            }
            
        } catch (error) {
            console.error('❌ Lead magnet delivery failed:', error);
        }
    }

    async deliverFreeCredits(leadData) {
        // Add 100 free credits to user account
        const freeCredits = 100;
        
        try {
            if (this.supabase) {
                // Check if user already exists
                const { data: existingUser } = await this.supabase
                    .from('users')
                    .select('*')
                    .eq('email', leadData.email)
                    .single();
                
                if (existingUser) {
                    // Add credits to existing user
                    const newCredits = (existingUser.credits || 0) + freeCredits;
                    await this.supabase
                        .from('users')
                        .update({ credits: newCredits })
                        .eq('email', leadData.email);
                } else {
                    // Create new user with free credits
                    await this.supabase
                        .from('users')
                        .insert([{
                            email: leadData.email,
                            name: leadData.name,
                            credits: freeCredits,
                            plan: 'free',
                            created_at: new Date().toISOString()
                        }]);
                }
            }
            
            // Store in localStorage
            localStorage.setItem('blendworks_user_credits', freeCredits.toString());
            localStorage.setItem('blendworks_free_credits_claimed', 'true');
            
            console.log(`🎁 Delivered ${freeCredits} free credits to ${leadData.email}`);
            
        } catch (error) {
            console.error('❌ Free credits delivery failed:', error);
        }
    }

    async deliverGuide(leadData) {
        // Prepare guide download
        const guideContent = this.generateCombinationGuide();
        
        // Create download
        const blob = new Blob([guideContent], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        
        // Trigger download
        const a = document.createElement('a');
        a.href = url;
        a.download = 'BlendWorks-Combination-Guide.md';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log(`📚 Guide delivered to ${leadData.email}`);
    }

    async deliverTrial(leadData) {
        // Set up free trial
        const trialDays = 7;
        const trialCredits = 1000;
        
        try {
            if (this.supabase) {
                const trialEndDate = new Date();
                trialEndDate.setDate(trialEndDate.getDate() + trialDays);
                
                await this.supabase
                    .from('users')
                    .insert([{
                        email: leadData.email,
                        name: leadData.name,
                        credits: trialCredits,
                        plan: 'trial',
                        trial_end: trialEndDate.toISOString(),
                        created_at: new Date().toISOString()
                    }]);
            }
            
            // Store trial data
            localStorage.setItem('blendworks_user_credits', trialCredits.toString());
            localStorage.setItem('blendworks_trial_active', 'true');
            localStorage.setItem('blendworks_trial_end', new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000).toISOString());
            
            console.log(`⚡ Trial activated for ${leadData.email}`);
            
        } catch (error) {
            console.error('❌ Trial delivery failed:', error);
        }
    }

    generateCombinationGuide() {
        return `# The Complete Guide to Professional Combination Generation

## Table of Contents
1. [Introduction](#introduction)
2. [Understanding Combinations](#understanding-combinations)
3. [Best Practices](#best-practices)
4. [Use Cases](#use-cases)
5. [Advanced Techniques](#advanced-techniques)

## Introduction

Welcome to the complete guide to creating professional combinations with BlendWorks!

## Understanding Combinations

Combinations are mathematical arrangements where order doesn't matter...

[Full guide content would continue here]

---

Downloaded from BlendWorks.com
Your professional combination generator

Need help? Contact support@blendworks.com
`;
    }

    showLeadCaptureSuccess(magnet) {
        const modal = document.querySelector('.lead-capture-modal');
        if (!modal) return;
        
        const content = modal.querySelector('.modal-content');
        if (!content) return;
        
        content.innerHTML = `
            <div class="lead-success-content">
                <div class="success-animation">
                    <div class="success-circle">
                        <i class="fas fa-check"></i>
                    </div>
                </div>
                
                <h2>🎉 Success!</h2>
                <p>Thank you! Check your email for your ${magnet.title.replace(/🎁|📚|⚡/g, '').trim()}.</p>
                
                <div class="success-actions">
                    <a href="app.html" class="btn btn-primary">
                        Start Generating Now
                    </a>
                    <button class="btn btn-outline" onclick="window.leadSystem.closeLeadCapture()">
                        Continue Browsing
                    </button>
                </div>
                
                <div class="next-steps">
                    <h3>What's Next?</h3>
                    <div class="steps">
                        <div class="step">
                            <span class="step-number">1</span>
                            <span>Check your email for instant access</span>
                        </div>
                        <div class="step">
                            <span class="step-number">2</span>
                            <span>Create your first combination</span>
                        </div>
                        <div class="step">
                            <span class="step-number">3</span>
                            <span>Explore advanced features</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Auto-close after 5 seconds
        setTimeout(() => {
            this.closeLeadCapture();
        }, 5000);
    }

    showLeadCaptureError(message) {
        const errorElement = document.querySelector('.lead-capture-form .error-message');
        if (errorElement) {
            errorElement.remove();
        }
        
        const form = document.querySelector('.lead-capture-form');
        if (form) {
            const error = window.utils.createElement('div', {
                className: 'error-message',
                textContent: message,
                style: 'color: var(--error); margin-top: 1rem; font-size: 0.9rem;'
            });
            
            form.appendChild(error);
            
            // Remove error after 5 seconds
            setTimeout(() => {
                error.remove();
            }, 5000);
        }
    }

    setFormLoading(form, loading) {
        const submitBtn = form.querySelector('.lead-submit-btn');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoading = submitBtn.querySelector('.btn-loading');
        
        if (loading) {
            submitBtn.disabled = true;
            btnText.style.display = 'none';
            btnLoading.style.display = 'inline-flex';
        } else {
            submitBtn.disabled = false;
            btnText.style.display = 'inline';
            btnLoading.style.display = 'none';
        }
    }

    closeLeadCapture() {
        const modal = document.querySelector('.lead-capture-modal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => {
                modal.remove();
            }, 300);
        }
    }

    // Utility methods
    selectLeadMagnet() {
        // A/B test different lead magnets
        const magnets = Object.values(this.leadMagnets);
        const savedVariant = localStorage.getItem('blendworks_lead_variant');
        
        if (savedVariant) {
            return magnets.find(m => m.variant === savedVariant) || magnets[0];
        }
        
        // Random selection for new visitors
        const selectedMagnet = magnets[Math.floor(Math.random() * magnets.length)];
        localStorage.setItem('blendworks_lead_variant', selectedMagnet.variant);
        
        return selectedMagnet;
    }

    generateSessionId() {
        return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    generateLeadId() {
        return 'lead_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    async getClientIP() {
        try {
            const response = await fetch('https://ipapi.co/ip/');
            return await response.text();
        } catch {
            return 'unknown';
        }
    }

    startSessionTracking() {
        // Track session data every 30 seconds
        setInterval(() => {
            this.updateSessionData();
        }, 30000);
        
        // Track before page unload
        window.addEventListener('beforeunload', () => {
            this.endSession();
        });
    }

    updateSessionData() {
        const sessionData = {
            session_id: this.sessionId,
            time_on_site: Date.now() - this.siteEntryTime,
            page_views: this.pageViewCount,
            lead_source: this.leadSource,
            lead_medium: this.leadMedium,
            lead_campaign: this.leadCampaign,
            last_activity: new Date().toISOString()
        };
        
        sessionStorage.setItem('blendworks_session', JSON.stringify(sessionData));
    }

    endSession() {
        const sessionData = JSON.parse(sessionStorage.getItem('blendworks_session') || '{}');
        sessionData.ended_at = new Date().toISOString();
        sessionData.final_time_on_site = Date.now() - this.siteEntryTime;
        
        // Store final session data
        if (this.supabase) {
            // Would normally store in database
            console.log('📊 Session ended:', sessionData);
        }
    }

    trackLeadCaptureTrigger(trigger, data) {
        if (window.analytics) {
            window.analytics.trackEvent('lead_capture_triggered', {
                trigger: trigger,
                session_id: this.sessionId,
                time_on_site: this.timeOnSite,
                page_views: this.pageViewCount,
                ...data
            });
        }
    }

    trackLeadConversion(leadData, magnet, trigger) {
        if (window.analytics) {
            window.analytics.trackEvent('lead_converted', {
                lead_id: leadData.id,
                email: leadData.email,
                magnet_type: Object.keys(this.leadMagnets).find(key => this.leadMagnets[key] === magnet),
                magnet_variant: magnet.variant,
                trigger: trigger,
                source: leadData.source,
                medium: leadData.medium,
                campaign: leadData.campaign,
                session_id: this.sessionId
            });
        }
        
        // Track conversion with advertising platforms
        this.trackConversionPixels(leadData);
    }

    trackConversionPixels(leadData) {
        // Google Analytics conversion
        if (typeof gtag !== 'undefined') {
            gtag('event', 'sign_up', {
                method: leadData.source,
                event_category: 'engagement',
                event_label: leadData.medium
            });
        }
        
        // Facebook Pixel conversion
        if (typeof fbq !== 'undefined') {
            fbq('track', 'Lead', {
                content_name: 'Email Signup',
                content_category: 'Lead Magnet',
                value: 1,
                currency: 'USD'
            });
        }
    }

    async handleFormSubmission(form) {
        // Generic form handler for any lead capture form
        const formData = new FormData(form);
        const email = formData.get('email');
        const name = formData.get('name') || formData.get('firstName');
        
        if (!email) {
            window.utils.showToast('Please enter your email address', 'warning');
            return;
        }
        
        try {
            const leadData = await this.createLead({
                email: email,
                name: name,
                source: this.leadSource,
                medium: this.leadMedium,
                campaign: this.leadCampaign,
                magnet_type: 'form_signup',
                trigger: 'form_submission',
                page_url: window.location.href,
                session_id: this.sessionId
            });
            
            if (leadData.success) {
                window.utils.showToast('🎉 Thank you! Check your email for access.', 'success');
                form.reset();
                
                // Store lead
                this.currentLead = leadData.lead;
                localStorage.setItem('blendworks_lead_email', email);
                localStorage.setItem('blendworks_lead_id', leadData.lead.id);
                
                // Track conversion
                this.trackLeadConversion(leadData.lead, { variant: 'form' }, 'form_submission');
            }
            
        } catch (error) {
            window.utils.showToast('Failed to submit. Please try again.', 'error');
        }
    }

    async handleNewsletterSignup(form) {
        return this.handleFormSubmission(form);
    }

    async handleEarlyAccessSignup(form) {
        const formData = new FormData(form);
        const email = formData.get('email');
        
        try {
            const leadData = await this.createLead({
                email: email,
                source: this.leadSource,
                medium: this.leadMedium,
                campaign: this.leadCampaign,
                magnet_type: 'early_access',
                trigger: 'early_access_form',
                page_url: window.location.href,
                session_id: this.sessionId
            });
            
            if (leadData.success) {
                // Deliver early access
                await this.deliverFreeCredits(leadData.lead);
                window.utils.showToast('🚀 Welcome to early access! You have 100 free credits.', 'success');
                
                // Redirect to app
                setTimeout(() => {
                    window.location.href = 'app.html?welcome=true';
                }, 2000);
            }
            
        } catch (error) {
            window.utils.showToast('Failed to join early access. Please try again.', 'error');
        }
    }

    async updateLeadActivity(leadId) {
        if (!this.supabase) return;
        
        try {
            await this.supabase
                .from('leads')
                .update({ 
                    last_seen: new Date().toISOString(),
                    visit_count: this.supabase.rpc('increment_visit_count', { lead_id: leadId })
                })
                .eq('id', leadId);
                
        } catch (error) {
            console.warn('⚠️ Failed to update lead activity:', error);
        }
    }

    // Public API
    getCurrentLead() {
        return this.currentLead;
    }

    isLeadCaptured() {
        return !!this.currentLead;
    }

    getLeadEmail() {
        return this.currentLead?.email || localStorage.getItem('blendworks_lead_email');
    }
}

// Initialize lead system
window.leadSystem = new BlendWorksLeadSystem();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.leadSystem.init();
    });
} else {
    window.leadSystem.init();
}

console.log('📧 BlendWorks Lead System loaded - Updated 2025-06-07 22:45:14 by AnesDiego');