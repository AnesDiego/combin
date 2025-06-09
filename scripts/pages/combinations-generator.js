// Página do Gerador de Combinações
class CombinationsGeneratorPage {
    constructor() {
        this.engine = new CombinationsEngine();
        this.listCounter = 0;
        this.init();
    }

    init() {
        this.render();
        this.attachEvents();
        this.addInitialList();
    }

    render() {
        const pageContent = document.getElementById('page-content');
        pageContent.innerHTML = `
            <h1 id="main-title">${t('mainTitle')}</h1>
            <p class="text-center mb-3">${t('mainDescription')}</p>

            <h2>${t('section1Title')}</h2>
            <div id="listInputs"></div>
            <button id="addListBtn" class="btn btn-primary">${t('addListBtn')}</button>
            <p class="mt-1">
                <a href="${AppConfig.LINKS.PREMIUM}">${t('premiumListsLink')}</a>
            </p>

            <h2>${t('section2Title')}</h2>
            <div class="form-group">
                <div class="mb-2">
                    ${t('generationType')}
                    <label><input type="radio" name="generationType" value="combinations" checked> ${t('combinations')}</label>
                    <label><input type="radio" name="generationType" value="permutations"> ${t('permutations')}</label>
                </div>
                <div class="mb-2">
                    ${t('separatorType')}
                    <label><input type="radio" name="separatorType" value="space" checked> ${t('separatorSpace')}</label>
                    <label><input type="radio" name="separatorType" value="comma"> ${t('separatorComma')}</label>
                    <label><input type="radio" name="separatorType" value="hyphen"> ${t('separatorHyphen')}</label>
                    <label><input type="radio" name="separatorType" value="custom"> ${t('separatorCustom')}</label>
                    <input type="text" id="customSeparator" placeholder="${t('separatorCustomPlaceholder')}" style="width: 80px; margin-left: 5px;">
                </div>
                <div class="mb-1">
                    ${t('prefixLabel')} <input type="text" id="prefix" placeholder="${t('prefixPlaceholder')}" style="width: 150px;">
                </div>
                <div>
                    ${t('suffixLabel')} <input type="text" id="suffix" placeholder="${t('suffixPlaceholder')}" style="width: 150px;">
                </div>
            </div>

            <button id="generateBtn" class="btn btn-primary btn-large">${t('generateBtn')}</button>

            <h2>${t('section3Title')}</h2>
            <div class="result-info">${t('totalCombinations')} <span id="totalCombinations">0</span></div>
            <textarea id="results" rows="10" style="width: 100%; min-height: 200px;" readonly></textarea>
            <div class="result-actions">
                <button id="copyResultsBtn" class="btn btn-primary">${t('copyBtn')}</button>
                <button id="downloadCsvBtn" class="btn btn-primary" disabled>${t('downloadCsvBtn')}</button>
            </div>

            <div class="premium-section">
                <h3>${t('premiumTitle')}</h3>
                <p>${t('premiumDescription')}</p>
                <button class="btn btn-primary">${t('premiumBtn')}</button>
            </div>
        `;

        // Configurar elementos de anúncio
        document.getElementById('top-ad').textContent = t('adSpace');
        document.getElementById('bottom-ad').textContent = t('adSpace');
        
        // Configurar título da página
        document.getElementById('page-title').textContent = t('pageTitle');
    }

    attachEvents() {
        document.getElementById('addListBtn').addEventListener('click', () => this.addList());
        document.getElementById('generateBtn').addEventListener('click', () => this.generate());
        document.getElementById('copyResultsBtn').addEventListener('click', () => this.copyResults());
        document.getElementById('downloadCsvBtn').addEventListener('click', () => this.downloadCsv());
    }

