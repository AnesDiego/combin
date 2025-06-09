/**
 * BlendWorks Success Page - Payment Confirmation & Credit Processing
 * Handles post-purchase experience and credit activation
 */

class BlendWorksSuccessPage {
    constructor() {
        this.sessionId = null;
        this.packageName = null;
        this.quantity = 1;
        this.transactionData = null;
        this.creditProcessingInterval = null;
        this.maxProcessingTime = 300000; // 5 minutes max
        this.processingStartTime = Date.now();
        
        // Package configurations (matching payments.js)
        this.packages = {
            starter: {
                name: 'Starter Pack',
                credits: 2,
                combinations: 10000,
                icon: '🏁'
            },
            professional: {
                name: 'Professional Pack',
                credits: 10,
                combinations: 100000,
                icon: '💼'
            },
            enterprise: {
                name: 'Enterprise Pack',
                credits: 50,
                combinations: 1000000,
                icon: '🏢'
            },
            mega: {
                name: 'Mega Pack',
                credits: 100,
                combinations: 5000000,
                icon: '⚡'
            }
        };
    }

    async init() {
        console.log('🎉 Initializing Success Page...');
        
        try {
            // Parse URL parameters
            this.parseURLParameters();
            
            // Initialize services
            await this.initializeServices();
            
            // Display purchase details
            this.displayPurchaseDetails();
            
            // Start celebration animation
            this.startCelebration();
            
            // Begin credit processing check
            await this.startCreditProcessing();
            
            // Track success page view
            this.trackSuccessPageView();
            
            console.log('✅ Success page initialized');
            
        } catch (error) {
            console.error('❌ Success page initialization failed:', error);
            this.handleInitializationError(error);
        }
    }

    parseURLParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        
        this.sessionId = urlParams.get('session_id');
        this.packageName = urlParams.get('package') || 'professional';
        this.quantity = parseInt(urlParams.get('quantity')) || 1;
        
        // Additional parameters
        const paymentMethod = urlParams.get('payment_method') || 'stripe';
        const referrer = urlParams.get('ref');
        
