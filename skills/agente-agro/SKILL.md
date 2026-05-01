# agente-agro — Agricultural Production, Export Compliance & Field Operations Management

## Description
WhatsApp-native agricultural operations management for Peru's 50K+ agro-export MYPEs and 200K+ small-to-medium agricultural producers. Covers the critical industry-specific workflows that generic business or artisan-production tools cannot address: per-hectare/per-parcel crop tracking, harvest campaign management with yield monitoring, SENASA phytosanitary certification workflows, GlobalGAP/HACCP compliance checklists, Drawback (3% FOB restitution) calculation and documentation tracking, cold chain logistics for perishable exports, weather-alert integration for frost/rain/pest risk, field crew (cuadrilla) management, agricultural input tracking (fertilizers/pesticides with application calendars), packing house quality grading, and multi-currency export contract management.

César Huanca — an agro-exporter in Ica producing grapes and asparagus — scored 56% PMF through Round 6 testing. His most critical unmet needs are all agriculture-specific: per-hectare production tracking (S01, S21), SENASA phytosanitary certification (S05), GlobalGAP audit compliance (S19, S27), Drawback documentation (S10, S14), cold chain monitoring for refrigerated containers (S04, S23), and weather/climate integration for frost alerts and irrigation (S24). These workflows don't exist in any current skill and cannot be approximated by general business tools or the artisan-focused agente-production.

**Peru agricultural export context (2024-2025):**
- Peru is #1 world exporter of grapes, blueberries, asparagus (fresh + canned), and quinoa
- Total agroexportation: US$ 10.5B+ (2023), 16% of total exports
- 2,743 registered agro-exporters — 72% are micro, small, or medium enterprises
- Key regions: Ica (47% of grape production), Piura (36%), La Libertad, Lambayeque, Arequipa
- Top products: uva de mesa (562K tons exported 2024-2025 campaign), arándanos, palta, espárrago, cítricos, mango, granada
- SENASA certifies places of production, packing plants, and export shipments via VUCE
- Drawback rate: 3% of FOB value, minimum US$ 500 per solicitud, max US$ 20M per subpartida/year
- Seasonal workforce: 200+ jornaleros during harvest, piece-rate and daily wages
- Cold chain: mandatory for most fruit exports — treatment of frío for uva, arándano, cítricos
- GlobalGAP: increasingly required by European/US buyers as market access condition
- SENASA phytosanitary certificate: S/43.20 per certificado + inspection fees via VUCE
- Mosca de la fruta: primary pest concern — control cultural reduces 80% of infestation
- Ventanas comerciales: grape campaign Oct-Apr, asparagus year-round, blueberry Jun-Nov, mango Nov-Mar

## When to Use
- Owner/manager asks about harvest progress ("¿cuántas toneladas hemos cosechado esta semana?", "¿cómo va la campaña?")
- Owner needs to track production by parcel/hectare ("fundo El Sol, parcela 3, rendimiento de uva")
- Owner asks about crop stages or phenological calendar ("¿en qué etapa está la uva?", "¿cuándo entra envero?")
- Owner needs SENASA certification workflow ("necesito certificado fitosanitario", "viene inspección SENASA")
- Owner prepares for GlobalGAP audit ("auditoría GlobalGAP la próxima semana", "checklist GlobalGAP")
- Owner calculates or tracks Drawback restitution ("¿cuánto me devuelven de drawback?", "solicitud SUNAT drawback")
- Owner manages export contracts ("contrato con Fresh Fruits LLC, 40 toneladas FOB USD 2.80")
- Owner books or tracks refrigerated container shipments ("booking contenedor reefer", "embarque Paracas")
- Owner asks about cold chain temperatures ("temperatura del contenedor", "tratamiento de frío")
- Owner asks about weather risks ("helada esta noche", "pronóstico para la cosecha", "lluvia en Ica")
- Owner manages field crew assignments ("cuadrilla de 50 jornaleros para parcela 3")
- Owner tracks agricultural inputs ("aplicación de fertilizante urea", "calendario de fumigación")
- Owner asks about pesticide compliance ("¿el pesticida está permitido por GlobalGAP?", "LMR para USA")
- Owner monitors quality grading at packing house ("calibre de uva hoy", "rechazo por calibre pequeño")
- Owner needs cost per hectare analysis ("costo por hectárea de uva este año")
- Owner compares campaigns year-over-year ("producción vs año pasado", "rendimiento por hectárea")
- Owner manages irrigation schedules ("riego parcela 5 hoy", "horas de riego esta semana")
- Owner receives quality rejection from destination ("contenedor rechazado en Rotterdam")
- Owner asks about export documentation ("guía de remisión", "DAM de exportación", "factura exportación")
- Owner tracks seasonal labor costs ("planilla jornaleros de la semana")
- A crop stage milestone is approaching (proactive alert)
- Weather alert triggers for frost, extreme heat, or unexpected rain

