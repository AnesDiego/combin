// Motor principal para geração de combinações e permutações
class CombinationsEngine {
    constructor() {
        this.lists = [];
        this.config = {
            type: 'combinations',
            separator: ' ',
            prefix: '',
            suffix: ''
        };
    }

    // Adicionar lista
    addList(items, title = '') {
        const cleanItems = items
            .split('\n')
            .map(item => item.trim())
            .filter(item => item !== '');
        
        this.lists.push({
            title: title,
            items: cleanItems
        });
    }

    // Remover lista
    removeList(index) {
        if (index >= 0 && index < this.lists.length) {
            this.lists.splice(index, 1);
        }
    }

    // Limpar todas as listas
    clearLists() {
        this.lists = [];
    }

    // Configurar geração
    setConfig(config) {
        this.config = { ...this.config, ...config };
    }

    // Produto cartesiano (combinações)
    cartesianProduct(arrays) {
        if (arrays.length === 0) return [[]];
        if (arrays.some(arr => arr.length === 0)) return [];
        
        return arrays.reduce((acc, curr) => 
            acc.flatMap(combo => 
                curr.map(item => [...combo, item])
            )
        );
    }

    // Permutações de um único array
    generatePermutations(arr) {
        if (arr.length <= 1) return [arr];
        
        const result = [];
        for (let i = 0; i < arr.length; i++) {
            const rest = arr.slice(0, i).concat(arr.slice(i + 1));
            const perms = this.generatePermutations(rest);
            perms.forEach(perm => result.push([arr[i], ...perm]));
        }
        return result;
    }

    // Gerar resultados
    generate() {
        if (this.lists.length === 0) {
            throw new Error('NO_LISTS');
        }

        const itemArrays = this.lists.map(list => list.items);
        let results = [];

        if (this.config.type === 'combinations') {
            // Combinações (produto cartesiano)
            const combinations = this.cartesianProduct(itemArrays);
            results = combinations.map(combo => 
                this.config.prefix + combo.join(this.config.separator) + this.config.suffix
            );
        } else {
            // Permutações
            if (this.lists.length === 1) {
                // Permutações de uma única lista
                const perms = this.generatePermutations(this.lists[0].items);
                results = perms.map(perm => 
                    this.config.prefix + perm.join(this.config.separator) + this.config.suffix
                );
            } else {
                // Para múltiplas listas, usar produto cartesiano
                const combinations = this.cartesianProduct(itemArrays);
                results = combinations.map(combo => 
                    this.config.prefix + combo.join(this.config.separator) + this.config.suffix
                );
            }
        }

        return {
            results: results,
            total: results.length,
            truncated: false,
            truncatedAt: 0
        };
    }

    // Gerar com limite
    generateWithLimit(limit) {
        const result = this.generate();
        
        if (result.total > limit) {
            return {
                results: result.results.slice(0, limit),
                total: result.total,
                truncated: true,
                truncatedAt: limit
            };
        }
        
        return result;
    }

    // Validar limites do plano gratuito
    validateFreeLimits() {
        const errors = [];
        
        if (this.lists.length > AppConfig.FREE_LIMITS.LISTS) {
            errors.push('LISTS_LIMIT_EXCEEDED');
        }
        
        this.lists.forEach((list, index) => {
            if (list.items.length > AppConfig.FREE_LIMITS.ITEMS_PER_LIST) {
                errors.push(`LIST_${index}_ITEMS_LIMIT_EXCEEDED`);
            }
        });
        
        return errors;
    }
}

// Exportar para uso global
window.CombinationsEngine = CombinationsEngine;