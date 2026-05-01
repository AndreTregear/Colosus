# agente-pharmacy — Pharmacy Operations, Drug Safety & DIGEMID Compliance

## Description
WhatsApp-native pharmacy management skill for Peru's 30K+ boticas and farmacias — from single-owner neighborhood boticas to small chain pharmacies with 2-5 locations. Covers the critical industry-specific workflows that generic business tools cannot: drug interaction checking, DIGEMID controlled substance tracking, temperature/cold chain monitoring, EPS/insurance claims management, prescription archival, expiry-driven promotions, and pharmaceutical-specific inventory with lot numbers, expiry dates, and regulatory classification.

Patricia Vega — a botica owner in Trujillo — scored 52% PMF in Round 3 testing. Her most critical unmet needs were all pharma-specific: drug interaction warnings (Warfarina + Ibuprofeno scenarios), DIGEMID inspection compliance (controlled substance logs, temperature records), and EPS insurance claim tracking (amounts owed by Pacífico, Rímac, etc.). These workflows don't exist in any current skill and cannot be approximated by general business tools.

**Peru pharmacy market context (2024):**
- 30,000+ formal boticas and farmacias (DIGEMID registry)
- 60% are single-owner, single-location boticas
- Average monthly revenue: S/25,000-60,000 for independent boticas
- Controlled substances require physical libro de registro (DIGEMID mandated)
- Temperature logs for refrigerated medications (insulina, vacunas) required daily
- EPS (health insurance) reimbursement cycles: 30-90 days
- Generic vs brand competition: generics are 40-70% cheaper, margin 25-35% vs 15-20% for branded
- Top competitors: InkaFarma, MiFarma (Intercorp group) — chains with tech advantages
- Common insurance providers: EPS Pacífico, Rímac, Mapfre, Sanitas, La Positiva

## When to Use
- Pharmacist/owner checks for drug interactions ("¿puedo darle ibuprofeno si toma warfarina?", "interacción medicamentos")
- Customer asks about medication compatibility ("tomo enalapril, ¿puedo tomar naproxeno?")
- Owner needs to check or log controlled substance dispensation ("vendí 2 cajas de tramadol", "registro de controlados")
- Owner records daily temperature readings ("temperatura de refrigeradora: 4.2°C", "registro de temperatura")
- Owner prepares for DIGEMID inspection ("viene inspección DIGEMID", "checklist DIGEMID")
- Owner tracks EPS insurance claims ("¿cuánto me debe EPS Pacífico?", "cobranza de seguros")
- Owner submits or reconciles EPS claims ("facturé S/3,200 a Rímac el mes pasado")
- Owner identifies products near expiry for promotion ("¿qué se vence pronto?", "ofertas por vencer")
- Owner manages lot/batch tracking for recalls ("lote ABC123 de amoxicilina", "retiro de producto")
- Owner competes with InkaFarma on pricing ("InkaFarma vende atorvastatina a S/12, yo a S/18")
- Owner asks about pharmaceutical margin analysis ("¿cuál es mi margen en genéricos vs marca?")
- Prescription requires archival ("receta médica de Dr. Gutiérrez", "archivo de recetas")
- Customer asks about generic alternatives ("¿tiene genérico de losartán?", "alternativa más barata")
- Owner tracks lab/distributor visit schedules ("viene el visitador de Bayer el jueves")
- Customer with insurance presents a prescription ("paciente con seguro Rímac, receta de enalapril")
- Owner generates DIGEMID monthly controlled substance report
- Cold chain break detected (temperature out of range alert)
- Seasonal illness preparation ("temporada de gripe, ¿qué pido?")

## Target Users
- **Boticas independientes** (20K+) — Single-owner, 1 location, 500-2,000 SKUs, 1-3 staff. S/25K-40K monthly. The core user.
- **Mini-cadenas** (5K+) — 2-5 locations, owner-managed, 2,000-5,000 SKUs. S/40K-100K monthly per location.
- **Farmacias de barrio** (5K+) — Neighborhood pharmacies, slightly more formal, may have Químico Farmacéutico (QF) on staff.
- **Boticas de mercado** — Pharmacies inside or adjacent to markets, high foot traffic, competitive pricing pressure.

## Capabilities

### 1. Drug Interaction Checking
Built-in database of the 200 most common drug interactions relevant to Peru's pharmacy market. Not a replacement for professional medical judgment — always includes disclaimer.

