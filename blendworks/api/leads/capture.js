import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ 
            success: false, 
            error: 'Method not allowed' 
        });
    }

    try {
        const leadData = req.body;
        
        // Validate required fields
        const validation = validateLeadData(leadData);
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: validation.errors
            });
        }

        // Enrich lead data
        const enrichedLead = await enrichLeadData(leadData, req);
        
        // Check for duplicate
        const duplicate = await checkDuplicateLead(enrichedLead.email);
        if (duplicate) {
            return await handleDuplicateLead(duplicate, enrichedLead, res);
        }

        // Save to database
        const { data, error } = await supabase
            .from('leads')
            .insert([enrichedLead])
            .select()
            .single();

        if (error) {
            throw error;
        }

        // Trigger automations
        await triggerLeadAutomations(data);

        // Track success
        console.log(`✅ Lead captured: ${data.email} (Score: ${data.lead_score})`);

        res.status(200).json({
            success: true,
            leadId: data.id,
            message: 'Lead captured successfully'
        });

    } catch (error) {
        console.error('❌ Lead capture error:', error);
        
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
        });
    }
}

function validateLeadData(data) {
    const errors = [];

    // Required fields
    if (!data.email || !isValidEmail(data.email)) {
        errors.push('Valid email is required');
    }

    if (!data.source) {
        errors.push('Source is required');
    }

    // Optional but validated fields
    if (data.leadScore && (data.leadScore < 0 || data.leadScore > 100)) {
        errors.push('Lead score must be between 0 and 100');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

async function enrichLeadData(leadData, req) {
    const now = new Date().toISOString();
    
    return {
        // Basic info
        email: leadData.email.toLowerCase().trim(),
        name: leadData.name?.trim() || '',
        source: leadData.source,
        interest: leadData.interest || 'general',
        
        // Behavioral data
        time_on_site: leadData.userBehavior?.timeOnSite || 0,
        pages_viewed: leadData.userBehavior?.pagesViewed || 1,
        scroll_depth: leadData.userBehavior?.scrollDepth || 0,
        package_interest: leadData.userBehavior?.packageInterest,
        
        // Location (from IP)
        country_code: leadData.country || await getCountryFromIP(req),
        city: leadData.city,
        timezone: leadData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        ip_hash: hashIP(getClientIP(req)),
        
        // Device/Browser
        user_agent: leadData.userAgent || req.headers['user-agent'],
        language: leadData.language || 'en',
        screen_resolution: leadData.screenResolution,
        referrer: leadData.referrer,
        
        // Lead scoring
        lead_score: leadData.leadScore || 0,
        lead_grade: calculateLeadGrade(leadData.leadScore || 0),
        priority: calculatePriority(leadData),
        
        // Status
        status: 'new',
        
        // Automations
        welcome_email_sent: false,
        follow_up_sequence: 0,
        next_follow_up_at: calculateNextFollowUp(leadData),
        
        // Metadata
        notes: '',
        tags: determineTags(leadData),
        
        // Timestamps
        created_at: now,
        updated_at: now
    };
}

async function checkDuplicateLead(email) {
    const { data } = await supabase
        .from('leads')
        .select('*')
        .eq('email', email)
        .single();
    
    return data;
}

async function handleDuplicateLead(existingLead, newLeadData, res) {
    // Update existing lead with new data
    const updatedData = {
        // Update behavioral data if new data is better
        time_on_site: Math.max(existingLead.time_on_site, newLeadData.time_on_site),
        pages_viewed: existingLead.pages_viewed + 1,
        scroll_depth: Math.max(existingLead.scroll_depth, newLeadData.scroll_depth),
        
        // Update score if new is higher
        lead_score: Math.max(existingLead.lead_score, newLeadData.lead_score),
        lead_grade: calculateLeadGrade(Math.max(existingLead.lead_score, newLeadData.lead_score)),
        
        // Add new source to notes if different
        notes: existingLead.source !== newLeadData.source ? 
            `${existingLead.notes}\nNew source: ${newLeadData.source} at ${new Date().toISOString()}` : 
            existingLead.notes,
        
        updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
        .from('leads')
        .update(updatedData)
        .eq('id', existingLead.id)
        .select()
        .single();

    if (error) {
        throw error;
    }

    console.log(`🔄 Updated existing lead: ${data.email}`);

    return res.status(200).json({
        success: true,
        leadId: data.id,
        message: 'Lead updated successfully',
        duplicate: true
    });
}

function calculateLeadGrade(score) {
    if (score >= 80) return 'A';
    if (score >= 60) return 'B';
    if (score >= 40) return 'C';
    return 'D';
}

function calculatePriority(leadData) {
    const score = leadData.leadScore || 0;
    const hasPackageInterest = leadData.userBehavior?.packageInterest;
    const isHighValue = leadData.isHighValue;

    if (score >= 80 || isHighValue || hasPackageInterest?.includes('enterprise')) {
        return 'urgent';
    }
    if (score >= 60 || hasPackageInterest?.includes('professional')) {
        return 'high';
    }
    if (score >= 40) {
        return 'medium';
    }
    return 'low';
}

function calculateNextFollowUp(leadData) {
    const priority = calculatePriority(leadData);
    const now = new Date();
    
    switch (priority) {
        case 'urgent':
            return new Date(now.getTime() + 5 * 60 * 1000).toISOString(); // 5 minutes
        case 'high':
            return new Date(now.getTime() + 30 * 60 * 1000).toISOString(); // 30 minutes
        case 'medium':
            return new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(); // 2 hours
        default:
            return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours
    }
}

function determineTags(leadData) {
    const tags = [];
    
    // Source-based tags
    if (leadData.source.includes('exit')) tags.push('exit-intent');
    if (leadData.source.includes('scroll')) tags.push('high-engagement');
    if (leadData.source.includes('package')) tags.push('purchase-intent');
    
    // Behavior-based tags
    if (leadData.userBehavior?.timeOnSite > 180000) tags.push('highly-engaged');
    if (leadData.userBehavior?.scrollDepth > 75) tags.push('deep-reader');
    if (leadData.userBehavior?.packageInterest) tags.push('buyer-intent');
    
    // Interest-based tags
    if (leadData.interest === 'business') tags.push('b2b');
    if (leadData.interest === 'enterprise') tags.push('enterprise');
    if (leadData.interest === 'marketing') tags.push('marketer');
    
    // Score-based tags
    if (leadData.leadScore >= 80) tags.push('hot-lead');
    if (leadData.leadScore >= 60) tags.push('warm-lead');
    
    return tags;
}

async function getCountryFromIP(req) {
    try {
        const ip = getClientIP(req);
        // In production, use a real IP geolocation service
        // For now, return a default
        return 'US';
    } catch {
        return 'Unknown';
    }
}

function getClientIP(req) {
    return req.headers['x-forwarded-for']?.split(',')[0] || 
           req.headers['x-real-ip'] || 
           req.connection?.remoteAddress || 
           '127.0.0.1';
}

function hashIP(ip) {
    return crypto
        .createHash('sha256')
        .update(ip + process.env.ENCRYPTION_KEY)
        .digest('hex')
        .substring(0, 16);
}

async function triggerLeadAutomations(leadData) {
    try {
        // 1. Send welcome email
        await sendWelcomeEmail(leadData);
        
        // 2. Notify on Slack/Discord (if configured)
        await notifyTeam(leadData);
        
        // 3. Add to email sequence
        await addToEmailSequence(leadData);
        
        // 4. Create follow-up tasks for high-value leads
        if (leadData.priority === 'urgent' || leadData.priority === 'high') {
            await createFollowUpTask(leadData);
        }
        
        console.log(`🚀 Automations triggered for ${leadData.email}`);
        
    } catch (error) {
        console.error('❌ Automation failed:', error);
        // Don't throw - automations failing shouldn't fail the main request
    }
}

async function sendWelcomeEmail(leadData) {
    try {
        // This would integrate with your email service (Resend, SendGrid, etc.)
        const emailData = {
            to: leadData.email,
            from: 'diego@blendworks.com',
            subject: getWelcomeSubject(leadData.language, leadData.source),
            template: 'welcome_lead',
            variables: {
                name: leadData.name || 'Friend',
                source: leadData.source,
                downloadLink: generateDownloadLink(leadData)
            }
        };

        // TODO: Implement actual email sending
        console.log(`📧 Welcome email queued for ${leadData.email}`);
        
        // Update lead record
        await supabase
            .from('leads')
            .update({ welcome_email_sent: true })
            .eq('id', leadData.id);
            
    } catch (error) {
        console.error('Email send failed:', error);
    }
}

function getWelcomeSubject(language, source) {
    const subjects = {
        'en': {
            'templates': '📋 Your Free Templates Are Ready!',
            'exit-intent': '🎁 Don\'t Miss Your Free BlendWorks Access',
            'default': '🚀 Welcome to BlendWorks!'
        },
        'pt-BR': {
            'templates': '📋 Seus Templates Grátis Estão Prontos!',
            'exit-intent': '🎁 Não Perca Seu Acesso Grátis ao BlendWorks',
            'default': '🚀 Bem-vindo ao BlendWorks!'
        }
    };
    
    const langSubjects = subjects[language] || subjects['en'];
    return langSubjects[source] || langSubjects['default'];
}

function generateDownloadLink(leadData) {
    // Generate secure download link for lead magnets
    const token = crypto.randomBytes(32).toString('hex');
    // Store token in database linked to lead
    // Return download URL with token
    return `https://blendworks.com/download/${leadData.source}?token=${token}`;
}

async function notifyTeam(leadData) {
    if (leadData.lead_score >= 70) {
        // High-value lead notification
        const message = `🔥 High-value lead captured!\n` +
                       `Email: ${leadData.email}\n` +
                       `Score: ${leadData.lead_score}\n` +
                       `Source: ${leadData.source}\n` +
                       `Country: ${leadData.country_code}`;
        
        // TODO: Send to Slack/Discord webhook
        console.log('🔔 Team notification:', message);
    }
}

async function addToEmailSequence(leadData) {
    // Add lead to appropriate email sequence based on interest and source
    const sequenceData = {
        lead_id: leadData.id,
        sequence_type: determineEmailSequence(leadData),
        current_step: 0,
        started_at: new Date().toISOString()
    };
    
    // TODO: Add to email sequences table
    console.log(`📬 Added to email sequence: ${sequenceData.sequence_type}`);
}

function determineEmailSequence(leadData) {
    if (leadData.interest === 'business' || leadData.interest === 'enterprise') {
        return 'b2b_nurture';
    }
    if (leadData.source.includes('template')) {
        return 'template_user';
    }
    if (leadData.package_interest) {
        return 'buyer_intent';
    }
    return 'general_nurture';
}

async function createFollowUpTask(leadData) {
    // Create task for sales team to follow up
    const taskData = {
        lead_id: leadData.id,
        task_type: 'follow_up',
        priority: leadData.priority,
        due_date: leadData.next_follow_up_at,
        description: `Follow up with ${leadData.name || leadData.email} - ${leadData.source} lead with score ${leadData.lead_score}`,
        status: 'pending'
    };
    
    // TODO: Add to tasks table or CRM
    console.log(`📋 Follow-up task created for ${leadData.email}`);
}