/**
 * BlendWorks Payment System - GitHub Pages Version COMPLETE
 * Uses Stripe directly from frontend + Supabase for order tracking
 * UPDATED WITH CORRECT PRICING PARAMETERS
 */

class BlendWorksPayments {
    constructor() {
        this.stripe = null;
        this.supabase = null;
        this.currentCountry = 'US';
        this.currentCurrency = 'USD';
        this.exchangeRates = {};
        this.packages = this.getPackageConfigs();
        
        // Stripe public keys (different for production/test)
        this.stripePublicKey = window.location.hostname === 'localhost' 
            ? 'pk_test_51234567890' // Test key
            : 'pk_live_51234567890'; // Production key
        
        // Payment session tracking
        this.paymentAttempts = 0;
        this.lastPaymentMethod = null;
        this.discountCode = null;
        this.affiliateCode = null;
    }

    async init() {
        console.log('💳 Initializing Payment System with CORRECT pricing...');
        
        try {
            // Initialize Stripe
            this.stripe = Stripe(this.stripePublicKey);
            
            // Initialize Supabase (frontend connection)
            this.supabase = window.supabase || await this.initSupabase();
            
            // Detect user location and currency
            await this.detectUserLocation();
            
            // Load exchange rates
            await this.loadExchangeRates();
            
            // Update pricing display
            this.updatePricingDisplay();
            
            // Setup payment button handlers
            this.setupPaymentButtons();
            
            // Check for URL parameters (success, cancelled, etc.)
            this.handleURLParameters();
            
            console.log('✅ Payment system initialized with correct pricing');
            
        } catch (error) {
            console.error('❌ Payment system initialization failed:', error);
            this.showPaymentError('Payment system unavailable. Please try again later.');
        }
    }

    async initSupabase() {
        // Supabase connection with anon key (safe for frontend)
        const supabaseUrl = 'https://your-project.supabase.co';
        const supabaseAnonKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...'; // Anon key (safe)
        
        return window.supabase = supabase.createClient(supabaseUrl, supabaseAnonKey);
    }

    async detectUserLocation() {
        try {
            // Try to get from document (set by geo-ads.js)
            this.currentCountry = document.documentElement.getAttribute('data-country') || 'US';
            this.currentCurrency = document.documentElement.getAttribute('data-currency') || 'USD';
            
            // If not available, detect via IP
            if (!this.currentCountry || this.currentCountry === 'Unknown') {
                const response = await fetch('https://ipapi.co/json/');
                const data = await response.json();
                
                this.currentCountry = data.country_code || 'US';
                this.currentCurrency = data.currency || 'USD';
                
                // Update document attributes
                document.documentElement.setAttribute('data-country', this.currentCountry);
                document.documentElement.setAttribute('data-currency', this.currentCurrency);
            }
            
            console.log(`💰 Payment location: ${this.currentCountry} (${this.currentCurrency})`);
            
        } catch (error) {
            console.warn('⚠️ Location detection failed:', error);
            this.currentCountry = 'US';
            this.currentCurrency = 'USD';
        }
    }

    async loadExchangeRates() {
        try {
            // Get current exchange rates (free API)
            const response = await fetch(`https://api.exchangerate-api.com/v4/latest/USD`);
            const data = await response.json();
            
            this.exchangeRates = data.rates;
            console.log('💱 Exchange rates loaded');
            
        } catch (error) {
            console.warn('⚠️ Exchange rates loading failed:', error);
            // Use fallback rates
            this.exchangeRates = {
                'USD': 1,
                'EUR': 0.85,
                'GBP': 0.73,
                'CAD': 1.25,
                'AUD': 1.35,
                'BRL': 5.20,
                'JPY': 110,
                'KRW': 1180,
                'MXN': 20.0,
                'INR': 75.0
            };
        }
    }

