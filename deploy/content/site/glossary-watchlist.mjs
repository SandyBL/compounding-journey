/**
 * Terms that deserve a glossary entry but do not have one yet, each with a
 * ready-written draft in all three languages.
 *
 * scripts/check-glossary-coverage.mjs reads every published article, matches
 * its prose against the glossary and against this list, and reports the terms
 * an article uses that the glossary cannot explain. For a term listed here, it
 * prints the draft below as a paste-ready `content/site/glossary.mjs` entry -
 * so covering the gap is reading and editing three paragraphs rather than
 * writing them from nothing.
 *
 * What a draft here is and is not: it is a correct, publishable first version,
 * written to the same shape as a real entry - one sentence of definition in
 * `short`, then three paragraphs that say what the thing is, how it behaves
 * with a number attached, and why it matters to a reader's own money. It is not
 * the final text. Read it before pasting it: the numbers are illustrative, the
 * examples are generic, and the voice is deliberately plain so that editing it
 * into the site's voice is easy.
 *
 * Adding a term:
 *   - `id`, `group` (investing | money | mind) and `related` work exactly as in
 *     content/site/glossary.mjs, because the printed entry goes straight there.
 *   - Every language needs `name`, `slug`, `aliases`, `short` and `body`.
 *     generate-glossary.mjs throws on a missing language, so a draft that is
 *     missing one would only fail later, after being pasted.
 *   - `aliases` must not repeat `name`, and should carry the spellings prose
 *     actually uses - the plural, the English loan word, the abbreviation.
 *     They are what the matcher looks for, so a term with thin aliases is a
 *     term the checker will keep missing.
 *   - `slug` must not collide with a slug already in the glossary or in this
 *     file. The checker verifies both, in every language, before it reports
 *     anything.
 *
 * A term with no entry here is still reported, from the article's own
 * `link_phrases` frontmatter, with a skeleton built out of the sentences that
 * mention it. That path exists so writing about something new never goes
 * unnoticed; this file is the path that also saves the writing.
 */
