// The paid course: "De Cero a la Libertad Financiera".
//
// Everything a reader is told about the course lives here, and nothing about
// how it is laid out: scripts/generate-course-page.mjs renders the landing page
// from it, scripts/course-promo.mjs renders the card the rest of the site uses
// to point at that page, and both read the price, the coupon and the checkout
// links from this one table. A price typed into two generators is a price that
// is eventually wrong on one of them, and on a page an ad sends paying traffic
// to that is not a typo, it is a complaint.
//
// The course is recorded in Spanish and carries subtitles in Spanish,
// Portuguese and English, which is why it is offered on all three editions of
// the site rather than on the Spanish one only. Each edition says so plainly,
// near the price, so nobody buys a Spanish course believing it is in English.
//
// The curriculum is written in all three languages so that an English or
// Portuguese reader can judge what they would be buying. The lesson titles on
// the Spanish page are the titles of the videos as published on Hotmart.

/** Hotmart's three addresses for the product. */
export const COURSE_LINKS = {
  // The checkout. Every "buy" button on the site goes here.
  checkout: 'https://pay.hotmart.com/P107912638D',
  // Hotmart's own sales page and product page, kept for reference.
  salesPage: 'https://go.hotmart.com/P107912638D',
  productPage: 'https://go.hotmart.com/P107912638D?dp=1'
};

/**
 * The price, in the one currency Hotmart charges it in.
 *
 * `amount` is what goes into the structured data; `display` is what a reader
 * sees, written per language because "24,90 €" and "€24.90" are both correct and
 * belong to different readers.
 */
export const COURSE_PRICE = {
  amount: 24.9,
  currency: 'EUR',
  display: { es: '24,90 €', en: '€24.90', pt: '24,90 €' }
};

/**
 * The launch coupon: half price for the first ten students.
 *
 * `offDiscount` is the query parameter Hotmart's checkout reads to apply a
 * coupon on arrival, so the coupon button lands on a checkout with the discount
 * already in place; the code is also printed, for the reader who types it.
 * Set COURSE_COUPON to null when the ten places are gone and every mention of
 * it disappears from the site in one build.
 */
export const COURSE_COUPON = {
  code: 'PRIMEROS10',
  percent: 50,
  seats: 10,
  display: { es: '12,45 €', en: '€12.45', pt: '12,45 €' }
};

export function checkoutUrl({ coupon = false } = {}) {
  if (!coupon || !COURSE_COUPON) return COURSE_LINKS.checkout;
  return `${COURSE_LINKS.checkout}?offDiscount=${encodeURIComponent(COURSE_COUPON.code)}`;
}

/** The course image, as published under /assets/course/. */
export const COURSE_IMAGE = '/assets/course/de-cero-a-la-libertad-financiera.jpg';

/**
 * The six core modules and the additional one. `min`/`max` are each lesson's
 * running time in minutes; the page adds them up rather than stating a total
 * that the next lesson would make wrong.
 *
 * The additional module (`additional: true`) is sold separately, at a price
 * the student sees inside the course on Hotmart. The site deliberately does
 * not print that price - and so must never describe the module as included:
 * it is left out of every count, total and piece of structured data that
 * describes what the course price buys.
 */