## Target Users
- **Agroexportadores MYPE** (5K-10K) — S/500K-5M/yr revenue, 50-500 hectares, seasonal workforce 50-500. The primary user. Ica, La Libertad, Piura, Lambayeque, Arequipa.
- **Agricultores medianos** (20K-30K) — S/100K-500K/yr, 5-50 hectares, local + export markets. May not export directly but sell to acopiadoras/empacadoras.
- **Cooperativas agrarias** (3K-5K) — Collective of small producers pooling for export. Coffee, cacao, quinoa, banana cooperatives. Cajamarca, San Martín, Junín, Piura.
- **Empacadoras/plants** (500+) — Packing house operations with quality grading, cold chain, SENASA certification. Often handle multiple producers' output.
- **Agricultores de mercado interno** (100K+) — Don't export but manage crop production. Partial fit: field tracking, input management, cost analysis useful. Lima, Arequipa, Junín, Cusco.

## Capabilities

### 1. Crop & Parcel Management (Gestión de Parcelas y Cultivos)
Per-hectare, per-parcel tracking of crop status across the farm. The fundamental unit of agricultural production — unlike manufacturing where the unit is a product, in agriculture the unit is a parcel of land producing a crop over a season.

**Parcel Registry:**
- Register parcels with: name/code, hectares, GPS coordinates (optional), soil type, irrigation system (goteo, gravedad, aspersión), current crop, crop variety, planting date, expected harvest window
- Example: "Parcela 3 — El Sol: 12 ha, uva Red Globe, goteo, plantada 2022, campaña Oct-Abr"
- Multiple crops per farm: "Tengo 30ha uva, 15ha espárrago, 5ha arándano"
- Track historical yields per parcel: "Parcela 3 rindió 22 ton/ha campaña pasada"

**Phenological Calendar (Calendario Fenológico):**
Built-in stage tracking for Peru's top export crops:

| Crop | Key Stages | Typical Duration | Key Decisions |
|------|------------|-----------------|---------------|
| **Uva de mesa** | Dormancia → Brotación → Floración → Cuaje → Envero → Maduración → Cosecha | Oct-Apr (6-7 months) | Poda (timing), raleo (thinning), aplicaciones foliares, fecha de corte |
| **Espárrago** | Cosecha continua → Descanso → Rebrote | Year-round (perenne) | Períodos de corte, renovación de corona, fertilización post-cosecha |
| **Arándano** | Dormancia → Floración → Cuaje → Maduración → Cosecha | Jun-Nov | Poda, polinización, cosecha escalonada |
| **Palta** | Floración → Cuaje → Desarrollo → Maduración → Cosecha | Mar-Sep | Riego crítico en cuaje, calibre control |
| **Mango** | Dormancia → Inducción floral → Floración → Cuaje → Maduración → Cosecha | Nov-Mar | Tratamiento de inducción, control mosca fruta |
| **Cítricos** | Floración → Cuaje → Crecimiento → Maduración → Cosecha | Abr-Oct | Raleo, calibre, color |

**Stage Tracking Flow:**
```
Owner: "La uva de parcela 3 ya está en envero"
Agente: "✅ Parcela 3 (Red Globe, 12 ha) — Actualizado: ENVERO
📅 Inicio envero: 21/03/2026
📊 Estimación cosecha: 3-4 semanas → 15-21 abril
🌡️ Cuidado: envero es sensible a golpes de calor (>38°C). Pronóstico Ica próxima semana: 30-34°C ✅
💊 Aplicación recomendada: potasio foliar para uniformizar color
📦 Ventana de embarque estimada: 20-30 abril. ¿Ya tienes booking de contenedor?"
```

**Yield Tracking:**
- Daily/weekly harvest recording: "Hoy cosechamos 8 toneladas de parcela 3"
- Running campaign total vs target: "Campaña: 180 ton comprometidas, 145 cosechadas (81%), faltan 35"
- Yield per hectare: "Parcela 3: 18 ton/ha (target: 22 ton/ha — 82%)"
- Year-over-year comparison: "Campaña 2025: 210 ton total, 21.5 ton/ha. Campaña 2026: 145 ton hasta ahora, proyección 195 ton (−7%)"

### 2. SENASA Phytosanitary Certification Workflow
Complete workflow management for Peru's export certification requirements. SENASA (Servicio Nacional de Sanidad Agraria) is the ONPF (Organización Nacional de Protección Fitosanitaria) that certifies all agricultural exports.

**Three-Level Certification Tracking:**

**A) Certificación de Lugar de Producción (Campo)**
- Registration: Producer code format: `XX-XXXXX-XX` (Región-Productor-Lugar de Producción)
- Required documents checklist:
  - ☐ Solicitud en VUCE (SNS-022)
  - ☐ Anexo 1.2: Manejo fitosanitario (registro de aplicaciones)
  - ☐ Anexo 1.2A: Aplicación de plaguicidas (químicos y biológicos)
  - ☐ Croquis del campo
  - ☐ Pago VUCE (varía según área)
