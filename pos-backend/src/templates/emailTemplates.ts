export interface InvitationEmailData {
  userName: string;
  userEmail: string;
  temporaryPassword: string;
  loginUrl: string;
  companyName: string;
  adminName?: string;
}

export class EmailTemplates {
  static generateInvitationEmail(data: InvitationEmailData): string {
    const { userName, userEmail, temporaryPassword, loginUrl, companyName, adminName } = data;

    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invitación al Sistema POS</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }
        .content {
            padding: 30px;
        }
        .welcome-text {
            font-size: 16px;
            margin-bottom: 20px;
            color: #555;
        }
        .credentials-box {
            background-color: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .credential-item {
            margin-bottom: 10px;
        }
        .credential-label {
            font-weight: 600;
            color: #495057;
        }
        .credential-value {
            background-color: white;
            padding: 8px 12px;
            border-radius: 4px;
            border: 1px solid #dee2e6;
            font-family: monospace;
            margin-top: 5px;
        }
        .login-button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            padding: 12px 30px;
            border-radius: 5px;
            font-weight: 600;
            margin: 20px 0;
            text-align: center;
        }
        .security-notice {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 5px;
            padding: 15px;
            margin: 20px 0;
            font-size: 14px;
        }
        .footer {
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #6c757d;
            font-size: 14px;
            border-top: 1px solid #e9ecef;
        }
        .steps {
            margin: 25px 0;
        }
        .step {
            display: flex;
            align-items: flex-start;
            margin-bottom: 15px;
        }
        .step-number {
            background-color: #667eea;
            color: white;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            font-weight: 600;
            margin-right: 15px;
            flex-shrink: 0;
        }
        .step-content {
            flex: 1;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 ¡Bienvenido a ${companyName}!</h1>
        </div>
        
        <div class="content">
            <p class="welcome-text">
                Hola <strong>${userName}</strong>,
            </p>
            
            <p class="welcome-text">
                Has sido invitado a unirte al sistema de punto de venta de ${companyName}. 
                ${adminName ? `La invitación fue enviada por ${adminName}.` : ''}
            </p>

            <div class="credentials-box">
                <div class="credential-item">
                    <div class="credential-label">Tu correo electrónico:</div>
                    <div class="credential-value">${userEmail}</div>
                </div>
                <div class="credential-item">
                    <div class="credential-label">Contraseña temporal:</div>
                    <div class="credential-value">${temporaryPassword}</div>
                </div>
            </div>

            <div class="steps">
                <div class="step">
                    <div class="step-number">1</div>
                    <div class="step-content">
                        <strong>Accede al sistema</strong> usando el botón de abajo o visitando:<br>
                        <small>${loginUrl}</small>
                    </div>
                </div>
                
                <div class="step">
                    <div class="step-number">2</div>
                    <div class="step-content">
                        <strong>Inicia sesión</strong> con tu correo electrónico y la contraseña temporal proporcionada.
                    </div>
                </div>
                
                <div class="step">
                    <div class="step-number">3</div>
                    <div class="step-content">
                        <strong>Cambia tu contraseña</strong> después del primer inicio de sesión por motivos de seguridad.
                    </div>
                </div>
            </div>

            <div style="text-align: center;">
                <a href="${loginUrl}" class="login-button">Acceder al Sistema</a>
            </div>

            <div class="security-notice">
                ⚠️ <strong>Importante:</strong> Por seguridad, cambia tu contraseña después del primer acceso. 
                Esta contraseña temporal es de un solo uso.
            </div>

            <p style="color: #6c757d; font-size: 14px; text-align: center;">
                Si tienes problemas para acceder, contacta con el administrador del sistema.
            </p>
        </div>
        
        <div class="footer">
            <p>Este es un mensaje automático. Por favor, no respondas a este correo.</p>
            <p>&copy; ${new Date().getFullYear()} ${companyName}. Todos los derechos reservados.</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  // También podemos agregar otras plantillas aquí en el futuro
  // static generatePasswordResetEmail(...) { ... }
  // static generateNotificationEmail(...) { ... }
}