export const COURSE_MODULES = [
  {
    id: 'm1',
    number: '1',
    es: { title: 'Psicología del Dinero y Mentalidad', goal: 'Dominar la psicología personal antes de tocar los mercados.' },
    en: { title: 'Money Psychology and Mindset', goal: 'Master your own psychology before you touch the markets.' },
    pt: { title: 'Psicologia do Dinheiro e Mentalidade', goal: 'Dominar a psicologia pessoal antes de tocar nos mercados.' },
    lessons: [
      {
        min: 3, max: 4,
        es: ['Lo que la escuela no te enseñó sobre el dinero', 'La diferencia entre estudiar economía y gestionar tus finanzas cotidianas; el dinero como herramienta para comprar tiempo y libertad.'],
        en: ['What school never taught you about money', 'Studying economics versus running your everyday finances; money as a tool for buying time and freedom.'],
        pt: ['O que a escola não te ensinou sobre dinheiro', 'A diferença entre estudar economia e gerir as finanças do dia a dia; o dinheiro como ferramenta para comprar tempo e liberdade.']
      },
      {
        min: 4, max: 5,
        es: ['Tu cerebro contra tu cartera: los sesgos biológicos', 'Por qué perder un 5 % duele el doble de lo que alegra ganarlo (aversión a la pérdida) y el peligro del pensamiento lineal frente al exponencial.'],
        en: ['Your brain versus your wallet: biological biases', 'Why losing 5% hurts twice as much as gaining it feels good (loss aversion), and the danger of linear thinking in an exponential world.'],
        pt: ['O seu cérebro contra a sua carteira: os vieses biológicos', 'Porque perder 5% dói o dobro do que alegra ganhar (aversão à perda) e o perigo do pensamento linear face ao exponencial.']
      },
      {
        min: 3, max: 4,
        es: ['El precio medido en «horas de vida»', 'Calcula tu salario neto por hora para evaluar cada compra en tiempo de trabajo real, no en euros.'],
        en: ['Prices measured in "hours of life"', 'Work out your net hourly wage and judge every purchase in real working time instead of in euros.'],
        pt: ['O preço medido em «horas de vida»', 'Calcule o seu salário líquido por hora para avaliar cada compra em tempo de trabalho real, e não em euros.']
      },
      {
        min: 4, max: 5,
        es: ['La falacia del market timing', 'Por qué intentar adivinar techos y suelos destruye la rentabilidad, y la importancia de mantenerse invertido a largo plazo.'],
        en: ['The market-timing fallacy', 'Why trying to call tops and bottoms destroys returns, and why staying invested for the long run matters.'],
        pt: ['A falácia do market timing', 'Porque tentar adivinhar topos e fundos destrói a rentabilidade, e a importância de se manter investido no longo prazo.']
      }
    ]
  },
  {
    id: 'm2',
    number: '2',
    es: { title: 'El «Sistema Operativo»: hábitos y control de gastos', goal: 'Construir la base de ahorro e higiene financiera sin renunciar al bienestar.' },
    en: { title: 'Your Financial "Operating System": Habits and Spending', goal: 'Build the savings base and financial hygiene without giving up a good life.' },
    pt: { title: 'O «Sistema Operativo»: hábitos e controlo de gastos', goal: 'Construir a base de poupança e higiene financeira sem abdicar do bem-estar.' },
    lessons: [
      {
        min: 3, max: 4,
        es: ['Págate a ti mismo primero (regla del 20 %)', 'Automatiza el ahorro nada más cobrar la nómina e implanta la «escasez artificial».'],
        en: ['Pay yourself first (the 20% rule)', 'Automate saving the moment your salary lands and put "artificial scarcity" to work.'],
        pt: ['Pague-se a si mesmo primeiro (regra dos 20%)', 'Automatize a poupança assim que recebe o salário e implemente a «escassez artificial».']
      },
      {
        min: 4, max: 5,
        es: ['Auditoría de gastos y la «grasa» financiera', 'Crea un plan de gasto consciente (fijos, inversión, estilo de vida) para recortar lo que no aporta y gastar en lo que amas.'],
        en: ['Spending audit and financial "fat"', 'Build a conscious spending plan (fixed costs, investing, lifestyle) to cut what adds nothing and spend on what you love.'],
        pt: ['Auditoria de gastos e a «gordura» financeira', 'Crie um plano de gastos consciente (fixos, investimento, estilo de vida) para cortar o que não acrescenta e gastar no que ama.']
      },
      {
        min: 4, max: 5,
        es: ['Deuda buena vs. deuda mala', 'Apalancarse en activos que generan renta frente al interés compuesto negativo del consumo.'],
        en: ['Good debt vs. bad debt', 'Borrowing for income-producing assets versus the negative compounding of consumer debt.'],
        pt: ['Dívida boa vs. dívida má', 'Alavancar-se em ativos que geram rendimento face aos juros compostos negativos do consumo.']
      },
      {
        min: 4, max: 5,
        es: ['Cómo salir de deudas: bola de nieve vs. avalancha', 'Las victorias rápidas del método bola de nieve frente a la optimización matemática de intereses del método avalancha.'],
        en: ['Getting out of debt: snowball vs. avalanche', 'The quick psychological wins of the snowball against the interest-saving maths of the avalanche.'],
        pt: ['Como sair das dívidas: bola de neve vs. avalanche', 'As vitórias rápidas do método bola de neve face à otimização matemática de juros do método avalanche.']
      },
      {
        min: 3, max: 4,
        es: ['El fondo de emergencia: tu colchón de tranquilidad', 'Calcula de 3 a 6 meses de gastos fijos y dónde guardar esa liquidez para no tocar tus inversiones ante un imprevisto.'],
        en: ['The emergency fund: your peace-of-mind cushion', 'Size 3 to 6 months of fixed costs and where to keep that cash so a surprise never forces you to sell investments.'],
        pt: ['O fundo de emergência: a sua almofada de tranquilidade', 'Calcule 3 a 6 meses de gastos fixos e onde manter essa liquidez para não mexer nos investimentos perante um imprevisto.']
      }
    ]
  },
  {
    id: 'm3',
    number: '3',
    es: { title: 'Macroeconomía y fundamentos financieros', goal: 'Entender cómo funciona el dinero en el mundo real.' },
    en: { title: 'Macroeconomics and Financial Foundations', goal: 'Understand how money works in the real world.' },
    pt: { title: 'Macroeconomia e fundamentos financeiros', goal: 'Perceber como funciona o dinheiro no mundo real.' },
    lessons: [
      {
        min: 4, max: 5,
        es: ['La 8.ª maravilla: la matemática del interés compuesto', 'La fórmula Cn = C0 × (1 + i)^n, el paradigma del tablero de ajedrez y por qué el tiempo es el factor exponencial clave.'],
        en: ['The eighth wonder: the maths of compound interest', 'The formula Cn = C0 × (1 + i)^n, the chessboard paradox and why time is the exponential factor that matters.'],
        pt: ['A 8.ª maravilha: a matemática dos juros compostos', 'A fórmula Cn = C0 × (1 + i)^n, o paradigma do tabuleiro de xadrez e porque o tempo é o fator exponencial decisivo.']
      },
      {
        min: 4, max: 5,
        es: ['La inflación: el ladrón silencioso del ahorro', 'Por qué el dinero en cuenta corriente puede perder hasta un 70 % de poder adquisitivo en décadas y cómo superarla invirtiendo.'],
        en: ['Inflation: the silent thief of savings', 'Why cash in a current account can lose up to 70% of its purchasing power over decades, and how investing beats it.'],
        pt: ['A inflação: o ladrão silencioso da poupança', 'Porque o dinheiro na conta à ordem pode perder até 70% do poder de compra em décadas e como superá-la investindo.']
      },
      {
        min: 5, max: 6,
        es: ['Entendiendo el ciclo económico (PIB, tipos e inflación)', 'Expansión, recesión y estagflación explicadas de forma didáctica, y cómo actúan los bancos centrales.'],
        en: ['Understanding the economic cycle (GDP, rates and inflation)', 'Expansion, recession and stagflation explained simply, and how central banks respond.'],
        pt: ['Perceber o ciclo económico (PIB, juros e inflação)', 'Expansão, recessão e estagflação explicadas de forma didática, e como atuam os bancos centrais.']
      },
      {
        min: 4, max: 5,
        es: ['El mercado de renta fija y el precio del dinero', 'Cómo la subida o bajada de tipos mueve el precio de los bonos, distinguiendo riesgo de crédito y riesgo de duración.'],
        en: ['Bond markets and the price of money', 'How rising and falling rates move bond prices, and the difference between credit risk and duration risk.'],
        pt: ['O mercado de rendimento fixo e o preço do dinheiro', 'Como a subida ou descida dos juros mexe no preço das obrigações, distinguindo risco de crédito e risco de duração.']
      }
    ]
  },
  {
    id: 'm4',
    number: '4',
    es: { title: 'Arquitectura de carteras y diversificación', goal: 'Estructurar el capital según horizontes temporales y perfiles de riesgo.' },
    en: { title: 'Portfolio Architecture and Diversification', goal: 'Structure your capital by time horizon and risk profile.' },
    pt: { title: 'Arquitetura de carteiras e diversificação', goal: 'Estruturar o capital por horizonte temporal e perfil de risco.' },
    lessons: [
      {
        min: 4, max: 5,
        es: ['El marco de las 3 cajas de inversión', 'Caja de liquidez (inmediato), caja de objetivos (1-5 años) y caja de largo plazo y jubilación.'],
        en: ['The three investment buckets framework', 'A liquidity bucket (now), a goals bucket (1–5 years) and a long-term and retirement bucket.'],
        pt: ['O modelo das 3 caixas de investimento', 'Caixa de liquidez (imediato), caixa de objetivos (1-5 anos) e caixa de longo prazo e reforma.']
      },
      {
        min: 4, max: 5,
        es: ['Asset allocation y la regla del «100 − edad»', 'Cómo ajustar la proporción de renta variable y renta fija o efectivo a medida que cumples años.'],
        en: ['Asset allocation and the "100 minus age" rule', 'How to shift the balance between equities and bonds or cash as you get older.'],
        pt: ['Asset allocation e a regra dos «100 − idade»', 'Como ajustar a proporção entre ações e rendimento fixo ou liquidez à medida que envelhece.']
      },
      {
        min: 4, max: 5,
        es: ['Diversificación estructural: «el único almuerzo gratis»', 'Correlación entre activos, la cartera 60/40, la All Weather y la Cartera Permanente de Harry Browne (25/25/25/25).'],
        en: ['Structural diversification: "the only free lunch"', 'Asset correlation, the 60/40 portfolio, All Weather and Harry Browne\'s Permanent Portfolio (25/25/25/25).'],
        pt: ['Diversificação estrutural: «o único almoço grátis»', 'Correlação entre ativos, a carteira 60/40, a All Weather e a Carteira Permanente de Harry Browne (25/25/25/25).']
      },
      {
        min: 5, max: 6,
        es: ['Indexación pasiva vs. gestión activa de autor', 'Cuándo aprovechar la sencillez y las bajas comisiones de un fondo global (MSCI World) y cuándo apoyarse en un gestor de autor.'],
        en: ['Passive indexing vs. active boutique managers', 'When to use the simplicity and low fees of a global index fund (MSCI World) and when to back a skilled independent manager.'],
        pt: ['Indexação passiva vs. gestão ativa de autor', 'Quando usar a simplicidade e as comissões baixas de um fundo global (MSCI World) e quando confiar num gestor de autor.']
      }
    ]
  },
  {
    id: 'm5',
    number: '5',
    es: { title: 'Filosofías de inversión y selección de activos', goal: 'Conocer las grandes corrientes de inversión para elegir la que encaja con tu personalidad.' },
    en: { title: 'Investment Philosophies and Asset Selection', goal: 'Learn the main schools of investing and pick the one that fits your personality.' },
    pt: { title: 'Filosofias de investimento e seleção de ativos', goal: 'Conhecer as grandes correntes de investimento para escolher a que encaixa na sua personalidade.' },
    lessons: [
      {
        min: 4, max: 5,
        es: ['Value investing: comprar calidad con descuento', 'Comprar empresas por debajo de su valor intrínseco al estilo Warren Buffett, y ratios clave como ROIC, ROE y ROA.'],
        en: ['Value investing: buying quality at a discount', 'Buying companies below intrinsic value, Warren Buffett style, and key ratios such as ROIC, ROE and ROA.'],
        pt: ['Value investing: comprar qualidade com desconto', 'Comprar empresas abaixo do valor intrínseco ao estilo Warren Buffett, e rácios-chave como ROIC, ROE e ROA.']
      },
      {
        min: 4, max: 5,
        es: ['Quality & growth investing: negocios extraordinarios', 'Invertir en los monopolios del futuro, con ventajas competitivas duraderas o alta disrupción.'],
        en: ['Quality & growth investing: extraordinary businesses', 'Investing in tomorrow\'s monopolies — durable competitive moats or genuine disruption.'],
        pt: ['Quality & growth investing: negócios extraordinários', 'Investir nos monopólios do futuro, com vantagens competitivas duradouras ou elevada disrupção.']
      },
      {
        min: 4, max: 5,
        es: ['Dividend growth investing: el flujo de caja recurrente', 'Cómo generar rentas crecientes con empresas consolidadas (aristócratas del dividendo).'],
        en: ['Dividend growth investing: recurring cash flow', 'Building a rising income with established companies (the dividend aristocrats).'],
        pt: ['Dividend growth investing: o fluxo de caixa recorrente', 'Como gerar rendimentos crescentes com empresas consolidadas (aristocratas do dividendo).']
      },
      {
        min: 4, max: 5,
        es: ['Grandes, medianas y pequeñas empresas (caps)', 'Diferencias entre large, mid y small caps, y una panorámica de fondos de autor destacados (MyInvestor Value, Numantia, True Capital, Hamco).'],
        en: ['Large, mid and small caps', 'How large, mid and small caps differ, plus an overview of notable boutique funds (MyInvestor Value, Numantia, True Capital, Hamco).'],
        pt: ['Grandes, médias e pequenas empresas (caps)', 'Diferenças entre large, mid e small caps, e um panorama de fundos de autor de referência (MyInvestor Value, Numantia, True Capital, Hamco).']
      },
      {
        min: 3, max: 4,
        es: ['Cuándo vender una inversión (sin que decida el pánico)', 'Tres reglas objetivas para desinvertir: ruptura de tesis, objetivo alcanzado o rebalanceo.'],
        en: ['When to sell (without letting panic decide)', 'Three objective rules for selling: the thesis breaks, the target is reached, or it is time to rebalance.'],
        pt: ['Quando vender um investimento (sem deixar o pânico decidir)', 'Três regras objetivas para desinvestir: rutura da tese, objetivo atingido ou rebalanceamento.']
      }
    ]
  },
  {
    id: 'm6',
    number: '6',
    es: { title: 'Taller práctico, fiscalidad y ejecución en España', goal: 'Pasar a la acción en el ordenador con herramientas reales.' },
    en: { title: 'Hands-on Workshop, Tax and Execution in Spain', goal: 'Take action at the computer with real tools.' },
    pt: { title: 'Workshop prático, fiscalidade e execução em Espanha', goal: 'Passar à ação no computador com ferramentas reais.' },
    lessons: [
      {
        min: 4, max: 5,
        es: ['La ventaja fiscal de los fondos en España', 'Cómo funciona el traspaso entre fondos sin tributar en el IRPF y la optimización del diferimiento fiscal.'],
        en: ['The tax advantage of investment funds in Spain', 'How tax-free fund-to-fund transfers work under Spanish income tax, and how to make the most of tax deferral.'],
        pt: ['A vantagem fiscal dos fundos em Espanha', 'Como funciona a transferência entre fundos sem tributação no IRPF e a otimização do diferimento fiscal.']
      },
      {
        min: 4, max: 5,
        es: ['Planificación de la jubilación y la regla del 4 %', 'Cómo calcular tu «cifra de independencia» y el encaje de los planes de pensiones.'],
        en: ['Retirement planning and the 4% rule', 'How to work out your "independence number" and where pension plans fit.'],
        pt: ['Planeamento da reforma e a regra dos 4%', 'Como calcular o seu «número da independência» e o papel dos planos de pensões.']
      },
      {
        min: 5, max: 6, practical: true,
        es: ['Abre tu cuenta en MyInvestor y programa tu primer DCA', 'Screencast paso a paso: de la apertura de cuenta a la automatización de tu primera aportación mensual periódica.'],
        en: ['Open a MyInvestor account and set up your first DCA', 'Step-by-step screencast, from opening the account to automating your first recurring monthly contribution.'],
        pt: ['Abra a sua conta na MyInvestor e programe o seu primeiro DCA', 'Screencast passo a passo, da abertura de conta à automatização da primeira contribuição mensal periódica.']
      },
      {
        min: 5, max: 6, practical: true,
        es: ['Crea tu balance familiar en Excel con la plantilla de Compounding Journey', 'Ejercicio guiado para rellenar activos, pasivos y tu plan de gasto consciente.'],
        en: ['Build your household balance sheet with the Compounding Journey Excel template', 'A guided exercise filling in assets, liabilities and your conscious spending plan.'],
        pt: ['Crie o seu balanço familiar em Excel com o modelo da Compounding Journey', 'Exercício guiado para preencher ativos, passivos e o seu plano de gastos consciente.']
      },
      {
        min: 4, max: 5, practical: true,
        es: ['Auditoría de gastos con inteligencia artificial', 'Exporta tus extractos bancarios y usa herramientas de categorización e IA para detectar fugas de dinero en 10 minutos.'],
        en: ['Spending audit with artificial intelligence', 'Export your bank statements and use categorisation and AI tools to find money leaks in 10 minutes.'],
        pt: ['Auditoria de gastos com inteligência artificial', 'Exporte os extratos bancários e use ferramentas de categorização e IA para detetar fugas de dinheiro em 10 minutos.']
      }
    ]
  },
  {
    id: 'additional',
    number: '7',
    additional: true,
    es: { title: 'Módulo adicional: Los secretos de los grandes inversores', goal: '8 masterclasses sobre los métodos de Graham, Buffett, Lynch, Fisher, Akre y Terry Smith, con plantillas y checklists prácticos.' },
    en: { title: 'Additional Module: Secrets of the Great Investors', goal: '8 masterclasses on the methods of Graham, Buffett, Lynch, Fisher, Akre and Terry Smith, with practical templates and checklists.' },
    pt: { title: 'Módulo adicional: Os segredos dos grandes investidores', goal: '8 masterclasses sobre os métodos de Graham, Buffett, Lynch, Fisher, Akre e Terry Smith, com modelos e checklists práticos.' },
    lessons: [
      {
        min: 5, max: 8,
        es: ['El padre del value investing: Benjamin Graham y el margen de seguridad', 'Los tres pilares de El inversor inteligente, Mr. Market como socio maníaco-depresivo y la estrategia deep value de las «colillas de puro».'],
        en: ['The father of value investing: Benjamin Graham and the margin of safety', 'The three pillars of The Intelligent Investor, Mr. Market as a manic-depressive partner, and the deep-value "cigar butt" strategy.'],
        pt: ['O pai do value investing: Benjamin Graham e a margem de segurança', 'Os três pilares de O Investidor Inteligente, o Mr. Market como sócio maníaco-depressivo e a estratégia deep value das «beatas de charuto».']
      },
      {
        min: 5, max: 8,
        es: ['La evolución de Warren Buffett: de Graham a Munger', 'Del deep value al quality value: See\'s Candies, Coca-Cola y Apple como casos de estudio de ventajas competitivas y ROIC > WACC.'],
        en: ['The evolution of Warren Buffett: from Graham to Munger', 'From deep value to quality value: See\'s Candies, Coca-Cola and Apple as case studies in moats and ROIC > WACC.'],
        pt: ['A evolução de Warren Buffett: de Graham a Munger', 'Do deep value ao quality value: See\'s Candies, Coca-Cola e Apple como casos de estudo de vantagens competitivas e ROIC > WACC.']
      },
      {
        min: 5, max: 8,
        es: ['El manual de Peter Lynch: las 6 categorías de acciones y el «crayon test»', 'Fast growers, stalwarts, slow growers, cíclicas, turnarounds y asset plays, y los atributos de la acción perfecta.'],
        en: ['Peter Lynch\'s playbook: the six stock categories and the "crayon test"', 'Fast growers, stalwarts, slow growers, cyclicals, turnarounds and asset plays — and the traits of the perfect stock.'],
        pt: ['O manual de Peter Lynch: as 6 categorias de ações e o «crayon test»', 'Fast growers, stalwarts, slow growers, cíclicas, turnarounds e asset plays, e os atributos da ação perfeita.']
      },
      {
        min: 5, max: 8,
        es: ['Las 15 reglas de Philip Fisher y la técnica «scuttlebutt»', 'La investigación cualitativa de campo —clientes, proveedores, competidores— como ventaja frente a Wall Street.'],
        en: ['Philip Fisher\'s 15 points and the "scuttlebutt" method', 'Qualitative field research — customers, suppliers, competitors — as your edge over Wall Street.'],
        pt: ['Os 15 pontos de Philip Fisher e a técnica «scuttlebutt»', 'A investigação qualitativa de campo — clientes, fornecedores, concorrentes — como vantagem face a Wall Street.']
      },
      {
        min: 5, max: 8,
        es: ['La ciencia de los multibaggers: 104 empresas que multiplicaron por 10', 'El estudio de Alta Fox Capital: tamaño, ventajas competitivas, barreras de entrada y los dos motores de la rentabilidad.'],
        en: ['The science of multibaggers: 104 companies that went 10x', 'The Alta Fox Capital study: size, moats, barriers to entry and the two engines of return.'],
        pt: ['A ciência dos multibaggers: 104 empresas que multiplicaram por 10', 'O estudo da Alta Fox Capital: dimensão, vantagens competitivas, barreiras à entrada e os dois motores da rentabilidade.']
      },
      {
        min: 5, max: 8,
        es: ['El taburete de 3 patas de Chuck Akre y las 3 reglas de Terry Smith', 'Cómo identificar máquinas de interés compuesto: negocio extraordinario, directiva íntegra y reinversión, y «buy good companies, don\'t overpay, do nothing».'],
        en: ['Chuck Akre\'s three-legged stool and Terry Smith\'s three rules', 'Spotting compounding machines: an extraordinary business, honest management and reinvestment — and "buy good companies, don\'t overpay, do nothing".'],
        pt: ['O banco de 3 pernas de Chuck Akre e as 3 regras de Terry Smith', 'Como identificar máquinas de juros compostos: negócio extraordinário, gestão íntegra e reinvestimento, e «buy good companies, don\'t overpay, do nothing».']
      },
      {
        min: 5, max: 8, practical: true,
        es: ['Análisis de una empresa en 5 minutos (checklist de 6 pasos)', 'Screencast: modelo de negocio, márgenes, ROIC, historial de rentabilidad, crecimiento de beneficios y valoración frente al histórico.'],
        en: ['Analyse a company in 5 minutes (6-step checklist)', 'Screencast: business model, margins, ROIC, track record, earnings growth and valuation against history.'],
        pt: ['Analisar uma empresa em 5 minutos (checklist de 6 passos)', 'Screencast: modelo de negócio, margens, ROIC, histórico de rentabilidade, crescimento dos lucros e valorização face ao histórico.']
      },
      {
        min: 5, max: 8, practical: true,
        es: ['Modelización de un reverse DCF en Excel para evitar trampas de valor', 'Con la plantilla de descuento de flujos invertido: qué crecimiento anual exige el precio actual y si es realista.'],
        en: ['Building a reverse DCF in Excel to avoid value traps', 'Using the reverse discounted cash flow template: what growth rate today\'s price demands, and whether it is realistic.'],
        pt: ['Modelar um reverse DCF em Excel para evitar armadilhas de valor', 'Com o modelo de fluxos de caixa descontados invertido: que crescimento anual o preço atual exige e se é realista.']
      }
    ]
  }
];

