/**
 * The sessions page: what is actually for sale, in three languages.
 *
 * Until now the site sold nothing and said nothing about selling anything,
 * while the footer of every generated page linked to a "sessions" URL that did
 * not exist. This is that page.
 *
 * Two constraints shaped it.
 *
 * The first is regulatory. The author is a financial educator and not an
 * accredited adviser, so what is sold has to be education and
 * coaching - going through a spreadsheet, understanding a concept, building a
 * habit, setting a goal - and it has to be obvious that it is. Hence the
 * two-column scope block: a list of what a session is, next to an equally
 * specific list of what it is not. A page that only says what it includes
 * leaves the reader to assume the rest, and the assumption a finance page
 * invites is "he'll tell me what to buy".
 *
 * The second is pricing, and it is deliberately answered in two halves. The
 * page publishes a floor - SESSION_PRICE_FROM, one rounded number per currency,
 * so nobody has to write an email to find out the order of magnitude - and
 * leaves the three individual rates on request, because those really do depend
 * on the session and the country. SESSION_PRICES is the switch for publishing
 * all three; it is all-or-nothing and stays null. Both live below with the
 * reasoning next to them.
 */

/**
 * Published prices, or null while there are none.
 *
 * null - every session shows "rate on request" and the enquiry box asks the
 * reader to write for current rates. This is the state the page ships in.
 *
 * To publish prices, set this to an object with one entry per session id
 * below, each a string already formatted for a reader - `{ orientation: '0 €',
 * review: '75 €', accompaniment: '195 €' }`. Strings rather than numbers
 * because a price is a decision about presentation as much as arithmetic: "75 €"
 * and "75 EUR/session" and "3 x 65 €" are all things somebody might want to
 * print, and none of them survives being reduced to 75.
 *
 * scripts/generate-sessions-page.mjs fails the build if this is set and a
 * session is missing from it, so a half-filled table cannot ship as a page
 * where two sessions have a price and the third silently does not.
 */
export const SESSION_PRICES = null;

/**
 * The entry price, published; the three individual rates, still on request.
 *
 * This is a different thing from SESSION_PRICES above, and it exists because
 * the two questions a reader has are not the same question. "Is this 20 or
 * 2,000?" has to be answered on the page - a service page with no number at all
 * filters out the people who would have paid along with the people who would
 * not, and makes the ones who stay send an email to find out something they
 * were entitled to know before they invested the effort. "What exactly does the
 * three-session accompaniment cost in my country?" can wait for the reply,
 * because that answer genuinely depends on the session and the currency.
 *
 * So the page prints one floor and says the rest come by return. SESSION_PRICES
 * stays null: filling it is all-or-nothing by design, and this is not that.
 *
 * The three numbers are one offer in three currencies, rounded to something
 * that reads like a price rather than converted to the cent. R$ 99 is the
 * reference; 19 $ and 17 EUR are what that is worth as a price tag, not what it
 * is worth at today's mid-market rate. Two consequences worth knowing: the euro
 * and dollar figures do not need touching when the rate moves a few percent,
 * and they do need touching when it moves a lot. They are marketing numbers,
 * which is why the page says "approximately" about the two that are not the
 * reader's own currency.
 *
 * "display" is what a reader sees, formatted for their locale - R$ before the
 * amount, the euro sign after it, the dollar sign tight against the digits.
 * "amount" and "currency" are what go into the AggregateOffer, where a machine
 * needs a bare number and an ISO code.
 *
 * Language, not country, picks the currency, because language is the only thing
 * the site knows about a visitor. A Portuguese-speaking reader in Lisbon sees
 * reais, which is exactly why the equivalents are printed next to the headline
 * rather than hidden behind it.
 *
 * scripts/generate-sessions-page.mjs fails the build if a language is missing
 * or a field is blank. Setting the whole export to null removes the headline
 * and puts every rate back on request.
 */
export const SESSION_PRICE_FROM = {
  es: { display: '17 €', amount: 17, currency: 'EUR' },
  en: { display: '$19', amount: 19, currency: 'USD' },
  pt: { display: 'R$ 99', amount: 99, currency: 'BRL' }
};

/**
 * What is on offer.
 *
 * `id` is the key SESSION_PRICES uses. `length` and `format` are the meta line;
 * they are per language because "60 minutes" and "por videollamada" are text a
 * reader reads, not data.
 */
