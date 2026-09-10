/**
 * Configuração da integração com a Cakto (Checkout e Planos)
 * 
 * Substitua os links abaixo pelos links dos seus produtos/ofertas criados no painel da Cakto:
 * https://app.cakto.com.br
 */

export interface CaktoPlanConfig {
  code: 'monthly' | 'quarterly' | 'yearly' | 'lifetime';
  name: string;
  price: string;
  period: string;
  durationDays: number; // 0 = vitalício
  checkoutUrl: string;
}

export const CAKTO_PLANS: Record<string, CaktoPlanConfig> = {
  monthly: {
    code: 'monthly',
    name: 'Plano Mensal',
    price: 'R$ 129,90',
    period: 'mês',
    durationDays: 30,
    checkoutUrl: import.meta.env.VITE_CAKTO_CHECKOUT_MONTHLY || 'https://pay.cakto.com.br/s6qbfuo_1065831',
  },
  quarterly: {
    code: 'quarterly',
    name: 'Plano Trimestral',
    price: 'R$ 247,00',
    period: 'trimestre',
    durationDays: 90,
    checkoutUrl: import.meta.env.VITE_CAKTO_CHECKOUT_QUARTERLY || 'https://pay.cakto.com.br/xqxkptf',
  },
  yearly: {
    code: 'yearly',
    name: 'Plano Anual',
    price: 'R$ 797,00',
    period: 'ano',
    durationDays: 365,
    checkoutUrl: import.meta.env.VITE_CAKTO_CHECKOUT_YEARLY || 'https://pay.cakto.com.br/fdmcifw',
  },
  lifetime: {
    code: 'lifetime',
    name: 'Plano Vitalício',
    price: 'R$ 4.997,00',
    period: 'único',
    durationDays: 0, // vitalício
    checkoutUrl: import.meta.env.VITE_CAKTO_CHECKOUT_LIFETIME || 'https://pay.cakto.com.br/fn3cp6r',
  },
};

export interface CustomerPreFill {
  email?: string;
  name?: string;
  phone?: string;
  doc?: string;
}

/**
 * Retorna o link de checkout da Cakto com preenchimento automático dos dados do comprador se disponíveis
 */
export function getCaktoCheckoutUrl(planCode: string, customer?: CustomerPreFill): string {
  const plan = CAKTO_PLANS[planCode] || CAKTO_PLANS['yearly'];
  const baseUrl = plan.checkoutUrl;

  try {
    const url = new URL(baseUrl);
    if (customer?.email) url.searchParams.set('email', customer.email);
    if (customer?.name) url.searchParams.set('name', customer.name);
    if (customer?.phone) url.searchParams.set('phone', customer.phone.replace(/\D/g, ''));
    if (customer?.doc) url.searchParams.set('cpf_cnpj', customer.doc.replace(/\D/g, ''));
    return url.toString();
  } catch {
    // Se a URL for relativa ou simples
    const params = new URLSearchParams();
    if (customer?.email) params.set('email', customer.email);
    if (customer?.name) params.set('name', customer.name);
    if (customer?.phone) params.set('phone', customer.phone.replace(/\D/g, ''));
    if (customer?.doc) params.set('cpf_cnpj', customer.doc.replace(/\D/g, ''));
    const query = params.toString();
    return query ? `${baseUrl}?${query}` : baseUrl;
  }
}
