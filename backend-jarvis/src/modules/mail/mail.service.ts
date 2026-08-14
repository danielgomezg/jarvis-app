import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import sgMail from '@sendgrid/mail';

@Injectable()
export class MailService {
  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('SENDGRID_API_KEY');
    if (!apiKey) {
      throw new Error('SENDGRID_API_KEY is required');
    }
    sgMail.setApiKey(apiKey);
  }

  async sendVerificationEmail(
    to: string,
    token: string,
    userName?: string,
  ): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const fromEmail = this.configService.get<string>('SENDGRID_FROM_EMAIL');
    const fromName =
      this.configService.get<string>('SENDGRID_FROM_NAME') || 'Jarvis';

    if (!frontendUrl || !fromEmail) {
      throw new InternalServerErrorException('Mail configuration is missing');
    }

    const verifyUrl = `${frontendUrl.replace(/\/$/, '')}/verificated?token=${encodeURIComponent(
      token,
    )}`;

    const message = {
      to,
      from: {
        email: fromEmail,
        name: fromName,
      },
      subject: 'Verifica tu cuenta en Jarvis',
      html: `
        <!DOCTYPE html>
    <html lang="es">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="margin:0;padding:0;background:#f8f8f8;font-family:Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f8f8;padding:40px 16px;">
        <tr><td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid rgba(0,0,0,0.07);">

            <!-- Header naranja -->
            <tr>
              <td style="background:#f97316;padding:32px 40px;text-align:center;">
                <p style="margin:0 0 8px;font-size:28px;">🍳</p>
                <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.3px;">Jarvis</h1>
                <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:12px;">Asistente culinario con IA</p>
              </td>
            </tr>

            <!-- Contenido -->
            <tr>
              <td style="padding:36px 40px 28px;">
                <h2 style="margin:0 0 8px;color:#111827;font-size:20px;font-weight:700;">
                  Hola, ${userName ?? 'usuario'} 👋
                </h2>
                <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6;">
                  Gracias por unirte a Jarvis. Solo falta un paso: verifica tu correo electrónico para activar tu cuenta.
                </p>

                <!-- Botón -->
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr><td align="center" style="padding:4px 0 28px;">
                    <a href="${verifyUrl}"
                      style="display:inline-block;padding:14px 36px;background:#f97316;color:#ffffff;font-size:15px;font-weight:700;border-radius:8px;text-decoration:none;">
                      Verificar mi cuenta
                    </a>
                  </td></tr>
                </table>

                <!-- Separador -->
                <hr style="border:none;border-top:1px solid #f3f4f6;margin:0 0 24px;" />

                <!-- URL fallback -->
                <p style="margin:0 0 8px;color:#9ca3af;font-size:12px;">
                  Si el botón no funciona, copia y pega este enlace en tu navegador:
                </p>
                <p style="margin:0;background:#f9fafb;border-radius:6px;padding:10px 12px;word-break:break-all;">
                  <a href="${verifyUrl}" style="color:#f97316;font-size:12px;text-decoration:none;">${verifyUrl}</a>
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background:#f9fafb;padding:20px 40px;border-top:1px solid #f3f4f6;">
                <p style="margin:0 0 4px;color:#9ca3af;font-size:12px;text-align:center;">
                  ⏱ Este enlace expira en <strong>24 horas</strong>
                </p>
                <p style="margin:0;color:#d1d5db;font-size:11px;text-align:center;">
                  Si no creaste esta cuenta, puedes ignorar este mensaje.
                </p>
              </td>
            </tr>

          </table>
        </td></tr>
      </table>
    </body>
    </html>
      `,
    };

    try {
      await sgMail.send(message);
    } catch (error) {
      console.error('SendGrid error:', error);
      throw new InternalServerErrorException(
        'No se pudo enviar el correo de verificación.',
      );
    }
  }
}

/*
    const message = {
      to,
      from: {
        email: fromEmail,
        name: fromName,
      },
      subject: 'Verifica tu cuenta en Jarvis',
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h1>Hola ${userName ?? 'usuario'}</h1>
          <p>Gracias por registrarte. Haz clic en el botón para verificar tu correo electrónico:</p>
          <p><a href="${verifyUrl}" style="display:inline-block;padding:12px 20px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none;">Verificar cuenta</a></p>
          <p>Si el botón no funciona, copia y pega esta URL en tu navegador:</p>
          <p><a href="${verifyUrl}">${verifyUrl}</a></p>
          <p>Este enlace expira en 24 horas.</p>
          <p>Si ya verificaste tu correo, puedes ignorar este mensaje.</p>
        </div>
      `,
    };
*/
