# Test Persona: Marcos Oliveira — TechMais

## Profile

| Field | Details |
|-------|---------|
| **Name** | Marcos Oliveira |
| **Age** | 46 |
| **Location** | Boa Viagem, Recife, PE, Brazil |
| **Business** | TechMais — Loja de eletrônicos (varejo + assistência técnica/reparo) |
| **Products & Prices** | **Varejo:** Fones Bluetooth ($89–$349), Capinhas/películas ($25–$79), Carregadores/cabos ($35–$129), Smartwatches ($199–$899), Caixas de som Bluetooth ($149–$599), Tablets usados recondicionados ($450–$1.200), Celulares usados recondicionados ($350–$1.800), Celulares novos ($899–$4.500), Acessórios diversos ($15–$200). **Assistência técnica:** Troca de tela celular ($150–$450 dependendo do modelo), Troca de bateria ($100–$250), Reparo de placa ($200–$600), Limpeza/manutenção notebook ($120), Formatação + backup ($80–$150), Diagnóstico ($50, abate do serviço se contratar) |
| **Team Size** | 4 (Marcos + 1 técnico de reparo + 1 vendedor balcão + 1 auxiliar/estoquista) |
| **Annual Revenue** | R$400.000/ano (~R$33K/mês, sendo ~60% varejo e ~40% assistência técnica) |
| **Sales Channels** | Loja física (70%), WhatsApp (20%), OLX/Marketplace (10%) |
| **Language/Dialect** | Português brasileiro, nordestino/recifense. Usa "oxe", "vixe", "meu rei", "mainha", "arretado", "é massa", "bicho". Sotaque pernambucano forte. |
| **Communication Style** | Experiente, prático, fala como comerciante de bairro. Conhece todo mundo pelo nome. Mistura de vendas e serviço. Direto, honesto, às vezes reclama dos fornecedores. |
| **Payment Methods** | Pix (45%), dinheiro (25%), cartão crédito/débito (30%). Parcela no cartão em até 6x para compras acima de R$300. Maquininha PagSeguro. |
| **Tax Info** | CNPJ ativo, Simples Nacional (Anexo I para comércio, Anexo III para serviços). Emite NFC-e (varejo) e NFS-e (serviços de reparo). ICMS sobre produtos, ISS sobre serviços. |

---

## Daily Tasks

1. Abrir a loja, ligar os expositores e conferir vitrine
2. Verificar aparelhos que entraram pra reparo — status de cada um e prazo
3. Atender clientes no balcão e WhatsApp (vendas + serviços)
4. Conferir se peças de reposição encomendadas chegaram (telas, baterias)
5. Fazer diagnóstico de aparelhos novos que chegaram pra assistência
6. Registrar vendas do dia e baixar do estoque
7. Cobrar e registrar pagamentos (Pix, dinheiro, cartão)
8. Responder anúncios na OLX/Marketplace (perguntas de interessados)
9. Avisar clientes por WhatsApp que o aparelho tá pronto pra retirar
10. Fechar caixa no fim do dia e conferir com registros

## Weekly Tasks

1. Analisar vendas da semana — varejo vs assistência técnica
2. Fazer pedido de peças de reposição (telas, baterias, conectores)
3. Atualizar anúncios na OLX/Marketplace com fotos e preços novos
4. Verificar aparelhos parados na assistência há mais de 7 dias — cobrar cliente
5. Conferir estoque de acessórios (capinhas, películas, cabos)
6. Calcular lucro bruto da semana
7. Revisar preços dos concorrentes (outras lojas da região)
8. Reunir com o técnico — aparelhos pendentes, peças necessárias
9. Postar no Instagram/WhatsApp Status ofertas da semana
10. Conciliar pagamentos recebidos com vendas e serviços registrados

## Monthly Tasks

1. Fechar faturamento do mês — separar NFC-e (comércio) e NFS-e (serviços)
2. Calcular e pagar DAS (Simples Nacional)
3. Enviar documentação pro contador
4. Inventário completo — contar todos os itens em estoque (novos e usados)
5. Análise de P&L: quanto entrou de varejo vs assistência, custos, margem
6. Avaliar quais produtos novos valem a pena trazer pro estoque
7. Negociar com fornecedores de peças — buscar melhores preços
8. Verificar aparelhos abandonados na assistência (sem retirada há 30+ dias)
9. Revisar tabela de preços de serviços conforme custo de peças
10. Planejar promoções e limpar estoque de produtos parados

---

## Pain Points

1. **Mistura de varejo e serviço complica a contabilidade** — TechMais vende produtos (ICMS, NFC-e) E presta serviços de reparo (ISS, NFS-e). São dois regimes tributários no mesmo negócio. O contador reclama todo mês.
2. **Estoque de usados/recondicionados é difícil de precificar** — cada celular usado tem condição diferente. Não tem tabela fixa. Marcos avalia "no olho" e às vezes erra pra mais ou pra menos.
3. **Controle de ordens de serviço é precário** — usa um cadernão pra anotar aparelhos que entram pra reparo. Às vezes perde informação, esquece prazo, e cliente reclama.
4. **Peças de reposição têm qualidade variável** — compra tela "original" do fornecedor e às vezes vem genérica. Precisa rastrear fornecedor/lote pra saber de quem reclamar.
5. **Clientes somem e abandonam aparelhos** — recebe aparelho pra reparo, faz diagnóstico, aprova orçamento, compra peça, e o cliente não volta. Fica com aparelho e peça encalhados.
6. **Fluxo de caixa apertado com muitos pagamentos em dinheiro** — 25% das vendas são em dinheiro, difícil rastrear. Às vezes o caixa não bate e não sabe se foi troco errado ou venda não registrada.

