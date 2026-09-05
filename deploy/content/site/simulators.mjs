/**
 * The simulators index: what each of the five is, in three languages.
 *
 * The site had five simulators and no page listing them. The Simuladores nav
 * item, the "all simulators" link inside each tool and the breadcrumb above it
 * all pointed at /<lang>/simulator.html - the personal finance simulator -
 * because that page had been the entry point since before the other four
 * existed. A reader asking to see the simulators was therefore dropped into
 * one of them, mid-scenario, with the rest reachable only from a row of links
 * halfway down it. This is the page they were asking for.
 *
 * The copy here is the answer to a chooser's question, which is not the same as
 * the question each simulator's own page answers. A visitor on this page has
 * not decided anything yet, so every card says what the tool is for and who it
 * is for, in that order, and says it in the terms a person would use to
 * recognise their own situation - "I know the maths and still overspend", "I
 * want a date, not a total". The long version of each stays on the tool's own
 * page and is not repeated here: two pages describing the same thing at the
 * same length is how the shorter one ends up out of date.
 *
 * The order is the one the build already used, and it is deliberate as an
 * order: the personal finance simulator first because it asks nothing of a
 * visitor and teaches something in two minutes, then the four that answer one
 * question each. `startTitle`/`startBody` say that in the page, for the reader
 * who wants to be told where to begin rather than choose from five.
 */

/**
 * Per-simulator copy, keyed by the `name` in SIMULATORS in
 * scripts/site-routes.mjs - which is where the URLs live. The generator fails
 * the build if a simulator published there has no card here, or if a card
 * names a simulator that is not published, so this table cannot describe four
 * of five tools or advertise a sixth that does not exist.
 *
 * `eyebrow` is the two or three words above the name: what kind of answer the
 * tool gives. It is the field that makes the five cards scannable, so it says
 * "probability, not an average" rather than "simulator".
 */