**Severity Levels:**
- 🔴 **GRAVE (Contraindicado)** — Do NOT dispense together. Examples: Warfarina + Ibuprofeno (bleeding risk), Metformina + alcohol (lactic acidosis), Simvastatina + Gemfibrozilo (rhabdomyolysis)
- 🟡 **MODERADA (Precaución)** — Can dispense with warnings. Examples: Enalapril + Potasio (hyperkalemia), Omeprazol + Clopidogrel (reduced efficacy), Amoxicilina + anticonceptivos orales (reduced efficacy)
- 🟢 **LEVE (Informativa)** — Dispense normally, inform patient. Examples: Paracetamol + Cafeína (enhanced effect), Antiácidos + antibióticos (spacing needed)

**Interaction Check Flow:**
```
Owner: "Señora toma warfarina y quiere ibuprofeno"
Agente: "🔴 INTERACCIÓN GRAVE: Warfarina + Ibuprofeno
⚠️ Riesgo aumentado de sangrado gastrointestinal.
✅ Alternativa segura: Paracetamol (hasta 2g/día)
📋 Fuente: Vademécum farmacológico, BNF
⚠️ Esto NO reemplaza el criterio del Químico Farmacéutico."
```

**Common Interaction Pairs (top 50 for Peru):**
| Drug A | Drug B | Severity | Risk | Alternative |
|--------|--------|----------|------|-------------|
| Warfarina | AINEs (ibuprofeno, naproxeno, diclofenaco) | 🔴 GRAVE | Sangrado GI | Paracetamol |
| Metformina | Alcohol | 🔴 GRAVE | Acidosis láctica | Evitar alcohol |
| Enalapril/Losartán | AINE crónico | 🟡 MODERADA | Daño renal | Monitoreo, paracetamol |
| Simvastatina | Gemfibrozilo | 🔴 GRAVE | Rabdomiolisis | Fenofibrato |
| Omeprazol | Clopidogrel | 🟡 MODERADA | Menor eficacia antiagregante | Pantoprazol |
| Ciprofloxacino | Antiácidos (Al/Mg) | 🟡 MODERADA | Absorción reducida | Separar 2h |
| Fluoxetina | Tramadol | 🔴 GRAVE | Síndrome serotoninérgico | Consultar médico |
| Metronidazol | Alcohol | 🔴 GRAVE | Efecto antabuse (vómitos, taquicardia) | Evitar 48h post-tto |
| Amoxicilina | Anticonceptivos orales | 🟡 MODERADA | Posible menor eficacia | Método barrera adicional |
| Ketoconazol | Estatinas | 🟡 MODERADA | Riesgo muscular | Fluconazol alternativo |
| Litio | AINEs | 🔴 GRAVE | Toxicidad por litio | Paracetamol, monitoreo |
| Digoxina | Amiodarona | 🔴 GRAVE | Toxicidad digitálica | Reducir dosis digoxina 50% |
| Carbamazepina | Eritromicina | 🔴 GRAVE | Toxicidad por carbamazepina | Azitromicina |
| Fenitoína | Fluconazol | 🟡 MODERADA | Aumento niveles fenitoína | Monitoreo niveles |
| Teofilina | Ciprofloxacino | 🟡 MODERADA | Toxicidad teofilina | Azitromicina |
| Sildenafil | Nitratos | 🔴 GRAVE | Hipotensión severa | Contraindicado |
| Captopril | Espironolactona | 🟡 MODERADA | Hiperpotasemia | Monitoreo K+ |
| Clonazepam | Alcohol/opioides | 🔴 GRAVE | Depresión respiratoria | Evitar combinación |
| Diclofenaco | Aspirina | 🟡 MODERADA | Sangrado GI, menor efecto cardioprotector | Separar o alternativa |
| Insulina | Betabloqueadores | 🟡 MODERADA | Enmascara hipoglucemia | Monitoreo glucosa |

**Implementation:** Keyword-matching on drug names (including brand names common in Peru: Doloral=ibuprofeno, Dolo-Neurobión=diclofenaco+vitaminas B, etc.). Fuzzy matching for misspellings. Returns severity, risk description, alternative, and disclaimer.

### 2. DIGEMID Compliance Module

