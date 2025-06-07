// emailService.js - Fixed Email integration for Flixxit subscription system
const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail'); // Optional: SendGrid integration

class EmailService {
    constructor(config = {}) {
        this.config = {
            provider: config.provider || 'nodemailer', // 'nodemailer' or 'sendgrid'
            ...config
        };
        
        this.templates = {
            'subscription-expired': {
                subject: 'Your Flixxit subscription has expired',
                html: this.getExpiredTemplate(),
                text: 'Your Flixxit subscription has expired. Please renew to continue enjoying our content.'
            },
            'subscription-warning': {
                subject: 'Your Flixxit subscription expires soon',
                html: this.getWarningTemplate(),
                text: 'Your Flixxit subscription expires soon. Renew now to avoid interruption.'
            },
            'admin-weekly-summary': {
                subject: 'Weekly Flixxit Subscription Summary',
                html: this.getAdminSummaryTemplate(),
                text: 'Weekly subscription summary report'
            }
        };

        this.initializeProvider();
    }

    initializeProvider() {
        if (this.config.provider === 'sendgrid') {
            if (this.config.sendgridApiKey) {
                sgMail.setApiKey(this.config.sendgridApiKey);
            }
        } else {
            // Nodemailer setup
            this.transporter = nodemailer.createTransporter({
                host: this.config.smtpHost || 'smtp.gmail.com',
                port: this.config.smtpPort || 587,
                secure: false,
                auth: {
                    user: this.config.smtpUser,
                    pass: this.config.smtpPass
                }
            });
        }
    }

    async send(options) {
        try {
            const template = this.templates[options.template];
            if (!template) {
                throw new Error(`Template ${options.template} not found`);
            }

            const emailData = {
                to: options.to,
                from: options.from || this.config.fromEmail || 'noreply@flixxit.com',
                subject: this.processTemplate(template.subject, options.data),
                html: this.processTemplate(template.html, options.data),
                text: this.processTemplate(template.text, options.data)
            };

            if (this.config.provider === 'sendgrid') {
                return await this.sendWithSendGrid(emailData);
            } else {
                return await this.sendWithNodemailer(emailData);
            }
        } catch (error) {
            console.error('Email sending failed:', error.message);
            throw error;
        }
    }

    async sendWithNodemailer(emailData) {
        const info = await this.transporter.sendMail(emailData);
        return {
            success: true,
            messageId: info.messageId,
            response: info.response
        };
    }

    async sendWithSendGrid(emailData) {
        const response = await sgMail.send(emailData);
        return {
            success: true,
            messageId: response[0].headers['x-message-id'],
            statusCode: response[0].statusCode
        };
    }

