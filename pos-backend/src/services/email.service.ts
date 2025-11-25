// services/emailService.ts
import nodemailer from 'nodemailer';
import { env } from '../env';
import { EmailTemplates, InvitationEmailData } from '../templates/emailTemplates';

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: env.email.service,
      host: env.email.host,
      port: env.email.port,
      secure: false,
      auth: {
        user: env.email.user,
        pass: env.email.pass,
      },
    });
  }

  // Verificar la configuración del transporte
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('✅ Servicio de email configurado correctamente');
      return true;
    } catch (error) {
      console.error('❌ Error al configurar el servicio de email:', error);
      return false;
    }
  }

  // Método genérico para enviar emails
  async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    try {
      // Si estamos en modo testing, redirigir al email de prueba
      const recipient = env.email.testing ? env.email.testRecipient : to;

      const mailOptions = {
        from: `"${env.email.fromName}" <${env.email.from}>`,
        to: recipient,
        subject,
        html,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`📧 Email enviado a: ${recipient}, MessageID: ${result.messageId}`);
      
      if (env.email.testing) {
        console.log(`⚠️  MODO TEST: Email redirigido a ${env.email.testRecipient} en lugar de ${to}`);
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error al enviar email:', error);
      return false;
    }
  }

  // Método específico para enviar invitaciones
  async sendInvitationEmail(data: InvitationEmailData): Promise<boolean> {
    const subject = `🎉 Invitación al Sistema POS - ${data.companyName}`;
    const html = EmailTemplates.generateInvitationEmail(data);
    
    return this.sendEmail(data.userEmail, subject, html);
  }
}

export const emailService = new EmailService();