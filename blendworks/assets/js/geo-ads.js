/**
 * BlendWorks Geo-Targeted Ads System
 * Optimizes ad placement and revenue based on user location
 */

class BlendWorksGeoAds {
    constructor() {
        this.userCountry = null;
        this.userCurrency = null;
        this.adConfig = {};
        this.adPerformance = {};
        this.isAdBlockerDetected = false;
        this.revenueTracking = {
            impressions: 0,
            clicks: 0,
            revenue: 0
        };
    }

    async init() {
        console.log('💰 Initializing Geo-Targeted Ads System...');
        
        try {
            await this.detectUserLocation();
            await this.detectAdBlocker();
            this.configureAdsForCountry();
            this.setupAdContainers();
            this.initializeAdSense();
            this.setupRevenueTracking();
            this.optimizeAdPlacement();
            
            console.log('✅ Geo-Ads System initialized');
        } catch (error) {
            console.error('❌ Geo-Ads initialization failed:', error);
        }
    }

    async detectUserLocation() {
        try {
            // First try to get from document (set by analytics)
            this.userCountry = document.documentElement.getAttribute('data-country');
            this.userCurrency = document.documentElement.getAttribute('data-currency');
            
            if (!this.userCountry) {
                const response = await fetch('https://ipapi.co/json/');
                const data = await response.json();
                
                this.userCountry = data.country_code;
                this.userCurrency = data.currency;
                
                // Update document attributes
                document.documentElement.setAttribute('data-country', this.userCountry);
                document.documentElement.setAttribute('data-currency', this.userCurrency);
            }
            
            console.log(`📍 Ads targeting: ${this.userCountry} (${this.userCurrency})`);
            
        } catch (error) {
            console.warn('⚠️ Location detection failed for ads:', error);
            this.userCountry = 'US';
            this.userCurrency = 'USD';
        }
    }

    async detectAdBlocker() {
        try {
            // Create a test ad element
            const testAd = document.createElement('div');
            testAd.innerHTML = '&nbsp;';
            testAd.className = 'adsbox';
            testAd.style.position = 'absolute';
            testAd.style.left = '-10000px';
            
            document.body.appendChild(testAd);
            
            // Check if ad blocker blocked it
            setTimeout(() => {
                this.isAdBlockerDetected = testAd.offsetHeight === 0;
                document.body.removeChild(testAd);
                
                if (this.isAdBlockerDetected) {
                    console.log('🚫 Ad blocker detected');
                    this.handleAdBlocker();
                } else {
                    console.log('✅ No ad blocker detected');
                }
            }, 100);
            
        } catch (error) {
            console.warn('Ad blocker detection failed:', error);
        }
    }

    configureAdsForCountry() {
        this.adConfig = this.getAdConfig(this.userCountry);
        console.log(`⚙️ Ad config for ${this.userCountry}:`, this.adConfig);
    }

