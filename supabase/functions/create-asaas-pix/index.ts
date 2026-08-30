import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log("[ASAAS] request started");

    // ─────────────────────────────────────────────────────
    // 1. Authenticate user — anon key + JWT context only
    // ─────────────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error("[ASAAS ERROR] Authorization header is missing");
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? "";
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? "";
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? "";

    // Admin client: used for all DB writes AND for user verification
    // (Required because the project uses ES256 JWT tokens, which need JWKS validation
    // that the admin client resolves correctly via SUPABASE_SERVICE_ROLE_KEY)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

    // User-context client: pass JWT in global headers for user-scoped reads if needed
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify the user identity using the admin client with the provided JWT
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (userError || !user) {
      console.error("[ASAAS ERROR] Failed to authenticate user:", userError?.message);
      return new Response(JSON.stringify({ error: "Usuário inválido ou sessão expirada" }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log("[ASAAS] authenticated user");

    // ─────────────────────────────────────────────────────
    // 2. Validate request payload and plan
    // ─────────────────────────────────────────────────────
    const { planCode, email, name, phone, docNumber } = await req.json();

    const planPrices: Record<string, number> = {
      monthly: 10.00,  // ⚠️ TESTE — alterar para 129.90 em produção
      quarterly: 247.00,
      yearly: 797.00,
      lifetime: 4997.00
    };

    const planDescriptions: Record<string, string> = {
      monthly: "Connect Finanças — Plano Mensal",
      quarterly: "Connect Finanças — Plano Trimestral",
      yearly: "Connect Finanças — Plano Anual",
      lifetime: "Connect Finanças — Plano Vitalício"
    };

    const value = planPrices[planCode];
    if (value === undefined) {
      console.error("[ASAAS ERROR] Invalid planCode:", planCode);
      return new Response(JSON.stringify({ error: "Plano inválido." }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log("[ASAAS] plan validated:", planCode, value);

    const cleanPhone = phone?.replace(/\D/g, '') || '';
    const cleanDoc = docNumber?.replace(/\D/g, '') || '';

    if (!name || !email || !cleanDoc) {
      return new Response(JSON.stringify({ error: "Dados cadastrais incompletos." }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ─── Validação matemática de CPF (server-side) ────────────────────────────
    const isValidCPF = (cpf: string): boolean => {
      if (cpf.length !== 11) return false;
      if (/^(\d)\1{10}$/.test(cpf)) return false;
      let sum = 0;
      for (let i = 0; i < 9; i++) sum += parseInt(cpf[i]) * (10 - i);
      let rem = (sum * 10) % 11;
      if (rem === 10 || rem === 11) rem = 0;
      if (rem !== parseInt(cpf[9])) return false;
      sum = 0;
      for (let i = 0; i < 10; i++) sum += parseInt(cpf[i]) * (11 - i);
      rem = (sum * 10) % 11;
      if (rem === 10 || rem === 11) rem = 0;
      return rem === parseInt(cpf[10]);
    };

    // ─── Validação matemática de CNPJ (server-side) ───────────────────────────
    const isValidCNPJ = (cnpj: string): boolean => {
      if (cnpj.length !== 14) return false;
      if (/^(\d)\1{13}$/.test(cnpj)) return false;
      const calcDigit = (base: string, weights: number[]): number => {
        const s = base.split('').reduce((acc: number, d: string, i: number) => acc + parseInt(d) * weights[i], 0);
        const r = s % 11;
        return r < 2 ? 0 : 11 - r;
      };
      const d1 = calcDigit(cnpj.slice(0, 12), [5,4,3,2,9,8,7,6,5,4,3,2]);
      if (d1 !== parseInt(cnpj[12])) return false;
      const d2 = calcDigit(cnpj.slice(0, 13), [6,5,4,3,2,9,8,7,6,5,4,3,2]);
      return d2 === parseInt(cnpj[13]);
    };

    if (cleanDoc.length === 11) {
      if (!isValidCPF(cleanDoc)) {
        console.error("[ASAAS ERROR] Invalid CPF digits:", cleanDoc.substring(0, 3) + "...");
        return new Response(JSON.stringify({ error: "CPF inválido. Verifique os dígitos informados." }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    } else if (cleanDoc.length === 14) {
      if (!isValidCNPJ(cleanDoc)) {
        console.error("[ASAAS ERROR] Invalid CNPJ digits:", cleanDoc.substring(0, 3) + "...");
        return new Response(JSON.stringify({ error: "CNPJ inválido. Verifique os dígitos informados." }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    } else {
      return new Response(JSON.stringify({ error: "Informe um CPF (11 dígitos) ou CNPJ (14 dígitos) válido." }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ─────────────────────────────────────────────────────
    // 3. Asaas credentials
    // ─────────────────────────────────────────────────────
    const asaasApiKey = Deno.env.get('ASAAS_API_KEY');
    const asaasEnv = Deno.env.get('ASAAS_ENVIRONMENT') || 'sandbox';

    if (!asaasApiKey) {
      console.error("[ASAAS ERROR] ASAAS_API_KEY is not defined in Secrets.");
      return new Response(JSON.stringify({ error: "Configuração do gateway pendente no servidor." }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const asaasBaseUrl = asaasEnv === 'production'
      ? 'https://api.asaas.com/v3'
      : 'https://api-sandbox.asaas.com/v3';

    console.log("[ASAAS] environment:", asaasEnv, "base URL:", asaasBaseUrl);

    const asaasHeaders = {
      'Content-Type': 'application/json',
      'User-Agent': 'ConnectFinancas/1.0',
      'access_token': asaasApiKey
    };

    // ─────────────────────────────────────────────────────
    // 4. Locate or create Asaas Customer
    // ─────────────────────────────────────────────────────
    let customerId = "";

    // Check existing asaas_customer_id in local profile (read via admin to avoid RLS issues)
    const { data: profile, error: profileFetchErr } = await supabaseAdmin
      .from('profiles')
      .select('asaas_customer_id')
      .eq('id', user.id)
      .single();

    if (profileFetchErr) {
      console.error("[ASAAS ERROR] Profile fetch failed:", profileFetchErr.code, profileFetchErr.message);
    }

    if (profile?.asaas_customer_id) {
      customerId = profile.asaas_customer_id;
      console.log("[ASAAS] customer existing/reused from profile");
    } else {
      // Search in Asaas by CPF/CNPJ to prevent duplicates
      const searchRes = await fetch(`${asaasBaseUrl}/customers?cpfCnpj=${cleanDoc}`, {
        method: 'GET',
        headers: asaasHeaders
      });

      if (searchRes.ok) {
        const searchData = await searchRes.json();
        if (searchData.data && searchData.data.length > 0) {
          customerId = searchData.data[0].id;
          console.log("[ASAAS] customer existing/reused from Asaas search. customerId:", customerId);
        }
      }

      if (!customerId) {
        console.log("[ASAAS] creating new customer");
        const createCustRes = await fetch(`${asaasBaseUrl}/customers`, {
          method: 'POST',
          headers: asaasHeaders,
          body: JSON.stringify({
            name,
            email,
            cpfCnpj: cleanDoc,
            mobilePhone: cleanPhone,
            externalReference: user.id
          })
        });

        if (!createCustRes.ok) {
          const errBody = await createCustRes.text();
          console.error(`[ASAAS ERROR] Customer creation failed: ${createCustRes.status} - ${errBody}`);
          return new Response(JSON.stringify({ error: "Falha ao registrar cliente no gateway de pagamentos." }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const newCustData = await createCustRes.json();
        customerId = newCustData.id;
        console.log("[ASAAS] customer created. customerId:", customerId);
      }

      // Save asaas_customer_id to profile using admin client (bypasses RLS)
      const { error: custUpdateErr } = await supabaseAdmin
        .from('profiles')
        .update({ asaas_customer_id: customerId })
        .eq('id', user.id);

      if (custUpdateErr) {
        console.error("[ASAAS ERROR] PROFILE_CUSTOMER_UPDATE_FAILED", {
          code: custUpdateErr.code,
          message: custUpdateErr.message
        });
        // Non-fatal: continue without blocking payment
      } else {
        console.log("[ASAAS] profiles.asaas_customer_id updated successfully");
      }
    }

    console.log("[ASAAS] customer existing/created");

    // ─────────────────────────────────────────────────────
    // 5. Create Payment Charge
    // ─────────────────────────────────────────────────────
    const today = new Date();
    const dueDateObj = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const dueDate = dueDateObj.toISOString().split('T')[0];

    const externalReference = `${user.id}|${planCode}|${crypto.randomUUID()}`;

    const createPaymentRes = await fetch(`${asaasBaseUrl}/payments`, {
      method: 'POST',
      headers: asaasHeaders,
      body: JSON.stringify({
        customer: customerId,
        billingType: 'PIX',
        value,
        dueDate,
        description: planDescriptions[planCode],
        externalReference
      })
    });

    console.log("[ASAAS] POST /payments HTTP status:", createPaymentRes.status);

    if (!createPaymentRes.ok) {
      const errBody = await createPaymentRes.text();
      console.error(`[ASAAS ERROR] Payment creation failed: ${createPaymentRes.status} - ${errBody}`);
      return new Response(JSON.stringify({ error: "Falha ao gerar cobrança no gateway de pagamentos." }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const paymentData = await createPaymentRes.json();
    const paymentId: string = paymentData.id;

    if (!paymentId || !paymentId.startsWith('pay_')) {
      console.error("[ASAAS ERROR] Payment response did not contain a valid pay_ ID. Response:", JSON.stringify(paymentData));
      return new Response(JSON.stringify({ error: "Resposta inválida do gateway de pagamentos." }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log("[ASAAS] ASAAS_PAYMENT_CREATED", {
      environment: asaasEnv,
      paymentId,
      status: paymentData.status,
      value: paymentData.value
    });

    // ─────────────────────────────────────────────────────
    // 6. Verify payment exists via GET /payments/{id}
    // ─────────────────────────────────────────────────────
    const verifyRes = await fetch(`${asaasBaseUrl}/payments/${paymentId}`, {
      method: 'GET',
      headers: asaasHeaders
    });

    console.log("[ASAAS] GET /payments/{id} HTTP status:", verifyRes.status);

    if (!verifyRes.ok) {
      const verifyErrBody = await verifyRes.text();
      console.error(`[ASAAS ERROR] Payment verification failed: ${verifyRes.status} - ${verifyErrBody}`);
      return new Response(JSON.stringify({ error: "Cobrança criada mas não verificada no gateway. Não será gerado QR Code." }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const verifiedPayment = await verifyRes.json();
    console.log("[ASAAS] ASAAS_PAYMENT_VERIFIED", {
      paymentId,
      httpStatus: verifyRes.status,
      status: verifiedPayment.status,
      value: verifiedPayment.value,
      billingType: verifiedPayment.billingType
    });

    // ─────────────────────────────────────────────────────
    // 7. Save payment record locally using supabaseAdmin
    // ─────────────────────────────────────────────────────
    const { data: insertedPayment, error: paymentInsertErr } = await supabaseAdmin
      .from('payments')
      .insert({
        user_id: user.id,
        provider: 'asaas',
        provider_customer_id: customerId,
        provider_payment_id: paymentId,
        plan: planCode,
        amount: value,
        status: 'pending'
      })
      .select()
      .single();

    if (paymentInsertErr) {
      console.error("[ASAAS ERROR] PAYMENT_DB_INSERT_FAILED", {
        code: paymentInsertErr.code,
        message: paymentInsertErr.message
      });
      // Non-fatal: payment exists in Asaas, proceed to QR Code but log the failure
      console.error("[ASAAS ERROR] Local payment record was NOT saved. Manual reconciliation may be required.");
    } else {
      console.log("[ASAAS] Local payment record saved successfully. Local ID:", insertedPayment?.id);
    }

    // ─────────────────────────────────────────────────────
    // 8. Retrieve QR Code
    // ─────────────────────────────────────────────────────
    const qrCodeRes = await fetch(`${asaasBaseUrl}/payments/${paymentId}/pixQrCode`, {
      method: 'GET',
      headers: asaasHeaders
    });

    console.log("[ASAAS] GET /pixQrCode HTTP status:", qrCodeRes.status);

    if (!qrCodeRes.ok) {
      const errBody = await qrCodeRes.text();
      console.error(`[ASAAS ERROR] PIX QrCode retrieval failed: ${qrCodeRes.status} - ${errBody}`);
      return new Response(JSON.stringify({ error: "Cobrança criada no Asaas mas falha ao recuperar QR Code." }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const qrData = await qrCodeRes.json();
    const { encodedImage, payload, expirationDate } = qrData;

    if (!payload || !encodedImage) {
      console.error("[ASAAS ERROR] QR Code response missing payload or encodedImage. Response keys:", Object.keys(qrData));
      return new Response(JSON.stringify({ error: "QR Code do Asaas retornou dados incompletos." }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log("[ASAAS] pix qr code retrieved. payload length:", payload.length, "encodedImage length:", encodedImage.length);

    return new Response(
      JSON.stringify({
        success: true,
        provider: "asaas",
        paymentId,
        customerId,
        plan: planCode,
        amount: value,
        pixCode: payload,
        qrCodeBase64: encodedImage,
        expirationDate
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    console.error("[ASAAS ERROR] general exception:", error?.message ?? error);
    return new Response(JSON.stringify({ error: "Não foi possível gerar o Pix neste momento. Tente novamente." }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
})