**Controlled Substance Register (Libro de Registro):**
- Log each dispensation: date, patient name (optional for some categories), prescribing doctor, CMP (Colegio Médico del Perú) number, medication, quantity, lot number
- Categories per DS 023-2001-SA:
  - **Estupefacientes (Schedule I):** Morphine, fentanyl, codeine (high dose). Prescription retained, special recipe format (receta especial)
  - **Psicotrópicos (Schedule II-IV):** Benzodiazepines (clonazepam, alprazolam, diazepam), tramadol, zolpidem. Regular prescription, retained copy
  - **Precursores:** Pseudoephedrine-containing products. ID required, quantity limits

```
Owner: "Vendí 2 cajas de tramadol 100mg, receta del Dr. García CMP 45678"
Agente: "✅ Registrado:
📋 Tramadol 100mg x 2 cajas
👨‍⚕️ Dr. García (CMP 45678)
📅 21/03/2026, 14:30
🔢 Stock restante: 8 cajas
📝 Recuerda: Retener copia de receta médica
📊 Este mes: 12 dispensaciones de tramadol (normal para tu volumen)"
```

**Temperature Log:**
- Daily temperature recording for refrigerated storage (2-8°C standard)
- Alert when out of range
- Monthly report generation for DIGEMID inspection
- Products affected: insulina, vacunas, supositorios, algunos antibióticos líquidos

```
Owner: "Temperatura hoy: 4.2°C"
Agente: "✅ Temperatura registrada: 4.2°C (8:00 AM)
🟢 Dentro de rango (2-8°C)
📊 Promedio esta semana: 4.0°C
💊 Productos refrigerados: 12 ítems (insulina NPH x 5, Humira x 2, vacunas x 5)
📋 Registro mensual: 21/31 días completados"
```

**DIGEMID Inspection Checklist:**
When owner mentions inspection preparation, provide the standard checklist:
- [ ] Libro de controlados actualizado (último registro < 24h)
- [ ] Registros de temperatura completos (sin gaps > 24h)
- [ ] Químico Farmacéutico presente (horario de QF visible)
- [ ] Recetas retenidas archivadas por fecha
- [ ] Productos vencidos separados y rotulados "NO VENDER"
- [ ] Certificado de funcionamiento vigente
- [ ] Protocolo de buenas prácticas de almacenamiento (BPA) visible
- [ ] Termómetro calibrado (certificado de calibración vigente)
- [ ] Señalización de áreas (despacho, almacén, refrigeración, cuarentena)
- [ ] Stock de estupefacientes/psicotrópicos coincide con libro de registro

### 3. EPS Insurance Claims Management

Track amounts owed by each insurance provider, submission dates, expected payment dates, and reconciliation.

**Supported EPS Providers:**
- EPS Pacífico (largest private)
- Rímac Seguros
- Mapfre
- Sanitas
- La Positiva
- ESSALUD (public, different workflow)

**Claims Flow:**
```
Owner: "Hoy despaché S/450 en recetas de Pacífico"
Agente: "✅ Registrado: S/450 — EPS Pacífico
📋 Acumulado Pacífico este mes: S/3,200
📅 Facturas pendientes:
  • Febrero: S/2,800 (vence cobro 15 abril) ⏰
  • Enero: S/2,100 (COBRADO ✅)
💰 Total por cobrar: S/6,000
💡 Tip: Pacífico paga en ciclos de 45-60 días. Factura antes del 25 del mes para entrar en el siguiente ciclo."
```

**Claims Aging Report:**
```
Owner: "¿Cuánto me deben los seguros?"
Agente: "📊 Cuentas por cobrar — EPS:
  🏥 Pacífico: S/3,200 (45 días) — ⚠️ Llamar si no paga antes del 15
  🏥 Rímac: S/1,800 (30 días) — En plazo normal
  🏥 Mapfre: S/600 (15 días) — Recién facturado
  💰 Total por cobrar: S/5,600
  📈 vs mes anterior: +S/800 (+16%)
  ⏰ Vencido (>60 días): S/0 ✅"
```

### 4. Pharmaceutical Inventory Extensions

Extends agente-inventory with pharmacy-specific fields:

**Per-Product Tracking:**
- **Lot number** (lote) — Required for recalls and DIGEMID compliance
- **Expiry date** (fecha de vencimiento) — Auto-alert at 90, 60, 30 days
- **Storage condition** — Ambiente (15-25°C), Refrigerado (2-8°C), Congelado (<-15°C)
- **Regulatory category** — OTC (venta libre), Con receta, Controlado (I-IV)
- **Generic name** (DCI — Denominación Común Internacional) + Brand name
- **Presentation** — Tabletas, cápsulas, jarabe, inyectable, crema, gotas
- **Laboratory** — Manufacturer (e.g., Medifarma, Farmindustria, Teva, Bayer)