    getPackageConfigs() {
        return {
            starter: {
                name: 'starter',
                displayName: 'Starter Pack',
                basePrice: 0.99, // CORRECT PRICE
                credits: 2, // CORRECT CREDITS
                combinations: 10000, // 10K combinations total
                combinationsPerCredit: 5000, // 5K per credit
                maxLists: 5,
                maxItemsPerList: 10,
                features: [
                    '2 credits included',
                    '10,000 total combinations',
                    '5,000 combinations per credit',
                    'Up to 5 lists',
                    '10 items per list',
                    'TXT, CSV export',
                    'Email support'
                ],
                popular: false,
                badge: '🏁 Perfect Start',
                stripePriceIds: {
                    'USD': 'price_starter_usd_099',
                    'EUR': 'price_starter_eur_085',
                    'GBP': 'price_starter_gbp_079',
                    'CAD': 'price_starter_cad_125',
                    'AUD': 'price_starter_aud_135',
                    'BRL': 'price_starter_brl_520'
                },
                paypalPriceIds: {
                    'USD': 'STARTER_USD_099',
                    'EUR': 'STARTER_EUR_085',
                    'GBP': 'STARTER_GBP_079'
                }
            },
            professional: {
                name: 'professional',
                displayName: 'Professional Pack',
                basePrice: 9.99, // CORRECT PRICE
                credits: 10, // CORRECT CREDITS
                combinations: 100000, // 100K combinations total
                combinationsPerCredit: 10000, // 10K per credit
                maxLists: 10,
                maxItemsPerList: 20,
                features: [
                    '10 credits included',
                    '100,000 total combinations',
                    '10,000 combinations per credit',
                    'Up to 10 lists',
                    '20 items per list',
                    'All export formats',
                    'Priority support',
                    'Advanced templates',
                    'Batch operations'
                ],
                popular: true,
                badge: '⭐ Most Popular',
                stripePriceIds: {
                    'USD': 'price_professional_usd_999',
                    'EUR': 'price_professional_eur_849',
                    'GBP': 'price_professional_gbp_799',
                    'CAD': 'price_professional_cad_1249',
                    'AUD': 'price_professional_aud_1349',
                    'BRL': 'price_professional_brl_5199'
                },
                paypalPriceIds: {
                    'USD': 'PROFESSIONAL_USD_999',
                    'EUR': 'PROFESSIONAL_EUR_849',
                    'GBP': 'PROFESSIONAL_GBP_799'
                }
            },
            enterprise: {
                name: 'enterprise',
                displayName: 'Enterprise Pack',
                basePrice: 99.99, // CORRECT PRICE
                credits: 50, // CORRECT CREDITS
                combinations: 1000000, // 1M combinations total
                combinationsPerCredit: 20000, // 20K per credit
                maxLists: Infinity,
                maxItemsPerList: Infinity,
                features: [
                    '50 credits included',
                    '1,000,000 total combinations',
                    '20,000 combinations per credit',
                    'Unlimited lists',
                    'Unlimited items per list',
                    'All formats + Custom',
                    '24/7 support',
                    'API access',
                    'Custom templates',
                    'Bulk operations',
                    'White-label ready'
                ],
                popular: false,
                badge: '🏢 Enterprise Power',
                stripePriceIds: {
                    'USD': 'price_enterprise_usd_9999',
                    'EUR': 'price_enterprise_eur_8499',
                    'GBP': 'price_enterprise_gbp_7999',
                    'CAD': 'price_enterprise_cad_12499',
                    'AUD': 'price_enterprise_aud_13499',
                    'BRL': 'price_enterprise_brl_51999'
                },
                paypalPriceIds: {
                    'USD': 'ENTERPRISE_USD_9999',
                    'EUR': 'ENTERPRISE_EUR_8499',
                    'GBP': 'ENTERPRISE_GBP_7999'
                }
            },
            mega: {
                name: 'mega',
                displayName: 'Mega Pack',
                basePrice: 499.99, // CORRECT PRICE
                credits: 100, // CORRECT CREDITS
                combinations: 5000000, // 5M combinations total
                combinationsPerCredit: 50000, // 50K per credit
                maxLists: Infinity,
                maxItemsPerList: Infinity,
                features: [
                    '100 credits included',
                    '5,000,000 total combinations',
                    '50,000 combinations per credit',
                    'Unlimited everything',
                    'Custom development',
                    'Dedicated support',
                    'White-label option',
                    'Priority features',
                    'Custom integrations',
                    'Training included',
                    'Source code access'
                ],
                popular: false,
                badge: '🚀 Ultimate Power',
                stripePriceIds: {
                    'USD': 'price_mega_usd_49999',
                    'EUR': 'price_mega_eur_42499',
                    'GBP': 'price_mega_gbp_39999',
                    'CAD': 'price_mega_cad_62499',
                    'AUD': 'price_mega_aud_67499',
                    'BRL': 'price_mega_brl_259999'
                },
                paypalPriceIds: {
                    'USD': 'MEGA_USD_49999',
                    'EUR': 'MEGA_EUR_42499',
                    'GBP': 'MEGA_GBP_39999'
                }
            }
        };
    }

    // BULK DISCOUNT CONFIGURATIONS
    getBulkDiscounts() {
        return {
            // 2x packages = 5% off
            2: { discount: 0.05, label: '5% OFF' },
            // 5x packages = 15% off
            5: { discount: 0.15, label: '15% OFF' },
            // 10x packages = 25% off
            10: { discount: 0.25, label: '25% OFF' }
        };
    }

