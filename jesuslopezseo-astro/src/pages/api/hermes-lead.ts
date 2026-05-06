import type { APIRoute } from 'astro';

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? import.meta.env.RESEND_API_KEY;
const TO_EMAIL = 'jesus@jesuslopezseo.com';
const FROM_EMAIL = 'formulario@jesuslopezseo.com';

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.formData();

    const nombre     = (data.get('nombre')     as string || '').trim();
    const email      = (data.get('email')      as string || '').trim();
    const empresa    = (data.get('empresa')    as string || '').trim();
    const plataforma = (data.get('plataforma') as string || '').trim();
    const mcps       = data.getAll('mcps').map(v => String(v));
    const mcps_otros = (data.get('mcps_otros') as string || '').trim();
    const caso_uso   = (data.get('caso_uso')   as string || '').trim();
    const fuente     = (data.get('fuente')     as string || '').trim();

    if (!nombre || !email || !caso_uso) {
      return new Response(JSON.stringify({ ok: false, error: 'Faltan campos obligatorios' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ ok: false, error: 'Configuración de email no disponible' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const mcpsList = [...mcps, ...(mcps_otros ? [`Otros: ${mcps_otros}`] : [])].join(', ') || '—';

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;">
        <div style="background:#0f0e0c;padding:24px 32px;border-radius:8px 8px 0 0;">
          <h1 style="color:#fff;margin:0;font-size:22px;">🤖 Nueva solicitud Hermes Pro Setup</h1>
          <p style="color:rgba(255,255,255,0.6);margin:6px 0 0;font-size:14px;">JesusLopezSEO.com · Hermes landing</p>
        </div>
        <div style="padding:32px;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 8px 8px;">
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:14px;width:150px;">Nombre</td>
              <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-weight:600;">${nombre}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:14px;">Email</td>
              <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;">
                <a href="mailto:${email}" style="color:#f59e0b;">${email}</a>
              </td>
            </tr>
            ${empresa ? `
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:14px;">Empresa</td>
              <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;">${empresa}</td>
            </tr>` : ''}
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:14px;">Plataforma</td>
              <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-weight:600;">
                ${plataforma || '—'}
              </td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:14px;">MCPs interés</td>
              <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;">${mcpsList}</td>
            </tr>
            ${fuente ? `
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:14px;">Fuente</td>
              <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;">${fuente}</td>
            </tr>` : ''}
          </table>
          <div style="margin-top:24px;">
            <p style="color:#6b7280;font-size:13px;margin:0 0 8px;text-transform:uppercase;letter-spacing:.05em;font-weight:600;">Caso de uso</p>
            <div style="background:#f9fafb;border-left:3px solid #f59e0b;padding:16px;border-radius:0 4px 4px 0;white-space:pre-wrap;font-size:15px;line-height:1.6;">${caso_uso}</div>
          </div>
          <div style="margin-top:28px;text-align:center;">
            <a href="mailto:${email}?subject=Re: Tu solicitud Hermes Pro Setup"
               style="background:#f59e0b;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block;">
              Responder a ${nombre} →
            </a>
          </div>
        </div>
        <p style="text-align:center;color:#9ca3af;font-size:12px;margin:16px 0;">
          Formulario Hermes Pro Setup · jesuslopezseo.com/hermes
        </p>
      </div>
    `;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `JesusLopezSEO <${FROM_EMAIL}>`,
        to: [TO_EMAIL],
        reply_to: email,
        subject: `🤖 Hermes Pro Setup — ${nombre}`,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Resend error:', err);
      return new Response(JSON.stringify({ ok: false, error: 'Error al enviar el email' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Hermes lead API error:', err);
    return new Response(JSON.stringify({ ok: false, error: 'Error interno del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
