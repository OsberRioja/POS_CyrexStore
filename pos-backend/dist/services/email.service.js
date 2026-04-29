"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailService = void 0;
// services/emailService.ts
const nodemailer_1 = __importDefault(require("nodemailer"));
const env_1 = require("../env");
const emailTemplates_1 = require("../templates/emailTemplates");
class EmailService {
    constructor() {
        this.transporter = nodemailer_1.default.createTransport({
            service: env_1.env.email.service,
            host: env_1.env.email.host,
            port: env_1.env.email.port,
            secure: false,
            auth: {
                user: env_1.env.email.user,
                pass: env_1.env.email.pass,
            },
        });
    }
    // Verificar la configuración del transporte
    async verifyConnection() {
        try {
            await this.transporter.verify();
            console.log('✅ Servicio de email configurado correctamente');
            return true;
        }
        catch (error) {
            console.error('❌ Error al configurar el servicio de email:', error);
            return false;
        }
    }
    // Método genérico para enviar emails
    async sendEmail(to, subject, html) {
        try {
            // Si estamos en modo testing, redirigir al email de prueba
            const recipient = env_1.env.email.testing ? env_1.env.email.testRecipient : to;
            const mailOptions = {
                from: `"${env_1.env.email.fromName}" <${env_1.env.email.from}>`,
                to: recipient,
                subject,
                html,
            };
            const result = await this.transporter.sendMail(mailOptions);
            console.log(`📧 Email enviado a: ${recipient}, MessageID: ${result.messageId}`);
            if (env_1.env.email.testing) {
                console.log(`⚠️  MODO TEST: Email redirigido a ${env_1.env.email.testRecipient} en lugar de ${to}`);
            }
            return true;
        }
        catch (error) {
            console.error('❌ Error al enviar email:', error);
            return false;
        }
    }
    // Método específico para enviar invitaciones
    async sendInvitationEmail(data) {
        const subject = `🎉 Invitación al Sistema POS - ${data.companyName}`;
        const html = emailTemplates_1.EmailTemplates.generateInvitationEmail(data);
        return this.sendEmail(data.userEmail, subject, html);
    }
}
exports.emailService = new EmailService();
