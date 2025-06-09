// Componente Header
class Header {
    constructor() {
        this.isMenuOpen = false;
        this.init();
    }

    init() {
        this.render();
        this.attachEvents();
    }

    render() {
        const headerElement = document.getElementById('main-header');
        headerElement.innerHTML = `
            <nav class="navbar">
                <div class="nav-container">
                    <div class="nav-logo">
                        <a href="/">${AppConfig.SITE.NAME}</a>
                    </div>
                    <div class="nav-menu ${this.isMenuOpen ? 'active' : ''}">
                        <a href="/" class="nav-link">${t('mainTitle')}</a>
                        <a href="${AppConfig.LINKS.ABOUT}" class="nav-link">${t('aboutLink')}</a>
                        <a href="${AppConfig.LINKS.CONTACT}" class="nav-link">${t('contactLink')}</a>
                        <a href="${AppConfig.LINKS.PREMIUM}" class="nav-link premium">${t('premiumBtn')}</a>
                    </div>
                    <div class="nav-toggle">
                        <span class="bar"></span>
                        <span class="bar"></span>
                        <span class="bar"></span>
                    </div>
                </div>
            </nav>
        `;

        // Adicionar estilos do header
        this.addStyles();
    }

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .navbar {
                background-color: var(--bg-secondary);
                border-bottom: 1px solid var(--border-dark);
                padding: 1rem 0;
            }

            .nav-container {
                max-width: 1200px;
                margin: 0 auto;
                padding: 0 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .nav-logo a {
                font-size: 1.5rem;
                font-weight: bold;
                color: var(--purple-btn);
                text-decoration: none;
            }

            .nav-menu {
                display: flex;
                gap: 2rem;
                align-items: center;
            }

            .nav-link {
                color: var(--text-light);
                text-decoration: none;
                transition: color var(--transition-fast);
            }

            .nav-link:hover {
                color: var(--purple-btn);
            }

            .nav-link.premium {
                background-color: var(--purple-btn);
                color: white;
                padding: 8px 16px;
                border-radius: 5px;
                transition: all var(--transition-fast);
            }

            .nav-link.premium:hover {
                background-color: var(--purple-btn-hover);
                transform: translateY(-2px);
            }

            .nav-toggle {
                display: none;
                flex-direction: column;
                cursor: pointer;
            }

            .bar {
                width: 25px;
                height: 3px;
                background-color: var(--text-light);
                margin: 3px 0;
                transition: 0.3s;
            }

            @media (max-width: 768px) {
                .nav-menu {
                    position: fixed;
                    left: -100%;
                    top: 70px;
                    flex-direction: column;
                    background-color: var(--bg-secondary);
                    width: 100%;
                    text-align: center;
                    transition: 0.3s;
                    box-shadow: 0 10px 27px rgba(0,0,0,0.05);
                    padding: 2rem 0;
                    border-bottom: 1px solid var(--border-dark);
                }

                .nav-menu.active {
                    left: 0;
                }

                .nav-toggle {
                    display: flex;
                }

                .nav-toggle.active .bar:nth-child(2) {
                    opacity: 0;
                }

                .nav-toggle.active .bar:nth-child(1) {
                    transform: translateY(8px) rotate(45deg);
                }

                .nav-toggle.active .bar:nth-child(3) {
                    transform: translateY(-8px) rotate(-45deg);
                }
            }
        `;
        document.head.appendChild(style);
    }

    attachEvents() {
        const navToggle = document.querySelector('.nav-toggle');
        const navMenu = document.querySelector('.nav-menu');

        navToggle.addEventListener('click', () => {
            this.isMenuOpen = !this.isMenuOpen;
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
        });

        // Fechar menu ao clicar em um link (mobile)
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                if (this.isMenuOpen) {
                    this.isMenuOpen = false;
                    navMenu.classList.remove('active');
                    navToggle.classList.remove('active');
                }
            });
        });
    }
}

// Inicializar header quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    new Header();
});