- Inspection readiness: "Inspector SENASA evalúa 100 frutos/ramas de 60 puntos diferentes"
- Pest tolerance thresholds per Anexo 1.6
- Mosca de la fruta: trampeo semanal, control cultural (recojo de fruta caída), aplicaciones de cebo tóxico
- Status tracking: Solicitado → Inspección programada → Aprobado/Observado → Certificado emitido

**B) Certificación de Planta Empacadora**
- Required areas checklist:
  - ☐ Área de recepción de fruta
  - ☐ Área de selección y empaque
  - ☐ Área de tratamiento fitosanitario
  - ☐ Almacén de materiales de empaque
  - ☐ Oficina SENASA
  - ☐ Cámara de frío / almacén de producto terminado
  - ☐ Área de embarque
- Required certifications:
  - ☐ BPM (Buenas Prácticas de Manufactura)
  - ☐ Plan HACCP
  - ☐ POES (Procedimientos Operativos Estandarizados de Saneamiento)
  - ☐ Sistema de rastreabilidad
  - ☐ Certificados de calidad de agua
  - ☐ Calibración de equipos (termómetros, balanzas)

**C) Certificación de Envío (Certificado Fitosanitario de Exportación)**
- Per-shipment certification via VUCE
- Cost: S/43.20 (certificado) + S/72.00 (si inspección en instalación no certificada) + inspección fitosanitaria (varía por carga)
- Process: Solicitud VUCE → Pago → Inspector programa visita (3 días hábiles) → Inspección → Certificado (7 días hábiles)
- Certificación electrónica disponible con: Colombia, México, Chile, Países Bajos
- Required for each export shipment

**SENASA Checklist Flow:**
```
Owner: "Necesito sacar certificado fitosanitario para embarque de uva a USA"
Agente: "📋 Certificado Fitosanitario — Embarque uva a USA
Requisitos para USA (tratamiento de frío obligatorio):

✅ Lugar de producción certificado: Fundo El Sol (código 11-00234-03) — Vigente hasta 12/2026
✅ Planta empacadora certificada: Empacadora Valle Sur — Vigente hasta 06/2026
☐ Solicitud en VUCE — ¿La registro? Necesitas:
  - DAM de exportación (número)
  - Detalles del envío: variedades, peso, # cajas
  - Planta empacadora
  - Puerto de embarque (Paracas/Callao)
💰 Costos: S/43.20 certificado + inspección (~S/200 estimado para 1 contenedor)
⏰ Plazo: 7 días hábiles. Si embarque es el 5 abril → solicitar antes del 25 marzo
🌡️ USA requiere tratamiento de frío: 0-2°C por 16 días durante tránsito"
```

### 3. GlobalGAP & HACCP Compliance Management
Audit preparation and ongoing compliance tracking for international food safety certifications.

**GlobalGAP Checklist (Key Control Points for Fruits & Vegetables):**

**Module: All Farm Base (AF)**
- ☐ AF.1: Historial y gestión del sitio (registro de parcelas, rotación, uso previo del suelo)
- ☐ AF.2: Mantenimiento de registros y auto-inspección (≥1 auto-inspección/año)
- ☐ AF.3: Salud, seguridad y bienestar del trabajador (capacitaciones, EPP, botiquín, baños)
- ☐ AF.4: Subcontratistas (contratos con requisitos de cumplimiento)
- ☐ AF.5: Gestión de residuos y contaminantes (plan de manejo, reciclaje)
- ☐ AF.6: Medio ambiente y biodiversidad (plan de conservación)
- ☐ AF.7: Quejas y reclamaciones (libro de reclamaciones, procedimiento)
- ☐ AF.8: Procedimiento de retiro de producto (recall procedure)

**Module: Crops Base (CB)**
- ☐ CB.1: Rastreabilidad (del campo a la caja — código de productor SENASA)
- ☐ CB.2: Material de propagación (certificados de origen, registro sanitario)
- ☐ CB.3: Historial y manejo del suelo (análisis de suelo, plan de fertilización)
- ☐ CB.4: Fertilización (registro de aplicaciones, análisis de residuos, foliar)
- ☐ CB.5: Gestión del agua (análisis de agua, riego eficiente, registro de consumo)
- ☐ CB.6: Manejo Integrado de Plagas (MIP) — plan MIP, monitoreo, umbrales de acción
- ☐ CB.7: Productos fitosanitarios (registro de aplicaciones, LMR, período de carencia, equipos calibrados)
- ☐ CB.8: Equipos (mantenimiento, calibración de aspersores, EPP para aplicaciones)

