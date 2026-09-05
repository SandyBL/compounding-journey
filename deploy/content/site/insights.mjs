/**
 * The copy and the metric table behind /es/datos/, /en/data/ and /pt/dados/.
 *
 * The page publishes what the five simulators have been told: averages, shares
 * and distributions over the simulator_scores table. It exists for two reasons
 * that pull in the same direction.
 *
 *   Teaching. A reader who has just been told that the 4% rule is contested
 *   learns more from "the median run on this site withdraws 3.8% and 71% of
 *   those runs survived a 40-year horizon" than from another paragraph of
 *   theory. So every section carries a `lesson` - a paragraph that is true
 *   whether or not the sample is big enough yet, written to be read on its own.
 *
 *   Originality. Aggregate, anonymous data nobody else holds is the one thing
 *   on this site that cannot be rewritten from a textbook, and it is what earns
 *   a link from someone else's article.
 *
 * Two conventions this file has to keep:
 *
 *   Every metric declares `minimum`, the smallest sample it may be published
 *   from. It is not a formatting preference. Below it the "average" is one
 *   person's afternoon, and printing it would both mislead the reader and
 *   describe an individual run - which is the thing the page promises not to
 *   do. Metrics that need a choice to be repeated before it means anything (a
 *   most-common answer, a full decision path) carry a higher one than metrics
 *   that only need a number to settle down.
 *
 *   Labels never come from the database. The simulators render their own option
 *   names in three languages, so what gets stored is the stable id behind the
 *   label - `dividend_etf`, `carLease`, `option B`. This file is where those
 *   ids become words, which is also what stops the page turning into three
 *   different data sets.
 */

/** ------------------------------------------------------------ enum labels */

// The Freedom Calendar's thirteen habits. One row per habit gives both the
// label for `topHabit` (keyed by id) and the label for the kept-percentage
// table (keyed by the `kept*` field), so the words are written once.
const HABITS = [
  { id: 'coffee', field: 'keptCoffee', es: 'Café fuera de casa', en: 'Coffee out', pt: 'Café fora de casa' },
  { id: 'lunch', field: 'keptLunch', es: 'Comer fuera a diario', en: 'Bought lunch', pt: 'Almoço comprado' },
  { id: 'subscriptions', field: 'keptSubscriptions', es: 'Suscripciones', en: 'Subscriptions', pt: 'Subscrições' },
  { id: 'carLease', field: 'keptCarLease', es: 'Renting del coche', en: 'Car lease', pt: 'Renting do carro' },
  { id: 'impulseShopping', field: 'keptImpulseShopping', es: 'Compras por impulso', en: 'Impulse shopping', pt: 'Compras por impulso' },
  { id: 'weekendDining', field: 'keptWeekendDining', es: 'Cenas de fin de semana', en: 'Weekend dining', pt: 'Jantares de fim de semana' },
  { id: 'energySnacks', field: 'keptEnergySnacks', es: 'Snacks y bebidas energéticas', en: 'Snacks and energy drinks', pt: 'Snacks e bebidas energéticas' },
  { id: 'techUpgrades', field: 'keptTechUpgrades', es: 'Renovar tecnología', en: 'Tech upgrades', pt: 'Renovar tecnologia' },
  { id: 'gymMembership', field: 'keptGymMembership', es: 'Gimnasio', en: 'Gym membership', pt: 'Ginásio' },
  { id: 'storageUnit', field: 'keptStorageUnit', es: 'Trastero alquilado', en: 'Storage unit', pt: 'Arrecadação alugada' },
  { id: 'foodWaste', field: 'keptFoodWaste', es: 'Comida que se tira', en: 'Food waste', pt: 'Comida desperdiçada' },
  { id: 'shortRideshares', field: 'keptShortRideshares', es: 'Taxis y VTC cortos', en: 'Short rideshares', pt: 'Táxis e TVDE curtos' },
  { id: 'bottledWater', field: 'keptBottledWater', es: 'Agua embotellada', en: 'Bottled water', pt: 'Água engarrafada' }
];

export const HABIT_FIELDS = HABITS.map((habit) => habit.field);

const fromTable = (rows, key) => Object.fromEntries(
  rows.map((row) => [row[key], { es: row.es, en: row.en, pt: row.pt }])
);

/**
 * Every id the database can hold, in words.
 *
 * Namespaced by what the ids mean rather than by which simulator wrote them:
 * the allocation sleeves are shared by two tools, and a label that disagreed
 * between them would read as two different measurements.
 */
