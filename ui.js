// ui.js - Handles UI interactions, hamburger menu, and language switching.
// All variables, functions, and comments are in English.

document.addEventListener('DOMContentLoaded', () => {
    const hamburgerButton = document.querySelector('.hamburger-button');
    const menuLinksList = document.querySelector('.navigation-menu .menu-links-list');
    const languageSelector = document.getElementById('languageSelector');

    // Ensure translations object is globally available (expected to be populated by i18n/*.js files)
    // This check is more for robustness during development.
    if (typeof translations === 'undefined') {
        console.error("The global 'translations' object is not defined. Make sure i18n language files are loaded correctly before ui.js.");
        window.translations = {}; // Create a dummy object to prevent further errors in this script
    }


    if (hamburgerButton && menuLinksList) {
        hamburgerButton.addEventListener('click', () => {
            const isExpanded = hamburgerButton.getAttribute('aria-expanded') === 'true' || false;
            hamburgerButton.setAttribute('aria-expanded', !isExpanded);
            menuLinksList.classList.toggle('active');
            hamburgerButton.classList.toggle('active'); 
        });
    }

    function applyTranslations(languageCode) {
        // Ensure 'translations' and the specific language object exist
        if (!window.translations || !window.translations[languageCode]) { 
            console.warn(`UI: Translations for language "${languageCode}" not found or base 'translations' object missing.`);
            return;
        }
        const currentTranslationSet = window.translations[languageCode];
        document.documentElement.lang = languageCode;

        document.querySelectorAll('[data-lang-key]').forEach(element => {
            const key = element.getAttribute('data-lang-key');
            if (currentTranslationSet[key] !== undefined) { 
                if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                    if (element.type === 'submit' || element.type === 'button') {
                         element.value = currentTranslationSet[key];
                    }
                } else {
                    element.innerHTML = currentTranslationSet[key]; 
                }
            } else {
                console.warn(`UI: Translation key "${key}" not found for language "${languageCode}".`);
            }
        });

        document.querySelectorAll('[data-lang-placeholder-key]').forEach(element => {
            const key = element.getAttribute('data-lang-placeholder-key');
            if (currentTranslationSet[key] !== undefined) { 
                element.placeholder = currentTranslationSet[key];
            } else {
                console.warn(`UI: Placeholder key "${key}" not found for language "${languageCode}".`);
            }
        });

        const pageTitleElement = document.querySelector('title[data-lang-key]');
        if (pageTitleElement) {
            const titleKey = pageTitleElement.getAttribute('data-lang-key');
             if (currentTranslationSet[titleKey] !== undefined) { 
                document.title = currentTranslationSet[titleKey];
            }
        }

        // Call the function in script.js to update dynamically generated elements
        if (window.translateDynamicElements) {
            window.translateDynamicElements(languageCode); // Pass languageCode for context
        }
    }
    
    let initialLanguage = 'en'; // Default to English
    if (languageSelector && languageSelector.value) {
        initialLanguage = languageSelector.value; // This will correctly pick 'en' if 'selected' in HTML
    }
    // Apply initial translations once the DOM is fully loaded and i18n files have populated 'translations'
    applyTranslations(initialLanguage);


    if (languageSelector) {
        languageSelector.addEventListener('change', (event) => {
            applyTranslations(event.target.value);
        });
    }

    // Expose global getText function
    window.getText = (key, replacements = {}) => {
        const currentLanguage = (languageSelector && languageSelector.value) ? languageSelector.value : 'en';
        
        // Ensure 'translations' and the specific language set exist before trying to access keys
        if (!window.translations || !window.translations[currentLanguage] || window.translations[currentLanguage][key] === undefined) {
            console.warn(`getText: Missing translation for key: "${key}" in language: "${currentLanguage}". Falling back to key.`);
            return `[${key}]`; // Fallback to show the key itself, making it obvious what's missing
        }
        let text = window.translations[currentLanguage][key];
        for (const placeholder in replacements) {
            text = text.replace(new RegExp(`{${placeholder}}`, 'g'), replacements[placeholder]);
        }
        return text;
    };
});