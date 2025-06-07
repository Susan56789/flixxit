// subscriptionCron.js
const cron = require('node-cron');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

class SubscriptionManager {
    constructor(serverUrl, options = {}) {
        this.serverUrl = serverUrl;
        this.options = {
            logFile: options.logFile || 'subscription-logs.json',
            retryAttempts: options.retryAttempts || 3,
            retryDelay: options.retryDelay || 5000,
            timezone: options.timezone || 'America/New_York',
            ...options
        };
        this.cronJobs = [];
    }

    // Enhanced cron job scheduling with timezone support
    startCronJob() {
        // Daily check at midnight
        const dailyJob = cron.schedule('0 0 * * *', async () => {
            console.log('Running daily subscription expiration check...');
            await this.checkExpiredSubscriptions('daily');
        }, {
            timezone: this.options.timezone
        });

        // Every 6 hours check
        const sixHourlyJob = cron.schedule('0 */6 * * *', async () => {
            console.log('Running 6-hour subscription check...');
            await this.checkExpiredSubscriptions('6hourly');
        }, {
            timezone: this.options.timezone
        });

        // Weekly summary (Sundays at 9 AM)
        const weeklyJob = cron.schedule('0 9 * * 0', async () => {
            console.log('Running weekly subscription summary...');
            await this.generateWeeklySummary();
        }, {
            timezone: this.options.timezone
        });

        this.cronJobs = [dailyJob, sixHourlyJob, weeklyJob];
        console.log(`Subscription cron jobs started (timezone: ${this.options.timezone})`);
    }

    // Enhanced expiration check with retry logic
    async checkExpiredSubscriptions(checkType = 'manual') {
        let attempt = 0;
        
        while (attempt < this.options.retryAttempts) {
            try {
                // Check expired subscriptions
                const expiredResponse = await axios.post(
                    `${this.serverUrl}/api/check-expired-subscriptions`,
                    { checkType },
                    { timeout: 30000 }
                );

                // Get users expiring soon (within 7 days by default)
                const expiringSoonResponse = await axios.get(
                    `${this.serverUrl}/api/users-expiring-soon?days=7`,
                    { timeout: 30000 }
                );

                const result = {
                    expiredCount: expiredResponse.data.expiredCount,
                    expiredUsers: expiredResponse.data.expiredUsers || [],
                    soonToExpireCount: expiringSoonResponse.data.count || 0,
                    soonToExpireUsers: expiringSoonResponse.data.users || [],
                    timestamp: new Date().toISOString(),
                    checkType,
                    success: true
                };

                console.log('Subscription check completed:', {
                    expiredCount: result.expiredCount,
                    soonToExpireCount: result.soonToExpireCount,
                    checkType: result.checkType,
                    timestamp: result.timestamp
                });

                // Log the results
                await this.logResults(result);

                // Handle expired users
                if (result.expiredUsers.length > 0) {
                    console.log(`Found ${result.expiredUsers.length} expired users`);
                    await this.notifyExpiredUsers(result.expiredUsers);
                }

                // Handle soon-to-expire users (proactive notifications)
                if (result.soonToExpireUsers.length > 0) {
                    console.log(`Found ${result.soonToExpireUsers.length} users expiring soon`);
                    await this.notifySoonToExpireUsers(result.soonToExpireUsers);
                }

                return result;

            } catch (error) {
                attempt++;
                console.error(`Attempt ${attempt} failed:`, error.message);
                
                if (attempt < this.options.retryAttempts) {
                    console.log(`Retrying in ${this.options.retryDelay}ms...`);
                    await this.delay(this.options.retryDelay);
                } else {
                    const errorResult = {
                        success: false,
                        error: error.message,
                        timestamp: new Date().toISOString(),
                        checkType,
                        attempts: attempt
                    };
                    
                    await this.logResults(errorResult);
                    throw error;
                }
            }
        }
    }

    // Enhanced notification system with templates
    async notifyExpiredUsers(expiredUsers) {
        const results = {
            successful: 0,
            failed: 0,
            errors: []
        };

        for (const user of expiredUsers) {
            try {
                await this.sendExpirationNotification(user);
                results.successful++;
                console.log(`✓ Expiration notification sent to ${user.email}`);
            } catch (error) {
                results.failed++;
                results.errors.push({ email: user.email, error: error.message });
                console.error(`✗ Failed to notify ${user.email}:`, error.message);
            }
        }

        console.log(`Notification summary: ${results.successful} sent, ${results.failed} failed`);
        return results;
    }