**Module: Fruits & Vegetables (FV)**
- ☐ FV.1: Manejo del sitio (mapa de riesgos, evaluación de contaminación)
- ☐ FV.2: Manejo del suelo (cobertura, erosión)
- ☐ FV.3: Sustratos (si aplica — hidropónicos, berries)
- ☐ FV.4: Pre-cosecha (evaluación de residuos, período de carencia)
- ☐ FV.5: Cosecha (higiene, recipientes, transporte interno)
- ☐ FV.5.1: Manejo de producto (no contacto con suelo, sombra)

**Pesticide Compliance Check:**
- Cross-reference applied products against GlobalGAP Prohibited Pesticides list
- LMR (Límite Máximo de Residuos) by destination country:
  - USA: EPA tolerances (40 CFR 180)
  - EU: Regulation (EC) 396/2005
  - China: GB 2763
  - Japan: Positive List System
- "¿Puedo aplicar [pesticida] si exporto a [país]?" → checks allowed/prohibited status + LMR + período de carencia
- Period of carencia tracking: "Aplicaste imidacloprid hace 5 días. Período de carencia para uva (USA): 28 días. NO cosechar hasta el 18/04"

**Audit Readiness Score:**
```
Owner: "Auditoría GlobalGAP en 2 semanas, ¿cómo estamos?"
Agente: "📋 GlobalGAP Readiness Score: 78% (target: 95%)
✅ Completo (23/30 puntos de control mayor):
  - Rastreabilidad ✅, Registros fitosanitarios ✅, Análisis de agua ✅...
⚠️ Pendiente (5/30):
  - AF.3.2: Capacitación de primeros auxilios — último: hace 14 meses (requerido: anual)
  - CB.7.6: Calibración de aspersoras — sin registro este año
  - CB.4.2: Análisis de suelo — último: 2024 (requerido: cada 5 años ✅ pero recomendado: anual)
  - FV.5.1: Registro de temperatura de transporte interno — incompleto
  - AF.8: Simulacro de retiro de producto — no se ha hecho este año
🔴 Crítico (2/30):
  - CB.7.3: Registro de aplicaciones incompleto — faltan 3 aplicaciones de enero sin registrar
  - AF.3.1: Evaluación de riesgos laborales — NO existe documento
📅 Plan de acción: te envío tareas diarias para los próximos 14 días para llegar al 95%"
```

### 4. Drawback (Restitución de Derechos Arancelarios)
Complete Drawback calculation and documentation management. The single most impactful financial benefit for agro-exporters — 3% of FOB returned.

**Drawback Calculator:**
- Input: Export value FOB (US$), insumos importados (value CIF, DAM numbers)
- Output: Estimated restitution (3% × FOB), eligibility check, tope 50% costo de producción
- Minimum: US$ 500 per solicitud
- Maximum: US$ 20M per subpartida nacional per beneficiario per year
- Plazo: 180 días hábiles desde fecha de embarque

**Calculation Flow:**
```
Owner: "¿Cuánto me devuelven del embarque a USA? FOB 45,000 dólares"
Agente: "💰 Drawback estimado:
📊 Valor FOB: US$ 45,000
📊 Tasa: 3%
📊 Restitución estimada: US$ 1,350

Verificaciones:
✅ Monto > US$ 500 mínimo
✅ Subpartida 0806.10.00.00 (uva fresca): NO está en lista de exclusión
⚠️ Verificar: ¿Usaste insumos importados? (etiquetas, cajas, pesticidas importados)
⚠️ Verificar: ¿Valor CIF insumos < 50% del FOB? (CIF < US$ 22,500)
⚠️ Verificar: ¿Insumos nacionalizados con arancel pagado (no exonerados)?

📋 Documentos necesarios:
  - DAM de exportación (número de serie)
  - DAM de importación de insumos
  - Facturas de compra local de insumos importados (si aplica)
  - Declaración jurada de proveedor local (si compró a terceros)
  - Comprobantes de pago electrónicos
  - Guías de remisión electrónicas

⏰ Plazo para solicitar: 180 días hábiles desde embarque
💻 Trámite: SUNAT SOL → Operaciones de Comercio Exterior → Drawback → Solicitud de restitución
💰 Abono: 5 días hábiles si aprobación automática, o post-revisión documentaria"
```

**Drawback Tracking Dashboard:**
- Per-shipment tracking: Export → Drawback eligibility → Solicitud filed → Status (automática/revisión/aprobada/rechazada) → Abono
- Annual summary: "2026: 8 solicitudes, US$ 12,400 restituidos. 2 pendientes: US$ 3,200. Total FOB acogido: US$ 520,000 de US$ 20M límite"
- Alert: 180-day deadline approaching for unfiled solicitudes
- Proactive: "Embarque del 15 octubre cumple 180 días el 20 mayo. ¿Quieres que prepare la solicitud?"

### 5. Cold Chain & Refrigerated Container Management
Temperature monitoring and logistics for perishable agricultural exports.