**Expiry-Driven Promotions:**
```
Owner: "¿Qué se vence pronto?"
Agente: "📦 Productos próximos a vencer (siguiente 90 días):
  
  🔴 Vence en 30 días:
  • Amoxicilina 500mg (Medifarma) — Lote M2025-089 — Vence 20/04/2026 — Stock: 15 cajas — Costo: S/3.50 c/u
  • Vitamina C efervescente (Bayer) — Lote B2024-445 — Vence 15/04/2026 — Stock: 8 tubos — Costo: S/12 c/u
  
  🟡 Vence en 60 días:
  • Omeprazol 20mg (Lab Chile) — Lote LC2025-112 — Vence 18/05/2026 — Stock: 25 cajas — Costo: S/2.80 c/u
  
  💡 Sugerencia: Lanza oferta 2×1 en amoxicilina y vitamina C. Valor en riesgo: S/148.50
  📲 ¿Quieres que envíe oferta a tus clientes frecuentes por WhatsApp?"
```

**Recall/Batch Management:**
```
Owner: "DIGEMID sacó alerta sobre ibuprofeno lote X2025-033"
Agente: "🚨 ALERTA DE RETIRO DE PRODUCTO
  💊 Ibuprofeno 400mg
  🔢 Lote: X2025-033
  🔍 Revisando tu inventario...
  
  ⚠️ ENCONTRADO: 6 cajas en stock
  📦 Acción inmediata:
  1. Separar las 6 cajas del área de venta
  2. Etiquetar: 'PRODUCTO EN CUARENTENA - NO VENDER'
  3. Contactar distribuidor para devolución
  4. Registrar en libro de incidencias
  
  📋 ¿Vendiste de este lote? Revisando historial...
  • 3 dispensaciones encontradas este mes
  📲 ¿Quieres notificar a los clientes afectados?"
```

### 5. Prescription Management

**Prescription Archival:**
- Log prescription details: patient, doctor (CMP), medication, dosage, quantity, date
- Link to dispensation record
- Required retention: 1 year for regular Rx, 5 years for controlled substances
- Searchable by patient, doctor, date, medication

**Insurance Prescription Flow:**
```
Owner: "Paciente con seguro Rímac, receta de losartán 50mg + hidroclorotiazida 25mg"
Agente: "🏥 Dispensación con seguro:
  💊 Losartán 50mg x 30 tab — Genérico (Medifarma): S/8.50
  💊 Hidroclorotiazida 25mg x 30 tab — Genérico: S/3.20
  💰 Total: S/11.70
  
  🏥 Copago estimado (Rímac, plan básico):
  • Rímac cubre ~70% genéricos = S/8.19
  • Copago paciente: ~S/3.51
  
  📋 Para facturar a Rímac:
  1. Verificar vigencia de seguro (código afiliado)
  2. Sello y firma del QF en receta
  3. Copia de receta para archivo
  4. Agregar a lote de facturación Rímac del mes
  
  ⚠️ Copagos son estimados. Verificar tabla de coberturas vigente."
```

### 6. Competitive Pricing Intelligence

**InkaFarma/MiFarma Price Comparison:**
Track competitor pricing on key products to help independent pharmacies stay competitive.

```
Owner: "InkaFarma vende atorvastatina 20mg a S/12, yo la tengo a S/18"
Agente: "📊 Análisis competitivo — Atorvastatina 20mg:
  
  🏪 Tu precio: S/18.00
  🏬 InkaFarma: S/12.00 (-33%)
  
  💰 Tu costo: S/8.50 (margen actual: 53%)
  💰 A S/12: margen sería 29% (bajo pero viable para tráfico)
  
  💡 Estrategia recomendada:
  1. No igualar precio — InkaFarma compra volumen gigante
  2. Ofrecer genérico a S/14 (margen 39%, competitivo)
  3. Diferenciarte con servicio: 'Aquí te explico cómo tomar tu medicamento'
  4. Bundle: Atorvastatina + control de presión gratis = fidelización
  
  📈 Genéricos con mejor margen que atorvastatina:
  • Omeprazol: costo S/2.80, venta S/8 (64% margen)
  • Metformina: costo S/3, venta S/9 (67% margen)
  • Losartán: costo S/4, venta S/12 (67% margen)"
```

