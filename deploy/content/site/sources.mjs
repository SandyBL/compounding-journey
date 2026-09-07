/**
 * The references behind the articles, and the one place they are written down.
 *
 * Until now no article on this site cited anything. Every external link in a
 * journal page was a share button, which meant a piece asserting that the 4 %
 * rule comes from a study of one market over one period cited no study, and a
 * piece about present bias named a bias with no paper behind it. For a site
 * about money that is not a stylistic gap: it is the difference between a
 * reader being asked to trust the author and being shown where to check.
 *
 * Two structures rather than one, and the split is the point.
 *
 * SOURCE_LIBRARY holds the bibliography. A source is language-neutral - a
 * paper in Econometrica has one set of authors, one year and one DOI whatever
 * language the citing article is written in - so it is written once and
 * referenced by id. That also means a source cited by four articles cannot
 * drift into four slightly different spellings of the same reference, which is
 * how a bibliography maintained per article always ends up.
 *
 * ARTICLE_SOURCES maps a translation key - not a slug - to the references that
 * article rests on. The key rather than the slug because the Spanish, English
 * and Portuguese versions of a piece are the same piece and rest on the same
 * evidence, and keying by slug would be three lists to keep in step.
 *
 * `note` is the only translated part, and the only part a reader really needs:
 * it says which claim in the article this source supports. A bare list of
 * references at the foot of an article is decoration; a list where each line
 * says what it is doing there is checkable. Keep each note to one clause.
 *
 * `url` is optional and deliberately so. Bengen's 1994 paper and the Trinity
 * study were published in journals with no free stable landing page, and a
 * citation with a full reference and no link is honest, whereas a citation
 * pointed at whichever aggregator happens to host a PDF this year is a dead
 * link waiting to happen. Every URL that is here resolved when it was added:
 * DOIs through doi.org, everything else a live page on the publisher's own
 * domain.
 *
 * scripts/generate-blog-pages.mjs renders the block and fails the build on a
 * reference to an id that does not exist, on a source missing a field, and on
 * a note missing a language - so a half-written citation cannot ship as a
 * footnote reading "undefined".
 */

/** ------------------------------------------------------------- the library */

