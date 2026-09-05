/**
 * The sessions page: what is actually for sale, in three languages.
 *
 * Until now the site sold nothing and said nothing about selling anything,
 * while the footer of every generated page linked to a "sessions" URL that did
 * not exist. This is that page.
 *
 * Two constraints shaped it.
 *
 * The first is regulatory. The author is a financial educator who does not hold
 * an advisory certification yet, so what is sold has to be education and
 * coaching - going through a spreadsheet, understanding a concept, building a
 * habit, setting a goal - and it has to be obvious that it is. Hence the
 * two-column scope block: a list of what a session is, next to an equally
 * specific list of what it is not. A page that only says what it includes
 * leaves the reader to assume the rest, and the assumption a finance page
 * invites is "he'll tell me what to buy".
 *
 * The second is that there are no prices yet. Rather than invent them or leave
 * the page until there are, every session says the rate is available on
 * request, and SESSION_PRICES below is the single switch that changes that: set
 * it and the page prints amounts instead, in every language, with no other
 * edit anywhere.
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
      forWhom: 'Para quien nunca ha puesto sus números en un sitio y no sabe por dónde empezar.'
    },
    en: {
      name: 'Orientation session',
      length: '45 minutes',
      format: 'Video call',
      body: 'A first conversation to establish the starting point: what comes in and goes out, what you owe, what worries you, and what you would like to be different a year from now. You leave with a two-page written summary and the one template to start with.',
      forWhom: 'For anyone who has never put their numbers in one place and does not know where to start.'
    },
    pt: {
      name: 'Sessão de orientação',
      length: '45 minutos',
      format: 'Videochamada',
      body: 'Uma primeira conversa para organizar o ponto de partida: o que entra e o que sai, o que deves, o que te preocupa e o que gostarias que fosse diferente dentro de um ano. Sais com um diagnóstico escrito de duas páginas e com o modelo concreto por onde começar.',
      forWhom: 'Para quem nunca colocou os seus números num só lugar e não sabe por onde começar.'
    }
  },
  {
    id: 'review',
    es: {
      name: 'Revisión de tus plantillas',
      length: '60 minutos',
      format: 'Videollamada, con la hoja de cálculo abierta',
      body: 'Revisamos juntos tu análisis mensual y tu control de gastos: si las categorías reflejan tu vida real, si la tasa de ahorro que sale es la que crees, dónde se está escapando el dinero y qué tres cambios tendrían el mayor efecto el mes que viene. Es la sesión más práctica de las tres.',
      forWhom: 'Para quien ya rellena las plantillas y quiere saber qué le están diciendo.'
    },
    en: {
      name: 'A review of your templates',
      length: '60 minutes',
      format: 'Video call, with the spreadsheet open',
      body: 'We go through your monthly analysis and your expense tracking together: whether the categories match your actual life, whether the savings rate coming out is the one you think it is, where the money is leaking, and which three changes would do the most next month. It is the most practical of the three.',
      forWhom: 'For anyone already filling in the templates who wants to know what they are saying.'
    },
    pt: {
      name: 'Revisão dos teus modelos',
      length: '60 minutos',
      format: 'Videochamada, com a folha de cálculo aberta',
      body: 'Revemos juntos a tua análise mensal e o teu controlo de despesas: se as categorias refletem a tua vida real, se a taxa de poupança que sai é a que pensas, por onde está a fugir o dinheiro e que três mudanças teriam o maior efeito no mês seguinte. É a mais prática das três.',
      forWhom: 'Para quem já preenche os modelos e quer saber o que eles lhe estão a dizer.'
    }
  },
  {
    id: 'accompaniment',
    es: {
      name: 'Acompañamiento de tres meses',
      length: 'Tres sesiones de 60 minutos, una al mes',
      format: 'Videollamada, con correo entre sesiones',
      body: 'Un hábito no se instala en una hora. Fijamos dos o tres objetivos concretos y medibles, montamos el sistema que los sostiene —automatizaciones, fechas, un sitio donde apuntar— y en cada sesión revisamos qué aguantó y qué no, y por qué. Entre sesiones puedes escribir con dudas.',
      forWhom: 'Para quien ya sabe qué quiere cambiar y se le deshace a las tres semanas.'
    },
    en: {
      name: 'Three-month accompaniment',
      length: 'Three 60-minute sessions, one a month',
      format: 'Video call, with email between sessions',
      body: 'A habit does not install itself in an hour. We set two or three concrete, measurable goals, build the system that holds them up — automatic transfers, dates, somewhere to write things down — and each session reviews what held and what did not, and why. Between sessions you can write with questions.',
      forWhom: 'For anyone who knows what they want to change and watches it fall apart after three weeks.'
    },
    pt: {
      name: 'Acompanhamento de três meses',
      length: 'Três sessões de 60 minutos, uma por mês',
      format: 'Videochamada, com email entre sessões',
      body: 'Um hábito não se instala numa hora. Definimos dois ou três objetivos concretos e mensuráveis, construímos o sistema que os sustenta — transferências automáticas, datas, um lugar onde apontar — e em cada sessão revemos o que aguentou e o que não, e porquê. Entre sessões podes escrever com dúvidas.',
      forWhom: 'Para quem já sabe o que quer mudar e vê tudo desfazer-se em três semanas.'
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
    intro: 'Una hora contigo, tus números delante y ninguna recomendación de producto. Esto es lo que hago y, con la misma claridad, lo que no.',
    scopeTitle: 'Qué es y qué no es una sesión',
    scopeIntro: 'La segunda lista es tan importante como la primera. No tengo la certificación de asesor financiero —estoy en proceso de obtenerla— y hasta entonces no presto ninguno de los servicios que la exigen.',
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
      'Te respondo con la tarifa vigente, la disponibilidad y qué sesión encaja mejor —o si creo que no necesitas ninguna, te lo digo.',
      'Confirmamos día y hora, y te envío por escrito qué llevar preparado.',
      'Tras la sesión recibes un resumen escrito con lo acordado y los siguientes pasos.'
    ],
    enquiryTitle: 'Pedir cita',
    enquiryBody: 'Cuéntame en dos líneas dónde estás. Respondo en 48 horas laborables con la tarifa vigente y la disponibilidad.',
    enquiryAction: 'Escribir desde el formulario',
    priceLabel: 'Tarifa',
    priceOnRequest: 'Consultar tarifa vigente',
    priceNote: 'Las tarifas no están publicadas todavía: pídelas por correo y te las envío con la disponibilidad. Sin compromiso y sin cobro hasta que confirmes.',
    forWhomLabel: 'Para quién',
    freeFirst: 'Antes de pagar nada: casi todo lo que hago en una sesión se puede hacer solo, gratis, con las plantillas, las calculadoras y el glosario de este sitio. Empieza por ahí. Las sesiones son para cuando quieres que alguien lo mire contigo.'
  },
  en: {
    title: 'Financial education sessions',
    description: 'One-to-one financial education sessions: going through your numbers, understanding the concepts, and building habits that hold. These are not investment advice.',
    heading: 'Financial education sessions',
    eyebrow: 'Working together',
    intro: 'An hour with you, your numbers on the screen, and no product recommendations. Here is what I do — and, just as clearly, what I do not.',
    scopeTitle: 'What a session is, and what it is not',
    scopeIntro: 'The second list matters as much as the first. I do not hold a financial adviser certification — I am in the process of obtaining one — and until then I provide none of the services that require it.',
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
      'I reply with the current rate, my availability, and which session fits best — or tell you if I think you do not need one.',
      'We confirm a day and time, and I send you in writing what to have ready.',
      'After the session you get a written summary of what we agreed and the next steps.'
    ],
    enquiryTitle: 'Ask about a session',
    enquiryBody: 'Tell me in two lines where you are. I answer within 48 working hours with the current rate and availability.',
    enquiryAction: 'Write from the contact form',
    priceLabel: 'Rate',
    priceOnRequest: 'Request current rates',
    priceNote: 'Rates are not published yet: ask by email and I will send them with my availability. No commitment, and nothing is charged until you confirm.',
    forWhomLabel: 'Who it is for',
    freeFirst: 'Before you pay for anything: almost everything I do in a session can be done alone, for free, with the templates, calculators and glossary on this site. Start there. The sessions are for when you want somebody to look at it with you.'
  },
  pt: {
    title: 'Sessões de educação financeira',
    description: 'Sessões individuais de educação financeira: rever os teus números, compreender os conceitos e construir hábitos que aguentam. Não são consultoria de investimento.',
    heading: 'Sessões de educação financeira',
    eyebrow: 'Trabalhar juntos',
    intro: 'Uma hora contigo, os teus números à frente e nenhuma recomendação de produto. Isto é o que faço e, com a mesma clareza, o que não faço.',
    scopeTitle: 'O que é e o que não é uma sessão',
    scopeIntro: 'A segunda lista é tão importante como a primeira. Não tenho a certificação de consultor financeiro — estou em processo de a obter — e até lá não presto nenhum dos serviços que a exigem.',
    scopeYes: 'O que fazemos',
    scopeNo: 'O que não fazemos',
    yes: [
      'Colocar os teus rendimentos, despesas, dívidas e poupança num lugar onde se possam ver.',
      'Compreender o que significam os teus próprios números: taxa de poupança, fluxo de caixa, património líquido.',
      'Explicar como funcionam os conceitos que encontras: juros compostos, diversificação, comissões, inflação.',
      'Rever e adaptar os modelos ao teu caso.',
      'Definir objetivos concretos e o sistema de hábitos que os sustenta.',
      'Preparar as perguntas que vais fazer a um consultor registado ou ao teu banco.'
    ],
    no: [
      'Dizer-te que fundo, ação, cripto ou plano de pensões comprar ou vender.',
      'Recomendar-te uma carteira ou uma distribuição concreta do teu dinheiro.',
      'Gerir, guardar ou movimentar o teu dinheiro: nunca me vais transferir fundos para investir.',
      'Planeamento fiscal, declarações ou estruturas societárias.',
      'Consultoria de seguros, créditos habitação ou qualquer produto financeiro concreto.',
      'Prometer-te uma rentabilidade, uma data de reforma ou um resultado.'
    ],
    howTitle: 'Como funciona',
    how: [
      'Escreve-me a contar brevemente onde estás e o que gostarias de resolver.',
      'Respondo com a tarifa em vigor, a disponibilidade e que sessão encaixa melhor — ou digo-te se acho que não precisas de nenhuma.',
      'Confirmamos dia e hora, e envio-te por escrito o que ter preparado.',
      'Depois da sessão recebes um resumo escrito do que foi acordado e dos próximos passos.'
    ],
    enquiryTitle: 'Pedir marcação',
    enquiryBody: 'Conta-me em duas linhas onde estás. Respondo em 48 horas úteis com a tarifa em vigor e a disponibilidade.',
    enquiryAction: 'Escrever pelo formulário',
    priceLabel: 'Tarifa',
    priceOnRequest: 'Consultar tarifa em vigor',
    priceNote: 'As tarifas ainda não estão publicadas: pede-as por email e envio-as com a disponibilidade. Sem compromisso e sem cobrança até confirmares.',
    forWhomLabel: 'Para quem',
    freeFirst: 'Antes de pagares qualquer coisa: quase tudo o que faço numa sessão pode ser feito sozinho, de graça, com os modelos, as calculadoras e o glossário deste site. Começa por aí. As sessões são para quando queres que alguém olhe para isso contigo.'
  }
};