export const VALUE_LABELS = {
  habits: fromTable(HABITS, 'id'),
  habitFields: fromTable(HABITS, 'field'),
  allocation: {
    pctStocks: { es: 'Acciones', en: 'Stocks', pt: 'Ações' },
    pctBonds: { es: 'Bonos', en: 'Bonds', pt: 'Obrigações' },
    pctReits: { es: 'Inmobiliario cotizado (REIT)', en: 'Listed real estate (REITs)', pt: 'Imobiliário cotado (REIT)' },
    pctGold: { es: 'Oro', en: 'Gold', pt: 'Ouro' },
    pctCash: { es: 'Liquidez', en: 'Cash', pt: 'Liquidez' }
  },
  categories: {
    investingPct: { es: 'Invertir', en: 'Investing', pt: 'Investir' },
    debtPct: { es: 'Pagar deuda', en: 'Paying debt', pt: 'Pagar dívida' },
    spendingPct: { es: 'Gastar', en: 'Spending', pt: 'Gastar' },
    taxPct: { es: 'Impuestos y burocracia', en: 'Tax and admin', pt: 'Impostos e burocracia' },
    riskPct: { es: 'Asumir riesgo', en: 'Taking risk', pt: 'Assumir risco' }
  },
  engines: {
    dividend_etf: { es: 'ETF de dividendos', en: 'Dividend ETF', pt: 'ETF de dividendos' },
    bonds: { es: 'Bonos', en: 'Bonds', pt: 'Obrigações' },
    rental_property: { es: 'Piso en alquiler', en: 'Rental property', pt: 'Imóvel arrendado' },
    reit_index: { es: 'Índice de REIT', en: 'REIT index', pt: 'Índice de REIT' },
    digital_business: { es: 'Negocio digital', en: 'Digital business', pt: 'Negócio digital' },
    bitcoin: { es: 'Bitcoin', en: 'Bitcoin', pt: 'Bitcoin' }
  },
  housing: {
    modest: { es: 'Vivienda modesta', en: 'Modest home', pt: 'Casa modesta' },
    standard: { es: 'Vivienda media', en: 'Standard home', pt: 'Casa média' },
    luxury: { es: 'Vivienda de lujo', en: 'Luxury home', pt: 'Casa de luxo' }
  },
  lifestyle: {
    frugal: { es: 'Frugal', en: 'Frugal', pt: 'Frugal' },
    balanced: { es: 'Equilibrado', en: 'Balanced', pt: 'Equilibrado' },
    lavish: { es: 'Generoso', en: 'Lavish', pt: 'Generoso' }
  },
  sequences: {
    simulated: { es: 'Mercado simulado al azar', en: 'Randomly simulated market', pt: 'Mercado simulado ao acaso' },
    '1970s': { es: 'Los años setenta', en: 'The 1970s', pt: 'Os anos setenta' },
    '2000s': { es: 'La década perdida (2000-2009)', en: 'The lost decade (2000-2009)', pt: 'A década perdida (2000-2009)' },
    bull: { es: 'Mercado alcista', en: 'Bull market', pt: 'Mercado em alta' }
  },
  presets: {
    custom: { es: 'Cartera propia', en: 'Their own mix', pt: 'Carteira própria' },
    classic6040: { es: 'Clásica 60/40', en: 'Classic 60/40', pt: 'Clássica 60/40' },
    allweather: { es: 'All Weather', en: 'All Weather', pt: 'All Weather' },
    permanent: { es: 'Cartera permanente', en: 'Permanent portfolio', pt: 'Carteira permanente' },
    aggressive: { es: 'Agresiva', en: 'Aggressive', pt: 'Agressiva' },
    conservative: { es: 'Conservadora', en: 'Conservative', pt: 'Conservadora' }
  },
  tactics: {
    tacticJob: { es: 'Volver a trabajar un tiempo', en: 'Go back to work for a while', pt: 'Voltar a trabalhar por um tempo' },
    tacticCutSpend: { es: 'Recortar el gasto', en: 'Cut spending', pt: 'Cortar a despesa' },
    tacticCashBuffer: { es: 'Colchón de liquidez', en: 'Cash buffer', pt: 'Almofada de liquidez' },
    tacticGuardrails: { es: 'Reglas de retirada flexibles', en: 'Flexible withdrawal guardrails', pt: 'Regras de retirada flexíveis' },
    tacticDownsize: { es: 'Mudarse a algo más pequeño', en: 'Downsize the home', pt: 'Mudar para algo menor' },
    tacticPension: { es: 'Contar con la pensión pública', en: 'Count on the state pension', pt: 'Contar com a pensão pública' }
  }
};

/** -------------------------------------------------------------- page copy */

