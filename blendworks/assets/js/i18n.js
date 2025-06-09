/**
 * BlendWorks Internationalization System
 * Supports 8 languages with automatic detection and smart fallbacks
 */

class BlendWorksI18n {
    constructor() {
        this.currentLang = 'en';
        this.translations = {};
        this.fallbackLang = 'en';
        this.supportedLanguages = {
            'en': 'English',
            'pt-BR': 'Português',
            'es': 'Español', 
            'de': 'Deutsch',
            'fr': 'Français',
            'ja': '日本語',
            'ko': '한국어',
            'it': 'Italiano'
        };
        this.isLoading = false;
        this.loadingPromise = null;
    }

    async init() {
        console.log('🌍 Initializing i18n system...');
        
        try {
            this.currentLang = this.detectLanguage();
            console.log(`📍 Detected language: ${this.currentLang}`);
            
            await this.loadTranslations(this.currentLang);
            this.updatePage();
            this.updateLanguageSelector();
            this.setupLanguageChangeListener();
            
            console.log('✅ i18n system initialized successfully');
        } catch (error) {
            console.error('❌ i18n initialization failed:', error);
            // Fallback to English
            if (this.currentLang !== this.fallbackLang) {
                await this.loadTranslations(this.fallbackLang);
                this.updatePage();
            }
        }
    }

    detectLanguage() {
        // Priority order for language detection:
        
        // 1. URL parameter (?lang=pt-BR)
        const urlParams = new URLSearchParams(window.location.search);
        const urlLang = urlParams.get('lang');
        if (urlLang && this.isSupported(urlLang)) {
            console.log(`🔗 Language from URL: ${urlLang}`);
            return urlLang;
        }
        
        // 2. LocalStorage (user preference)
        const savedLang = localStorage.getItem('blendworks-language');
        if (savedLang && this.isSupported(savedLang)) {
            console.log(`💾 Language from storage: ${savedLang}`);
            return savedLang;
        }
        
        // 3. Browser language with smart mapping
        const browserLang = navigator.language || navigator.languages[0];
        const mappedLang = this.mapBrowserLanguage(browserLang);
        if (mappedLang) {
            console.log(`🌐 Language from browser: ${browserLang} → ${mappedLang}`);
            return mappedLang;
        }
        
        // 4. Geo-location based (if available)
        const geoLang = this.getLanguageFromCountry();
        if (geoLang) {
            console.log(`📍 Language from geo: ${geoLang}`);
            return geoLang;
        }
        
        // 5. Fallback to English
        console.log(`🔄 Fallback to: ${this.fallbackLang}`);
        return this.fallbackLang;
    }

    mapBrowserLanguage(browserLang) {
        // Direct match
        if (this.isSupported(browserLang)) {
            return browserLang;
        }
        
        // Language mappings for common cases
        const languageMappings = {
            'pt': 'pt-BR',    // Portuguese → Brazilian Portuguese
            'pt-PT': 'pt-BR', // Portugal Portuguese → Brazilian (for now)
            'zh': 'en',       // Chinese → English (until we add Chinese)
            'zh-CN': 'en',
            'zh-TW': 'en',
            'ar': 'en',       // Arabic → English
            'hi': 'en',       // Hindi → English
            'ru': 'en',       // Russian → English (until we add Russian)
            'nl': 'de',       // Dutch → German (similar market)
            'sv': 'de',       // Swedish → German
            'no': 'de',       // Norwegian → German
            'da': 'de',       // Danish → German
            'fi': 'de',       // Finnish → German
        };
        
        // Check direct mapping
        if (languageMappings[browserLang]) {
            return languageMappings[browserLang];
        }
        
        // Check base language (en-US → en)
        const baseLang = browserLang.split('-')[0];
        if (languageMappings[baseLang]) {
            return languageMappings[baseLang];
        }
        
        // Check if base language is supported
        if (this.isSupported(baseLang)) {
            return baseLang;
        }
        
        return null;
    }

    getLanguageFromCountry() {
        // This will be populated by geo-detection
        const countryToLanguage = {
            'BR': 'pt-BR',
            'PT': 'pt-BR',
            'ES': 'es',
            'MX': 'es',
            'AR': 'es',
            'CO': 'es',
            'PE': 'es',
            'VE': 'es',
            'CL': 'es',
            'EC': 'es',
            'GT': 'es',
            'CU': 'es',
            'BO': 'es',
            'DO': 'es',
            'HN': 'es',
            'PY': 'es',
            'SV': 'es',
            'NI': 'es',
            'CR': 'es',
            'PA': 'es',
            'UY': 'es',
            'DE': 'de',
            'AT': 'de',
            'CH': 'de',
            'FR': 'fr',
            'BE': 'fr',
            'CA': 'fr', // Could be English too, but let's start with French
            'IT': 'it',
            'JP': 'ja',
            'KR': 'ko'
        };
        
        const userCountry = document.documentElement.getAttribute('data-country');
        return countryToLanguage[userCountry] || null;
    }

