import fs from 'fs/promises';
import path from 'path';
import { emailService } from './email.service';

interface ConnectionLog {
  date: string; // Format: YYYY-MM-DD
  uniqueVisitors: Set<string>;
  totalConnections: number;
}

interface DailyStats {
  date: string;
  uniqueVisitors: number;
  totalConnections: number;
}

class AnalyticsService {
  private dataFilePath: string;
  private currentLog: Map<string, ConnectionLog>;
  private initialized: boolean = false;

  constructor() {
    // Store analytics data in a JSON file
    this.dataFilePath = path.join(__dirname, '../../data/analytics.json');
    this.currentLog = new Map();
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Ensure data directory exists
      const dataDir = path.dirname(this.dataFilePath);
      await fs.mkdir(dataDir, { recursive: true });

      // Load existing data if file exists
      try {
        const data = await fs.readFile(this.dataFilePath, 'utf-8');
        const parsed = JSON.parse(data);

        // Reconstruct Map with Sets
        for (const [date, stats] of Object.entries(parsed)) {
          const typedStats = stats as { uniqueVisitors: string[], totalConnections: number };
          this.currentLog.set(date, {
            date,
            uniqueVisitors: new Set(typedStats.uniqueVisitors || []),
            totalConnections: typedStats.totalConnections || 0,
          });
        }
      } catch (error) {
        // File doesn't exist yet, start fresh
        console.log('📊 Starting fresh analytics log');
      }

      this.initialized = true;
      console.log('📊 Analytics service initialized');
    } catch (error) {
      console.error('❌ Error initializing analytics service:', error);
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  /**
   * Record a new connection/visit
   * @param visitorId - Unique identifier for the visitor (IP address, session ID, etc.)
   */
  async recordConnection(visitorId: string): Promise<void> {
    await this.ensureInitialized();

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    if (!this.currentLog.has(today)) {
      this.currentLog.set(today, {
        date: today,
        uniqueVisitors: new Set(),
        totalConnections: 0,
      });
    }

    const dayLog = this.currentLog.get(today)!;
    dayLog.uniqueVisitors.add(visitorId);
    dayLog.totalConnections += 1;

    // Save to file
    await this.saveData();
  }

  /**
   * Get statistics for a specific date
   */
  async getStatsForDate(date: string): Promise<DailyStats | null> {
    await this.ensureInitialized();

    const log = this.currentLog.get(date);
    if (!log) return null;

    return {
      date: log.date,
      uniqueVisitors: log.uniqueVisitors.size,
      totalConnections: log.totalConnections,
    };
  }

  /**
   * Get statistics for today
   */
  async getTodayStats(): Promise<DailyStats> {
    await this.ensureInitialized();

    const today = new Date().toISOString().split('T')[0];
    const stats = await this.getStatsForDate(today);

    return stats || {
      date: today,
      uniqueVisitors: 0,
      totalConnections: 0,
    };
  }

  /**
   * Get statistics for yesterday
   */
  async getYesterdayStats(): Promise<DailyStats> {
    await this.ensureInitialized();

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];

    const stats = await this.getStatsForDate(dateStr);

    return stats || {
      date: dateStr,
      uniqueVisitors: 0,
      totalConnections: 0,
    };
  }

  /**
   * Get statistics for a date range
   */
  async getStatsForRange(startDate: string, endDate: string): Promise<DailyStats[]> {
    await this.ensureInitialized();

    const stats: DailyStats[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const dayStat = await this.getStatsForDate(dateStr);
      if (dayStat) {
        stats.push(dayStat);
      }
    }

    return stats;
  }

  /**
   * Save data to file
   */
  private async saveData(): Promise<void> {
    try {
      // Convert Map and Sets to plain objects for JSON serialization
      const dataToSave: Record<string, { uniqueVisitors: string[], totalConnections: number }> = {};

      for (const [date, log] of this.currentLog.entries()) {
        dataToSave[date] = {
          uniqueVisitors: Array.from(log.uniqueVisitors),
          totalConnections: log.totalConnections,
        };
      }

      await fs.writeFile(this.dataFilePath, JSON.stringify(dataToSave, null, 2), 'utf-8');
    } catch (error) {
      console.error('❌ Error saving analytics data:', error);
    }
  }

  /**
   * Send daily report email
   */
  async sendDailyReport(recipientEmail: string): Promise<boolean> {
    try {
      await this.ensureInitialized();

      const yesterday = await this.getYesterdayStats();
      const today = await this.getTodayStats();

      // Get last 7 days stats
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const lastWeekStats = await this.getStatsForRange(
        sevenDaysAgo.toISOString().split('T')[0],
        new Date().toISOString().split('T')[0]
      );

      const weeklyTotal = lastWeekStats.reduce((sum, day) => sum + day.uniqueVisitors, 0);
      const weeklyAverage = lastWeekStats.length > 0 ? Math.round(weeklyTotal / lastWeekStats.length) : 0;

      // Build email content
      const emailContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px; text-align: center; }
    .stats-card { background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .stat-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e0e0e0; }
    .stat-label { font-weight: bold; color: #666; }
    .stat-value { color: #667eea; font-size: 20px; font-weight: bold; }
    .footer { text-align: center; color: #999; margin-top: 30px; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Rapport Quotidien - Application Météo</h1>
      <p>${new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
    </div>

    <div class="stats-card">
      <h2>📅 Hier (${yesterday.date})</h2>
      <div class="stat-row">
        <span class="stat-label">Visiteurs uniques :</span>
        <span class="stat-value">${yesterday.uniqueVisitors}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Connexions totales :</span>
        <span class="stat-value">${yesterday.totalConnections}</span>
      </div>
    </div>

    <div class="stats-card">
      <h2>🔥 Aujourd'hui (${today.date})</h2>
      <div class="stat-row">
        <span class="stat-label">Visiteurs uniques :</span>
        <span class="stat-value">${today.uniqueVisitors}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Connexions totales :</span>
        <span class="stat-value">${today.totalConnections}</span>
      </div>
    </div>

    <div class="stats-card">
      <h2>📈 Derniers 7 jours</h2>
      <div class="stat-row">
        <span class="stat-label">Moyenne visiteurs/jour :</span>
        <span class="stat-value">${weeklyAverage}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Total visiteurs :</span>
        <span class="stat-value">${weeklyTotal}</span>
      </div>
    </div>

    <div class="footer">
      <p>Ce rapport est généré automatiquement chaque jour.</p>
      <p>Application Météo - ${new Date().getFullYear()}</p>
    </div>
  </div>
</body>
</html>
      `;

      const sent = await emailService.sendEmail({
        to: recipientEmail,
        subject: `📊 Rapport Quotidien - ${yesterday.uniqueVisitors} visiteurs hier`,
        html: emailContent,
      });

      if (sent) {
        console.log(`✅ Daily report sent to ${recipientEmail}`);
      } else {
        console.error(`❌ Failed to send daily report to ${recipientEmail}`);
      }

      return sent;
    } catch (error) {
      console.error('❌ Error sending daily report:', error);
      return false;
    }
  }

  /**
   * Clean old data (keep last 90 days)
   */
  async cleanOldData(): Promise<void> {
    await this.ensureInitialized();

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const cutoffDate = ninetyDaysAgo.toISOString().split('T')[0];

    for (const date of this.currentLog.keys()) {
      if (date < cutoffDate) {
        this.currentLog.delete(date);
      }
    }

    await this.saveData();
    console.log(`🧹 Cleaned analytics data older than ${cutoffDate}`);
  }
}

export const analyticsService = new AnalyticsService();
