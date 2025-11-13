import { Request, Response } from 'express';
import { analyticsService } from '../services/analytics.service';

class AnalyticsController {
  /**
   * Record a connection
   */
  async recordConnection(req: Request, res: Response): Promise<void> {
    try {
      // Use IP address as visitor ID (or session ID if available)
      const visitorId = req.ip || req.connection.remoteAddress || 'unknown';

      await analyticsService.recordConnection(visitorId);

      res.status(200).json({
        success: true,
        message: 'Connection recorded',
      });
    } catch (error) {
      console.error('Error recording connection:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get today's statistics
   */
  async getTodayStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await analyticsService.getTodayStats();

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('Error getting today stats:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get yesterday's statistics
   */
  async getYesterdayStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await analyticsService.getYesterdayStats();

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('Error getting yesterday stats:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get statistics for a date range
   */
  async getRangeStats(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        res.status(400).json({
          success: false,
          message: 'startDate and endDate are required',
        });
        return;
      }

      const stats = await analyticsService.getStatsForRange(
        startDate as string,
        endDate as string
      );

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('Error getting range stats:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Send daily report manually
   */
  async sendDailyReport(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({
          success: false,
          message: 'Email is required',
        });
        return;
      }

      const sent = await analyticsService.sendDailyReport(email);

      if (sent) {
        res.status(200).json({
          success: true,
          message: 'Daily report sent successfully',
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to send daily report',
        });
      }
    } catch (error) {
      console.error('Error sending daily report:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export const analyticsController = new AnalyticsController();
