import cron from 'node-cron';
import { analyticsService } from '../services/analytics.service';

const REPORT_EMAIL = 'jean.maillot14@gmail.com';

/**
 * Schedule daily report to be sent every evening at 20:00 (8 PM)
 */
export function scheduleDailyReport(): void {
  // Cron format: '0 20 * * *' = Every day at 20:00 (8 PM)
  // For testing: '* * * * *' = Every minute
  const cronSchedule = '0 20 * * *'; // 8 PM every day

  cron.schedule(cronSchedule, async () => {
    console.log('⏰ Running scheduled daily report...');
    try {
      const sent = await analyticsService.sendDailyReport(REPORT_EMAIL);
      if (sent) {
        console.log(`✅ Daily report sent successfully to ${REPORT_EMAIL}`);
      } else {
        console.error(`❌ Failed to send daily report to ${REPORT_EMAIL}`);
      }
    } catch (error) {
      console.error('❌ Error in daily report scheduler:', error);
    }
  }, {
    timezone: 'Europe/Paris' // Adjust timezone as needed
  });

  console.log(`📅 Daily report scheduler initialized - Will send at 20:00 every day to ${REPORT_EMAIL}`);
}

/**
 * Schedule data cleanup - runs once a week on Sunday at 2 AM
 */
export function scheduleDataCleanup(): void {
  // Cron format: '0 2 * * 0' = Every Sunday at 2 AM
  const cronSchedule = '0 2 * * 0';

  cron.schedule(cronSchedule, async () => {
    console.log('🧹 Running scheduled data cleanup...');
    try {
      await analyticsService.cleanOldData();
      console.log('✅ Data cleanup completed');
    } catch (error) {
      console.error('❌ Error in data cleanup scheduler:', error);
    }
  }, {
    timezone: 'Europe/Paris'
  });

  console.log('🧹 Data cleanup scheduler initialized - Will run every Sunday at 2 AM');
}

/**
 * Initialize all schedulers
 */
export function initializeSchedulers(): void {
  scheduleDailyReport();
  scheduleDataCleanup();
}
