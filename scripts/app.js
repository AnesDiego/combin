// Aplicação principal
class App {
    constructor() {
        this.init();
    }

    init() {
        this.loadTheme();
        this.loadLanguage();
        this.setupGlobalEvents();
    }

    loadTheme() {
        const theme = Utils.getCurrentTheme();
        document.documentElement.setAttribute('data-theme', theme);
    }

    loadLanguage() {
        const language = Utils.getCurrentLanguage();
        // Carregar arquivo de tradução se necessário
        // Por enquanto, já está carregado no HTML
    }

    setupGlobalEvents() {
        // Eventos globais da aplicação
        window.addEventListener('beforeunload', () => {
            // Salvar estado se necessário
        });

        // Tratar erros globais
        window.addEventListener('error', (e) => {
            console.error('Erro global:', e.error);
        });
    }
}

// Inicializar aplicação
document.addEventListener('DOMContentLoaded', () => {
    new App();
});