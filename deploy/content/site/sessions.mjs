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
 *
 * `body` and `forWhom` are the same voice as the home page and the about page:
 * first person, second person singular, and concrete about what happens in the
 * hour rather than about the value of investing in yourself. Each body says
 * what we open, what we look at and what the reader leaves with, because that
 * is what somebody deciding whether to pay is actually trying to find out.
 */
export const SESSIONS = [
  {
    id: 'orientation',
    es: {
      name: 'Sesión de orientación',
      length: '45 minutos',
      format: 'Videollamada',
      body: 'La primera conversación sirve para ordenar el punto de partida: qué entra cada mes, qué sale, qué debes, qué te quita el sueño y qué te gustaría que fuera distinto dentro de un año. Contarlo en voz alta a alguien que va preguntando ordena más de lo que parece. Al terminar te envío dos páginas escritas con la foto de dónde estás y la plantilla por la que te conviene empezar.',
      forWhom: 'Si nunca has puesto tus números en el mismo sitio y no sabes por dónde empezar.'
    },
    en: {
      name: 'Orientation session',
      length: '45 minutes',
      format: 'Video call',
      body: 'The first conversation is for getting the starting point straight: what comes in each month, what goes out, what you owe, what keeps you up at night and what you would like to be different a year from now. Saying it out loud to somebody who keeps asking questions sorts out more than you would expect. Afterwards I send you two written pages with a picture of where you are and the one template worth starting with.',
      forWhom: 'If you have never had your numbers in the same place and do not know where to start.'
    },
    pt: {
      name: 'Sessão de orientação',
      length: '45 minutos',
      format: 'Videochamada',
      body: 'A primeira conversa serve para organizar o ponto de partida: o que entra por mês, o que sai, o que você deve, o que tira o seu sono e o que você gostaria que fosse diferente daqui a um ano. Dizer isso em voz alta para alguém que vai perguntando organiza mais do que parece. No fim, envio duas páginas escritas com a foto de onde você está e o modelo por onde vale a pena começar.',
      forWhom: 'Se você nunca juntou os seus números em um só lugar e não sabe por onde começar.'
    }
  },
  {
    id: 'review',
    es: {
      name: 'Revisión de tus plantillas',
      length: '60 minutos',
      format: 'Videollamada, con la hoja de cálculo abierta',
      body: 'Abrimos tu análisis mensual y tu control de gastos y los miramos juntos: si las categorías se parecen a tu vida real, si tu tasa de ahorro es la que crees que es, por dónde se está escapando el dinero y qué tres cambios notarías más el mes que viene. Es la más práctica de las tres: sales con cosas hechas, no con deberes.',
      forWhom: 'Si ya rellenas las plantillas y quieres saber qué te están diciendo.'
    },
    en: {
      name: 'A review of your templates',
      length: '60 minutes',
      format: 'Video call, with the spreadsheet open',
      body: 'We open your monthly analysis and your expense tracking and go through them together: whether the categories look anything like your real life, whether your savings rate is the one you think it is, where the money is leaking and which three changes you would feel most next month. It is the most practical of the three: you leave with things done rather than with homework.',
      forWhom: 'If you already fill in the templates and want to know what they are telling you.'
    },
    pt: {
      name: 'Revisão dos seus modelos',
      length: '60 minutos',
      format: 'Videochamada, com a planilha aberta',
      body: 'Abrimos a sua análise mensal e o seu controle de despesas e olhamos os dois juntos: se as categorias se parecem com a sua vida real, se a sua taxa de poupança é a que você imagina, por onde o dinheiro está vazando e quais três mudanças você sentiria mais já no mês seguinte. É a mais prática das três: você sai com coisas feitas, não com tarefa de casa.',
      forWhom: 'Se você já preenche os modelos e quer saber o que eles estão dizendo.'
    }
  },
  {
    id: 'accompaniment',
    es: {
      name: 'Acompañamiento de tres meses',
      length: 'Tres sesiones de 60 minutos, una al mes',
      format: 'Videollamada, con correo entre sesiones',
      body: 'Un hábito no se instala en una hora. Elegimos dos o tres objetivos concretos, montamos el sistema que los sostiene (transferencias automáticas, fechas en el calendario, un sitio donde apuntar) y cada mes miramos qué aguantó, qué se cayó y por qué. Entre sesiones me escribes cuando te surja la duda, sin guardarla para la siguiente cita.',
      forWhom: 'Si ya sabes qué quieres cambiar y se te deshace a las tres semanas.'
    },
    en: {
      name: 'Three-month accompaniment',
      length: 'Three 60-minute sessions, one a month',
      format: 'Video call, with email between sessions',
      body: 'No habit installs itself in an hour. We pick two or three concrete goals, build the system that holds them up (automatic transfers, dates in the calendar, somewhere to write things down) and each month we look at what held, what fell over and why. Between sessions you write to me when the question comes up, instead of saving it for the next appointment.',
      forWhom: 'If you know what you want to change and watch it fall apart after three weeks.'
    },
    pt: {
      name: 'Acompanhamento de três meses',
      length: 'Três sessões de 60 minutos, uma por mês',
      format: 'Videochamada, com e-mail entre sessões',
      body: 'Nenhum hábito se instala em uma hora. Escolhemos dois ou três objetivos concretos, montamos o sistema que os sustenta (transferências automáticas, datas no calendário, um lugar para anotar) e a cada mês olhamos o que aguentou, o que caiu e por quê. Entre as sessões você me escreve quando a dúvida aparece, sem guardar para a próxima conversa.',
      forWhom: 'Se você já sabe o que quer mudar e vê tudo se desfazer em três semanas.'
    }
  }
];