export const SIMULATOR_CARDS = [
  {
    name: 'simulator-hub',
    es: {
      eyebrow: 'Entrenador de decisiones',
      name: 'Simulador de Finanzas Personales',
      body: 'Te pone delante las elecciones de dinero de una vida normal —un aumento, un coche, unas vacaciones, una factura inesperada, una caída del mercado— y muestra qué le hace cada una a cuatro cosas a la vez: tu patrimonio, tu flujo de caja, tu bienestar declarado y tu conocimiento financiero.',
      forWhom: 'Para quien entiende las cuentas y aun así no sabe por qué acaba decidiendo lo que decide.'
    },
    en: {
      eyebrow: 'Decision trainer',
      name: 'Personal Finance Simulator',
      body: 'It puts the ordinary money choices of a life in front of you — a raise, a car, a holiday, an unexpected bill, a market fall — and shows what each one does to four things at once: your wealth, your cash flow, your reported wellbeing and your financial knowledge.',
      forWhom: 'For anyone who understands the maths and still cannot say why they decide what they decide.'
    },
    pt: {
      eyebrow: 'Treinador de decisões',
      name: 'Simulador de Finanças Pessoais',
      body: 'Coloca à tua frente as escolhas de dinheiro de uma vida normal — um aumento, um carro, umas férias, uma despesa inesperada, uma queda do mercado — e mostra o que cada uma faz a quatro coisas ao mesmo tempo: o património, o fluxo de caixa, o bem-estar declarado e o conhecimento financeiro.',
      forWhom: 'Para quem entende as contas e ainda assim não sabe explicar por que decide o que decide.'
    }
  },
  {
    name: 'freedom-calendar',
    es: {
      eyebrow: 'Una fecha, no un total',
      name: 'Calendario de la Libertad',
      body: 'Convierte tus ingresos, tus gastos y tus inversiones actuales en una única fecha: el día en que dejas de necesitar un sueldo. Después traduce cada gasto recurrente a la unidad que de verdad cuesta, que son días de trabajo.',
      forWhom: 'Para quien ya ahorra y quiere saber cuándo llega, no cuánto acumula.'
    },
    en: {
      eyebrow: 'A date, not a total',
      name: 'Freedom Calendar',
      body: 'It turns your income, your spending and your existing investments into a single date: the day you stop needing a salary. Then it restates each recurring expense in the unit it actually costs, which is days of work.',
      forWhom: 'For anyone already saving who wants to know when they arrive, not how much they pile up.'
    },
    pt: {
      eyebrow: 'Uma data, não um total',
      name: 'Calendário da Liberdade',
      body: 'Converte o teu rendimento, as tuas despesas e os teus investimentos atuais numa única data: o dia em que deixas de precisar de um salário. Depois traduz cada despesa recorrente na unidade que ela custa de verdade, que são dias de trabalho.',
      forWhom: 'Para quem já poupa e quer saber quando chega, não quanto acumula.'
    }
  },
  {
    name: 'market-time-machine',
    es: {
      eyebrow: 'Cien años de mercado real',
      name: 'Máquina del Tiempo del Mercado',
      body: 'Diseñas una cartera y la haces atravesar las rentabilidades que ocurrieron de verdad desde 1920: la Gran Depresión, los años de guerra, la inflación de los setenta, las puntocom, 2008, la pandemia. No es una proyección; es lo que tu asignación habría vivido.',
      forWhom: 'Para quien nunca ha visto su propia cartera dentro de una crisis.'
    },
    en: {
      eyebrow: 'A century of real markets',
      name: 'Market Time Machine',
      body: 'You design a portfolio and run it through the returns that actually happened from 1920 onward: the Great Depression, the war years, 1970s inflation, the dot-com collapse, 2008, the pandemic. Not a projection — what your allocation would have lived through.',
      forWhom: 'For anyone who has never watched their own portfolio go through a crash.'
    },
    pt: {
      eyebrow: 'Cem anos de mercado real',
      name: 'Máquina do Tempo do Mercado',
      body: 'Desenhas uma carteira e fá-la atravessar as rentabilidades que aconteceram de verdade desde 1920: a Grande Depressão, os anos da guerra, a inflação dos anos setenta, o rebentamento das dot-com, 2008, a pandemia. Não é uma projeção; é o que a tua alocação teria vivido.',
      forWhom: 'Para quem nunca viu a sua própria carteira dentro de uma crise.'
    }
  },
  {
    name: 'monte-carlo-fire',
    es: {
      eyebrow: 'Probabilidad, no promedio',
      name: 'Monte Carlo FIRE',
      body: 'Ejecuta tu plan de retirada mil veces, sorteando cada vez una secuencia distinta de años de mercado, y en lugar de un número te devuelve una probabilidad: en qué proporción de esos futuros el dinero aguanta hasta el final.',
      forWhom: 'Para quien ya tiene una cifra objetivo y quiere saber cuánto margen le queda.'
    },
    en: {
      eyebrow: 'Probability, not an average',
      name: 'Monte Carlo FIRE',
      body: 'It runs your withdrawal plan a thousand times, drawing a different sequence of market years each time, and returns a probability instead of a number: the share of those futures in which the money lasts.',
      forWhom: 'For anyone with a target figure who wants to know how much margin is left in it.'
    },
    pt: {
      eyebrow: 'Probabilidade, não média',
      name: 'Monte Carlo FIRE',
      body: 'Executa o teu plano de retirada mil vezes, sorteando de cada vez uma sequência diferente de anos de mercado, e devolve uma probabilidade em vez de um número: a proporção desses futuros em que o dinheiro aguenta até ao fim.',
      forWhom: 'Para quem já tem um número-alvo e quer saber quanta margem lhe resta.'
    }
  },
  {
    name: 'passive-income-engine',
    es: {
      eyebrow: 'Ingresos, fuente a fuente',
      name: 'Motor de Ingresos Pasivos',
      body: 'Construyes una corriente de ingresos con seis fuentes distintas —dividendos, alquiler, intereses, negocio, regalías, cartera— y luego intentas vivir de ella, hasta que las diferencias entre unas y otras dejan de ser una idea y se vuelven una factura.',
      forWhom: 'Para quien oye «ingresos pasivos» como si fuera una sola cosa.'
    },
    en: {
      eyebrow: 'Income, stream by stream',
      name: 'Passive Income Engine',
      body: 'You build an income stream out of six different sources — dividends, rent, interest, a business, royalties, a portfolio — and then try to live on it, until the differences between them stop being an idea and turn into a bill.',
      forWhom: 'For anyone who hears "passive income" as though it were one thing.'
    },
    pt: {
      eyebrow: 'Rendimento, fonte a fonte',
      name: 'Motor de Rendimento Passivo',
      body: 'Constróis uma corrente de rendimento com seis fontes diferentes — dividendos, arrendamento, juros, negócio, direitos, carteira — e depois tentas viver dela, até que as diferenças entre elas deixem de ser uma ideia e passem a ser uma fatura.',
      forWhom: 'Para quem ouve «rendimento passivo» como se fosse uma coisa só.'
    }
  }
];

/**
 * The page around the cards.
 *
 * `privacyBody` is the one paragraph that has to be exactly true rather than
 * reassuring: four of the five keep everything in the browser, three of them
 * can submit a score to a public board when a visitor presses the button, and
 * the other two can contribute a run the same way. Nothing is sent on load, on
 * a timer or on a slider movement, and that is worth stating on the page that
 * sends people into them.
 */
