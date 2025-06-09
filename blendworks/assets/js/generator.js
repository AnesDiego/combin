/**
 * BlendWorks Combination Generator - UPDATED WITH CORRECT PRICING
 * High-performance combination generator with proper credit system
 */

class BlendWorksCombinationGenerator {
    constructor() {
        this.lists = [];
        this.currentProject = null;
        this.generatedResults = [];
        this.currentPage = 1;
        this.resultsPerPage = 100;
        this.userCredits = 0; // Start with 0 credits (must purchase)
        this.userPlan = 'free';
        this.isGenerating = false;
        
        // Credit packages (CORRECT PRICING)
        this.creditPackages = {
            starter: {
                name: 'Starter Pack',
                price: 0.99,
                credits: 2,
                combinationsPerCredit: 5000,
                maxCombinationsTotal: 10000,
                maxLists: 5,
                maxItemsPerList: 10
            },
            professional: {
                name: 'Professional Pack',
                price: 9.99,
                credits: 10,
                combinationsPerCredit: 10000,
                maxCombinationsTotal: 100000,
                maxLists: 10,
                maxItemsPerList: 20
            },
            enterprise: {
                name: 'Enterprise Pack',
                price: 99.99,
                credits: 50,
                combinationsPerCredit: 20000,
                maxCombinationsTotal: 1000000,
                maxLists: Infinity,
                maxItemsPerList: Infinity
            },
            mega: {
                name: 'Mega Pack',
                price: 499.99,
                credits: 100,
                combinationsPerCredit: 50000,
                maxCombinationsTotal: 5000000,
                maxLists: Infinity,
                maxItemsPerList: Infinity
            }
        };
        
        // Performance settings
        this.maxCombinations = 0; // Will be set based on credits
        this.batchSize = 1000;
        this.maxMemoryUsage = 100 * 1024 * 1024; // 100MB
        
        // Templates
        this.templates = this.getTemplateDefinitions();
        
        // Settings
        this.settings = {
            removeDuplicates: true,
            caseSensitive: false,
            randomOrder: false,
            separator: ' ',
            customSeparator: '',
            maxCombinations: 0
        };
    }

    async init() {
        console.log('⚙️ Initializing Combination Generator...');
        
        try {
            // Load user data and settings
            await this.loadUserData();
            await this.loadSettings();
            
            // Setup UI
            this.setupUI();
            this.setupEventListeners();
            
            // Load any saved project
            await this.loadLastProject();
            
            console.log('✅ Generator initialized successfully');
            
        } catch (error) {
            console.error('❌ Generator initialization failed:', error);
            window.utils.showToast('Generator failed to initialize', 'error');
        }
    }

    async loadUserData() {
        try {
            // Check if user is authenticated
            const authToken = localStorage.getItem('blendworks_auth_token');
            const userEmail = localStorage.getItem('blendworks_lead_email');
            
            if (authToken && window.supabase) {
                // Load user data from Supabase
                const { data: userData, error } = await window.supabase
                    .from('users')
                    .select('*')
                    .eq('email', userEmail)
                    .single();
                
                if (userData && !error) {
                    this.userCredits = userData.credits || 0;
                    this.userPlan = userData.plan || 'free';
                    
                    // Calculate max combinations based on credits
                    this.maxCombinations = this.calculateMaxCombinations();
                    
                    // Update display
                    this.updateCreditsDisplay();
                    this.updateUserNameDisplay(userData.name || 'User');
                }
            } else {
                // Guest user - no credits by default
                this.userCredits = 0;
                this.userPlan = 'free';
                this.maxCombinations = 0;
                this.updateCreditsDisplay();
                this.updateUserNameDisplay('Guest');
            }
            
            console.log(`👤 User loaded: ${this.userCredits} credits, Plan: ${this.userPlan}`);
            
        } catch (error) {
            console.warn('⚠️ User data loading failed:', error);
            // Continue with default values
        }
    }

    calculateMaxCombinations() {
        if (this.userCredits === 0) return 0;
        
        // Find the best package for current credits
        let maxCombinations = 0;
        
        Object.values(this.creditPackages).forEach(package => {
            const possibleCombinations = this.userCredits * package.combinationsPerCredit;
            maxCombinations = Math.max(maxCombinations, possibleCombinations);
        });
        
        return maxCombinations;
    }

