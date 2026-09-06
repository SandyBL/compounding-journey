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
      body: 'Te pone delante las decisiones de dinero de una vida normal: un aumento, un coche, unas vacaciones, una factura inesperada, una caída del mercado. Y con cada una ves moverse cuatro cosas a la vez: tu patrimonio, tu flujo de caja, cómo de bien te sientes y lo que has aprendido por el camino.',
      forWhom: 'Si te sabes las cuentas de memoria y aun así no entiendes por qué decides lo que decides, empieza aquí.'
    },
    en: {
      eyebrow: 'Decision trainer',
      name: 'Personal Finance Simulator',
      body: 'It hands you the ordinary money decisions of a life: a raise, a car, a vacation, a bill you did not see coming, a market fall. With each one you watch four things move at once: your wealth, your cash flow, how good you feel about it, and what you have learned along the way.',
      forWhom: 'If you know the math by heart and still cannot say why you decide what you decide, start here.'
    },
    pt: {
      eyebrow: 'Treinador de decisões',
      name: 'Simulador de Finanças Pessoais',
      body: 'Ele coloca na sua frente as decisões de dinheiro de uma vida normal: um aumento, um carro, umas férias, uma despesa que você não esperava, uma queda do mercado. E com cada uma você vê quatro coisas se moverem ao mesmo tempo: o seu patrimônio, o seu fluxo de caixa, o quanto você se sente bem e o que aprendeu no caminho.',
      forWhom: 'Se você sabe as contas de cor e ainda assim não consegue explicar por que decide o que decide, comece por aqui.'
    }
  },
  {
    name: 'freedom-calendar',
    es: {
      eyebrow: 'Una fecha, no un total',
      name: 'Calendario de la Libertad',
      body: 'Pones tus ingresos, tus gastos y lo que ya tienes invertido, y sale una sola fecha: el día en que dejas de necesitar un sueldo. Después cuenta cada gasto fijo en la unidad que de verdad te cuesta, que son días de trabajo.',
      forWhom: 'Si ya ahorras y lo que quieres saber es cuándo llegas, no cuánto acumulas.'
    },
    en: {
      eyebrow: 'A date, not a total',
      name: 'Freedom Calendar',
      body: 'You put in your income, your spending and what you have already invested, and out comes a single date: the day you stop needing a salary. Then it counts each fixed expense in the unit it really costs you, which is days of work.',
      forWhom: 'If you are already saving and what you want to know is when you arrive, not how big the pile gets.'
    },
    pt: {
      eyebrow: 'Uma data, não um total',
      name: 'Calendário da Liberdade',
      body: 'Você coloca a sua renda, os seus gastos e o que já tem investido, e sai uma única data: o dia em que você deixa de precisar de um salário. Depois ele conta cada despesa fixa na unidade que ela realmente custa, que são dias de trabalho.',
      forWhom: 'Se você já guarda dinheiro e o que quer saber é quando chega, não quanto acumula.'
    }
  },
  {
    name: 'market-time-machine',
    es: {
      eyebrow: 'Cien años de mercado real',
      name: 'Máquina del Tiempo del Mercado',
      body: 'Montas una cartera y la haces atravesar las rentabilidades que ocurrieron de verdad desde 1920: la Gran Depresión, los años de guerra, la inflación de los setenta, las puntocom, 2008, la pandemia. No es una proyección. Es lo que tu cartera habría vivido de haber existido entonces.',
      forWhom: 'Si nunca has visto tu propia cartera por dentro de una crisis, aquí la ves.'
    },
    en: {
      eyebrow: 'A century of real markets',
      name: 'Market Time Machine',
      body: 'You build a portfolio and run it through the returns that actually happened from 1920 onward: the Great Depression, the war years, 1970s inflation, the dot-com collapse, 2008, the pandemic. This is not a projection. It is what your portfolio would have lived through, had it existed back then.',
      forWhom: 'If you have never watched your own portfolio go through a crash, here it is.'
    },
    pt: {
      eyebrow: 'Cem anos de mercado real',
      name: 'Máquina do Tempo do Mercado',
      body: 'Você monta uma carteira e a faz atravessar as rentabilidades que aconteceram de verdade desde 1920: a Grande Depressão, os anos da guerra, a inflação dos anos setenta, o estouro das dot-com, 2008, a pandemia. Não é uma projeção. É o que a sua carteira teria vivido, se existisse naquela época.',
      forWhom: 'Se você nunca viu a sua própria carteira por dentro de uma crise, aqui você vê.'
    }
  },
  {
    name: 'monte-carlo-fire',
    es: {
      eyebrow: 'Probabilidad, no promedio',
      name: 'Monte Carlo FIRE',
      body: 'Pasa tu plan de retirada por mil futuros distintos, sorteando cada vez otro orden para los años de mercado. En lugar de un número te devuelve una probabilidad: en cuántos de esos futuros el dinero llega hasta el final.',
      forWhom: 'Si ya tienes una cifra objetivo y quieres saber cuánto margen te queda de verdad.'
    },
    en: {
      eyebrow: 'Probability, not an average',
      name: 'Monte Carlo FIRE',
      body: 'It runs your withdrawal plan through a thousand different futures, shuffling the order of the market years each time. Instead of a number you get a probability: how many of those futures the money actually lasted through.',
      forWhom: 'If you already have a target figure and want to know how much margin is really left in it.'
    },
    pt: {
      eyebrow: 'Probabilidade, não média',
      name: 'Monte Carlo FIRE',
      body: 'Ele passa o seu plano de retirada por mil futuros diferentes, sorteando a cada vez outra ordem para os anos de mercado. Em vez de um número você recebe uma probabilidade: em quantos desses futuros o dinheiro chegou até o fim.',
      forWhom: 'Se você já tem um número-alvo e quer saber quanta margem ainda sobra nele.'
    }
  },
  {
    name: 'passive-income-engine',
    es: {
      eyebrow: 'Ingresos, fuente a fuente',
      name: 'Motor de Ingresos Pasivos',
      body: 'Construyes una corriente de ingresos con seis fuentes distintas (dividendos, alquiler, intereses, un negocio, regalías, una cartera) y luego intentas vivir de ella. Ahí es donde las diferencias entre unas y otras dejan de ser una idea y se convierten en una factura.',
      forWhom: 'Si «ingresos pasivos» te suena a una sola cosa, aquí se separan en cuatro.'
    },
    en: {
      eyebrow: 'Income, stream by stream',
      name: 'Passive Income Engine',
      body: 'You build an income stream out of six different sources (dividends, rent, interest, a business, royalties, a portfolio) and then try to live on it. That is where the differences between them stop being an idea and turn into a bill.',
      forWhom: 'If "passive income" still sounds like one thing to you, this pulls it apart into four.'
    },
    pt: {
      eyebrow: 'Rendimento, fonte a fonte',
      name: 'Motor de Rendimento Passivo',
      body: 'Você constrói uma corrente de renda com seis fontes diferentes (dividendos, aluguel, juros, um negócio, royalties, uma carteira) e depois tenta viver dela. É aí que as diferenças entre elas deixam de ser uma ideia e viram uma conta a pagar.',
      forWhom: 'Se «rendimento passivo» ainda soa como uma coisa só, aqui isso se separa em quatro.'
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
    intro: 'Cinco herramientas para practicar decisiones antes de tomarlas con dinero real. Son gratuitas, funcionan dentro de tu navegador y ninguna te pide registrarte.',
    forWhomLabel: 'Para quién',
    startTitle: '¿Por dónde empezar?',
    startBody: 'Si llegas sin una pregunta concreta, empieza por el Simulador de Finanzas Personales: no te pide ningún dato y en dos minutos ya has visto una decisión moverse. Los otros cuatro responden a una pregunta muy concreta cada uno, así que si la tuya está ahí arriba, ve directo.',
    privacyTitle: 'Qué pasa con lo que escribes',
    privacyBody: 'El cálculo ocurre entero en tu navegador, así que nada de lo que escribes sale de tu ordenador mientras juegas. Tres de los simuladores tienen una clasificación pública y los otros dos un botón para aportar tu resultado; en los dos casos solo se envía algo cuando lo pulsas tú. Y lo que se aporta aparece agregado y sin nombre en la página de resultados.',
    nextTitle: 'Si lo que buscas es una cuenta, no una partida',
    nextBody: 'Un simulador te enseña cómo se comporta una decisión; una calculadora te da el número directamente. Si ya sabes qué quieres calcular, las calculadoras son el camino corto. Y si te encuentras un término que no reconoces dentro de un simulador, está explicado en el glosario.'
  },
  en: {
    title: 'Financial simulators',
    description: 'Five free simulators for practicing money decisions: personal finance, your independence date, a century of markets, withdrawal probability and passive income.',
    eyebrow: 'Five simulators',
    heading: 'Financial simulators',
    intro: 'Five tools for practicing decisions before you make them with real money. They are free, they run inside your browser, and none of them asks you to sign up.',
    forWhomLabel: 'Who it is for',
    startTitle: 'Where to start',
    startBody: 'If you turn up without a specific question, start with the Personal Finance Simulator: it asks you for nothing and shows you a decision moving inside of two minutes. The other four each answer one narrow question, so if yours is up there, go straight to it.',
    privacyTitle: 'What happens to what you type',
    privacyBody: 'The math happens entirely in your browser, so nothing you type leaves your computer while you play. Three of the simulators keep a public ranking and the other two have a button that contributes your run; either way, something is only sent when you press it. And what gets contributed shows up aggregated and unnamed on the results page.',
    nextTitle: 'If you want a figure rather than a game',
    nextBody: 'A simulator shows you how a decision behaves; a calculator just hands you the number. If you already know what you want to work out, the calculators are the short way there. And if you hit a term you do not recognize inside a simulator, the glossary explains it.'
  },
  pt: {
    title: 'Simuladores financeiros',
    description: 'Cinco simuladores gratuitos para praticar decisões de dinheiro: finanças pessoais, data de independência, cem anos de mercado, probabilidade de retirada e rendimento passivo.',
    eyebrow: 'Cinco simuladores',
    heading: 'Simuladores financeiros',
    intro: 'Cinco ferramentas para praticar decisões antes de tomá-las com dinheiro real. São gratuitas, rodam dentro do seu navegador e nenhuma delas pede cadastro.',
    forWhomLabel: 'Para quem',
    startTitle: 'Por onde começar',
    startBody: 'Se você chega aqui sem uma pergunta concreta, comece pelo Simulador de Finanças Pessoais: ele não pede nenhum dado seu e em dois minutos você já viu uma decisão se mover. Os outros quatro respondem a uma pergunta bem específica cada um, então, se a sua está ali em cima, vá direto nele.',
    privacyTitle: 'O que acontece ao que escreve',
    privacyBody: 'O cálculo acontece inteiramente no seu navegador, então nada do que você escreve sai do seu computador enquanto você joga. Três dos simuladores têm um ranking público e os outros dois têm um botão para enviar a sua simulação; nos dois casos, só sai algo quando você clica. E o que é enviado aparece agregado e sem nome na página de resultados.',
    nextTitle: 'Se o que quer é uma conta, não um jogo',
    nextBody: 'Um simulador mostra como uma decisão se comporta; uma calculadora simplesmente entrega o número. Se você já sabe o que quer calcular, as calculadoras são o caminho curto. E se aparecer um termo que você não reconhece dentro de um simulador, o glossário explica.'
  }
};
