import { Request, Response } from 'express';
import { emailService } from '../services/email.service';

export class EmailController {
  /**
   * Test SMTP configuration
   */
  async testEmail(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({
          success: false,
          message: 'Email address is required',
        });
        return;
      }

      // Verify connection first
      const isConnected = await emailService.verifyConnection();
      if (!isConnected) {
        res.status(500).json({
          success: false,
          message: 'SMTP connection failed. Please check your configuration.',
        });
        return;
      }

      // Send test email
      const sent = await emailService.sendTestEmail(email);

      if (sent) {
        res.status(200).json({
          success: true,
          message: 'Test email sent successfully',
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to send test email',
        });
      }
    } catch (error) {
      console.error('Error in testEmail:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Send weather alert email
   */
  async sendAlert(req: Request, res: Response): Promise<void> {
    try {
      const { to, alertData } = req.body;

      if (!to || !alertData) {
        res.status(400).json({
          success: false,
          message: 'To and alertData are required',
        });
        return;
      }

      const { location, alertType, message } = alertData;

      if (!location || !alertType || !message) {
        res.status(400).json({
          success: false,
          message: 'alertData must contain location, alertType, and message',
        });
        return;
      }

      if (!emailService.isReady()) {
        res.status(500).json({
          success: false,
          message: 'Email service is not configured',
        });
        return;
      }

      const sent = await emailService.sendWeatherAlert(to, alertData);

      if (sent) {
        res.status(200).json({
          success: true,
          message: 'Weather alert sent successfully',
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to send weather alert',
        });
      }
    } catch (error) {
      console.error('Error in sendAlert:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Check email service status
   */
  async getStatus(req: Request, res: Response): Promise<void> {
    try {
      const isReady = emailService.isReady();
      const isConnected = isReady ? await emailService.verifyConnection() : false;

      res.status(200).json({
        success: true,
        configured: isReady,
        connected: isConnected,
      });
    } catch (error) {
      console.error('Error in getStatus:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Send generic email
   */
  async sendEmail(req: Request, res: Response): Promise<void> {
    try {
      const { to, subject, text, html } = req.body;

      if (!to || !subject || (!text && !html)) {
        res.status(400).json({
          success: false,
          message: 'To, subject, and text or html are required',
        });
        return;
      }

      if (!emailService.isReady()) {
        res.status(500).json({
          success: false,
          message: 'Email service is not configured',
        });
        return;
      }

      const sent = await emailService.sendEmail({
        to,
        subject,
        text,
        html,
      });

      if (sent) {
        res.status(200).json({
          success: true,
          message: 'Email sent successfully',
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to send email',
        });
      }
    } catch (error) {
      console.error('Error in sendEmail:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