### 7. Seasonal Illness & Stock Planning

Pre-built seasonal patterns for Peru's pharmacy market:

| Season | Period | Key Products | Action |
|--------|--------|-------------|--------|
| Gripe/Resfriado | May-Aug (invierno) | Antigripales, Vitamina C, Paracetamol, descongestionantes | Stock up in April |
| Dengue | Jan-Apr (verano, costa norte) | Paracetamol (NO AINEs), rehidratación oral, repelentes | Alert: NO ibuprofeno para dengue |
| Alergias | Sep-Nov (primavera) | Loratadina, cetirizina, colirios, descongestionantes nasales | Stock up August |
| Gastro (fiestas) | Dec-Jan | Bismuto, loperamida, rehidratación oral, omeprazol | Post-fiestas bump |
| Escolar | Mar-Apr | Vitaminas infantiles, multivitamínicos, antiparasitarios | Back-to-school season |
| Friaje (sierra) | Jun-Jul | Antigripales, broncodilatadores, cremas humectantes | Altitude + cold = respiratory |

```
Owner: "Se viene temporada de gripe, ¿qué pido?"
Agente: "🤒 Preparación temporada gripe (May-Ago):
  
  📦 Stock recomendado (basado en tu historial + promedios):
  • Paracetamol 500mg: 50 cajas (+30% vs actual)
  • Antigripal (Day/Night): 30 cajas
  • Vitamina C 1g efervescente: 20 tubos
  • Amoxicilina 500mg: 25 cajas (complicaciones bacterianas)
  • Jarabe para tos (adulto + niño): 15 c/u
  • Descongestionante nasal: 20 frascos
  • Paños húmedos/termómetros: 10 c/u
  
  💰 Inversión estimada: S/1,200-1,500
  📈 Incremento esperado de ventas: 25-40% en estos productos
  📅 Pedir antes de: última semana de abril
  
  ⚠️ Recordatorio: En zona de dengue, NUNCA recomendar ibuprofeno/AINEs para fiebre sin diagnóstico confirmado. Paracetamol es la primera línea."
```

## Integration Points

| Skill/MCP | Integration |
|-----------|-------------|
| agente-inventory | Extends with lot numbers, expiry dates, storage conditions, regulatory category |
| agente-expenses | Purchase costs from distributors (Química Suiza, DECO, Alfaro) tracked as expenses |
| agente-suppliers | Distributor relationships, PO creation, lab rep visit scheduling |
| agente-crm | Patient records (chronic conditions, insurance provider, medication history) |
| whatsapp-mcp | EPS claim follow-ups, expiry promotions to frequent customers, recall notifications |
| agente-analytics | Margin analysis by product category (genérico vs marca vs dermocosmética) |
| agente-tax | SUNAT compliance for pharmacy (some products exento de IGV: medicamentos esenciales) |
| agente-fiados | Track customer credit (common for chronic medication patients who pay monthly) |
| agente-cash | Cash vs insurance vs Yape reconciliation |
| agente-forecast | Seasonal illness demand prediction, reorder point calculation |
| agente-escalation | Drug safety alerts, adverse reaction reporting, DIGEMID recall handling |

## Conversation Style

Pharmacies deal with health — the tone is **professional but warm, never dismissive**. Always include safety disclaimers when discussing drug interactions or medical advice. Use the formal "usted" when referring to patients but informal "tú" with the pharmacy owner.

**Always include:**
- "⚠️ Esto no reemplaza el criterio del Químico Farmacéutico" on drug interaction checks
- "📋 Consulte con su médico" when patients ask about changing medications
- Lot numbers and expiry dates on all inventory operations
- DIGEMID regulatory references when discussing controlled substances

**Never do:**
- Diagnose conditions or recommend treatments
- Override controlled substance regulations
- Skip safety disclaimers on drug interactions
- Dispense advice on prescription medications without mentioning the prescribing doctor

## Data Schema Extensions

