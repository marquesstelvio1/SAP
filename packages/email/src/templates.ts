const baseStyle = `
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5; }
  .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
  .header { background: #18181b; padding: 24px 32px; }
  .header h1 { margin: 0; color: #ffffff; font-size: 20px; font-weight: 600; }
  .body { padding: 32px; color: #18181b; }
  .body p { line-height: 1.6; margin: 0 0 16px; color: #52525b; }
  .button { display: inline-block; padding: 12px 24px; background: #18181b; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px; }
  .footer { padding: 24px 32px; border-top: 1px solid #e4e4e7; font-size: 12px; color: #a1a1aa; text-align: center; }
  .footer p { margin: 4px 0; }
`;

type TemplateInput = {
  url: string;
  userName: string;
};

export function invitationEmailHtml(
  input: TemplateInput & { organizationName: string | undefined },
): string {
  const orgLine =
    input.organizationName !== undefined
      ? `Foi convidado para a organização <strong>${escapeHtml(input.organizationName)}</strong> na plataforma SAPTM.`
      : "Foi convidado para a plataforma SAPTM.";

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>${baseStyle}</style></head>
<body>
<div class="container">
<div class="header"><h1>SAPTM</h1></div>
<div class="body">
<p>Olá <strong>${escapeHtml(input.userName)}</strong>,</p>
<p>${orgLine}</p>
<p>Clique no botão abaixo para aceitar o convite e começar a utilizar a plataforma:</p>
<p style="text-align:center;margin:32px 0">
<a href="${escapeHtml(input.url)}" class="button">Aceitar Convite</a>
</p>
<p>Se não reconhece este convite, ignore este email.</p>
</div>
<div class="footer">
<p>SAPTM — Supply Chain Asset &amp; Planning Transport Management</p>
<p>Este é um email automático, por favor não responda.</p>
</div>
</div>
</body></html>`;
}

export function verificationEmailHtml({ url, userName }: TemplateInput): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>${baseStyle}</style></head>
<body>
<div class="container">
<div class="header"><h1>SAPTM</h1></div>
<div class="body">
<p>Olá <strong>${escapeHtml(userName)}</strong>,</p>
<p>Obrigado por criar a sua conta na SAPTM. Para continuar, precisa de verificar o seu endereço de email.</p>
<p style="text-align:center;margin:32px 0">
<a href="${escapeHtml(url)}" class="button">Verificar Email</a>
</p>
<p>Se não criou esta conta, ignore este email.</p>
</div>
<div class="footer">
<p>SAPTM — Supply Chain Asset &amp; Planning Transport Management</p>
<p>Este é um email automático, por favor não responda.</p>
</div>
</div>
</body></html>`;
}

export function passwordResetEmailHtml({ url, userName }: TemplateInput): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>${baseStyle}</style></head>
<body>
<div class="container">
<div class="header"><h1>SAPTM</h1></div>
<div class="body">
<p>Olá <strong>${escapeHtml(userName)}</strong>,</p>
<p>Recebemos um pedido para redefinir a sua password na SAPTM.</p>
<p style="text-align:center;margin:32px 0">
<a href="${escapeHtml(url)}" class="button">Redefinir Password</a>
</p>
<p>Se não solicitou esta alteração, ignore este email. A sua password permanece segura.</p>
<p>Este link expira dentro de 1 hora.</p>
</div>
<div class="footer">
<p>SAPTM — Supply Chain Asset &amp; Planning Transport Management</p>
<p>Este é um email automático, por favor não responda.</p>
</div>
</div>
</body></html>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