export const INSIGHTS_PAGE = {
  es: {
    eyebrow: 'Datos propios',
    title: 'Qué dicen los datos de los simuladores',
    heading: 'Qué dicen los datos de los simuladores',
    description:
      'Medias, porcentajes y decisiones reales extraídas de las simulaciones que los lectores de Compounding Journey han guardado: qué tasa de retirada eligen, qué hábitos no sueltan y qué cartera construyen.',
    intro:
      'Cada simulación que alguien decide guardar deja un registro anónimo de los números que usó y del resultado que obtuvo. Esta página es la suma de todos ellos, y se recalcula en cada publicación del sitio.',
    units: { perMonth: '/mes', years: 'años', year: 'año' },
    runsLabel: 'simulaciones registradas',
    updatedLabel: 'Recalculado',
    insightsTitle: 'Lo que se puede afirmar hoy',
    insightsEmpty:
      'Todavía no hay ninguna medida con muestra suficiente para publicarla. Cuando la haya, aparecerá aquí en una sola frase por medida.',
    detailTitle: 'Simulador por simulador',
    lessonLabel: 'Por qué importa',
    metricHeading: 'Medida',
    valueHeading: 'Valor',
    sampleHeading: 'Muestra',
    medianLabel: 'mediana',
    rangeLabel: 'rango',
    sampleUnit: 'simulaciones',
    notEnough:
      'Aún no hay muestra suficiente en este simulador para publicar medias. Lo que falta son simulaciones, no código: cada vez que alguien usa la herramienta y decide guardar su escenario, esta sección se acerca a poder decir algo.',
    tryLabel: 'Abrir el simulador',
    noDataTitle: 'Sin datos disponibles ahora mismo',
    noDataBody:
      'La base de datos no ha respondido durante la última publicación del sitio, así que esta página se muestra sin cifras. Las explicaciones de cada simulador siguen siendo válidas; los números volverán en la siguiente publicación.',
    methodTitle: 'Cómo se calcula esto',
    method: [
      'Cada cifra viene de la tabla donde los simuladores guardan las simulaciones: los ajustes que se introdujeron y el resultado que salió. No hay nombres, ni correos, ni identificadores de persona, ni cookies detrás de estos números.',
      'Ninguna medida se publica hasta que tiene muestra suficiente. Cada una lleva su propio mínimo y, por debajo de él, no aparece: una "media" de tres simulaciones describiría una tarde de tres personas, no un patrón.',
      'Las cantidades de dinero se calculan solo dentro de un idioma. Las tres versiones del sitio muestran tres monedas distintas para el mismo campo, así que una media conjunta sería una media de monedas. El resto de medidas (porcentajes, edades, años, elecciones) sí suma los tres idiomas.',
      'La muestra que acompaña a cada cifra cuenta las simulaciones que traían ese campo, no el total de la tabla. Un campo que se empezó a guardar más tarde tiene por tanto una muestra menor, y se ve.'
    ],
    caveatTitle: 'Qué no son estos números',
    caveat: [
      'No son una encuesta. Quien llega a un simulador de independencia financiera y decide guardar su escenario no es una muestra de la población: es gente interesada en el tema, probablemente ahorradora y con más margen que la media. El sesgo de autoselección es grande y no se puede corregir.',
      'No son comportamiento real, sino decisiones tomadas dentro de un modelo, sin consecuencias. La gente arriesga más en una simulación que con su dinero, y eso hace que estas cifras sirvan para entender preferencias e intuiciones, no para predecir lo que alguien hará de verdad.',
      'No son una recomendación. Que la mayoría elija una tasa de retirada, una cartera o un hábito no la convierte en la adecuada para ti. Aquí se publica lo que la gente elige, no lo que deberías elegir.'
    ],
    contributeTitle: 'Añadir una simulación',
    contributeBody:
      'Dos de las herramientas tienen un botón para guardar el escenario en estos datos públicos, y las otras tres guardan la simulación al enviar una puntuación a su clasificación. En ambos casos es voluntario y no se guarda ningún dato personal.',
    readMore: 'Seguir leyendo'
  },
  en: {
    eyebrow: 'Original data',
    title: 'What the simulator data says',
    heading: 'What the simulator data says',
    description:
      'Averages, shares and real choices taken from the simulations Compounding Journey readers have saved: the withdrawal rate they pick, the habits they refuse to drop and the portfolio they build.',
    intro:
      'Every simulation somebody chooses to save leaves an anonymous record of the numbers they used and the result they got. This page is the sum of all of them, recalculated every time the site is published.',
    units: { perMonth: '/mo', years: 'years', year: 'year' },
    runsLabel: 'simulations recorded',
    updatedLabel: 'Recalculated',
    insightsTitle: 'What can be said today',
    insightsEmpty:
      'No measure has a large enough sample to publish yet. When one does, it will appear here as a single sentence.',
    detailTitle: 'Simulator by simulator',
    lessonLabel: 'Why it matters',
    metricHeading: 'Measure',
    valueHeading: 'Value',
    sampleHeading: 'Sample',
    medianLabel: 'median',
    rangeLabel: 'range',
    sampleUnit: 'simulations',
    notEnough:
      'This simulator does not have a large enough sample to publish averages yet. What is missing is simulations rather than code: every time somebody uses the tool and chooses to save their scenario, this section gets closer to having something to say.',
    tryLabel: 'Open the simulator',
    noDataTitle: 'No data available right now',
    noDataBody:
      'The database did not answer while the site was last published, so this page is showing without figures. The explanation of each simulator still holds; the numbers will be back on the next publish.',
    methodTitle: 'How this is calculated',
    method: [
      'Every figure comes from the table the simulators write to: the settings that went in and the result that came out. There are no names, no email addresses, no personal identifiers and no cookies behind these numbers.',
      'No measure is published until its sample is large enough. Each one carries its own minimum and simply does not appear below it: an "average" of three simulations would describe three people’s afternoon, not a pattern.',
      'Money figures are computed inside one language only. The three versions of the site show three different currency symbols for the same input, so a pooled average would be an average of currencies. Everything unit-free - percentages, ages, years, choices - does pool all three languages.',
      'The sample next to each figure counts the simulations that carried that field, not the whole table. A field that started being recorded later therefore has a smaller sample, and you can see it.'
    ],
    caveatTitle: 'What these numbers are not',
    caveat: [
      'They are not a survey. Somebody who lands on a financial independence simulator and chooses to save their scenario is not a sample of the population: they are people interested in the subject, probably savers, probably with more slack than average. The self-selection bias is large and cannot be corrected for.',
      'They are not real behaviour. They are decisions taken inside a model, with no consequences. People take more risk in a simulation than with their own money, which makes these figures useful for understanding preferences and intuitions and useless for predicting what anybody will actually do.',
      'They are not a recommendation. That most people pick a given withdrawal rate, portfolio or habit does not make it right for you. What is published here is what people choose, not what you should choose.'
    ],
    contributeTitle: 'Add a simulation',
    contributeBody:
      'Two of the tools have a button that saves the scenario into this public data, and the other three save the run when a score is submitted to their leaderboard. Both are opt-in, and neither stores anything personal.',
    readMore: 'Keep reading'
  },
  pt: {
    eyebrow: 'Dados próprios',
    title: 'O que dizem os dados dos simuladores',
    heading: 'O que dizem os dados dos simuladores',
    description:
      'Médias, percentagens e escolhas reais retiradas das simulações que os leitores da Compounding Journey guardaram: que taxa de retirada escolhem, que hábitos não largam e que carteira constroem.',
    intro:
      'Cada simulação que alguém decide guardar deixa um registo anónimo dos números que usou e do resultado que obteve. Esta página é a soma de todos eles e é recalculada em cada publicação do site.',
    units: { perMonth: '/mês', years: 'anos', year: 'ano' },
    runsLabel: 'simulações registadas',
    updatedLabel: 'Recalculado',
    insightsTitle: 'O que se pode afirmar hoje',
    insightsEmpty:
      'Ainda não há nenhuma medida com amostra suficiente para publicar. Quando houver, aparecerá aqui numa única frase por medida.',
    detailTitle: 'Simulador a simulador',
    lessonLabel: 'Porque importa',
    metricHeading: 'Medida',
    valueHeading: 'Valor',
    sampleHeading: 'Amostra',
    medianLabel: 'mediana',
    rangeLabel: 'intervalo',
    sampleUnit: 'simulações',
    notEnough:
      'Este simulador ainda não tem amostra suficiente para publicar médias. O que falta são simulações, não código: cada vez que alguém usa a ferramenta e decide guardar o seu cenário, esta secção fica mais perto de poder dizer algo.',
    tryLabel: 'Abrir o simulador',
    noDataTitle: 'Sem dados disponíveis neste momento',
    noDataBody:
      'A base de dados não respondeu durante a última publicação do site, por isso esta página aparece sem números. A explicação de cada simulador continua válida; os números voltam na próxima publicação.',
    methodTitle: 'Como isto é calculado',
    method: [
      'Cada número vem da tabela onde os simuladores guardam as simulações: os valores introduzidos e o resultado que saiu. Não há nomes, emails, identificadores pessoais nem cookies por trás destes números.',
      'Nenhuma medida é publicada antes de ter amostra suficiente. Cada uma tem o seu próprio mínimo e não aparece abaixo dele: uma "média" de três simulações descreveria a tarde de três pessoas, não um padrão.',
      'Os valores em dinheiro são calculados apenas dentro de um idioma. As três versões do site mostram três moedas diferentes para o mesmo campo, por isso uma média conjunta seria uma média de moedas. Tudo o que não tem unidade - percentagens, idades, anos, escolhas - soma os três idiomas.',
      'A amostra ao lado de cada número conta as simulações que traziam esse campo, não a tabela inteira. Um campo que começou a ser guardado mais tarde tem por isso uma amostra menor, e isso vê-se.'
    ],
    caveatTitle: 'O que estes números não são',
    caveat: [
      'Não são um inquérito. Quem chega a um simulador de independência financeira e decide guardar o seu cenário não é uma amostra da população: são pessoas interessadas no tema, provavelmente poupadoras e com mais margem do que a média. O viés de autosseleção é grande e não é corrigível.',
      'Não são comportamento real, mas decisões tomadas dentro de um modelo, sem consequências. As pessoas arriscam mais numa simulação do que com o seu dinheiro, o que torna estes números úteis para entender preferências e intuições e inúteis para prever o que alguém fará de facto.',
      'Não são uma recomendação. O facto de a maioria escolher uma taxa de retirada, uma carteira ou um hábito não a torna adequada para ti. Aqui publica-se o que as pessoas escolhem, não o que deves escolher.'
    ],
    contributeTitle: 'Acrescentar uma simulação',
    contributeBody:
      'Duas das ferramentas têm um botão para guardar o cenário nestes dados públicos, e as outras três guardam a simulação quando é enviada uma pontuação para a sua classificação. Em ambos os casos é voluntário e não se guarda nada pessoal.',
    readMore: 'Continuar a ler'
  }
};