    // New: Notify users whose subscriptions expire soon
    async notifySoonToExpireUsers(soonToExpireUsers) {
        console.log(`Sending warning notifications to ${soonToExpireUsers.length} users`);
        
        for (const user of soonToExpireUsers) {
            try {
                await this.sendExpirationWarning(user);
                console.log(`Warning sent to ${user.email} (expires in ${user.daysRemaining} days)`);
            } catch (error) {
                console.error(`Failed to warn ${user.email}:`, error.message);
            }
        }
    }

    // Enhanced notification with better error handling
    async sendExpirationNotification(user) {
        // Add more sophisticated notification logic here
        const notificationData = {
            to: user.email,
            subject: 'Your Flixxit subscription has expired',
            template: 'subscription-expired',
            data: {
                userName: user.username || user.email.split('@')[0],
                expiredDate: user.expiredOn,
                subscriptionType: user.subscriptionType,
                renewalUrl: `${this.serverUrl}/renew?userId=${user.id}`,
                supportEmail: 'support@flixxit.com'
            }
        };

        // Simulate notification sending (replace with actual service)
        console.log(`📧 Sending expiration notification to ${user.email}`);
        
        // For testing - uncomment when you have actual email service
        /*
        const emailResponse = await emailService.send(notificationData);
        if (!emailResponse.success) {
            throw new Error(`Email service error: ${emailResponse.error}`);
        }
        */
        
        return { success: true, email: user.email };
    }

    // New: Send warning for soon-to-expire subscriptions
    async sendExpirationWarning(user) {
        const warningData = {
            to: user.email,
            subject: 'Your Flixxit subscription expires soon',
            template: 'subscription-warning',
            data: {
                userName: user.username || user.email.split('@')[0],
                expirationDate: user.expirationDate,
                daysLeft: user.daysRemaining,
                subscriptionType: user.subscriptionType,
                renewalUrl: `${this.serverUrl}/renew?userId=${user.id}`
            }
        };

        console.log(`⚠️ Sending expiration warning to ${user.email} (${user.daysRemaining} days left)`);
        return { success: true, email: user.email };
    }

    // New: Generate weekly summary report
    async generateWeeklySummary() {
        try {
            const stats = await this.getSubscriptionStats();
            if (stats) {
                console.log('📊 Weekly Subscription Summary:', {
                    totalUsers: stats.totalUsers,
                    activeSubscriptions: stats.subscriptionBreakdown.find(s => s._id === 'Premium')?.count || 0,
                    freeUsers: stats.subscriptionBreakdown.find(s => s._id === 'Free')?.count || 0,
                    expiringSoon: stats.expiringSoon,
                    needsCleanup: stats.needsCleanup,
                    estimatedRevenue: stats.estimatedMonthlyRevenue
                });

                // Send automated reminders as part of weekly summary
                if (stats.expiringSoon > 0) {
                    await this.sendAutomatedReminders(7); // Send 7-day warnings
                    await this.sendAutomatedReminders(3); // Send 3-day warnings
                }

                // Optionally send summary to admin
                await this.sendAdminSummary(stats);
            }
        } catch (error) {
            console.error('Failed to generate weekly summary:', error.message);
        }
    }

    // New: Send admin summary
    async sendAdminSummary(stats) {
        console.log('📈 Sending admin summary...');
        
        const summaryData = {
            totalUsers: stats.totalUsers,
            activeSubscriptions: stats.subscriptionBreakdown.find(s => s._id === 'Premium')?.count || 0,
            freeUsers: stats.subscriptionBreakdown.find(s => s._id === 'Free')?.count || 0,
            expiringSoon: stats.expiringSoon,
            needsCleanup: stats.needsCleanup,
            estimatedRevenue: stats.estimatedMonthlyRevenue,
            revenueBreakdown: stats.revenueByPlan,
            timestamp: stats.lastUpdated
        };

        // Here you would send email to admin with summary
        console.log('Admin Summary Data:', summaryData);
        
        // Implement admin email notification here
        /*
        await emailService.send({
            to: 'admin@flixxit.com',
            subject: 'Weekly Flixxit Subscription Summary',
            template: 'admin-weekly-summary',
            data: summaryData
        });
        */
    }

