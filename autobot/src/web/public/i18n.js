/* ═══════════════════════════════════════════════════
   YAYA — Internationalization (EN / ES / PT)
   ═══════════════════════════════════════════════════ */

(function() {
  'use strict';

  const T = {
    en: {
      // Nav
      'nav.features': 'Features',
      'nav.how': 'How It Works',
      'nav.pricing': 'Pricing',
      'nav.about': 'About',
      'nav.contact': 'Contact',
      'nav.cta': 'Chat with Yaya',

      // Hero
      'hero.badge': 'Now Automating 1,000+ Businesses',
      'hero.title.1': 'Your WhatsApp.',
      'hero.title.2': 'Now an AI Sales Machine.',
      'hero.subtitle': 'Yaya transforms your WhatsApp into a tireless AI assistant that handles customer conversations, takes orders, processes payments, and manages your entire business — 24 hours a day, 7 days a week.',
      'hero.cta.primary': 'Start Free on WhatsApp',
      'hero.cta.secondary': 'See How It Works',
      'hero.stat.1': 'Always Online',
      'hero.stat.2': 'More Sales',
      'hero.stat.3': 'Response Time',
      'hero.stat.4': 'Missed Messages',

      // Social proof
      'social.label': 'Trusted by businesses across Latin America',
      'social.1': 'Restaurants',
      'social.2': 'Bakeries',
      'social.3': 'Retail Shops',
      'social.4': 'Service Providers',
      'social.5': 'E-Commerce',

      // Features
      'features.tag': 'Features',
      'features.title.1': 'Everything your business needs.',
      'features.title.2': 'Nothing it doesn\'t.',
      'features.subtitle': 'From the first customer message to the final delivery — Yaya handles it all through the app your customers already use every day.',
      'feat.1.title': 'AI Conversations',
      'feat.1.desc': 'Your personal AI assistant understands natural language, answers product questions, and guides customers through purchases — in Spanish, English, or any language.',
      'feat.2.title': 'Smart Order Management',
      'feat.2.desc': 'Orders created automatically from conversations. Stock tracked in real-time. Status updates sent to customers without you lifting a finger.',
      'feat.3.title': 'Payment Integration',
      'feat.3.desc': 'Seamless Yape payment processing. Customers pay, our system auto-verifies, and orders move forward — no manual checking required.',
      'feat.4.title': 'Business Analytics',
      'feat.4.desc': 'Real-time dashboards showing sales trends, top products, customer insights, and revenue metrics. Know exactly how your business is performing.',
      'feat.5.title': 'Customer Profiles',
      'feat.5.desc': 'Every customer interaction builds a rich profile — purchase history, preferences, location, and contact info. Know your regulars like family.',
      'feat.6.title': 'Product Catalog',
      'feat.6.desc': 'Upload your products with photos, categories, pricing, and stock levels. Your AI knows your entire catalog and recommends items intelligently.',

      // How it works
      'how.tag': 'How It Works',
      'how.title.1': 'Three steps to',
      'how.title.2': 'autopilot your business.',
      'how.subtitle': 'Get up and running in under 10 minutes. No coding, no apps to download, no complicated setup.',
      'step.1.title': 'Connect Your WhatsApp',
      'step.1.desc': 'Scan a QR code from your dashboard and Yaya connects to your WhatsApp Business number. That\'s it — your AI is now listening.',
      'step.2.title': 'Upload Your Catalog',
      'step.2.desc': 'Add your products, set prices and stock levels. Your AI assistant memorizes everything and becomes an expert on your offerings.',
      'step.3.title': 'Watch Sales Roll In',
      'step.3.desc': 'Yaya handles conversations, creates orders, processes payments, and keeps your customers happy — while you track everything from your dashboard.',

      // Testimonials
      'test.tag': 'Testimonials',
      'test.title.1': 'Loved by business owners',
      'test.title.2': 'who never look back.',
      'test.1.text': '"Before Yaya I was answering WhatsApp messages until 2am. Now my AI handles everything and I wake up to orders already confirmed and paid. My sales tripled in the first month."',
      'test.2.text': '"The Yape payment integration is magic. Customers pay, Yaya confirms automatically, and the order starts preparing. I don\'t even have to check my phone anymore."',
      'test.3.text': '"I sell clothes online and Yaya handles all the sizing questions, stock checks, and order creation. It\'s like having a full-time employee that never sleeps and never makes mistakes."',

      // Pricing
      'price.tag': 'Pricing',
      'price.title.1': 'Simple pricing.',
      'price.title.2': 'Unlimited potential.',
      'price.subtitle': 'Start free. Scale when you\'re ready. No hidden fees, no surprises.',
      'price.popular': 'Most Popular',
      'price.starter': 'Starter',
      'price.starter.desc': 'Perfect to try Yaya and see the magic',
      'price.growth': 'Growth',
      'price.growth.desc': 'For businesses ready to scale seriously',
      'price.enterprise': 'Enterprise',
      'price.enterprise.desc': 'Custom solutions for larger operations',
      'price.period': '/month',
      'price.custom': 'Custom',
      'price.cta.starter': 'Get Started Free',
      'price.cta.growth': 'Start Growing',
      'price.cta.enterprise': 'Contact Sales',
      'price.f.1': '100 AI messages/month',
      'price.f.2': '1 WhatsApp number',
      'price.f.3': 'Product catalog (up to 20)',
      'price.f.4': 'Basic order management',
      'price.f.5': 'Customer profiles',
      'price.f.6': 'Unlimited AI messages',
      'price.f.7': 'Unlimited products',
      'price.f.8': 'Yape payment integration',
      'price.f.9': 'Full analytics dashboard',
      'price.f.10': 'Image & voice understanding',
      'price.f.11': 'Priority support',
      'price.f.12': 'Everything in Growth',
      'price.f.13': 'Multiple WhatsApp numbers',
      'price.f.14': 'Custom AI training',
      'price.f.15': 'API access',
      'price.f.16': 'Dedicated account manager',
      'price.f.17': 'White-label options',

      // About
      'about.tag': 'About Yaya',
      'about.title.1': 'Built by entrepreneurs,',
      'about.title.2': 'for entrepreneurs.',
      'about.p1': 'We started Yaya because we saw small business owners in Latin America drowning in WhatsApp messages — responding late, losing orders, and burning out. They didn\'t need another complicated SaaS tool. They needed something that just works, right inside the app they already use.',
      'about.p2': 'Yaya is AI that speaks your language, understands your business, and never sleeps. We believe every small business deserves the same level of automation that big companies have — without the big company price tag.',
      'about.val.1.title': 'Simple by Design',
      'about.val.1.desc': 'If your grandma can\'t use it, we haven\'t finished building it.',
      'about.val.2.title': 'Privacy First',
      'about.val.2.desc': 'Your data is yours. We never sell it, share it, or train on it.',
      'about.val.3.title': 'Latin America First',
      'about.val.3.desc': 'Built for the markets we know and love. Yape, Spanish, local culture.',
      'about.stat.1': 'Businesses Automated',
      'about.stat.2': 'Messages Processed',
      'about.stat.3': 'Orders Created',
      'about.stat.4': 'Uptime',

      // Contact
      'contact.tag': 'Get In Touch',
      'contact.title.1': 'Ready to transform',
      'contact.title.2': 'your business?',
      'contact.desc': 'Drop us a message and we\'ll get back to you within minutes — not days. Or better yet, just write to us directly on WhatsApp. That\'s kind of our thing.',
      'contact.wa': 'WhatsApp',
      'contact.form.title': 'Send us a message',
      'contact.form.subtitle': 'We\'ll respond on WhatsApp — it\'s faster that way.',
      'contact.form.name': 'Your Name',
      'contact.form.phone': 'WhatsApp Number',
      'contact.form.business': 'Business Name',
      'contact.form.message': 'What can we help with?',
      'contact.form.submit': 'Send Message',
      'contact.form.success': 'Message received!',
      'contact.form.success.desc': 'We\'ll reach out on WhatsApp shortly. Or start the conversation now:',
      'contact.form.success.link': 'Chat with Yaya on WhatsApp',

      // Final CTA
      'cta.title': 'Stop losing sales to slow replies.',
      'cta.desc': 'Every minute a customer waits is a sale you might lose. Let Yaya respond instantly, take orders automatically, and grow your revenue while you sleep.',
      'cta.button': 'Write to Yaya on WhatsApp — Let\'s Go!',
      'cta.sub': 'Free to start. No credit card needed. Setup in 10 minutes.',

      // Footer
      'footer.desc': 'AI-powered WhatsApp commerce automation for small businesses in Latin America.',
      'footer.product': 'Product',
      'footer.company': 'Company',
      'footer.connect': 'Connect',
      'footer.privacy': 'Privacy Policy',
      'footer.terms': 'Terms of Service',
      'footer.rights': '2026 Yaya. All rights reserved.',
      'footer.made': 'Made with love in Latin America.',

      // WhatsApp float
      'wa.tooltip': 'Chat with Yaya',
    },

    es: {
      'nav.features': 'Funciones',
      'nav.how': 'Como Funciona',
      'nav.pricing': 'Precios',
      'nav.about': 'Nosotros',
      'nav.contact': 'Contacto',
      'nav.cta': 'Habla con Yaya',

      'hero.badge': 'Automatizando 1,000+ Negocios',
      'hero.title.1': 'Tu WhatsApp.',
      'hero.title.2': 'Ahora una Maquina de Ventas con IA.',
      'hero.subtitle': 'Yaya transforma tu WhatsApp en un asistente de IA incansable que atiende clientes, toma pedidos, procesa pagos y gestiona todo tu negocio — las 24 horas del dia, los 7 dias de la semana.',
      'hero.cta.primary': 'Empieza Gratis en WhatsApp',
      'hero.cta.secondary': 'Ve Como Funciona',
      'hero.stat.1': 'Siempre Online',
      'hero.stat.2': 'Mas Ventas',
      'hero.stat.3': 'Tiempo de Respuesta',
      'hero.stat.4': 'Mensajes Perdidos',

      'social.label': 'La confianza de negocios en toda Latinoamerica',
      'social.1': 'Restaurantes',
      'social.2': 'Panaderias',
      'social.3': 'Tiendas',
      'social.4': 'Servicios',
      'social.5': 'E-Commerce',

      'features.tag': 'Funciones',
      'features.title.1': 'Todo lo que tu negocio necesita.',
      'features.title.2': 'Nada que no.',
      'features.subtitle': 'Desde el primer mensaje del cliente hasta la entrega final — Yaya lo maneja todo a traves de la app que tus clientes ya usan todos los dias.',
      'feat.1.title': 'Conversaciones con IA',
      'feat.1.desc': 'Tu asistente de IA personal entiende lenguaje natural, responde preguntas sobre productos y guia a los clientes en sus compras — en espanol, ingles o cualquier idioma.',
      'feat.2.title': 'Gestion de Pedidos Inteligente',
      'feat.2.desc': 'Pedidos creados automaticamente desde conversaciones. Stock en tiempo real. Actualizaciones de estado enviadas a clientes sin que muevas un dedo.',
      'feat.3.title': 'Integracion de Pagos',
      'feat.3.desc': 'Procesamiento de pagos Yape sin fricciones. Los clientes pagan, nuestro sistema auto-verifica, y los pedidos avanzan — sin verificacion manual.',
      'feat.4.title': 'Analiticas de Negocio',
      'feat.4.desc': 'Dashboards en tiempo real con tendencias de ventas, productos top, insights de clientes y metricas de ingresos. Sabe exactamente como va tu negocio.',
      'feat.5.title': 'Perfiles de Clientes',
      'feat.5.desc': 'Cada interaccion construye un perfil completo — historial de compras, preferencias, ubicacion e info de contacto. Conoce a tus clientes frecuentes como familia.',
      'feat.6.title': 'Catalogo de Productos',
      'feat.6.desc': 'Sube tus productos con fotos, categorias, precios y stock. Tu IA conoce todo tu catalogo y recomienda productos inteligentemente.',

      'how.tag': 'Como Funciona',
      'how.title.1': 'Tres pasos para poner',
      'how.title.2': 'tu negocio en piloto automatico.',
      'how.subtitle': 'Listo en menos de 10 minutos. Sin programar, sin apps que descargar, sin configuracion complicada.',
      'step.1.title': 'Conecta tu WhatsApp',
      'step.1.desc': 'Escanea un codigo QR desde tu dashboard y Yaya se conecta a tu numero de WhatsApp Business. Eso es todo — tu IA ya esta escuchando.',
      'step.2.title': 'Sube tu Catalogo',
      'step.2.desc': 'Agrega tus productos, pon precios y niveles de stock. Tu asistente de IA memoriza todo y se vuelve experto en tus productos.',
      'step.3.title': 'Mira las Ventas Llegar',
      'step.3.desc': 'Yaya maneja conversaciones, crea pedidos, procesa pagos y mantiene felices a tus clientes — mientras tu monitoreas todo desde tu dashboard.',

      'test.tag': 'Testimonios',
      'test.title.1': 'Amado por duenos de negocios',
      'test.title.2': 'que nunca miran atras.',
      'test.1.text': '"Antes de Yaya respondia mensajes de WhatsApp hasta las 2am. Ahora mi IA maneja todo y despierto con pedidos confirmados y pagados. Mis ventas se triplicaron el primer mes."',
      'test.2.text': '"La integracion de pagos con Yape es magia. Los clientes pagan, Yaya confirma automaticamente, y el pedido empieza a prepararse. Ya ni reviso mi celular."',
      'test.3.text': '"Vendo ropa online y Yaya maneja todas las preguntas de tallas, stock y creacion de pedidos. Es como tener un empleado de tiempo completo que nunca duerme y nunca se equivoca."',

      'price.tag': 'Precios',
      'price.title.1': 'Precios simples.',
      'price.title.2': 'Potencial ilimitado.',
      'price.subtitle': 'Empieza gratis. Escala cuando estes listo. Sin costos ocultos, sin sorpresas.',
      'price.popular': 'Mas Popular',
      'price.starter': 'Inicial',
      'price.starter.desc': 'Perfecto para probar Yaya y ver la magia',
      'price.growth': 'Crecimiento',
      'price.growth.desc': 'Para negocios listos para escalar en serio',
      'price.enterprise': 'Empresa',
      'price.enterprise.desc': 'Soluciones personalizadas para operaciones grandes',
      'price.period': '/mes',
      'price.custom': 'Personalizado',
      'price.cta.starter': 'Empieza Gratis',
      'price.cta.growth': 'Empieza a Crecer',
      'price.cta.enterprise': 'Contactar Ventas',
      'price.f.1': '100 mensajes IA/mes',
      'price.f.2': '1 numero de WhatsApp',
      'price.f.3': 'Catalogo (hasta 20 productos)',
      'price.f.4': 'Gestion basica de pedidos',
      'price.f.5': 'Perfiles de clientes',
      'price.f.6': 'Mensajes IA ilimitados',
      'price.f.7': 'Productos ilimitados',
      'price.f.8': 'Integracion de pagos Yape',
      'price.f.9': 'Dashboard completo de analiticas',
      'price.f.10': 'Comprension de imagenes y voz',
      'price.f.11': 'Soporte prioritario',
      'price.f.12': 'Todo lo de Crecimiento',
      'price.f.13': 'Multiples numeros de WhatsApp',
      'price.f.14': 'Entrenamiento IA personalizado',
      'price.f.15': 'Acceso a API',
      'price.f.16': 'Gerente de cuenta dedicado',
      'price.f.17': 'Opciones de marca blanca',

      'about.tag': 'Sobre Yaya',
      'about.title.1': 'Hecho por emprendedores,',
      'about.title.2': 'para emprendedores.',
      'about.p1': 'Creamos Yaya porque vimos a duenos de pequenos negocios en Latinoamerica ahogandose en mensajes de WhatsApp — respondiendo tarde, perdiendo pedidos y agotandose. No necesitaban otra herramienta SaaS complicada. Necesitaban algo que simplemente funcione, dentro de la app que ya usan.',
      'about.p2': 'Yaya es IA que habla tu idioma, entiende tu negocio y nunca duerme. Creemos que cada pequeno negocio merece el mismo nivel de automatizacion que las grandes empresas — sin el precio de gran empresa.',
      'about.val.1.title': 'Simple por Diseno',
      'about.val.1.desc': 'Si tu abuela no puede usarlo, no hemos terminado de construirlo.',
      'about.val.2.title': 'Privacidad Primero',
      'about.val.2.desc': 'Tus datos son tuyos. Nunca los vendemos, compartimos ni entrenamos con ellos.',
      'about.val.3.title': 'Latinoamerica Primero',
      'about.val.3.desc': 'Hecho para los mercados que conocemos y amamos. Yape, espanol, cultura local.',
      'about.stat.1': 'Negocios Automatizados',
      'about.stat.2': 'Mensajes Procesados',
      'about.stat.3': 'Pedidos Creados',
      'about.stat.4': 'Disponibilidad',

      'contact.tag': 'Contactanos',
      'contact.title.1': 'Listo para transformar',
      'contact.title.2': 'tu negocio?',
      'contact.desc': 'Envianos un mensaje y te respondemos en minutos — no en dias. O mejor aun, escribenos directo por WhatsApp. Es lo nuestro.',
      'contact.wa': 'WhatsApp',
      'contact.form.title': 'Envianos un mensaje',
      'contact.form.subtitle': 'Te respondemos por WhatsApp — es mas rapido.',
      'contact.form.name': 'Tu Nombre',
      'contact.form.phone': 'Numero de WhatsApp',
      'contact.form.business': 'Nombre del Negocio',
      'contact.form.message': 'En que te podemos ayudar?',
      'contact.form.submit': 'Enviar Mensaje',
      'contact.form.success': 'Mensaje recibido!',
      'contact.form.success.desc': 'Te contactamos por WhatsApp pronto. O inicia la conversacion ahora:',
      'contact.form.success.link': 'Habla con Yaya en WhatsApp',

      'cta.title': 'Deja de perder ventas por responder tarde.',
      'cta.desc': 'Cada minuto que un cliente espera es una venta que puedes perder. Deja que Yaya responda al instante, tome pedidos automaticamente y haga crecer tus ingresos mientras duermes.',
      'cta.button': 'Escribele a Yaya por WhatsApp — Vamos!',
      'cta.sub': 'Gratis para empezar. Sin tarjeta de credito. Listo en 10 minutos.',

      'footer.desc': 'Automatizacion de comercio por WhatsApp con IA para pequenos negocios en Latinoamerica.',
      'footer.product': 'Producto',
      'footer.company': 'Empresa',
      'footer.connect': 'Conecta',
      'footer.privacy': 'Politica de Privacidad',
      'footer.terms': 'Terminos de Servicio',
      'footer.rights': '2026 Yaya. Todos los derechos reservados.',
      'footer.made': 'Hecho con amor en Latinoamerica.',

      'wa.tooltip': 'Habla con Yaya',
    },

    pt: {
      'nav.features': 'Recursos',
      'nav.how': 'Como Funciona',
      'nav.pricing': 'Precos',
      'nav.about': 'Sobre',
      'nav.contact': 'Contato',
      'nav.cta': 'Fale com Yaya',

      'hero.badge': 'Automatizando 1.000+ Negocios',
      'hero.title.1': 'Seu WhatsApp.',
      'hero.title.2': 'Agora uma Maquina de Vendas com IA.',
      'hero.subtitle': 'Yaya transforma seu WhatsApp em um assistente de IA incansavel que atende clientes, recebe pedidos, processa pagamentos e gerencia todo o seu negocio — 24 horas por dia, 7 dias por semana.',
      'hero.cta.primary': 'Comece Gratis no WhatsApp',
      'hero.cta.secondary': 'Veja Como Funciona',
      'hero.stat.1': 'Sempre Online',
      'hero.stat.2': 'Mais Vendas',
      'hero.stat.3': 'Tempo de Resposta',
      'hero.stat.4': 'Mensagens Perdidas',

      'social.label': 'A confianca de negocios em toda a America Latina',
      'social.1': 'Restaurantes',
      'social.2': 'Padarias',
      'social.3': 'Lojas',
      'social.4': 'Prestadores de Servico',
      'social.5': 'E-Commerce',

      'features.tag': 'Recursos',
      'features.title.1': 'Tudo que seu negocio precisa.',
      'features.title.2': 'Nada que nao precisa.',
      'features.subtitle': 'Da primeira mensagem do cliente ate a entrega final — Yaya cuida de tudo pelo app que seus clientes ja usam todos os dias.',
      'feat.1.title': 'Conversas com IA',
      'feat.1.desc': 'Seu assistente pessoal de IA entende linguagem natural, responde perguntas sobre produtos e guia clientes nas compras — em portugues, espanhol, ingles ou qualquer idioma.',
      'feat.2.title': 'Gestao Inteligente de Pedidos',
      'feat.2.desc': 'Pedidos criados automaticamente a partir de conversas. Estoque monitorado em tempo real. Atualizacoes de status enviadas aos clientes sem voce mexer um dedo.',
      'feat.3.title': 'Integracao de Pagamentos',
      'feat.3.desc': 'Processamento de pagamentos Yape sem atrito. Clientes pagam, nosso sistema auto-verifica, e os pedidos avancam — sem verificacao manual.',
      'feat.4.title': 'Analiticas de Negocio',
      'feat.4.desc': 'Dashboards em tempo real com tendencias de vendas, produtos top, insights de clientes e metricas de receita. Saiba exatamente como seu negocio esta indo.',
      'feat.5.title': 'Perfis de Clientes',
      'feat.5.desc': 'Cada interacao constroi um perfil completo — historico de compras, preferencias, localizacao e contato. Conheca seus clientes frequentes como familia.',
      'feat.6.title': 'Catalogo de Produtos',
      'feat.6.desc': 'Suba seus produtos com fotos, categorias, precos e estoque. Sua IA conhece todo o catalogo e recomenda itens de forma inteligente.',

      'how.tag': 'Como Funciona',
      'how.title.1': 'Tres passos para colocar',
      'how.title.2': 'seu negocio no piloto automatico.',
      'how.subtitle': 'Pronto em menos de 10 minutos. Sem programacao, sem apps para baixar, sem configuracao complicada.',
      'step.1.title': 'Conecte seu WhatsApp',
      'step.1.desc': 'Escaneie um codigo QR no seu dashboard e Yaya se conecta ao seu numero WhatsApp Business. So isso — sua IA ja esta ouvindo.',
      'step.2.title': 'Suba seu Catalogo',
      'step.2.desc': 'Adicione seus produtos, defina precos e niveis de estoque. Seu assistente de IA memoriza tudo e se torna especialista nos seus produtos.',
      'step.3.title': 'Veja as Vendas Chegarem',
      'step.3.desc': 'Yaya cuida das conversas, cria pedidos, processa pagamentos e mantem seus clientes felizes — enquanto voce acompanha tudo pelo dashboard.',

      'test.tag': 'Depoimentos',
      'test.title.1': 'Amado por donos de negocios',
      'test.title.2': 'que nunca olham para tras.',
      'test.1.text': '"Antes do Yaya eu respondia mensagens no WhatsApp ate as 2h da manha. Agora minha IA cuida de tudo e acordo com pedidos confirmados e pagos. Minhas vendas triplicaram no primeiro mes."',
      'test.2.text': '"A integracao de pagamento com Yape e magica. Clientes pagam, Yaya confirma automaticamente, e o pedido comeca a ser preparado. Nem preciso mais olhar meu celular."',
      'test.3.text': '"Vendo roupas online e Yaya cuida de todas as perguntas sobre tamanhos, estoque e criacao de pedidos. E como ter um funcionario em tempo integral que nunca dorme e nunca erra."',

      'price.tag': 'Precos',
      'price.title.1': 'Precos simples.',
      'price.title.2': 'Potencial ilimitado.',
      'price.subtitle': 'Comece gratis. Escale quando estiver pronto. Sem taxas ocultas, sem surpresas.',
      'price.popular': 'Mais Popular',
      'price.starter': 'Inicial',
      'price.starter.desc': 'Perfeito para experimentar Yaya e ver a magia',
      'price.growth': 'Crescimento',
      'price.growth.desc': 'Para negocios prontos para escalar de verdade',
      'price.enterprise': 'Empresa',
      'price.enterprise.desc': 'Solucoes personalizadas para operacoes maiores',
      'price.period': '/mes',
      'price.custom': 'Personalizado',
      'price.cta.starter': 'Comece Gratis',
      'price.cta.growth': 'Comece a Crescer',
      'price.cta.enterprise': 'Falar com Vendas',
      'price.f.1': '100 mensagens IA/mes',
      'price.f.2': '1 numero de WhatsApp',
      'price.f.3': 'Catalogo (ate 20 produtos)',
      'price.f.4': 'Gestao basica de pedidos',
      'price.f.5': 'Perfis de clientes',
      'price.f.6': 'Mensagens IA ilimitadas',
      'price.f.7': 'Produtos ilimitados',
      'price.f.8': 'Integracao de pagamentos Yape',
      'price.f.9': 'Dashboard completo de analiticas',
      'price.f.10': 'Compreensao de imagens e voz',
      'price.f.11': 'Suporte prioritario',
      'price.f.12': 'Tudo do Crescimento',
      'price.f.13': 'Multiplos numeros de WhatsApp',
      'price.f.14': 'Treinamento IA personalizado',
      'price.f.15': 'Acesso a API',
      'price.f.16': 'Gerente de conta dedicado',
      'price.f.17': 'Opcoes de marca branca',

      'about.tag': 'Sobre Yaya',
      'about.title.1': 'Feito por empreendedores,',
      'about.title.2': 'para empreendedores.',
      'about.p1': 'Criamos Yaya porque vimos donos de pequenos negocios na America Latina se afogando em mensagens de WhatsApp — respondendo tarde, perdendo pedidos e se esgotando. Eles nao precisavam de outra ferramenta SaaS complicada. Precisavam de algo que simplesmente funciona, dentro do app que ja usam.',
      'about.p2': 'Yaya e IA que fala seu idioma, entende seu negocio e nunca dorme. Acreditamos que todo pequeno negocio merece o mesmo nivel de automacao que as grandes empresas — sem o preco de grande empresa.',
      'about.val.1.title': 'Simples por Design',
      'about.val.1.desc': 'Se sua avo nao consegue usar, nao terminamos de construir.',
      'about.val.2.title': 'Privacidade Primeiro',
      'about.val.2.desc': 'Seus dados sao seus. Nunca vendemos, compartilhamos ou treinamos com eles.',
      'about.val.3.title': 'America Latina Primeiro',
      'about.val.3.desc': 'Feito para os mercados que conhecemos e amamos. Yape, espanhol, cultura local.',
      'about.stat.1': 'Negocios Automatizados',
      'about.stat.2': 'Mensagens Processadas',
      'about.stat.3': 'Pedidos Criados',
      'about.stat.4': 'Disponibilidade',

      'contact.tag': 'Entre em Contato',
      'contact.title.1': 'Pronto para transformar',
      'contact.title.2': 'seu negocio?',
      'contact.desc': 'Envie uma mensagem e respondemos em minutos — nao em dias. Ou melhor ainda, escreva direto no WhatsApp. Essa e a nossa especialidade.',
      'contact.wa': 'WhatsApp',
      'contact.form.title': 'Envie uma mensagem',
      'contact.form.subtitle': 'Respondemos pelo WhatsApp — e mais rapido.',
      'contact.form.name': 'Seu Nome',
      'contact.form.phone': 'Numero de WhatsApp',
      'contact.form.business': 'Nome do Negocio',
      'contact.form.message': 'Como podemos ajudar?',
      'contact.form.submit': 'Enviar Mensagem',
      'contact.form.success': 'Mensagem recebida!',
      'contact.form.success.desc': 'Entraremos em contato pelo WhatsApp em breve. Ou inicie a conversa agora:',
      'contact.form.success.link': 'Fale com Yaya no WhatsApp',

      'cta.title': 'Pare de perder vendas por respostas lentas.',
      'cta.desc': 'Cada minuto que um cliente espera e uma venda que voce pode perder. Deixe Yaya responder instantaneamente, receber pedidos automaticamente e aumentar sua receita enquanto voce dorme.',
      'cta.button': 'Escreva para Yaya no WhatsApp — Vamos!',
      'cta.sub': 'Gratis para comecar. Sem cartao de credito. Pronto em 10 minutos.',

      'footer.desc': 'Automacao de comercio por WhatsApp com IA para pequenos negocios na America Latina.',
      'footer.product': 'Produto',
      'footer.company': 'Empresa',
      'footer.connect': 'Conecte',
      'footer.privacy': 'Politica de Privacidade',
      'footer.terms': 'Termos de Servico',
      'footer.rights': '2026 Yaya. Todos os direitos reservados.',
      'footer.made': 'Feito com amor na America Latina.',

      'wa.tooltip': 'Fale com Yaya',
    },
  };

  // ── Detect language: saved preference > browser locale > english ──
  function detectLanguage() {
    const saved = localStorage.getItem('yaya_lang');
    if (saved && T[saved]) return saved;

    const browserLang = (navigator.language || navigator.userLanguage || 'en').toLowerCase();
    if (browserLang.startsWith('es')) return 'es';
    if (browserLang.startsWith('pt')) return 'pt';
    return 'en';
  }

  let currentLang = detectLanguage();

  // ── Apply translations ──
  function applyLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('yaya_lang', lang);
    document.documentElement.lang = lang;

    const dict = T[lang] || T.en;
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (!dict[key]) return;

      // Handle elements with child HTML (like SVG icons) — only replace text nodes
      if (el.dataset.i18nAttr === 'placeholder') {
        el.placeholder = dict[key];
      } else if (el.dataset.i18nAttr === 'label') {
        el.setAttribute('aria-label', dict[key]);
      } else if (el.childElementCount > 0 && !el.dataset.i18nHtml) {
        // Find the text node and replace it
        for (const node of el.childNodes) {
          if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
            node.textContent = ' ' + dict[key];
            break;
          }
        }
        // If no text node found, try last text node
        if (!Array.from(el.childNodes).some(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim())) {
          el.append(' ' + dict[key]);
        }
      } else {
        el.textContent = dict[key];
      }
    });

    // Update lang selector active state
    document.querySelectorAll('.lang-option').forEach(opt => {
      opt.classList.toggle('active', opt.dataset.lang === lang);
    });

    // Update trigger label
    const langCurrent = document.querySelector('.lang-current');
    if (langCurrent) langCurrent.textContent = lang.toUpperCase();
  }

  // ── Initialize ──
  applyLanguage(currentLang);

  // ── Language selector click handler ──
  document.addEventListener('click', (e) => {
    const opt = e.target.closest('.lang-option');
    if (opt && opt.dataset.lang) {
      applyLanguage(opt.dataset.lang);
    }

    // Toggle dropdown
    const trigger = e.target.closest('.lang-selector-trigger');
    const dropdown = document.getElementById('langDropdown');
    if (trigger && dropdown) {
      dropdown.classList.toggle('open');
      e.stopPropagation();
    } else if (dropdown && !e.target.closest('.lang-dropdown')) {
      dropdown.classList.remove('open');
    }
  });

  // Expose for external use
  window.YayaI18n = { applyLanguage, currentLang: () => currentLang, translations: T };

})();