```sql
-- Pharmacy-specific extensions to base schema

CREATE TABLE IF NOT EXISTS pharmacy_products (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id),
  generic_name TEXT NOT NULL,           -- DCI (Denominación Común Internacional)
  brand_name TEXT,
  laboratory TEXT,                       -- Manufacturer
  presentation TEXT,                     -- Tabletas, cápsulas, jarabe, etc.
  concentration TEXT,                    -- 500mg, 20mg/5ml, etc.
  regulatory_category TEXT NOT NULL DEFAULT 'otc',  -- otc, prescription, controlled_i, controlled_ii, controlled_iii, controlled_iv
  storage_condition TEXT DEFAULT 'ambiente',  -- ambiente, refrigerado, congelado
  requires_prescription BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pharmacy_lots (
  id SERIAL PRIMARY KEY,
  pharmacy_product_id INTEGER REFERENCES pharmacy_products(id),
  lot_number TEXT NOT NULL,
  expiry_date DATE NOT NULL,
  quantity_received INTEGER NOT NULL,
  quantity_remaining INTEGER NOT NULL,
  received_date DATE NOT NULL,
  supplier TEXT,
  cost_per_unit NUMERIC(10,2),
  status TEXT DEFAULT 'active',  -- active, quarantine, expired, recalled
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS controlled_substance_log (
  id SERIAL PRIMARY KEY,
  pharmacy_product_id INTEGER REFERENCES pharmacy_products(id),
  lot_id INTEGER REFERENCES pharmacy_lots(id),
  dispensation_date TIMESTAMPTZ NOT NULL,
  patient_name TEXT,
  patient_dni TEXT,
  prescribing_doctor TEXT NOT NULL,
  doctor_cmp TEXT NOT NULL,              -- Colegio Médico del Perú number
  quantity INTEGER NOT NULL,
  prescription_number TEXT,
  prescription_retained BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS temperature_log (
  id SERIAL PRIMARY KEY,
  reading_time TIMESTAMPTZ NOT NULL,
  temperature_celsius NUMERIC(4,1) NOT NULL,
  storage_unit TEXT DEFAULT 'refrigeradora_principal',
  in_range BOOLEAN NOT NULL,            -- calculated: 2.0-8.0°C for standard
  recorded_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS eps_claims (
  id SERIAL PRIMARY KEY,
  eps_provider TEXT NOT NULL,            -- pacifico, rimac, mapfre, sanitas, la_positiva, essalud
  claim_month TEXT NOT NULL,             -- YYYY-MM
  total_amount NUMERIC(10,2) NOT NULL,
  invoice_number TEXT,
  invoice_date DATE,
  expected_payment_date DATE,
  actual_payment_date DATE,
  status TEXT DEFAULT 'pending',         -- pending, submitted, paid, disputed, overdue
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS prescriptions (
  id SERIAL PRIMARY KEY,
  patient_name TEXT,
  patient_dni TEXT,
  doctor_name TEXT NOT NULL,
  doctor_cmp TEXT,
  specialty TEXT,
  medications JSONB NOT NULL,            -- [{name, dosage, quantity, instructions}]
  insurance_provider TEXT,
  dispensation_date TIMESTAMPTZ NOT NULL,
  prescription_image_url TEXT,
  retained BOOLEAN DEFAULT FALSE,
  retention_required_until DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS drug_interactions (
  id SERIAL PRIMARY KEY,
  drug_a TEXT NOT NULL,
  drug_b TEXT NOT NULL,
  severity TEXT NOT NULL,                -- grave, moderada, leve
  risk_description TEXT NOT NULL,
  alternative TEXT,
  source TEXT DEFAULT 'vademecum',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_pharmacy_lots_expiry ON pharmacy_lots(expiry_date) WHERE status = 'active';
CREATE INDEX idx_controlled_log_date ON controlled_substance_log(dispensation_date);
CREATE INDEX idx_temperature_log_time ON temperature_log(reading_time);
CREATE INDEX idx_eps_claims_status ON eps_claims(status, eps_provider);
CREATE INDEX idx_prescriptions_patient ON prescriptions(patient_dni);
```

## Example Conversations

### Drug Interaction Check
```
Patricia: "Señora viene con receta de enalapril y quiere comprar ibuprofeno para dolor de rodilla"
Agente: "🟡 INTERACCIÓN MODERADA: Enalapril + Ibuprofeno
⚠️ Uso prolongado de ibuprofeno puede reducir efecto del enalapril y afectar función renal.
💊 Para uso puntual (2-3 días): riesgo bajo, pero monitorear presión.
✅ Alternativa más segura: Paracetamol 500mg cada 8h
📋 Si el dolor persiste, sugerir consulta con médico para alternativa antiinflamatoria compatible.
⚠️ Esto no reemplaza el criterio del Químico Farmacéutico."
```