    calculateBulkPrice(packageName, quantity) {
        const packageConfig = this.packages[packageName];
        if (!packageConfig) return { error: 'Invalid package' };
        
        const basePrice = this.convertPrice(packageConfig.basePrice, this.currentCurrency);
        const totalBasePrice = basePrice * quantity;
        
        const bulkDiscounts = this.getBulkDiscounts();
        let discount = 0;
        let discountLabel = '';
        
        // Find applicable discount
        const sortedQuantities = Object.keys(bulkDiscounts).map(Number).sort((a, b) => b - a);
        for (const qty of sortedQuantities) {
            if (quantity >= qty) {
                discount = bulkDiscounts[qty].discount;
                discountLabel = bulkDiscounts[qty].label;
                break;
            }
        }
        
        const discountAmount = totalBasePrice * discount;
        const finalPrice = totalBasePrice - discountAmount;
        
        return {
            basePrice,
            quantity,
            totalBasePrice,
            discount,
            discountLabel,
            discountAmount,
            finalPrice,
            savings: discountAmount,
            totalCredits: packageConfig.credits * quantity,
            totalCombinations: packageConfig.combinations * quantity
        };
    }

    updatePricingDisplay() {
        Object.keys(this.packages).forEach(packageName => {
            const packageConfig = this.packages[packageName];
            const localPrice = this.convertPrice(packageConfig.basePrice, this.currentCurrency);
            
            // Update price display elements
            const priceElements = document.querySelectorAll(`[data-package="${packageName}"] .amount`);
            priceElements.forEach(element => {
                element.textContent = this.formatPriceNumber(localPrice);
            });
            
            // Update currency symbols
            const currencyElements = document.querySelectorAll(`[data-package="${packageName}"] .currency`);
            currencyElements.forEach(element => {
                element.textContent = this.getCurrencySymbol(this.currentCurrency);
            });
            
            // Update efficiency badges
            const efficiencyElements = document.querySelectorAll(`[data-package="${packageName}"] .efficiency-badge`);
            efficiencyElements.forEach(element => {
                element.textContent = `${packageConfig.combinationsPerCredit.toLocaleString()} combinations per credit`;
            });
        });
        
        console.log(`💰 Pricing updated for ${this.currentCurrency}`);
    }

    convertPrice(usdPrice, targetCurrency) {
        if (targetCurrency === 'USD') return usdPrice;
        
        const rate = this.exchangeRates[targetCurrency];
        if (!rate) return usdPrice;
        
        const convertedPrice = usdPrice * rate;
        
        // Round to reasonable precision based on currency
        switch (targetCurrency) {
            case 'JPY':
            case 'KRW':
                return Math.round(convertedPrice);
            case 'BRL':
            case 'MXN':
                return Math.round(convertedPrice * 100) / 100;
            default:
                return Math.round(convertedPrice * 100) / 100;
        }
    }

    formatPriceNumber(price) {
        // Format price without currency symbol
        try {
            return new Intl.NumberFormat('en-US', {
                minimumFractionDigits: this.currentCurrency === 'JPY' || this.currentCurrency === 'KRW' ? 0 : 2,
                maximumFractionDigits: this.currentCurrency === 'JPY' || this.currentCurrency === 'KRW' ? 0 : 2
            }).format(price);
        } catch (error) {
            return price.toString();
        }
    }

    getCurrencySymbol(currency) {
        const symbols = {
            'USD': '$',
            'EUR': '€',
            'GBP': '£',
            'CAD': 'C$',
            'AUD': 'A$',
            'BRL': 'R$',
            'JPY': '¥',
            'KRW': '₩',
            'MXN': 'MX$',
            'INR': '₹'
        };
        
        return symbols[currency] || currency + ' ';
    }