    calculateCreditsNeeded(combinationsCount) {
        if (combinationsCount === 0) return 0;
        
        // Find the most efficient package for this amount
        let minCreditsNeeded = Infinity;
        
        Object.values(this.creditPackages).forEach(package => {
            const creditsNeeded = Math.ceil(combinationsCount / package.combinationsPerCredit);
            minCreditsNeeded = Math.min(minCreditsNeeded, creditsNeeded);
        });
        
        return minCreditsNeeded === Infinity ? 1 : minCreditsNeeded;
    }

    validateListLimits() {
        const errors = [];
        
        // Check number of lists
        const currentPackage = this.getCurrentPackageFromCredits();
        if (currentPackage && this.lists.length > currentPackage.maxLists) {
            errors.push(`Maximum ${currentPackage.maxLists} lists allowed for your plan`);
        }
        
        // Check items per list
        this.lists.forEach((list, index) => {
            if (currentPackage && list.items.length > currentPackage.maxItemsPerList) {
                errors.push(`List ${index + 1}: Maximum ${currentPackage.maxItemsPerList} items allowed`);
            }
        });
        
        return errors;
    }

    getCurrentPackageFromCredits() {
        if (this.userCredits === 0) return null;
        
        // Determine package based on credits
        if (this.userCredits >= 100) return this.creditPackages.mega;
        if (this.userCredits >= 50) return this.creditPackages.enterprise;
        if (this.userCredits >= 10) return this.creditPackages.professional;
        if (this.userCredits >= 2) return this.creditPackages.starter;
        
        return null;
    }

    addNewList() {
        // Check list limits
        const currentPackage = this.getCurrentPackageFromCredits();
        if (currentPackage && this.lists.length >= currentPackage.maxLists) {
            this.showUpgradeModal(`You've reached the maximum of ${currentPackage.maxLists} lists for your current plan.`);
            return;
        }
        
        const listId = window.utils.generateId('list');
        const newList = {
            id: listId,
            name: `List ${this.lists.length + 1}`,
            items: [],
            content: ''
        };
        
        this.lists.push(newList);
        this.renderList(newList);
        this.updateSidebarLists();
        this.updateEstimatedCombinations();
        
        // Focus on the new list
        setTimeout(() => {
            const textarea = document.querySelector(`[data-list-id="${listId}"] .list-textarea`);
            if (textarea) {
                textarea.focus();
            }
        }, 100);
        
        console.log(`📝 Added new list: ${listId}`);
    }

    updateListContent(listId, content) {
        const list = this.lists.find(l => l.id === listId);
        if (!list) return;
        
        list.content = content;
        const newItems = this.parseListContent(content);
        
        // Check item limits
        const currentPackage = this.getCurrentPackageFromCredits();
        if (currentPackage && newItems.length > currentPackage.maxItemsPerList) {
            window.utils.showToast(
                `Maximum ${currentPackage.maxItemsPerList} items allowed per list. Upgrade for unlimited items.`,
                'warning'
            );
            
            // Truncate to limit
            list.items = newItems.slice(0, currentPackage.maxItemsPerList);
            list.content = list.items.join('\n');
            
            // Update textarea to show truncated content
            const textarea = document.querySelector(`[data-list-id="${listId}"] .list-textarea`);
            if (textarea) {
                textarea.value = list.content;
            }
        } else {
            list.items = newItems;
        }
        
        this.updateSidebarLists();
        this.updateEstimatedCombinations();
        this.updateListInfo(listId);
    }

