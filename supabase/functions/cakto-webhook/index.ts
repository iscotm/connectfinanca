import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cakto-signature',
};

// Plan duration in days mapping
const PLAN_DURATIONS: Record<string, number> = {
  monthly: 30,
  quarterly: 90,
  yearly: 365,
  lifetime: 0, // 0 = vitalício
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Credenciais do Supabase não configuradas.");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    const payload = await req.json();
    console.log("[CAKTO WEBHOOK] Recebido:", JSON.stringify(payload));

    // Cakto Webhook pode enviar dados aninhados em `data` ou no root
    const event = (payload.event || payload.status || payload.type || '').toLowerCase();
    const data = payload.data || payload;

    // Extrair dados do cliente
    const customer = data.customer || data.buyer || data.client || {};
    const rawEmail = (customer.email || data.email || payload.email || '').trim().toLowerCase();
    const customerName = customer.name || data.name || customer.full_name || 'Cliente Cakto';
    const customerPhone = customer.phone || customer.cellphone || data.phone || '';
    const customerDoc = (customer.docNumber || customer.document || customer.cpf || customer.cnpj || customer.cpf_cnpj || data.doc || '').replace(/\D/g, '');

    if (!rawEmail) {
      console.warn("[CAKTO WEBHOOK] Email do cliente não encontrado no payload.");
      return new Response(
        JSON.stringify({ received: true, warning: "Email não fornecido no payload" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Identificar plano/produto
    const product = data.product || data.offer || {};
    const productName = (product.name || product.title || data.product_name || data.plan_name || data.name || '').toLowerCase();
    const offerId = (data.refId || product.id || product.code || data.offer_id || data.plan_code || '').toLowerCase();
    const orderId = String(data.id || data.order_id || data.transaction_id || payload.id || crypto.randomUUID());

    let planCode = 'yearly'; // padrão
    if (offerId.includes('s6qbfuo') || offerId.includes('month') || productName.includes('mensal')) {
      planCode = 'monthly';
    } else if (offerId.includes('xqxkptf') || offerId.includes('quart') || offerId.includes('trimest') || productName.includes('trimestral')) {
      planCode = 'quarterly';
    } else if (offerId.includes('fn3cp6r') || offerId.includes('life') || offerId.includes('vital') || productName.includes('vitalício') || productName.includes('vitalicio')) {
      planCode = 'lifetime';
    } else if (offerId.includes('fdmcifw') || offerId.includes('year') || offerId.includes('anual') || productName.includes('anual')) {
      planCode = 'yearly';
    }

    const durationDays = PLAN_DURATIONS[planCode] ?? 365;

    // 1. Localizar ou criar usuário no Supabase
    let userId: string | null = null;

    // Buscar perfil existente pelo email
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, name, email, status')
      .eq('email', rawEmail)
      .maybeSingle();

    if (existingProfile) {
      userId = existingProfile.id;
      console.log(`[CAKTO WEBHOOK] Usuário encontrado: ${userId} (${rawEmail})`);
    } else {
      // Buscar nos usuários do Auth
      const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
      const matchedAuthUser = authUsers?.users?.find(u => u.email?.toLowerCase() === rawEmail);

      if (matchedAuthUser) {
        userId = matchedAuthUser.id;
        console.log(`[CAKTO WEBHOOK] Usuário encontrado no Auth: ${userId}`);
      } else {
        // Criar novo usuário no Supabase Auth
        const tempPassword = `Cakto@${Math.floor(100000 + Math.random() * 900000)}`;
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: rawEmail,
          password: tempPassword,
          email_confirm: true,
          user_metadata: {
            name: customerName,
            phone: customerPhone,
            source: 'cakto_checkout'
          }
        });

        if (createError || !newUser?.user) {
          console.error("[CAKTO WEBHOOK ERROR] Falha ao criar usuário:", createError);
          throw new Error(`Erro ao criar usuário: ${createError?.message}`);
        }

        userId = newUser.user.id;
        console.log(`[CAKTO WEBHOOK] Novo usuário criado: ${userId} (${rawEmail})`);
      }
    }

    // Determinar status do evento
    const isApproved = [
      'purchase_approved',
      'payment_approved',
      'order_approved',
      'approved',
      'paid',
      'pago',
      'subscription_created',
      'subscription_renewed',
      'active',
      'completed'
    ].some(ev => event.includes(ev));

    const isCanceled = [
      'purchase_refunded',
      'refunded',
      'reembolsado',
      'chargeback',
      'subscription_canceled',
      'canceled',
      'cancelado',
      'expired',
      'expirado'
    ].some(ev => event.includes(ev));

    // 2. Processar Pagamento Aprovado
    if (isApproved) {
      let expiresAt: string | null = null;
      if (durationDays > 0) {
        const d = new Date();
        d.setDate(d.getDate() + durationDays);
        expiresAt = d.toISOString();
      }

      // Upsert/Insert na tabela subscriptions
      const { error: subError } = await supabaseAdmin
        .from('subscriptions')
        .insert({
          user_id: userId,
          provider: 'cakto',
          plan: planCode,
          status: 'active',
          current_period_end: expiresAt
        });

      if (subError) {
        console.error("[CAKTO WEBHOOK ERROR] Erro ao inserir assinatura:", subError);
      }

      // Atualizar perfil do usuário
      const planDisplayName = planCode === 'lifetime' ? 'Plano Vitalício'
        : planCode === 'yearly' ? 'Plano Anual'
        : planCode === 'quarterly' ? 'Plano Trimestral'
        : 'Plano Mensal';

      await supabaseAdmin
        .from('profiles')
        .upsert({
          id: userId,
          email: rawEmail,
          name: customerName,
          phone: customerPhone || undefined,
          cnpj: customerDoc || undefined,
          status: 'ativo',
          access_type: planDisplayName,
          access_expires_at: expiresAt,
          updated_at: new Date().toISOString()
        });

      // Registrar no log do sistema
      await supabaseAdmin
        .from('admin_logs')
        .insert({
          user_id: userId,
          action: 'CAKTO_PURCHASE_APPROVED',
          description: `Pagamento aprovado via Cakto (Pedido: ${orderId}, Plano: ${planDisplayName}, Expira: ${expiresAt || 'Vitalício'})`
        });

      console.log(`[CAKTO WEBHOOK] Acesso ativado com sucesso para ${rawEmail} (${planDisplayName})`);

      return new Response(
        JSON.stringify({ success: true, message: `Acesso liberado com sucesso para ${rawEmail}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // 3. Processar Cancelamento / Reembolso
    if (isCanceled) {
      await supabaseAdmin
        .from('subscriptions')
        .update({ status: 'canceled' })
        .eq('user_id', userId)
        .eq('provider', 'cakto');

      await supabaseAdmin
        .from('profiles')
        .update({
          status: 'expirado',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      await supabaseAdmin
        .from('admin_logs')
        .insert({
          user_id: userId,
          action: 'CAKTO_PURCHASE_CANCELED',
          description: `Assinatura cancelada/reembolsada via Cakto (Evento: ${event}, Pedido: ${orderId})`
        });

      console.log(`[CAKTO WEBHOOK] Acesso suspenso para ${rawEmail} devido a ${event}`);

      return new Response(
        JSON.stringify({ success: true, message: `Acesso cancelado para ${rawEmail}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Evento não mapeado (ex: boleto gerado, pix gerado, abandonado)
    console.log(`[CAKTO WEBHOOK] Evento ignorado ou informativo: ${event}`);
    return new Response(
      JSON.stringify({ received: true, event }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    console.error("[CAKTO WEBHOOK ERROR]", error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erro ao processar webhook da Cakto' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