export const SOURCE_LIBRARY = {
  'kahneman-tversky-1979': {
    authors: 'Kahneman, D. & Tversky, A.',
    year: '1979',
    title: 'Prospect Theory: An Analysis of Decision under Risk',
    publication: 'Econometrica, 47(2), 263–291',
    url: 'https://doi.org/10.2307/1914185'
  },
  'laibson-1997': {
    authors: 'Laibson, D.',
    year: '1997',
    title: 'Golden Eggs and Hyperbolic Discounting',
    publication: 'The Quarterly Journal of Economics, 112(2), 443–478',
    url: 'https://doi.org/10.1162/003355397555253'
  },
  'odonoghue-rabin-1999': {
    authors: "O'Donoghue, T. & Rabin, M.",
    year: '1999',
    title: 'Doing It Now or Later',
    publication: 'American Economic Review, 89(1), 103–124',
    url: 'https://doi.org/10.1257/aer.89.1.103'
  },
  'barberis-2013': {
    authors: 'Barberis, N. C.',
    year: '2013',
    title: 'Thirty Years of Prospect Theory in Economics: A Review and Assessment',
    publication: 'Journal of Economic Perspectives, 27(1), 173–196',
    url: 'https://doi.org/10.1257/jep.27.1.173'
  },
  'thaler-benartzi-2004': {
    authors: 'Thaler, R. H. & Benartzi, S.',
    year: '2004',
    title: 'Save More Tomorrow: Using Behavioral Economics to Increase Employee Saving',
    publication: 'Journal of Political Economy, 112(S1), S164–S187',
    url: 'https://doi.org/10.1086/380085'
  },
  'madrian-shea-2001': {
    authors: 'Madrian, B. C. & Shea, D. F.',
    year: '2001',
    title: 'The Power of Suggestion: Inertia in 401(k) Participation and Savings Behavior',
    publication: 'The Quarterly Journal of Economics, 116(4), 1149–1187',
    url: 'https://doi.org/10.1162/003355301753265543'
  },
  'lally-2010': {
    authors: 'Lally, P., van Jaarsveld, C. H. M., Potts, H. W. W. & Wardle, J.',
    year: '2010',
    title: 'How are habits formed: Modelling habit formation in the real world',
    publication: 'European Journal of Social Psychology, 40(6), 998–1009',
    url: 'https://doi.org/10.1002/ejsp.674'
  },
  'wood-runger-2016': {
    authors: 'Wood, W. & Rünger, D.',
    year: '2016',
    title: 'Psychology of Habit',
    publication: 'Annual Review of Psychology, 67, 289–314',
    url: 'https://doi.org/10.1146/annurev-psych-122414-033417'
  },
  'gal-mcshane-2012': {
    authors: 'Gal, D. & McShane, B. B.',
    year: '2012',
    title: 'Can Small Victories Help Win the War? Evidence from Consumer Debt Management',
    publication: 'Journal of Marketing Research, 49(4), 487–501',
    url: 'https://doi.org/10.1509/jmr.11.0272'
  },
  'amar-2011': {
    authors: 'Amar, M., Ariely, D., Ayal, S., Cryder, C. E. & Rick, S. I.',
    year: '2011',
    title: 'Winning the Battle but Losing the War: The Psychology of Debt Management',
    publication: 'Journal of Marketing Research, 48(SPL), S38–S50',
    url: 'https://doi.org/10.1509/jmkr.48.SPL.S38'
  },
  'dunn-gilbert-wilson-2011': {
    authors: 'Dunn, E. W., Gilbert, D. T. & Wilson, T. D.',
    year: '2011',
    title: "If money doesn't make you happy, then you probably aren't spending it right",
    publication: 'Journal of Consumer Psychology, 21(2), 115–125',
    url: 'https://doi.org/10.1016/j.jcps.2011.02.002'
  },
  'kahneman-deaton-2010': {
    authors: 'Kahneman, D. & Deaton, A.',
    year: '2010',
    title: 'High income improves evaluation of life but not emotional well-being',
    publication: 'PNAS, 107(38), 16489–16493',
    url: 'https://doi.org/10.1073/pnas.1011492107'
  },
  'sharpe-1991': {
    authors: 'Sharpe, W. F.',
    year: '1991',
    title: 'The Arithmetic of Active Management',
    publication: 'Financial Analysts Journal, 47(1), 7–9',
    url: 'https://doi.org/10.2469/faj.v47.n1.7'
  },
  'barber-odean-2000': {
    authors: 'Barber, B. M. & Odean, T.',
    year: '2000',
    title: 'Trading Is Hazardous to Your Wealth: The Common Stock Investment Performance of Individual Investors',
    publication: 'The Journal of Finance, 55(2), 773–806',
    url: 'https://doi.org/10.1111/0022-1082.00226'
  },
  'benartzi-thaler-1995': {
    authors: 'Benartzi, S. & Thaler, R. H.',
    year: '1995',
    title: 'Myopic Loss Aversion and the Equity Premium Puzzle',
    publication: 'The Quarterly Journal of Economics, 110(1), 73–92',
    url: 'https://doi.org/10.2307/2118511'
  },
  'statman-1987': {
    authors: 'Statman, M.',
    year: '1987',
    title: 'How Many Stocks Make a Diversified Portfolio?',
    publication: 'Journal of Financial and Quantitative Analysis, 22(3), 353–363',
    url: 'https://doi.org/10.2307/2330969'
  },

  // The two retirement-withdrawal papers everything about the 4 % rule
  // descends from. Both were published in practitioner journals that predate
  // DOIs and neither has a free stable landing page, so both are cited without
  // one - see the note on `url` at the top of this file.
  'bengen-1994': {
    authors: 'Bengen, W. P.',
    year: '1994',
    title: 'Determining Withdrawal Rates Using Historical Data',
    publication: 'Journal of Financial Planning, 7(4), 171–180'
  },
  'trinity-1998': {
    authors: 'Cooley, P. L., Hubbard, C. M. & Walz, D. T.',
    year: '1998',
    title: 'Retirement Savings: Choosing a Withdrawal Rate That Is Sustainable',
    publication: 'AAII Journal, 20(2), 16–21'
  },
  'kiyosaki-1997': {
    authors: 'Kiyosaki, R. T.',
    year: '1997',
    title: 'Rich Dad, Poor Dad',
    publication: 'Warner Books'
  },

  // Data rather than argument. These are the primary series the articles quote
  // numbers from, linked to the institution that publishes them rather than to
  // a chart somebody drew from them.
  'shiller-data': {
    authors: 'Shiller, R. J.',
    title: 'US stock market data since 1871 (prices, dividends, earnings, CPI, CAPE)',
    publication: 'Yale University',
    url: 'https://shillerdata.com/'
  },
  'sec-compound': {
    authors: 'U.S. Securities and Exchange Commission',
    title: 'Compound interest calculator',
    publication: 'investor.gov',
    url: 'https://www.investor.gov/financial-tools-calculators/calculators/compound-interest-calculator'
  },
  'eurostat-hicp': {
    authors: 'Eurostat',
    title: 'Harmonised Index of Consumer Prices (HICP)',
    publication: 'European Commission',
    url: 'https://ec.europa.eu/eurostat/web/hicp'
  },
  'ine-ipc': {
    authors: 'Instituto Nacional de Estadística',
    title: 'Índice de Precios de Consumo (IPC)',
    publication: 'INE, España',
    url: 'https://www.ine.es/prensa/ipc_tabla.htm'
  },
  'ibge-sidra': {
    authors: 'Instituto Brasileiro de Geografia e Estatística',
    title: 'Sistema IBGE de Recuperação Automática (SIDRA) — IPCA',
    publication: 'IBGE, Brasil',
    url: 'https://sidra.ibge.gov.br/'
  },
  'oecd-data': {
    authors: 'OECD',
    title: 'Household savings and household disposable income',
    publication: 'OECD Data Explorer',
    url: 'https://data-explorer.oecd.org/'
  },
  'nareit': {
    authors: 'Nareit',
    title: 'REIT industry returns and dividend data',
    publication: 'Nareit',
    url: 'https://www.reit.com/'
  },
  'bde': {
    authors: 'Banco de España',
    title: 'Tipos de interés y estadísticas de crédito',
    publication: 'Banco de España',
    url: 'https://www.bde.es/'
  },
  'bcb': {
    authors: 'Banco Central do Brasil',
    title: 'Taxas de juros e estatísticas de crédito',
    publication: 'Banco Central do Brasil',
    url: 'https://www.bcb.gov.br/'
  }
};