export const SESSIONS = [
  {
    id: 'orientation',
    es: {
      name: 'Sesión de orientación',
      length: '45 minutos',
      format: 'Videollamada',
      body: 'Una primera conversación para ordenar el punto de partida: qué ingresos y gastos tienes, qué deudas, qué te preocupa y qué te gustaría que fuera distinto dentro de un año. Sales con un diagnóstico escrito de dos páginas y con la plantilla concreta por la que empezar.',
      forWhom: 'Si nunca has puesto tus números en un mismo sitio y no sabes por dónde empezar.'
    },
    en: {
      name: 'Orientation session',
      length: '45 minutes',
      format: 'Video call',
      body: 'A first conversation to establish the starting point: what comes in and goes out, what you owe, what worries you, and what you would like to be different a year from now. You leave with a two-page written summary and the one template to start with.',
      forWhom: 'If you have never put your numbers in one place and have no idea where to start.'
    },
    pt: {
      name: 'Sessão de orientação',
      length: '45 minutos',
      format: 'Videochamada',
      body: 'Uma primeira conversa para organizar o ponto de partida: o que entra e o que sai, o que você deve, o que preocupa você e o que gostaria que fosse diferente dentro de um ano. Você sai com um diagnóstico escrito de duas páginas e com o modelo concreto por onde começar.',
      forWhom: 'Se você nunca colocou os seus números em um só lugar e não sabe por onde começar.'
    }
  },
  {
    id: 'review',
    es: {
      name: 'Revisión de tus plantillas',
      length: '60 minutos',
      format: 'Videollamada, con la hoja de cálculo abierta',
      body: 'Revisamos juntos tu análisis mensual y tu control de gastos: si las categorías reflejan tu vida real, si la tasa de ahorro que sale es la que crees, dónde se está escapando el dinero y qué tres cambios tendrían el mayor efecto el mes que viene. Es la sesión más práctica de las tres.',
      forWhom: 'Si ya rellenas las plantillas y quieres saber qué te están diciendo.'
    },
    en: {
      name: 'A review of your templates',
      length: '60 minutes',
      format: 'Video call, with the spreadsheet open',
      body: 'We go through your monthly analysis and your expense tracking together: whether the categories match your actual life, whether the savings rate coming out is the one you think it is, where the money is leaking, and which three changes would do the most next month. It is the most practical of the three.',
      forWhom: 'If you are already filling in the templates and want to know what they are telling you.'
    },
    pt: {
      name: 'Revisão dos seus modelos',
      length: '60 minutos',
      format: 'Videochamada, com a planilha aberta',
      body: 'Olhamos juntos a sua análise mensal e o seu controle de despesas: se as categorias refletem a sua vida real, se a taxa de poupança que sai dali é a que você imagina, por onde o dinheiro está vazando e quais três mudanças teriam o maior efeito já no mês seguinte. É a mais prática das três.',
      forWhom: 'Se você já preenche os modelos e quer saber o que eles estão dizendo.'
    }
  },
  {
    id: 'accompaniment',
    es: {
      name: 'Acompañamiento de tres meses',
      length: 'Tres sesiones de 60 minutos, una al mes',
      format: 'Videollamada, con correo entre sesiones',
      body: 'Un hábito no se instala en una hora. Fijamos dos o tres objetivos concretos y medibles, montamos el sistema que los sostiene (automatizaciones, fechas, un sitio donde apuntar) y en cada sesión miramos qué aguantó, qué no y por qué. Entre sesiones puedes escribirme con cualquier duda.',
      forWhom: 'Si ya sabes qué quieres cambiar y se te deshace a las tres semanas.'
    },
    en: {
      name: 'Three-month accompaniment',
      length: 'Three 60-minute sessions, one a month',
      format: 'Video call, with email between sessions',
      body: 'A habit does not install itself in an hour. We set two or three concrete, measurable goals, build the system that holds them up (automatic transfers, dates, somewhere to write things down) and then each session looks at what held, what did not, and why. Between sessions you can write to me with anything that comes up.',
      forWhom: 'If you know exactly what you want to change and watch it fall apart after three weeks.'
    },
    pt: {
      name: 'Acompanhamento de três meses',
      length: 'Três sessões de 60 minutos, uma por mês',
      format: 'Videochamada, com e-mail entre sessões',
      body: 'Um hábito não se instala em uma hora. Definimos dois ou três objetivos concretos e mensuráveis, montamos o sistema que os sustenta (transferências automáticas, datas, um lugar onde anotar) e em cada sessão olhamos o que aguentou, o que não aguentou e por quê. Entre as sessões você pode me escrever com qualquer dúvida.',
      forWhom: 'Se você já sabe o que quer mudar e vê tudo se desfazer em três semanas.'
    }
  }
];