/** Everything else the course page and the promo card say, per language. */
export const COURSE_COPY = {
  es: {
    navLabel: 'Curso',
    navBadge: 'Nuevo',
    name: 'De Cero a la Libertad Financiera',
    title: 'Curso «De Cero a la Libertad Financiera» — finanzas personales e inversión',
    description:
      'Curso online en español de finanzas personales e inversión: psicología del dinero, ahorro, deudas, interés compuesto, carteras, fondos indexados y fiscalidad en España. 24,90 €.',
    eyebrow: 'Curso online · En español',
    intro:
      'Todo lo que enseña Compounding Journey, ordenado en una sola ruta de aprendizaje: de entender tu relación con el dinero a abrir tu cuenta de inversión y automatizar tu primera aportación.',
    languageTitle: 'Idioma del curso',
    languageBody: 'Curso grabado en español, con subtítulos en español, portugués e inglés.',
    priceLabel: 'Precio',
    couponLead: 'Lanzamiento',
    couponBody: (seats, percent) => `${percent} % de descuento para los ${seats} primeros alumnos con el cupón`,
    couponPriceLabel: 'Con el cupón',
    couponCopy: 'Copiar cupón',
    couponCopied: '¡Copiado!',
    buyWithCoupon: 'Inscribirme con el 50 % de descuento',
    buy: 'Inscribirme en el curso',
    buyNote: 'Pago seguro con Hotmart. Acceso inmediato en cuanto se confirma el pago.',
    factsTitle: 'El curso en cifras',
    factModules: 'módulos',
    factLessons: 'lecciones en vídeo',
    factMinutes: 'de vídeo',
    factAdditional: 'módulo adicional',
    factPractical: 'talleres prácticos',
    imageAlt: 'Mapa de la ruta de aprendizaje «De Cero a la Libertad Financiera»: seis módulos, de la psicología del dinero al taller práctico en España.',
    outcomesTitle: 'Lo que vas a conseguir',
    outcomes: [
      'Entender por qué tu cerebro sabotea tus decisiones de dinero y cómo evitarlo.',
      'Un sistema de ahorro automático y un plan de gasto consciente que no te obliga a vivir peor.',
      'Un plan claro para salir de deudas y un fondo de emergencia bien dimensionado.',
      'Dominar el interés compuesto, la inflación y el ciclo económico sin tecnicismos.',
      'Diseñar tu cartera con las 3 cajas, asset allocation y diversificación real.',
      'Abrir tu cuenta, programar tu primer DCA y aprovechar la fiscalidad de los fondos en España.'
    ],
    curriculumTitle: 'Programa completo',
    curriculumIntro:
      'Seis módulos que siguen el orden natural del aprendizaje, y un módulo adicional con los métodos de los grandes inversores. Lecciones cortas, de 3 a 8 minutos, para avanzar a tu ritmo.',
    moduleLabel: 'Módulo',
    lessonsLabel: 'lecciones',
    practicalLabel: 'Práctico',
    additionalLabel: 'Adicional',
    forTitle: '¿Es para ti?',
    forYes: 'Es para ti si…',
    yes: [
      'Empiezas de cero, o sabes algo pero nunca has tenido un sistema.',
      'Quieres invertir a largo plazo sin pasarte el día mirando gráficos.',
      'Vives en España (o inviertes desde allí) y quieres aplicar la fiscalidad real.',
      'Prefieres lecciones cortas, prácticas y ordenadas a cientos de vídeos sueltos.'
    ],
    forNo: 'No es para ti si…',
    no: [
      'Buscas hacerte rico rápido, trading diario o señales de compra.',
      'Esperas asesoramiento personalizado sobre productos concretos.',
      'Ya gestionas una cartera avanzada y solo buscas análisis de empresas.'
    ],
    freeTitle: 'Construido sobre las herramientas gratuitas de la web',
    freeBody:
      'El curso usa y explica las calculadoras, las plantillas de Excel y los simuladores de Compounding Journey. Puedes probarlos gratis antes de decidir:',
    authorTitle: 'Quién te enseña',
    authorBody:
      'Sandy Bradbury es educadora financiera y autora de Compounding Journey. El curso reúne en una ruta lo que ha ido publicando en el blog, las herramientas y las sesiones, explicado con el mismo enfoque: sistemas sencillos, paciencia y largo plazo.',
    authorLink: 'Conoce a Sandy',
    faqTitle: 'Preguntas frecuentes',
    faq: [
      ['¿En qué idioma está el curso?', 'El curso está grabado en español. Todas las lecciones tienen subtítulos en español, portugués e inglés, así que puedes seguirlo aunque el español no sea tu lengua materna.'],
      ['¿Necesito conocimientos previos?', 'No. El primer módulo empieza por la psicología del dinero y cada módulo se apoya en el anterior. Si ya tienes base, el programa te ayuda a ordenarla y a pasar a la acción.'],
      ['¿Cuánto cuesta y cómo funciona el cupón?', 'El curso cuesta 24,90 € en un único pago. Los 10 primeros alumnos tienen un 50 % de descuento con el cupón PRIMEROS10: el botón de descuento lo aplica automáticamente en el pago, o puedes escribirlo a mano.'],
      ['¿Dónde se ve el curso?', 'En la plataforma Hotmart, desde el ordenador, el móvil o la app de Hotmart. Recibes el acceso por email nada más completar el pago.'],
      ['¿Y si no me convence?', 'Hotmart ofrece una garantía de reembolso de 7 días: si el curso no es lo que esperabas, solicitas la devolución desde tu cuenta de Hotmart.'],
      ['¿Me sirve si no vivo en España?', 'Casi todo el curso es universal: psicología, hábitos, interés compuesto, carteras y filosofías de inversión. El módulo 6 aplica la fiscalidad y las herramientas españolas, y te muestra qué preguntas hacerte en tu propio país.'],
      ['¿Es asesoramiento financiero?', 'No. Es formación financiera: te enseña a entender y decidir por ti mismo. No recomienda productos concretos ni sustituye a un asesor regulado.']
    ],
    finalTitle: 'Empieza hoy tu camino hacia la libertad financiera',
    finalBody: 'El mejor momento para empezar fue hace diez años. El segundo mejor es hoy.',
    // The promo card the rest of the site carries.
    promoEyebrow: 'Nuevo curso online',
    promoBody:
      'La ruta completa, en orden: psicología del dinero, ahorro, deudas, interés compuesto, carteras y un taller práctico en España. Seis módulos y un módulo adicional sobre los grandes inversores.',
    promoAction: 'Ver el curso',
    promoCoupon: (code, percent) => `${percent} % de descuento con ${code} para los primeros alumnos`,
    homeBandTitle: 'Todo lo de esta web, en una ruta de aprendizaje',
    heroButton: 'Curso: De Cero a la Libertad Financiera'
  },
  en: {
    navLabel: 'Course',
    navBadge: 'New',
    name: 'De Cero a la Libertad Financiera (From Zero to Financial Freedom)',
    title: 'Course "From Zero to Financial Freedom" — personal finance and investing',
    description:
      'Online course on personal finance and investing, taught in Spanish with English subtitles: money psychology, saving, debt, compound interest, portfolios and index funds. €24.90.',
    eyebrow: 'Online course · Taught in Spanish · English subtitles',
    intro:
      'Everything Compounding Journey teaches, arranged into one learning path: from understanding your relationship with money to opening an investment account and automating your first contribution.',
    languageTitle: 'Course language',
    languageBody: 'Recorded in Spanish, with subtitles in English, Portuguese and Spanish.',
    priceLabel: 'Price',
    couponLead: 'Launch offer',
    couponBody: (seats, percent) => `${percent}% off for the first ${seats} students with the coupon`,
    couponPriceLabel: 'With the coupon',
    couponCopy: 'Copy coupon',
    couponCopied: 'Copied!',
    buyWithCoupon: 'Enrol with 50% off',
    buy: 'Enrol in the course',
    buyNote: 'Secure payment through Hotmart. Instant access as soon as payment is confirmed.',
    factsTitle: 'The course at a glance',
    factModules: 'modules',
    factLessons: 'video lessons',
    factMinutes: 'of video',
    factAdditional: 'additional module',
    factPractical: 'hands-on workshops',
    imageAlt: 'Learning path map for "De Cero a la Libertad Financiera": six modules, from money psychology to a hands-on workshop in Spain.',
    outcomesTitle: 'What you will achieve',
    outcomes: [
      'Understand why your brain sabotages your money decisions, and how to stop it.',
      'An automatic savings system and a conscious spending plan that does not make life worse.',
      'A clear plan to get out of debt and a properly sized emergency fund.',
      'A real grasp of compound interest, inflation and the economic cycle, without jargon.',
      'A portfolio designed with three buckets, asset allocation and genuine diversification.',
      'Your account opened, your first DCA scheduled, and the tax rules for funds in Spain working for you.'
    ],
    curriculumTitle: 'Full curriculum',
    curriculumIntro:
      'Six modules in the natural order of learning, plus an additional module on the methods of the great investors. Short lessons of 3 to 8 minutes so you can move at your own pace. Lessons are in Spanish with English subtitles.',
    moduleLabel: 'Module',
    lessonsLabel: 'lessons',
    practicalLabel: 'Hands-on',
    additionalLabel: 'Additional',
    forTitle: 'Is it for you?',
    forYes: 'It is for you if…',
    yes: [
      'You are starting from zero, or you know a bit but have never had a system.',
      'You want to invest for the long term without staring at charts all day.',
      'You are comfortable following a course in Spanish with English subtitles.',
      'You prefer short, practical, well-ordered lessons to hundreds of scattered videos.'
    ],
    forNo: 'It is not for you if…',
    no: [
      'You want to get rich quick, day-trade or receive buy signals.',
      'You expect personalised advice on specific financial products.',
      'You already run an advanced portfolio and only want company analysis.'
    ],
    freeTitle: 'Built on the site\'s free tools',
    freeBody:
      'The course uses and explains Compounding Journey\'s calculators, Excel templates and simulators. Try them for free before you decide:',
    authorTitle: 'Who teaches it',
    authorBody:
      'Sandy Bradbury is a financial educator and the author of Compounding Journey. The course gathers into one path what has been published across the journal, the tools and the sessions, with the same approach: simple systems, patience and the long term.',
    authorLink: 'Meet Sandy',
    faqTitle: 'Frequently asked questions',
    faq: [
      ['What language is the course in?', 'The course is recorded in Spanish. Every lesson has subtitles in English, Portuguese and Spanish, so you can follow it even if Spanish is not your first language.'],
      ['Do I need any prior knowledge?', 'No. Module 1 starts with the psychology of money and each module builds on the one before. If you already have a base, the programme helps you put it in order and act on it.'],
      ['How much does it cost, and how does the coupon work?', 'The course costs €24.90 as a one-off payment. The first 10 students get 50% off with the coupon PRIMEROS10: the discount button applies it automatically at checkout, or you can type it in yourself.'],
      ['Where do I watch it?', 'On the Hotmart platform, from your computer, your phone or the Hotmart app. Access arrives by email as soon as payment is complete.'],
      ['What if it is not for me?', 'Hotmart offers a 7-day refund guarantee: if the course is not what you expected, request a refund from your Hotmart account.'],
      ['Is it useful if I do not live in Spain?', 'Most of the course is universal: psychology, habits, compound interest, portfolios and investment philosophies. Module 6 applies Spanish tax rules and tools, and shows you which questions to ask in your own country.'],
      ['Is this financial advice?', 'No. It is financial education: it teaches you to understand and decide for yourself. It does not recommend specific products or replace a regulated adviser.']
    ],
    finalTitle: 'Start your path to financial freedom today',
    finalBody: 'The best time to start was ten years ago. The second best time is today.',
    promoEyebrow: 'New online course',
    promoBody:
      'The whole path, in order: money psychology, saving, debt, compound interest, portfolios and a hands-on workshop. Six modules plus an additional module on the great investors. Taught in Spanish with English subtitles.',
    promoAction: 'See the course',
    promoCoupon: (code, percent) => `${percent}% off with ${code} for the first students`,
    homeBandTitle: 'Everything on this site, in one learning path',
    heroButton: 'Course: From Zero to Financial Freedom'
  },
  pt: {
    navLabel: 'Curso',
    navBadge: 'Novo',
    name: 'De Cero a la Libertad Financiera (Do Zero à Liberdade Financeira)',
    title: 'Curso «Do Zero à Liberdade Financeira» — finanças pessoais e investimento',
    description:
      'Curso online de finanças pessoais e investimento, em espanhol com legendas em português: psicologia do dinheiro, poupança, dívidas, juros compostos, carteiras e fundos de índice. 24,90 €.',
    eyebrow: 'Curso online · Em espanhol · Legendas em português',
    intro:
      'Tudo o que a Compounding Journey ensina, organizado numa única rota de aprendizagem: de perceber a sua relação com o dinheiro a abrir a conta de investimento e automatizar a primeira contribuição.',
    languageTitle: 'Idioma do curso',
    languageBody: 'Gravado em espanhol, com legendas em português, inglês e espanhol.',
    priceLabel: 'Preço',
    couponLead: 'Lançamento',
    couponBody: (seats, percent) => `${percent}% de desconto para os ${seats} primeiros alunos com o cupão`,
    couponPriceLabel: 'Com o cupão',
    couponCopy: 'Copiar cupão',
    couponCopied: 'Copiado!',
    buyWithCoupon: 'Inscrever-me com 50% de desconto',
    buy: 'Inscrever-me no curso',
    buyNote: 'Pagamento seguro pela Hotmart. Acesso imediato assim que o pagamento é confirmado.',
    factsTitle: 'O curso em números',
    factModules: 'módulos',
    factLessons: 'aulas em vídeo',
    factMinutes: 'de vídeo',
    factAdditional: 'módulo adicional',
    factPractical: 'workshops práticos',
    imageAlt: 'Mapa da rota de aprendizagem «De Cero a la Libertad Financiera»: seis módulos, da psicologia do dinheiro ao workshop prático em Espanha.',
    outcomesTitle: 'O que vai conseguir',
    outcomes: [
      'Perceber porque o seu cérebro sabota as suas decisões de dinheiro e como o evitar.',
      'Um sistema de poupança automático e um plano de gastos consciente que não o obriga a viver pior.',
      'Um plano claro para sair das dívidas e um fundo de emergência bem dimensionado.',
      'Dominar os juros compostos, a inflação e o ciclo económico sem tecnicismos.',
      'Desenhar a sua carteira com as 3 caixas, asset allocation e diversificação real.',
      'Abrir a conta, programar o primeiro DCA e aproveitar a fiscalidade dos fundos em Espanha.'
    ],
    curriculumTitle: 'Programa completo',
    curriculumIntro:
      'Seis módulos que seguem a ordem natural da aprendizagem, e um módulo adicional com os métodos dos grandes investidores. Aulas curtas, de 3 a 8 minutos, para avançar ao seu ritmo. As aulas são em espanhol com legendas em português.',
    moduleLabel: 'Módulo',
    lessonsLabel: 'aulas',
    practicalLabel: 'Prático',
    additionalLabel: 'Adicional',
    forTitle: 'É para si?',
    forYes: 'É para si se…',
    yes: [
      'Começa do zero, ou sabe alguma coisa mas nunca teve um sistema.',
      'Quer investir no longo prazo sem passar o dia a olhar para gráficos.',
      'Consegue acompanhar um curso em espanhol com legendas em português.',
      'Prefere aulas curtas, práticas e organizadas a centenas de vídeos soltos.'
    ],
    forNo: 'Não é para si se…',
    no: [
      'Procura enriquecer depressa, fazer day trading ou receber sinais de compra.',
      'Espera aconselhamento personalizado sobre produtos concretos.',
      'Já gere uma carteira avançada e só procura análise de empresas.'
    ],
    freeTitle: 'Construído sobre as ferramentas gratuitas do site',
    freeBody:
      'O curso usa e explica as calculadoras, os modelos de Excel e os simuladores da Compounding Journey. Experimente-os grátis antes de decidir:',
    authorTitle: 'Quem ensina',
    authorBody:
      'Sandy Bradbury é educadora financeira e autora da Compounding Journey. O curso reúne numa rota o que foi publicando no blog, nas ferramentas e nas sessões, com a mesma abordagem: sistemas simples, paciência e longo prazo.',
    authorLink: 'Conheça a Sandy',
    faqTitle: 'Perguntas frequentes',
    faq: [
      ['Em que idioma está o curso?', 'O curso está gravado em espanhol. Todas as aulas têm legendas em português, inglês e espanhol, por isso pode acompanhá-lo mesmo que o espanhol não seja a sua língua materna.'],
      ['Preciso de conhecimentos prévios?', 'Não. O módulo 1 começa pela psicologia do dinheiro e cada módulo apoia-se no anterior. Se já tem uma base, o programa ajuda a organizá-la e a passar à ação.'],
      ['Quanto custa e como funciona o cupão?', 'O curso custa 24,90 € num único pagamento. Os 10 primeiros alunos têm 50% de desconto com o cupão PRIMEROS10: o botão de desconto aplica-o automaticamente no pagamento, ou pode escrevê-lo à mão.'],
      ['Onde vejo o curso?', 'Na plataforma Hotmart, no computador, no telemóvel ou na app da Hotmart. Recebe o acesso por email assim que concluir o pagamento.'],
      ['E se não me convencer?', 'A Hotmart oferece uma garantia de reembolso de 7 dias: se o curso não for o que esperava, pede a devolução na sua conta Hotmart.'],
      ['Serve-me se não vivo em Espanha?', 'Quase todo o curso é universal: psicologia, hábitos, juros compostos, carteiras e filosofias de investimento. O módulo 6 aplica a fiscalidade e as ferramentas espanholas, e mostra que perguntas fazer no seu próprio país.'],
      ['É aconselhamento financeiro?', 'Não. É educação financeira: ensina a perceber e a decidir por si. Não recomenda produtos concretos nem substitui um consultor regulado.']
    ],
    finalTitle: 'Comece hoje o seu caminho para a liberdade financeira',
    finalBody: 'O melhor momento para começar foi há dez anos. O segundo melhor é hoje.',
    promoEyebrow: 'Novo curso online',
    promoBody:
      'A rota completa, por ordem: psicologia do dinheiro, poupança, dívidas, juros compostos, carteiras e um workshop prático. Seis módulos e um módulo adicional sobre os grandes investidores. Em espanhol com legendas em português.',
    promoAction: 'Ver o curso',
    promoCoupon: (code, percent) => `${percent}% de desconto com ${code} para os primeiros alunos`,
    homeBandTitle: 'Tudo o que há neste site, numa rota de aprendizagem',
    heroButton: 'Curso: Do Zero à Liberdade Financeira'
  }
};
