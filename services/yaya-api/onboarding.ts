import * as db from './db.js';

// Onboarding collects business info via WhatsApp conversation.
// Steps: business_name → owner_name → business_type → city → payment_methods → done

type OnboardingStep = 'greeting' | 'business_name' | 'owner_name' | 'business_type' | 'city' | 'payment_methods' | 'done';

const BUSINESS_TYPES = ['pollería', 'salón', 'bodega', 'ferretería', 'restaurante', 'tienda', 'otro'];

export function isOnboarding(userId: string): boolean {
  const settings = db.getSettings(userId);
  // Onboarding is complete when business_name is set and onboarding_complete is true
  if (settings.onboarding_complete === 'true') return false;
  return true;
}

function getStep(userId: string): OnboardingStep {
  const settings = db.getSettings(userId);
  return (settings.onboarding_step as OnboardingStep) || 'greeting';
}

function setStep(userId: string, step: OnboardingStep) {
  db.setSetting(userId, 'onboarding_step', step);
}

export async function handleOnboardingMessage(userId: string, text: string, contactName: string): Promise<string | null> {
  const step = getStep(userId);
  const input = text.trim();

  switch (step) {
    case 'greeting': {
      setStep(userId, 'business_name');
      return `¡Hola${contactName ? ' ' + contactName : ''}! Soy Yaya, tu asistente de negocio 🤖\n\nVamos a configurar tu negocio para que pueda ayudarte mejor.\n\n¿Cómo se llama tu negocio?`;
    }

    case 'business_name': {
      if (input.length < 2) return '¿Cómo se llama tu negocio? Escríbeme el nombre.';
      db.setSetting(userId, 'business_name', input);
      // Also update the user record
      const user = db.getUserById(userId);
      if (user) {
        try {
          db.getDb().prepare(`UPDATE users SET business_name = ? WHERE id = ?`).run(input, userId);
        } catch { /* best effort */ }
      }
      setStep(userId, 'owner_name');
      return `¡"${input}", qué buen nombre! 💪\n\n¿Cuál es tu nombre (el dueño/a)?`;
    }

    case 'owner_name': {
      if (input.length < 2) return '¿Cuál es tu nombre?';
      db.setSetting(userId, 'owner_name', input);
      setStep(userId, 'business_type');
      return `Mucho gusto, ${input} 🙌\n\n¿Qué tipo de negocio es?\n\n1. Pollería 🍗\n2. Salón de belleza 💇\n3. Bodega 🏪\n4. Ferretería 🔧\n5. Restaurante 🍽️\n6. Tienda 🛍️\n7. Otro\n\nEscribe el número o el nombre.`;
    }

    case 'business_type': {
      let businessType = input.toLowerCase();
      // Map numbers to types
      const numMap: Record<string, string> = { '1': 'pollería', '2': 'salón', '3': 'bodega', '4': 'ferretería', '5': 'restaurante', '6': 'tienda', '7': 'otro' };
      if (numMap[businessType]) businessType = numMap[businessType];

      // Fuzzy match
      const match = BUSINESS_TYPES.find(t => businessType.includes(t) || t.includes(businessType));
      const finalType = match || businessType;

      db.setSetting(userId, 'business_type', finalType);
      try {
        db.getDb().prepare(`UPDATE users SET business_type = ? WHERE id = ?`).run(finalType, userId);
      } catch { /* best effort */ }
      setStep(userId, 'city');
      return `Perfecto, ${finalType} ✅\n\n¿En qué ciudad estás?`;
    }

    case 'city': {
      if (input.length < 2) return '¿En qué ciudad estás ubicado?';
      db.setSetting(userId, 'city', input);
      try {
        db.getDb().prepare(`UPDATE users SET city = ? WHERE id = ?`).run(input, userId);
      } catch { /* best effort */ }
      setStep(userId, 'payment_methods');
      return `${input}, ¡buena zona! 📍\n\n¿Qué métodos de pago aceptas?\n\n• Yape 📱\n• Plin 📲\n• Efectivo 💵\n• Transferencia 🏦\n\nPuedes escribir varios separados por coma.\nEj: "Yape, efectivo"`;
    }

    case 'payment_methods': {
      if (input.length < 2) return '¿Qué métodos de pago aceptas? (Yape, Plin, efectivo, etc.)';
      db.setSetting(userId, 'payment_methods', input);

      // Complete onboarding
      db.setSetting(userId, 'onboarding_complete', 'true');
      setStep(userId, 'done');

      const businessName = db.getSettings(userId).business_name || 'tu negocio';
      return `¡Listo! Tu agente Yaya está configurado para *${businessName}* 🎉\n\nAhora puedo ayudarte con:\n• 📦 Pedidos y ventas\n• 💰 Pagos y cobros\n• 📊 Reportes del negocio\n• 🛍️ Inventario\n• 💡 Consejos de negocio\n\n¿En qué te ayudo?`;
    }

    case 'done': {
      // Onboarding already complete — shouldn't reach here
      return null;
    }

    default:
      setStep(userId, 'greeting');
      return handleOnboardingMessage(userId, text, contactName);
  }
}