**Cold Chain Protocols by Product:**
| Product | Transport Temp | Treatment | Duration | Destination Requirement |
|---------|---------------|-----------|----------|------------------------|
| Uva de mesa | 0-2°C | Tratamiento de frío | 16 días in-transit | USA: mandatory cold treatment |
| Arándano | 0-1°C | Tratamiento de frío | 16 días | USA/China: mandatory |
| Cítricos | 1-3°C | Tratamiento de frío | 16-18 días | USA: mandatory, varies by species |
| Palta | 5-7°C | Atmósfera controlada | 20-30 días | General: controlled atmosphere |
| Espárrago | 2-3°C | Hidroenfriamiento pre-pack | Rapid cooling | Critical: 2h post-harvest to cold |
| Mango | 8-10°C | Hidrotérmico (46.1°C, 75-90min) | Pre-export treatment | USA: mandatory hydrothermal |
| Granada | 5-7°C | Standard refrigeration | 3-4 weeks | No special treatment |

**Container Tracking:**
- Booking registration: carrier, vessel, container number, port (Paracas/Callao/Paita), ETD, ETA
- Temperature logging: "Temperatura contenedor MSKU1234567: 1.2°C (OK: 0-2°C)"
- Cold treatment timer: "Día 8 de 16 del tratamiento de frío. Temperatura promedio: 1.1°C ✅"
- Alert on deviation: "⚠️ Temperatura subió a 3.8°C en contenedor MSKU1234567 — fuera de rango para uva. Contactar naviera"
- Transit tracking: "Contenedor MSKU1234567: Paracas → Los Angeles. ETD: 5/04, ETA: 22/04. Tratamiento frío completado: Día 16/16 ✅"

**Container Prep Checklist:**
```
Owner: "Mañana cargo el contenedor de uva para USA"
Agente: "📦 Pre-carga checklist — Contenedor reefer para USA:
☐ Pre-cooling: encender contenedor 24h antes de carga (target: 0°C)
☐ Verificar limpieza interior (sin olores, sin residuos)
☐ Calibrar termómetro USDA (si aplica inspección en destino)
☐ Preparar pallets: 20 pallets × 120 cajas = 2,400 cajas (est. 18 ton neto)
☐ Sticker de trazabilidad en cada caja: código SENASA + lote + empacadora
☐ Generador de ozono/SO2 pads (si uva: prevención Botrytis)
☐ Registrador de temperatura continuo (datalogger) — activar antes de cerrar
☐ Fotos: interior vacío, primer pallet, contenedor lleno, sello de seguridad
☐ Sello de seguridad: anotar número de sello
☐ Documentos para inspector SENASA:
  - Guía de remisión de transporte
  - Certificado de lugar de producción
  - Certificado de planta empacadora
  - Solicitud de certificado fitosanitario (VUCE)
🌡️ Setpoint sugerido: 0°C (uva USA, tratamiento de frío in-transit)
⏰ Agendar: Inspector SENASA para certificación de envío"
```

### 6. Weather Integration & Climate Risk Management
Proactive weather alerts and agricultural decision support.

**Weather Monitoring:**
- Daily weather summary for farm location: temp max/min, humidity, precipitation, wind
- 7-day forecast with agricultural relevance
- Frost alerts: "🥶 ALERTA HELADA: Temperatura mínima pronosticada 2°C para mañana 5am en Ica. Tus uvas en envero son vulnerables. Acciones: riego nocturno, ventiladores (si disponible)"
- Heat wave alerts: "🔥 Ola de calor: 38°C pronosticado para martes-jueves. Riesgo de quemadura solar en uva. Recomendación: riego de enfriamiento (aspersión) entre 12-3pm"
- Rain alerts during harvest: "🌧️ Lluvia pronosticada para jueves (15mm). Si uva está lista, cosechar miércoles. Lluvia puede causar rajado de grano (cracking)"

**Pest Season Calendar:**
- Mosca de la fruta: Mayor riesgo Oct-Mar (temporada cálida). Intensificar trampeo y control cultural
- Botrytis (uva): Mayor riesgo con humedad >80% + lluvia. Aplicar fungicida preventivo
- Trips (espárrago): Monitoreo semanal, umbral de acción 5 trips/turión
- Cochinilla (cítricos): Mayor presión Ene-Abr

**Integration:**
- wttr.in or Open-Meteo API for location-specific forecasts
- Proactive daily morning alert during critical crop stages (floración, envero, cosecha)
- Historical weather data vs yield correlation: "Campaña pasada tuvo 3 heladas en noviembre → rendimiento cayó 12%. Este año: 0 heladas hasta ahora ✅"

### 7. Agricultural Input Management (Insumos Agrícolas)
Tracking of fertilizers, pesticides, herbicides, and other agricultural inputs with compliance-aware application recording.

**Application Registry (Cuaderno de Campo):**
Every application recorded with:
- Date, time, parcel, crop, crop stage
- Product (commercial name + active ingredient)
- Dose (ml/L, kg/ha, L/ha)
- Application method (foliar, drench, fertirrigación, aérea)
- Volume of water/solution applied
- Applicator name + PPE used
- Weather conditions at application
- Período de carencia (PHI — Pre-Harvest Interval) → auto-calculates "safe to harvest" date
- Período de reingreso (REI — Re-Entry Interval) → "workers can re-enter after X hours"

