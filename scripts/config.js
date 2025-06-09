// Configurações globais da aplicação
const AppConfig = {
    // Configurações do plano gratuito
    FREE_LIMITS: {
        LISTS: 3,
        ITEMS_PER_LIST: 20,
        COMBINATIONS: 5000
    },
    
    // Configurações de tema
    THEME: {
        DEFAULT: 'dark-purple'
    },
    
    // Configurações de idioma
    LANGUAGE: {
        DEFAULT: 'pt-br',
        AVAILABLE: ['pt-br', 'en-us', 'es-es']
    },
    
    // Configurações de anúncios
    ADS: {
        ENABLED: true,
        GOOGLE_ADSENSE_ID: 'seu-id-adsense'
    },
    
    // URLs e links
    LINKS: {
        ABOUT: '#',
        CONTACT: '#',
        PRIVACY: '#',
        PREMIUM: '#premium-section'
    },
    
    // Configurações do site
    SITE: {
        NAME: 'SeuSite.com',
        YEAR: '2025',
        VERSION: '1.0.0'
    }
};

// Funções utilitárias
const Utils = {
    getCurrentLanguage() {
        return localStorage.getItem('language') || AppConfig.LANGUAGE.DEFAULT;
    },
    
    setLanguage(lang) {
        localStorage.setItem('language', lang);
    },
    
    getCurrentTheme() {
        return localStorage.getItem('theme') || AppConfig.THEME.DEFAULT;
    },
    
    setTheme(theme) {
        localStorage.setItem('theme', theme);
    }
};