    // Enhanced logging system
    async logResults(result) {
        try {
            const logEntry = {
                ...result,
                id: this.generateLogId(),
                timestamp: result.timestamp || new Date().toISOString()
            };

            // Read existing logs
            let logs = [];
            try {
                const existingLogs = await fs.readFile(this.options.logFile, 'utf8');
                logs = JSON.parse(existingLogs);
            } catch (error) {
                // File doesn't exist or is invalid, start fresh
                logs = [];
            }

            // Add new log entry
            logs.push(logEntry);

            // Keep only last 1000 entries to prevent file from growing too large
            if (logs.length > 1000) {
                logs = logs.slice(-1000);
            }

            // Write back to file
            await fs.writeFile(this.options.logFile, JSON.stringify(logs, null, 2));
            
        } catch (error) {
            console.error('Failed to write log:', error.message);
        }
    }

    // Enhanced subscription statistics
    async getSubscriptionStats() {
        try {
            const response = await axios.get(`${this.serverUrl}/api/subscription-stats`, {
                timeout: 15000
            });
            return response.data;
        } catch (error) {
            console.error('Failed to get subscription stats:', error.message);
            return null;
        }
    }

    // New: Send automated expiration reminders using your API
    async sendAutomatedReminders(daysBeforeExpiration = 3) {
        try {
            console.log(`Sending automated reminders ${daysBeforeExpiration} days before expiration...`);
            
            const response = await axios.post(`${this.serverUrl}/api/send-expiration-reminders`, {
                days: daysBeforeExpiration
            }, { timeout: 30000 });

            console.log(`✅ Automated reminders sent to ${response.data.remindersSent} users`);
            
            return {
                success: true,
                remindersSent: response.data.remindersSent,
                users: response.data.users
            };
        } catch (error) {
            console.error('Failed to send automated reminders:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Utility methods
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    generateLogId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    // Enhanced manual check with options
    async manualCheck(options = {}) {
        console.log('🔧 Manual subscription check triggered');
        const checkType = options.checkType || 'manual';
        return await this.checkExpiredSubscriptions(checkType);
    }

    // New: Health check for the cron system
    async healthCheck() {
        const health = {
            status: 'healthy',
            cronJobs: this.cronJobs.length,
            serverReachable: false,
            lastCheck: null,
            errors: []
        };

        try {
            // Test server connectivity
            const response = await axios.get(`${this.serverUrl}/api/health`, {
                timeout: 10000
            });
            health.serverReachable = response.status === 200;
        } catch (error) {
            health.serverReachable = false;
            health.errors.push(`Server unreachable: ${error.message}`);
        }

        // Check if cron jobs are running
        const runningJobs = this.cronJobs.filter(job => job.running);
        if (runningJobs.length !== this.cronJobs.length) {
            health.status = 'warning';
            health.errors.push('Some cron jobs are not running');
        }

        return health;
    }

    // New: Stop all cron jobs
    stopCronJobs() {
        this.cronJobs.forEach(job => job.destroy());
        this.cronJobs = [];
        console.log('All subscription cron jobs stopped');
    }

    // New: Restart cron jobs
    restartCronJobs() {
        this.stopCronJobs();
        this.startCronJob();
        console.log('Subscription cron jobs restarted');
    }
}

// Enhanced usage example with configuration
const subscriptionManager = new SubscriptionManager('https://flixxit-h9fa.onrender.com', {
    logFile: 'flixxit-subscription-logs.json',
    retryAttempts: 3,
    retryDelay: 5000,
    timezone: 'America/New_York'
});

// Graceful shutdown handling
process.on('SIGINT', () => {
    console.log('Shutting down subscription manager...');
    subscriptionManager.stopCronJobs();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('Terminating subscription manager...');
    subscriptionManager.stopCronJobs();
    process.exit(0);
});

// Start the cron jobs
subscriptionManager.startCronJob();

// Export for use in other modules
module.exports = SubscriptionManager;

// If running this file directly
if (require.main === module) {
    console.log('🚀 Enhanced Subscription Manager started');
    
    // Health check on startup
    setTimeout(async () => {
        const health = await subscriptionManager.healthCheck();
        console.log('Health check:', health);
        
        // Optional: Run a manual check on startup
        if (health.serverReachable) {
            await subscriptionManager.manualCheck({ checkType: 'startup' });
        }
    }, 5000);
}