**Application Flow:**
```
Owner: "Aplicamos imidacloprid en parcela 3 hoy"
Agente: "📋 Aplicación registrada:
📅 Fecha: 21/03/2026, 9:00 AM
🌱 Parcela 3 — Uva Red Globe, 12 ha — Etapa: envero
💊 Producto: Confidor 350 SC (imidacloprid 350 g/L)
📏 Dosis: 0.5 L/ha → 6L total para 12 ha
🔧 Método: Foliar con aspersora
👷 Aplicador: [registrar nombre]

⚠️ Período de carencia (PHI):
  - USA: 28 días → NO cosechar antes del 18/04/2026
  - EU: 14 días → NO cosechar antes del 04/04/2026
  - Perú: 21 días → NO cosechar antes del 11/04/2026

⚠️ Período de reingreso (REI): 12 horas → trabajadores pueden reingresar mañana 22/03 a las 9am

⚠️ GlobalGAP: Imidacloprid está bajo revisión en EU (neonicotinoide). Algunos supermercados europeos lo rechazan incluso bajo LMR. Si exportas a EU, considerar alternativa: spirotetramat o flonicamid.

📊 LMR (Límite Máximo de Residuos):
  - USA: 1.0 mg/kg (uva)
  - EU: 0.5 mg/kg (uva) — más estricto
  - Japan: 5.0 mg/kg (uva)"
```

**Input Inventory:**
- Track stock of all agroquímicos: product, quantity, batch, expiry date, cost
- Usage per parcel per campaign: "Parcela 3 ha consumido: S/4,200 en fertilizantes, S/2,800 en fungicidas, S/1,200 en insecticidas = S/8,200 total insumos"
- Reorder alerts: "Te quedan 5L de Confidor — para 12 ha necesitas 6L por aplicación. ¿Pido al proveedor?"
- Integration: agente-suppliers for purchase tracking, agente-expenses for cost allocation

### 8. Packing House Quality Management
Quality grading at the packing house with rejection tracking and category-based analysis.

**Quality Grading (Calibre & Category):**

**Uva de mesa:**
| Calibre | Peso racimo | Categoría | Destino típico | Precio FOB |
|---------|-------------|-----------|----------------|------------|
| XL | > 500g | Extra/Cat I | USA, EU | $3.20-3.80/kg |
| L | 350-500g | Cat I | USA, EU, Asia | $2.80-3.20/kg |
| M | 250-350g | Cat I-II | México, Colombia, Chile | $2.20-2.80/kg |
| S | < 250g | Cat II | Mercado local, descarte | $0.80-1.50/kg |

**Quality Control Flow:**
```
Owner: "Hoy en empaque: 3 toneladas rechazadas, calibre pequeño"
Agente: "📊 Control de calidad — Empaque 21/03/2026:
Ingreso: 28 toneladas
✅ Exportación: 25 toneladas (89.3%)
  - XL: 8 ton (32%) — FOB $3.50/kg
  - L: 12 ton (48%) — FOB $2.90/kg
  - M: 5 ton (20%) — FOB $2.50/kg
❌ Rechazo: 3 toneladas (10.7%)
  - Calibre pequeño: 2 ton
  - Daño mecánico: 0.5 ton
  - Botrytis: 0.3 ton
  - Quemadura solar: 0.2 ton

💰 Valor exportable: US$ 74,800
💰 Valor descarte (mercado local): US$ 2,400
📉 Rechazo por calibre vs semana pasada: 10.7% vs 8.2% (+2.5pp)
⚠️ Calibre pequeño subiendo — ¿estrés hídrico en parcela? Revisar riego

📊 Acumulado campaña:
- Total procesado: 350 ton
- Exportación: 315 ton (90%)
- Rechazo: 35 ton (10%)
- Valor FOB total: US$ 945,000"
```

### 9. Export Contract & Shipment Management
Track contracts from negotiation to delivery with multi-currency support.

**Contract Registry:**
- Client (via CRM), product, variety, volume (tons), price (FOB/CIF/CFR), Incoterm
- Ship window (ventana de embarque): dates, port, destination
- Payment terms: advance, CAD, LC, open account, days
- Quality specifications: calibre, brix, color, pesticide residue limits
- Certifications required: GlobalGAP, BRC, HACCP, organic

