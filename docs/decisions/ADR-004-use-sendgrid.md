# ADR-004: Uso de SendGrid

## Estado

Aceptado

---

## Fecha

2026-05-28

---

## Contexto

Se necesita un servicio de envío de emails para Jarvis que:
- Permita verificar emails de usuarios
- Sea confiable y con buena reputación de delivery
- Tenga plan gratuito para desarrollo
- Sea fácil de integrar con NestJS
- Soporte HTML templates

---

## Decisión

Se decidió usar **SendGrid** como servicio de envío de emails.

---

## Consecuencias

### Ventajas

- **Free tier**: 100 emails/día, suficiente para desarrollo y testing
- **API simple**: SDK oficial para Node.js con buena documentación
- **Templates**: Soporte para HTML templates y variables dinámicas
- **Reputación**: Alta deliverability rate
- **Integración**: Fácil de integrar con NestJS mediante servicio personalizado

### Desventajas

- **Límite gratuito**: 100 emails/día puede ser insuficiente en producción
- **Dependencia**: Vendor lock-in con SendGrid
- **Costo**: A medida que crece el usuario, aumenta el costo
- **Complejidad**: Configuración de DNS (SPF, DKIM) para producción

---

## Alternativas consideradas

- **Mailgun**: Similar a SendGrid, free tier de 5,000 emails/mes. Buena opción alternativa.
- **Amazon SES**: Más barato en producción ($0.10/1000 emails), pero más complejo de configurar.
- **Resend**: Más moderno y developer-friendly, pero free tier limitado (3,000 emails/mes).
- **Nodemailer + SMTP**: Sin dependencia de terceros, pero menos confiable y sin analytics.
- **Postmark**: Excelente deliverability, pero sin free tier.

---

## Referencias

- [SendGrid Documentation](https://docs.sendgrid.com/)
- [SendGrid Node.js SDK](https://github.com/sendgrid/sendgrid-nodejs)
