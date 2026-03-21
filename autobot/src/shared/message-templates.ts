/**
 * Language-aware message templates for system-triggered messages
 * (payment confirmations, reminders, follow-ups, etc.)
 */

const TEMPLATES: Record<string, Record<string, string>> = {
  'payment-confirmed': {
    es: 'Tu pago por el pedido #{{orderId}} fue confirmado. ¡Gracias!',
    en: 'Your payment for order #{{orderId}} has been confirmed. Thank you!',
    pt: 'Seu pagamento pelo pedido #{{orderId}} foi confirmado. Obrigado!',
  },
  'appointment-reminder': {
    es: 'Recordatorio: Tienes una cita para "{{serviceName}}" programada para {{scheduledAt}}. ¡Te esperamos!',
    en: 'Reminder: You have an appointment for "{{serviceName}}" scheduled for {{scheduledAt}}. See you there!',
    pt: 'Lembrete: Voce tem uma consulta para "{{serviceName}}" agendada para {{scheduledAt}}. Te esperamos!',
  },
  'payment-followup': {
    es: 'Hola! Tu pedido #{{orderId}} por {{total}} aun esta pendiente de pago. Puedes yapear al {{yapeNumber}} para confirmar tu pedido.',
    en: 'Hi! Your order #{{orderId}} for {{total}} is still pending payment. You can send your Yape payment to {{yapeNumber}} to confirm.',
    pt: 'Oi! Seu pedido #{{orderId}} de {{total}} ainda esta pendente de pagamento. Voce pode enviar o pagamento via Yape para {{yapeNumber}}.',
  },
  'low-stock-alert': {
    es: 'Alerta de inventario: "{{productName}}" tiene solo {{currentStock}} unidades. Considera reabastecer pronto.',
    en: 'Inventory alert: "{{productName}}" has only {{currentStock}} units left. Consider restocking soon.',
    pt: 'Alerta de estoque: "{{productName}}" tem apenas {{currentStock}} unidades. Considere reabastecer em breve.',
  },
  'out-of-stock': {
    es: 'Alerta: "{{productName}}" se agoto y fue desactivado automaticamente. Reabastece y reactiva el producto cuando tengas stock.',
    en: 'Alert: "{{productName}}" is out of stock and has been automatically deactivated. Restock and reactivate the product when available.',
    pt: 'Alerta: "{{productName}}" esgotou e foi desativado automaticamente. Reabasteca e reative o produto quando disponivel.',
  },
  // Feature 5: Automated Follow-up Flows
  'post-purchase': {
    es: '¡Hola {{customerName}}! 🎉 ¿Todo bien con tu pedido #{{orderId}}? Esperamos que te haya encantado. Responde REPETIR si quieres pedir lo mismo otra vez. ¡Gracias por confiar en nosotros!',
    en: 'Hi {{customerName}}! 🎉 How was your order #{{orderId}}? We hope you loved it. Reply REPEAT if you want to order the same again. Thanks for trusting us!',
    pt: 'Oi {{customerName}}! 🎉 Tudo bem com seu pedido #{{orderId}}? Esperamos que tenha adorado. Responda REPETIR se quiser pedir o mesmo novamente. Obrigado por confiar!',
  },
  'abandoned-cart': {
    es: '¡Hola! 👋 Veo que dejaste un pedido pendiente (#{{orderId}}) por {{total}}. ¿Te quedaste con las ganas? Responde SI y te ayudo a completarlo. ¡Estoy aquí para lo que necesites!',
    en: "Hi! 👋 I see you left order #{{orderId}} pending for {{total}}. Still interested? Reply YES and I'll help you complete it. I'm here for whatever you need!",
    pt: 'Oi! 👋 Vi que deixou um pedido pendente (#{{orderId}}) de {{total}}. Ainda tem interesse? Responda SIM e eu ajudo a completar. Estou aqui para o que precisar!',
  },
  'no-show': {
    es: '¡Hola {{customerName}}! 😊 Te extrañamos hoy en tu cita para "{{serviceName}}". ¿Todo bien? Si quieres reagendar, responde CITA y buscamos otro momento. ¡Te esperamos!',
    en: 'Hi {{customerName}}! 😊 We missed you today for your "{{serviceName}}" appointment. Everything okay? If you want to reschedule, reply APPT and we\'ll find another time. We\'ll wait for you!',
    pt: 'Oi {{customerName}}! 😊 Sentimos sua falta hoje na sua consulta para "{{serviceName}}". Tudo bem? Se quiser reagendar, responda CONSULTA e procuramos outro horário. Te esperamos!',
  },
  're-engagement': {
    es: '¡Hola! 👋 Te extrañamos por aquí. ¿Cómo estás? Tenemos novedades que te pueden interesar. Responde VER y te cuento qué hay de nuevo. ¡Será un gusto atenderte de nuevo!',
    en: "Hi! 👋 We miss you around here. How are you? We have new things you might like. Reply SEE and I'll tell you what's new. It'll be a pleasure to serve you again!",
    pt: 'Oi! 👋 Sentimos sua falta por aqui. Como está? Temos novidades que podem te interessar. Responda VER e te conto o que há de novo. Será um prazer atender novamente!',
  },
  'payment-expired': {
    es: 'Tu pedido #{{orderId}} ha sido cancelado por falta de pago. Si deseas volver a ordenar, escríbenos.',
    en: 'Your order #{{orderId}} has been cancelled due to non-payment. If you\'d like to reorder, just message us.',
    pt: 'Seu pedido #{{orderId}} foi cancelado por falta de pagamento. Se quiser pedir novamente, nos envie uma mensagem.',
  },
};

export function getMessage(key: string, lang: string, vars: Record<string, string | number>): string {
  const template = TEMPLATES[key]?.[lang] || TEMPLATES[key]?.['es'] || '';
  return template.replace(/\{\{(\w+)\}\}/g, (_, k) => String(vars[k] ?? ''));
}