        console.log(`📋 Purchase details: ${this.packageName} x${this.quantity}, Session: ${this.sessionId}`);
    }

    async initializeServices() {
        // Initialize Supabase if available
        if (window.supabase) {
            this.supabase = window.supabase;
        } else {
            try {
                const supabaseUrl = 'https://your-project.supabase.co';
                const supabaseAnonKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...';
                this.supabase = supabase.createClient(supabaseUrl, supabaseAnonKey);
            } catch (error) {
                console.warn('⚠️ Supabase initialization failed:', error);
            }
        }
    }

    displayPurchaseDetails() {
        const packageConfig = this.packages[this.packageName];
        if (!packageConfig) {
            console.warn(`Unknown package: ${this.packageName}`);
            return;
        }
        
        // Calculate totals
        const totalCredits = packageConfig.credits * this.quantity;
        const totalCombinations = packageConfig.combinations * this.quantity;
        
        // Update display elements
        this.updateElement('packageName', `${packageConfig.icon} ${packageConfig.name}${this.quantity > 1 ? ` x${this.quantity}` : ''}`);
        this.updateElement('creditsAmount', `${totalCredits.toLocaleString()} credits`);
        this.updateElement('combinationsAmount', `${totalCombinations.toLocaleString()} combinations`);
        
        // Generate display transaction ID
        const displayTxId = this.sessionId ? 
            this.sessionId.substring(0, 8).toUpperCase() :
            `BW-${Date.now().toString().slice(-8)}`;
        this.updateElement('transactionId', displayTxId);
        
        console.log(`📦 Displayed: ${packageConfig.name} - ${totalCredits} credits`);
    }

    updateElement(id, content) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = content;
        }
    }

    startCelebration() {
        // Start confetti animation
        const celebrationOverlay = document.getElementById('celebrationOverlay');
        if (celebrationOverlay) {
            celebrationOverlay.style.display = 'block';
            
            // Hide after 5 seconds
            setTimeout(() => {
                celebrationOverlay.style.display = 'none';
            }, 5000);
        }
        
        // Success animation
        setTimeout(() => {
            const successCircle = document.querySelector('.success-circle');
            if (successCircle) {
                successCircle.classList.add('animate');
            }
        }, 500);
        
        // Particle animation
        this.animateParticles();
    }

    animateParticles() {
        const particles = document.querySelectorAll('.particle');
        particles.forEach((particle, index) => {
            setTimeout(() => {
                particle.style.animation = `float 3s ease-in-out infinite`;
                particle.style.animationDelay = `${index * 0.2}s`;
            }, index * 200);
        });
    }

    async startCreditProcessing() {
        console.log('⚙️ Starting credit processing...');
        
        // Simulate processing steps
        await this.processStep1(); // Payment confirmed (immediate)
        await this.processStep2(); // Adding credits (2-3 seconds)
        await this.processStep3(); // Ready to generate (final)
    }

    async processStep1() {
        // Step 1 is already completed (payment confirmed)
        await this.sleep(500);
        console.log('✅ Step 1: Payment confirmed');
    }

    async processStep2() {
        // Processing credits - this is where we'd actually add credits
        await this.sleep(1000);
        
        try {
            // Attempt to add credits to user account
            await this.addCreditsToAccount();
            
            // Mark step 2 as completed
            this.markStepCompleted('step2');
            
            console.log('✅ Step 2: Credits added');
            
        } catch (error) {
            console.error('❌ Credit processing failed:', error);
            this.handleCreditProcessingError(error);
        }
    }

    async processStep3() {
        await this.sleep(1000);
        
        // Mark step 3 as completed
        this.markStepCompleted('step3');
        
        // Update status to ready
        this.updateProcessingStatus('completed');
        
        // Enable the generate button
        this.enableGenerateButton();
        
        console.log('✅ Step 3: Ready to generate');
    }

    async addCreditsToAccount() {
        try {
            if (!this.supabase) {
                // Fallback: store in localStorage for guest users
                await this.addCreditsToLocalStorage();
                return;
            }
            
            const userEmail = this.getUserEmail();
            if (!userEmail) {
                throw new Error('User email not found');
            }
            
            const packageConfig = this.packages[this.packageName];
            const creditsToAdd = packageConfig.credits * this.quantity;
            
            // First, try to update existing user
            const { data: existingUser } = await this.supabase
                .from('users')
                .select('*')
                .eq('email', userEmail)
                .single();
            
            if (existingUser) {
                // Update existing user's credits
                const newCredits = (existingUser.credits || 0) + creditsToAdd;
                
                const { error } = await this.supabase
                    .from('users')
                    .update({ 
                        credits: newCredits,
                        last_purchase: new Date().toISOString(),
                        plan: this.getBestPlan(newCredits)
                    })
                    .eq('email', userEmail);
                
                if (error) throw error;
                
            } else {
                // Create new user
                const { error } = await this.supabase
                    .from('users')
                    .insert([{
                        email: userEmail,
                        credits: creditsToAdd,
                        plan: this.getBestPlan(creditsToAdd),
                        created_at: new Date().toISOString(),
                        last_purchase: new Date().toISOString()
                    }]);
                
                if (error) throw error;
            }
            
            // Update purchase record
            await this.updatePurchaseRecord('completed');
            
            // Store credits in localStorage as well (for immediate use)
            await this.addCreditsToLocalStorage();
            
            console.log(`💰 Added ${creditsToAdd} credits to account`);
            
        } catch (error) {
            console.error('❌ Database credit update failed:', error);
            // Fallback to localStorage
            await this.addCreditsToLocalStorage();
        }
    }

    async addCreditsToLocalStorage() {
        const packageConfig = this.packages[this.packageName];
        const creditsToAdd = packageConfig.credits * this.quantity;
        
        // Get existing credits
        const existingCredits = parseInt(localStorage.getItem('blendworks_user_credits')) || 0;
        const newTotal = existingCredits + creditsToAdd;
        
        // Store new total
        localStorage.setItem('blendworks_user_credits', newTotal.toString());
        localStorage.setItem('blendworks_last_purchase', new Date().toISOString());
        localStorage.setItem('blendworks_user_plan', this.getBestPlan(newTotal));
        
        console.log(`💾 Added ${creditsToAdd} credits to localStorage (Total: ${newTotal})`);
    }

    getBestPlan(credits) {
        if (credits >= 100) return 'mega';
        if (credits >= 50) return 'enterprise';
        if (credits >= 10) return 'professional';
        if (credits >= 2) return 'starter';
        return 'free';
    }

    getUserEmail() {
        return localStorage.getItem('blendworks_lead_email') ||
               sessionStorage.getItem('user_email') ||
               '';
    }

    async updatePurchaseRecord(status) {
        try {
            if (!this.supabase || !this.sessionId) return;
            
            const { error } = await this.supabase
                .from('purchases')
                .update({ 
                    status: status,
                    completed_at: new Date().toISOString(),
                    credits_delivered: this.packages[this.packageName].credits * this.quantity
                })
                .eq('transaction_id', this.sessionId);
            
            if (error) {
                console.warn('⚠️ Purchase record update failed:', error);
            }
            
        } catch (error) {
            console.warn('⚠️ Purchase record update failed:', error);
        }
    }

    markStepCompleted(stepId) {
        const step = document.getElementById(stepId);
        if (step) {
            step.classList.remove('processing', 'pending');
            step.classList.add('completed');
            
            const icon = step.querySelector('.step-icon');
            if (icon) {
                icon.innerHTML = '<i class="fas fa-check"></i>';
            }
        }
        
        // Move processing to next step
        const nextStepId = stepId === 'step2' ? 'step3' : null;
        if (nextStepId) {
            const nextStep = document.getElementById(nextStepId);
            if (nextStep) {
                nextStep.classList.remove('pending');
                nextStep.classList.add('processing');
                
                const nextIcon = nextStep.querySelector('.step-icon');
                if (nextIcon) {
                    nextIcon.innerHTML = '<div class="mini-spinner"></div>';
                }
            }
        }
    }

    updateProcessingStatus(status) {
        const processingStatus = document.getElementById('processingStatus');
        if (!processingStatus) return;
        
        if (status === 'completed') {
            processingStatus.classList.add('completed');
            
            const statusIcon = processingStatus.querySelector('.status-icon');
            const statusText = processingStatus.querySelector('.status-text h3');
            const statusDesc = processingStatus.querySelector('.status-text p');
            
            if (statusIcon) {
                statusIcon.innerHTML = '<i class="fas fa-check-circle" style="color: var(--success); font-size: 2rem;"></i>';
            }
            
            if (statusText) {
                statusText.textContent = '🎉 Credits Added Successfully!';
            }
            
            if (statusDesc) {
                statusDesc.textContent = 'Your credits are now available. You can start generating combinations immediately.';
            }
        }
    }

    enableGenerateButton() {
        const generateBtn = document.getElementById('startGeneratingBtn');
        if (generateBtn) {
            generateBtn.classList.add('pulse');
            generateBtn.style.background = 'linear-gradient(135deg, var(--success), var(--primary))';
        }
    }

    handleCreditProcessingError(error) {
        console.error('💥 Credit processing error:', error);
        
        // Update UI to show manual processing
        const processingStatus = document.getElementById('processingStatus');
        if (processingStatus) {
            processingStatus.innerHTML = `
                <div class="status-header">
                    <div class="status-icon">
                        <i class="fas fa-clock" style="color: var(--warning); font-size: 2rem;"></i>
                    </div>
                    <div class="status-text">
                        <h3>Credits Being Processed Manually</h3>
                        <p>Your payment was successful! Credits will be added within 24 hours. You'll receive an email confirmation.</p>
                    </div>
                </div>
                <div class="manual-processing-info">
                    <div class="info-item">
                        <i class="fas fa-email"></i>
                        <span>Email confirmation sent</span>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-clock"></i>
                        <span>Processing within 24 hours</span>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-headset"></i>
                        <span>Support available 24/7</span>
                    </div>
                </div>
            `;
        }
        
        // Track processing error
        if (window.analytics) {
            window.analytics.trackEvent('credit_processing_error', {
                session_id: this.sessionId,
                package: this.packageName,
                quantity: this.quantity,
                error: error.message
            });
        }
    }

    handleInitializationError(error) {
        console.error('💥 Success page error:', error);
        
        // Show fallback content
        const successContent = document.querySelector('.success-content');
        if (successContent) {
            successContent.innerHTML = `
                <div class="error-fallback">
                    <div class="error-icon">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <h1>Payment Received!</h1>
                    <p>We've received your payment and are processing your credits.</p>
                    <p>You'll receive an email confirmation shortly.</p>
                    <div class="fallback-actions">
                        <a href="app.html" class="btn btn-primary">Continue to App</a>
                        <a href="mailto:support@blendworks.com" class="btn btn-outline">Contact Support</a>
                    </div>
                </div>
            `;
        }
    }

    trackSuccessPageView() {
        if (window.analytics) {
            window.analytics.trackEvent('success_page_viewed', {
                session_id: this.sessionId,
                package: this.packageName,
                quantity: this.quantity,
                timestamp: new Date().toISOString()
            });
        }
        
        // Track conversion for advertising platforms
        this.trackConversions();
    }

    trackConversions() {
        const packageConfig = this.packages[this.packageName];
        const revenue = this.calculateRevenue();
        
        // Google Analytics 4 conversion
        if (typeof gtag !== 'undefined') {
            gtag('event', 'purchase', {
                transaction_id: this.sessionId,
                value: revenue,
                currency: 'USD',
                items: [{
                    item_id: this.packageName,
                    item_name: packageConfig.name,
                    category: 'credits',
                    quantity: this.quantity,
                    price: revenue / this.quantity
                }]
            });
        }
        
        // Facebook Pixel conversion
        if (typeof fbq !== 'undefined') {
            fbq('track', 'Purchase', {
                value: revenue,
                currency: 'USD',
                content_ids: [this.packageName],
                content_type: 'product',
                num_items: this.quantity
            });
        }
        
        // Custom conversion tracking
        if (window.analytics && window.analytics.trackPurchase) {
            window.analytics.trackPurchase({
                transaction_id: this.sessionId,
                package: this.packageName,
                quantity: this.quantity,
                revenue: revenue,
                credits: packageConfig.credits * this.quantity,
                combinations: packageConfig.combinations * this.quantity
            });
        }
    }

    calculateRevenue() {
        // This would normally come from the payment data
        // For now, calculate based on package base prices
        const basePrices = {
            starter: 0.99,
            professional: 9.99,
            enterprise: 99.99,
            mega: 499.99
        };
        
        return basePrices[this.packageName] * this.quantity;
    }

    // Utility methods
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Global functions for HTML onclick handlers
function downloadReceipt() {
    // Generate and download receipt
    const receiptData = {
        date: new Date().toLocaleDateString(),
        transaction_id: window.successPage?.sessionId || 'BW-' + Date.now(),
        package: window.successPage?.packageName || 'professional',
        quantity: window.successPage?.quantity || 1,
        total: window.successPage?.calculateRevenue() || 9.99
    };
    
    const receiptContent = `
BLENDWORKS RECEIPT
==================

Date: ${receiptData.date}
Transaction ID: ${receiptData.transaction_id}
Package: ${receiptData.package}
Quantity: ${receiptData.quantity}
Total: $${receiptData.total}

Thank you for your purchase!

Support: support@blendworks.com
Website: https://blendworks.com
    `;
    
    // Download as text file
    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BlendWorks-Receipt-${receiptData.transaction_id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Track download
    if (window.analytics) {
        window.analytics.trackEvent('receipt_downloaded', {
            transaction_id: receiptData.transaction_id
        });
    }
    
    window.utils.showToast('Receipt downloaded!', 'success');
}

function startTutorial() {
    // Launch interactive tutorial
    window.utils.showToast('Tutorial feature coming soon!', 'info');
    
    // For now, redirect to app with tutorial parameter
    window.location.href = 'app.html?tutorial=true';
}

function openLiveChat() {
    // Open live chat widget or redirect to support
    window.utils.showToast('Live chat opening...', 'info');
    
    // This would integrate with a chat service like Intercom, Zendesk, etc.
    // For now, open email
    window.location.href = 'mailto:support@blendworks.com?subject=Support Request - New Customer';
}

// Initialize success page
window.successPage = new BlendWorksSuccessPage();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.successPage.init();
    });
} else {
    window.successPage.init();
}

console.log('🎉 Success page script loaded');