/** The page's own copy: everything that is not a session. */
export const SESSIONS_PAGE = {
  es: {
    title: 'Sesiones de educación financiera',
    description: 'Sesiones individuales de educación financiera: revisar tus números, entender los conceptos y montar los hábitos que aguantan. No son asesoramiento de inversión.',
    heading: 'Sesiones de educación financiera',
    eyebrow: 'Trabajar juntos',
    intro: 'Una hora contigo, tus números delante y ninguna recomendación de producto. Esto es lo que hago y, con la misma claridad, lo que no hago.',
    scopeTitle: 'Qué es y qué no es una sesión',
    scopeIntro: 'La segunda lista es tan importante como la primera. Trabajo como educador financiero, no como asesor financiero acreditado, y no presto ninguno de los servicios reservados a quien lo es.',
    scopeYes: 'Lo que sí hacemos',
    scopeNo: 'Lo que no hacemos',
    yes: [
      'Poner tus ingresos, gastos, deudas y ahorro en un sitio donde se puedan ver.',
      'Entender qué significan tus propios números: tasa de ahorro, flujo de caja, patrimonio neto.',
      'Explicar cómo funcionan los conceptos que te encuentras: interés compuesto, diversificación, comisiones, inflación.',
      'Revisar y adaptar las plantillas a tu caso.',
      'Fijar objetivos concretos y el sistema de hábitos que los sostiene.',
      'Preparar las preguntas que le vas a hacer a un asesor registrado o a tu banco.'
    ],
    no: [
      'Decirte qué fondo, acción, cripto o plan de pensiones comprar o vender.',
      'Recomendarte una cartera o un reparto concreto de tu dinero.',
      'Gestionar, custodiar o mover tu dinero: nunca vas a transferirme fondos para invertir.',
      'Planificación fiscal, declaraciones o estructuras societarias.',
      'Asesoramiento de seguros, hipotecas o cualquier producto financiero concreto.',
      'Prometerte una rentabilidad, una fecha de jubilación o un resultado.'
    ],
    howTitle: 'Cómo funciona',
    how: [
      'Escríbeme contándome brevemente dónde estás y qué te gustaría resolver.',
      'Te respondo con las tres tarifas, la disponibilidad y qué sesión encaja mejor. Y si creo que no necesitas ninguna, te lo digo.',
      'Confirmamos día y hora, y te envío por escrito qué llevar preparado.',
      'Tras la sesión recibes un resumen escrito con lo acordado y los siguientes pasos.'
    ],
    enquiryTitle: 'Pedir cita',
    enquiryBody: 'Cuéntame en dos líneas dónde estás. Respondo en 48 horas laborables con las tres tarifas y la disponibilidad.',
    enquiryAction: 'Escribir desde el formulario',
    priceLabel: 'Tarifa',
    priceOnRequest: 'Consultar tarifa vigente',
    priceFromLabel: 'Desde',
    priceFromEquivalent: 'Equivale aproximadamente a',
    priceNote: 'Ese es el punto de partida, la sesión más corta. Lo que cuesta cada una de las tres depende de la sesión y del país: te las envío por escrito, con la disponibilidad, cuando me escribas. Sin compromiso y sin cobro hasta que confirmes.',
    forWhomLabel: 'Para quién',
    freeFirst: 'Antes de pagar nada: casi todo lo que hago en una sesión se puede hacer solo, gratis, con las plantillas, las calculadoras y el glosario de este sitio. Empieza por ahí. Las sesiones son para cuando quieres que alguien lo mire contigo.'
  },
  en: {
    title: 'Financial education sessions',
    description: 'One-to-one financial education sessions: going through your numbers, understanding the concepts, and building habits that hold. These are not investment advice.',
    heading: 'Financial education sessions',
    eyebrow: 'Working together',
    intro: 'An hour with you, your numbers on the screen, and no product recommendations. Here is what I do, and, just as clearly, what I do not do.',
    scopeTitle: 'What a session is, and what it is not',
    scopeIntro: 'The second list matters as much as the first. I work as a financial educator, not as an accredited financial adviser, and I provide none of the services that are reserved to advisers.',
    scopeYes: 'What we do',
    scopeNo: 'What we do not do',
    yes: [
      'Put your income, spending, debts and savings somewhere you can see them.',
      'Understand what your own numbers mean: savings rate, cash flow, net worth.',
      'Explain how the concepts you keep meeting work: compound interest, diversification, fees, inflation.',
      'Go through the templates and adapt them to your case.',
      'Set concrete goals and the habit system that holds them up.',
      'Prepare the questions you are going to ask a registered adviser or your bank.'
    ],
    no: [
      'Tell you which fund, stock, crypto or pension to buy or sell.',
      'Recommend a portfolio or a specific split of your money.',
      'Manage, hold or move your money: you will never transfer funds to me to invest.',
      'Tax planning, filings or company structures.',
      'Advice on insurance, mortgages or any specific financial product.',
      'Promise you a return, a retirement date or an outcome.'
    ],
    howTitle: 'How it works',
    how: [
      'Write to me with a short description of where you are and what you would like to sort out.',
      'I reply with all three rates, my availability and which session fits best. And if I think you do not need one, I say so.',
      'We confirm a day and time, and I send you in writing what to have ready.',
      'After the session you get a written summary of what we agreed and the next steps.'
    ],
    enquiryTitle: 'Ask about a session',
    enquiryBody: 'Tell me in two lines where you are. I answer within 48 working hours with all three rates and my availability.',
    enquiryAction: 'Write from the contact form',
    priceLabel: 'Rate',
    priceOnRequest: 'Request current rates',
    priceFromLabel: 'From',
    priceFromEquivalent: 'Roughly equivalent to',
    priceNote: 'That is the starting point, for the shortest session. What each of the three costs depends on the session and the country: I send all of them in writing, with my availability, when you write. No commitment, and nothing is charged until you confirm.',
    forWhomLabel: 'Who it is for',
    freeFirst: 'Before you pay for anything: almost everything I do in a session can be done alone, for free, with the templates, calculators and glossary on this site. Start there. The sessions are for when you want somebody to look at it with you.'
  },
  pt: {
    title: 'Sessões de educação financeira',
    description: 'Sessões individuais de educação financeira: rever os seus números, compreender os conceitos e construir hábitos que aguentam. Não são consultoria de investimento.',
    heading: 'Sessões de educação financeira',
    eyebrow: 'Trabalhar juntos',
    intro: 'Uma hora com você, os seus números na tela e nenhuma recomendação de produto. Isto é o que eu faço e, com a mesma clareza, o que eu não faço.',
    scopeTitle: 'O que é e o que não é uma sessão',
    scopeIntro: 'A segunda lista é tão importante quanto a primeira. Trabalho como educador financeiro e não como consultor financeiro credenciado, e não presto nenhum dos serviços que são reservados a quem tem essa credencial.',
    scopeYes: 'O que fazemos',
    scopeNo: 'O que não fazemos',
    yes: [
      'Colocar os seus rendimentos, despesas, dívidas e poupança num lugar onde se possam ver.',
      'Compreender o que significam os seus próprios números: taxa de poupança, fluxo de caixa, patrimônio líquido.',
      'Explicar como funcionam os conceitos que você encontra: juros compostos, diversificação, comissões, inflação.',
      'Passar pelos modelos e adaptá-los ao seu caso.',
      'Definir objetivos concretos e o sistema de hábitos que os sustenta.',
      'Preparar as perguntas que você vai fazer a um consultor registrado ou ao seu banco.'
    ],
    no: [
      'Dizer qual fundo, ação, cripto ou plano de previdência comprar ou vender.',
      'Recomendar uma carteira ou uma distribuição concreta do seu dinheiro.',
      'Administrar, guardar ou movimentar o seu dinheiro: você nunca vai me transferir fundos para investir.',
      'Planejamento fiscal, declarações ou estruturas societárias.',
      'Consultoria de seguros, crédito imobiliário ou qualquer produto financeiro concreto.',
      'Prometer uma rentabilidade, uma data de aposentadoria ou um resultado.'
    ],
    howTitle: 'Como funciona',
    how: [
      'Escreva-me contando brevemente onde você está e o que gostaria de resolver.',
      'Respondo com as três tarifas, a disponibilidade e qual sessão encaixa melhor, ou digo com franqueza se acho que você não precisa de nenhuma.',
      'Confirmamos dia e hora, e envio por escrito o que você deve ter preparado.',
      'Depois da sessão você recebe um resumo escrito do que foi acordado e dos próximos passos.'
    ],
    enquiryTitle: 'Agendar uma sessão',
    enquiryBody: 'Conte-me em duas linhas onde você está. Respondo em 48 horas úteis com as três tarifas e a disponibilidade.',
    enquiryAction: 'Escrever pelo formulário',
    priceLabel: 'Tarifa',
    priceOnRequest: 'Consultar tarifa em vigor',
    priceFromLabel: 'A partir de',
    priceFromEquivalent: 'Equivale aproximadamente a',
    priceNote: 'Esse é o ponto de partida, a sessão mais curta. Quanto custa cada uma das três depende da sessão e do país: envio todas por escrito, com a disponibilidade, quando você escrever. Sem compromisso e sem cobrança até confirmar.',
    forWhomLabel: 'Para quem',
    freeFirst: 'Antes de pagar qualquer coisa: quase tudo o que eu faço em uma sessão você pode fazer sozinho, de graça, com os modelos, as calculadoras e o glossário deste site. Comece por aí. As sessões são para quando você quer que alguém olhe para isso junto com você.'
  }
};
