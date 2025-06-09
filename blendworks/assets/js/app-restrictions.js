/**
 * BlendWorks Restrictions System - Bloqueios por Pacote
 */

class BlendWorksRestrictions {
    constructor() {
        this.userPlan = 'free'; // free, starter, professional, enterprise, mega
        this.userCredits = 0;
        
        // LIMITES EXATOS CONFORME ESPECIFICADO
        this.planLimits = {
            free: {
                maxLists: 0,           // SEM LISTAS no free
                maxItemsPerList: 0,    // SEM ITENS no free
                maxCombinations: 0,    // SEM COMBINAÇÕES no free
                allowedExports: [],    // SEM EXPORTS no free
                canGenerate: false     // NÃO PODE GERAR
            },
            starter: {
                maxLists: 5,           // 5 listas max
                maxItemsPerList: 10,   // 10 itens por lista
                maxCombinations: 10000, // 10K combinações total
                allowedExports: ['txt', 'csv'],
                canGenerate: true
            },
            professional: {
                maxLists: 10,          // 10 listas max
                maxItemsPerList: 20,   // 20 itens por lista
                maxCombinations: 100000, // 100K combinações
                allowedExports: ['txt', 'csv', 'json'],
                canGenerate: true
            },
            enterprise: {
                maxLists: Infinity,    // Ilimitado
                maxItemsPerList: Infinity, // Ilimitado
                maxCombinations: 1000000, // 1M combinações
                allowedExports: ['txt', 'csv', 'json', 'xlsx', 'xml'],
                canGenerate: true
            },
            mega: {
                maxLists: Infinity,    // Ilimitado
                maxItemsPerList: Infinity, // Ilimitado
                maxCombinations: 5000000, // 5M combinações
                allowedExports: ['txt', 'csv', 'json', 'xlsx', 'xml', 'sql'],
                canGenerate: true
            }
        };
    }

    // Bloquear adição de listas
    canAddList() {
        const currentListCount = document.querySelectorAll('.list-container').length;
        const limit = this.planLimits[this.userPlan].maxLists;
        
        if (currentListCount >= limit) {
            this.showUpgradeModal('lists', limit);
            return false;
        }
        return true;
    }

    // Bloquear itens em listas
    canAddItems(listElement, newItemsCount) {
        const limit = this.planLimits[this.userPlan].maxItemsPerList;
        const currentItems = this.countItemsInList(listElement);
        
        if (currentItems + newItemsCount > limit) {
            this.showUpgradeModal('items', limit);
            return false;
        }
        return true;
    }

    // Bloquear geração
    canGenerate(estimatedCombinations) {
        if (!this.planLimits[this.userPlan].canGenerate) {
            this.showUpgradeModal('generate', 0);
            return false;
        }
        
        if (this.userCredits <= 0) {
            this.showUpgradeModal('credits', 0);
            return false;
        }
        
        const limit = this.planLimits[this.userPlan].maxCombinations;
        if (estimatedCombinations > limit) {
            this.showUpgradeModal('combinations', limit);
            return false;
        }
        
        return true;
    }

    // Bloquear exports
    canExport(format) {
        const allowedFormats = this.planLimits[this.userPlan].allowedExports;
        
        if (!allowedFormats.includes(format)) {
            this.showUpgradeModal('export', format);
            return false;
        }
        return true;
    }

    showUpgradeModal(restrictionType, limit) {
        const messages = {
            lists: `Você atingiu o limite de ${limit} listas do seu plano.`,
            items: `Você atingiu o limite de ${limit} itens por lista.`,
            generate: `Você precisa de créditos para gerar combinações.`,
            credits: `Seus créditos acabaram. Compre mais para continuar.`,
            combinations: `Limite de ${limit.toLocaleString()} combinações excedido.`,
            export: `Formato ${format.toUpperCase()} disponível apenas em planos pagos.`
        };

        // Modal de upgrade
        const modal = `
            <div class="upgrade-modal" id="upgradeModal">
                <div class="modal-overlay"></div>
                <div class="modal-content">
                    <h2>🚀 Upgrade Necessário</h2>
                    <p>${messages[restrictionType]}</p>
                    <div class="upgrade-options">
                        <a href="pricing.html" class="btn btn-primary">Ver Planos</a>
                        <button onclick="closeUpgradeModal()" class="btn btn-outline">Fechar</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modal);
        document.getElementById('upgradeModal').classList.add('active');
    }
}