export const SIMULATORS_PAGE = {
  es: {
    title: 'Simuladores financieros',
    description: 'Cinco simuladores gratuitos para practicar decisiones de dinero: finanzas personales, fecha de independencia, cien años de mercado, probabilidad de retirada e ingresos pasivos.',
    eyebrow: 'Cinco simuladores',
    heading: 'Simuladores financieros',
    intro: 'Cinco herramientas para practicar decisiones antes de tomarlas con dinero real. Todas son gratuitas, funcionan en tu navegador y ninguna te pide registrarte.',
    forWhomLabel: 'Para quién',
    startTitle: '¿Por dónde empezar?',
    startBody: 'Si vienes sin una pregunta concreta, empieza por el Simulador de Finanzas Personales: no te pide ningún dato tuyo y en dos minutos ya has visto una decisión moverse. Los otros cuatro responden a una pregunta muy concreta cada uno, así que si la tuya está arriba, ve directo.',
    privacyTitle: 'Qué pasa con lo que escribes',
    privacyBody: 'El cálculo ocurre entero en tu navegador: nada de lo que escribes se envía a ningún sitio mientras juegas. Tres de los simuladores tienen una clasificación pública y los otros dos un botón para aportar tu resultado, y en ambos casos solo se envía algo cuando lo pulsas tú. Lo que se aporta aparece agregado, sin nombre, en la página de resultados.',
    nextTitle: 'Si lo que buscas es una cuenta, no una partida',
    nextBody: 'Un simulador enseña cómo se comporta una decisión; una calculadora te da el número. Si ya sabes qué quieres calcular, las calculadoras son el camino corto, y el glosario explica los términos que aparecen dentro de los simuladores.'
  },
  en: {
    title: 'Financial simulators',
    description: 'Five free simulators for practising money decisions: personal finance, your independence date, a century of markets, withdrawal probability and passive income.',
    eyebrow: 'Five simulators',
    heading: 'Financial simulators',
    intro: 'Five tools for practising decisions before you make them with real money. All free, all running in your browser, none of them asking you to sign up.',
    forWhomLabel: 'Who it is for',
    startTitle: 'Where to start',
    startBody: 'If you arrive without a specific question, start with the Personal Finance Simulator: it asks you for nothing and shows you a decision moving within two minutes. The other four each answer one narrow question, so if yours is above, go straight there.',
    privacyTitle: 'What happens to what you type',
    privacyBody: 'The maths happens entirely in your browser: nothing you type is sent anywhere while you play. Three of the simulators keep a public ranking and the other two carry a button that contributes your run, and in both cases something is only sent when you press it. What is contributed appears aggregated, without a name, on the results page.',
    nextTitle: 'If you want a figure rather than a game',
    nextBody: 'A simulator shows you how a decision behaves; a calculator gives you the number. If you already know what you want to work out, the calculators are the short way there, and the glossary explains the terms that come up inside the simulators.'
  },
  pt: {
    title: 'Simuladores financeiros',
    description: 'Cinco simuladores gratuitos para praticar decisões de dinheiro: finanças pessoais, data de independência, cem anos de mercado, probabilidade de retirada e rendimento passivo.',
    eyebrow: 'Cinco simuladores',
    heading: 'Simuladores financeiros',
    intro: 'Cinco ferramentas para praticar decisões antes de as tomares com dinheiro real. Todas gratuitas, todas a funcionar no teu navegador, nenhuma te pede registo.',
    forWhomLabel: 'Para quem',
    startTitle: 'Por onde começar',
    startBody: 'Se chegas sem uma pergunta concreta, começa pelo Simulador de Finanças Pessoais: não te pede nenhum dado e em dois minutos já viste uma decisão a mover-se. Os outros quatro respondem a uma pergunta muito concreta cada um, por isso se a tua está acima, vai direto.',
    privacyTitle: 'O que acontece ao que escreves',
    privacyBody: 'O cálculo acontece inteiramente no teu navegador: nada do que escreves é enviado enquanto jogas. Três dos simuladores têm uma classificação pública e os outros dois têm um botão para contribuir a tua simulação, e em ambos os casos só é enviado algo quando o pressionas. O que é contribuído aparece agregado, sem nome, na página de resultados.',
    nextTitle: 'Se o que queres é uma conta, não um jogo',
    nextBody: 'Um simulador mostra como se comporta uma decisão; uma calculadora dá-te o número. Se já sabes o que queres calcular, as calculadoras são o caminho curto, e o glossário explica os termos que aparecem dentro dos simuladores.'
  }
};