    isSupported(lang) {
        return Object.keys(this.supportedLanguages).includes(lang);
    }

    async loadTranslations(lang) {
        if (this.isLoading && this.loadingPromise) {
            return this.loadingPromise;
        }
        
        this.isLoading = true;
        
        this.loadingPromise = this._loadTranslationsFromServer(lang);
        
        try {
            await this.loadingPromise;
        } finally {
            this.isLoading = false;
            this.loadingPromise = null;
        }
    }

    async _loadTranslationsFromServer(lang) {
        try {
            console.log(`📥 Loading translations for: ${lang}`);
            
            const response = await fetch(`assets/translations/${lang}.json`);
            
            if (!response.ok) {
                throw new Error(`Translation file not found: ${lang}.json (${response.status})`);
            }
            
            const translations = await response.json();
            
            // Validate translation structure
            if (!translations || typeof translations !== 'object') {
                throw new Error(`Invalid translation format for ${lang}`);
            }
            
            this.translations = translations;
            this.currentLang = lang;
            
            // Save user preference
            localStorage.setItem('blendworks-language', lang);
            
            // Update HTML lang attribute
            document.documentElement.lang = lang;
            
            // Track language usage
            if (window.analytics) {
                window.analytics.trackEvent('language_change', {
                    language: lang,
                    method: 'auto_detect'
                });
            }
            
            console.log(`✅ Translations loaded successfully for: ${lang}`);
            
        } catch (error) {
            console.warn(`⚠️ Failed to load ${lang} translations:`, error.message);
            
            // Try fallback language if not already attempting
            if (lang !== this.fallbackLang) {
                console.log(`🔄 Falling back to: ${this.fallbackLang}`);
                await this._loadTranslationsFromServer(this.fallbackLang);
            } else {
                throw new Error(`Critical: Could not load fallback language ${this.fallbackLang}`);
            }
        }
    }

    t(key, params = {}) {
        if (!key) return '';
        
        // Get translation
        let translation = this.getNestedTranslation(key);
        
        // Fallback to key if translation not found
        if (translation === null || translation === undefined) {
            console.warn(`🔍 Translation missing for key: "${key}" in language: ${this.currentLang}`);
            translation = key;
        }
        
        // Replace parameters {name}, {count}, etc.
        if (params && Object.keys(params).length > 0) {
            translation = this.replaceParameters(translation, params);
        }
        
        return translation;
    }