/**
 * The page's own copy: everything that is not a session.
 *
 * `intro` is the page dek, and it is the one string on this page that a reader
 * cannot skip, so it says the three things that decide whether they keep
 * reading: it happens on a call, their own numbers are on the screen, and
 * nothing gets recommended to them. It used to end "Esto es lo que hago y, con
 * la misma claridad, lo que no hago", where "esto" pointed at a sentence
 * fragment and then had to mean two opposite things at once - a sentence that
 * survives being skimmed and falls apart being read. It now points forward, at
 * the two lists further down the page, which is what it was always describing.
 *
 * The register throughout is the home page's: first person, "tú" / "você", and
 * plain sentences about what happens rather than balanced abstractions about
 * clarity and value. Where the old copy hedged with a construction nobody says
 * out loud ("con la misma claridad", "Es la sesión más práctica de las tres"),
 * this says the same thing the way it would be said on a call.
 */
export const SESSIONS_PAGE = {
  es: {
    title: 'Sesiones de educación financiera',
    description: 'Sesiones individuales de educación financiera: ordenar tus números, entender los conceptos y montar los hábitos que aguantan. No son asesoramiento de inversión.',
    heading: 'Sesiones de educación financiera',
    eyebrow: 'Trabajar juntos',
    intro: 'Una videollamada, con tus números delante y sin ninguna recomendación de producto. Abajo te cuento qué hacemos en una sesión y, con el mismo detalle, qué no hacemos.',
    scopeTitle: 'Qué hacemos y qué no hacemos en una sesión',
    scopeIntro: 'La segunda lista importa tanto como la primera, así que va igual de grande. Soy educador financiero y no asesor financiero acreditado: puedo ayudarte a entender tus propios números y a llegar con las preguntas escritas a quien sí puede darte una recomendación, pero no voy a decirte dónde poner tu dinero.',
    scopeYes: 'Lo que sí hacemos',
    scopeNo: 'Lo que no hacemos',
    yes: [
      'Poner tus ingresos, gastos, deudas y ahorro en un sitio donde se vean todos a la vez.',
      'Entender qué te están diciendo tus propios números: tasa de ahorro, flujo de caja, patrimonio neto.',
      'Explicar los conceptos que te encuentras por todas partes: interés compuesto, diversificación, comisiones, inflación.',
      'Adaptar las plantillas a tu caso, contigo delante.',
      'Fijar objetivos concretos y montar el sistema de hábitos que los sostiene.',
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
      'Me escribes por el formulario y me cuentas en cuatro líneas dónde estás y qué te gustaría resolver.',
      'Te contesto con las tres tarifas, los huecos que tengo y qué sesión encaja mejor. Si creo que no necesitas ninguna, también te lo digo.',
      'Cerramos día y hora, y te mando por escrito lo que conviene tener a mano.',
      'Al acabar recibes un resumen escrito de lo que hablamos y de los siguientes pasos, para que nada dependa de tu memoria.'
    ],
    enquiryTitle: 'Pedir cita',
    enquiryBody: 'Cuéntame en dos líneas dónde estás. Te contesto en menos de 48 horas laborables con las tres tarifas y los huecos que tengo.',
    enquiryAction: 'Escribir desde el formulario',
    priceLabel: 'Tarifa',
    priceOnRequest: 'Consultar tarifa vigente',
    priceFromLabel: 'Desde',
    priceFromEquivalent: 'Equivale aproximadamente a',
    priceNote: 'Ese es el punto de partida: la sesión más corta. Lo que cuesta cada una de las tres depende de la sesión y del país, así que te las mando por escrito, con la disponibilidad, cuando me escribas. Preguntar no te compromete a nada y no se cobra nada hasta que confirmas.',
    forWhomLabel: 'Para quién',
    freeFirst: 'Antes de pagar nada: casi todo lo que hacemos en una sesión puedes hacerlo tú solo y gratis, con las plantillas, las calculadoras y el glosario de este sitio. Empieza por ahí. Las sesiones son para cuando ya lo has intentado y quieres que alguien lo mire contigo.'
  },
  en: {
    title: 'Financial education sessions',
    description: 'One-to-one financial education sessions: putting your numbers in order, understanding the concepts and building habits that hold. These are not investment advice.',
    heading: 'Financial education sessions',
    eyebrow: 'Working together',
    intro: 'A video call, your own numbers on the screen and not one product recommendation. Below is what we do in a session and, in the same detail, what we do not.',
    scopeTitle: 'What we do in a session, and what we do not',
    scopeIntro: 'The second list matters as much as the first, so it gets the same space. I am a financial educator and not an accredited financial adviser: I can help you understand your own numbers and turn up to a registered adviser with your questions already written, but I am not going to tell you where to put your money.',
    scopeYes: 'What we do',
    scopeNo: 'What we do not do',
    yes: [
      'Put your income, spending, debts and savings somewhere you can see them all at once.',
      'Work out what your own numbers are telling you: savings rate, cash flow, net worth.',
      'Explain the concepts you keep running into: compound interest, diversification, fees, inflation.',
      'Adapt the templates to your case, with you there.',
      'Set concrete goals and build the habit system that holds them up.',
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
      'You write through the contact form and tell me in four lines where you are and what you would like to sort out.',
      'I reply with all three rates, the slots I have and which session fits best. If I think you do not need one, I say that too.',
      'We fix a day and a time, and I send you in writing what is worth having to hand.',
      'Afterwards you get a written summary of what we talked about and the next steps, so none of it depends on your memory.'
    ],
    enquiryTitle: 'Ask about a session',
    enquiryBody: 'Tell me in two lines where you are. I answer within 48 working hours with all three rates and the slots I have.',
    enquiryAction: 'Write from the contact form',
    priceLabel: 'Rate',
    priceOnRequest: 'Request current rates',
    priceFromLabel: 'From',
    priceFromEquivalent: 'Roughly equivalent to',
    priceNote: 'That is the starting point: the shortest session. What each of the three costs depends on the session and the country, so I send all of them in writing, with my availability, when you write. Asking commits you to nothing, and nothing is charged until you confirm.',
    forWhomLabel: 'Who it is for',
    freeFirst: 'Before you pay for anything: almost everything we do in a session you can do on your own, for free, with the templates, calculators and glossary on this site. Start there. The sessions are for when you have tried that and want somebody to look at it with you.'
  },
  pt: {
    title: 'Sessões de educação financeira',
    description: 'Sessões individuais de educação financeira: organizar os seus números, compreender os conceitos e construir hábitos que aguentam. Não são consultoria de investimento.',
    heading: 'Sessões de educação financeira',
    eyebrow: 'Trabalhar juntos',
    intro: 'Uma videochamada, com os seus números na tela e nenhuma recomendação de produto. Abaixo você lê o que fazemos em uma sessão e, com o mesmo detalhe, o que não fazemos.',
    scopeTitle: 'O que fazemos e o que não fazemos em uma sessão',
    scopeIntro: 'A segunda lista importa tanto quanto a primeira, por isso ocupa o mesmo espaço. Sou educador financeiro e não consultor financeiro credenciado: posso ajudar você a entender os seus próprios números e a chegar com as perguntas escritas a quem pode fazer uma recomendação, mas não vou dizer onde colocar o seu dinheiro.',
    scopeYes: 'O que fazemos',
    scopeNo: 'O que não fazemos',
    yes: [
      'Colocar os seus rendimentos, despesas, dívidas e poupança em um lugar onde dê para ver tudo de uma vez.',
      'Entender o que os seus próprios números estão dizendo: taxa de poupança, fluxo de caixa, patrimônio líquido.',
      'Explicar os conceitos que você encontra em todo lugar: juros compostos, diversificação, taxas, inflação.',
      'Adaptar os modelos ao seu caso, com você ali.',
      'Definir objetivos concretos e montar o sistema de hábitos que os sustenta.',
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
      'Você me escreve pelo formulário e conta em quatro linhas onde está e o que gostaria de resolver.',
      'Eu respondo com as três tarifas, os horários que tenho e qual sessão encaixa melhor. Se eu achar que você não precisa de nenhuma, digo isso também.',
      'Marcamos dia e hora, e eu envio por escrito o que vale a pena ter à mão.',
      'No fim você recebe um resumo escrito do que conversamos e dos próximos passos, para nada depender da sua memória.'
    ],
    enquiryTitle: 'Agendar uma sessão',
    enquiryBody: 'Conte-me em duas linhas onde você está. Respondo em menos de 48 horas úteis com as três tarifas e os horários que tenho.',
    enquiryAction: 'Escrever pelo formulário',
    priceLabel: 'Tarifa',
    priceOnRequest: 'Consultar tarifa em vigor',
    priceFromLabel: 'A partir de',
    priceFromEquivalent: 'Equivale aproximadamente a',
    priceNote: 'Esse é o ponto de partida: a sessão mais curta. Quanto custa cada uma das três depende da sessão e do país, então envio todas por escrito, com a disponibilidade, quando você escrever. Perguntar não compromete você a nada, e nada é cobrado até você confirmar.',
    forWhomLabel: 'Para quem',
    freeFirst: 'Antes de pagar qualquer coisa: quase tudo o que fazemos em uma sessão você pode fazer sozinho, de graça, com os modelos, as calculadoras e o glossário deste site. Comece por aí. As sessões são para quando você já tentou e quer que alguém olhe junto com você.'
  }
};