    getAdConfig(country) {
        const configs = {
            // Tier 1 Countries - High CPM ($3-8)
            'US': {
                tier: 1,
                cpm: 5.5,
                maxAds: 4,
                adTypes: ['display', 'video', 'native', 'auto'],
                targeting: 'business-tools,productivity,saas',
                currency: 'USD',
                showSidebar: true,
                showVideo: true,
                priority: 'high'
            },
            'CA': {
                tier: 1,
                cpm: 4.2,
                maxAds: 4,
                adTypes: ['display', 'video', 'native'],
                targeting: 'business-tools,productivity',
                currency: 'CAD',
                showSidebar: true,
                showVideo: true,
                priority: 'high'
            },
            'GB': {
                tier: 1,
                cpm: 4.8,
                maxAds: 4,
                adTypes: ['display', 'video', 'native'],
                targeting: 'business,startups,productivity',
                currency: 'GBP',
                showSidebar: true,
                showVideo: true,
                priority: 'high'
            },
            'AU': {
                tier: 1,
                cpm: 4.1,
                maxAds: 3,
                adTypes: ['display', 'native'],
                targeting: 'business-software',
                currency: 'AUD',
                showSidebar: true,
                showVideo: false,
                priority: 'high'
            },
            'DE': {
                tier: 1,
                cpm: 3.8,
                maxAds: 3,
                adTypes: ['display', 'native'],
                targeting: 'engineering,business-software',
                currency: 'EUR',
                showSidebar: true,
                showVideo: false,
                priority: 'high'
            },
            'NL': {
                tier: 1,
                cpm: 3.5,
                maxAds: 3,
                adTypes: ['display'],
                targeting: 'business,tech',
                currency: 'EUR',
                showSidebar: true,
                showVideo: false,
                priority: 'medium'
            },
            'SE': {
                tier: 1,
                cpm: 3.2,
                maxAds: 2,
                adTypes: ['display'],
                targeting: 'tech,business',
                currency: 'SEK',
                showSidebar: false,
                showVideo: false,
                priority: 'medium'
            },

            // Tier 2 Countries - Medium CPM ($1-3)
            'BR': {
                tier: 2,
                cpm: 1.8,
                maxAds: 2,
                adTypes: ['display', 'native'],
                targeting: 'empreendedorismo,marketing-digital',
                currency: 'BRL',
                showSidebar: false,
                showVideo: false,
                priority: 'medium'
            },
            'ES': {
                tier: 2,
                cpm: 2.1,
                maxAds: 3,
                adTypes: ['display', 'native'],
                targeting: 'startups,marketing',
                currency: 'EUR',
                showSidebar: false,
                showVideo: false,
                priority: 'medium'
            },
            'FR': {
                tier: 2,
                cpm: 2.4,
                maxAds: 3,
                adTypes: ['display', 'native'],
                targeting: 'business,technologie',
                currency: 'EUR',
                showSidebar: false,
                showVideo: false,
                priority: 'medium'
            },
            'IT': {
                tier: 2,
                cpm: 1.9,
                maxAds: 2,
                adTypes: ['display'],
                targeting: 'business,sviluppo',
                currency: 'EUR',
                showSidebar: false,
                showVideo: false,
                priority: 'low'
            },
            'JP': {
                tier: 2,
                cpm: 2.8,
                maxAds: 3,
                adTypes: ['display', 'native'],
                targeting: 'business,technology',
                currency: 'JPY',
                showSidebar: false,
                showVideo: false,
                priority: 'medium'
            },
            'KR': {
                tier: 2,
                cpm: 2.3,
                maxAds: 2,
                adTypes: ['display'],
                targeting: 'tech,business',
                currency: 'KRW',
                showSidebar: false,
                showVideo: false,
                priority: 'low'
            },

            // Default for other countries - Low CPM
            'default': {
                tier: 3,
                cpm: 0.8,
                maxAds: 1,
                adTypes: ['display'],
                targeting: 'general',
                currency: 'USD',
                showSidebar: false,
                showVideo: false,
                priority: 'low'
            }
        };

        return configs[country] || configs['default'];
    }

    setupAdContainers() {
        const adContainers = document.querySelectorAll('.ad-container');
        let visibleAds = 0;

        adContainers.forEach((container, index) => {
            // Hide excess ads based on country tier
            if (visibleAds >= this.adConfig.maxAds) {
                container.style.display = 'none';
                return;
            }

            // Configure specific ad types
            if (container.classList.contains('sidebar-ad') && !this.adConfig.showSidebar) {
                container.style.display = 'none';
                return;
            }

            if (container.classList.contains('video-ad') && !this.adConfig.showVideo) {
                container.style.display = 'none';
                return;
            }

            // Show the ad and configure it
            container.style.display = 'flex';
            this.configureAdContainer(container, index);
            visibleAds++;
        });

        console.log(`📺 Configured ${visibleAds} ads for ${this.userCountry}`);
    }

    configureAdContainer(container, index) {
        const adSlot = container.querySelector('.adsbygoogle');
        
        if (adSlot) {
            // Set country targeting
            adSlot.setAttribute('data-country-targeting', this.getCountryTargeting());
            
            // Set ad keywords based on country
            if (this.adConfig.targeting) {
                adSlot.setAttribute('data-ad-keywords', this.adConfig.targeting);
            }

            // Set ad format based on container type
            if (container.classList.contains('header-ad')) {
                adSlot.setAttribute('data-ad-format', 'horizontal');
                adSlot.setAttribute('data-full-width-responsive', 'true');
            } else if (container.classList.contains('sidebar-ad')) {
                adSlot.setAttribute('data-ad-format', 'rectangle');
                adSlot.style.width = '300px';
                adSlot.style.height = '600px';
            } else if (container.classList.contains('footer-ad')) {
                adSlot.setAttribute('data-ad-format', 'horizontal');
            }

            // Add performance tracking
            this.setupAdPerformanceTracking(adSlot, index);
        }
    }

    getCountryTargeting() {
        const tier1 = 'US,CA,GB,AU,DE,NL,SE,NO,DK,CH,AT,BE,FI';
        const tier2 = 'ES,IT,FR,BR,MX,AR,JP,KR,SG,HK,TW';
        
        switch (this.adConfig.tier) {
            case 1: return tier1;
            case 2: return `${tier1},${tier2}`;
            default: return 'worldwide';
        }
    }