    async generateCombinations() {
        if (this.isGenerating) {
            window.utils.showToast('Generation already in progress', 'warning');
            return;
        }
        
        // Check if user has any credits
        if (this.userCredits === 0) {
            this.showNoCreditModal();
            return;
        }
        
        // Validate lists
        const validLists = this.lists.filter(list => list.items.length > 0);
        if (validLists.length === 0) {
            window.utils.showToast('Please add some items to your lists', 'warning');
            return;
        }
        
        // Validate list limits
        const validationErrors = this.validateListLimits();
        if (validationErrors.length > 0) {
            window.utils.showToast(validationErrors[0], 'warning');
            return;
        }
        
        // Calculate estimated combinations
        const estimatedCount = this.calculateEstimatedCombinations();
        
        // Check credits
        const creditsNeeded = this.calculateCreditsNeeded(estimatedCount);
        if (creditsNeeded > this.userCredits) {
            this.showInsufficientCreditsModal(creditsNeeded, estimatedCount);
            return;
        }
        
        // Check against user's maximum
        const userMaxCombinations = this.calculateMaxCombinations();
        if (estimatedCount > userMaxCombinations) {
            window.utils.showToast(
                `Too many combinations (${estimatedCount.toLocaleString()}). Your current plan allows up to ${userMaxCombinations.toLocaleString()} combinations.`,
                'warning'
            );
            return;
        }
        
        this.isGenerating = true;
        const startTime = Date.now();
        
        try {
            // Show loading
            this.showLoadingOverlay();
            
            // Track generation start
            if (window.analytics) {
                window.analytics.trackEvent('generation_started', {
                    lists_count: validLists.length,
                    estimated_combinations: estimatedCount,
                    credits_needed: creditsNeeded,
                    user_plan: this.userPlan
                });
            }
            
            // Generate combinations
            const results = await this.performGeneration(validLists, estimatedCount);
            
            // Calculate actual time and credits used
            const actualTime = Date.now() - startTime;
            const actualCreditsUsed = this.calculateCreditsNeeded(results.length);
            
            // Deduct credits
            await this.deductCredits(actualCreditsUsed);
            
            // Display results
            this.displayResults(results, actualTime, actualCreditsUsed);
            
            // Track successful generation
            if (window.analytics) {
                window.analytics.trackGeneratorUsage(
                    validLists.length,
                    validLists.reduce((sum, list) => sum + list.items.length, 0),
                    results.length,
                    this.getCurrentSeparator(),
                    actualTime
                );
            }
            
            console.log(`✅ Generated ${results.length} combinations in ${actualTime}ms using ${actualCreditsUsed} credits`);
            
        } catch (error) {
            console.error('❌ Generation failed:', error);
            window.utils.handleError(error, 'combination_generation');
            window.utils.showToast('Generation failed. Please try again.', 'error');
            
        } finally {
            this.hideLoadingOverlay();
            this.isGenerating = false;
        }
    }

    updateEstimatedCombinations() {
        const estimated = this.calculateEstimatedCombinations();
        const creditsNeeded = this.calculateCreditsNeeded(estimated);
        const estimatedTime = this.estimateGenerationTime(estimated);
        const userMaxCombinations = this.calculateMaxCombinations();
        
        // Update display
        const estimatedCountElement = document.getElementById('estimatedCount');
        const generationTimeElement = document.getElementById('generationTime');
        
        if (estimatedCountElement) {
            estimatedCountElement.textContent = estimated.toLocaleString();
        }
        
        if (generationTimeElement) {
            generationTimeElement.textContent = estimatedTime;
        }
        
        // Update generate button state
        const generateBtn = document.getElementById('generateBtn');
        if (generateBtn) {
            const hasCredits = this.userCredits > 0;
            const canAfford = creditsNeeded <= this.userCredits;
            const withinLimits = estimated <= userMaxCombinations;
            const canGenerate = estimated > 0 && hasCredits && canAfford && withinLimits;
            
            generateBtn.disabled = !canGenerate;
            
            if (!hasCredits) {
                generateBtn.innerHTML = `
                    <i class="fas fa-shopping-cart"></i>
                    <span>Buy Credits to Generate</span>
                `;
            } else if (!canAfford) {
                generateBtn.innerHTML = `
                    <i class="fas fa-coins"></i>
                    <span>Need ${creditsNeeded} Credits</span>
                `;
            } else if (!withinLimits) {
                generateBtn.innerHTML = `
                    <i class="fas fa-crown"></i>
                    <span>Upgrade for More</span>
                `;
            } else {
                generateBtn.innerHTML = `
                    <i class="fas fa-cogs"></i>
                    <span data-i18n="app.generate">Generate Combinations</span>
                    <div class="btn-animation"></div>
                `;
            }
        }
        
        // Show credits needed info
        this.updateCreditsNeededDisplay(creditsNeeded, estimated);
    }