---

## Test Scenarios

### Core Business (Vendas e Assistência Técnica)

**1.** "Oxe meu rei, me diz aí quantos celulares usados eu tenho no estoque e quais modelos. Quero saber se tenho algum iPhone 13 pra um cliente que tá procurando"

**2.** "Vixe, entrou um Galaxy S23 pra trocar tela. Registra aí a ordem de serviço: cliente Seu Antônio, tel 81 99876-5432, tela trincada, orçamento R$380, prazo 3 dias úteis"

**3.** "Bicho, quantas ordens de serviço a gente tem abertas agora? E quantas tão atrasadas, tipo passaram do prazo que prometi pro cliente?"

**4.** "É massa, vendi hoje: 2 fones Bluetooth ($189 cada), 5 películas ($39 cada) e 1 carregador turbo ($89). Registra tudo aí, cliente pagou em dinheiro"

**5.** "Oxe, o Seu Carlos veio buscar o notebook dele que entrou pra formatação. Quanto era memo? E ele já pagou o diagnóstico de R$50?"

**6.** "Meu rei, me dá a lista de todos os aparelhos que tão prontos pra retirada. Preciso mandar WhatsApp pra essa galera vir buscar"

### Pricing & Payments

**7.** "Vixe, comprei um lote de 10 iPhones 12 usados por R$800 cada. Se eu vender a R$1.350 cada, qual meu lucro total? Lembra de tirar os 6% do Simples"

**8.** "Oxe, quanto entrou de dinheiro hoje no caixa? Quero conferir que o caixa tá batendo, bicho, ontem deu diferença de R$47"

**9.** "Meu rei, um cliente quer comprar um smartwatch de R$699 e parcelar em 6x no cartão. Quanto fica cada parcela? E quanto a PagSeguro me cobra de taxa?"

**10.** "É massa, me mostra o resumo de pagamentos da semana: Pix, dinheiro e cartão. Quero ver se o Pix tá crescendo memo ou é impressão minha"

**11.** "Vixe, um cliente quer trocar o celular velho dele como parte do pagamento de um novo. O dele é um Motorola G52, quanto dou de abatimento?"

### Invoicing (Nota Fiscal)

**12.** "Oxe meu rei, preciso emitir NFC-e de todas as vendas de hoje. Foram 8 vendas no varejo, me lista pra eu ir emitindo uma por uma"

**13.** "Bicho, tenho que emitir NFS-e do serviço de troca de tela do Galaxy S23 do Seu Antônio. Valor R$380, CPF dele é 123.456.789-01"

**14.** "Vixe, o contador tá reclamando que tô misturando NFC-e e NFS-e no relatório. Me separa o faturamento do mês em produto vs serviço?"

**15.** "Oxe, vendi um celular usado de R$1.350 mas o cliente não quer nota fiscal. Eu sou obrigado a emitir mesmo assim?"

### Analytics

**16.** "Meu rei, me diz qual é mais rentável: o varejo ou a assistência técnica? Quero receita e margem dos dois separado, do mês passado"

**17.** "É massa, quero ver o top 10 de produtos mais vendidos esse mês. Tô achando que película e capinha vende mais que tudo junto"

**18.** "Oxe, qual o tempo médio que um aparelho fica na assistência? Do dia que entra até o dia que o cliente busca. Quero melhorar isso"

**19.** "Vixe, bicho, me compara as vendas desse mês com o mês passado. E me diz se a assistência técnica tá crescendo ou caindo"

**20.** "Meu rei, qual o ticket médio das vendas no varejo vs o ticket médio dos serviços? Quero entender onde focar mais"

### Escalation

**21.** "OXEEE meu rei, um cliente tá aqui na loja reclamando alto que a tela que a gente trocou semana passada já tá com defeito! Preciso do registro da OS dele e saber qual peça usamos e de qual fornecedor"

**22.** "Vixe, bicho, acho que o estoquista tá sumindo com mercadoria. O estoque do sistema diz 15 películas e eu contei 9. Me puxa o histórico de movimentação dessas películas"

**23.** "Oxe, a prefeitura mandou fiscal aqui pedindo os últimos 3 meses de NFS-e e NFC-e. Preciso juntar tudo AGORA meu rei, o cara tá esperando"

### Edge Cases

**24.** "Meu rei, um cliente trouxe um celular pra reparo mas não tem nota fiscal do aparelho. Se eu abrir a ordem de serviço, fico com problema se for roubado?"

**25.** "Vixe, tenho 12 aparelhos abandonados na assistência há mais de 60 dias. Posso vender? Qual o processo legal pra isso?"

**26.** "Oxe bicho, um cliente comprou um fone de R$289 ontem e quer devolver hoje dizendo que não gostou. A caixa tá aberta. Sou obrigado a aceitar?"

**27.** "Meu rei, quero vender um combo: celular recondicionado + película + capinha + carregador por um preço fechado. Me ajuda a montar 3 combos com margens diferentes?"

**28.** "É massa, recebi proposta de um cara pra comprar 50 capinhas genéricas por R$8 cada e revender a R$39. Vale a pena? Quanto eu lucro no ano se vender 30 por mês?"

**29.** "Oxe, o técnico quer trabalhar como MEI em vez de CLT. Se ele virar MEI e eu contratar como PJ, quanto eu economizo? Mas tem risco?"

**30.** "Vixe meu rei, a internet da loja caiu e não consigo emitir nota fiscal nem passar cartão. Tenho 5 vendas pendentes. O que faço, anoto tudo no cadernão e emite depois?"
