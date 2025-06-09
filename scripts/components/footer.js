// Componente Footer
class Footer {
    constructor() {
        this.init();
    }

    init() {
        this.render();
    }

    render() {
        const footerElement = document.getElementById('main-footer');
        footerElement.innerHTML = `
            <div class="footer-container">
                <div class="footer-content">
                    <div class="footer-section">
                        <h4>${AppConfig.SITE.NAME}</h4>
                        <p>${t('mainDescription')}</p>
                    </div>
                    <div class="footer-section">
                        <h4>Links</h4>
                        <ul>
                            <li><a href="${AppConfig.LINKS.ABOUT}">${t('aboutLink')}</a></li>
                            <li><a href="${AppConfig.LINKS.CONTACT}">${t('contactLink')}</a></li>
                            <li><a href="${AppConfig.LINKS.PRIVACY}">${t('privacyLink')}</a></li>
                            <li><a href="${AppConfig.LINKS.PREMIUM}" class="premium-link">${t('premiumBtn')}</a></li>
                        </ul>
                    </div>
                </div>
                <div class="footer-bottom">
                    <p>${t('copyright', { year: AppConfig.SITE.YEAR, siteName: AppConfig.SITE.NAME })}</p>
                </div>
            </div>
        `;

        this.addStyles();
    }

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            #main-footer {
                background-color: var(--bg-secondary);
                border-top: 1px solid var(--border-dark);
                margin-top: auto;
            }

            .footer-container {
                max-width: 1200px;
                margin: 0 auto;
                padding: 2rem 20px 1rem;
            }

            .footer-content {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 2rem;
                margin-bottom: 2rem;
            }

            .footer-section h4 {
                color: var(--purple-btn);
                margin-bottom: 1rem;
                font-size: 1.1rem;
            }

            .footer-section p {
                color: var(--text-muted);
                line-height: 1.6;
            }

            .footer-section ul {
                list-style: none;
            }

            .footer-section ul li {
                margin-bottom: 0.5rem;
            }

            .footer-section ul li a {
                color: var(--text-light);
                text-decoration: none;
                transition: color var(--transition-fast);
            }

            .footer-section ul li a:hover {
                color: var(--purple-btn);
            }

            .footer-section ul li a.premium-link {
                color: var(--purple-btn);
                font-weight: bold;
            }

            .footer-bottom {
                border-top: 1px solid var(--border-dark);
                padding-top: 1rem;
                text-align: center;
            }

            .footer-bottom p {
                color: var(--text-muted);
                font-size: 0.9rem;
            }

            @media (max-width: 768px) {
                .footer-content {
                    grid-template-columns: 1fr;
                    text-align: center;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Inicializar footer quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    new Footer();
});