    setupPaymentButtons() {
        // Setup all payment buttons
        document.querySelectorAll('.pay-button, .payment-btn, .btn[onclick*="selectPackage"]').forEach(button => {
            // Remove existing onclick to avoid conflicts
            button.removeAttribute('onclick');
            
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const packageName = e.target.closest('[data-package]')?.getAttribute('data-package') ||
                                  button.getAttribute('data-package');
                
                if (packageName) {
                    this.initiatePayment(packageName);
                } else {
                    console.warn('No package name found for payment button');
                }
            });
        });
        
        // Setup bulk purchase buttons
        this.setupBulkPurchaseButtons();
        
        // Setup discount code input
        this.setupDiscountCode();
        
        // Setup global payment function
        window.selectPackage = (packageName, quantity = 1) => {
            this.initiatePayment(packageName, quantity);
        };
        
        console.log('🔘 Payment buttons configured');
    }

    setupBulkPurchaseButtons() {
        document.querySelectorAll('.bulk-purchase-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const packageName = button.getAttribute('data-package');
                const quantity = parseInt(button.getAttribute('data-quantity')) || 1;
                this.initiateBulkPayment(packageName, quantity);
            });
        });
    }

    setupDiscountCode() {
        const discountInput = document.getElementById('discountCode');
        const applyButton = document.getElementById('applyDiscount');
        
        if (discountInput && applyButton) {
            applyButton.addEventListener('click', () => {
                this.applyDiscountCode(discountInput.value);
            });
            
            discountInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.applyDiscountCode(discountInput.value);
                }
            });
        }
    }

    async initiatePayment(packageName, quantity = 1) {
        try {
            console.log(`💳 Initiating payment for: ${packageName} x${quantity}`);
            
            // Show loading state
            this.showPaymentLoading(packageName);
            
            // Get package config
            const packageConfig = this.packages[packageName];
            if (!packageConfig) {
                throw new Error(`Invalid package: ${packageName}`);
            }
            
            // Calculate pricing (including bulk discounts)
            const pricing = quantity > 1 ? 
                this.calculateBulkPrice(packageName, quantity) :
                {
                    finalPrice: this.convertPrice(packageConfig.basePrice, this.currentCurrency),
                    totalCredits: packageConfig.credits,
                    totalCombinations: packageConfig.combinations,
                    quantity: 1
                };
            
            if (pricing.error) {
                throw new Error(pricing.error);
            }
            
            // Track payment attempt
            this.paymentAttempts++;
            if (window.analytics) {
                window.analytics.trackEvent('payment_attempt', {
                    package: packageName,
                    quantity: quantity,
                    price: pricing.finalPrice,
                    currency: this.currentCurrency,
                    country: this.currentCountry,
                    attempt_number: this.paymentAttempts
                });
            }
            
            // Show payment method selection if multiple methods available
            await this.showPaymentMethodSelection(packageConfig, pricing);
            
        } catch (error) {
            console.error('❌ Payment initiation failed:', error);
            this.hidePaymentLoading();
            this.showPaymentError(error.message || 'Payment failed to start. Please try again.');
        }
    }

    async initiateBulkPayment(packageName, quantity) {
        return this.initiatePayment(packageName, quantity);
    }

    async showPaymentMethodSelection(packageConfig, pricing) {
        // Create payment method selection modal
        const modal = window.utils.createElement('div', {
            className: 'modal payment-method-modal',
            innerHTML: `
                <div class="modal-overlay" onclick="this.parentElement.remove()"></div>
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>💳 Choose Payment Method</h2>
                        <button class="close-btn" onclick="this.parentElement.parentElement.remove()">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="payment-summary">
                            <h3>${packageConfig.displayName}</h3>
                            ${pricing.quantity > 1 ? `<div class="quantity">Quantity: ${pricing.quantity}</div>` : ''}
                            ${pricing.discountLabel ? `<div class="discount">${pricing.discountLabel} - Save ${this.getCurrencySymbol(this.currentCurrency)}${this.formatPriceNumber(pricing.savings)}</div>` : ''}
                            <div class="total-price">
                                Total: ${this.getCurrencySymbol(this.currentCurrency)}${this.formatPriceNumber(pricing.finalPrice)}
                            </div>
                            <div class="credits-info">
                                ${pricing.totalCredits.toLocaleString()} credits = ${pricing.totalCombinations.toLocaleString()} combinations
                            </div>
                        </div>
                        
                        <div class="payment-methods">
                            <button class="payment-method-btn stripe-btn" onclick="window.payments.processStripePayment('${packageConfig.name}', ${JSON.stringify(pricing).replace(/"/g, '&quot;')})">
                                <div class="method-icon">
                                    <i class="fab fa-stripe"></i>
                                </div>
                                <div class="method-info">
                                    <div class="method-name">Credit Card</div>
                                    <div class="method-desc">Visa, Mastercard, American Express</div>
                                </div>
                                <div class="method-badge">Recommended</div>
                            </button>
                            
                            <button class="payment-method-btn paypal-btn" onclick="window.payments.processPayPalPayment('${packageConfig.name}', ${JSON.stringify(pricing).replace(/"/g, '&quot;')})">
                                <div class="method-icon">
                                    <i class="fab fa-paypal"></i>
                                </div>
                                <div class="method-info">
                                    <div class="method-name">PayPal</div>
                                    <div class="method-desc">PayPal Balance, Bank Account</div>
                                </div>
                            </button>
                            
                            ${this.getLocalPaymentMethods().map(method => `
                                <button class="payment-method-btn local-btn" onclick="window.payments.processLocalPayment('${method.id}', '${packageConfig.name}', ${JSON.stringify(pricing).replace(/"/g, '&quot;')})">
                                    <div class="method-icon">
                                        <i class="${method.icon}"></i>
                                    </div>
                                    <div class="method-info">
                                        <div class="method-name">${method.name}</div>
                                        <div class="method-desc">${method.description}</div>
                                    </div>
                                    ${method.popular ? '<div class="method-badge">Popular</div>' : ''}
                                </button>
                            `).join('')}
                        </div>
                        
                        <div class="payment-security">
                            <div class="security-item">
                                <i class="fas fa-shield-alt"></i>
                                <span>256-bit SSL encryption</span>
                            </div>
                            <div class="security-item">
                                <i class="fas fa-lock"></i>
                                <span>PCI DSS compliant</span>
                            </div>
                            <div class="security-item">
                                <i class="fas fa-undo"></i>
                                <span>30-day money-back guarantee</span>
                            </div>
                        </div>
                    </div>
                </div>
            `
        });
        
        document.body.appendChild(modal);
        modal.classList.add('active');
        
        this.hidePaymentLoading();
    }

    getLocalPaymentMethods() {
        const methods = [];
        
        switch (this.currentCountry) {
            case 'BR':
                methods.push(
                    { id: 'pix', name: 'PIX', description: 'Instant bank transfer', icon: 'fas fa-qrcode', popular: true },
                    { id: 'boleto', name: 'Boleto', description: 'Bank slip payment', icon: 'fas fa-barcode' }
                );
                break;
            case 'DE':
            case 'NL':
            case 'AT':
                methods.push(
                    { id: 'sofort', name: 'SOFORT', description: 'Direct bank transfer', icon: 'fas fa-university', popular: true }
                );
                break;
            case 'NL':
                methods.push(
                    { id: 'ideal', name: 'iDEAL', description: 'Dutch bank transfer', icon: 'fas fa-university', popular: true }
                );
                break;
            case 'GB':
                methods.push(
                    { id: 'bacs', name: 'Direct Debit', description: 'UK bank account', icon: 'fas fa-university' }
                );
                break;
            case 'AU':
                methods.push(
                    { id: 'becs', name: 'BECS Direct Debit', description: 'Australian bank account', icon: 'fas fa-university' }
                );
                break;
            case 'MX':
                methods.push(
                    { id: 'oxxo', name: 'OXXO', description: 'Cash payment at OXXO stores', icon: 'fas fa-store' }
                );
                break;
            case 'JP':
                methods.push(
                    { id: 'konbini', name: 'Konbini', description: 'Convenience store payment', icon: 'fas fa-store' }
                );
                break;
        }
        
        return methods;
    }

    async processStripePayment(packageName, pricing) {
        try {
            console.log(`💳 Processing Stripe payment for ${packageName}`);
            
            this.lastPaymentMethod = 'stripe';
            
            // Close payment method modal
            document.querySelector('.payment-method-modal')?.remove();
            
            // Show processing state
            this.showPaymentLoading(packageName);
            
            const packageConfig = this.packages[packageName];
            
            // Get Stripe price ID for current currency
            const priceId = packageConfig.stripePriceIds[this.currentCurrency] || 
                           packageConfig.stripePriceIds['USD'];
            
            if (!priceId) {
                throw new Error(`No Stripe price configured for ${this.currentCurrency}`);
            }
            
            // Prepare line items
            const lineItems = [{
                price: priceId,
                quantity: pricing.quantity || 1,
            }];
            
            // Create checkout session
            const checkoutConfig = {
                lineItems: lineItems,
                mode: 'payment',
                
                // Success/Cancel URLs
                successUrl: `${window.location.origin}/success.html?session_id={CHECKOUT_SESSION_ID}&package=${packageConfig.name}&quantity=${pricing.quantity || 1}`,
                cancelUrl: `${window.location.origin}/pricing.html?cancelled=true&package=${packageConfig.name}`,
                
                // Customer email (if available from leads)
                customerEmail: this.getUserEmail(),
                
                // Allow promotion codes
                allowPromotionCodes: true,
                
                // Billing address collection
                billingAddressCollection: 'auto',
                
                // Client reference ID for tracking
                clientReferenceId: this.generateClientReferenceId(packageConfig.name),
                
                // Metadata
                metadata: {
                    package: packageConfig.name,
                    credits: pricing.totalCredits.toString(),
                    combinations: pricing.totalCombinations.toString(),
                    quantity: (pricing.quantity || 1).toString(),
                    country: this.currentCountry,
                    source: 'github_pages',
                    user_agent: navigator.userAgent,
                    referrer: document.referrer,
                    discount_code: this.discountCode || '',
                    affiliate_code: this.affiliateCode || '',
                    timestamp: new Date().toISOString()
                }
            };
            
            // Apply discount if available
            if (this.discountCode) {
                checkoutConfig.discounts = [{
                    coupon: this.discountCode
                }];
            }
            
            const { error } = await this.stripe.redirectToCheckout(checkoutConfig);
            
            if (error) {
                throw error;
            }
            
            // Store pending purchase in Supabase (for tracking)
            await this.storePendingPurchase(packageConfig, pricing, 'stripe');
            
        } catch (error) {
            console.error('❌ Stripe payment failed:', error);
            this.hidePaymentLoading();
            throw new Error(`Stripe payment failed: ${error.message}`);
        }
    }

    async processPayPalPayment(packageName, pricing) {
        try {
            console.log(`💰 Processing PayPal payment for ${packageName}`);
            
            this.lastPaymentMethod = 'paypal';
            
            // Close payment method modal
            document.querySelector('.payment-method-modal')?.remove();
            
            // Show processing state
            this.showPaymentLoading(packageName);
            
            const packageConfig = this.packages[packageName];
            
            // Create PayPal order via API call
            const orderData = {
                package: packageName,
                quantity: pricing.quantity || 1,
                amount: pricing.finalPrice,
                currency: this.currentCurrency,
                country: this.currentCountry,
                userEmail: this.getUserEmail(),
                discountCode: this.discountCode,
                affiliateCode: this.affiliateCode
            };
            
            // Call PayPal API (we'd need a serverless function for this)
            const response = await fetch('/api/payments/paypal-checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(orderData)
            });
            
            if (!response.ok) {
                throw new Error(`PayPal API error: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success && result.approvalUrl) {
                // Redirect to PayPal
                window.location.href = result.approvalUrl;
            } else {
                throw new Error(result.error || 'PayPal order creation failed');
            }
            
            // Store pending purchase
            await this.storePendingPurchase(packageConfig, pricing, 'paypal');
            
        } catch (error) {
            console.error('❌ PayPal payment failed:', error);
            this.hidePaymentLoading();
            
            // Fallback: show manual PayPal payment
            this.showManualPayPalPayment(packageName, pricing);
        }
    }

    async processLocalPayment(methodId, packageName, pricing) {
        try {
            console.log(`🏪 Processing ${methodId} payment for ${packageName}`);
            
            this.lastPaymentMethod = methodId;
            
            // Close payment method modal
            document.querySelector('.payment-method-modal')?.remove();
            
            // Show processing state
            this.showPaymentLoading(packageName);
            
            const packageConfig = this.packages[packageName];
            
            // For local payment methods, we'd typically need backend integration
            // For now, we'll redirect to Stripe with the specific payment method
            const { error } = await this.stripe.redirectToCheckout({
                lineItems: [{
                    price: packageConfig.stripePriceIds[this.currentCurrency],
                    quantity: pricing.quantity || 1,
                }],
                mode: 'payment',
                paymentMethodTypes: [methodId],
                successUrl: `${window.location.origin}/success.html?session_id={CHECKOUT_SESSION_ID}&package=${packageConfig.name}`,
                cancelUrl: `${window.location.origin}/pricing.html?cancelled=true&package=${packageConfig.name}`,
                metadata: {
                    package: packageConfig.name,
                    payment_method: methodId,
                    country: this.currentCountry
                }
            });
            
            if (error) {
                throw error;
            }
            
        } catch (error) {
            console.error(`❌ ${methodId} payment failed:`, error);
            this.hidePaymentLoading();
            this.showPaymentError(`${methodId} payment failed: ${error.message}`);
        }
    }

    showManualPayPalPayment(packageName, pricing) {
        const packageConfig = this.packages[packageName];
        const modal = window.utils.createElement('div', {
            className: 'modal manual-paypal-modal',
            innerHTML: `
                <div class="modal-overlay" onclick="this.parentElement.remove()"></div>
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>💰 PayPal Payment</h2>
                        <button class="close-btn" onclick="this.parentElement.parentElement.remove()">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="payment-instructions">
                            <p>Please send <strong>${this.getCurrencySymbol(this.currentCurrency)}${this.formatPriceNumber(pricing.finalPrice)}</strong> via PayPal to:</p>
                            <div class="paypal-email">
                                <strong>payments@blendworks.com</strong>
                                <button onclick="window.utils.copyToClipboard('payments@blendworks.com')" class="copy-btn">
                                    <i class="fas fa-copy"></i>
                                </button>
                            </div>
                            
                            <div class="payment-reference">
                                <p>Reference: <strong>${packageConfig.name.toUpperCase()}-${Date.now()}</strong></p>
                                <button onclick="window.utils.copyToClipboard('${packageConfig.name.toUpperCase()}-${Date.now()}')" class="copy-btn">
                                    <i class="fas fa-copy"></i>
                                </button>
                            </div>
                            
                            <div class="payment-note">
                                <p><strong>Note:</strong> Include your email address in the PayPal message for credit delivery.</p>
                            </div>
                        </div>
                        
                        <div class="manual-payment-actions">
                            <a href="https://paypal.me/blendworks/${pricing.finalPrice}${this.currentCurrency}" 
                               target="_blank" class="btn btn-primary">
                                <i class="fab fa-paypal"></i>
                                Pay with PayPal
                            </a>
                            <button class="btn btn-outline" onclick="window.payments.confirmManualPayment('${packageName}', ${JSON.stringify(pricing).replace(/"/g, '&quot;')})">
                                I've Sent Payment
                            </button>
                        </div>
                    </div>
                </div>
            `
        });
        
        document.body.appendChild(modal);
        modal.classList.add('active');
    }

    async confirmManualPayment(packageName, pricing) {
        // Store manual payment for processing
        await this.storePendingPurchase(this.packages[packageName], pricing, 'paypal_manual');
        
        // Close modal
        document.querySelector('.manual-paypal-modal')?.remove();
        
        // Show confirmation
        window.utils.showToast('Payment confirmation received! Credits will be added within 24 hours.', 'success', 8000);
        
        // Track manual payment
        if (window.analytics) {
            window.analytics.trackEvent('manual_payment_submitted', {
                package: packageName,
                amount: pricing.finalPrice,
                currency: this.currentCurrency
            });
        }
    }

    async storePendingPurchase(packageConfig, pricing, paymentMethod) {
        try {
            if (!this.supabase) return;
            
            const purchaseData = {
                transaction_id: this.generateClientReferenceId(packageConfig.name),
                package_name: packageConfig.name,
                quantity: pricing.quantity || 1,
                amount: pricing.finalPrice,
                currency: this.currentCurrency,
                payment_method: paymentMethod,
                payment_gateway: paymentMethod === 'stripe' ? 'stripe_checkout' : 'paypal_checkout',
                status: 'pending',
                country_code: this.currentCountry,
                credits_purchased: pricing.totalCredits,
                combinations_purchased: pricing.totalCombinations,
                user_email: this.getUserEmail(),
                client_reference_id: this.generateClientReferenceId(packageConfig.name),
                created_at: new Date().toISOString(),
                payment_data: {
                    source: 'github_pages',
                    user_agent: navigator.userAgent,
                    referrer: document.referrer,
                    discount_code: this.discountCode,
                    affiliate_code: this.affiliateCode,
                    bulk_quantity: pricing.quantity > 1 ? pricing.quantity : null,
                    bulk_discount: pricing.discount || null,
                    original_price: pricing.totalBasePrice || pricing.finalPrice
                }
            };
            
            const { data, error } = await this.supabase
                .from('purchases')
                .insert([purchaseData]);
            
            if (error) {
                throw error;
            }
            
            console.log('💾 Pending purchase stored');
            
        } catch (error) {
            console.warn('⚠️ Failed to store pending purchase:', error);
            // Don't throw - this shouldn't fail the main request
        }
    }

    getUserEmail() {
        // Try to get email from various sources
        return localStorage.getItem('blendworks_lead_email') || 
               sessionStorage.getItem('user_email') || 
               document.querySelector('input[type="email"]')?.value ||
               '';
    }

    generateClientReferenceId(packageName) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        return `${packageName}_${timestamp}_${random}`;
    }

    async applyDiscountCode(code) {
        try {
            if (!code || code.trim() === '') {
                window.utils.showToast('Please enter a discount code', 'warning');
                return;
            }
            
            // For demo purposes, we'll accept some test codes
            const validCodes = {
                'SAVE10': { discount: 0.10, description: '10% off' },
                'WELCOME20': { discount: 0.20, description: '20% off' },
                'BULK25': { discount: 0.25, description: '25% off bulk purchases' },
                'STUDENT50': { discount: 0.50, description: '50% student discount' }
            };
            
            const discountInfo = validCodes[code.toUpperCase()];
            
            if (discountInfo) {
                this.discountCode = code.toUpperCase();
                window.utils.showToast(`✅ Discount applied: ${discountInfo.description}`, 'success');
                
                // Update pricing display with discount
                this.updatePricingWithDiscount(discountInfo);
                
                // Track discount application
                if (window.analytics) {
                    window.analytics.trackEvent('discount_applied', {
                        code: code.toUpperCase(),
                        discount: discountInfo.discount,
                        country: this.currentCountry
                    });
                }
            } else {
                window.utils.showToast('❌ Invalid discount code', 'error');
            }
            
        } catch (error) {
            console.error('❌ Discount application failed:', error);
            window.utils.showToast('Failed to apply discount', 'error');
        }
    }

    updatePricingWithDiscount(discountInfo) {
        Object.keys(this.packages).forEach(packageName => {
            const packageConfig = this.packages[packageName];
            const localPrice = this.convertPrice(packageConfig.basePrice, this.currentCurrency);
            const discountedPrice = localPrice * (1 - discountInfo.discount);
            
            // Update price elements to show discount
            const priceElements = document.querySelectorAll(`[data-package="${packageName}"] .amount`);
            priceElements.forEach(element => {
                element.innerHTML = `
                    <span class="original-price">${this.formatPriceNumber(localPrice)}</span>
                    <span class="discounted-price">${this.formatPriceNumber(discountedPrice)}</span>
                `;
            });
            
            // Add discount badge
            const cards = document.querySelectorAll(`[data-package="${packageName}"]`);
            cards.forEach(card => {
                let discountBadge = card.querySelector('.discount-badge');
                if (!discountBadge) {
                    discountBadge = window.utils.createElement('div', {
                        className: 'discount-badge',
                        textContent: discountInfo.description
                    });
                    card.appendChild(discountBadge);
                }
            });
        });
    }

    handleURLParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        
        // Handle successful payment
        if (urlParams.get('success') === 'true' || urlParams.get('session_id')) {
            this.handleSuccessfulPayment(urlParams);
        }
        
        // Handle cancelled payment
        if (urlParams.get('cancelled') === 'true') {
            this.handleCancelledPayment(urlParams);
        }
        
        // Handle affiliate code
        const affiliateCode = urlParams.get('ref') || urlParams.get('affiliate');
        if (affiliateCode) {
            this.affiliateCode = affiliateCode;
            localStorage.setItem('blendworks_affiliate_code', affiliateCode);
        }
        
        // Handle discount code
        const discountCode = urlParams.get('discount') || urlParams.get('coupon');
        if (discountCode) {
            setTimeout(() => {
                this.applyDiscountCode(discountCode);
            }, 1000);
        }
    }

    handleSuccessfulPayment(urlParams) {
        const sessionId = urlParams.get('session_id');
        const packageName = urlParams.get('package');
        
        if (sessionId && packageName) {
            // Show success message
            window.utils.showToast('🎉 Payment successful! Credits will be added to your account shortly.', 'success', 10000);
            
            // Track successful payment
            if (window.analytics) {
                window.analytics.trackEvent('payment_completed', {
                    session_id: sessionId,
                    package: packageName,
                    currency: this.currentCurrency,
                    country: this.currentCountry
                });
            }
            
            // Redirect to app after a delay
            setTimeout(() => {
                window.location.href = 'app.html?welcome=true';
            }, 3000);
        }
    }

    handleCancelledPayment(urlParams) {
        const packageName = urlParams.get('package');
        
        window.utils.showToast('Payment was cancelled. You can try again anytime.', 'info', 5000);
        
        // Track cancelled payment
        if (window.analytics) {
            window.analytics.trackEvent('payment_cancelled', {
                package: packageName || 'unknown',
                currency: this.currentCurrency,
                country: this.currentCountry
            });
        }
    }

    showPaymentLoading(packageName) {
        const buttons = document.querySelectorAll(`[data-package="${packageName}"] .pay-button, .payment-btn`);
        buttons.forEach(button => {
            button.disabled = true;
            button.dataset.originalText = button.textContent;
            button.innerHTML = '<span class="spinner"></span> Processing...';
        });
    }

    hidePaymentLoading() {
        const buttons = document.querySelectorAll('.pay-button, .payment-btn');
        buttons.forEach(button => {
            button.disabled = false;
            if (button.dataset.originalText) {
                button.textContent = button.dataset.originalText;
                delete button.dataset.originalText;
            }
        });
    }

    showPaymentError(message) {
        // Create error toast
        const toast = document.createElement('div');
        toast.className = 'payment-error-toast';
        toast.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: var(--error);
                color: white;
                padding: 16px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 9999;
                max-width: 350px;
                font-size: 14px;
                display: flex;
                align-items: center;
                gap: 8px;
            ">
                <i class="fas fa-exclamation-triangle"></i>
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" style="
                    background: none;
                    border: none;
                    color: white;
                    font-size: 18px;
                    cursor: pointer;
                    margin-left: auto;
                ">×</button>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 5000);
    }

    // Public API for external use
    getPackagePrice(packageName, currency = null) {
        const packageConfig = this.packages[packageName];
        if (!packageConfig) return null;
        
        const targetCurrency = currency || this.currentCurrency;
        return this.convertPrice(packageConfig.basePrice, targetCurrency);
    }

    getCurrentCurrency() {
        return this.currentCurrency;
    }

    getSupportedCurrencies() {
        return Object.keys(this.exchangeRates);
    }

    // Switch currency functionality
    async switchCurrency(newCurrency) {
        if (this.exchangeRates[newCurrency]) {
            this.currentCurrency = newCurrency;
            document.documentElement.setAttribute('data-currency', newCurrency);
            this.updatePricingDisplay();
            
            // Save preference
            localStorage.setItem('blendworks_preferred_currency', newCurrency);
            
            window.utils.showToast(`Currency changed to ${newCurrency}`, 'success');
        }
    }
}

// Global payment functions for HTML onclick handlers
function selectPackage(packageName, quantity = 1) {
    if (window.payments) {
        window.payments.initiatePayment(packageName, quantity);
    }
}

function applyDiscount() {
    const discountCode = document.getElementById('discountCode')?.value;
    if (discountCode && window.payments) {
        window.payments.applyDiscountCode(discountCode);
    }
}

function switchCurrency(currency) {
    if (window.payments) {
        window.payments.switchCurrency(currency);
    }
}

// Initialize payments system
window.payments = new BlendWorksPayments();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.payments.init();
    });
} else {
    window.payments.init();
}

console.log('💳 BlendWorks Payments loaded with CORRECT pricing');