/** --------------------------------------------------------- the simulators */

/**
 * One section per simulator, in the order the page renders them.
 *
 * `lesson` is the part that does not depend on the data. It says what question
 * this tool's numbers answer and why the answer is worth having, so a reader
 * who arrives while a sample is still thin still leaves with something - and so
 * the page is a teaching page rather than a dashboard.
 */
export const INSIGHT_SIMULATORS = [
  {
    id: 'monte-carlo-fire',
    page: (language) => `/${language}/simulators/monte-carlo-fire.html`,
    es: {
      name: 'Simulación Monte Carlo de la jubilación',
      lesson:
        'La regla del 4% se cita como si fuera una ley y es en realidad el resultado de un estudio sobre un mercado, un periodo y una cartera concretos. Este simulador deja que cada persona elija su tasa de retirada, su horizonte y su cartera, y le enseña en qué proporción de escenarios el dinero aguanta. Lo que se registra aquí es, por tanto, la tasa que la gente elige cuando puede elegir, y cuántos de esos planes sobreviven: la distancia entre las dos cifras es la lección.'
    },
    en: {
      name: 'Monte Carlo retirement simulation',
      lesson:
        'The 4% rule gets quoted as if it were a law, when it is the result of one study of one market, one period and one portfolio. This simulator lets each person choose their own withdrawal rate, horizon and portfolio, and shows what share of scenarios the money survives. What gets recorded is therefore the rate people pick when the choice is theirs, and how many of those plans hold up: the gap between the two figures is the lesson.'
    },
    pt: {
      name: 'Simulação Monte Carlo da reforma',
      lesson:
        'A regra dos 4% é citada como se fosse uma lei, quando é o resultado de um estudo sobre um mercado, um período e uma carteira concretos. Este simulador deixa cada pessoa escolher a sua taxa de retirada, o seu horizonte e a sua carteira, e mostra em que proporção de cenários o dinheiro aguenta. O que fica registado é a taxa que as pessoas escolhem quando a escolha é delas, e quantos desses planos sobrevivem: a distância entre os dois números é a lição.'
    }
  },
  {
    id: 'freedom-calendar',
    page: (language) => `/${language}/simulators/freedom-calendar.html`,
    es: {
      name: 'Calendario de la libertad financiera',
      lesson:
        'Casi todo el mundo acepta en abstracto que los gastos pequeños y repetidos cuestan años de trabajo. Este simulador pone la cifra: cada hábito lleva un deslizador y el resultado es la fecha en la que dejarías de necesitar tu sueldo. Los datos muestran algo que ninguna teoría predice bien, que es cuáles de esos hábitos la gente recorta enseguida y a cuáles no renuncia ni cuando ve el precio en años.'
    },
    en: {
      name: 'Freedom Calendar',
      lesson:
        'Almost everybody accepts in the abstract that small repeated spending costs years of work. This simulator puts the number on it: each habit has a slider, and the output is the date you would stop needing your salary. The data shows the thing no theory predicts well - which habits people cut immediately, and which they refuse to give up even after seeing the price in years.'
    },
    pt: {
      name: 'Calendário da liberdade financeira',
      lesson:
        'Quase todos aceitam em abstrato que as despesas pequenas e repetidas custam anos de trabalho. Este simulador põe o número: cada hábito tem um cursor e o resultado é a data em que deixarias de precisar do salário. Os dados mostram algo que nenhuma teoria prevê bem - quais desses hábitos as pessoas cortam de imediato e a quais não renunciam nem depois de ver o preço em anos.'
    }
  },
  {
    id: 'market-time-machine',
    page: (language) => `/${language}/simulators/market-time-machine.html`,
    es: {
      name: 'Máquina del tiempo del mercado',
      lesson:
        'Construir una cartera es fácil de opinar y difícil de comprobar, porque la comprobación tarda décadas. Aquí se construye una y se lanza sobre la historia real del mercado, con una cartera 60/40 al lado como referencia. Lo interesante del registro no es qué cartera gana, que depende del periodo, sino cuánta gente elige una mezcla propia frente a una plantilla y cuántas de esas mezclas propias baten a la referencia.'
    },
    en: {
      name: 'Market Time Machine',
      lesson:
        'Portfolio construction is easy to have opinions about and hard to check, because checking takes decades. Here you build one and run it through real market history with a 60/40 portfolio beside it as a benchmark. The interesting part of the record is not which portfolio wins - that depends on the period - but how many people build their own mix rather than take a template, and how many of those mixes beat the benchmark.'
    },
    pt: {
      name: 'Máquina do tempo do mercado',
      lesson:
        'Construir uma carteira é fácil de opinar e difícil de verificar, porque a verificação leva décadas. Aqui constrói-se uma e lança-se sobre a história real do mercado, com uma carteira 60/40 ao lado como referência. O interessante do registo não é que carteira ganha, que depende do período, mas quantas pessoas escolhem uma mistura própria em vez de um modelo e quantas dessas misturas batem a referência.'
    }
  },
  {
    id: 'passive-income-engine',
    page: (language) => `/${language}/simulators/passive-income-engine.html`,
    es: {
      name: 'Motor de ingresos pasivos',
      lesson:
        'La independencia financiera es un cruce de dos líneas: lo que gastas cada mes y lo que tu patrimonio produce cada mes. Este simulador obliga a mover las dos, porque cada mejora de estilo de vida sube la línea que hay que alcanzar. El registro guarda qué fuente de ingresos acaba pesando más al llegar al cruce, que es la pregunta que ninguna encuesta responde bien: qué elige la gente cuando puede elegir sin coste.'
    },
    en: {
      name: 'Passive income engine',
      lesson:
        'Financial independence is two lines crossing: what you spend each month and what your assets produce each month. This simulator forces you to move both, because every lifestyle upgrade raises the line you have to reach. The record keeps which income source ends up largest at the crossover - the question no survey answers well: what people reach for when the choice is free.'
    },
    pt: {
      name: 'Motor de rendimentos passivos',
      lesson:
        'A independência financeira é o cruzamento de duas linhas: o que gastas cada mês e o que o teu património produz cada mês. Este simulador obriga a mexer nas duas, porque cada melhoria de estilo de vida sobe a linha que é preciso alcançar. O registo guarda que fonte de rendimento acaba a pesar mais no cruzamento, que é a pergunta que nenhum inquérito responde bem: o que escolhem as pessoas quando a escolha não custa nada.'
    }
  },
  {
    id: 'simulator-hub',
    page: (language) => `/${language}/simulator.html`,
    es: {
      name: 'Simulador de decisiones financieras',
      lesson:
        'Este simulador no calcula nada: plantea situaciones y obliga a decidir, con dinero y satisfacción como marcadores. Es el más cercano a la psicología del dinero, y por eso el registro de las decisiones es el más revelador de todos. La reparto entre invertir, pagar deuda, gastar y asumir riesgo dice qué considera prudente esta audiencia, y el marcador de satisfacción dice cuánto está dispuesta a pagar por ello.'
    },
    en: {
      name: 'Financial decisions simulator',
      lesson:
        'This simulator calculates nothing: it poses situations and forces a decision, with money and happiness as the scoreboards. It is the one closest to the psychology of money, which is why the record of the decisions is the most revealing of the five. How the decisions split between investing, paying debt, spending and taking risk says what this audience considers prudent, and the happiness score says how much it is willing to pay for that.'
    },
    pt: {
      name: 'Simulador de decisões financeiras',
      lesson:
        'Este simulador não calcula nada: propõe situações e obriga a decidir, com dinheiro e satisfação como marcadores. É o mais próximo da psicologia do dinheiro, e por isso o registo das decisões é o mais revelador dos cinco. A divisão entre investir, pagar dívida, gastar e assumir risco diz o que esta audiência considera prudente, e o marcador de satisfação diz quanto está disposta a pagar por isso.'
    }
  }
];

