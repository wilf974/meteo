import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

interface WeatherAlertData {
  location: string;
  alertType: string;
  message: string;
  temperature?: number;
  precipitation?: number;
  windSpeed?: number;
}

class EmailService {
  private transporter: Transporter | null = null;
  private isConfigured: boolean = false;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPassword = process.env.SMTP_PASSWORD;

    if (!smtpHost || !smtpPort || !smtpUser || !smtpPassword) {
      console.warn('SMTP configuration incomplete. Email service disabled.');
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort),
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: smtpUser,
          pass: smtpPassword,
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      this.isConfigured = true;
      console.log('✅ Email service configured successfully');
    } catch (error) {
      console.error('❌ Failed to configure email service:', error);
      this.isConfigured = false;
    }
  }

  /**
   * Send a generic email
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.isConfigured || !this.transporter) {
      console.error('Email service not configured');
      return false;
    }

    try {
      const mailOptions = {
        from: `${process.env.SMTP_FROM_NAME || 'Météo Pro'} <${process.env.SMTP_FROM_EMAIL}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully:', info.messageId);
      return true;
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      return false;
    }
  }

  /**
   * Send a weather alert email
   */
  async sendWeatherAlert(to: string, alertData: WeatherAlertData): Promise<boolean> {
    const subject = `⚠️ Alerte météo - ${alertData.alertType} à ${alertData.location}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
          .alert-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .weather-data { background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; }
          .weather-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
          .weather-item:last-child { border-bottom: none; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; padding: 20px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">🌤️ Météo Pro</h1>
            <p style="margin: 10px 0 0 0;">Alerte météo</p>
          </div>
          <div class="content">
            <h2 style="color: #1e293b; margin-top: 0;">Alerte pour ${alertData.location}</h2>

            <div class="alert-box">
              <strong style="color: #92400e;">⚠️ ${alertData.alertType}</strong>
              <p style="margin: 10px 0 0 0; color: #78350f;">${alertData.message}</p>
            </div>

            ${alertData.temperature !== undefined || alertData.precipitation !== undefined || alertData.windSpeed !== undefined ? `
              <div class="weather-data">
                <h3 style="margin-top: 0; color: #374151;">Conditions actuelles</h3>
                ${alertData.temperature !== undefined ? `
                  <div class="weather-item">
                    <span>🌡️ Température</span>
                    <strong>${alertData.temperature}°C</strong>
                  </div>
                ` : ''}
                ${alertData.precipitation !== undefined ? `
                  <div class="weather-item">
                    <span>🌧️ Précipitations</span>
                    <strong>${alertData.precipitation} mm</strong>
                  </div>
                ` : ''}
                ${alertData.windSpeed !== undefined ? `
                  <div class="weather-item">
                    <span>💨 Vent</span>
                    <strong>${alertData.windSpeed} km/h</strong>
                  </div>
                ` : ''}
              </div>
            ` : ''}

            <p style="color: #475569;">
              Cette alerte a été générée automatiquement par le système de surveillance météorologique de Météo Pro.
            </p>

            <div style="text-align: center;">
              <a href="http://localhost:5173/map" class="button">Voir sur la carte</a>
            </div>
          </div>
          <div class="footer">
            <p>Vous recevez cet email car vous avez activé les alertes météo pour ${alertData.location}.</p>
            <p>Météo Pro - Votre assistant météo personnel</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Alerte météo pour ${alertData.location}

Type d'alerte: ${alertData.alertType}
${alertData.message}

${alertData.temperature !== undefined ? `Température: ${alertData.temperature}°C\n` : ''}${alertData.precipitation !== undefined ? `Précipitations: ${alertData.precipitation} mm\n` : ''}${alertData.windSpeed !== undefined ? `Vent: ${alertData.windSpeed} km/h\n` : ''}
Consultez l'application pour plus de détails.

Météo Pro
    `;

    return this.sendEmail({
      to,
      subject,
      text: text.trim(),
      html,
    });
  }

  /**
   * Send a test email
   */
  async sendTestEmail(to: string): Promise<boolean> {
    const subject = '✅ Test de configuration SMTP - Météo Pro';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
          .success-box { background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">🌤️ Météo Pro</h1>
            <p style="margin: 10px 0 0 0;">Configuration SMTP</p>
          </div>
          <div class="content">
            <h2 style="color: #1e293b; margin-top: 0;">Configuration réussie !</h2>

            <div class="success-box">
              <strong style="color: #065f46;">✅ Votre service d'email est opérationnel</strong>
              <p style="margin: 10px 0 0 0; color: #047857;">
                Ce message confirme que la configuration SMTP de Météo Pro fonctionne correctement.
              </p>
            </div>

            <p style="color: #475569;">
              Vous pouvez maintenant recevoir des alertes météo par email pour vos lieux favoris.
            </p>

            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              Date du test: ${new Date().toLocaleString('fr-FR')}
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Configuration SMTP - Météo Pro

✅ Votre service d'email est opérationnel !

Ce message confirme que la configuration SMTP de Météo Pro fonctionne correctement.
Vous pouvez maintenant recevoir des alertes météo par email pour vos lieux favoris.

Date du test: ${new Date().toLocaleString('fr-FR')}

Météo Pro
    `;

    return this.sendEmail({
      to,
      subject,
      text: text.trim(),
      html,
    });
  }

  /**
   * Verify SMTP connection
   */
  async verifyConnection(): Promise<boolean> {
    if (!this.isConfigured || !this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      console.log('✅ SMTP connection verified');
      return true;
    } catch (error) {
      console.error('❌ SMTP connection verification failed:', error);
      return false;
    }
  }

  /**
   * Check if email service is configured
   */
  isReady(): boolean {
    return this.isConfigured;
  }
}

// Export singleton instance
export const emailService = new EmailService();