    getNestedTranslation(key) {
        const keys = key.split('.');
        let value = this.translations;
        
        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return null;
            }
        }
        
        return value;
    }

    replaceParameters(text, params) {
        let result = text;
        
        Object.keys(params).forEach(param => {
            const regex = new RegExp(`\\{${param}\\}`, 'g');
            result = result.replace(regex, params[param]);
        });
        
        return result;
    }

    async changeLang(newLang) {
        if (!this.isSupported(newLang) || newLang === this.currentLang) {
            return;
        }
        
        console.log(`🔄 Changing language from ${this.currentLang} to ${newLang}`);
        
        try {
            // Show loading state
            this.showLanguageLoadingState();
            
            await this.loadTranslations(newLang);
            this.updatePage();
            this.updateLanguageSelector();
            this.updateURL(newLang);
            
            // Track language change
            if (window.analytics) {
                window.analytics.trackEvent('language_change', {
                    from: this.currentLang,
                    to: newLang,
                    method: 'manual'
                });
            }
            
            // Hide loading state
            this.hideLanguageLoadingState();
            
            console.log(`✅ Language changed successfully to: ${newLang}`);
            
        } catch (error) {
            console.error('❌ Language change failed:', error);
            this.hideLanguageLoadingState();
            
            // Show user-friendly error
            this.showLanguageError();
        }
    }

    updatePage() {
        console.log('🔄 Updating page translations...');
        
        // Update text content with data-i18n
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const params = element.dataset.i18nParams ? 
                JSON.parse(element.dataset.i18nParams) : {};
            
            element.textContent = this.t(key, params);
        });
        
        // Update HTML content with data-i18n-html
        document.querySelectorAll('[data-i18n-html]').forEach(element => {
            const key = element.getAttribute('data-i18n-html');
            const params = element.dataset.i18nParams ? 
                JSON.parse(element.dataset.i18nParams) : {};
            
            element.innerHTML = this.t(key, params);
        });
        
        // Update placeholders
        document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            element.placeholder = this.t(key);
        });
        
        // Update titles and aria-labels
        document.querySelectorAll('[data-i18n-title]').forEach(element => {
            const key = element.getAttribute('data-i18n-title');
            element.title = this.t(key);
        });
        
        document.querySelectorAll('[data-i18n-aria-label]').forEach(element => {
            const key = element.getAttribute('data-i18n-aria-label');
            element.setAttribute('aria-label', this.t(key));
        });
        
        // Update page title
        const pageTitleElement = document.querySelector('[data-i18n-page-title]');
        if (pageTitleElement) {
            const key = pageTitleElement.getAttribute('data-i18n-page-title');
            document.title = this.t(key);
        }
        
        // Update meta description
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
            const key = 'site.description';
            const translatedDesc = this.t(key);
            if (translatedDesc !== key) {
                metaDesc.setAttribute('content', translatedDesc);
            }
        }
        
        console.log('✅ Page translations updated');
    }

    updateLanguageSelector() {
        const currentFlag = document.querySelector('.current-lang .flag-icon');
        const currentName = document.querySelector('.current-lang .lang-name');
        
        if (currentFlag && currentName) {
            const flagCode = this.getFlagCode(this.currentLang);
            currentFlag.src = `assets/images/flags/${flagCode}.svg`;
            currentFlag.alt = this.supportedLanguages[this.currentLang];
            currentName.textContent = this.supportedLanguages[this.currentLang];
        }
        
        // Update selected state in menu
        document.querySelectorAll('.lang-option').forEach(option => {
            option.classList.remove('selected');
        });
        
        const selectedOption = document.querySelector(`[onclick="changeLang('${this.currentLang}')"]`);
        if (selectedOption) {
            selectedOption.classList.add('selected');
        }
    }

    getFlagCode(lang) {
        const flagMappings = {
            'en': 'us',
            'pt-BR': 'br',
            'es': 'es',
            'de': 'de',
            'fr': 'fr',
            'ja': 'jp',
            'ko': 'kr',
            'it': 'it'
        };
        
        return flagMappings[lang] || 'us';
    }

    updateURL(lang) {
        const url = new URL(window.location);
        url.searchParams.set('lang', lang);
        
        // Use replaceState to avoid adding to history
        window.history.replaceState({}, '', url);
    }

    setupLanguageChangeListener() {
        // Listen for storage events (language changed in another tab)
        window.addEventListener('storage', (e) => {
            if (e.key === 'blendworks-language' && e.newValue !== this.currentLang) {
                this.changeLang(e.newValue);
            }
        });
        
        // Listen for URL changes
        window.addEventListener('popstate', () => {
            const urlParams = new URLSearchParams(window.location.search);
            const urlLang = urlParams.get('lang');
            
            if (urlLang && urlLang !== this.currentLang && this.isSupported(urlLang)) {
                this.changeLang(urlLang);
            }
        });
    }

    showLanguageLoadingState() {
        const selector = document.querySelector('.language-selector');
        if (selector) {
            selector.classList.add('loading');
        }
        
        // Disable language options
        document.querySelectorAll('.lang-option').forEach(option => {
            option.style.pointerEvents = 'none';
            option.style.opacity = '0.6';
        });
    }

    hideLanguageLoadingState() {
        const selector = document.querySelector('.language-selector');
        if (selector) {
            selector.classList.remove('loading');
        }
        
        // Re-enable language options
        document.querySelectorAll('.lang-option').forEach(option => {
            option.style.pointerEvents = '';
            option.style.opacity = '';
        });
    }

    showLanguageError() {
        // Simple toast notification
        const toast = document.createElement('div');
        toast.className = 'language-error-toast';
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
                ❌ Failed to change language. Please try again.
            </div>
        `;
        
        document.body.appendChild(toast);
        
        // Remove after 3 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 3000);
    }

    // Utility methods for external use
    getCurrentLanguage() {
        return this.currentLang;
    }

    getSupportedLanguages() {
        return { ...this.supportedLanguages };
    }

    isRTL() {
        const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
        return rtlLanguages.includes(this.currentLang);
    }

    getLanguageDirection() {
        return this.isRTL() ? 'rtl' : 'ltr';
    }

    formatNumber(number, options = {}) {
        try {
            return new Intl.NumberFormat(this.currentLang, options).format(number);
        } catch (error) {
            return number.toString();
        }
    }

    formatCurrency(amount, currency = 'USD') {
        try {
            return new Intl.NumberFormat(this.currentLang, {
                style: 'currency',
                currency: currency
            }).format(amount);
        } catch (error) {
            return `${currency} ${amount}`;
        }
    }

    formatDate(date, options = {}) {
        try {
            return new Intl.DateTimeFormat(this.currentLang, options).format(date);
        } catch (error) {
            return date.toLocaleDateString();
        }
    }
}

// Global functions for HTML onclick handlers
function changeLang(lang) {
    if (window.i18n) {
        window.i18n.changeLang(lang);
        toggleLanguageMenu(); // Close the menu
    }
}

function toggleLanguageMenu() {
    const menu = document.getElementById('languageMenu');
    if (menu) {
        menu.classList.toggle('active');
    }
    
    // Close menu when clicking outside
    document.addEventListener('click', function closeMenu(e) {
        if (!e.target.closest('.language-selector')) {
            menu.classList.remove('active');
            document.removeEventListener('click', closeMenu);
        }
    });
}

// Initialize the i18n system
window.i18n = new BlendWorksI18n();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.i18n.init();
    });
} else {
    window.i18n.init();
}