    addList() {
        if (this.listCounter >= AppConfig.FREE_LIMITS.LISTS) {
            alert(t('listsLimitError', { limit: AppConfig.FREE_LIMITS.LISTS }));
            return;
        }

        this.listCounter++;
        const listGroup = document.createElement('div');
        listGroup.className = 'form-group';
        listGroup.dataset.listId = this.listCounter;

        listGroup.innerHTML = `
            <label>${t('listTitle', { number: this.listCounter })}</label>
            <input type="text" class="list-title" placeholder="${t('listTitlePlaceholder')}" style="width: 100%; margin-bottom: 10px;">
            <textarea class="list-items" placeholder="${t('listItemsPlaceholder', { limit: AppConfig.FREE_LIMITS.ITEMS_PER_LIST })}" 
                style="width: 100%; min-height: 80px;" oninput="this.checkItemLimit()"></textarea>
            <div style="text-align: right; margin-top: 10px;">
                <button class="btn btn-danger" onclick="combinationsPage.removeList(${this.listCounter})">${t('removeListBtn')}</button>
            </div>
        `;

        // Adicionar verificação de limite de itens
        const textarea = listGroup.querySelector('.list-items');
        textarea.checkItemLimit = () => this.checkItemLimit(textarea);

        document.getElementById('listInputs').appendChild(listGroup);

        // Desabilitar botão se atingir limite
        if (this.listCounter >= AppConfig.FREE_LIMITS.LISTS) {
            document.getElementById('addListBtn').disabled = true;
        }
    }

    removeList(id) {
        const listGroup = document.querySelector(`.form-group[data-list-id="${id}"]`);
        if (listGroup) {
            listGroup.remove();
            this.listCounter--;
            document.getElementById('addListBtn').disabled = false;
        }
    }

    addInitialList() {
        this.addList();
    }

    checkItemLimit(textarea) {
        const items = textarea.value.split('\n').filter(item => item.trim() !== '');
        if (items.length > AppConfig.FREE_LIMITS.ITEMS_PER_LIST) {
            alert(t('itemsLimitError', { limit: AppConfig.FREE_LIMITS.ITEMS_PER_LIST }));
            textarea.value = items.slice(0, AppConfig.FREE_LIMITS.ITEMS_PER_LIST).join('\n');
        }
    }

    generate() {
        try {
            // Limpar listas anteriores
            this.engine.clearLists();

            // Coletar dados das listas
            document.querySelectorAll('.form-group[data-list-id]').forEach(group => {
                const title = group.querySelector('.list-title').value;
                const items = group.querySelector('.list-items').value;
                if (items.trim()) {
                    this.engine.addList(items, title);
                }
            });

            // Configurar geração
            const type = document.querySelector('input[name="generationType"]:checked').value;
            let separator = document.querySelector('input[name="separatorType"]:checked').value;
            
            if (separator === 'custom') {
                separator = document.getElementById('customSeparator').value || ' ';
            } else {
                const separatorMap = {
                    space: ' ',
                    comma: ',',
                    hyphen: '-'
                };
                separator = separatorMap[separator];
            }

            const prefix = document.getElementById('prefix').value;
            const suffix = document.getElementById('suffix').value;

            this.engine.setConfig({ type, separator, prefix, suffix });

            // Validar limites
            const errors = this.engine.validateFreeLimits();
            if (errors.length > 0) {
                // Tratar erros de limite
                return;
            }

            // Gerar com limite
            const result = this.engine.generateWithLimit(AppConfig.FREE_LIMITS.COMBINATIONS);

            // Exibir resultados
            document.getElementById('results').value = result.results.join('\n');
            
            if (result.truncated) {
                document.getElementById('totalCombinations').textContent = 
                    `${result.truncatedAt} (${t('combinationsLimitError', { 
                        limit: AppConfig.FREE_LIMITS.COMBINATIONS, 
                        total: result.total 
                    })})`;
            } else {
                document.getElementById('totalCombinations').textContent = result.total;
            }

        } catch (error) {
            if (error.message === 'NO_LISTS') {
                alert(t('noListsError'));
            } else {
                console.error('Erro na geração:', error);
            }
        }
    }

    copyResults() {
        const results = document.getElementById('results');
        results.select();
        document.execCommand('copy');
        alert(t('copySuccess'));
    }

    downloadCsv() {
        alert(t('premiumFeature'));
    }
}

// Inicializar página quando necessário
let combinationsPage;
document.addEventListener('DOMContentLoaded', () => {
    combinationsPage = new CombinationsGeneratorPage();
});