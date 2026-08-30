import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: req.headers.get('Authorization')! } },
      }
    )

    // Verify if the caller is an admin
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) throw new Error('Não autorizado')

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      throw new Error('Permissão negada. Apenas administradores.')
    }

    // Admin Client (service_role) to bypass RLS and invite users
    const adminAuthClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, email, plan, durationDays, provider, subscriptionId } = await req.json()

    if (action === 'grant_access') {
      if (!email) throw new Error('E-mail é obrigatório.')

      // Verificar se usuário já existe no auth
      // Para isso, precisamos tentar buscar pelo email ou verificar se o perfil existe
      let targetUserId = null
      
      const { data: existingProfiles, error: profileErr } = await adminAuthClient
        .from('profiles')
        .select('id')
        .eq('email', email)
        .limit(1)

      if (profileErr) throw profileErr

      if (existingProfiles && existingProfiles.length > 0) {
        targetUserId = existingProfiles[0].id
      } else {
        // Usuário não existe, vamos criar um invite
        const { data: inviteData, error: inviteError } = await adminAuthClient.auth.admin.inviteUserByEmail(email)
        if (inviteError) throw inviteError
        
        targetUserId = inviteData.user.id

        // Criar o profile básico (já que o trigger do Supabase Auth pode não criar com todos os dados logo no invite)
        await adminAuthClient.from('profiles').insert({
          id: targetUserId,
          email: email,
          name: email.split('@')[0],
          status: 'ativo',
          access_type: 'Acesso Concedido',
        }).select().single()
      }

      // Adicionar a assinatura (subscription)
      let expiresAt = null
      if (durationDays > 0) {
        const date = new Date()
        date.setDate(date.getDate() + durationDays)
        expiresAt = date.toISOString()
      }

      const { error: subError } = await adminAuthClient.from('subscriptions').insert({
        user_id: targetUserId,
        provider: provider || 'manual',
        plan: plan,
        status: 'active',
        current_period_end: expiresAt
      })

      if (subError) throw subError

      // Log the action
      await adminAuthClient.from('admin_logs').insert({
        admin_id: user.id,
        user_id: targetUserId,
        action: 'GRANT_ACCESS',
        description: `Concedeu acesso manual para ${email} (Plano: ${plan}, Duração: ${durationDays} dias)`
      })

      return new Response(
        JSON.stringify({ success: true, message: 'Acesso concedido com sucesso!' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    if (action === 'cancel_asaas') {
      // Stub para cancelamento no Asaas
      // Buscar assinatura no asaas_subscription_id e usar API do Asaas para cancelar.
      if (!subscriptionId) throw new Error('Subscription ID is required')
      
      const { data: sub } = await adminAuthClient.from('subscriptions').select('*').eq('id', subscriptionId).single()
      if (!sub) throw new Error('Assinatura não encontrada')

      // Aqui você adicionaria a chamada HTTP para o Asaas DELETE /v3/subscriptions/{id}
      // Se sucesso, atualiza no banco
      const { error: updateError } = await adminAuthClient.from('subscriptions').update({ status: 'canceled' }).eq('id', subscriptionId)
      if (updateError) throw updateError

      // Log the action
      await adminAuthClient.from('admin_logs').insert({
        admin_id: user.id,
        user_id: sub.user_id,
        action: 'CANCEL_SUBSCRIPTION_ASAAS',
        description: `Cancelou assinatura Asaas (ID: ${subscriptionId})`
      })

      return new Response(
        JSON.stringify({ success: true, message: 'Assinatura cancelada com sucesso' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    throw new Error('Ação inválida')

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