**Contract Tracking:**
```
Owner: "Tengo contrato con Fresh Fruits LLC: 40 toneladas uva Red Globe, FOB $2.80/kg, embarque Paracas, ventana 1-15 abril"
Agente: "📋 Contrato registrado:
🏢 Cliente: Fresh Fruits LLC (USA) 
🍇 Producto: Uva Red Globe, 40 toneladas
💰 Precio: FOB USD 2.80/kg = US$ 112,000 total
🚢 Puerto: Paracas
📅 Ventana: 1-15 abril 2026
💵 Pago: [indicar condiciones]

📊 Status de cumplimiento:
- Cosechado para este contrato: 28 ton (70%)
- Empacado (calibre exportable): 25 ton (62.5%)
- Faltan: 15 ton en 11 días
- Al ritmo actual (2.5 ton/día procesado): completado ~6 abril ✅

📋 Documentación:
☐ Booking naviera (solicitar con carrier)
☐ SENASA certificado fitosanitario
☐ Factura comercial exportación
☐ Packing list
☐ BL (Bill of Lading)
☐ Certificado de origen (si aplica preferencia arancelaria)
☐ DAM de exportación (SUNAT)

💰 Drawback estimado: US$ 3,360 (3% × US$ 112,000)"
```

### 10. Harvest Campaign Dashboard
Integrated view of the entire campaign: production, quality, contracts, finances.

**Campaign Overview:**
```
Owner: "¿Cómo va la campaña?"
Agente: "📊 CAMPAÑA UVA 2025-2026 — Fundo El Sol (Ica)

🌱 Producción:
- Área: 30 hectáreas (5 parcelas)
- Cosechado: 580 toneladas (77% del estimado 750 ton)
- Rendimiento promedio: 19.3 ton/ha (target: 25 ton/ha — 77%)
- Parcela estrella: P2 (23 ton/ha) | Parcela débil: P5 (15 ton/ha)

📦 Empaque:
- Procesado: 560 toneladas
- Exportación: 504 ton (90% aprovechamiento)
- Rechazo: 56 ton (10%) — mercado local S/84,000
- Calibre promedio: 65% XL/L, 25% M, 10% rechazo

🚢 Embarques:
- Completados: 5 contenedores (150 ton) → USA (3), EU (2)
- En tránsito: 2 contenedores (60 ton) → USA (1), UK (1)
- Pendientes: 3 contratos (130 ton) → ventanas abril
- Próximo embarque: 28 marzo (Fresh Fruits LLC, 40 ton)

💰 Financiero:
- Facturado FOB: US$ 450,000
- Cobrado: US$ 280,000
- Por cobrar: US$ 170,000 (30-60 días)
- Drawback recibido: US$ 8,400 | Pendiente: US$ 5,100
- Costos campaña: US$ 285,000 (insumos $80K, jornaleros $120K, empaque $45K, logística $40K)
- Margen estimado: 37%

🌤️ Clima: Ica — próxima semana: 28-32°C, sin lluvia ✅
📋 SENASA: 2 envíos pendientes de certificación
📋 GlobalGAP: Auditoría anual en 6 semanas

🔔 Alertas:
- Contrato Fresh Fruits LLC: faltan 15 ton, ventana cierra 15/04
- Drawback embarque 15/10/2025: cumple 180 días el 20/05/2026 — solicitar antes
- Parcela 5 bajo rendimiento: revisar programa de fertilización"
```

### 11. Field Crew Management (Cuadrillas)
Seasonal workforce management for harvest and field operations.

**Crew Tracking:**
- Register cuadrillas: crew leader (capataz), number of workers, assigned parcels
- Daily attendance: "Hoy vinieron 48 de 52 jornaleros"
- Task assignment: cosecha, raleo, poda, aplicación, deshierbo, empaque
- Piece-rate tracking: "Cuadrilla de Juan: 3.2 toneladas hoy × S/80/tonelada = S/256 para 8 personas = S/32 cada uno"
- Daily wage tracking: "45 jornaleros × S/50/día + 8 mujeres selección × S/45/día = S/2,610 hoy"
- Integration: agente-payroll for weekly/monthly payroll, agente-expenses for labor cost allocation per parcel

**Safety & Compliance:**
- SUNAFIL inspection readiness: ☐ Contratos, ☐ Planilla, ☐ SCTR, ☐ EPP, ☐ Capacitaciones
- Heat stress protocol: "Temperatura >35°C — pausa de 15 min cada 2 horas, agua disponible en campo"
- Pesticide re-entry tracking: "Parcela 3 aplicada ayer — reingreso permitido a partir de hoy 9am"

### 12. Irrigation Management
Water management tracking for efficient agricultural production.

**Irrigation Registry:**
- Per-parcel: hours of irrigation, volume (m³), method (goteo/aspersión/gravedad)
- Schedule templates: "Parcela 3 (uva envero): riego 4h/día, lunes-miércoles-viernes"
- Water consumption tracking: "Esta semana: 12,000 m³ total. Parcela 3: 4,800 m³ (40%)"
- Critical stage alerts: "Uva en cuaje necesita riego constante — no reducir ahora"
- Water stress detection: "Rendimiento bajo en parcela 5 puede ser estrés hídrico. ¿Cuántas horas de riego tiene?"
- Integration: weather data for evapotranspiración estimation and irrigation adjustment