/** ------------------------------------------------------------- the metrics */

/**
 * Every measure the page can publish.
 *
 * `kind` picks the computation (see scripts/simulator-insights.mjs), `format`
 * picks how the number is printed, and `minimum` is the sample below which the
 * measure is withheld. `takeaway` is the sentence the summary at the top of the
 * page prints, with {value} replaced by the formatted figure and {n} by the
 * sample; a measure with no takeaway appears in its simulator's table but is
 * not something to lead with.
 */
export const INSIGHT_METRICS = [
  /* --------------------------------------------------- monte-carlo-fire */
  {
    id: 'mc-withdrawal',
    simulator: 'monte-carlo-fire',
    kind: 'average',
    field: 'withdrawalBps',
    scale: 100,
    format: 'percent',
    minimum: 15,
    es: {
      label: 'Tasa de retirada elegida',
      takeaway: 'La tasa de retirada media que la gente elige aquí es del {value}, sobre {n} simulaciones. La regla que todo el mundo cita es el 4%.'
    },
    en: {
      label: 'Withdrawal rate chosen',
      takeaway: 'The average withdrawal rate people choose here is {value}, over {n} simulations. The rule everybody quotes is 4%.'
    },
    pt: {
      label: 'Taxa de retirada escolhida',
      takeaway: 'A taxa de retirada média que as pessoas escolhem aqui é de {value}, em {n} simulações. A regra que todos citam é 4%.'
    }
  },
  {
    id: 'mc-survived',
    simulator: 'monte-carlo-fire',
    kind: 'share',
    field: 'reached100',
    format: 'percent',
    minimum: 15,
    es: {
      label: 'Planes que aguantan todo el horizonte',
      takeaway: 'Solo el {value} de los planes construidos aquí llega al final de su horizonte sin quedarse sin dinero ({n} simulaciones).'
    },
    en: {
      label: 'Plans that last the whole horizon',
      takeaway: 'Just {value} of the plans built here reach the end of their horizon without running out of money ({n} simulations).'
    },
    pt: {
      label: 'Planos que aguentam todo o horizonte',
      takeaway: 'Apenas {value} dos planos construídos aqui chegam ao fim do seu horizonte sem ficar sem dinheiro ({n} simulações).'
    }
  },
  {
    id: 'mc-tactics',
    simulator: 'monte-carlo-fire',
    kind: 'shareSet',
    fields: ['tacticJob', 'tacticCutSpend', 'tacticCashBuffer', 'tacticGuardrails', 'tacticDownsize', 'tacticPension'],
    labels: 'tactics',
    format: 'percent',
    minimum: 15,
    es: {
      label: 'Defensas activadas ante una caída',
      takeaway: 'Ante una caída del mercado, la defensa que más gente activa es {value} ({n} simulaciones).'
    },
    en: {
      label: 'Defences switched on for a crash',
      takeaway: 'Facing a market crash, the defence most people switch on is {value} ({n} simulations).'
    },
    pt: {
      label: 'Defesas ativadas face a uma queda',
      takeaway: 'Face a uma queda do mercado, a defesa que mais gente ativa é {value} ({n} simulações).'
    }
  },
  {
    id: 'mc-allocation',
    simulator: 'monte-carlo-fire',
    kind: 'set',
    fields: ['pctStocks', 'pctBonds', 'pctCash'],
    labels: 'allocation',
    format: 'percent',
    minimum: 15,
    es: { label: 'Cartera media de jubilación' },
    en: { label: 'Average retirement portfolio' },
    pt: { label: 'Carteira média de reforma' }
  },
  {
    id: 'mc-horizon',
    simulator: 'monte-carlo-fire',
    kind: 'average',
    field: 'horizonYears',
    format: 'years',
    minimum: 15,
    es: { label: 'Horizonte planificado' },
    en: { label: 'Planned horizon' },
    pt: { label: 'Horizonte planeado' }
  },
  {
    id: 'mc-startage',
    simulator: 'monte-carlo-fire',
    kind: 'average',
    field: 'startAge',
    format: 'age',
    minimum: 15,
    es: { label: 'Edad al empezar el plan' },
    en: { label: 'Age at the start of the plan' },
    pt: { label: 'Idade no início do plano' }
  },
  {
    id: 'mc-sequence',
    simulator: 'monte-carlo-fire',
    kind: 'breakdown',
    field: 'marketSequence',
    labels: 'sequences',
    format: 'percent',
    minimum: 20,
    es: { label: 'Mercado contra el que se prueba el plan' },
    en: { label: 'Market the plan is tested against' },
    pt: { label: 'Mercado contra o qual o plano é testado' }
  },
  {
    id: 'mc-spending',
    simulator: 'monte-carlo-fire',
    kind: 'average',
    field: 'annualSpending',
    format: 'money',
    minimum: 15,
    es: { label: 'Gasto anual planificado' },
    en: { label: 'Planned annual spending' },
    pt: { label: 'Despesa anual planeada' }
  },

  /* -------------------------------------------------- freedom-calendar */
  {
    id: 'fc-habits',
    simulator: 'freedom-calendar',
    kind: 'set',
    fields: HABIT_FIELDS,
    labels: 'habitFields',
    format: 'percent',
    minimum: 12,
    es: {
      label: 'Cuánto se conserva de cada hábito',
      takeaway: 'El hábito que menos gente está dispuesta a recortar es {value}, incluso viendo cuántos años cuesta ({n} simulaciones).'
    },
    en: {
      label: 'How much of each habit is kept',
      takeaway: 'The habit people are least willing to cut is {value}, even after seeing how many years it costs ({n} simulations).'
    },
    pt: {
      label: 'Quanto se conserva de cada hábito',
      takeaway: 'O hábito que menos gente está disposta a cortar é {value}, mesmo depois de ver quantos anos custa ({n} simulações).'
    }
  },
  {
    id: 'fc-years',
    simulator: 'freedom-calendar',
    kind: 'average',
    field: '@score',
    scale: 100,
    format: 'years',
    minimum: 12,
    es: {
      label: 'Años que se adelanta la libertad',
      takeaway: 'Recortando solo hábitos pequeños, la simulación media adelanta su independencia financiera {value} ({n} simulaciones).'
    },
    en: {
      label: 'Years freedom is pulled forward',
      takeaway: 'By cutting small habits alone, the average simulation pulls financial independence forward by {value} ({n} simulations).'
    },
    pt: {
      label: 'Anos que a liberdade é antecipada',
      takeaway: 'Cortando apenas hábitos pequenos, a simulação média antecipa a sua independência financeira em {value} ({n} simulações).'
    }
  },
  {
    id: 'fc-monthly-saved',
    simulator: 'freedom-calendar',
    kind: 'average',
    field: 'monthlySaved',
    format: 'money-month',
    minimum: 12,
    es: { label: 'Ahorro mensual encontrado' },
    en: { label: 'Monthly saving found' },
    pt: { label: 'Poupança mensal encontrada' }
  },
  {
    id: 'fc-top-habit',
    simulator: 'freedom-calendar',
    kind: 'breakdown',
    field: 'topHabit',
    labels: 'habits',
    format: 'percent',
    minimum: 20,
    es: { label: 'Hábito con el mayor recorte' },
    en: { label: 'Habit with the biggest cut' },
    pt: { label: 'Hábito com o maior corte' }
  },
  {
    id: 'fc-freedom-age',
    simulator: 'freedom-calendar',
    kind: 'average',
    field: 'optimizedFreedomAge',
    scale: 100,
    format: 'age',
    minimum: 12,
    es: { label: 'Edad de libertad después de recortar' },
    en: { label: 'Freedom age after the cuts' },
    pt: { label: 'Idade de liberdade depois dos cortes' }
  },
  {
    id: 'fc-baseline-age',
    simulator: 'freedom-calendar',
    kind: 'average',
    field: 'baselineFreedomAge',
    scale: 100,
    format: 'age',
    minimum: 12,
    es: { label: 'Edad de libertad sin cambiar nada' },
    en: { label: 'Freedom age changing nothing' },
    pt: { label: 'Idade de liberdade sem mudar nada' }
  },
  {
    id: 'fc-return',
    simulator: 'freedom-calendar',
    kind: 'average',
    field: 'realReturnBps',
    scale: 100,
    format: 'percent',
    minimum: 12,
    es: { label: 'Rentabilidad real que se da por supuesta' },
    en: { label: 'Real return people assume' },
    pt: { label: 'Rentabilidade real que se assume' }
  },
  {
    id: 'fc-swr',
    simulator: 'freedom-calendar',
    kind: 'average',
    field: 'safeWithdrawalBps',
    scale: 100,
    format: 'percent',
    minimum: 12,
    es: { label: 'Tasa de retirada que se da por segura' },
    en: { label: 'Withdrawal rate people call safe' },
    pt: { label: 'Taxa de retirada que se considera segura' }
  },

  /* ------------------------------------------------ market-time-machine */
  {
    id: 'mtm-beat',
    simulator: 'market-time-machine',
    kind: 'reached',
    field: 'finalValue',
    against: 'benchmarkValue',
    format: 'percent',
    minimum: 15,
    es: {
      label: 'Carteras que baten a la 60/40',
      takeaway: 'El {value} de las carteras construidas aquí acaba por encima de una 60/40 en el mismo periodo ({n} simulaciones).'
    },
    en: {
      label: 'Portfolios that beat 60/40',
      takeaway: '{value} of the portfolios built here end up above a 60/40 over the same period ({n} simulations).'
    },
    pt: {
      label: 'Carteiras que batem a 60/40',
      takeaway: '{value} das carteiras construídas aqui terminam acima de uma 60/40 no mesmo período ({n} simulações).'
    }
  },
  {
    id: 'mtm-allocation',
    simulator: 'market-time-machine',
    kind: 'set',
    fields: ['pctStocks', 'pctBonds', 'pctReits', 'pctGold', 'pctCash'],
    labels: 'allocation',
    format: 'percent',
    minimum: 15,
    es: {
      label: 'Cartera media construida',
      takeaway: 'La cartera media que se construye aquí dedica su mayor peso a {value} ({n} simulaciones).'
    },
    en: {
      label: 'Average portfolio built',
      takeaway: 'The average portfolio built here puts its largest weight in {value} ({n} simulations).'
    },
    pt: {
      label: 'Carteira média construída',
      takeaway: 'A carteira média construída aqui dedica o maior peso a {value} ({n} simulações).'
    }
  },
  {
    id: 'mtm-cagr',
    simulator: 'market-time-machine',
    kind: 'average',
    field: '@score',
    offset: 10000,
    scale: 100,
    format: 'percent',
    minimum: 15,
    es: { label: 'Rentabilidad anualizada obtenida' },
    en: { label: 'Annualised return achieved' },
    pt: { label: 'Rentabilidade anualizada obtida' }
  },
  {
    id: 'mtm-drawdown',
    simulator: 'market-time-machine',
    kind: 'average',
    field: 'maxDrawdownBps',
    scale: 100,
    format: 'percent',
    minimum: 15,
    es: { label: 'Peor caída soportada' },
    en: { label: 'Worst drawdown endured' },
    pt: { label: 'Pior queda suportada' }
  },
  {
    id: 'mtm-preset',
    simulator: 'market-time-machine',
    kind: 'breakdown',
    field: 'preset',
    labels: 'presets',
    format: 'percent',
    minimum: 20,
    es: { label: 'Punto de partida de la cartera' },
    en: { label: 'Starting point for the portfolio' },
    pt: { label: 'Ponto de partida da carteira' }
  },
  {
    id: 'mtm-years',
    simulator: 'market-time-machine',
    kind: 'average',
    field: 'yearsElapsed',
    format: 'years',
    minimum: 15,
    es: { label: 'Periodo simulado' },
    en: { label: 'Period simulated' },
    pt: { label: 'Período simulado' }
  },

  /* ----------------------------------------------- passive-income-engine */
  {
    id: 'pie-engine',
    simulator: 'passive-income-engine',
    kind: 'breakdown',
    field: 'topEngine',
    labels: 'engines',
    format: 'percent',
    minimum: 20,
    es: {
      label: 'Fuente de ingresos dominante al llegar al cruce',
      takeaway: 'Cuando se puede elegir sin coste, la fuente de ingresos que acaba pesando más es {value} ({n} simulaciones).'
    },
    en: {
      label: 'Income source that dominates at the crossover',
      takeaway: 'When the choice costs nothing, the income source that ends up largest is {value} ({n} simulations).'
    },
    pt: {
      label: 'Fonte de rendimento dominante no cruzamento',
      takeaway: 'Quando a escolha não custa nada, a fonte de rendimento que acaba a pesar mais é {value} ({n} simulações).'
    }
  },
  {
    id: 'pie-crossover',
    simulator: 'passive-income-engine',
    kind: 'average',
    field: '@score',
    scale: 12,
    format: 'years',
    minimum: 15,
    es: {
      label: 'Tiempo hasta el cruce',
      takeaway: 'La simulación media tarda {value} en que sus ingresos pasivos cubran sus gastos ({n} simulaciones).'
    },
    en: {
      label: 'Time to the crossover',
      takeaway: 'The average simulation takes {value} for passive income to cover its expenses ({n} simulations).'
    },
    pt: {
      label: 'Tempo até ao cruzamento',
      takeaway: 'A simulação média leva {value} até os rendimentos passivos cobrirem as despesas ({n} simulações).'
    }
  },
  {
    id: 'pie-lifestyle',
    simulator: 'passive-income-engine',
    kind: 'breakdown',
    field: 'lifestyle',
    labels: 'lifestyle',
    format: 'percent',
    minimum: 20,
    es: { label: 'Nivel de vida elegido' },
    en: { label: 'Lifestyle level chosen' },
    pt: { label: 'Nível de vida escolhido' }
  },
  {
    id: 'pie-housing',
    simulator: 'passive-income-engine',
    kind: 'breakdown',
    field: 'housing',
    labels: 'housing',
    format: 'percent',
    minimum: 20,
    es: { label: 'Vivienda elegida' },
    en: { label: 'Housing chosen' },
    pt: { label: 'Habitação escolhida' }
  },
  {
    id: 'pie-expenses',
    simulator: 'passive-income-engine',
    kind: 'average',
    field: 'monthlyExpenses',
    format: 'money-month',
    minimum: 15,
    es: { label: 'Gasto mensual al llegar al cruce' },
    en: { label: 'Monthly spending at the crossover' },
    pt: { label: 'Despesa mensal no cruzamento' }
  },
  {
    id: 'pie-kid',
    simulator: 'passive-income-engine',
    kind: 'share',
    field: 'hadKid',
    format: 'percent',
    minimum: 20,
    es: { label: 'Simulaciones que incluyen tener hijos' },
    en: { label: 'Simulations that include having children' },
    pt: { label: 'Simulações que incluem ter filhos' }
  },

  /* ------------------------------------------------------- simulator-hub */
  {
    id: 'hub-decisions',
    simulator: 'simulator-hub',
    kind: 'set',
    fields: ['investingPct', 'debtPct', 'spendingPct', 'taxPct', 'riskPct'],
    labels: 'categories',
    format: 'percent',
    minimum: 15,
    es: {
      label: 'A qué se dedican las decisiones',
      takeaway: 'De todas las decisiones que se toman en el simulador, la mayor parte va a {value} ({n} partidas).'
    },
    en: {
      label: 'Where the decisions go',
      takeaway: 'Of all the decisions taken in the simulator, the largest share goes to {value} ({n} runs).'
    },
    pt: {
      label: 'Para onde vão as decisões',
      takeaway: 'De todas as decisões tomadas no simulador, a maior parte vai para {value} ({n} partidas).'
    }
  },
  {
    id: 'hub-happiness',
    simulator: 'simulator-hub',
    kind: 'average',
    field: 'happiness',
    format: 'percent',
    minimum: 15,
    es: { label: 'Satisfacción con la que se termina' },
    en: { label: 'Happiness people finish with' },
    pt: { label: 'Satisfação com que se termina' }
  },
  {
    id: 'hub-cashflow',
    simulator: 'simulator-hub',
    kind: 'average',
    field: 'monthlyCashFlow',
    format: 'money-month',
    minimum: 15,
    es: { label: 'Flujo de caja mensual al terminar' },
    en: { label: 'Monthly cash flow at the end' },
    pt: { label: 'Fluxo de caixa mensal no fim' }
  }
];
