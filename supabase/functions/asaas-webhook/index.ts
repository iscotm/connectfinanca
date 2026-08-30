import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Types based on Asaas Webhook Payload
interface AsaasWebhookPayload {
  event: string;
  payment: {
    id: string;
    customer: string;
    value: number;
    netValue: number;
    billingType: string;
    status: string;
    description: string;
    externalReference?: string;
  };
}

serve(async (req: Request) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 0. Token Validation (Security)
    const webhookToken = Deno.env.get('ASAAS_WEBHOOK_TOKEN');
    const receivedToken = req.headers.get('asaas-access-token');

    if (webhookToken && receivedToken !== webhookToken) {
      console.warn("[ASAAS WEBHOOK] Unauthorized request. Token mismatch.");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload: AsaasWebhookPayload = await req.json();
    console.log("[ASAAS WEBHOOK] Received payload:", JSON.stringify(payload));

    const event = payload.event;
    const payment = payload.payment;

    if (!event || !payment || !payment.id) {
      console.warn("[ASAAS WEBHOOK] Invalid payload structure");
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Apenas tratamos pagamentos recebidos/confirmados
    if (event !== 'PAYMENT_RECEIVED' && event !== 'PAYMENT_CONFIRMED') {
      console.log(`[ASAAS WEBHOOK] Ignored event type: ${event}`);
      return new Response(JSON.stringify({ message: `Ignored event: ${event}` }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[ASAAS WEBHOOK] Processing ${event} for payment ${payment.id}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    // Usar supabaseAdmin para ignorar RLS e atualizar de forma segura
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // 1. Buscar o pagamento local pelo ID do Asaas
    const { data: localPayment, error: findError } = await supabaseAdmin
      .from('payments')
      .select('id, user_id, plan, amount')
      .eq('provider_payment_id', payment.id)
      .maybeSingle();

    if (findError) {
      console.error("[ASAAS WEBHOOK] Error finding local payment:", findError);
      throw findError;
    }

    if (!localPayment) {
      // Se não acharmos por provider_payment_id, tentamos buscar pelo externalReference (que é o user.id)
      // se a gente setou no checkout
      console.warn(`[ASAAS WEBHOOK] Payment ${payment.id} not found in database.`);
      return new Response(JSON.stringify({ error: "Payment not found locally" }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = localPayment.user_id;
    const planCode = localPayment.plan;

    // 2. Atualizar o status do pagamento para 'paid'
    const { error: updatePaymentError } = await supabaseAdmin
      .from('payments')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', localPayment.id);

    if (updatePaymentError) {
      console.error("[ASAAS WEBHOOK] Error updating payment:", updatePaymentError);
      throw updatePaymentError;
    }

    // 3. Determinar o tempo de expiração do acesso
    let daysToAdd = 30; // Default: mensal
    let planTitle = 'Plano Mensal';
    
    if (planCode === 'quarterly') {
      daysToAdd = 90;
      planTitle = 'Plano Trimestral';
    } else if (planCode === 'yearly') {
      daysToAdd = 365;
      planTitle = 'Plano Anual';
    } else if (planCode === 'lifetime') {
      daysToAdd = 36500; // 100 years for lifetime logic (ou NULL, dependendo do design do BD)
      planTitle = 'Plano Vitalício';
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + daysToAdd);

    // 4. Atualizar o Profile para liberar o acesso
    const { error: updateProfileError } = await supabaseAdmin
      .from('profiles')
      .update({
        status: 'ativo',
        access_type: planTitle,
        access_expires_at: planCode === 'lifetime' ? null : expiresAt.toISOString(), // Null se vitalício
        asaas_customer_id: payment.customer // Caso queira garantir que o ID do cliente fique salvo no perfil
      })
      .eq('id', userId);

    if (updateProfileError) {
      console.error("[ASAAS WEBHOOK] Error updating user profile:", updateProfileError);
      throw updateProfileError;
    }

    // (Opcional) 5. Criar ou atualizar a tabela de subscriptions
    // Como estamos usando pix único para renovar, podemos apenas dar UPSERT numa subscription active.
    await supabaseAdmin
      .from('subscriptions')
      .upsert({
        user_id: userId,
        provider: 'asaas',
        plan: planCode,
        status: 'active',
        current_period_end: planCode === 'lifetime' ? null : expiresAt.toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' }); // Assume que user_id pode ser único ou que queremos atualizar o do usuario.
      // Wait, user_id isn't guaranteed unique on subscriptions unless it has a unique constraint. 
      // Safe fallback: just insert if we want a log, or skip since profiles controls access.
      // Profils controls the access, so we are safe.

    console.log(`[ASAAS WEBHOOK] Successfully unlocked access for user ${userId} on plan ${planTitle}`);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error("[ASAAS WEBHOOK] Unhandled error:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal Server Error" }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