## Voice & Language
- Peruvian agricultural Spanish: "campaña" (not "temporada"), "parcela" (not "lote"), "jornaleo", "cuadrilla", "calibre", "envero", "cuaje"
- Technical but accessible: agronomist-level terms explained in simple language when needed
- Voice note support: Owner sends audio from the field — parsed into structured data
- Multi-unit: tons, hectares, kg/ha, cajas (boxes, typically 8.2kg for grapes), pallets, contenedores
- Currency: PEN for local costs, USD for FOB exports, auto-conversion via forex-mcp

## Integration Points
- **agente-expenses** — Cost tracking per parcel, per campaign. Purchases of insumos, fuel, services
- **agente-suppliers** — Agroquímico suppliers, distributor management, price comparison
- **agente-payroll** — Seasonal worker payroll, SUNAFIL compliance, SCTR tracking
- **agente-production** — Partial overlap: export contracts as production orders (enhanced by agente-agro with agricultural context)
- **agente-logistics** — Shipment tracking, carrier comparison (maritime focus for agro-export)
- **agente-quotes** — FOB/CIF/CFR cotizaciones for export clients
- **agente-tax** — IGV recovery for exporters (saldo a favor del exportador), Drawback interaction
- **agente-forecast** — Demand planning by market/season, campaign projections
- **agente-credit** — B2B credit for export clients (30-60-90 day payment terms common)
- **agente-analytics** — Campaign analytics, yield trends, cost evolution, profitability by parcel/product
- **agente-cash** — Cash management for daily field expenses (jornaleros paid in cash weekly)
- **agente-commissions** — Crew leader commissions, broker fees
- **forex-mcp** — Multi-currency conversion for export pricing
- **crm-mcp** — Import buyers, brokers, freight forwarders as CRM contacts
- **whatsapp-mcp** — Field updates from capataces, buyer communication, SENASA coordination

## Proactive Behaviors
1. **Morning brief** (during campaign): Weather + harvest plan + pending tasks for the day
2. **Frost/heat alerts**: Push notification if extreme weather forecasted
3. **Carencia countdown**: "Parcela 3: OK to harvest in 3 days (imidacloprid PHI)"
4. **Embarque countdown**: "Contrato Fresh Fruits: embarque in 5 days, 15 ton still needed"
5. **Drawback deadline**: "Solicitud de drawback para embarque de octubre vence en 30 days"
6. **GlobalGAP audit prep**: Daily task list leading up to audit date
7. **SENASA certificate reminders**: When certification is expiring or needed for upcoming shipment
8. **Quality trend alerts**: "Rechazo subiendo 3 semanas consecutivas — revisar parcela/riego/plagas"
9. **Campaign milestone**: "¡Llegaste a 500 toneladas! (67% del target)"
10. **Cost per hectare warning**: "Costo parcela 5 es S/18,000/ha vs promedio S/14,000. Revisar insumos"

## Limitations
- Weather data comes from public APIs (wttr.in, Open-Meteo) — not hyperlocal station data
- Pesticide LMR database covers top 50 products × top 10 destinations. Edge cases may need manual verification
- SENASA certification process requires physical inspection — Agente manages the workflow but can't replace the inspector
- Drawback calculation is estimated — SUNAT makes the final determination
- Container temperature is logged manually unless IoT sensor integration is available
- GlobalGAP audit is conducted by a certification body — Agente helps prepare but doesn't certify
- No direct integration with VUCE (SUNAT trade portal) — workflow guidance only
- Soil/plant tissue analysis requires lab results entered manually

## Data Model
```
Parcel: { name, code, hectares, gps, soil_type, irrigation, crop, variety, planting_date, status, current_stage }
Campaign: { year, crop, total_hectares, target_yield, start_date, end_date, status }
HarvestRecord: { date, parcel, tons, crew, quality_grade, notes }
Application: { date, parcel, product, active_ingredient, dose, method, applicator, weather, phi_days, rei_hours }
ExportContract: { client, product, volume, price_fob, incoterm, port, ship_window, payment_terms, certifications }
Shipment: { contract, container_number, carrier, vessel, port_origin, port_destination, etd, eta, temp_setpoint, treatment_type, status }
QualityRecord: { date, total_tons, export_tons, reject_tons, calibre_breakdown, reject_reasons }
DrawbackSolicitud: { dam_export, fob_value, insumos_cif, estimated_restitution, filing_date, deadline, status }
SENASACert: { type (campo/empacadora/envio), code, expiry, status, observations }
GlobalGAPChecklist: { module, control_point, status, evidence, last_updated }
WeatherAlert: { date, type (frost/heat/rain), severity, parcels_affected, actions_taken }
IrrigationRecord: { date, parcel, hours, volume_m3, method, notes }
CrewDay: { date, cuadrilla, workers_present, task, parcel, output, payment_type, amount }
```