    processTemplate(template, data) {
        if (!template || !data) return template;
        
        let processed = template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            return data[key] || match;
        });

        // Handle revenue breakdown table for admin summary
        if (data.revenueBreakdown && Array.isArray(data.revenueBreakdown)) {
            const tableRows = data.revenueBreakdown.map(item => `
                <tr>
                    <td>${item._id || item.planType || 'Unknown'}</td>
                    <td>${item.count || 0}</td>
                    <td>$${item.revenue || 0}</td>
                </tr>
            `).join('');
            
            processed = processed.replace('{{revenueBreakdownRows}}', tableRows);
        }

        return processed;
    }

    getExpiredTemplate() {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Subscription Expired</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #e74c3c; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background: #f9f9f9; }
                .button { display: inline-block; padding: 12px 24px; background: #3498db; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
                .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎬 Flixxit</h1>
                    <h2>Subscription Expired</h2>
                </div>
                <div class="content">
                    <p>Hi {{userName}},</p>
                    <p>Your Flixxit {{subscriptionType}} subscription expired on <strong>{{expiredDate}}</strong>.</p>
                    <p>Don't miss out on your favorite shows and movies! Renew your subscription now to continue enjoying unlimited streaming.</p>
                    <p style="text-align: center;">
                        <a href="{{renewalUrl}}" class="button">Renew Subscription</a>
                    </p>
                    <p>Need help? Contact our support team at <a href="mailto:{{supportEmail}}">{{supportEmail}}</a></p>
                </div>
                <div class="footer">
                    <p>© 2025 Flixxit. All rights reserved.</p>
                    <p>You received this email because your subscription has expired.</p>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    getWarningTemplate() {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Subscription Expiring Soon</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #f39c12; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background: #f9f9f9; }
                .button { display: inline-block; padding: 12px 24px; background: #27ae60; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
                .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0; }
                .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎬 Flixxit</h1>
                    <h2>⚠️ Subscription Expiring Soon</h2>
                </div>
                <div class="content">
                    <p>Hi {{userName}},</p>
                    <div class="warning">
                        <strong>⏰ Your {{subscriptionType}} subscription expires in {{daysLeft}} days!</strong>
                        <br>Expiration Date: <strong>{{expirationDate}}</strong>
                    </div>
                    <p>Don't let your streaming experience be interrupted. Renew your subscription now to continue enjoying:</p>
                    <ul>
                        <li>✅ Unlimited movies and TV shows</li>
                        <li>✅ Ad-free streaming</li>
                        <li>✅ Multiple device support</li>
                        <li>✅ Offline downloads</li>
                    </ul>
                    <p style="text-align: center;">
                        <a href="{{renewalUrl}}" class="button">Renew Now</a>
                    </p>
                </div>
                <div class="footer">
                    <p>© 2025 Flixxit. All rights reserved.</p>
                    <p>You received this reminder because your subscription expires soon.</p>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    getAdminSummaryTemplate() {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Weekly Subscription Summary</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 800px; margin: 0 auto; padding: 20px; }
                .header { background: #2c3e50; color: white; padding: 20px; text-align: center; }
                .stats { display: flex; flex-wrap: wrap; gap: 20px; margin: 20px 0; }
                .stat-card { flex: 1; min-width: 200px; background: #ecf0f1; padding: 20px; border-radius: 8px; text-align: center; }
                .stat-number { font-size: 2em; font-weight: bold; color: #3498db; }
                .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                .table th, .table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                .table th { background: #f8f9fa; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>📊 Flixxit Weekly Report</h1>
                    <p>Generated on {{timestamp}}</p>
                </div>
                
                <div class="stats">
                    <div class="stat-card">
                        <div class="stat-number">{{totalUsers}}</div>
                        <div>Total Users</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">{{activeSubscriptions}}</div>
                        <div>Active Subscriptions</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">{{expiringSoon}}</div>
                        <div>Expiring Soon</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${{estimatedRevenue}}</div>
                        <div>Monthly Revenue</div>
                    </div>
                </div>

                <h3>Revenue Breakdown</h3>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Plan Type</th>
                            <th>Active Users</th>
                            <th>Revenue</th>
                        </tr>
                    </thead>
                    <tbody>
                        {{revenueBreakdownRows}}
                    </tbody>
                </table>
                
                <div style="margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 5px;">
                    <h3>Actions Needed</h3>
                    <ul>
                        <li>{{needsCleanup}} expired subscriptions need cleanup</li>
                        <li>{{expiringSoon}} users need renewal reminders</li>
                    </ul>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    // Test email functionality
    async testConnection() {
        try {
            if (this.config.provider === 'nodemailer' && this.transporter) {
                await this.transporter.verify();
                console.log('✅ Email service connection verified');
                return { success: true };
            } else if (this.config.provider === 'sendgrid') {
                console.log('✅ SendGrid API key configured');
                return { success: true };
            } else {
                console.log('⚠️ Email service not properly configured');
                return { success: false, error: 'Email service not configured' };
            }
        } catch (error) {
            console.error('❌ Email service connection failed:', error.message);
            return { success: false, error: error.message };
        }
    }
}

// Enhanced SubscriptionManager with email integration
class EnhancedSubscriptionManager {
    constructor(serverUrl, options = {}) {
        this.serverUrl = serverUrl;
        this.options = options;
        this.emailService = new EmailService(options.emailConfig || {});
    }

    async sendExpirationNotification(user) {
        try {
            const result = await this.emailService.send({
                to: user.email,
                template: 'subscription-expired',
                data: {
                    userName: user.username || user.email.split('@')[0],
                    expiredDate: new Date(user.expiredOn).toLocaleDateString(),
                    subscriptionType: user.subscriptionType || 'Premium',
                    renewalUrl: `${this.serverUrl}/renew?userId=${user.id}`,
                    supportEmail: 'support@flixxit.com'
                }
            });

            console.log(`✅ Expiration notification sent to ${user.email}`);
            return result;
        } catch (error) {
            console.error(`❌ Failed to send expiration notification to ${user.email}:`, error.message);
            throw error;
        }
    }

    async sendExpirationWarning(user) {
        try {
            const expirationDate = new Date(user.expiredOn);
            const today = new Date();
            const daysLeft = Math.ceil((expirationDate - today) / (1000 * 60 * 60 * 24));

            const result = await this.emailService.send({
                to: user.email,
                template: 'subscription-warning',
                data: {
                    userName: user.username || user.email.split('@')[0],
                    subscriptionType: user.subscriptionType || 'Premium',
                    daysLeft: daysLeft,
                    expirationDate: expirationDate.toLocaleDateString(),
                    renewalUrl: `${this.serverUrl}/renew?userId=${user.id}`
                }
            });

            console.log(`⚠️ Expiration warning sent to ${user.email} (${daysLeft} days left)`);
            return result;
        } catch (error) {
            console.error(`❌ Failed to send expiration warning to ${user.email}:`, error.message);
            throw error;
        }
    }

    async sendAdminWeeklySummary(adminEmail, summaryData) {
        try {
            const result = await this.emailService.send({
                to: adminEmail,
                template: 'admin-weekly-summary',
                data: {
                    timestamp: new Date().toLocaleString(),
                    totalUsers: summaryData.totalUsers || 0,
                    activeSubscriptions: summaryData.activeSubscriptions || 0,
                    expiringSoon: summaryData.expiringSoon || 0,
                    estimatedRevenue: summaryData.estimatedRevenue || 0,
                    revenueBreakdown: summaryData.revenueBreakdown || [],
                    needsCleanup: summaryData.needsCleanup || 0
                }
            });

            console.log(`📊 Weekly summary sent to ${adminEmail}`);
            return result;
        } catch (error) {
            console.error(`❌ Failed to send weekly summary to ${adminEmail}:`, error.message);
            throw error;
        }
    }

    // Test email service functionality
    async testEmailService() {
        try {
            console.log('🧪 Testing email service...');
            return await this.emailService.testConnection();
        } catch (error) {
            console.error('❌ Email service test failed:', error.message);
            return { success: false, error: error.message };
        }
    }
}

// Simple usage example without complex initialization
const createEmailService = (config = {}) => {
    return new EmailService({
        provider: 'nodemailer',
        smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
        smtpPort: process.env.SMTP_PORT || 587,
        smtpUser: process.env.EMAIL_USER,
        smtpPass: process.env.EMAIL_PASS,
        fromEmail: process.env.FROM_EMAIL || 'noreply@flixxit.com',
        ...config
    });
};

// Export modules
module.exports = {
    EmailService,
    EnhancedSubscriptionManager,
    createEmailService
};

// Simple test if running directly
if (require.main === module) {
    console.log('📧 Email service loaded successfully');
    
    // Test template processing
    const emailService = createEmailService();
    const testData = {
        userName: 'John',
        subscriptionType: 'Premium',
        expiredDate: '2025-06-01',
        renewalUrl: 'https://flixxit.com/renew',
        supportEmail: 'support@flixxit.com'
    };
    
    console.log('📝 Template processing test completed');
}