    initializeAdSense() {
        if (this.isAdBlockerDetected) {
            console.log('🚫 Skipping AdSense initialization (ad blocker detected)');
            return;
        }

        try {
            // Initialize AdSense ads
            if (window.adsbygoogle) {
                document.querySelectorAll('.adsbygoogle').forEach(ad => {
                    if (!ad.dataset.adsbygoogleStatus) {
                        (window.adsbygoogle = window.adsbygoogle || []).push({});
                    }
                });
            }

            // Setup auto ads for high-tier countries
            if (this.adConfig.tier === 1) {
                this.enableAutoAds();
            }

            console.log('📺 AdSense initialized');

        } catch (error) {
            console.error('AdSense initialization failed:', error);
        }
    }

    enableAutoAds() {
        try {
            (window.adsbygoogle = window.adsbygoogle || []).push({
                google_ad_client: "ca-pub-XXXXXXXXXXXXXXXX",
                enable_page_level_ads: true,
                overlays: {bottom: true},
                sticky_ads: this.adConfig.showSidebar
            });

            console.log('🤖 Auto ads enabled for tier 1 country');

        } catch (error) {
            console.error('Auto ads setup failed:', error);
        }
    }

    setupAdPerformanceTracking(adSlot, index) {
        const adId = `ad_${index}_${this.userCountry}`;
        
        // Track ad impressions
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !adSlot.dataset.impressionTracked) {
                    adSlot.dataset.impressionTracked = 'true';
                    this.trackAdImpression(adId);
                }
            });
        }, { threshold: 0.5 });

        observer.observe(adSlot);

        // Track ad clicks
        adSlot.addEventListener('click', () => {
            this.trackAdClick(adId);
        });
    }

    setupRevenueTracking() {
        // Track estimated revenue based on impressions and country CPM
        setInterval(() => {
            this.calculateEstimatedRevenue();
        }, 60000); // Every minute

        // Track when user leaves page
        window.addEventListener('beforeunload', () => {
            this.reportRevenueStats();
        });
    }

    optimizeAdPlacement() {
        // Dynamic optimization based on user behavior
        setTimeout(() => {
            this.optimizeForEngagement();
        }, 30000); // After 30 seconds

        // Time-based optimization
        this.optimizeForTimeOfDay();
        
        // Device-based optimization
        this.optimizeForDevice();
    }

    optimizeForEngagement() {
        const engagement = this.getUserEngagement();
        
        if (engagement.high && this.adConfig.tier >= 2) {
            // Show additional ads for highly engaged users
            this.enableAdditionalAds();
        }

        if (engagement.low && this.adConfig.tier === 3) {
            // Reduce ads for low-engagement users in low-CPM countries
            this.reduceAdDensity();
        }
    }

    optimizeForTimeOfDay() {
        const hour = new Date().getHours();
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        
        // Peak hours by region
        const peakHours = {
            'America': [9, 10, 11, 19, 20, 21],
            'Europe': [8, 9, 10, 18, 19, 20],
            'Asia': [10, 11, 12, 20, 21, 22]
        };

        const region = timezone.split('/')[0];
        const isPeakHour = peakHours[region]?.includes(hour);

        if (isPeakHour && this.adConfig.tier >= 2) {
            this.enablePeakHourAds();
        }
    }

    optimizeForDevice() {
        const isMobile = window.innerWidth < 768;
        
        if (isMobile) {
            // Mobile-specific optimizations
            this.optimizeForMobile();
        } else {
            // Desktop-specific optimizations
            this.optimizeForDesktop();
        }
    }

    // Tracking methods
    trackAdImpression(adId) {
        this.revenueTracking.impressions++;
        
        if (window.analytics) {
            window.analytics.trackEvent('ad_impression', {
                ad_id: adId,
                country: this.userCountry,
                tier: this.adConfig.tier,
                cpm: this.adConfig.cpm
            });
        }

        console.log(`👁️ Ad impression: ${adId}`);
    }

    trackAdClick(adId) {
        this.revenueTracking.clicks++;
        
        if (window.analytics) {
            window.analytics.trackEvent('ad_click', {
                ad_id: adId,
                country: this.userCountry,
                tier: this.adConfig.tier,
                estimated_revenue: this.adConfig.cpm * 0.01 // Rough estimate
            });
        }

        console.log(`🖱️ Ad click: ${adId}`);
    }

    calculateEstimatedRevenue() {
        const impressionValue = (this.adConfig.cpm / 1000);
        const clickValue = impressionValue * 20; // Rough multiplier for clicks
        
        this.revenueTracking.revenue = 
            (this.revenueTracking.impressions * impressionValue) +
            (this.revenueTracking.clicks * clickValue);

        console.log(`💰 Estimated revenue: $${this.revenueTracking.revenue.toFixed(4)}`);
    }

    reportRevenueStats() {
        if (window.analytics) {
            window.analytics.trackEvent('ad_session_complete', {
                country: this.userCountry,
                tier: this.adConfig.tier,
                impressions: this.revenueTracking.impressions,
                clicks: this.revenueTracking.clicks,
                estimated_revenue: this.revenueTracking.revenue,
                ctr: this.revenueTracking.clicks / this.revenueTracking.impressions || 0
            });
        }
    }

    // Optimization methods
    getUserEngagement() {
        const timeOnSite = Date.now() - (window.analytics?.startTime || Date.now());
        const scrollDepth = window.analytics?.userBehavior?.scrollDepth || 0;
        const clicks = window.analytics?.userBehavior?.clicksCount || 0;

        return {
            high: timeOnSite > 120000 && scrollDepth > 50 && clicks > 5,
            low: timeOnSite < 30000 && scrollDepth < 25 && clicks < 2
        };
    }

    enableAdditionalAds() {
        // Show hidden ads for engaged users
        const hiddenAds = document.querySelectorAll('.ad-container[style*="display: none"]');
        
        if (hiddenAds.length > 0 && this.revenueTracking.impressions < 10) {
            hiddenAds[0].style.display = 'flex';
            console.log('📺 Enabled additional ad for engaged user');
        }
    }

    reduceAdDensity() {
        // Hide some ads for low-engagement users
        const visibleAds = document.querySelectorAll('.ad-container:not([style*="display: none"])');
        
        if (visibleAds.length > 1) {
            visibleAds[visibleAds.length - 1].style.display = 'none';
            console.log('🙈 Reduced ad density for low-engagement user');
        }
    }

    enablePeakHourAds() {
        // Enable video ads during peak hours for tier 1 countries
        if (this.adConfig.tier === 1) {
            const videoAds = document.querySelectorAll('.video-ad-slot');
            videoAds.forEach(ad => {
                ad.style.display = 'block';
            });
            console.log('🎬 Peak hour video ads enabled');
        }
    }

    optimizeForMobile() {
        // Mobile-specific ad optimizations
        document.querySelectorAll('.sidebar-ad').forEach(ad => {
            ad.style.display = 'none';
        });

        // Enable sticky footer ads on mobile
        const footerAds = document.querySelectorAll('.footer-ad');
        footerAds.forEach(ad => {
            ad.style.position = 'sticky';
            ad.style.bottom = '0';
            ad.style.zIndex = '1000';
        });

        console.log('📱 Mobile ad optimization applied');
    }

    optimizeForDesktop() {
        // Desktop-specific optimizations
        if (this.adConfig.showSidebar) {
            document.querySelectorAll('.sidebar-ad').forEach(ad => {
                ad.style.display = 'flex';
            });
        }

        console.log('💻 Desktop ad optimization applied');
    }

    handleAdBlocker() {
        // Show alternative content for ad blocker users
        const adContainers = document.querySelectorAll('.ad-container');
        
        adContainers.forEach(container => {
            container.innerHTML = `
                <div style="
                    padding: 20px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border-radius: 8px;
                    text-align: center;
                    font-size: 14px;
                ">
                    <h4>❤️ Gosta do BlendWorks?</h4>
                    <p>Considere desabilitar o AdBlock para nos apoiar</p>
                    <small>Anúncios nos ajudam a manter o serviço gratuito</small>
                </div>
            `;
        });

        // Track ad blocker usage
        if (window.analytics) {
            window.analytics.trackEvent('ad_blocker_detected', {
                country: this.userCountry,
                user_agent: navigator.userAgent
            });
        }
    }

    // Public API
    getAdPerformance() {
        return {
            country: this.userCountry,
            tier: this.adConfig.tier,
            cpm: this.adConfig.cpm,
            ...this.revenueTracking,
            ctr: this.revenueTracking.clicks / this.revenueTracking.impressions || 0
        };
    }

    getRevenueProjection(days = 30) {
        const dailyRevenue = this.revenueTracking.revenue;
        return {
            daily: dailyRevenue,
            monthly: dailyRevenue * days,
            currency: this.adConfig.currency
        };
    }
}

// Initialize geo-targeted ads system
window.geoAds = new BlendWorksGeoAds();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.geoAds.init();
    });
} else {
    window.geoAds.init();
}