/** ------------------------------------------------- what each article rests on */

export const ARTICLE_SOURCES = {
  'why-knowing-the-maths-is-not-enough': [
    {
      id: 'kahneman-tversky-1979',
      note: {
        es: 'El origen de la aversión a la pérdida: perder pesa más que ganar lo mismo.',
        en: 'The origin of loss aversion: a loss weighs more than a gain of the same size.',
        pt: 'A origem da aversão à perda: perder pesa mais do que ganhar o mesmo.'
      }
    },
    {
      id: 'laibson-1997',
      note: {
        es: 'El modelo formal del sesgo del presente y de por qué los compromisos previos funcionan.',
        en: 'The formal model of present bias, and why commitment devices work.',
        pt: 'O modelo formal do viés do presente e de por que compromissos antecipados funcionam.'
      }
    },
    {
      id: 'odonoghue-rabin-1999',
      note: {
        es: 'Por qué la distancia entre estar de acuerdo y actuar no se cierra con más información.',
        en: 'Why the gap between agreeing and acting is not closed by more information.',
        pt: 'Por que a distância entre concordar e agir não se fecha com mais informação.'
      }
    },
    {
      id: 'barberis-2013',
      note: {
        es: 'Treinta años de evidencia posterior, con lo que se sostuvo y lo que no.',
        en: 'Thirty years of later evidence, including what held up and what did not.',
        pt: 'Trinta anos de evidência posterior, com o que se sustentou e o que não.'
      }
    }
  ],

  'sequence-of-returns-risk': [
    {
      id: 'bengen-1994',
      note: {
        es: 'El artículo del que sale la regla del 4 %: un mercado, un periodo y una cartera concretos.',
        en: 'The paper the 4 % rule comes from: one market, one period, one portfolio.',
        pt: 'O artigo de onde vem a regra dos 4 %: um mercado, um período e uma carteira concretos.'
      }
    },
    {
      id: 'trinity-1998',
      note: {
        es: 'El estudio Trinity, que probó tasas y horizontes distintos sobre series históricas.',
        en: 'The Trinity study, which tested different rates and horizons against historical series.',
        pt: 'O estudo Trinity, que testou taxas e horizontes diferentes sobre séries históricas.'
      }
    },
    {
      id: 'shiller-data',
      note: {
        es: 'La serie histórica de precios, dividendos e inflación con la que se comprueba el orden de los años.',
        en: 'The historical price, dividend and inflation series the order of years is checked against.',
        pt: 'A série histórica de preços, dividendos e inflação com a qual se verifica a ordem dos anos.'
      }
    }
  ],

  'century-of-market-history': [
    {
      id: 'shiller-data',
      note: {
        es: 'Datos mensuales desde 1871: la fuente de la profundidad y la duración de las caídas.',
        en: 'Monthly data since 1871: the source for how deep the falls went and how long they lasted.',
        pt: 'Dados mensais desde 1871: a fonte da profundidade e da duração das quedas.'
      }
    },
    {
      id: 'benartzi-thaler-1995',
      note: {
        es: 'Por qué mirar la cartera con más frecuencia empeora la decisión sin cambiar el mercado.',
        en: 'Why checking the portfolio more often makes the decision worse without changing the market.',
        pt: 'Por que olhar a carteira com mais frequência piora a decisão sem mudar o mercado.'
      }
    },
    {
      id: 'statman-1987',
      note: {
        es: 'Cuántas posiciones hacen falta para que la diversificación deje de mejorar mucho.',
        en: 'How many holdings it takes before diversification stops improving much.',
        pt: 'Quantas posições são necessárias para que a diversificação pare de melhorar muito.'
      }
    }
  ],

  'savings-rate-sets-the-date': [
    {
      id: 'bengen-1994',
      note: {
        es: 'De dónde sale la tasa de retirada que convierte un patrimonio en una fecha.',
        en: 'Where the withdrawal rate that turns a portfolio into a date comes from.',
        pt: 'De onde vem a taxa de retirada que transforma um patrimônio em uma data.'
      }
    },
    {
      id: 'oecd-data',
      note: {
        es: 'Tasas de ahorro de los hogares por país, para situar la tuya en algo real.',
        en: 'Household savings rates by country, to place your own against something real.',
        pt: 'Taxas de poupança das famílias por país, para situar a sua em algo real.'
      }
    },
    {
      id: 'sec-compound',
      note: {
        es: 'Para reproducir la aritmética del artículo con tus propios números.',
        en: 'To reproduce the arithmetic in the article with your own numbers.',
        pt: 'Para reproduzir a aritmética do artigo com os seus próprios números.'
      }
    }
  ],

  'four-passive-income-engines': [
    {
      id: 'nareit',
      note: {
        es: 'Rentabilidades y dividendos históricos del sector inmobiliario cotizado.',
        en: 'Historical returns and dividends for listed real estate.',
        pt: 'Rentabilidades e dividendos históricos do setor imobiliário listado.'
      }
    },
    {
      id: 'sharpe-1991',
      note: {
        es: 'Por qué las comisiones se restan del resultado antes que cualquier habilidad.',
        en: 'Why fees come out of the result before any skill does.',
        pt: 'Por que as taxas saem do resultado antes de qualquer habilidade.'
      }
    },
    {
      id: 'bde',
      note: {
        es: 'Tipos de interés vigentes, que son lo que fija el rendimiento de una escalera de bonos.',
        en: 'Current interest rates, which are what set the yield on a bond ladder.',
        pt: 'Taxas de juros vigentes, que são o que define o rendimento de uma escada de títulos.'
      }
    },
    {
      id: 'bcb',
      note: {
        es: 'El equivalente brasileño, porque la misma escalera rinde otra cosa en otro país.',
        en: 'The Brazilian equivalent, because the same ladder yields something else in another country.',
        pt: 'O equivalente brasileiro, porque a mesma escada rende outra coisa em outro país.'
      }
    }
  ],

  'investing-101-beginners-guide-to-growing-wealth': [
    {
      id: 'sec-compound',
      note: {
        es: 'Calculadora del regulador estadounidense, útil para comprobar cualquier proyección.',
        en: "The US regulator's own calculator, useful for checking any projection.",
        pt: 'Calculadora do regulador norte-americano, útil para verificar qualquer projeção.'
      }
    },
    {
      id: 'sharpe-1991',
      note: {
        es: 'La aritmética que explica por qué el coste importa más que la selección de valores.',
        en: 'The arithmetic behind why cost matters more than stock picking.',
        pt: 'A aritmética que explica por que o custo importa mais do que a seleção de ativos.'
      }
    },
    {
      id: 'barber-odean-2000',
      note: {
        es: 'Qué le pasa a la rentabilidad de un inversor particular cuando opera más.',
        en: "What happens to an individual investor's return when they trade more.",
        pt: 'O que acontece com a rentabilidade de um investidor individual quando ele opera mais.'
      }
    },
    {
      id: 'statman-1987',
      note: {
        es: 'Cuánta diversificación es suficiente, con un número en lugar de una intuición.',
        en: 'How much diversification is enough, with a number instead of an intuition.',
        pt: 'Quanta diversificação é suficiente, com um número em vez de uma intuição.'
      }
    }
  ],

  'debt-management-how-to-get-out-and-stay-out-of-debt': [
    {
      id: 'gal-mcshane-2012',
      note: {
        es: 'La evidencia a favor de la bola de nieve: cerrar deudas pequeñas primero sostiene el plan.',
        en: 'The evidence for the snowball: closing small debts first keeps people in the plan.',
        pt: 'A evidência a favor da bola de neve: fechar dívidas pequenas primeiro sustenta o plano.'
      }
    },
    {
      id: 'amar-2011',
      note: {
        es: 'Y el coste de ese atajo: la gente paga intereses de más por cerrar cuentas.',
        en: 'And what that shortcut costs: people pay extra interest to close accounts.',
        pt: 'E o custo desse atalho: as pessoas pagam juros a mais para fechar contas.'
      }
    },
    {
      id: 'bde',
      note: {
        es: 'Tipos medios de tarjetas y préstamos al consumo, para poner cifras al orden de pago.',
        en: 'Average card and consumer-loan rates, to put figures on the payoff order.',
        pt: 'Taxas médias de cartões e crédito ao consumo, para dar números à ordem de pagamento.'
      }
    }
  ],

  'pay-yourself-first-power-of-saving': [
    {
      id: 'thaler-benartzi-2004',
      note: {
        es: 'El experimento que muestra que automatizar el ahorro sube la tasa más que convencer.',
        en: 'The experiment showing that automating saving raises the rate more than persuasion does.',
        pt: 'O experimento que mostra que automatizar a poupança aumenta a taxa mais do que convencer.'
      }
    },
    {
      id: 'madrian-shea-2001',
      note: {
        es: 'La fuerza de la opción por defecto: la inercia decide más que la intención.',
        en: 'The power of the default: inertia decides more than intention does.',
        pt: 'A força da opção padrão: a inércia decide mais do que a intenção.'
      }
    },
    {
      id: 'sec-compound',
      note: {
        es: 'Para ver qué hace un porcentaje fijo sostenido durante veinte años.',
        en: 'To see what a fixed percentage sustained for twenty years actually does.',
        pt: 'Para ver o que faz uma porcentagem fixa mantida por vinte anos.'
      }
    }
  ],

  'spending-with-purpose-align-money-values': [
    {
      id: 'dunn-gilbert-wilson-2011',
      note: {
        es: 'Ocho principios sobre qué tipo de gasto sí cambia el bienestar declarado.',
        en: 'Eight principles on which kinds of spending actually move reported well-being.',
        pt: 'Oito princípios sobre que tipo de gasto realmente muda o bem-estar declarado.'
      }
    },
    {
      id: 'kahneman-deaton-2010',
      note: {
        es: 'Dónde deja de crecer la satisfacción con el ingreso, y en qué medida exactamente.',
        en: 'Where satisfaction stops rising with income, and on which measure exactly.',
        pt: 'Onde a satisfação para de crescer com a renda, e em qual medida exatamente.'
      }
    }
  ],

  'building-wealth-good-financial-habits': [
    {
      id: 'kiyosaki-1997',
      note: {
        es: 'El libro que este artículo resume, citado para que puedas leer el original.',
        en: 'The book this article summarises, cited so you can read the original.',
        pt: 'O livro que este artigo resume, citado para que você possa ler o original.'
      }
    },
    {
      id: 'wood-runger-2016',
      note: {
        es: 'Qué dice la investigación sobre hábitos, que es menos motivacional que el libro.',
        en: 'What habit research actually says, which is less motivational than the book.',
        pt: 'O que a pesquisa sobre hábitos diz, que é menos motivacional do que o livro.'
      }
    },
    {
      id: 'amar-2011',
      note: {
        es: 'Un contrapeso sobre la deuda: la distinción buena/mala es más borrosa en la práctica.',
        en: 'A counterweight on debt: the good/bad distinction is blurrier in practice.',
        pt: 'Um contrapeso sobre dívida: a distinção boa/má é mais difusa na prática.'
      }
    }
  ],

  'foundations-personal-finance-controlling-expenses': [
    {
      id: 'oecd-data',
      note: {
        es: 'Ahorro y renta disponible de los hogares, para comparar tu punto de partida.',
        en: 'Household savings and disposable income, to compare your starting point.',
        pt: 'Poupança e renda disponível das famílias, para comparar o seu ponto de partida.'
      }
    },
    {
      id: 'lally-2010',
      note: {
        es: 'Cuánto tarda de verdad en instalarse un hábito, con la dispersión incluida.',
        en: 'How long a habit actually takes to install, spread included.',
        pt: 'Quanto tempo um hábito realmente leva para se instalar, com a dispersão incluída.'
      }
    },
    {
      id: 'eurostat-hicp',
      note: {
        es: 'La inflación oficial que se come el presupuesto que no se revisa.',
        en: 'The official inflation that eats a budget nobody revisits.',
        pt: 'A inflação oficial que consome o orçamento que não é revisado.'
      }
    }
  ],

  'putting-your-money-to-work-make-money-while-you-sleep': [
    {
      id: 'sec-compound',
      note: {
        es: 'Para reproducir cualquier cifra de crecimiento compuesto del artículo.',
        en: 'To reproduce any compound-growth figure in the article.',
        pt: 'Para reproduzir qualquer número de crescimento composto do artigo.'
      }
    },
    {
      id: 'eurostat-hicp',
      note: {
        es: 'La inflación de la zona euro, que es contra lo que compite el dinero quieto.',
        en: 'Euro-area inflation, which is what idle money is competing against.',
        pt: 'A inflação da zona do euro, que é contra o que o dinheiro parado compete.'
      }
    },
    {
      id: 'ine-ipc',
      note: {
        es: 'El IPC español, si tu gasto está en euros y en España.',
        en: 'The Spanish CPI, if your spending is in euros and in Spain.',
        pt: 'O IPC espanhol, se o seu gasto está em euros e na Espanha.'
      }
    },
    {
      id: 'ibge-sidra',
      note: {
        es: 'El IPCA brasileño, porque la inflación que te importa es la de tu moneda.',
        en: 'The Brazilian IPCA, because the inflation that matters is your own currency’s.',
        pt: 'O IPCA brasileiro, porque a inflação que importa é a da sua moeda.'
      }
    }
  ],

  'slow-money-system': [
    {
      id: 'lally-2010',
      note: {
        es: 'La base del ritmo semanal: repetición en un contexto estable, no fuerza de voluntad.',
        en: 'The basis for the weekly rhythm: repetition in a stable context, not willpower.',
        pt: 'A base do ritmo semanal: repetição em um contexto estável, não força de vontade.'
      }
    },
    {
      id: 'wood-runger-2016',
      note: {
        es: 'Por qué un sistema aburrido gana a una decisión heroica repetida.',
        en: 'Why a boring system beats a heroic decision repeated.',
        pt: 'Por que um sistema chato vence uma decisão heroica repetida.'
      }
    },
    {
      id: 'barber-odean-2000',
      note: {
        es: 'La evidencia de que hacer más cosas con la cartera suele restar, no sumar.',
        en: 'The evidence that doing more with a portfolio usually subtracts rather than adds.',
        pt: 'A evidência de que fazer mais coisas com a carteira geralmente subtrai, não soma.'
      }
    }
  ]
};
