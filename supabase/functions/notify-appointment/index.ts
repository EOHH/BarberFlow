// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const resendApiKey = Deno.env.get('RESEND_API_KEY');
// Correo fijo para pruebas como fue solicitado
const ADMIN_TEST_EMAIL = "admin@gottidev.com";

serve(async (req: Request) => {
  try {
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const payload = await req.json();
    console.log("Webhook/Cron payload recibido:", payload);

    // Soportar tanto un registro individual (trigger antiguo) como un array (cron job actual)
    let recordsToProcess: any[] = [];
    
    if (payload.records && Array.isArray(payload.records)) {
      recordsToProcess = payload.records;
    } else if (payload.record) {
      recordsToProcess = [payload.record];
    }

    if (recordsToProcess.length === 0) {
      return new Response(JSON.stringify({ error: 'No se enviaron records válidos' }), { status: 400 });
    }

    if (!resendApiKey) {
      console.warn("No se encontró RESEND_API_KEY, simulando envío de correo en masa.");
      return new Response(
        JSON.stringify({ message: `Correos simulados (sin API key) para ${recordsToProcess.length} citas` }),
        { headers: { "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Procesar todos los envíos en paralelo usando Promise.all
    const emailPromises = recordsToProcess.map(async (record) => {
      const isCronReminder = payload.type === 'cron_reminder';
      const subject = isCronReminder 
        ? `¡Recordatorio! Tienes una cita pronto - Reserva #${record.id?.split('-')[0]}`
        : `¡Cita Confirmada! - Reserva #${record.id?.split('-')[0]}`;
        
      const title = isCronReminder ? 'Recordatorio de Cita ⏰' : 'Tu cita está confirmada 🎉';
      const message = isCronReminder 
        ? 'Hola, te recordamos que tienes una reserva programada con nosotros en las próximas horas.'
        : 'Hola, tu reserva ha sido procesada con éxito y está registrada en nuestro sistema.';

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: "Notificaciones Barbershop <onboarding@resend.dev>",
          to: [ADMIN_TEST_EMAIL], // Usamos el correo admin para pruebas como se solicitó
          subject: subject,
          html: `
            <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc; border-radius: 12px;">
              <h2 style="color: #0f172a;">${title}</h2>
              <p style="color: #475569; font-size: 16px;">${message}</p>
              
              <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin-top: 20px;">
                <p style="margin: 0; color: #64748b; font-size: 14px;"><strong>Referencia:</strong> ${record.id}</p>
                <p style="margin: 8px 0 0 0; color: #64748b; font-size: 14px;"><strong>Cliente:</strong> ${record.client_name || 'N/A'}</p>
                <p style="margin: 8px 0 0 0; color: #64748b; font-size: 14px;"><strong>Fecha:</strong> ${record.date || 'N/A'}</p>
                <p style="margin: 8px 0 0 0; color: #64748b; font-size: 14px;"><strong>Hora:</strong> ${record.time || 'N/A'}</p>
                <p style="margin: 8px 0 0 0; color: #64748b; font-size: 14px;"><strong>Estado:</strong> ${record.status}</p>
              </div>
              
              <p style="margin-top: 30px; font-size: 14px; color: #94a3b8; text-align: center;">
                Gracias por preferir nuestro SaaS Enterprise.
              </p>
            </div>
          `,
        }),
      });

      const resData = await res.json();
      return { recordId: record.id, success: res.ok, data: resData };
    });

    const results = await Promise.all(emailPromises);
    const failed = results.filter(r => !r.success);

    if (failed.length > 0) {
      console.error("Algunos correos fallaron:", failed);
      return new Response(
        JSON.stringify({ error: "Errores parciales en el envío masivo", details: failed }),
        { headers: { "Content-Type": "application/json" }, status: 400 }
      );
    }

    return new Response(
      JSON.stringify({ message: "Envío masivo completado con éxito", processed: results.length }),
      { headers: { "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error: any) {
    console.error("Error inesperado en edge function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { "Content-Type": "application/json" }, status: 500 }
    );
  }
})