    updateCreditsNeededDisplay(creditsNeeded, estimated) {
        // Find or create credits info element
        let creditsInfo = document.querySelector('.credits-needed-info');
        if (!creditsInfo) {
            const generateSection = document.querySelector('.generate-section');
            if (generateSection) {
                creditsInfo = window.utils.createElement('div', {
                    className: 'credits-needed-info',
                    innerHTML: ''
                });
                generateSection.appendChild(creditsInfo);
            }
        }
        
        if (creditsInfo && estimated > 0) {
            const currentPackage = this.getCurrentPackageFromCredits();
            const packageName = currentPackage ? currentPackage.name : 'No Package';
            
            creditsInfo.innerHTML = `
                <div class="credits-calculation">
                    <span class="calculation-item">
                        <i class="fas fa-calculator"></i>
                        ${estimated.toLocaleString()} combinations = ${creditsNeeded} credits
                    </span>
                    <span class="calculation-item">
                        <i class="fas fa-crown"></i>
                        Current plan: ${packageName}
                    </span>
                    <span class="calculation-item ${this.userCredits >= creditsNeeded ? 'text-success' : 'text-warning'}">
                        <i class="fas fa-coins"></i>
                        Available: ${this.userCredits} credits
                    </span>
                </div>
            `;
        }
    }

    showNoCreditModal() {
        const modal = window.utils.createElement('div', {
            className: 'modal no-credits-modal',
            innerHTML: `
                <div class="modal-overlay" onclick="this.parentElement.remove()"></div>
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>🚀 Welcome to BlendWorks!</h2>
                        <button class="close-btn" onclick="this.parentElement.parentElement.remove()">×</button>
                    </div>
                    <div class="modal-body">
                        <p>To start generating combinations, you need to purchase a credit package.</p>
                        
                        <div class="package-grid">
                            <div class="package-card" data-package="starter">
                                <h3>🏁 Starter Pack</h3>
                                <div class="package-price">$0.99</div>
                                <div class="package-features">
                                    <div>✓ 2 credits</div>
                                    <div>✓ 10,000 combinations</div>
                                    <div>✓ Up to 5 lists</div>
                                    <div>✓ 10 items per list</div>
                                </div>
                                <button class="btn btn-primary btn-sm" onclick="window.payments.initiatePayment('starter')">
                                    Get Started
                                </button>
                            </div>
                            
                            <div class="package-card popular" data-package="professional">
                                <div class="popular-badge">Most Popular</div>
                                <h3>💼 Professional Pack</h3>
                                <div class="package-price">$9.99</div>
                                <div class="package-features">
                                    <div>✓ 10 credits</div>
                                    <div>✓ 100,000 combinations</div>
                                    <div>✓ Up to 10 lists</div>
                                    <div>✓ 20 items per list</div>
                                </div>
                                <button class="btn btn-primary btn-sm" onclick="window.payments.initiatePayment('professional')">
                                    Choose Professional
                                </button>
                            </div>
                        </div>
                        
                        <div class="modal-actions">
                            <a href="pricing.html" class="btn btn-outline">View All Plans</a>
                        </div>
                    </div>
                </div>
            `
        });
        
        document.body.appendChild(modal);
        modal.classList.add('active');
    }

