/**
 * BlendWorks Utility Functions - GitHub Pages Version
 * Core utilities and helpers for the entire application
 */

class BlendWorksUtils {
    constructor() {
        this.cache = new Map();
        this.config = {
            apiTimeout: 10000,
            retryAttempts: 3,
            cacheExpiry: 300000, // 5 minutes
            supportedLanguages: ['en', 'pt-BR', 'es', 'de', 'fr', 'ja', 'ko', 'it'],
            supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'BRL', 'JPY', 'KRW'],
            maxFileSize: 10 * 1024 * 1024, // 10MB
            allowedFileTypes: ['txt', 'csv', 'json', 'xlsx']
        };
    }

    // ===== DATE & TIME UTILITIES =====
    
    formatDate(date, options = {}) {
        try {
            const defaultOptions = {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            };
            
            const mergedOptions = { ...defaultOptions, ...options };
            const locale = this.getCurrentLanguage() || 'en-US';
            
            return new Intl.DateTimeFormat(locale, mergedOptions).format(new Date(date));
        } catch (error) {
            console.warn('Date formatting failed:', error);
            return new Date(date).toLocaleDateString();
        }
    }

    formatRelativeTime(date) {
        try {
            const now = new Date();
            const target = new Date(date);
            const diffInSeconds = Math.floor((now - target) / 1000);
            
            if (diffInSeconds < 60) return 'just now';
            if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
            if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
            if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
            
            return this.formatDate(date, { month: 'short', day: 'numeric' });
        } catch (error) {
            return 'unknown';
        }
    }

    getCurrentTimestamp() {
        return new Date().toISOString();
    }

    // ===== NUMBER & CURRENCY UTILITIES =====
    
    formatNumber(number, options = {}) {
        try {
            const locale = this.getCurrentLanguage() || 'en-US';
            return new Intl.NumberFormat(locale, options).format(number);
        } catch (error) {
            return number.toString();
        }
    }

    formatCurrency(amount, currency = 'USD') {
        try {
            const locale = this.getCurrentLanguage() || 'en-US';
            return new Intl.NumberFormat(locale, {
                style: 'currency',
                currency: currency,
                minimumFractionDigits: currency === 'JPY' || currency === 'KRW' ? 0 : 2
            }).format(amount);
        } catch (error) {
            return `${currency} ${amount}`;
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    formatPercentage(value, total, decimals = 1) {
        if (total === 0) return '0%';
        const percentage = (value / total) * 100;
        return `${percentage.toFixed(decimals)}%`;
    }

    // ===== STRING UTILITIES =====
    
    slugify(text) {
        return text
            .toString()
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '-')
            .replace(/^-+/, '')
            .replace(/-+$/, '');
    }

    capitalizeFirst(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    truncateText(text, maxLength = 100, suffix = '...') {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - suffix.length) + suffix;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    stripHtml(html) {
        const div = document.createElement('div');
        div.innerHTML = html;
        return div.textContent || div.innerText || '';
    }

    generateId(prefix = 'id', length = 8) {
        const chars = '0123456789abcdefghijklmnopqrstuvwxyz';
        let result = prefix + '_';
        for (let i = 0; i < length; i++) {
            result += chars[Math.floor(Math.random() * chars.length)];
        }
        return result;
    }

    // ===== VALIDATION UTILITIES =====
    
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    isValidPhoneNumber(phone) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
    }

    validateFile(file) {
        const errors = [];
        
        // Check file size
        if (file.size > this.config.maxFileSize) {
            errors.push(`File too large. Maximum size: ${this.formatFileSize(this.config.maxFileSize)}`);
        }
        
        // Check file type
        const extension = file.name.split('.').pop().toLowerCase();
        if (!this.config.allowedFileTypes.includes(extension)) {
            errors.push(`Invalid file type. Allowed: ${this.config.allowedFileTypes.join(', ')}`);
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    }

    // ===== ARRAY & OBJECT UTILITIES =====
    
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj);
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        if (typeof obj === 'object') {
            const clonedObj = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    clonedObj[key] = this.deepClone(obj[key]);
                }
            }
            return clonedObj;
        }
    }

    mergeDeep(target, source) {
        const result = { ...target };
        
        for (const key in source) {
            if (source.hasOwnProperty(key)) {
                if (this.isObject(source[key]) && this.isObject(target[key])) {
                    result[key] = this.mergeDeep(target[key], source[key]);
                } else {
                    result[key] = source[key];
                }
            }
        }
        
        return result;
    }

    isObject(item) {
        return item && typeof item === 'object' && !Array.isArray(item) && item !== null;
    }

    groupBy(array, key) {
        return array.reduce((groups, item) => {
            const group = item[key];
            groups[group] = groups[group] || [];
            groups[group].push(item);
            return groups;
        }, {});
    }

    sortBy(array, key, direction = 'asc') {
        return [...array].sort((a, b) => {
            const aVal = a[key];
            const bVal = b[key];
            
            if (direction === 'desc') {
                return bVal > aVal ? 1 : bVal < aVal ? -1 : 0;
            }
            return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
        });
    }

    unique(array) {
        return [...new Set(array)];
    }

    chunk(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }

    // ===== STORAGE UTILITIES =====
    
    setStorage(key, value, type = 'localStorage') {
        try {
            const storage = type === 'sessionStorage' ? sessionStorage : localStorage;
            const serializedValue = JSON.stringify({
                value,
                timestamp: Date.now(),
                expires: type === 'session' ? null : Date.now() + this.config.cacheExpiry
            });
            storage.setItem(`blendworks_${key}`, serializedValue);
            return true;
        } catch (error) {
            console.warn('Storage write failed:', error);
            return false;
        }
    }

    getStorage(key, type = 'localStorage') {
        try {
            const storage = type === 'sessionStorage' ? sessionStorage : localStorage;
            const item = storage.getItem(`blendworks_${key}`);
            
            if (!item) return null;
            
            const parsed = JSON.parse(item);
            
            // Check expiration
            if (parsed.expires && Date.now() > parsed.expires) {
                this.removeStorage(key, type);
                return null;
            }
            
            return parsed.value;
        } catch (error) {
            console.warn('Storage read failed:', error);
            return null;
        }
    }

    removeStorage(key, type = 'localStorage') {
        try {
            const storage = type === 'sessionStorage' ? sessionStorage : localStorage;
            storage.removeItem(`blendworks_${key}`);
            return true;
        } catch (error) {
            console.warn('Storage remove failed:', error);
            return false;
        }
    }

    clearStorage(prefix = 'blendworks_') {
        try {
            const keysToRemove = [];
            
            // Check localStorage
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(prefix)) {
                    keysToRemove.push({ key, storage: 'localStorage' });
                }
            }
            
            // Check sessionStorage
            for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i);
                if (key && key.startsWith(prefix)) {
                    keysToRemove.push({ key, storage: 'sessionStorage' });
                }
            }
            
            // Remove all found keys
            keysToRemove.forEach(({ key, storage }) => {
                window[storage].removeItem(key);
            });
            
            console.log(`🗑️ Cleared ${keysToRemove.length} storage items`);
            return true;
        } catch (error) {
            console.warn('Storage clear failed:', error);
            return false;
        }
    }

    // ===== HTTP UTILITIES =====
    
    async fetchWithRetry(url, options = {}, retries = this.config.retryAttempts) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.apiTimeout);
        
        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            
            if (retries > 0 && !controller.signal.aborted) {
                console.warn(`Request failed, retrying... (${retries} attempts left)`);
                await this.sleep(1000); // Wait 1 second before retry
                return this.fetchWithRetry(url, options, retries - 1);
            }
            
            throw error;
        }
    }

    async fetchJSON(url, options = {}) {
        const response = await this.fetchWithRetry(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
        
        return response.json();
    }

    // ===== CACHE UTILITIES =====
    
    setCache(key, value, ttl = this.config.cacheExpiry) {
        this.cache.set(key, {
            value,
            expires: Date.now() + ttl
        });
    }

    getCache(key) {
        const item = this.cache.get(key);
        
        if (!item) return null;
        
        if (Date.now() > item.expires) {
            this.cache.delete(key);
            return null;
        }
        
        return item.value;
    }

    clearCache() {
        this.cache.clear();
        console.log('🗑️ Memory cache cleared');
    }

    // ===== DOM UTILITIES =====
    
    createElement(tag, attributes = {}, children = []) {
        const element = document.createElement(tag);
        
        // Set attributes
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'innerHTML') {
                element.innerHTML = value;
            } else if (key === 'textContent') {
                element.textContent = value;
            } else if (key.startsWith('on') && typeof value === 'function') {
                element.addEventListener(key.slice(2).toLowerCase(), value);
            } else {
                element.setAttribute(key, value);
            }
        });
        
        // Add children
        children.forEach(child => {
            if (typeof child === 'string') {
                element.appendChild(document.createTextNode(child));
            } else if (child instanceof Node) {
                element.appendChild(child);
            }
        });
        
        return element;
    }

    addCSS(styles) {
        const style = document.createElement('style');
        style.textContent = styles;
        document.head.appendChild(style);
        return style;
    }

    loadScript(src, async = true) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.async = async;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // ===== ANIMATION UTILITIES =====
    
    fadeIn(element, duration = 300) {
        element.style.opacity = '0';
        element.style.display = 'block';
        
        let start = null;
        const animate = (timestamp) => {
            if (!start) start = timestamp;
            const progress = timestamp - start;
            const opacity = Math.min(progress / duration, 1);
            
            element.style.opacity = opacity;
            
            if (progress < duration) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }

    fadeOut(element, duration = 300) {
        let start = null;
        const animate = (timestamp) => {
            if (!start) start = timestamp;
            const progress = timestamp - start;
            const opacity = Math.max(1 - (progress / duration), 0);
            
            element.style.opacity = opacity;
            
            if (progress < duration) {
                requestAnimationFrame(animate);
            } else {
                element.style.display = 'none';
            }
        };
        
        requestAnimationFrame(animate);
    }

    slideDown(element, duration = 300) {
        element.style.overflow = 'hidden';
        element.style.height = '0';
        element.style.display = 'block';
        
        const targetHeight = element.scrollHeight;
        let start = null;
        
        const animate = (timestamp) => {
            if (!start) start = timestamp;
            const progress = timestamp - start;
            const height = Math.min((progress / duration) * targetHeight, targetHeight);
            
            element.style.height = height + 'px';
            
            if (progress < duration) {
                requestAnimationFrame(animate);
            } else {
                element.style.height = '';
                element.style.overflow = '';
            }
        };
        
        requestAnimationFrame(animate);
    }

    // ===== EVENT UTILITIES =====
    
    debounce(func, wait, immediate = false) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func(...args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(...args);
        };
    }

    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // ===== MISC UTILITIES =====
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getCurrentLanguage() {
        return document.documentElement.lang || 
               localStorage.getItem('blendworks-language') || 
               navigator.language || 
               'en';
    }

    getCurrentCountry() {
        return document.documentElement.getAttribute('data-country') || 'US';
    }

    getCurrentCurrency() {
        return document.documentElement.getAttribute('data-currency') || 'USD';
    }

    isMobile() {
        return window.innerWidth < 768;
    }

    isTablet() {
        return window.innerWidth >= 768 && window.innerWidth < 1024;
    }

    isDesktop() {
        return window.innerWidth >= 1024;
    }

    getDeviceType() {
        if (this.isMobile()) return 'mobile';
        if (this.isTablet()) return 'tablet';
        return 'desktop';
    }

    getBrowserInfo() {
        const ua = navigator.userAgent;
        let browser = 'Unknown';
        
        if (ua.includes('Chrome')) browser = 'Chrome';
        else if (ua.includes('Firefox')) browser = 'Firefox';
        else if (ua.includes('Safari')) browser = 'Safari';
        else if (ua.includes('Edge')) browser = 'Edge';
        else if (ua.includes('Opera')) browser = 'Opera';
        
        return {
            browser,
            version: this.getBrowserVersion(ua, browser),
            userAgent: ua,
            language: navigator.language,
            cookieEnabled: navigator.cookieEnabled,
            onLine: navigator.onLine
        };
    }

    getBrowserVersion(ua, browser) {
        const match = ua.match(new RegExp(`${browser}\\/(\\d+\\.\\d+)`));
        return match ? match[1] : 'Unknown';
    }

    copyToClipboard(text) {
        if (navigator.clipboard) {
            return navigator.clipboard.writeText(text);
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            return new Promise((resolve, reject) => {
                if (document.execCommand('copy')) {
                    resolve();
                } else {
                    reject(new Error('Copy failed'));
                }
                document.body.removeChild(textArea);
            });
        }
    }

    downloadFile(content, filename, contentType = 'text/plain') {
        const blob = new Blob([content], { type: contentType });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
    }

    // ===== ERROR HANDLING =====
    
    handleError(error, context = 'Unknown') {
        console.error(`❌ Error in ${context}:`, error);
        
        // Track error if analytics available
        if (window.analytics) {
            window.analytics.trackEvent('error', {
                context,
                message: error.message,
                stack: error.stack,
                userAgent: navigator.userAgent,
                url: window.location.href
            });
        }
        
        // Show user-friendly error message
        this.showToast(`Something went wrong in ${context}. Please try again.`, 'error');
    }

    showToast(message, type = 'info', duration = 4000) {
        const toast = this.createElement('div', {
            className: `toast toast-${type}`,
            innerHTML: `
                <div class="toast-content">
                    <span class="toast-icon">${this.getToastIcon(type)}</span>
                    <span class="toast-message">${message}</span>
                    <button class="toast-close" onclick="this.parentElement.parentElement.remove()">×</button>
                </div>
            `
        });
        
        // Add styles if not already present
        if (!document.getElementById('toast-styles')) {
            this.addCSS(`
                .toast {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 10000;
                    max-width: 400px;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    animation: slideInFromRight 0.3s ease;
                }
                .toast-info { background: #3b82f6; color: white; }
                .toast-success { background: #10b981; color: white; }
                .toast-warning { background: #f59e0b; color: white; }
                .toast-error { background: #ef4444; color: white; }
                .toast-content {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 12px 16px;
                }
                .toast-close {
                    background: none;
                    border: none;
                    color: inherit;
                    cursor: pointer;
                    font-size: 18px;
                    margin-left: auto;
                }
                @keyframes slideInFromRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `).id = 'toast-styles';
        }
        
        document.body.appendChild(toast);
        
        // Auto-remove
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, duration);
        
        return toast;
    }

    getToastIcon(type) {
        const icons = {
            info: 'ℹ️',
            success: '✅',
            warning: '⚠️',
            error: '❌'
        };
        return icons[type] || 'ℹ️';
    }
}

// Create global utils instance
window.utils = new BlendWorksUtils();

// Global helper functions
window.formatDate = (date, options) => window.utils.formatDate(date, options);
window.formatCurrency = (amount, currency) => window.utils.formatCurrency(amount, currency);
window.formatNumber = (number, options) => window.utils.formatNumber(number, options);
window.showToast = (message, type, duration) => window.utils.showToast(message, type, duration);
window.copyToClipboard = (text) => window.utils.copyToClipboard(text);
window.downloadFile = (content, filename, type) => window.utils.downloadFile(content, filename, type);

console.log('🔧 BlendWorks utilities loaded');