export const GLOSSARY_WATCHLIST = [
  {
    id: 'dividend-yield',
    group: 'investing',
    related: ['passive-income', 'etf', 'real-return'],
    es: {
      name: 'Rentabilidad por dividendo',
      slug: 'rentabilidad-por-dividendo',
      aliases: ['dividend yield', 'rentabilidad del dividendo', 'yield'],
      short: 'El dividendo anual que paga una acción o un fondo dividido entre su precio, expresado en porcentaje.',
      body: `La rentabilidad por dividendo se calcula dividiendo el dividendo pagado en un año entre el precio de la acción. Una acción a 20 € que reparte 1 € al año tiene una rentabilidad por dividendo del 5 %.

Es un cociente, y eso significa que sube cuando el numerador crece y también cuando el denominador cae. Una empresa cuyo precio se ha desplomado un 40 % aparece de golpe con una rentabilidad por dividendo altísima, y esa cifra no es una buena noticia: es el mercado diciendo que duda de que el dividendo se mantenga.

Para quien vive de su cartera, el dividendo es solo una de las dos formas de sacar dinero de ella; la otra es vender participaciones. Elegir acciones por su dividendo alto en lugar de por su rentabilidad total es una de las trampas más frecuentes al construir una cartera de ingresos.`
    },
    en: {
      name: 'Dividend yield',
      slug: 'dividend-yield',
      aliases: ['yield', 'dividend yields'],
      short: 'The annual dividend a share or fund pays divided by its price, expressed as a percentage.',
      body: `Dividend yield is the dividend paid over a year divided by the share price. A share at $20 paying $1 a year yields 5%.

It is a ratio, which means it rises when the numerator grows and also when the denominator falls. A company whose price has collapsed by 40% suddenly shows a spectacular yield, and that number is not good news: it is the market saying it doubts the dividend will survive.

For somebody living off a portfolio, dividends are only one of the two ways of taking money out; the other is selling units. Picking shares for a high yield rather than for total return is one of the most common traps in building an income portfolio.`
    },
    pt: {
      name: 'Rentabilidade por dividendo',
      slug: 'rentabilidade-por-dividendo',
      aliases: ['dividend yield', 'rendimento do dividendo', 'yield'],
      short: 'O dividendo anual que uma ação ou um fundo paga dividido pelo seu preço, expresso em percentagem.',
      body: `A rentabilidade por dividendo calcula-se dividindo o dividendo pago num ano pelo preço da ação. Uma ação a 20 que distribui 1 por ano tem uma rentabilidade por dividendo de 5 %.

É um quociente, e isso significa que sobe quando o numerador cresce e também quando o denominador cai. Uma empresa cujo preço caiu 40 % aparece de repente com uma rentabilidade por dividendo altíssima, e esse número não é boa notícia: é o mercado a dizer que duvida de que o dividendo se mantenha.

Para quem vive da sua carteira, o dividendo é apenas uma das duas formas de retirar dinheiro dela; a outra é vender unidades. Escolher ações pelo dividendo alto em vez da rentabilidade total é uma das armadilhas mais frequentes ao construir uma carteira de rendimento.`
    }
  },
  {
    id: 'cagr',
    group: 'investing',
    related: ['compound-interest', 'real-return', 'volatility'],
    es: {
      name: 'Rentabilidad anualizada (CAGR)',
      slug: 'rentabilidad-anualizada-cagr',
      aliases: ['CAGR', 'tasa de crecimiento anual compuesta', 'rentabilidad media anual compuesta'],
      short: 'La tasa constante a la que tendría que crecer una inversión cada año para pasar de su valor inicial al final en el periodo medido.',
      body: `La rentabilidad anualizada convierte un resultado total en un ritmo anual. Pasar de 10.000 € a 20.000 € en diez años no es un 10 % al año, sino un 7,2 %: el interés compuesto hace el resto.

No es una media de las rentabilidades anuales. Un año de +50 % seguido de otro de −50 % da una media aritmética del 0 % y una rentabilidad anualizada del −13,4 %, porque lo que queda son 75 € de cada 100. La segunda cifra es la que describe tu dinero.

Es la única forma honesta de comparar dos inversiones con periodos distintos, y por eso también es la que se manipula al escoger las fechas de inicio y fin. Ante una rentabilidad anualizada espectacular, la primera pregunta es siempre desde cuándo se mide.`
    },
    en: {
      name: 'Annualised return (CAGR)',
      slug: 'annualised-return-cagr',
      aliases: ['CAGR', 'compound annual growth rate', 'annualized return'],
      short: 'The constant rate an investment would have to grow at each year to go from its starting value to its ending value over the period measured.',
      body: `Annualised return turns a total result into a yearly pace. Going from $10,000 to $20,000 in ten years is not 10% a year but 7.2%: compounding does the rest.

It is not an average of the yearly returns. A year of +50% followed by one of -50% averages to 0% and annualises to -13.4%, because what is left is $75 of every $100. The second number is the one that describes your money.

It is the only honest way to compare two investments over different periods, which is also why it is the number most often manipulated by choosing the start and end dates. Faced with a spectacular annualised return, the first question is always: measured from when?`
    },
    pt: {
      name: 'Rentabilidade anualizada (CAGR)',
      slug: 'rentabilidade-anualizada-cagr',
      aliases: ['CAGR', 'taxa de crescimento anual composta', 'rentabilidade média anual composta'],
      short: 'A taxa constante a que um investimento teria de crescer cada ano para passar do valor inicial ao final no período medido.',
      body: `A rentabilidade anualizada converte um resultado total num ritmo anual. Passar de 10.000 para 20.000 em dez anos não é 10 % por ano, mas 7,2 %: os juros compostos fazem o resto.

Não é uma média das rentabilidades anuais. Um ano de +50 % seguido de outro de −50 % dá uma média aritmética de 0 % e uma rentabilidade anualizada de −13,4 %, porque o que fica são 75 de cada 100. O segundo número é o que descreve o teu dinheiro.

É a única forma honesta de comparar dois investimentos com períodos diferentes, e por isso também é o número mais manipulado através da escolha das datas de início e fim. Diante de uma rentabilidade anualizada espetacular, a primeira pergunta é sempre: medida desde quando?`
    }
  },
  {
    id: 'bear-market',
    group: 'investing',
    related: ['volatility', 'drawdown', 'time-in-market'],
    es: {
      name: 'Mercado bajista',
      slug: 'mercado-bajista',
      aliases: ['bear market', 'mercado en caída', 'mercados bajistas'],
      short: 'Un periodo en el que un índice cae al menos un 20 % desde su máximo anterior y se mantiene ahí.',
      body: `El umbral del 20 % es una convención, no una ley: sirve para distinguir una caída seria de una corrección ordinaria, que es cualquier retroceso del 10 %.

Los mercados bajistas son frecuentes y suelen ser más cortos de lo que parecen mientras se viven. En la bolsa estadounidense ha habido uno cada seis o siete años de media desde 1950, con una duración típica de menos de dos años y una recuperación posterior que ha superado siempre el punto de partida.

Lo que decide tu resultado no es el mercado bajista, sino lo que haces dentro de él. Vender en el suelo convierte una pérdida temporal en una permanente, y es la única forma segura de que una caída del 30 % te cueste dinero de verdad.`
    },
    en: {
      name: 'Bear market',
      slug: 'bear-market',
      aliases: ['bear markets', 'falling market'],
      short: 'A period in which an index falls at least 20% from its previous peak and stays there.',
      body: `The 20% threshold is a convention rather than a law: it exists to separate a serious fall from an ordinary correction, which is any 10% pullback.

Bear markets are frequent and usually shorter than they feel while you are inside one. US stocks have had one every six or seven years on average since 1950, typically lasting under two years, with a recovery that has always gone on to pass the starting point.

What decides your outcome is not the bear market but what you do inside it. Selling at the bottom turns a temporary loss into a permanent one, and it is the only reliable way to make a 30% fall cost you real money.`
    },
    pt: {
      name: 'Mercado em baixa',
      slug: 'mercado-em-baixa',
      aliases: ['bear market', 'mercado bear', 'mercados em baixa'],
      short: 'Um período em que um índice cai pelo menos 20 % desde o seu máximo anterior e se mantém aí.',
      body: `O limiar dos 20 % é uma convenção, não uma lei: serve para distinguir uma queda séria de uma correção comum, que é qualquer recuo de 10 %.

Os mercados em baixa são frequentes e costumam ser mais curtos do que parecem enquanto se vivem. Na bolsa americana houve um a cada seis ou sete anos em média desde 1950, com uma duração típica inferior a dois anos e uma recuperação posterior que sempre ultrapassou o ponto de partida.

O que decide o teu resultado não é o mercado em baixa, mas o que fazes dentro dele. Vender no fundo transforma uma perda temporária numa permanente, e é a única forma segura de uma queda de 30 % te custar dinheiro a sério.`
    }
  },
  {
    id: 'market-timing',
    group: 'investing',
    related: ['time-in-market', 'dca', 'recency-bias'],
    es: {
      name: 'Intentar acertar el momento del mercado',
      slug: 'acertar-el-momento-del-mercado',
      aliases: ['market timing', 'timing del mercado', 'entrar y salir del mercado'],
      short: 'Comprar o vender según lo que se cree que hará el mercado a corto plazo, en lugar de mantener una posición según un plan.',
      body: `Acertar el momento exige dos decisiones correctas seguidas: salir antes de la caída y volver antes de la subida. La segunda es la que casi nadie ejecuta, porque el momento de volver se siente exactamente igual que el momento de seguir fuera.

El coste de fallar está concentrado en muy pocos días. Estar fuera del mercado en las diez mejores jornadas de las últimas tres décadas reduce la rentabilidad final aproximadamente a la mitad, y esas jornadas ocurren, casi siempre, en medio de las peores semanas.

De ahí la conclusión práctica: el tiempo en el mercado bate al momento del mercado, no porque sea imposible acertar una vez, sino porque hay que acertar todas.`
    },
    en: {
      name: 'Market timing',
      slug: 'market-timing',
      aliases: ['timing the market', 'getting in and out of the market'],
      short: 'Buying or selling based on what you believe the market will do next, rather than holding a position according to a plan.',
      body: `Timing requires two correct decisions in a row: getting out before the fall and getting back in before the rise. The second is the one almost nobody executes, because the moment to return feels exactly like the moment to stay out.

The cost of getting it wrong is concentrated in very few days. Missing the ten best trading days of the last three decades roughly halves the final return, and those days happen, almost always, in the middle of the worst weeks.

Hence the practical conclusion: time in the market beats timing the market, not because getting it right once is impossible, but because you have to get it right every time.`
    },
    pt: {
      name: 'Tentar acertar no momento do mercado',
      slug: 'acertar-no-momento-do-mercado',
      aliases: ['market timing', 'timing do mercado', 'entrar e sair do mercado'],
      short: 'Comprar ou vender segundo o que se acredita que o mercado fará a curto prazo, em vez de manter uma posição de acordo com um plano.',
      body: `Acertar no momento exige duas decisões certas seguidas: sair antes da queda e voltar antes da subida. A segunda é a que quase ninguém executa, porque o momento de voltar sente-se exatamente como o momento de continuar de fora.

O custo de falhar está concentrado em muito poucos dias. Estar fora do mercado nas dez melhores sessões das últimas três décadas reduz a rentabilidade final quase a metade, e essas sessões acontecem, quase sempre, no meio das piores semanas.

Daí a conclusão prática: o tempo no mercado bate o momento do mercado, não porque seja impossível acertar uma vez, mas porque é preciso acertar sempre.`
    }
  },
  {
    id: 'reit',
    group: 'investing',
    related: ['passive-income', 'diversification', 'dividend-yield'],
    es: {
      name: 'REIT (inmobiliario cotizado)',
      slug: 'reit-inmobiliario-cotizado',
      aliases: ['REIT', 'REITs', 'SOCIMI', 'inmobiliario cotizado'],
      short: 'Una sociedad cotizada que posee y alquila inmuebles y está obligada a repartir la mayor parte de sus beneficios entre sus accionistas.',
      body: `Un REIT permite ser propietario de una parte de una cartera de inmuebles sin comprar ninguno: se compra y se vende como una acción, en segundos y por unos pocos euros. En España la figura equivalente es la SOCIMI.

En contrapartida, un REIT se comporta como una acción, no como un piso: cotiza todos los días y puede caer un 40 % en un año en el que los alquileres que cobra no se han movido. La liquidez que gana se paga en volatilidad visible.

Como reparte obligatoriamente casi todo su beneficio, su rentabilidad por dividendo suele ser alta y su crecimiento por reinversión, bajo. Es una fuente de renta más que un motor de acumulación, y conviene tenerlo en cuenta antes de compararlo con un índice de acciones.`
    },
    en: {
      name: 'REIT (listed real estate)',
      slug: 'reit-listed-real-estate',
      aliases: ['REIT', 'REITs', 'real estate investment trust', 'listed real estate'],
      short: 'A listed company that owns and rents out property and is required to distribute most of its profit to shareholders.',
      body: `A REIT lets you own a share of a property portfolio without buying any property: it is bought and sold like a share, in seconds and for a few dollars.

In exchange, a REIT behaves like a share and not like a flat: it is priced every day and can fall 40% in a year in which the rents it collects did not move at all. The liquidity it gains is paid for in visible volatility.

Because it is obliged to pay out nearly all of its profit, a REIT's dividend yield tends to be high and its growth from reinvestment low. It is a source of income rather than an engine of accumulation, which is worth remembering before comparing it with a stock index.`
    },
    pt: {
      name: 'REIT (imobiliário cotado)',
      slug: 'reit-imobiliario-cotado',
      aliases: ['REIT', 'REITs', 'fundo de investimento imobiliário', 'imobiliário cotado'],
      short: 'Uma empresa cotada que possui e arrenda imóveis e é obrigada a distribuir a maior parte do lucro pelos acionistas.',
      body: `Um REIT permite ser proprietário de uma parte de uma carteira de imóveis sem comprar nenhum: compra-se e vende-se como uma ação, em segundos e por poucos euros.

Em troca, um REIT comporta-se como uma ação e não como um apartamento: é cotado todos os dias e pode cair 40 % num ano em que as rendas que recebe não se mexeram. A liquidez que ganha paga-se em volatilidade visível.

Como distribui obrigatoriamente quase todo o lucro, a sua rentabilidade por dividendo tende a ser alta e o seu crescimento por reinvestimento baixo. É uma fonte de rendimento mais do que um motor de acumulação, e vale a pena lembrá-lo antes de o comparar com um índice de ações.`
    }
  },
  {
    id: 'lump-sum',
    group: 'investing',
    related: ['dca', 'time-in-market', 'present-bias'],
    es: {
      name: 'Aportación única',
      slug: 'aportacion-unica',
      aliases: ['lump sum', 'inversión de golpe', 'invertir todo de una vez'],
      short: 'Invertir una cantidad entera en un solo momento, en lugar de repartirla en aportaciones periódicas.',
      body: `La alternativa a la aportación única es la aportación periódica: dividir el dinero en partes iguales y entrar a lo largo de varios meses.

Estadísticamente, invertir todo de golpe gana en aproximadamente dos de cada tres periodos históricos, simplemente porque el mercado sube más veces de las que baja y estar dentro paga. El precio de esa ventaja es la posibilidad de entrar justo antes de una caída.

Por eso la decisión es más psicológica que matemática. Si una caída del 20 % la semana siguiente te haría vender, la aportación periódica es mejor: no porque rinda más, sino porque es la que serás capaz de mantener.`
    },
    en: {
      name: 'Lump sum',
      slug: 'lump-sum',
      aliases: ['lump-sum investing', 'investing it all at once'],
      short: 'Investing a whole amount at a single moment, rather than spreading it across periodic contributions.',
      body: `The alternative to a lump sum is dollar-cost averaging: splitting the money into equal parts and entering over several months.

Statistically, investing it all at once wins in roughly two out of every three historical periods, simply because markets rise more often than they fall and being invested pays. The price of that edge is the chance of buying just before a crash.

Which makes the decision more psychological than mathematical. If a 20% fall the following week would make you sell, averaging in is the better choice: not because it returns more, but because it is the one you will be able to stick to.`
    },
    pt: {
      name: 'Investimento de uma só vez',
      slug: 'investimento-de-uma-so-vez',
      aliases: ['lump sum', 'investir tudo de uma vez'],
      short: 'Investir um montante inteiro num único momento, em vez de o repartir em contribuições periódicas.',
      body: `A alternativa ao investimento de uma só vez é o investimento periódico: dividir o dinheiro em partes iguais e entrar ao longo de vários meses.

Estatisticamente, investir tudo de uma vez ganha em cerca de dois de cada três períodos históricos, simplesmente porque o mercado sobe mais vezes do que desce e estar investido compensa. O preço dessa vantagem é a possibilidade de entrar pouco antes de uma queda.

Por isso a decisão é mais psicológica do que matemática. Se uma queda de 20 % na semana seguinte te fizesse vender, o investimento periódico é melhor: não porque renda mais, mas porque é o que serás capaz de manter.`
    }
  },
  {
    id: 'debt-snowball',
    group: 'money',
    related: ['compound-debt', 'debt-avalanche', 'cash-flow'],
    es: {
      name: 'Método bola de nieve',
      slug: 'metodo-bola-de-nieve',
      aliases: ['debt snowball', 'bola de nieve de deudas', 'snowball'],
      short: 'Una forma de pagar deudas que ataca primero la de saldo más pequeño, con independencia de su tipo de interés.',
      body: `Se pagan los mínimos de todas las deudas y todo el dinero que sobra va a la más pequeña. Cuando esa desaparece, su cuota se suma al ataque de la siguiente, y así el pago se acelera solo.

Matemáticamente no es óptimo: pagar antes la deuda más cara ahorra más intereses. Lo que gana la bola de nieve es la primera deuda liquidada pronto, y con ella la prueba de que el plan funciona.

Esa prueba tiene valor real. En los estudios sobre planes de pago, quienes empiezan por la deuda pequeña abandonan menos, y un plan peor que se termina bate a un plan óptimo que se deja a medias.`
    },
    en: {
      name: 'Debt snowball',
      slug: 'debt-snowball',
      aliases: ['snowball method', 'snowball'],
      short: 'A way of paying off debt that attacks the smallest balance first, regardless of its interest rate.',
      body: `You pay the minimum on every debt and send everything left over to the smallest one. When it disappears, its payment joins the attack on the next, so the payoff accelerates on its own.

Mathematically it is not optimal: paying the most expensive debt first saves more interest. What the snowball buys is the first debt cleared early, and with it the proof that the plan works.

That proof has real value. In studies of repayment plans, people who start with the small balance drop out less often, and a worse plan you finish beats an optimal plan you abandon halfway.`
    },
    pt: {
      name: 'Método bola de neve',
      slug: 'metodo-bola-de-neve',
      aliases: ['debt snowball', 'bola de neve de dívidas', 'snowball'],
      short: 'Uma forma de pagar dívidas que ataca primeiro o saldo mais pequeno, independentemente da taxa de juro.',
      body: `Pagam-se os mínimos de todas as dívidas e todo o dinheiro que sobra vai para a mais pequena. Quando essa desaparece, a sua prestação junta-se ao ataque à seguinte, e o pagamento acelera sozinho.

Matematicamente não é ótimo: pagar primeiro a dívida mais cara poupa mais juros. O que a bola de neve ganha é a primeira dívida liquidada cedo e, com ela, a prova de que o plano funciona.

Essa prova tem valor real. Nos estudos sobre planos de pagamento, quem começa pela dívida pequena desiste menos, e um plano pior que se termina bate um plano ótimo que se deixa a meio.`
    }
  },
  {
    id: 'debt-avalanche',
    group: 'money',
    related: ['debt-snowball', 'compound-debt', 'apr'],
    es: {
      name: 'Método avalancha',
      slug: 'metodo-avalancha',
      aliases: ['debt avalanche', 'avalancha de deudas', 'método del tipo más alto'],
      short: 'Una forma de pagar deudas que ataca primero la de tipo de interés más alto, con independencia de su saldo.',
      body: `Se pagan los mínimos de todas y el excedente va a la deuda más cara. Cuando esa se liquida, se pasa a la siguiente por tipo de interés, no por tamaño.

Es la opción óptima en intereses pagados y en tiempo total. Con una tarjeta al 20 % y un préstamo al 6 %, cada euro que va a la tarjeta ahorra más del triple que el mismo euro en el préstamo.

Su punto débil es el ánimo: si la deuda más cara es también la más grande, pueden pasar meses sin que desaparezca ninguna. Quien necesita ver progreso para no abandonar suele terminar más planes con el método bola de nieve.`
    },
    en: {
      name: 'Debt avalanche',
      slug: 'debt-avalanche',
      aliases: ['avalanche method', 'highest-rate-first method'],
      short: 'A way of paying off debt that attacks the highest interest rate first, regardless of the balance.',
      body: `You pay the minimum on everything and send the surplus to the most expensive debt. When it is cleared, you move to the next by interest rate, not by size.

It is the optimal choice in interest paid and in total time. With a card at 20% and a loan at 6%, every dollar sent to the card saves more than three times what the same dollar saves on the loan.

Its weak point is morale: if the most expensive debt is also the largest, months can pass without anything disappearing. People who need visible progress in order not to quit tend to finish more plans with the snowball.`
    },
    pt: {
      name: 'Método avalanche',
      slug: 'metodo-avalanche',
      aliases: ['debt avalanche', 'avalanche de dívidas', 'método da taxa mais alta'],
      short: 'Uma forma de pagar dívidas que ataca primeiro a taxa de juro mais alta, independentemente do saldo.',
      body: `Pagam-se os mínimos de todas e o excedente vai para a dívida mais cara. Quando essa é liquidada, passa-se à seguinte por taxa de juro, não por tamanho.

É a opção ótima em juros pagos e em tempo total. Com um cartão a 20 % e um empréstimo a 6 %, cada euro que vai para o cartão poupa mais do triplo do que o mesmo euro no empréstimo.

O seu ponto fraco é o ânimo: se a dívida mais cara for também a maior, podem passar meses sem que nenhuma desapareça. Quem precisa de ver progresso para não desistir costuma terminar mais planos com o método bola de neve.`
    }
  },
  {
    id: 'apr',
    group: 'money',
    related: ['compound-debt', 'ter', 'debt-avalanche'],
    es: {
      name: 'TAE (tasa anual equivalente)',
      slug: 'tae-tasa-anual-equivalente',
      aliases: ['TAE', 'tasa anual equivalente', 'APR'],
      short: 'El coste real anual de un préstamo, que incluye el tipo de interés más las comisiones y los gastos obligatorios.',
      body: `El TIN es solo el interés; la TAE añade comisiones de apertura, seguros vinculados y cualquier gasto obligatorio, y los reparte a lo largo de la vida del préstamo. Es la cifra que permite comparar dos ofertas.

La diferencia entre las dos no es cosmética. Un préstamo al 6 % de interés con una comisión de apertura del 2 % puede tener una TAE cercana al 8 % si se devuelve en pocos años, porque esa comisión se paga entera al principio.

Por eso, ante cualquier crédito, la pregunta útil no es cuánto es la cuota, sino cuál es la TAE y cuánto se paga en total. La cuota se puede hacer pequeña alargando el plazo; el total, no.`
    },
    en: {
      name: 'APR (annual percentage rate)',
      slug: 'apr-annual-percentage-rate',
      aliases: ['APR', 'annual percentage rate', 'TAE'],
      short: 'The real yearly cost of a loan, including the interest rate plus fees and any compulsory charges.',
      body: `The nominal rate is only the interest; the APR adds arrangement fees, tied insurance and any compulsory cost, spread across the life of the loan. It is the figure that lets you compare two offers.

The gap between the two is not cosmetic. A loan at 6% interest with a 2% arrangement fee can carry an APR close to 8% if it is repaid over a few years, because that fee is paid in full at the start.

So the useful question about any credit is not what the monthly payment is but what the APR is and what the total comes to. A payment can be made small by stretching the term; the total cannot.`
    },
    pt: {
      name: 'TAEG (taxa anual de encargos efetiva global)',
      slug: 'taeg-taxa-anual-de-encargos',
      aliases: ['TAEG', 'APR', 'taxa anual efetiva global'],
      short: 'O custo real anual de um empréstimo, que inclui a taxa de juro mais as comissões e os encargos obrigatórios.',
      body: `A TAN é apenas o juro; a TAEG acrescenta comissões de abertura, seguros associados e qualquer encargo obrigatório, e distribui-os ao longo da vida do empréstimo. É o número que permite comparar duas propostas.

A diferença entre as duas não é cosmética. Um empréstimo a 6 % de juro com uma comissão de abertura de 2 % pode ter uma TAEG perto de 8 % se for pago em poucos anos, porque essa comissão é paga inteira no início.

Por isso, diante de qualquer crédito, a pergunta útil não é qual é a prestação, mas qual é a TAEG e quanto se paga no total. A prestação pode ficar pequena alargando o prazo; o total, não.`
    }
  },
  {
    id: 'fifty-thirty-twenty',
    group: 'money',
    related: ['savings-rate', 'cash-flow', 'pay-yourself-first'],
    es: {
      name: 'Regla 50/30/20',
      slug: 'regla-50-30-20',
      aliases: ['50/30/20', 'regla 50 30 20', 'reparto 50/30/20'],
      short: 'Un reparto orientativo del ingreso neto: la mitad a necesidades, un 30 % a gustos y un 20 % a ahorro y deuda.',
      body: `Su valor está en dar una referencia donde no había ninguna. Quien no sabe si ahorrar el 4 % es poco o mucho tiene de golpe un número contra el que medirse.

También es aritmética, no una ley. En una ciudad donde el alquiler se lleva el 45 % del sueldo neto, el 50 % de necesidades es inalcanzable y el reparto se convierte en una fuente de culpa en lugar de un plan.

La forma útil de usarla es al revés: fijar primero el 20 % de ahorro, sacarlo del sueldo el mismo día que llega y repartir el resto como salga. El orden importa más que los porcentajes.`
    },
    en: {
      name: '50/30/20 rule',
      slug: 'fifty-thirty-twenty-rule',
      aliases: ['50/30/20', '50 30 20 rule', '50/30/20 split'],
      short: 'A rough split of net income: half to needs, 30% to wants, and 20% to saving and debt.',
      body: `Its value is in providing a reference where there was none. Somebody who does not know whether saving 4% is a little or a lot suddenly has a number to measure against.

It is also arithmetic, not a law. In a city where rent takes 45% of net pay, 50% for needs is unreachable and the split becomes a source of guilt rather than a plan.

The useful way to use it is backwards: fix the 20% saving first, move it out on the day you are paid, and let the rest fall where it falls. The order matters more than the percentages.`
    },
    pt: {
      name: 'Regra 50/30/20',
      slug: 'regra-50-30-20',
      aliases: ['50/30/20', 'regra 50 30 20', 'divisão 50/30/20'],
      short: 'Uma divisão orientativa do rendimento líquido: metade para necessidades, 30 % para gostos e 20 % para poupança e dívida.',
      body: `O seu valor está em dar uma referência onde não havia nenhuma. Quem não sabe se poupar 4 % é pouco ou muito passa a ter um número com que se comparar.

É também aritmética, não uma lei. Numa cidade onde a renda leva 45 % do salário líquido, os 50 % de necessidades são inalcançáveis e a divisão transforma-se numa fonte de culpa em vez de um plano.

A forma útil de a usar é ao contrário: fixar primeiro os 20 % de poupança, retirá-los no dia em que o salário entra e distribuir o resto como sair. A ordem importa mais do que as percentagens.`
    }
  },
  {
    id: 'sinking-fund',
    group: 'money',
    related: ['emergency-fund', 'cash-flow', 'mental-accounting'],
    es: {
      name: 'Fondo para gastos previstos',
      slug: 'fondo-para-gastos-previstos',
      aliases: ['sinking fund', 'fondo de reserva para gastos', 'hucha para gastos previstos'],
      short: 'Dinero apartado cada mes para un gasto grande que se sabe que llegará, como el seguro anual, la ITV o unas vacaciones.',
      body: `No es un fondo de emergencia. El fondo de emergencia cubre lo que no se puede prever; este cubre exactamente lo contrario: el gasto de 600 € que aparece cada febrero desde hace ocho años.

Funciona dividiendo el gasto anual entre doce y apartando esa cantidad cada mes. Un seguro de 720 € deja de ser un problema de 720 € y pasa a ser una línea de 60 € en el presupuesto.

Su efecto real es sobre la deuda. La mayoría de los saldos de tarjeta no nacen de un lujo, sino de un gasto previsible para el que nadie había apartado nada, y ese es el ciclo que este fondo rompe.`
    },
    en: {
      name: 'Sinking fund',
      slug: 'sinking-fund',
      aliases: ['sinking funds', 'planned expense fund'],
      short: 'Money set aside every month for a large expense you know is coming, such as an annual insurance premium, a car service or a holiday.',
      body: `It is not an emergency fund. An emergency fund covers what cannot be foreseen; this covers exactly the opposite: the $600 bill that has arrived every February for eight years.

It works by dividing the annual cost by twelve and setting that aside each month. A $720 premium stops being a $720 problem and becomes a $60 line in the budget.

Its real effect is on debt. Most card balances do not come from a luxury but from a predictable expense nobody had set anything aside for, and that is the cycle this fund breaks.`
    },
    pt: {
      name: 'Fundo para despesas previstas',
      slug: 'fundo-para-despesas-previstas',
      aliases: ['sinking fund', 'fundo de reserva para despesas', 'mealheiro para despesas previstas'],
      short: 'Dinheiro posto de lado todos os meses para uma despesa grande que se sabe que vai chegar, como o seguro anual, a inspeção do carro ou umas férias.',
      body: `Não é um fundo de emergência. O fundo de emergência cobre o que não se pode prever; este cobre exatamente o contrário: a despesa de 600 que aparece todos os fevereiros há oito anos.

Funciona dividindo a despesa anual por doze e pondo de lado esse valor todos os meses. Um seguro de 720 deixa de ser um problema de 720 e passa a ser uma linha de 60 no orçamento.

O seu efeito real é sobre a dívida. A maioria dos saldos de cartão não nasce de um luxo, mas de uma despesa previsível para a qual ninguém tinha posto nada de lado, e é esse ciclo que este fundo quebra.`
    }
  },
  {
    id: 'twenty-five-times-rule',
    group: 'money',
    related: ['four-percent-rule', 'fire', 'safe-withdrawal-rate'],
    es: {
      name: 'Regla del 25',
      slug: 'regla-del-25',
      aliases: ['regla del 25x', '25x', 'regla de las 25 veces'],
      short: 'La estimación de que el capital necesario para vivir de una cartera es unas veinticinco veces el gasto anual.',
      body: `Es la regla del 4 % puesta al revés: retirar el 4 % de una cartera equivale a necesitar veinticinco veces el gasto de un año. Un gasto de 24.000 € al año son 600.000 € de objetivo.

Su utilidad es convertir una aspiración en una cifra que se puede perseguir, y convertir cualquier gasto recurrente en su precio a largo plazo: 100 € al mes de suscripciones son 30.000 € de capital.

Sus límites son los de la regla del 4 %: supone un horizonte de treinta años, una cartera diversificada y un gasto estable. Con jubilaciones más largas o con gasto creciente, el multiplicador honesto está más cerca de treinta que de veinticinco.`
    },
    en: {
      name: '25x rule',
      slug: 'twenty-five-times-rule',
      aliases: ['25x', 'rule of 25', '25 times rule'],
      short: 'The estimate that the capital needed to live off a portfolio is roughly twenty-five times annual spending.',
      body: `It is the 4% rule turned around: withdrawing 4% of a portfolio is the same as needing twenty-five times one year of spending. Spending $24,000 a year makes the target $600,000.

Its use is turning an aspiration into a figure you can chase, and turning any recurring expense into its long-run price: $100 a month of subscriptions is $30,000 of capital.

Its limits are the 4% rule's limits: it assumes a thirty-year horizon, a diversified portfolio and stable spending. With longer retirements or rising spending, the honest multiplier is closer to thirty than to twenty-five.`
    },
    pt: {
      name: 'Regra dos 25',
      slug: 'regra-dos-25',
      aliases: ['regra dos 25x', '25x', 'regra das 25 vezes'],
      short: 'A estimativa de que o capital necessário para viver de uma carteira é cerca de vinte e cinco vezes a despesa anual.',
      body: `É a regra dos 4 % ao contrário: retirar 4 % de uma carteira equivale a precisar de vinte e cinco vezes a despesa de um ano. Uma despesa de 24.000 por ano são 600.000 de objetivo.

A sua utilidade é transformar uma aspiração num número que se pode perseguir, e transformar qualquer despesa recorrente no seu preço a longo prazo: 100 por mês de subscrições são 30.000 de capital.

Os seus limites são os da regra dos 4 %: pressupõe um horizonte de trinta anos, uma carteira diversificada e uma despesa estável. Com reformas mais longas ou despesa crescente, o multiplicador honesto está mais perto de trinta do que de vinte e cinco.`
    }
  },
  {
    id: 'sunk-cost-fallacy',
    group: 'mind',
    related: ['loss-aversion', 'mental-accounting', 'opportunity-cost'],
    es: {
      name: 'Falacia del coste hundido',
      slug: 'falacia-del-coste-hundido',
      aliases: ['sunk cost fallacy', 'coste hundido', 'costes hundidos'],
      short: 'La tendencia a seguir con algo porque ya se ha invertido dinero, tiempo o esfuerzo en ello, en lugar de decidir por lo que queda por venir.',
      body: `El coste ya pagado es información sobre el pasado, no sobre el futuro. La única pregunta relevante es qué pasa a partir de ahora, y esa pregunta no cambia por lo que se gastó antes.

En inversión aparece como la acción que no se vende hasta «recuperar lo que costó». El precio de compra es un dato privado tuyo: no forma parte del valor de la empresa y no influye en su recorrido.

Se combate cambiando la pregunta. En lugar de «¿cuánto llevo metido aquí?», la pregunta es: si hoy tuviera este dinero en efectivo, ¿lo pondría en esto? Si la respuesta es no, seguir dentro es una decisión nueva, no la continuación de una vieja.`
    },
    en: {
      name: 'Sunk cost fallacy',
      slug: 'sunk-cost-fallacy',
      aliases: ['sunk costs', 'sunk cost'],
      short: 'The tendency to keep going with something because money, time or effort has already gone into it, rather than deciding on what is still ahead.',
      body: `A cost already paid is information about the past, not about the future. The only relevant question is what happens from here, and that question does not change because of what was spent before.

In investing it shows up as the share nobody sells until it "gets back to what I paid". Your purchase price is a private fact about you: it is not part of the company's value and has no bearing on where it goes next.

The fix is changing the question. Instead of "how much do I have in this?", ask: if I held this money in cash today, would I put it here? If the answer is no, staying in is a new decision, not the continuation of an old one.`
    },
    pt: {
      name: 'Falácia do custo irrecuperável',
      slug: 'falacia-do-custo-irrecuperavel',
      aliases: ['sunk cost fallacy', 'custo irrecuperável', 'custos afundados'],
      short: 'A tendência para continuar com algo porque já se investiu dinheiro, tempo ou esforço, em vez de decidir pelo que ainda está por vir.',
      body: `O custo já pago é informação sobre o passado, não sobre o futuro. A única pergunta relevante é o que acontece a partir de agora, e essa pergunta não muda por causa do que se gastou antes.

Em investimento aparece como a ação que não se vende até «recuperar o que custou». O preço de compra é um dado privado teu: não faz parte do valor da empresa e não influencia o seu percurso.

Combate-se mudando a pergunta. Em vez de «quanto é que já meti aqui?», a pergunta é: se hoje tivesse este dinheiro em caixa, punha-o nisto? Se a resposta é não, continuar dentro é uma decisão nova, não a continuação de uma antiga.`
    }
  },
  {
    id: 'anchoring',
    group: 'mind',
    related: ['mental-accounting', 'recency-bias', 'sunk-cost-fallacy'],
    es: {
      name: 'Anclaje',
      slug: 'anclaje',
      aliases: ['anchoring', 'sesgo de anclaje', 'efecto de anclaje'],
      short: 'La tendencia a juzgar una cifra por su distancia respecto a la primera que se vio, aunque esa primera cifra sea arbitraria.',
      body: `El precio tachado de una tienda es la versión comercial del anclaje: 300 € tachados hacen que 180 € parezcan una decisión inteligente, sin que nadie haya comprobado si el artículo vale 180 €.

En inversión, el ancla habitual es el máximo histórico de una cartera. Una cuenta que llegó a 50.000 € y hoy tiene 44.000 € se siente como una pérdida de 6.000 €, aunque el dinero aportado fuera de 38.000 €.

La defensa es tener una referencia propia antes de ver la del vendedor o la del mercado: cuánto vale esto para mí, cuánto he puesto yo, cuánto necesito. Un ancla propia desplaza a la ajena.`
    },
    en: {
      name: 'Anchoring',
      slug: 'anchoring',
      aliases: ['anchoring bias', 'anchor effect'],
      short: 'The tendency to judge a number by its distance from the first one you saw, even when that first number is arbitrary.',
      body: `The crossed-out price in a shop is the commercial version of anchoring: $300 struck through makes $180 feel like a smart decision, without anybody checking whether the item is worth $180.

In investing, the usual anchor is a portfolio's all-time high. An account that reached $50,000 and holds $44,000 today feels like a $6,000 loss, even when the money paid in was $38,000.

The defence is having your own reference before you see the seller's or the market's: what is this worth to me, how much have I put in, how much do I need. Your own anchor displaces somebody else's.`
    },
    pt: {
      name: 'Ancoragem',
      slug: 'ancoragem',
      aliases: ['anchoring', 'viés de ancoragem', 'efeito de ancoragem'],
      short: 'A tendência para julgar um número pela sua distância em relação ao primeiro que se viu, mesmo quando esse primeiro número é arbitrário.',
      body: `O preço riscado de uma loja é a versão comercial da ancoragem: 300 riscados fazem 180 parecer uma decisão inteligente, sem que ninguém tenha verificado se o artigo vale 180.

Em investimento, a âncora habitual é o máximo histórico de uma carteira. Uma conta que chegou a 50.000 e hoje tem 44.000 sente-se como uma perda de 6.000, mesmo que o dinheiro investido tenha sido 38.000.

A defesa é ter uma referência própria antes de ver a do vendedor ou a do mercado: quanto isto vale para mim, quanto é que eu pus, quanto preciso. Uma âncora própria desloca a alheia.`
    }
  },
  {
    id: 'confirmation-bias',
    group: 'mind',
    related: ['recency-bias', 'anchoring', 'diversification'],
    es: {
      name: 'Sesgo de confirmación',
      slug: 'sesgo-de-confirmacion',
      aliases: ['confirmation bias', 'sesgo confirmatorio'],
      short: 'La tendencia a buscar, recordar y creer la información que respalda lo que ya se piensa, y a descartar la que lo contradice.',
      body: `Es el sesgo que convierte la investigación en una recopilación de argumentos a favor. Después de comprar algo, los artículos que lo elogian se leen enteros y los que lo critican se cierran a mitad.

En finanzas es especialmente caro porque los mercados producen material para cualquier tesis. Siempre hay un gráfico, un periodo y un experto que confirman lo que se quiere creer, y encontrarlos se siente exactamente igual que analizar.

El antídoto práctico es escribir, antes de invertir, qué tendría que pasar para reconocer que la decisión fue mala. Un criterio escrito de antemano es más difícil de renegociar que una intuición.`
    },
    en: {
      name: 'Confirmation bias',
      slug: 'confirmation-bias',
      aliases: ['confirmatory bias'],
      short: 'The tendency to seek out, remember and believe information that supports what you already think, and to discard what contradicts it.',
      body: `It is the bias that turns research into a collection of supporting arguments. After buying something, the articles praising it get read to the end and the ones criticising it get closed halfway.

In finance it is especially expensive because markets produce material for any thesis. There is always a chart, a period and an expert confirming what you want to believe, and finding them feels exactly like analysis.

The practical antidote is writing down, before investing, what would have to happen for you to admit the decision was wrong. A criterion written in advance is harder to renegotiate than a hunch.`
    },
    pt: {
      name: 'Viés de confirmação',
      slug: 'vies-de-confirmacao',
      aliases: ['confirmation bias', 'viés confirmatório'],
      short: 'A tendência para procurar, recordar e acreditar na informação que apoia o que já se pensa, e para descartar a que a contradiz.',
      body: `É o viés que transforma a investigação numa recolha de argumentos a favor. Depois de comprar algo, os artigos que o elogiam leem-se até ao fim e os que o criticam fecham-se a meio.

Em finanças é especialmente caro porque os mercados produzem material para qualquer tese. Há sempre um gráfico, um período e um especialista a confirmar o que se quer acreditar, e encontrá-los sente-se exatamente como analisar.

O antídoto prático é escrever, antes de investir, o que teria de acontecer para reconhecer que a decisão foi má. Um critério escrito de antemão é mais difícil de renegociar do que uma intuição.`
    }
  },
  {
    id: 'fomo',
    group: 'mind',
    related: ['recency-bias', 'herd-behaviour', 'market-timing'],
    es: {
      name: 'FOMO (miedo a quedarse fuera)',
      slug: 'fomo-miedo-a-quedarse-fuera',
      aliases: ['FOMO', 'miedo a quedarse fuera', 'fear of missing out'],
      short: 'La urgencia de entrar en algo que está subiendo por miedo a perderse la ganancia, más que por una razón sobre el activo.',
      body: `Lo que dispara el FOMO no es el activo, sino la ganancia ajena: la de alguien conocido, contada después de haber ocurrido. Esa historia llega sin la parte en la que podía haber salido mal.

Su coste está en el precio de entrada. El FOMO aparece por definición cuando algo ya ha subido mucho, así que empuja a comprar tarde y a vender pronto, que es el orden exactamente inverso al que hace dinero.

Se maneja con fricción, no con fuerza de voluntad: una regla escrita de cuánto puede pesar como máximo una posición nueva, y una espera de setenta y dos horas antes de ejecutar cualquier idea que llegó por una conversación o una red social.`
    },
    en: {
      name: 'FOMO (fear of missing out)',
      slug: 'fomo-fear-of-missing-out',
      aliases: ['FOMO', 'fear of missing out'],
      short: 'The urge to buy into something that is rising out of fear of missing the gain, rather than for a reason about the asset.',
      body: `What triggers FOMO is not the asset but somebody else's gain: usually somebody you know, telling you after the fact. That story arrives without the part where it could have gone badly.

Its cost is in the entry price. FOMO appears, by definition, after something has already risen a long way, so it pushes you to buy late and sell early - exactly the reverse of the order that makes money.

You handle it with friction rather than willpower: a written rule for the largest weight a new position may take, and a seventy-two hour wait before acting on any idea that arrived through a conversation or a social feed.`
    },
    pt: {
      name: 'FOMO (medo de ficar de fora)',
      slug: 'fomo-medo-de-ficar-de-fora',
      aliases: ['FOMO', 'medo de ficar de fora', 'fear of missing out'],
      short: 'A urgência de entrar em algo que está a subir por medo de perder o ganho, mais do que por uma razão sobre o ativo.',
      body: `O que dispara o FOMO não é o ativo, mas o ganho alheio: normalmente de alguém conhecido, contado depois de ter acontecido. Essa história chega sem a parte em que podia ter corrido mal.

O seu custo está no preço de entrada. O FOMO aparece, por definição, depois de algo já ter subido muito, por isso empurra para comprar tarde e vender cedo, que é a ordem exatamente inversa à que faz dinheiro.

Gere-se com fricção, não com força de vontade: uma regra escrita sobre o peso máximo de uma posição nova e uma espera de setenta e duas horas antes de executar qualquer ideia que chegou por uma conversa ou uma rede social.`
    }
  },
  {
    id: 'herd-behaviour',
    group: 'mind',
    related: ['fomo', 'recency-bias', 'volatility'],
    es: {
      name: 'Comportamiento de rebaño',
      slug: 'comportamiento-de-rebano',
      aliases: ['herd behaviour', 'efecto rebaño', 'comportamiento de manada'],
      short: 'La tendencia a hacer lo que hace la mayoría porque lo hace la mayoría, tomando el consenso como información.',
      body: `Seguir al grupo es un atajo razonable cuando el grupo sabe algo que tú no. En los mercados suele ser lo contrario: la mayoría está mirando el mismo titular reciente que tú.

Su efecto agregado es amplificar los extremos. Los precios suben porque suben y caen porque caen, y las burbujas y los pánicos son en gran medida esta dinámica funcionando a gran escala.

Una cartera con reglas escritas —cuánto se aporta, en qué, cuándo se rebalancea— es la defensa práctica. Convierte la decisión en algo decidido de antemano, cuando el rebaño todavía no se movía.`
    },
    en: {
      name: 'Herd behaviour',
      slug: 'herd-behaviour',
      aliases: ['herding', 'herd mentality', 'herd behavior'],
      short: 'The tendency to do what most people are doing because most people are doing it, treating consensus as information.',
      body: `Following the crowd is a reasonable shortcut when the crowd knows something you do not. In markets it is usually the opposite: most people are looking at the same recent headline you are.

Its aggregate effect is to amplify extremes. Prices rise because they are rising and fall because they are falling, and bubbles and panics are largely this dynamic running at scale.

A portfolio with written rules - how much goes in, into what, when it is rebalanced - is the practical defence. It makes the decision one you took in advance, while the herd was still standing still.`
    },
    pt: {
      name: 'Comportamento de manada',
      slug: 'comportamento-de-manada',
      aliases: ['herd behaviour', 'efeito manada', 'comportamento de rebanho'],
      short: 'A tendência para fazer o que a maioria faz porque a maioria o faz, tratando o consenso como informação.',
      body: `Seguir o grupo é um atalho razoável quando o grupo sabe algo que tu não sabes. Nos mercados costuma ser o contrário: a maioria está a olhar para a mesma notícia recente que tu.

O seu efeito agregado é amplificar os extremos. Os preços sobem porque estão a subir e caem porque estão a cair, e as bolhas e os pânicos são em grande medida esta dinâmica a funcionar em escala.

Uma carteira com regras escritas - quanto entra, em quê, quando se rebalanceia - é a defesa prática. Transforma a decisão em algo decidido de antemão, quando a manada ainda não se tinha mexido.`
    }
  }
];