    showInsufficientCreditsModal(creditsNeeded, estimatedCombinations) {
        const currentPackage = this.getCurrentPackageFromCredits();
        const currentPackageName = currentPackage ? currentPackage.name : 'None';
        
        // Calculate what packages would work
        const suitablePackages = [];
        Object.entries(this.creditPackages).forEach(([key, package]) => {
            if (package.credits >= creditsNeeded) {
                suitablePackages.push({ key, ...package });
            }
        });
        
        const modal = window.utils.createElement('div', {
            className: 'modal insufficient-credits-modal',
            innerHTML: `
                <div class="modal-overlay" onclick="this.parentElement.remove()"></div>
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>🪙 More Credits Needed</h2>
                        <button class="close-btn" onclick="this.parentElement.parentElement.remove()">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="requirement-summary">
                            <p>To generate <strong>${estimatedCombinations.toLocaleString()}</strong> combinations, you need:</p>
                            <div class="requirement-details">
                                <span class="requirement-item">
                                    <i class="fas fa-coins"></i>
                                    <strong>${creditsNeeded}</strong> credits required
                                </span>
                                <span class="requirement-item">
                                    <i class="fas fa-wallet"></i>
                                    <strong>${this.userCredits}</strong> credits available
                                </span>
                                <span class="requirement-item shortage">
                                    <i class="fas fa-exclamation-triangle"></i>
                                    <strong>${creditsNeeded - this.userCredits}</strong> credits short
                                </span>
                            </div>
                        </div>
                        
                        <div class="current-plan">
                            <h3>Current Plan: ${currentPackageName}</h3>
                        </div>
                        
                        <div class="upgrade-options">
                            <h3>💳 Purchase More Credits:</h3>
                            <div class="package-grid">
                                ${suitablePackages.map(package => `
                                    <div class="package-card ${package.key === 'professional' ? 'recommended' : ''}" data-package="${package.key}">
                                        ${package.key === 'professional' ? '<div class="recommended-badge">Recommended</div>' : ''}
                                        <h4>${package.name}</h4>
                                        <div class="package-price">$${package.price}</div>
                                        <div class="package-features">
                                            <div>✓ ${package.credits} credits</div>
                                            <div>✓ ${package.maxCombinationsTotal.toLocaleString()} combinations</div>
                                            <div>✓ ${package.maxLists === Infinity ? 'Unlimited' : package.maxLists} lists</div>
                                            <div>✓ ${package.maxItemsPerList === Infinity ? 'Unlimited' : package.maxItemsPerList} items/list</div>
                                        </div>
                                        <button class="btn btn-primary btn-sm" onclick="window.payments.initiatePayment('${package.key}')">
                                            Purchase Now
                                        </button>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        
                        <div class="alternative-actions">
                            <h3>📉 Or reduce your generation:</h3>
                            <div class="reduction-suggestions">
                                <button class="btn btn-outline btn-sm" onclick="window.generator.reduceToCredits()">
                                    Generate ${this.userCredits * 5000} combinations instead
                                </button>
                                <button class="btn btn-outline btn-sm" onclick="window.generator.reduceLists()">
                                    Remove some lists
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `
        });
        
        document.body.appendChild(modal);
        modal.classList.add('active');
    }

    reduceToCredits() {
        // Calculate max combinations with current credits
        const maxCombinations = this.calculateMaxCombinations();
        this.settings.maxCombinations = maxCombinations;
        
        // Update UI
        const maxCombinationsInput = document.getElementById('maxCombinations');
        if (maxCombinationsInput) {
            maxCombinationsInput.value = maxCombinations;
        }
        
        this.updateEstimatedCombinations();
        
        // Close modal
        document.querySelector('.insufficient-credits-modal')?.remove();
        
        window.utils.showToast(`Reduced to ${maxCombinations.toLocaleString()} combinations`, 'success');
    }

    reduceLists() {
        // Close modal
        document.querySelector('.insufficient-credits-modal')?.remove();
        
        // Highlight lists for removal
        document.querySelectorAll('.list-editor').forEach(list => {
            list.style.border = '2px dashed #ff6b6b';
        });
        
        window.utils.showToast('Click the trash icon on lists you want to remove', 'info');
    }

    // Update credits display with proper formatting
    updateCreditsDisplay() {
        const creditsElement = document.getElementById('creditsCount');
        if (creditsElement) {
            creditsElement.textContent = this.userCredits.toLocaleString();
        }
        
        // Update credits indicator color
        const userCreditsElement = document.getElementById('userCredits');
        if (userCreditsElement) {
            userCreditsElement.classList.remove('credits-low', 'credits-empty');
            
            if (this.userCredits === 0) {
                userCreditsElement.classList.add('credits-empty');
            } else if (this.userCredits < 5) {
                userCreditsElement.classList.add('credits-low');
            }
        }
        
        // Update max combinations
        this.maxCombinations = this.calculateMaxCombinations();
        this.settings.maxCombinations = this.maxCombinations;
        
        // Update max combinations input
        const maxCombinationsInput = document.getElementById('maxCombinations');
        if (maxCombinationsInput) {
            maxCombinationsInput.max = this.maxCombinations;
            maxCombinationsInput.value = Math.min(
                parseInt(maxCombinationsInput.value) || this.maxCombinations,
                this.maxCombinations
            );
        }
    }

    // Rest of the methods remain the same...
    // [Previous methods continue here without changes]
}

// Global functions remain the same...
// [All global functions continue here]

console.log('⚙️ Generator module loaded with CORRECT pricing');