### Daily Temperature Log
```
Patricia: "Temperatura: 6.8°C"
Agente: "✅ Registrado: 6.8°C a las 8:15 AM
🟢 Dentro de rango (2-8°C) — pero en el límite superior
📊 Tendencia: 4.0 → 4.5 → 5.2 → 6.8 (subiendo)
⚠️ Ojo: la temperatura está subiendo. Verifica:
• ¿Abrieron la puerta mucho ayer?
• ¿El empaque de la puerta está bien?
• ¿Está muy llena la refrigeradora?
Si mañana sube a >8°C, hay que revisar el equipo.
💊 Productos en riesgo: Insulina NPH (5 unidades), Humira (2 unidades)"
```

### EPS Reconciliation
```
Patricia: "¿Cuánto me deben los seguros?"
Agente: "📊 Cuentas por cobrar — Seguros:
🏥 EPS Pacífico:
  • Febrero 2026: S/2,800 — Facturado 28/02 — Esperado ~15/04 ⏰
  • Marzo 2026: S/1,400 (parcial, mes en curso)
  
🏥 Rímac:
  • Febrero 2026: S/1,200 — Facturado 01/03 — Esperado ~20/04
  
🏥 Mapfre:
  • Febrero 2026: S/600 — ✅ PAGADO 10/03
  
💰 Total pendiente: S/6,000
💰 Cobrado este mes: S/600 (Mapfre)

💡 Pacífico tiene el monto más alto. ¿Quieres que te recuerde llamar el 10 de abril si no depositan?"
```

### DIGEMID Inspection Prep
```
Patricia: "Viene inspección DIGEMID la próxima semana 😰"
Agente: "📋 Checklist DIGEMID — Preparación:

✅ Completado:
• Registros de temperatura: 28/31 días este mes
• Libro de controlados: último registro hace 2 días

⚠️ Acción necesaria:
• ❌ 3 días sin temperatura registrada (5, 12, 18 marzo) — Registra 'no hubo apertura' o completa
• ❌ Verificar que TODAS las recetas retenidas estén archivadas por fecha
• ❌ Separar productos vencidos al área de cuarentena

📋 Checklist completo:
☐ QF presente durante horario declarado
☐ Certificado de funcionamiento vigente y visible
☐ Libro de controlados al día (sin espacios en blanco)
☐ Recetas retenidas organizadas por fecha
☐ Termómetro con certificado de calibración vigente
☐ Productos vencidos separados y rotulados
☐ Señalización de áreas completa
☐ BPA (Buenas Prácticas de Almacenamiento) visible
☐ Stock físico de controlados = stock en libro

💡 Tip: Los inspectores siempre revisan primero el libro de controlados y las temperaturas. Esos 2 documentos deben estar impecables.

¿Quieres que te ayude a completar los registros faltantes?"
```

## Regulatory References
- **DS 023-2001-SA** — Reglamento de Estupefacientes, Psicotrópicos y otras sustancias sujetas a fiscalización sanitaria
- **DS 014-2011-SA** — Reglamento de Establecimientos Farmacéuticos (updated by DS 015-2019-SA)
- **RM 585-99-SA/DM** — Manual de Buenas Prácticas de Almacenamiento
- **Ley 29459** — Ley de los Productos Farmacéuticos, Dispositivos Médicos y Productos Sanitarios
- **RM 013-2009-MINSA** — Listado de medicamentos esenciales (exentos de IGV)
- **DIGEMID circulares** — Periodic safety alerts and product recalls

## Metrics & Success Criteria
- Patricia Vega PMF target: 52% → 70%+ (from Round 3 baseline)
- Key scenario improvements:
  - Drug interaction check (S30): 5.0 → 8.0+ target
  - DIGEMID compliance (S14, S19): 3.5-5.5 → 7.0+ target
  - EPS claims (S09): 5.5 → 8.0+ target
  - Insurance dispensation (S10): 3.5 → 7.0+ target
  - Temperature logging (S07): 4.0 → 8.0+ target
  - Net profitability (S21): 8.7 → maintain (already strong from agente-expenses)
  - Competitive pricing (S08): 7.0 → 8.0+ target
