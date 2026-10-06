/**
 * The financial glossary: one entry per concept, in three languages.
 *
 * This file is content rather than machinery, and it is the input to two very
 * different things:
 *
 *   1. scripts/generate-glossary.mjs publishes one page per language, on which
 *      every term is a section that opens where it sits. It used to publish a
 *      page per term as well; the comment at the top of that file records why
 *      it stopped.
 *   2. scripts/inline-links.mjs uses `name` and `aliases` to find the first
 *      mention of a term in an article body and link it to that term's
 *      section, automatically, at build time. That is why the aliases matter:
 *      an article that says "fondo indexado" and an article that says "fondos
 *      indexados" should both link to the same entry, and neither author should
 *      have to remember to write the link.
 *
 * Shape of an entry:
 *   id       - language-independent key. Used for `related` and for nothing the
 *              reader ever sees, so it never changes even if a slug does.
 *   group    - which pillar the term belongs to: investing, money, or mind.
 *              The index groups by it.
 *   related  - other entry ids. Rendered as links inside the term's own
 *              section, and deliberately not symmetric: "ETF" is worth reaching
 *              from "index fund" more than the reverse.
 *   <lang>   - { name, slug, aliases, short, body }
 *              `name`    is the heading and the DefinedTerm name.
 *              `slug`    is the term's fragment on the glossary page, localized.
 *                        It was the URL segment of its own page until those
 *                        pages were folded into one, and the old addresses are
 *                        redirected onto this fragment in _redirects - so
 *                        changing one now breaks a redirect as well as a link.
 *              `aliases` are the other spellings the auto-linker should catch,
 *                        including plurals and the abbreviation, and must NOT
 *                        include `name` (the linker adds it).
 *              `short`   is one sentence. It is what the term's section shows
 *                        while it is closed and it is the DefinedTerm
 *                        description, so it has to stand alone with no heading
 *                        above it.
 *              `body`    is Markdown, rendered by scripts/markdown.mjs like an
 *                        article body.
 *
 * Every entry must define all three languages. generate-glossary.mjs throws
 * rather than skipping one, because a glossary that is complete in Spanish and
 * has holes in Portuguese is a glossary whose hreflang cluster points at 404s.
 */
export const GLOSSARY = [
  {
    id: 'compound-interest',
    group: 'investing',
    related: ['real-return', 'inflation', 'dca'],
    es: {
      name: 'Interés compuesto',
      slug: 'interes-compuesto',
      aliases: ['capitalización compuesta', 'crecimiento compuesto', 'interés acumulado'],
      short: 'El efecto por el que los rendimientos de tu dinero empiezan a generar sus propios rendimientos, de modo que el capital crece de forma exponencial y no lineal.',
      body: `El interés compuesto aparece cuando **no retiras** lo que tu dinero ha ganado. Los intereses, dividendos o plusvalías se reinvierten y pasan a formar parte del capital que genera el siguiente rendimiento.

La diferencia con el interés simple es pequeña el primer año y enorme a treinta. Con una rentabilidad media del 7 % anual, 10.000 € se convierten en unos 19.700 € a diez años, 38.700 € a veinte y 76.100 € a treinta. Nada cambia en la aportación: lo único que cambia es el tiempo que se le ha dejado actuar.

Por eso el horizonte temporal es la variable más poderosa —y la única que no se puede comprar más tarde—. Un año de retraso no cuesta un año de rentabilidad: cuesta el año más valioso, que es el último.`
    },
    en: {
      name: 'Compound interest',
      slug: 'compound-interest',
      aliases: ['compounding', 'compound growth', 'compound returns'],
      short: 'The effect by which the returns on your money begin generating their own returns, so capital grows exponentially rather than linearly.',
      body: `Compound interest appears when you **do not withdraw** what your money has earned. Interest, dividends or capital gains are reinvested and become part of the capital that produces the next return.

The gap against simple interest is small in year one and enormous at thirty years. At an average 7% annual return, $10,000 becomes roughly $19,700 after ten years, $38,700 after twenty and $76,100 after thirty. Nothing about the contribution changed: the only thing that changed is how long it was left alone.

This is why time horizon is the most powerful variable you have, and the only one you cannot go back and buy later. A year of delay does not cost you one year of return. It costs the most valuable year, which is the last one.`
    },
    pt: {
      name: 'Juros compostos',
      slug: 'juros-compostos',
      aliases: ['capitalização composta', 'crescimento composto', 'juro composto'],
      short: 'O efeito pelo qual os rendimentos do seu dinheiro começam a gerar os seus próprios rendimentos, fazendo o capital crescer de forma exponencial e não linear.',
      body: `Os juros compostos aparecem quando você **não retira** o que o seu dinheiro rendeu. Juros, dividendos ou ganhos de capital são reinvestidos e passam a fazer parte do capital que gera o rendimento seguinte.

A diferença em relação aos juros simples é pequena no primeiro ano e enorme aos trinta. Com uma rentabilidade média de 7% ao ano, 10.000 viram cerca de 19.700 em dez anos, 38.700 em vinte e 76.100 em trinta. O aporte não mudou em nada: o que mudou foi o tempo que você deixou o dinheiro trabalhar.

É por isso que o horizonte temporal é a variável mais poderosa que você tem, e a única que não dá para comprar mais tarde. Um ano de atraso não custa um ano de rentabilidade. Custa o ano mais valioso, que é o último.`
    }
  },
  {
    id: 'inflation',
    group: 'money',
    related: ['real-return', 'compound-interest', 'emergency-fund'],
    es: {
      name: 'Inflación',
      slug: 'inflacion',
      aliases: ['subida de precios', 'pérdida de poder de compra'],
      short: 'La subida general y sostenida de los precios, que reduce lo que una misma cantidad de dinero puede comprar con el paso del tiempo.',
      body: `La inflación no te quita dinero de la cuenta: te quita capacidad de compra. Si los precios suben un 3 % al año, los 100 € que tienes hoy compran el equivalente a 97 € el año que viene, aunque el saldo siga diciendo 100.

Es la razón por la que el ahorro en efectivo no es neutral, sino una pérdida lenta. Una cuenta que no paga nada, con una inflación del 3 %, pierde alrededor de una cuarta parte de su poder de compra en diez años.

De ahí la distinción práctica entre ahorrar e invertir: el efectivo protege la **liquidez** a corto plazo, y los activos protegen el **poder de compra** a largo plazo. Las dos cosas son necesarias; confundirlas es lo que sale caro.`
    },
    en: {
      name: 'Inflation',
      slug: 'inflation',
      aliases: ['rising prices', 'loss of purchasing power'],
      short: 'The general, sustained rise in prices, which reduces what the same amount of money can buy over time.',
      body: `Inflation does not take money out of your account: it takes away purchasing power. If prices rise 3% a year, the $100 you hold today buys the equivalent of $97 next year, even though the balance still reads 100.

This is why holding cash is not neutral but a slow loss. An account paying nothing, against 3% inflation, loses roughly a quarter of its purchasing power over ten years.

Hence the practical distinction between saving and investing: cash protects short-term **liquidity**, and assets protect long-term **purchasing power**. Both are necessary; confusing the two is what gets expensive.`
    },
    pt: {
      name: 'Inflação',
      slug: 'inflacao',
      aliases: ['subida de preços', 'perda de poder de compra'],
      short: 'A subida geral e sustentada dos preços, que reduz aquilo que a mesma quantidade de dinheiro consegue comprar ao longo do tempo.',
      body: `A inflação não tira dinheiro da sua conta: tira capacidade de compra. Se os preços sobem 3% por ano, os 100 que você tem hoje compram o equivalente a 97 no ano seguinte, ainda que o saldo continue dizendo 100.

É por isso que a poupança em dinheiro não é neutra, mas uma perda lenta. Uma conta que não paga nada, com inflação de 3%, perde cerca de um quarto do seu poder de compra em dez anos.

Daí a distinção prática entre poupar e investir: o dinheiro protege a **liquidez** de curto prazo, e os ativos protegem o **poder de compra** de longo prazo. As duas coisas são necessárias; confundi-las é o que sai caro.`
    }
  },
  {
    id: 'real-return',
    group: 'investing',
    related: ['inflation', 'compound-interest', 'ter'],
    es: {
      name: 'Rentabilidad real',
      slug: 'rentabilidad-real',
      aliases: ['retorno real', 'rentabilidad ajustada a la inflación'],
      short: 'La rentabilidad que queda después de descontar la inflación: lo que realmente ha crecido tu poder de compra, no tu saldo.',
      body: `Una cartera que sube un 8 % en un año con una inflación del 3 % no te ha hecho un 8 % más rico. Te ha hecho aproximadamente un 5 % más rico. Esa cifra —la rentabilidad **real**— es la única que se puede comparar con tus gastos futuros, porque tus gastos futuros también suben con la inflación.

La rentabilidad nominal es la que aparece en los extractos y en los titulares. La real es la que decide si podrás mantener tu nivel de vida.

Si haces proyecciones a largo plazo, elige una de las dos formas coherentes: proyecta en términos nominales y ajusta el gasto futuro por inflación, o proyecta en términos reales y deja el gasto en euros de hoy. Mezclarlas es el error más común en cualquier hoja de cálculo de jubilación.`
    },
    en: {
      name: 'Real return',
      slug: 'real-return',
      aliases: ['real returns', 'inflation-adjusted return'],
      short: 'The return left after subtracting inflation: what your purchasing power actually gained, rather than what your balance did.',
      body: `A portfolio that rises 8% in a year with 3% inflation has not made you 8% richer. It has made you roughly 5% richer. That figure, the **real** return, is the only one you can compare against your future spending, because your future spending rises with inflation too.

Nominal return is what appears on statements and in headlines. Real return is what decides whether you can maintain your standard of living.

If you are projecting long term, pick one of the two coherent methods: project in nominal terms and inflate future spending, or project in real terms and leave spending in today's money. Mixing them is the single most common error in any retirement spreadsheet.`
    },
    pt: {
      name: 'Rentabilidade real',
      slug: 'rentabilidade-real',
      aliases: ['retorno real', 'rentabilidade ajustada à inflação'],
      short: 'A rentabilidade que sobra depois de descontar a inflação: aquilo que o seu poder de compra cresceu de fato, e não o seu saldo.',
      body: `Uma carteira que sobe 8% em um ano com inflação de 3% não deixou você 8% mais rico. Deixou você cerca de 5% mais rico. Esse número, a rentabilidade **real**, é o único que dá para comparar com as suas despesas futuras, porque as suas despesas futuras também sobem com a inflação.

A rentabilidade nominal é a que aparece nos extratos e nos títulos de jornal. A real é a que decide se conseguirá manter o seu nível de vida.

Se você fizer projeções de longo prazo, escolha uma das duas formas coerentes: projete em termos nominais e ajuste a despesa futura pela inflação, ou projete em termos reais e deixe a despesa em reais de hoje. Misturá-las é o erro mais comum em qualquer planilha de aposentadoria.`
    }
  },
{
    id: 'index-fund',
    group: 'investing',
    related: ['etf', 'ter', 'diversification', 'dca'],
    es: {
      name: 'Fondo indexado',
      slug: 'fondo-indexado',
      aliases: ['fondos indexados', 'fondo índice', 'gestión pasiva', 'indexación'],
      short: 'Un fondo que no intenta elegir las mejores empresas, sino replicar un índice completo al menor coste posible.',
      body: `Un fondo indexado compra todas las empresas de un índice —el S&P 500, el MSCI World— en la proporción que marca ese índice, y no toma ninguna decisión más. No hay gestor eligiendo valores, y por eso el coste es una fracción del de un fondo activo.

La razón por la que esto funciona no es que la indexación sea inteligente, sino que es **aritméticamente difícil de batir**. Todos los inversores juntos son el mercado; el rendimiento medio antes de costes es el del mercado, y después de costes es el del mercado menos las comisiones. Un producto que cobra 0,20 % parte con una ventaja estructural sobre uno que cobra 1,50 %, y esa ventaja se compone año tras año.

Lo que un fondo indexado **no** hace es protegerte de las caídas: si el índice cae un 35 %, tu fondo cae un 35 %. Su ventaja es el coste y la amplitud, no la estabilidad.`
    },
    en: {
      name: 'Index fund',
      slug: 'index-fund',
      aliases: ['index funds', 'index tracker', 'passive investing', 'indexing'],
      short: 'A fund that does not try to pick the best companies but instead replicates an entire index at the lowest possible cost.',
      body: `An index fund buys every company in an index (the S&P 500, the MSCI World, whichever it tracks) in the weights that index specifies, and then makes no further decisions. There is no manager selecting stocks, which is why the cost is a fraction of an active fund's.

The reason this works is not that indexing is clever but that it is **arithmetically hard to beat**. All investors together *are* the market; the average return before costs is the market's, and after costs it is the market's minus fees. A product charging 0.20% starts with a structural advantage over one charging 1.50%, and that advantage compounds year after year.

What an index fund does **not** do is protect you from falls: if the index drops 35%, your fund drops 35%. Its edge is cost and breadth, not stability.`
    },
    pt: {
      name: 'Fundo de índice',
      slug: 'fundo-de-indice',
      aliases: ['fundos de índice', 'fundo indexado', 'gestão passiva', 'indexação'],
      short: 'Um fundo que não tenta escolher as melhores empresas, mas replicar um índice completo ao menor custo possível.',
      body: `Um fundo de índice compra todas as empresas de um índice (o S&P 500, o MSCI World, seja qual for) na proporção que esse índice define, e depois não toma mais nenhuma decisão. Não há gestor escolhendo ações, e é por isso que o custo é uma fração do de um fundo ativo.

A razão pela qual isto funciona não é a indexação ser inteligente, mas ser **aritmeticamente difícil de bater**. Todos os investidores juntos *são* o mercado; o rendimento médio antes de custos é o do mercado, e depois de custos é o do mercado menos as comissões. Um produto que cobra 0,20% parte com uma vantagem estrutural sobre um que cobra 1,50%, e essa vantagem compõe-se ano após ano.

O que um fundo de índice **não** faz é proteger você das quedas: se o índice cai 35%, o seu fundo cai 35%. A sua vantagem é o custo e a amplitude, não a estabilidade.`
    }
  },
  {
    id: 'etf',
    group: 'investing',
    related: ['index-fund', 'ter', 'diversification'],
    es: {
      name: 'ETF',
      slug: 'etf',
      aliases: ['fondo cotizado', 'fondos cotizados', 'exchange traded fund'],
      short: 'Un fondo que cotiza en bolsa como una acción, y que en la práctica es la forma más habitual y barata de comprar un índice completo.',
      body: `ETF son las siglas de *exchange traded fund*: un fondo cuyas participaciones se compran y venden en el mercado durante toda la sesión, al precio del momento, en lugar de una vez al día como un fondo tradicional.

La mayoría de los ETF son indexados, pero las dos cosas no son sinónimas: existen ETF de gestión activa, apalancados, sectoriales o temáticos, y algunos de ellos son productos caros y concentrados con una etiqueta popular. Que algo sea un ETF no dice nada sobre si es una buena idea; lo que hay que mirar es **qué** replica, **cuánto** cuesta y **cómo** lo replica.

En España y Portugal hay una diferencia fiscal relevante frente a los fondos de inversión tradicionales, que en algunos casos permiten traspasos sin tributar. Es una de las pocas decisiones de este terreno en las que la fiscalidad local pesa más que el producto, y conviene consultarla con un profesional registrado.`
    },
    en: {
      name: 'ETF',
      slug: 'etf',
      aliases: ['exchange traded fund', 'exchange-traded fund', 'ETFs'],
      short: 'A fund that trades on an exchange like a share, and in practice the most common and cheapest way to buy a whole index.',
      body: `ETF stands for *exchange traded fund*: a fund whose units are bought and sold on the market throughout the trading day at the prevailing price, rather than once a day like a traditional fund.

Most ETFs are index funds, but the two are not synonyms: there are actively managed, leveraged, sector and thematic ETFs, and some are expensive, concentrated products wearing a popular label. That something is an ETF tells you nothing about whether it is a good idea; what matters is **what** it tracks, **what** it costs and **how** it tracks it.

Domicile and structure also affect the tax you pay on dividends, and that depends on where you live. It is one of the few decisions here where local tax treatment matters more than the product, and it is worth checking with a registered professional.`
    },
    pt: {
      name: 'ETF',
      slug: 'etf',
      aliases: ['fundo cotado', 'fundos cotados', 'exchange traded fund'],
      short: 'Um fundo que é negociado em bolsa como uma ação, e na prática a forma mais comum e barata de comprar um índice completo.',
      body: `ETF significa *exchange traded fund*: um fundo cujas unidades são compradas e vendidas no mercado ao longo de toda a sessão, ao preço do momento, em vez de uma vez por dia como um fundo tradicional.

A maioria dos ETF são indexados, mas as duas coisas não são sinônimos: existem ETF de gestão ativa, alavancados, setoriais ou temáticos, e alguns são produtos caros e concentrados com um rótulo popular. O fato de algo ser um ETF não diz nada sobre ser uma boa ideia; o que importa é **o que** replica, **quanto** custa e **como** replica.

O domicílio e a estrutura também afetam o imposto que paga sobre dividendos, e isso depende de onde vive. É uma das poucas decisões deste terreno em que a fiscalidade local pesa mais do que o produto, e vale a pena confirmá-la com um profissional registrado.`
    }
  },
  {
    id: 'ter',
    group: 'investing',
    related: ['index-fund', 'etf', 'compound-interest'],
    es: {
      name: 'TER (coste total)',
      slug: 'ter-coste-total',
      aliases: ['total expense ratio', 'comisión de gestión', 'gastos corrientes', 'ratio de gastos'],
      short: 'El porcentaje anual que un fondo cobra sobre el dinero invertido, se descuente en un buen año o en un año malo.',
      body: `El TER —*total expense ratio*— es el coste anual del fondo expresado como porcentaje del patrimonio. No se factura: se resta silenciosamente del valor de la participación, todos los días, lo que hace que sea el gasto más fácil de ignorar de toda una vida financiera.

La diferencia entre un 0,20 % y un 1,50 % parece trivial. Sobre 100.000 € durante treinta años al 7 %, son aproximadamente 200.000 € de diferencia en el patrimonio final. El coste no se resta de la rentabilidad: se resta de **todo el interés compuesto que esa rentabilidad habría generado**.

Es también la única variable de una cartera que conoces con certeza de antemano. La rentabilidad futura es una estimación; la comisión es un dato.`
    },
    en: {
      name: 'TER (total expense ratio)',
      slug: 'ter-total-expense-ratio',
      aliases: ['total expense ratio', 'expense ratio', 'management fee', 'ongoing charges'],
      short: 'The annual percentage a fund charges on the money you have invested, deducted in good years and bad alike.',
      body: `The TER, or total expense ratio, is a fund's annual cost as a percentage of assets. It is never invoiced: it is quietly subtracted from the unit price, every day, which makes it the easiest expense in a financial lifetime to ignore.

The gap between 0.20% and 1.50% looks trivial. On $100,000 over thirty years at 7%, it is roughly $200,000 of difference in the final balance. The cost is not subtracted from your return: it is subtracted from **all the compounding that return would have produced**.

It is also the only variable in a portfolio you know with certainty in advance. Future return is an estimate; the fee is a fact.`
    },
    pt: {
      name: 'TER (custo total)',
      slug: 'ter-custo-total',
      aliases: ['total expense ratio', 'comissão de gestão', 'encargos correntes', 'taxa de despesas'],
      short: 'A porcentagem anual que um fundo cobra sobre o dinheiro investido, descontada tanto num bom ano como num ano mau.',
      body: `O TER, ou *total expense ratio*, é o custo anual do fundo expresso como porcentagem do patrimônio. Não é faturado: é subtraído silenciosamente do valor da unidade, todos os dias, o que o torna a despesa mais fácil de ignorar de toda uma vida financeira.

A diferença entre 0,20% e 1,50% parece trivial. Sobre 100.000 durante trinta anos a 7%, são cerca de 200.000 de diferença no patrimônio final. O custo não se subtrai à rentabilidade: subtrai-se a **todos os juros compostos que essa rentabilidade teria gerado**.

É também a única variável de uma carteira que conhece com certeza de antemão. A rentabilidade futura é uma estimativa; a comissão é um dado.`
    }
  },
  {
    id: 'tax-deferral',
    group: 'investing',
    related: ['ter', 'compound-interest', 'opportunity-cost'],
    es: {
      name: 'Diferimiento fiscal',
      slug: 'diferimiento-fiscal',
      aliases: ['tax drag', 'lastre fiscal', 'fiscalidad diferida', 'diferir impuestos'],
      short: 'Pagar los impuestos de una inversión al final, cuando se vende, y no cada año por el camino, para que ese dinero siga generando rentabilidad mientras tanto.',
      body: `Un impuesto sobre la rentabilidad se puede pagar en dos momentos: cada año, a medida que se genera, o una sola vez, al vender. El tipo puede ser idéntico y el resultado no lo es. Lo que se paga cada año sale de la cartera y deja de componerse para siempre; lo que se paga al final ha estado trabajando para ti hasta el último día. Al primer efecto se le llama en inglés *tax drag*, el lastre fiscal; al segundo, diferimiento.

Con números: 100.000 € al 7 % durante treinta años, con un impuesto del 19 % sobre la ganancia. Pagándolo cada año, el resultado final ronda los 523.000 €. Pagándolo solo al vender, unos 635.000 € después de impuestos. Mismo tipo, misma rentabilidad, unos 112.000 € de diferencia.

En España, los fondos de inversión permiten traspasar de uno a otro sin tributar, y un fondo de acumulación no reparte dividendos, así que la plusvalía no pasa por Hacienda hasta el reembolso final. Es una de las pocas ventajas fiscales disponibles para cualquiera, y la razón por la que la forma de un producto importa tanto como su comisión.`
    },
    en: {
      name: 'Tax deferral',
      slug: 'tax-deferral',
      aliases: ['tax drag', 'tax-deferred', 'deferred tax', 'tax deferred'],
      short: 'Paying the tax on an investment at the end, when you sell, rather than every year along the way, so that money keeps earning in the meantime.',
      body: `Tax on investment returns can be paid at two moments: every year, as the return is earned, or once, when you sell. The rate can be identical and the outcome is not. What is paid each year leaves the portfolio and stops compounding for good; what is paid at the end has been working for you until the last day. The first effect is called tax drag; the second, deferral.

In numbers: $100,000 at 7% for thirty years, with a 15% tax on the gain. Paid every year, the final balance comes to about $566,000. Paid only when you sell, about $662,000 after tax. Same rate, same return, roughly $96,000 apart.

This is why a fund that distributes a lot every year costs more than its fee suggests in a taxable account, and why accounts like a 401(k), an IRA or a Roth IRA are worth so much over decades. The wrapper decides when the tax falls, and when is most of what matters.`
    },
    pt: {
      name: 'Diferimento fiscal',
      slug: 'diferimento-fiscal',
      aliases: ['tax drag', 'come-cotas', 'arrasto fiscal', 'imposto diferido'],
      short: 'Pagar o imposto de um investimento no fim, quando se resgata, e não todos os anos pelo caminho, para que esse dinheiro continue rendendo entretanto.',
      body: `Um imposto sobre a rentabilidade pode ser pago em dois momentos: todo ano, à medida que o rendimento surge, ou uma única vez, no resgate. A alíquota pode ser idêntica e o resultado não é. O que se paga todo ano sai da carteira e deixa de render para sempre; o que se paga no fim trabalhou para você até o último dia. Ao primeiro efeito chama-se em inglês *tax drag*, o arrasto fiscal; ao segundo, diferimento.

Com números: 100.000 a 7% durante trinta anos, com 15% de imposto sobre o ganho. Pagando todo ano, o saldo final fica perto de 566.000. Pagando só no resgate, cerca de 662.000 já depois do imposto. Mesma alíquota, mesma rentabilidade, perto de 96.000 de diferença.

No Brasil, o come-cotas é o exemplo clássico do primeiro caso: a cada maio e novembro, os fundos de renda fixa e multimercado recolhem o imposto sobre o rendimento do semestre, mesmo sem resgate. Um CDB ou um título do Tesouro sem cupom só é tributado no resgate, e os fundos de ações só na venda, o que faz da forma do produto uma decisão tão importante quanto a taxa.`
    }
  },
  {
    id: 'dca',
    group: 'investing',
    related: ['compound-interest', 'volatility', 'pay-yourself-first'],
    es: {
      name: 'Aportación periódica (DCA)',
      slug: 'aportacion-periodica-dca',
      aliases: ['dollar cost averaging', 'DCA', 'coste medio ponderado', 'aportaciones periódicas'],
      short: 'Invertir una cantidad fija a intervalos regulares, en lugar de intentar acertar con el momento de entrada.',
      body: `La aportación periódica consiste en invertir la misma cantidad cada mes, pase lo que pase. Cuando el mercado baja, esa cantidad compra más participaciones; cuando sube, compra menos. El precio medio pagado acaba siendo más bajo que la media de los precios.

Su virtud principal, sin embargo, no es matemática, sino **conductual**: convierte una decisión difícil y repetida —¿es buen momento?— en una transferencia automática que no requiere ninguna decisión. Elimina la parte del proceso en la que se pierde más dinero.

Un matiz honesto: si ya tienes una cantidad grande en efectivo, la historia dice que invertirla de golpe suele batir a repartirla, simplemente porque el mercado sube más veces de las que baja. Repartirla es peor de media y mucho mejor si la alternativa realista era no invertir nunca.`
    },
    en: {
      name: 'Dollar cost averaging (DCA)',
      slug: 'dollar-cost-averaging',
      aliases: ['DCA', 'pound cost averaging', 'regular investing', 'averaging in'],
      short: 'Investing a fixed amount at regular intervals instead of trying to time your entry.',
      body: `Dollar cost averaging means investing the same amount every month, whatever happens. When the market falls, that amount buys more units; when it rises, fewer. The average price paid ends up below the average of the prices.

Its main virtue, though, is not mathematical but **behavioral**: it turns a hard, repeated decision (is this a good moment to buy?) into an automatic transfer that requires no decision at all. It removes the part of the process where most money is lost.

One honest caveat: if you already hold a large cash sum, history says investing it at once usually beats spreading it out, simply because markets rise more often than they fall. Spreading it out is worse on average and far better if the realistic alternative was never investing.`
    },
    pt: {
      name: 'Investimento periódico (DCA)',
      slug: 'investimento-periodico-dca',
      aliases: ['dollar cost averaging', 'DCA', 'custo médio', 'reforços periódicos'],
      short: 'Investir um valor fixo em intervalos regulares, em vez de tentar acertar no momento de entrada.',
      body: `O investimento periódico consiste em investir o mesmo valor todos os meses, aconteça o que acontecer. Quando o mercado desce, esse valor compra mais unidades; quando sobe, compra menos. O preço médio pago acaba por ser mais baixo do que a média dos preços.

A sua principal virtude, no entanto, não é matemática, mas **comportamental**: transforma uma decisão difícil e repetida (é um bom momento para comprar?) em uma transferência automática que não exige decisão nenhuma. Ela tira do caminho justamente a parte do processo em que se perde mais dinheiro.

Uma ressalva honesta: se já tem um montante grande em dinheiro, a história diz que investi-lo de uma vez costuma bater o faseamento, simplesmente porque os mercados sobem mais vezes do que descem. Fasear é pior em média e muito melhor se a alternativa realista era nunca investir.`
    }
  },
{
    id: 'diversification',
    group: 'investing',
    related: ['asset-allocation', 'index-fund', 'volatility'],
    es: {
      name: 'Diversificación',
      slug: 'diversificacion',
      aliases: ['diversificar', 'cartera diversificada'],
      short: 'Repartir el dinero entre suficientes activos distintos para que ninguno de ellos, por sí solo, pueda arruinarte.',
      body: `Diversificar no significa tener muchas cosas: significa tener cosas que **no fallan al mismo tiempo**. Diez acciones del mismo banco no diversifican nada; un fondo global con tres mil empresas de cuarenta países sí.

La diversificación no aumenta la rentabilidad esperada. Lo que hace es reducir la probabilidad de un resultado catastrófico, y eso importa porque una pérdida del 100 % en una posición no se recupera con una ganancia del 100 % en otra. Es un seguro contra estar equivocado, y todos lo estamos alguna vez.

El caso extremo es el riesgo de concentración que casi nadie cuenta: si tu sueldo, tus acciones y tu plan de pensiones dependen de la misma empresa, tienes una cartera de un solo activo con tres nombres distintos.`
    },
    en: {
      name: 'Diversification',
      slug: 'diversification',
      aliases: ['diversify', 'diversified portfolio', 'diversifying'],
      short: 'Spreading money across enough different assets that no single one of them can ruin you.',
      body: `Diversifying does not mean owning many things: it means owning things that **do not fail at the same time**. Ten shares in the same bank diversify nothing; a global fund holding three thousand companies across forty countries does.

Diversification does not raise expected return. What it does is reduce the chance of a catastrophic outcome, and that matters because a 100% loss in one position is not recovered by a 100% gain in another. It is insurance against being wrong, and everyone is wrong sometimes.

The extreme case is the concentration risk almost nobody counts: if your salary, your shares and your pension all depend on the same employer, you hold a one-asset portfolio under three different names.`
    },
    pt: {
      name: 'Diversificação',
      slug: 'diversificacao',
      aliases: ['diversificar', 'carteira diversificada'],
      short: 'Distribuir o dinheiro por ativos suficientemente diferentes para que nenhum deles, por si só, te possa arruinar.',
      body: `Diversificar não significa ter muitas coisas: significa ter coisas que **não falham ao mesmo tempo**. Dez ações do mesmo banco não diversificam nada; um fundo global com três mil empresas de quarenta países sim.

A diversificação não aumenta a rentabilidade esperada. O que faz é reduzir a probabilidade de um resultado catastrófico, e isso importa porque uma perda de 100% numa posição não se recupera com um ganho de 100% noutra. É um seguro contra estar errado, e todos estamos alguma vez.

O caso extremo é o risco de concentração que quase ninguém conta: se o seu salário, as suas ações e o seu plano de pensões dependem da mesma empresa, tem uma carteira de um só ativo com três nomes diferentes.`
    }
  },
  {
    id: 'asset-allocation',
    group: 'investing',
    related: ['diversification', 'rebalancing', 'volatility', 'drawdown'],
    es: {
      name: 'Distribución de activos',
      slug: 'distribucion-de-activos',
      aliases: ['asset allocation', 'reparto de activos', 'composición de la cartera'],
      short: 'Cómo se reparte una cartera entre tipos de activo —renta variable, renta fija, efectivo— y la decisión que más explica su comportamiento.',
      body: `La distribución de activos es la respuesta a "¿qué porcentaje en acciones y qué porcentaje en bonos?". Los estudios clásicos atribuyen a esa decisión la mayor parte de la variabilidad de los resultados de una cartera a lo largo del tiempo: mucho más que la elección de valores concretos.

Una cartera 80/20 y una 40/60 no son versiones más o menos ambiciosas de la misma cosa. Son dos experiencias distintas: la primera puede caer un 35 % en un año malo, la segunda alrededor de un 18 %. Ambas cifras son normales, y la pregunta relevante no es cuál rinde más, sino cuál puedes sostener sin vender.

Por eso el porcentaje correcto depende más de tu **horizonte** y de tu tolerancia real —no la declarada— que de ninguna previsión de mercado.`
    },
    en: {
      name: 'Asset allocation',
      slug: 'asset-allocation',
      aliases: ['allocation', 'portfolio mix', 'stock bond split'],
      short: 'How a portfolio is divided between asset types (equities, bonds, cash), and the decision that explains most of its behavior.',
      body: `Asset allocation is the answer to "what percentage in stocks and what percentage in bonds?". Classic studies attribute most of the variability in a portfolio's results over time to that decision: far more than the choice of individual holdings.

An 80/20 portfolio and a 40/60 portfolio are not more and less ambitious versions of the same thing. They are two different experiences: the first can fall 35% in a bad year, the second around 18%. Both figures are normal, and the relevant question is not which returns more but which you can hold without selling.

That is why the right percentage depends more on your **horizon** and your actual tolerance, not the tolerance you would claim in a calm month, than on any market forecast.`
    },
    pt: {
      name: 'Alocação de ativos',
      slug: 'alocacao-de-ativos',
      aliases: ['asset allocation', 'distribuição de ativos', 'composição da carteira'],
      short: 'Como uma carteira se divide entre tipos de ativo (ações, títulos, liquidez), e a decisão que mais explica o comportamento dela.',
      body: `A alocação de ativos é a resposta a "que porcentagem em ações e que porcentagem em títulos?". Os estudos clássicos atribuem a essa decisão a maior parte da variabilidade dos resultados de uma carteira ao longo do tempo: muito mais do que a escolha de títulos concretos.

Uma carteira 80/20 e uma 40/60 não são versões mais ou menos ambiciosas da mesma coisa. São duas experiências diferentes: a primeira pode cair 35% num ano mau, a segunda cerca de 18%. Ambos os números são normais, e a pergunta relevante não é qual rende mais, mas qual consegue manter sem vender.

É por isso que a porcentagem correta depende mais do seu **horizonte** e da sua tolerância real, não a que você diria ter num mês tranquilo, do que de qualquer previsão de mercado.`
    }
  },
  {
    id: 'rebalancing',
    group: 'investing',
    related: ['asset-allocation', 'diversification', 'loss-aversion'],
    es: {
      name: 'Rebalanceo',
      slug: 'rebalanceo',
      aliases: ['rebalancear', 'reequilibrio de cartera', 'rebalanceo de cartera'],
      short: 'Devolver la cartera a sus porcentajes objetivo vendiendo lo que ha subido y comprando lo que ha bajado.',
      body: `Con el tiempo, una cartera 70/30 deja de serlo: si las acciones suben mucho, se convierte en un 80/20 sin que hayas decidido nada. Rebalancear es venderla parte que se ha pasado y comprar la que se ha quedado corta, hasta volver a los porcentajes que elegiste.

Su función principal es **control de riesgo**, no rentabilidad: evita que la cartera se vuelva más agresiva justo después de una buena racha, que es cuando más se parece a una buena idea y menos lo es.

Es también la operación psicológicamente más incómoda de la inversión, porque obliga a vender lo que va bien y comprar lo que va mal. Por eso funciona mejor como regla mecánica —una vez al año, o cuando una posición se desvíe más de cinco puntos— que como decisión discrecional.`
    },
    en: {
      name: 'Rebalancing',
      slug: 'rebalancing',
      aliases: ['rebalance', 'portfolio rebalancing', 'rebalanced'],
      short: 'Returning a portfolio to its target weights by selling what has risen and buying what has fallen.',
      body: `Over time a 70/30 portfolio stops being one: if equities run up, it becomes 80/20 without you deciding anything. Rebalancing means selling the part that has overshot and buying the part that has fallen behind, until the weights you chose are restored.

Its main function is **risk control**, not return: it stops a portfolio from turning more aggressive right after a good run, which is exactly when doing so feels most like a good idea and is least likely to be one.

It is also the most psychologically uncomfortable operation in investing, because it forces you to sell what is working and buy what is not. That is why it works better as a mechanical rule (once a year, or whenever a position drifts more than five points) than as a call you make in the moment.`
    },
    pt: {
      name: 'Rebalanceamento',
      slug: 'rebalanceamento',
      aliases: ['rebalancear', 'reequilíbrio da carteira', 'rebalanceamento de carteira'],
      short: 'Devolver a carteira aos seus pesos-alvo vendendo o que subiu e comprando o que desceu.',
      body: `Com o tempo, uma carteira 70/30 para de ser 70/30: se as ações sobem muito, ela vira uma 80/20 sem que você tenha decidido nada. Rebalancear é vender a parte que se excedeu e comprar a que ficou curta, até voltar aos pesos que escolheu.

A sua função principal é **controle de risco**, não rentabilidade: evita que a carteira se torne mais agressiva logo depois de uma boa fase, que é quando isso mais parece boa ideia e menos o é.

É também a operação psicologicamente mais desconfortável do investimento, porque obriga a vender o que está indo bem e a comprar o que está indo mal. Por isso funciona melhor como regra mecânica (uma vez por ano, ou quando uma posição se desvia mais de cinco pontos) do que como decisão tomada no calor do momento.`
    }
  },
  {
    id: 'volatility',
    group: 'investing',
    related: ['drawdown', 'asset-allocation', 'loss-aversion'],
    es: {
      name: 'Volatilidad',
      slug: 'volatilidad',
      aliases: ['volátil', 'desviación típica', 'variabilidad'],
      short: 'La magnitud con la que el precio de un activo oscila arriba y abajo; una medida de movimiento, no necesariamente de peligro.',
      body: `La volatilidad mide cuánto se mueve un precio alrededor de su media. Un fondo con una volatilidad anual del 18 % tendrá años de +25 % y años de −15 % sin que nada extraordinario haya ocurrido.

Conviene separarla del **riesgo**. El riesgo, para alguien que ahorra a treinta años, es no alcanzar su objetivo; la volatilidad es solo el precio de admisión que cobran los activos que históricamente lo hacen posible. Un depósito no tiene volatilidad y sí tiene un riesgo enorme para ese objetivo: la certeza de perder poder de compra frente a la inflación.

Donde la volatilidad se convierte en riesgo real es cuando obliga a vender: porque el horizonte era más corto de lo previsto, porque no había fondo de emergencia, o porque el nivel de caída era insoportable.`
    },
    en: {
      name: 'Volatility',
      slug: 'volatility',
      aliases: ['volatile', 'standard deviation', 'price swings'],
      short: 'How much an asset’s price swings up and down; a measure of movement, not necessarily of danger.',
      body: `Volatility measures how much a price moves around its average. A fund with 18% annual volatility will have +25% years and −15% years without anything extraordinary having happened.

It is worth separating from **risk**. Risk, for someone saving over thirty years, is failing to reach the goal; volatility is merely the admission price charged by the assets that historically make it reachable. A savings account has no volatility and carries enormous risk against that goal: the certainty of losing purchasing power to inflation.

Where volatility becomes real risk is when it forces a sale: because the horizon was shorter than assumed, because there was no emergency fund, or because the size of the fall was unbearable.`
    },
    pt: {
      name: 'Volatilidade',
      slug: 'volatilidade',
      aliases: ['volátil', 'desvio-padrão', 'variabilidade'],
      short: 'A magnitude com que o preço de um ativo oscila para cima e para baixo; uma medida de movimento, não necessariamente de perigo.',
      body: `A volatilidade mede quanto um preço se move em torno da sua média. Um fundo com volatilidade anual de 18% terá anos de +25% e anos de −15% sem que nada de extraordinário tenha acontecido.

Convém separá-la do **risco**. O risco, para quem poupa a trinta anos, é não atingir o objetivo; a volatilidade é apenas o preço de entrada cobrado pelos ativos que historicamente o tornam possível. Um depósito não tem volatilidade e tem um risco enorme para esse objetivo: a certeza de perder poder de compra face à inflação.

Onde a volatilidade se converte em risco real é quando obriga a vender: porque o horizonte era mais curto do que o previsto, porque não havia fundo de emergência, ou porque o nível de queda era insuportável.`
    }
  },
  {
    id: 'drawdown',
    group: 'investing',
    related: ['volatility', 'sequence-risk', 'asset-allocation'],
    es: {
      name: 'Caída máxima (drawdown)',
      slug: 'caida-maxima-drawdown',
      aliases: ['drawdown', 'máximo drawdown', 'caída desde máximos'],
      short: 'La pérdida acumulada desde el punto más alto que alcanzó una cartera hasta su punto más bajo posterior.',
      body: `Si una cartera llega a 100.000 € y baja a 62.000 € antes de volver a subir, su caída máxima fue del 38 %. Es la cifra que describe lo que un inversor **vivió**, y por eso es más útil que la volatilidad para decidir cuánto riesgo se puede tolerar.

La renta variable global ha tenido caídas superiores al 40 % varias veces en el último siglo, y prácticamente todas se recuperaron. Pero se recuperaron para quien siguió dentro.

Un ejercicio honesto antes de elegir una cartera: coge tu patrimonio actual, réstale un 40 % y mira la cifra resultante. Si a ese número le sigues llamando "una mala racha", tu distribución es soportable. Si le llamas "una emergencia", es demasiado agresiva, independientemente de lo que diga cualquier cuestionario.`
    },
    en: {
      name: 'Drawdown',
      slug: 'drawdown',
      aliases: ['maximum drawdown', 'max drawdown', 'peak-to-trough loss'],
      short: 'The cumulative loss from a portfolio’s highest point to its lowest point afterwards.',
      body: `If a portfolio reaches $100,000 and falls to $62,000 before recovering, its maximum drawdown was 38%. It is the number describing what an investor actually **lived through**, which makes it more useful than volatility for deciding how much risk you can tolerate.

Global equities have fallen more than 40% several times in the past century, and virtually all of those falls recovered. But they recovered for the people who stayed invested.

An honest exercise before choosing a portfolio: take your current net worth, subtract 40%, and look at the resulting figure. If you still call that number "a rough patch", your allocation is bearable. If you call it "an emergency", it is too aggressive, whatever any questionnaire says.`
    },
    pt: {
      name: 'Queda máxima (drawdown)',
      slug: 'queda-maxima-drawdown',
      aliases: ['drawdown', 'drawdown máximo', 'queda desde máximos'],
      short: 'A perda acumulada desde o ponto mais alto que uma carteira atingiu até ao seu ponto mais baixo posterior.',
      body: `Se uma carteira chega a 100.000 e desce para 62.000 antes de voltar a subir, a sua queda máxima foi de 38%. É o número que descreve o que um investidor **viveu**, e por isso é mais útil do que a volatilidade para decidir quanto risco se tolera.

As ações globais tiveram quedas superiores a 40% várias vezes no último século, e praticamente todas recuperaram. Mas recuperaram para quem se manteve investido.

Um exercício honesto antes de escolher uma carteira: pegue o seu patrimônio atual, subtraia 40% e olhe para o número que sobra. Se você continua chamando aquilo de "uma fase ruim", a sua alocação é suportável. Se chama de "uma emergência", ela é agressiva demais, diga o que disser qualquer questionário.`
    }
  },
{
    id: 'four-percent-rule',
    group: 'money',
    related: ['safe-withdrawal-rate', 'fire', 'sequence-risk', 'monte-carlo'],
    es: {
      name: 'Regla del 4 %',
      slug: 'regla-del-4-por-ciento',
      aliases: ['regla del 4%', 'regla del cuatro por ciento', 'estudio Trinity'],
      short: 'La regla aproximada según la cual puedes retirar el 4 % de tu cartera el primer año, ajustar esa cantidad por inflación y esperar que dure treinta años.',
      body: `Viene del *estudio Trinity* de 1998, que probó carteras de acciones y bonos contra la historia de mercado de EE. UU. y encontró que una retirada inicial del 4 %, ajustada cada año por inflación, sobrevivió treinta años en la gran mayoría de los periodos analizados.

Su utilidad real es como **regla de dimensionamiento**: invertida, dice que necesitas unas 25 veces tu gasto anual. Ese es el número que convierte "quiero ser independiente" en una cifra concreta, y es la razón por la que la regla se ha vuelto famosa.

Sus límites son igual de importantes: supone treinta años (no cincuenta), mercados estadounidenses del siglo XX, un gasto que no se ajusta nunca a la baja y ninguna comisión. Con costes del 1 %, horizontes más largos o valoraciones de partida altas, el porcentaje seguro es menor. No es una ley física: es un punto de partida para hacer tus propios números.`
    },
    en: {
      name: '4% rule',
      slug: 'four-percent-rule',
      aliases: ['4 percent rule', 'four percent rule', 'Trinity study'],
      short: 'The rough rule that you can withdraw 4% of your portfolio in year one, adjust that amount for inflation, and expect it to last thirty years.',
      body: `It comes from the 1998 *Trinity study*, which tested stock-and-bond portfolios against US market history and found that a 4% initial withdrawal, inflation-adjusted each year, survived thirty years in the large majority of periods examined.

Its real usefulness is as a **sizing rule**: inverted, it says you need roughly 25 times your annual spending. That is the number which turns "I want to be independent" into a concrete figure, and it is why the rule became famous.

Its limits matter just as much: it assumes thirty years (not fifty), twentieth-century US markets, spending that never adjusts downward, and zero fees. With 1% costs, longer horizons, or high starting valuations, the safe percentage is lower. It is not a law of physics: it is a starting point for running your own numbers.`
    },
    pt: {
      name: 'Regra dos 4%',
      slug: 'regra-dos-4-por-cento',
      aliases: ['regra dos 4%', 'regra dos quatro por cento', 'estudo Trinity'],
      short: 'A regra aproximada segundo a qual pode retirar 4% da sua carteira no primeiro ano, ajustar esse valor pela inflação e esperar que dure trinta anos.',
      body: `Vem do *estudo Trinity* de 1998, que testou carteiras de ações e títulos contra a história dos mercados dos EUA e concluiu que uma retirada inicial de 4%, ajustada anualmente pela inflação, sobreviveu trinta anos na grande maioria dos períodos analisados.

A sua utilidade real é como **regra de dimensionamento**: invertida, diz que precisa de cerca de 25 vezes a sua despesa anual. É o número que transforma "quero ser independente" numa cifra concreta, e é por isso que a regra ficou famosa.

Os seus limites são igualmente importantes: pressupõe trinta anos (não cinquenta), mercados americanos do século XX, uma despesa que nunca se ajusta para baixo e zero comissões. Com custos de 1%, horizontes mais longos ou avaliações iniciais altas, a porcentagem segura é menor. Não é uma lei física: é um ponto de partida para fazer as suas próprias contas.`
    }
  },
  {
    id: 'safe-withdrawal-rate',
    group: 'money',
    related: ['four-percent-rule', 'sequence-risk', 'fire', 'monte-carlo'],
    es: {
      name: 'Tasa segura de retirada',
      slug: 'tasa-segura-de-retirada',
      aliases: ['safe withdrawal rate', 'SWR', 'tasa de retiro segura'],
      short: 'El porcentaje de una cartera que se puede gastar cada año con una probabilidad alta de que el dinero no se agote antes que tú.',
      body: `La tasa segura de retirada responde a la pregunta inversa de la acumulación: ya no "cuánto necesito", sino "cuánto puedo sacar sin quedarme sin nada". Se expresa como porcentaje del valor inicial de la cartera, no del valor de cada año.

Depende de cuatro cosas: el **horizonte** (treinta años admite más que cincuenta), la **distribución de activos** (demasiada renta fija reduce la tasa tanto como demasiada volatilidad), los **costes** (cada punto de comisión sale directamente de aquí) y la **flexibilidad** (poder recortar el gasto un 10 % en un año malo cambia el cálculo por completo).

Una tasa "segura" no es una garantía, sino una probabilidad. Cualquier cifra que veas viene acompañada de un porcentaje de éxito implícito, y merece la pena preguntar cuál es antes de construir una vida sobre ella.`
    },
    en: {
      name: 'Safe withdrawal rate',
      slug: 'safe-withdrawal-rate',
      aliases: ['SWR', 'withdrawal rate', 'sustainable withdrawal rate'],
      short: 'The percentage of a portfolio you can spend each year with a high probability that the money does not run out before you do.',
      body: `The safe withdrawal rate answers the inverse of the accumulation question: no longer "how much do I need" but "how much can I take out without running dry". It is expressed as a percentage of the portfolio's starting value, not of each year's value.

It depends on four things: the **horizon** (thirty years supports more than fifty), the **asset allocation** (too much fixed income lowers the rate as surely as too much volatility does), the **costs** (every point of fees comes straight out of here), and the **flexibility** (being able to cut spending 10% in a bad year changes the arithmetic entirely).

A "safe" rate is not a guarantee but a probability. Any figure you see comes with an implied success rate attached, and it is worth asking what that is before building a life on top of it.`
    },
    pt: {
      name: 'Taxa segura de retirada',
      slug: 'taxa-segura-de-retirada',
      aliases: ['safe withdrawal rate', 'SWR', 'taxa de retirada sustentável'],
      short: 'A porcentagem de uma carteira que se pode gastar por ano com uma probabilidade alta de o dinheiro não acabar antes de você.',
      body: `A taxa segura de retirada responde à pergunta inversa da acumulação: já não "quanto preciso", mas "quanto posso retirar sem ficar sem nada". Expressa-se como porcentagem do valor inicial da carteira, não do valor de cada ano.

Depende de quatro coisas: o **horizonte** (trinta anos admite mais do que cinquenta), a **alocação de ativos** (títulos demais reduzem a taxa tanto quanto volatilidade demais), os **custos** (cada ponto de comissão sai diretamente daqui) e a **flexibilidade** (poder cortar a despesa 10% num ano mau muda a aritmética por completo).

Uma taxa "segura" não é uma garantia, mas uma probabilidade. Qualquer número que veja vem acompanhado de uma taxa de sucesso implícita, e vale a pena perguntar qual é antes de construir uma vida sobre ele.`
    }
  },
  {
    id: 'fire',
    group: 'money',
    related: ['four-percent-rule', 'safe-withdrawal-rate', 'savings-rate', 'passive-income'],
    es: {
      name: 'FIRE (independencia financiera)',
      slug: 'fire-independencia-financiera',
      aliases: ['independencia financiera', 'financial independence retire early', 'movimiento FIRE', 'libertad financiera'],
      short: 'El punto en el que tus activos generan lo suficiente para cubrir tus gastos, de modo que trabajar se convierte en una elección y no en una obligación.',
      body: `FIRE son las siglas de *Financial Independence, Retire Early*. La parte más útil del concepto es la primera: la independencia financiera es un estado —tus activos cubren tus gastos— y la jubilación anticipada es solo una de las cosas que puedes hacer con ella.

La aritmética es sorprendentemente simple y bastante brutal: lo que determina el tiempo hasta la independencia no es tu sueldo, sino tu **tasa de ahorro**. Alguien que ahorra el 10 % necesita décadas; alguien que ahorra el 50 % necesita algo más de quince años, porque cada euro ahorrado sube el numerador y baja el denominador a la vez.

El error más frecuente del movimiento no es matemático sino de propósito: optimizar durante quince años para llegar a un destino sin haber decidido qué se hace allí. La independencia financiera compra opciones, no significado.`
    },
    en: {
      name: 'FIRE (financial independence)',
      slug: 'fire-financial-independence',
      aliases: ['financial independence', 'financial independence retire early', 'FIRE movement', 'retire early'],
      short: 'The point at which your assets generate enough to cover your expenses, so that working becomes a choice rather than an obligation.',
      body: `FIRE stands for *Financial Independence, Retire Early*. The more useful half of the concept is the first: financial independence is a state, meaning your assets cover your costs, and early retirement is only one of the things you can do with it.

The arithmetic is surprisingly simple and fairly brutal: what determines time to independence is not your salary but your **savings rate**. Someone saving 10% needs decades; someone saving 50% needs a little over fifteen years, because every unit saved raises the numerator and lowers the denominator at once.

The movement's most common mistake is not mathematical but about purpose: optimizing for fifteen years to reach a destination without having decided what happens there. Financial independence buys options, not meaning.`
    },
    pt: {
      name: 'FIRE (independência financeira)',
      slug: 'fire-independencia-financeira',
      aliases: ['independência financeira', 'financial independence retire early', 'movimento FIRE', 'liberdade financeira'],
      short: 'O ponto em que os seus ativos geram o suficiente para cobrir as suas despesas, tornando o trabalho numa escolha e não numa obrigação.',
      body: `FIRE são as iniciais de *Financial Independence, Retire Early*. A parte mais útil do conceito é a primeira: a independência financeira é um estado, ou seja, os seus ativos cobrem os seus custos, e a aposentadoria antecipada é apenas uma das coisas que você pode fazer com ela.

A aritmética é surpreendentemente simples e bastante brutal: o que determina o tempo até a independência não é o seu salário, mas a sua **taxa de poupança**. Quem poupa 10% precisa de décadas; quem poupa 50% precisa de pouco mais de quinze anos, porque cada real poupado sobe o numerador e baixa o denominador ao mesmo tempo.

O erro mais frequente do movimento não é matemático mas de propósito: otimizar durante quinze anos para chegar a um destino sem ter decidido o que se faz lá. A independência financeira compra opções, não significado.`
    }
  },
  {
    id: 'sequence-risk',
    group: 'investing',
    related: ['safe-withdrawal-rate', 'drawdown', 'four-percent-rule', 'monte-carlo'],
    es: {
      name: 'Riesgo de secuencia de rentabilidades',
      slug: 'riesgo-de-secuencia-de-rentabilidades',
      aliases: ['sequence of returns risk', 'riesgo de secuencia', 'orden de las rentabilidades'],
      short: 'El riesgo de que las malas rentabilidades lleguen al principio de la etapa de retiradas, cuando aún hay mucho capital que perder.',
      body: `Dos jubilados con la **misma rentabilidad media** a lo largo de treinta años pueden acabar en situaciones opuestas si el orden de esos años fue distinto. Quien sufre una caída del 30 % en el año dos, mientras retira dinero, vende participaciones a precios bajos y reduce de forma permanente el capital que puede recuperarse. Quien la sufre en el año veinticinco apenas lo nota.

Es la razón por la que la fase de retiradas no es simplemente la acumulación al revés. En acumulación, una caída temprana es una oportunidad: compras más barato. En retiradas, es un daño irreversible.

Las defensas habituales son tener dos o tres años de gasto en activos estables, aceptar recortar el gasto en los años malos, y no empezar a retirar justo con la cartera más agresiva de tu vida.`
    },
    en: {
      name: 'Sequence of returns risk',
      slug: 'sequence-of-returns-risk',
      aliases: ['sequence risk', 'sequencing risk', 'order of returns'],
      short: 'The risk that poor returns arrive early in your withdrawal phase, while there is still a large balance to lose.',
      body: `Two retirees with the **same average return** over thirty years can end up in opposite situations if the order of those years differed. Someone who takes a 30% fall in year two, while withdrawing, sells units at low prices and permanently shrinks the capital that can recover. Someone who takes it in year twenty-five barely notices.

This is why the withdrawal phase is not simply accumulation in reverse. In accumulation, an early fall is an opportunity: you buy cheaper. In withdrawal, it is irreversible damage.

The usual defenses are holding two or three years of spending in stable assets, accepting spending cuts in bad years, and not starting withdrawals with the most aggressive portfolio of your life.`
    },
    pt: {
      name: 'Risco de sequência de rentabilidades',
      slug: 'risco-de-sequencia-de-rentabilidades',
      aliases: ['sequence of returns risk', 'risco de sequência', 'ordem das rentabilidades'],
      short: 'O risco de as más rentabilidades chegarem no início da fase de retiradas, quando ainda há muito capital a perder.',
      body: `Dois aposentados com a **mesma rentabilidade média** ao longo de trinta anos podem acabar em situações opostas se a ordem desses anos foi diferente. Quem sofre uma queda de 30% no ano dois, enquanto retira dinheiro, vende unidades a preços baixos e reduz permanentemente o capital que pode recuperar. Quem a sofre no ano vinte e cinco quase não nota.

É por isso que a fase de retiradas não é simplesmente a acumulação ao contrário. Na acumulação, uma queda precoce é uma oportunidade: você compra mais barato. Nas retiradas, é um dano irreversível.

As defesas habituais são ter dois ou três anos de despesa em ativos estáveis, aceitar cortar a despesa nos anos maus, e não começar a retirar precisamente com a carteira mais agressiva da sua vida.`
    }
  },
  {
    id: 'monte-carlo',
    group: 'investing',
    related: ['sequence-risk', 'safe-withdrawal-rate', 'volatility'],
    es: {
      name: 'Simulación de Monte Carlo',
      slug: 'simulacion-de-monte-carlo',
      aliases: ['Monte Carlo', 'simulaciones de Monte Carlo', 'método de Monte Carlo'],
      short: 'Un método que proyecta miles de futuros posibles con rentabilidades aleatorias, para estimar la probabilidad de un resultado en lugar de una sola cifra.',
      body: `Una hoja de cálculo con un 7 % fijo produce un único número, y ese número es casi con seguridad falso: ningún mercado entrega un 7 % todos los años. Una simulación de Monte Carlo sortea miles de secuencias de rentabilidades plausibles y mira cuántas de ellas terminan bien.

El resultado no es "tendrás 480.000 €", sino algo mucho más útil: "en el 85 % de los escenarios el dinero duró treinta años; en el 15 % se agotó antes". Eso convierte una previsión en una **probabilidad**, que es la forma correcta de pensar sobre el futuro financiero.

Su límite obvio: la simulación solo sabe lo que le has dicho. Si las rentabilidades y volatilidades que introduces son optimistas, obtendrás mil futuros optimistas. Es una herramienta para explorar la sensibilidad de un plan, no un oráculo.`
    },
    en: {
      name: 'Monte Carlo simulation',
      slug: 'monte-carlo-simulation',
      aliases: ['Monte Carlo', 'Monte Carlo simulations', 'Monte Carlo method'],
      short: 'A method that projects thousands of possible futures with randomized returns, to estimate the probability of an outcome rather than a single figure.',
      body: `A spreadsheet with a fixed 7% produces one number, and that number is almost certainly wrong: no market delivers 7% every year. A Monte Carlo simulation draws thousands of plausible return sequences and counts how many of them end well.

The output is not "you will have $480,000" but something far more useful: "in 85% of scenarios the money lasted thirty years; in 15% it ran out early". That turns a forecast into a **probability**, which is the right way to think about a financial future.

Its obvious limit: the simulation only knows what you told it. If the returns and volatilities you feed in are optimistic, you get a thousand optimistic futures. It is a tool for exploring how sensitive a plan is, not an oracle.`
    },
    pt: {
      name: 'Simulação de Monte Carlo',
      slug: 'simulacao-de-monte-carlo',
      aliases: ['Monte Carlo', 'simulações de Monte Carlo', 'método de Monte Carlo'],
      short: 'Um método que projeta milhares de futuros possíveis com rentabilidades aleatórias, para estimar a probabilidade de um resultado em vez de um único número.',
      body: `Uma planilha com 7% fixos produz um único número, e esse número é quase certamente falso: nenhum mercado entrega 7% todos os anos. Uma simulação de Monte Carlo sorteia milhares de sequências de rentabilidades plausíveis e vê quantas delas terminam bem.

O resultado não é "vai ter 480.000", mas algo muito mais útil: "em 85% dos cenários o dinheiro durou trinta anos; em 15% acabou antes". Isso transforma uma previsão numa **probabilidade**, que é a forma correta de pensar sobre o futuro financeiro.

O seu limite óbvio: a simulação só sabe aquilo que lhe disse. Se as rentabilidades e volatilidades que informa são otimistas, obtém mil futuros otimistas. É uma ferramenta para explorar a sensibilidade de um plano, não um oráculo.`
    }
  },
{
    id: 'emergency-fund',
    group: 'money',
    related: ['cash-flow', 'inflation', 'sequence-risk'],
    es: {
      name: 'Fondo de emergencia',
      slug: 'fondo-de-emergencia',
      aliases: ['colchón de seguridad', 'fondo de imprevistos', 'colchón financiero'],
      short: 'Dinero líquido y aburrido reservado para imprevistos, cuyo trabajo no es crecer sino evitar que tengas que vender inversiones o endeudarte.',
      body: `El fondo de emergencia es la única parte de tus finanzas donde la rentabilidad es irrelevante. Su función es **disponibilidad**: estar entero, accesible en 24 horas y no depender del estado del mercado el día que se rompe la caldera o se acaba un contrato.

La referencia habitual es de tres a seis meses de gastos, pero lo que realmente lo determina es la estabilidad de tus ingresos. Un funcionario con dos sueldos en casa puede vivir con tres meses; un autónomo con un cliente principal debería pensar en nueve o doce.

Su mayor beneficio no aparece en ninguna hoja de cálculo: es lo que permite que el resto de la cartera se comporte a largo plazo. Sin colchón, una avería de 2.000 € se convierte en una venta forzada o en una deuda al 20 %, y ahí es donde se pierde el dinero de verdad.`
    },
    en: {
      name: 'Emergency fund',
      slug: 'emergency-fund',
      aliases: ['rainy day fund', 'cash buffer', 'safety net'],
      short: 'Liquid, boring money set aside for the unexpected, whose job is not to grow but to stop you having to sell investments or borrow.',
      body: `The emergency fund is the one part of your finances where return is irrelevant. Its function is **availability**: being intact, reachable within 24 hours, and independent of what the market is doing on the day the boiler breaks or a contract ends.

The usual benchmark is three to six months of expenses, but what actually determines it is the stability of your income. A salaried couple with two incomes can live with three months; a freelancer with one main client should be thinking about nine or twelve.

Its biggest benefit shows up in no spreadsheet: it is what allows the rest of the portfolio to behave like a long-term portfolio. Without a buffer, a $2,000 repair becomes a forced sale or a 20% debt, and that is where money is genuinely lost.`
    },
    pt: {
      name: 'Fundo de emergência',
      slug: 'fundo-de-emergencia',
      aliases: ['almofada financeira', 'fundo de imprevistos', 'colchão de segurança'],
      short: 'Dinheiro líquido e aborrecido reservado para imprevistos, cuja função não é crescer mas evitar que tenha de vender investimentos ou se endividar.',
      body: `O fundo de emergência é a única parte das suas finanças em que a rentabilidade é irrelevante. A sua função é **disponibilidade**: estar intacto, acessível em 24 horas e não depender do estado do mercado no dia em que a caldeira avaria ou um contrato termina.

A referência habitual é de três a seis meses de despesas, mas o que realmente a determina é a estabilidade dos seus rendimentos. Quem tem dois salários estáveis em casa pode viver com três meses; um trabalhador independente com um cliente principal deveria pensar em nove ou doze.

O seu maior benefício não aparece em nenhuma planilha: é o que permite que o resto da carteira se comporte como uma carteira de longo prazo. Sem almofada, uma avaria de 2.000 transforma-se numa venda forçada ou numa dívida a 20%, e é aí que se perde dinheiro a sério.`
    }
  },
  {
    id: 'net-worth',
    group: 'money',
    related: ['cash-flow', 'savings-rate', 'emergency-fund'],
    es: {
      name: 'Patrimonio neto',
      slug: 'patrimonio-neto',
      aliases: ['patrimonio', 'net worth', 'balance personal'],
      short: 'Todo lo que posees menos todo lo que debes: la única cifra que resume tu situación financiera en un número.',
      body: `Patrimonio neto = activos − pasivos. Suma cuentas, inversiones, planes de pensiones y el valor de mercado de la vivienda; resta hipoteca, préstamos y saldos de tarjeta. El resultado puede ser negativo, y para mucha gente joven con hipoteca reciente lo es.

Es la métrica que corrige la ilusión del sueldo. Dos personas con el mismo ingreso pueden tener patrimonios opuestos, porque el sueldo mide el caudal que entra y el patrimonio mide lo que se quedó.

La forma de usarlo bien es como **serie temporal**, no como fotografía: anotarlo una vez al trimestre, siempre con el mismo criterio, y mirar la pendiente. El valor absoluto depende de tu edad, tu país y tu suerte. La pendiente depende de tus decisiones.`
    },
    en: {
      name: 'Net worth',
      slug: 'net-worth',
      aliases: ['networth', 'personal balance sheet', 'net wealth'],
      short: 'Everything you own minus everything you owe: the one figure that summarizes your financial position in a single number.',
      body: `Net worth = assets − liabilities. Add up accounts, investments, pensions and the market value of your home; subtract mortgage, loans and card balances. The result can be negative, and for many young people with a recent mortgage it is.

It is the metric that corrects the illusion of salary. Two people on the same income can have opposite net worths, because salary measures the flow coming in and net worth measures what stayed.

The way to use it well is as a **time series**, not a snapshot: record it once a quarter, always on the same basis, and watch the slope. The absolute value depends on your age, your country and your luck. The slope depends on your decisions.`
    },
    pt: {
      name: 'Patrimônio líquido',
      slug: 'patrimonio-liquido',
      aliases: ['patrimônio', 'net worth', 'balanço pessoal'],
      short: 'Tudo o que possui menos tudo o que deve: o único número que resume a sua situação financeira.',
      body: `Patrimônio líquido = ativos − passivos. Some contas, investimentos, planos de poupança e o valor de mercado da casa; subtraia financiamento imobiliário, empréstimos e saldos de cartão. O resultado pode ser negativo, e para muita gente jovem com crédito recente é.

É a métrica que corrige a ilusão do salário. Duas pessoas com o mesmo rendimento podem ter patrimônios opostos, porque o salário mede o caudal que entra e o patrimônio mede o que ficou.

A forma de o usar bem é como **série temporal**, não como fotografia: registrá-lo uma vez por trimestre, sempre com o mesmo critério, e olhar para a inclinação. O valor absoluto depende da sua idade, do seu país e da sua sorte. A inclinação depende das suas decisões.`
    }
  },
  {
    id: 'savings-rate',
    group: 'money',
    related: ['fire', 'net-worth', 'pay-yourself-first', 'lifestyle-creep'],
    es: {
      name: 'Tasa de ahorro',
      slug: 'tasa-de-ahorro',
      aliases: ['ratio de ahorro', 'savings rate', 'porcentaje de ahorro'],
      short: 'La proporción de tus ingresos que no gastas, y la variable que más determina cuánto tardarás en ser financieramente independiente.',
      body: `Tasa de ahorro = (ingresos − gastos) / ingresos. Si ganas 2.500 € y gastas 2.000 €, ahorras el 20 %.

Es más potente que la rentabilidad porque actúa por dos lados a la vez: subirla aumenta lo que acumulas **y** reduce el patrimonio que necesitas, porque el objetivo se calcula sobre tu gasto. Pasar del 15 % al 30 % no divide el plazo por dos; lo recorta más.

Es también más controlable. No puedes decidir la rentabilidad de los mercados el año que viene, pero sí puedes decidir el coste de tu vivienda, tu coche y tus suscripciones. La rentabilidad es una esperanza; la tasa de ahorro es una decisión.`
    },
    en: {
      name: 'Savings rate',
      slug: 'savings-rate',
      aliases: ['saving rate', 'savings ratio', 'percentage saved'],
      short: 'The share of your income you do not spend, and the variable that most determines how long it takes to become financially independent.',
      body: `Savings rate = (income − expenses) / income. Earn $2,500 and spend $2,000, and you are saving 20%.

It is more powerful than return because it works from both ends at once: raising it increases what you accumulate **and** reduces the wealth you need, because the target is calculated from your spending. Going from 15% to 30% does not halve the timeline; it cuts it by more.

It is also more controllable. You cannot decide what markets return next year, but you can decide the cost of your housing, your car and your subscriptions. Return is a hope; savings rate is a decision.`
    },
    pt: {
      name: 'Taxa de poupança',
      slug: 'taxa-de-poupanca',
      aliases: ['rácio de poupança', 'savings rate', 'porcentagem poupada'],
      short: 'A proporção dos seus rendimentos que não gasta, e a variável que mais determina quanto tempo levará a ser financeiramente independente.',
      body: `Taxa de poupança = (rendimentos − despesas) / rendimentos. Se ganha 2.500 e gasta 2.000, poupa 20%.

É mais poderosa do que a rentabilidade porque atua pelos dois lados ao mesmo tempo: aumentá-la eleva o que você acumula **e** reduz o patrimônio de que você precisa, porque o objetivo se calcula a partir da sua despesa. Passar de 15% para 30% não divide o prazo por dois; corta-o mais.

É também mais controlável. Não pode decidir a rentabilidade dos mercados no próximo ano, mas pode decidir o custo da sua habitação, do seu carro e das suas assinaturas. A rentabilidade é uma esperança; a taxa de poupança é uma decisão.`
    }
  },
  {
    id: 'cash-flow',
    group: 'money',
    related: ['savings-rate', 'net-worth', 'emergency-fund'],
    es: {
      name: 'Flujo de caja personal',
      slug: 'flujo-de-caja-personal',
      aliases: ['cash flow', 'flujo de caja', 'presupuesto mensual'],
      short: 'El dinero que entra y sale cada mes, y la diferencia entre ambos: la mecánica real que hace crecer o encoger tu patrimonio.',
      body: `El flujo de caja es la película de la que el patrimonio neto es la foto. Entradas: nóminas, facturas cobradas, dividendos. Salidas: fijas (vivienda, seguros, préstamos), variables (comida, ocio) y anuales que casi nadie reparte (IRPF, seguros, revisiones del coche).

El error clásico no es gastar demasiado, sino olvidar los gastos irregulares. Un presupuesto mensual que ignora los 1.800 € que llegan una vez al año está desequilibrado por 150 € al mes y no lo sabe.

Registrar el flujo real durante tres meses es el ejercicio de mayor rendimiento de todas las finanzas personales: casi siempre revela una o dos categorías de gasto significativas que nadie habría adivinado.`
    },
    en: {
      name: 'Personal cash flow',
      slug: 'personal-cash-flow',
      aliases: ['cash flow', 'monthly budget', 'income and outgoings'],
      short: 'The money coming in and going out each month, and the gap between them: the real mechanism that grows or shrinks your net worth.',
      body: `Cash flow is the film of which net worth is the photograph. In: salaries, invoices paid, dividends. Out: fixed (housing, insurance, loans), variable (food, leisure) and the annual items almost nobody spreads out (tax, insurance renewals, car servicing).

The classic mistake is not overspending but forgetting irregular expenses. A monthly budget that ignores the $1,800 arriving once a year is out by $150 a month and does not know it.

Tracking actual cash flow for three months is the highest-return exercise in all of personal finance: it almost always reveals one or two significant spending categories nobody would have guessed.`
    },
    pt: {
      name: 'Fluxo de caixa pessoal',
      slug: 'fluxo-de-caixa-pessoal',
      aliases: ['cash flow', 'fluxo de caixa', 'orçamento mensal'],
      short: 'O dinheiro que entra e sai cada mês, e a diferença entre os dois: o mecanismo real que faz crescer ou encolher o seu patrimônio.',
      body: `O fluxo de caixa é o filme de que o patrimônio líquido é a fotografia. Entradas: salários, faturas recebidas, dividendos. Saídas: fixas (habitação, seguros, empréstimos), variáveis (comida, lazer) e as anuais que quase ninguém reparte (IRS, seguros, revisões do carro).

O erro clássico não é gastar demais, mas esquecer as despesas irregulares. Um orçamento mensal que ignora os 1.800 que chegam uma vez por ano está desequilibrado em 150 por mês e não o sabe.

Registrar o fluxo real durante três meses é o exercício com maior retorno de todas as finanças pessoais: quase sempre revela uma ou duas categorias de despesa significativas que ninguém teria adivinhado.`
    }
  },
  {
    id: 'opportunity-cost',
    group: 'mind',
    related: ['compound-interest', 'lifestyle-creep', 'mental-accounting'],
    es: {
      name: 'Coste de oportunidad',
      slug: 'coste-de-oportunidad',
      aliases: ['costes de oportunidad', 'opportunity cost'],
      short: 'El valor de la mejor alternativa que descartas al elegir una opción: lo que cada decisión cuesta además de su precio.',
      body: `Cuando gastas 300 € en algo, el precio es 300 €, pero el coste es 300 € **más** lo que ese dinero habría llegado a ser. A un 7 % durante veinte años, son unos 1.160 €. Ese es el coste de oportunidad, y es invisible porque nunca aparece en un extracto.

Funciona en las dos direcciones, y esto se cuenta menos. Aplazar cada gasto también tiene coste de oportunidad: los años en los que puedes viajar con tus hijos pequeños o cuidar de tus padres no se pueden reinvertir. Una vida entera de decisiones optimizadas es un coste de oportunidad enorme pagado en la única moneda irrecuperable.

Su valor práctico no es hacerte gastar menos, sino hacer visible el intercambio. Una compra de 300 € elegida sabiendo que cuesta 1.160 € futuros es una buena decisión si la haces con esa información delante.`
    },
    en: {
      name: 'Opportunity cost',
      slug: 'opportunity-cost',
      aliases: ['opportunity costs'],
      short: 'The value of the best alternative you give up when you choose one option: what every decision costs on top of its price.',
      body: `When you spend $300 on something, the price is $300, but the cost is $300 **plus** whatever that money would have become. At 7% over twenty years, that is about $1,160. That is the opportunity cost, and it is invisible because it never appears on a statement.

It runs in both directions, and this half gets told less often. Deferring every expense has an opportunity cost too: the years in which you can travel with small children or look after your parents cannot be reinvested. A whole life of optimized decisions is an enormous opportunity cost, paid in the one currency you cannot get back.

Its practical value is not to make you spend less but to make the trade visible. A $300 purchase chosen in full knowledge that it costs $1,160 of future money is a good decision, if you made it with that information in front of you.`
    },
    pt: {
      name: 'Custo de oportunidade',
      slug: 'custo-de-oportunidade',
      aliases: ['custos de oportunidade', 'opportunity cost'],
      short: 'O valor da melhor alternativa que abandona ao escolher uma opção: o que cada decisão custa além do seu preço.',
      body: `Quando gasta 300 em algo, o preço é 300, mas o custo é 300 **mais** aquilo em que esse dinheiro se teria tornado. A 7% durante vinte anos, são cerca de 1.160. Esse é o custo de oportunidade, e é invisível porque nunca aparece num extrato.

Funciona nos dois sentidos, e esta metade conta-se menos. Adiar cada despesa também tem custo de oportunidade: os anos em que pode viajar com os seus filhos pequenos ou cuidar dos seus pais não se podem reinvestir. Uma vida inteira de decisões otimizadas é um custo de oportunidade enorme, pago na única moeda irrecuperável.

O seu valor prático não é fazer você gastar menos, mas tornar a troca visível. Uma compra de 300 escolhida sabendo que custa 1.160 futuros é uma boa decisão, se a fizer com essa informação à frente.`
    }
  },
{
    id: 'loss-aversion',
    group: 'mind',
    related: ['drawdown', 'volatility', 'recency-bias', 'rebalancing'],
    es: {
      name: 'Aversión a la pérdida',
      slug: 'aversion-a-la-perdida',
      aliases: ['loss aversion', 'aversión a las pérdidas'],
      short: 'La tendencia a sentir una pérdida con una intensidad aproximadamente el doble que una ganancia del mismo tamaño.',
      body: `Kahneman y Tversky lo midieron: perder 100 € duele cerca del doble de lo que agrada ganar 100 €. No es debilidad de carácter, es cómo evalúa resultados el cerebro humano por defecto.

Sus consecuencias en la inversión son casi todas caras. Explica por qué se venden las buenas inversiones en las caídas —la única acción que convierte una pérdida temporal en definitiva—, por qué se conservan durante años posiciones perdedoras esperando "volver a cero", y por qué mucha gente con cuarenta años de horizonte mantiene una cartera demasiado conservadora.

La defensa no es sentirlo menos, porque no se puede. Es diseñar el sistema para que la emoción no tenga botones que pulsar: aportaciones automáticas, revisiones poco frecuentes y una regla de rebalanceo escrita antes de que llegue la caída.`
    },
    en: {
      name: 'Loss aversion',
      slug: 'loss-aversion',
      aliases: ['loss averse', 'aversion to losses'],
      short: 'The tendency to feel a loss roughly twice as intensely as a gain of the same size.',
      body: `Kahneman and Tversky measured it: losing $100 hurts about twice as much as gaining $100 feels good. This is not a character flaw, it is how the human brain evaluates outcomes by default.

Its consequences in investing are almost all expensive. It explains why good investments get sold in downturns, which is the one action that turns a temporary loss into a permanent one, why losing positions are held for years waiting to "get back to even", and why many people with a forty-year horizon hold a portfolio that is far too conservative.

The defense is not to feel it less, because you cannot. It is to design the system so the emotion has no buttons to press: automatic contributions, infrequent reviews, and a rebalancing rule written down before the fall arrives.`
    },
    pt: {
      name: 'Aversão à perda',
      slug: 'aversao-a-perda',
      aliases: ['loss aversion', 'aversão às perdas'],
      short: 'A tendência para sentir uma perda com uma intensidade cerca de duas vezes maior do que um ganho do mesmo tamanho.',
      body: `Kahneman e Tversky mediram-no: perder 100 dói cerca do dobro do que agrada ganhar 100. Não é fraqueza de caráter, é como o cérebro humano avalia resultados por defeito.

As suas consequências no investimento são quase todas caras. Explica por que se vendem os bons investimentos nas quedas, que é a única ação capaz de transformar uma perda temporária em definitiva, por que se mantêm durante anos posições perdedoras à espera de "voltar ao zero", e por que muita gente com quarenta anos de horizonte mantém uma carteira conservadora demais.

A defesa não é senti-lo menos, porque não se consegue. É desenhar o sistema para que a emoção não tenha botões para premir: reforços automáticos, revisões pouco frequentes e uma regra de rebalanceamento escrita antes de a queda chegar.`
    }
  },
  {
    id: 'lifestyle-creep',
    group: 'mind',
    related: ['savings-rate', 'hedonic-adaptation', 'opportunity-cost'],
    es: {
      name: 'Inflación del estilo de vida',
      slug: 'inflacion-del-estilo-de-vida',
      aliases: ['lifestyle creep', 'lifestyle inflation', 'inflación de estilo de vida'],
      short: 'El proceso por el que el gasto sube automáticamente con cada aumento de ingresos, dejando la tasa de ahorro igual que estaba.',
      body: `Después de una subida de sueldo del 20 %, el gasto sube casi siempre un 20 %. El coche mejora, el piso mejora, las vacaciones mejoran, y a los dos años la sensación de holgura es exactamente la de antes, con una diferencia importante: ahora el nivel de vida requiere más dinero para sostenerse.

Ahí está el doble coste. No solo no ahorraste el aumento: has subido el patrimonio que necesitarás para ser independiente, porque ese objetivo se calcula sobre tu gasto anual. Cada 100 € de gasto mensual permanente añaden unos 30.000 € al número.

El antídoto no es austeridad, es **asignación anticipada**: decidir el reparto de la próxima subida antes de recibirla —por ejemplo, la mitad al ahorro automático y la mitad a vivir mejor—. Elegido de antemano, es una decisión. Elegido después, ya lo eligió la costumbre.`
    },
    en: {
      name: 'Lifestyle creep',
      slug: 'lifestyle-creep',
      aliases: ['lifestyle inflation', 'lifestyle drift'],
      short: 'The process by which spending rises automatically with every pay increase, leaving the savings rate exactly where it was.',
      body: `After a 20% raise, spending almost always rises 20%. The car improves, the apartment improves, the vacations improve, and two years later the sense of comfort is precisely what it was before, with one important difference: the standard of living now costs more to keep.

That is the double cost. Not only did you not save the raise: you have raised the wealth you will need to be independent, because that target is calculated from your annual spending. Every $100 of permanent monthly spending adds roughly $30,000 to the number.

The antidote is not austerity but **pre-allocation**: deciding how the next raise gets split before it arrives, say half to automatic saving and half to living better. Chosen in advance, it is a decision. Chosen afterwards, your habits already decided it for you.`
    },
    pt: {
      name: 'Inflação do estilo de vida',
      slug: 'inflacao-do-estilo-de-vida',
      aliases: ['lifestyle creep', 'lifestyle inflation'],
      short: 'O processo pelo qual a despesa sobe automaticamente com cada aumento de rendimento, deixando a taxa de poupança exatamente onde estava.',
      body: `Depois de um aumento de 20%, a despesa sobe quase sempre 20%. O carro melhora, a casa melhora, as férias melhoram, e dois anos depois a sensação de folga é exatamente a de antes, com uma diferença importante: agora o nível de vida exige mais dinheiro para se sustentar.

Está aí o duplo custo. Não só não poupou o aumento: subiu o patrimônio de que vai precisar para ser independente, porque esse objetivo calcula-se a partir da sua despesa anual. Cada 100 de despesa mensal permanente acrescentam cerca de 30.000 ao número.

O antídoto não é austeridade, é **alocação antecipada**: decidir a distribuição do próximo aumento antes de ele chegar, por exemplo metade para a poupança automática e metade para viver melhor. Escolhido de antemão, é uma decisão. Escolhido depois, quem escolheu foram os seus hábitos.`
    }
  },
  {
    id: 'mental-accounting',
    group: 'mind',
    related: ['opportunity-cost', 'loss-aversion', 'cash-flow'],
    es: {
      name: 'Contabilidad mental',
      slug: 'contabilidad-mental',
      aliases: ['mental accounting', 'cuentas mentales'],
      short: 'La tendencia a tratar el dinero de forma distinta según su origen o la etiqueta que le hemos puesto, aunque sea perfectamente intercambiable.',
      body: `Richard Thaler describió el fenómeno: mantenemos "cuentas" separadas en la cabeza y aplicamos reglas distintas a cada una. Una prima de 1.000 € se gasta con alegría; 1.000 € del sueldo se administran con cuidado. Es el mismo dinero.

La versión más costosa es guardar 8.000 € en una cuenta de ahorro al 0,5 % mientras se mantiene una deuda de tarjeta de 4.000 € al 19 %. Contablemente es un error grave; mentalmente son dos cuentas distintas, y la de "ahorro" se siente intocable.

Pero no todo es sesgo. Etiquetar el dinero también es una herramienta: un fondo de emergencia funciona **porque** está mentalmente cerrado. La distinción útil es si la etiqueta te protege de un impulso o te oculta una comparación aritmética.`
    },
    en: {
      name: 'Mental accounting',
      slug: 'mental-accounting',
      aliases: ['mental accounts', 'mental budgeting'],
      short: 'The tendency to treat money differently depending on where it came from or what label we gave it, even though it is perfectly interchangeable.',
      body: `Richard Thaler described the phenomenon: we keep separate "accounts" in our heads and apply different rules to each. A $1,000 bonus gets spent cheerfully; $1,000 of salary gets managed carefully. It is the same money.

The most expensive version is holding $8,000 in a savings account at 0.5% while carrying $4,000 of card debt at 19%. On any balance sheet it is a serious error; mentally they are two different accounts, and the "savings" one feels untouchable.

Not all of it is bias, though. Labeling money is also a tool: an emergency fund works **because** it is mentally sealed. The useful distinction is whether the label protects you from an impulse or hides an arithmetic comparison from you.`
    },
    pt: {
      name: 'Contabilidade mental',
      slug: 'contabilidade-mental',
      aliases: ['mental accounting', 'contas mentais'],
      short: 'A tendência para tratar o dinheiro de forma diferente segundo a sua origem ou o rótulo que lhe demos, ainda que seja perfeitamente intercambiável.',
      body: `Richard Thaler descreveu o fenômeno: mantemos "contas" separadas na cabeça e aplicamos regras diferentes a cada uma. Um prêmio de 1.000 se gasta com alegria; 1.000 do salário se administram com cuidado. É o mesmo dinheiro.

A versão mais cara é guardar 8.000 numa conta poupança a 0,5% enquanto se mantém uma dívida de cartão de 4.000 a 19%. Contabilisticamente é um erro grave; mentalmente são duas contas diferentes, e a de "poupança" parece intocável.

Mas não é tudo enviesamento. Etiquetar o dinheiro também é uma ferramenta: um fundo de emergência funciona **porque** está mentalmente selado. A distinção útil é saber se o rótulo te protege de um impulso ou te esconde uma comparação aritmética.`
    }
  },
  {
    id: 'recency-bias',
    group: 'mind',
    related: ['loss-aversion', 'volatility', 'rebalancing', 'monte-carlo'],
    es: {
      name: 'Sesgo de recencia',
      slug: 'sesgo-de-recencia',
      aliases: ['recency bias', 'sesgo de lo reciente'],
      short: 'La tendencia a dar demasiado peso a lo que ha ocurrido hace poco y a proyectarlo hacia el futuro como si fuera la norma.',
      body: `Después de tres años buenos, el 12 % anual parece razonable. Después de un año malo, la renta variable parece un error estructural. Los datos de fondo no han cambiado en ninguno de los dos casos: lo que ha cambiado es lo que tenemos más fresco en la memoria.

Es lo que hace que el dinero entre en los fondos justo después de las mejores rachas y salga justo después de las peores, y explica buena parte de la diferencia entre la rentabilidad de un fondo y la rentabilidad que obtienen sus partícipes.

El correctivo es aburrido y funciona: mirar series largas en lugar de los últimos doce meses, escribir tus supuestos de rentabilidad **una vez** y no revisarlos por lo que hizo el mercado el trimestre pasado.`
    },
    en: {
      name: 'Recency bias',
      slug: 'recency-bias',
      aliases: ['recency effect'],
      short: 'The tendency to give too much weight to what happened recently and project it forward as if it were the norm.',
      body: `After three good years, 12% a year looks reasonable. After one bad year, equities look like a structural mistake. The underlying data changed in neither case: what changed is what is freshest in memory.

It is what drives money into funds right after the best runs and out right after the worst, and it explains much of the gap between a fund's return and the return its investors actually receive.

The correction is boring and it works: look at long series rather than the last twelve months, and write down your return assumptions **once** rather than revising them because of what the market did last quarter.`
    },
    pt: {
      name: 'Viés de recência',
      slug: 'vies-de-recencia',
      aliases: ['recency bias', 'viés do recente'],
      short: 'A tendência de dar peso demais ao que aconteceu há pouco tempo e projetá-lo para o futuro como se fosse a norma.',
      body: `Depois de três anos bons, 12% ao ano parece razoável. Depois de um ano mau, as ações parecem um erro estrutural. Os dados de fundo não mudaram em nenhum dos casos: o que mudou é o que temos mais fresco na memória.

É o que faz o dinheiro entrar nos fundos logo depois das melhores fases e sair logo depois das piores, e explica boa parte da diferença entre a rentabilidade de um fundo e a rentabilidade que os seus participantes obtêm.

O corretivo é aborrecido e funciona: olhar para séries longas em vez dos últimos doze meses, e escrever os seus pressupostos de rentabilidade **uma vez** em vez de os revisar por causa do que o mercado fez no trimestre passado.`
    }
  },
  {
    id: 'hedonic-adaptation',
    group: 'mind',
    related: ['lifestyle-creep', 'opportunity-cost', 'life-cost'],
    es: {
      name: 'Adaptación hedónica',
      slug: 'adaptacion-hedonica',
      aliases: ['hedonic adaptation', 'cinta hedónica', 'hedonic treadmill', 'rueda hedónica'],
      short: 'La tendencia del ser humano a volver a su nivel de satisfacción habitual poco después de una mejora material.',
      body: `El coche nuevo emociona seis semanas. El piso más grande, unos meses. Después, el nivel de satisfacción vuelve más o menos a donde estaba, y la mejora se convierte simplemente en el nuevo suelo desde el que se compara todo lo siguiente.

Esto no significa que gastar sea inútil: significa que **algunos gastos se adaptan y otros no**. La investigación es bastante consistente en que las compras que se convierten en rutina invisible (superficie, objetos, categoría de producto) se adaptan rápido, y las que compran tiempo, salud, relaciones o experiencias con historia se adaptan mucho más despacio.

Es la pieza que convierte un presupuesto en una decisión sobre la vida y no solo sobre el dinero. La pregunta útil ante un gasto grande no es "¿puedo permitírmelo?", sino "¿esto seguirá importándome en dos años?".`
    },
    en: {
      name: 'Hedonic adaptation',
      slug: 'hedonic-adaptation',
      aliases: ['hedonic treadmill', 'hedonic adjustment'],
      short: 'The human tendency to return to a habitual level of satisfaction shortly after a material improvement.',
      body: `The new car is exciting for six weeks. The bigger apartment, a few months. After that, satisfaction returns roughly to where it was, and the improvement simply becomes the new floor against which everything next is compared.

This does not mean spending is pointless: it means **some spending adapts and some does not**. The research is fairly consistent that purchases which become invisible routine (square meters, objects, product tier) adapt quickly, while those buying time, health, relationships or experiences with a story adapt far more slowly.

This is the piece that turns a budget into a decision about a life rather than only about money. The useful question before a large purchase is not "can I afford it?" but "will this still matter to me in two years?".`
    },
    pt: {
      name: 'Adaptação hedônica',
      slug: 'adaptacao-hedonica',
      aliases: ['hedonic adaptation', 'roda hedônica', 'hedonic treadmill'],
      short: 'A tendência humana para regressar ao seu nível habitual de satisfação pouco depois de uma melhoria material.',
      body: `O carro novo entusiasma seis semanas. A casa maior, alguns meses. Depois, o nível de satisfação volta mais ou menos ao ponto de partida, e a melhoria transforma-se simplesmente no novo chão a partir do qual se compara tudo o que vem a seguir.

Isto não significa que gastar seja inútil: significa que **algumas despesas se adaptam e outras não**. A investigação é bastante consistente em que as compras que se tornam rotina invisível (metros quadrados, objetos, categoria de produto) se adaptam depressa, e as que compram tempo, saúde, relações ou experiências com história se adaptam muito mais lentamente.

É a peça que transforma um orçamento numa decisão sobre a vida e não apenas sobre o dinheiro. A pergunta útil diante de uma despesa grande não é "posso pagar isto?", mas "isto ainda me vai importar dentro de dois anos?".`
    }
  },
  {
    id: 'present-bias',
    group: 'mind',
    related: ['pay-yourself-first', 'lifestyle-creep', 'compound-interest'],
    es: {
      name: 'Sesgo del presente',
      slug: 'sesgo-del-presente',
      aliases: ['present bias', 'descuento temporal', 'gratificación inmediata'],
      short: 'La tendencia a sobrevalorar una recompensa inmediata frente a una mayor pero futura, aunque la segunda sea claramente mejor.',
      body: `Casi todo el mundo prefiere 100 € hoy a 110 € en un mes, y a la vez prefiere 110 € en trece meses a 100 € en doce. La preferencia se invierte según la distancia, lo que significa que no es una preferencia coherente: es un descuento desproporcionado del futuro.

Aplicado al dinero, es el motor de casi todas las decisiones que luego se lamentan: la compra a plazos, el aplazamiento del primer aporte, el "empiezo a invertir el año que viene". Y es especialmente caro con el interés compuesto, porque el año que se pospone es el que más habría trabajado.

Como no se corrige con voluntad, se corrige con **arquitectura**: automatizar la transferencia el día de la nómina, subir el porcentaje al recibir un aumento y poner fricción donde está el impulso. Una decisión tomada una vez vence a una decisión tomada cada mes.`
    },
    en: {
      name: 'Present bias',
      slug: 'present-bias',
      aliases: ['temporal discounting', 'hyperbolic discounting', 'instant gratification'],
      short: 'The tendency to overvalue an immediate reward against a larger future one, even when the second is clearly better.',
      body: `Almost everyone prefers $100 today to $110 in a month, while also preferring $110 in thirteen months to $100 in twelve. The preference reverses with distance, which means it is not a coherent preference at all: it is a disproportionate discount applied to the future.

Applied to money, it is the engine behind almost every decision later regretted: buying on installments, deferring the first contribution, "I'll start investing next year". And it is especially expensive with compound interest, because the year postponed is the one that would have worked hardest.

Since willpower does not fix it, **architecture** does: automate the transfer on payday, raise the percentage when a raise arrives, and put friction where the impulse is. A decision made once beats a decision made every month.`
    },
    pt: {
      name: 'Viés do presente',
      slug: 'vies-do-presente',
      aliases: ['present bias', 'desconto temporal', 'gratificação imediata'],
      short: 'A tendência para sobrevalorizar uma recompensa imediata face a uma maior mas futura, mesmo quando a segunda é claramente melhor.',
      body: `Quase todos preferem 100 hoje a 110 dentro de um mês, e ao mesmo tempo preferem 110 dentro de treze meses a 100 dentro de doze. A preferência inverte-se com a distância, o que significa que não é uma preferência coerente: é um desconto desproporcionado aplicado ao futuro.

Aplicado ao dinheiro, é o motor de quase todas as decisões que depois se lamentam: a compra a prestações, o adiamento do primeiro reforço, o "começo a investir no próximo ano". E é especialmente caro com juros compostos, porque o ano adiado é o que mais teria trabalhado.

Como não se corrige com força de vontade, corrige-se com **arquitetura**: automatizar a transferência no dia do salário, subir a porcentagem quando chega um aumento e colocar atrito onde está o impulso. Uma decisão tomada uma vez vence uma decisão tomada todos os meses.`
    }
  },
{
    id: 'pay-yourself-first',
    group: 'money',
    related: ['savings-rate', 'present-bias', 'dca', 'cash-flow'],
    es: {
      name: 'Págate a ti primero',
      slug: 'pagate-a-ti-primero',
      aliases: ['pay yourself first', 'págate primero', 'ahorro automático'],
      short: 'Tratar el ahorro como la primera factura del mes en lugar de como lo que sobra al final, normalmente mediante una transferencia automática.',
      body: `El presupuesto habitual funciona así: cobras, gastas, y ahorras lo que queda. Como lo que queda es una variable residual, casi siempre queda poco. Págate a ti primero invierte el orden: la transferencia al ahorro sale el mismo día de la nómina, y vives con el resto.

Funciona por dos razones y ninguna es aritmética. La primera es que elimina la decisión repetida, que es donde el sesgo del presente hace su trabajo. La segunda es que el gasto se ajusta al dinero disponible casi por sí solo, un fenómeno bastante robusto: la mayoría de la gente que automatiza un 10 % no lo echa de menos a los tres meses.

La versión avanzada es escalarlo: subir el porcentaje automático cada vez que suben los ingresos, antes de que la costumbre reclame el aumento.`
    },
    en: {
      name: 'Pay yourself first',
      slug: 'pay-yourself-first',
      aliases: ['paying yourself first', 'automatic saving', 'automated savings'],
      short: 'Treating saving as the first bill of the month rather than whatever is left at the end, usually via an automatic transfer.',
      body: `The usual budget works like this: you get paid, you spend, and you save what remains. Because what remains is a residual, there is almost always little of it. Paying yourself first inverts the order: the transfer to savings leaves on payday, and you live on the rest.

It works for two reasons and neither is arithmetic. The first is that it removes the repeated decision, which is where present bias does its work. The second is that spending adjusts to available money almost by itself, a fairly robust phenomenon: most people who automate 10% do not miss it three months later.

The advanced version is to escalate it: raise the automatic percentage every time income rises, before habit claims the increase.`
    },
    pt: {
      name: 'Pague-se primeiro',
      slug: 'pague-se-primeiro',
      aliases: ['pay yourself first', 'poupança automática'],
      short: 'Tratar a poupança como a primeira fatura do mês em vez do que sobra no fim, normalmente através de uma transferência automática.',
      body: `O orçamento habitual funciona assim: recebe, gasta, e poupa o que sobra. Como o que sobra é uma variável residual, quase sempre sobra pouco. Pagar-se primeiro inverte a ordem: a transferência para a poupança sai no próprio dia do salário, e vive com o resto.

Funciona por duas razões e nenhuma é aritmética. A primeira é que elimina a decisão repetida, que é onde o viés do presente faz o seu trabalho. A segunda é que a despesa se ajusta ao dinheiro disponível quase por si só, um fenômeno bastante robusto: a maioria de quem automatiza 10% não sente falta depois de três meses.

A versão avançada é escaloná-la: subir a porcentagem automática cada vez que os rendimentos sobem, antes de o hábito reclamar o aumento.`
    }
  },
  {
    id: 'passive-income',
    group: 'money',
    related: ['fire', 'safe-withdrawal-rate', 'compound-interest'],
    es: {
      name: 'Ingresos pasivos',
      slug: 'ingresos-pasivos',
      aliases: ['renta pasiva', 'passive income', 'ingreso pasivo'],
      short: 'Ingresos que no requieren tu trabajo activo continuo, como dividendos, intereses o alquileres; casi siempre requieren capital o trabajo previo.',
      body: `La expresión se usa con una ligereza que conviene deshacer. Los ingresos pasivos honestos son básicamente dos: los que produce el **capital** (dividendos, intereses, cupones, alquileres netos) y los que produce un **activo construido antes** (un libro, un producto, una licencia), que además rara vez son tan pasivos como se anuncian.

La aritmética es implacable en el primer caso: unos ingresos pasivos de 1.000 € al mes con una tasa de retirada del 4 % requieren unos 300.000 € de capital. No hay atajo, y cualquier oferta que prometa esa renta con mucho menos está prometiendo un riesgo que no menciona.

La formulación útil no es "quiero ingresos pasivos", sino "quiero que mis activos cubran una parte creciente de mis gastos fijos". Es la misma idea, medible, y sin depender de que nadie te venda un método.`
    },
    en: {
      name: 'Passive income',
      slug: 'passive-income',
      aliases: ['passive income streams', 'unearned income'],
      short: 'Income that does not need your continuous active work (dividends, interest, rent), and that almost always needs capital or prior work instead.',
      body: `The phrase gets used with a looseness worth unpicking. Honest passive income is basically two things: what **capital** produces (dividends, interest, coupons, net rent) and what a **previously built asset** produces (a book, a product, a license), which is also rarely as passive as advertised.

The arithmetic is unforgiving in the first case: $1,000 a month of passive income at a 4% withdrawal rate requires roughly $300,000 of capital. There is no shortcut, and any offer promising that income on far less is promising a risk it is not mentioning.

The useful framing is not "I want passive income" but "I want my assets to cover a growing share of my fixed costs". Same idea, measurable, and it does not depend on anyone selling you a method.`
    },
    pt: {
      name: 'Rendimento passivo',
      slug: 'rendimento-passivo',
      aliases: ['rendimentos passivos', 'passive income', 'renda passiva'],
      short: 'Renda que não exige o seu trabalho ativo contínuo (dividendos, juros, aluguéis), e que quase sempre exige capital ou trabalho anterior.',
      body: `A expressão usa-se com uma leveza que convém desfazer. O rendimento passivo honesto é basicamente duas coisas: o que o **capital** produz (dividendos, juros, cupons, rendas líquidas) e o que produz um **ativo construído antes** (um livro, um produto, uma licença), que além disso raramente é tão passivo como se anuncia.

A aritmética é implacável no primeiro caso: um rendimento passivo de 1.000 por mês com uma taxa de retirada de 4% exige cerca de 300.000 de capital. Não há atalho, e qualquer oferta que prometa essa renda com muito menos está prometendo um risco que não menciona.

A formulação útil não é "quero rendimento passivo", mas "quero que os meus ativos cubram uma parte crescente das minhas despesas fixas". É a mesma ideia, mensurável, e não depende de alguém vender um método para você.`
    }
  },
  {
    id: 'life-cost',
    group: 'mind',
    related: ['opportunity-cost', 'hedonic-adaptation', 'lifestyle-creep'],
    es: {
      name: 'Coste en horas de vida',
      slug: 'coste-en-horas-de-vida',
      aliases: ['coste en vida', 'precio en horas de vida', 'coste en tiempo'],
      short: 'El precio de una compra expresado en las horas de trabajo que hacen falta para pagarla, en lugar de en dinero.',
      body: `La idea aparece en *Your Money or Your Life*, de Vicki Robin y Joe Dominguez: el dinero es energía vital intercambiada por horas. Divide tu sueldo neto entre las horas que realmente dedicas al trabajo —incluyendo desplazamientos, formación y el tiempo que tardas en desconectar— y obtienes tu tarifa real por hora.

Con esa cifra, un móvil de 900 € deja de costar 900 € y empieza a costar, por ejemplo, setenta y cinco horas. Casi dos semanas de trabajo. Ninguna de las dos cifras es más verdadera que la otra, pero solo una está en la unidad en la que se paga de verdad.

No es una técnica para gastar menos, sino para gastar **con la información completa**. Muchas compras siguen valiendo la pena expresadas en horas; algunas dejan de tener sentido inmediatamente, y eso es exactamente lo que se quería averiguar.`
    },
    en: {
      name: 'Life cost (cost in hours)',
      slug: 'life-cost-in-hours',
      aliases: ['cost in hours', 'life energy cost', 'cost in life hours'],
      short: 'The price of a purchase expressed in the hours of work needed to pay for it, rather than in money.',
      body: `The idea comes from *Your Money or Your Life*, by Vicki Robin and Joe Dominguez: money is life energy exchanged for hours. Divide your take-home pay by the hours you genuinely give to work, including commuting, training and the time it takes to switch off, and you get your real hourly rate.

With that figure, a $900 phone stops costing $900 and starts costing, say, seventy-five hours. Almost two weeks of work. Neither number is truer than the other, but only one is in the unit you actually pay in.

It is not a technique for spending less but for spending **with the full information**. Plenty of purchases still make sense expressed in hours; some stop making sense immediately, and that is precisely what the exercise was for.`
    },
    pt: {
      name: 'Custo em horas de vida',
      slug: 'custo-em-horas-de-vida',
      aliases: ['custo em vida', 'preço em horas de vida', 'custo em tempo'],
      short: 'O preço de uma compra expresso nas horas de trabalho necessárias para a pagar, em vez de em dinheiro.',
      body: `A ideia aparece em *Your Money or Your Life*, de Vicki Robin e Joe Dominguez: o dinheiro é energia vital trocada por horas. Divida o seu salário líquido pelas horas que você realmente dedica ao trabalho, incluindo deslocamentos, treinamento e o tempo que leva para desligar, e você tem a sua tarifa real por hora.

Com esse número, um celular de 900 deixa de custar 900 e começa a custar, por exemplo, setenta e cinco horas. Quase duas semanas de trabalho. Nenhum dos dois números é mais verdadeiro do que o outro, mas só um está na unidade em que se paga de fato.

Não é uma técnica para gastar menos, mas para gastar **com a informação completa**. Muitas compras continuam valendo a pena expressas em horas; algumas deixam de fazer sentido imediatamente, e era exatamente isso que se queria descobrir.`
    }
  },
  {
    id: 'compound-debt',
    group: 'money',
    related: ['compound-interest', 'mental-accounting', 'cash-flow'],
    es: {
      name: 'Interés compuesto de la deuda',
      slug: 'interes-compuesto-de-la-deuda',
      aliases: ['deuda revolving', 'interés de tarjeta', 'bola de nieve de la deuda', 'capitalización de intereses'],
      short: 'El mismo mecanismo que hace crecer una inversión, funcionando en tu contra cuando los intereses no pagados se suman al principal.',
      body: `Una tarjeta revolving al 20 % TAE no es "un poco peor" que un préstamo al 6 %. Es una máquina de interés compuesto orientada hacia el otro lado: los intereses que no pagas se añaden al capital y generan más intereses, exactamente igual que en una cartera, pero en contra.

De ahí la jerarquía práctica que casi ningún cálculo desmiente: liquidar una deuda al 20 % es una rentabilidad garantizada del 20 %, libre de impuestos y de volatilidad. Ninguna inversión ofrece eso. Por encima de un 8-10 % de interés, amortizar deuda gana a invertir en casi cualquier escenario razonable.

El pago mínimo es donde el mecanismo se esconde: está calculado para cubrir poco más que los intereses, de modo que la deuda dure mucho tiempo. Pagar el mínimo no es ir despacio, es no avanzar.`
    },
    en: {
      name: 'Compounding debt',
      slug: 'compounding-debt',
      aliases: ['revolving debt', 'credit card interest', 'debt compounding', 'capitalized interest'],
      short: 'The same mechanism that grows an investment, running against you when unpaid interest is added to the principal.',
      body: `A revolving card at 20% APR is not "a bit worse" than a 6% loan. It is a compound interest machine pointed the other way: the interest you do not pay is added to the balance and generates more interest, exactly as in a portfolio, but against you.

Hence the practical hierarchy that almost no calculation contradicts: clearing a 20% debt is a guaranteed 20% return, free of tax and free of volatility. No investment offers that. Above roughly 8–10% interest, paying down debt beats investing in nearly any reasonable scenario.

The minimum payment is where the mechanism hides: it is calculated to cover little more than the interest, so that the debt lasts a long time. Paying the minimum is not going slowly, it is not moving.`
    },
    pt: {
      name: 'Juros compostos da dívida',
      slug: 'juros-compostos-da-divida',
      aliases: ['dívida revolving', 'juros do cartão', 'capitalização de juros'],
      short: 'O mesmo mecanismo que faz um investimento crescer, funcionando contra você quando os juros não pagos se somam ao capital.',
      body: `Um cartão revolving a 20% TAEG não é "um pouco pior" do que um empréstimo a 6%. É uma máquina de juros compostos apontada para o outro lado: os juros que não paga juntam-se ao capital e geram mais juros, exatamente como numa carteira, mas contra você.

Daí a hierarquia prática que quase nenhum cálculo desmente: liquidar uma dívida a 20% é uma rentabilidade garantida de 20%, isenta de imposto e de volatilidade. Nenhum investimento oferece isso. Acima de cerca de 8-10% de juro, amortizar dívida ganha a investir em quase qualquer cenário razoável.

O pagamento mínimo é onde o mecanismo se esconde: está calculado para cobrir pouco mais do que os juros, de modo que a dívida dure muito tempo. Pagar o mínimo não é ir devagar, é não avançar.`
    }
  },
  {
    id: 'time-in-market',
    group: 'investing',
    related: ['compound-interest', 'dca', 'recency-bias', 'volatility'],
    es: {
      name: 'Tiempo en el mercado',
      slug: 'tiempo-en-el-mercado',
      aliases: ['time in the market', 'timing del mercado', 'market timing', 'acertar el momento'],
      short: 'La idea de que permanecer invertido a lo largo del tiempo importa más que intentar acertar cuándo entrar y salir.',
      body: `El resumen popular —"time in the market beats timing the market"— tiene un respaldo aritmético sencillo: las mejores sesiones de bolsa están concentradas en muy pocos días, y esos días suelen caer **dentro** de los periodos de pánico, no después. Quien sale para "esperar a que se calme" se pierde con frecuencia precisamente las sesiones que explican la rentabilidad de la década.

Esto no es un argumento para ignorar el riesgo. Es un argumento sobre qué palanca es realista: nadie ha demostrado de forma sostenida que sepa cuándo salir y volver, y sí está demostrado que estar dentro durante veinte años ha funcionado en casi cualquier ventana histórica.

La consecuencia práctica es aburrida y por eso funciona: elegir una distribución que puedas sostener en una caída del 40 %, automatizar las aportaciones y mirar la cartera mucho menos de lo que te apetece.`
    },
    en: {
      name: 'Time in the market',
      slug: 'time-in-the-market',
      aliases: ['market timing', 'timing the market', 'staying invested'],
      short: 'The idea that staying invested over time matters more than trying to get the timing of entries and exits right.',
      body: `The popular summary, "time in the market beats timing the market", has a simple arithmetic backing: the best trading days are concentrated into very few sessions, and those sessions usually land **inside** the panics rather than after them. Anyone who steps out to "wait for things to calm down" frequently misses precisely the days that explain the decade's return.

This is not an argument for ignoring risk. It is an argument about which lever is realistic: nobody has demonstrated a sustained ability to know when to exit and re-enter, and being invested for twenty years has demonstrably worked across almost every historical window.

The practical consequence is boring, which is why it works: choose an allocation you can hold through a 40% fall, automate the contributions, and look at the portfolio far less often than you want to.`
    },
    pt: {
      name: 'Tempo no mercado',
      slug: 'tempo-no-mercado',
      aliases: ['time in the market', 'market timing', 'timing de mercado'],
      short: 'A ideia de que permanecer investido ao longo do tempo importa mais do que tentar acertar no momento de entrar e sair.',
      body: `O resumo popular, "time in the market beats timing the market", tem um suporte aritmético simples: as melhores sessões de bolsa estão concentradas em muito poucos dias, e esses dias caem normalmente **dentro** dos períodos de pânico, não depois. Quem sai para "esperar que acalme" perde com frequência precisamente as sessões que explicam a rentabilidade da década.

Isto não é um argumento para ignorar o risco. É um argumento sobre qual alavanca é realista: ninguém demonstrou de forma sustentada saber quando sair e voltar, e está demonstrado que estar dentro durante vinte anos funcionou em quase todas as janelas históricas.

A consequência prática é aborrecida e por isso funciona: escolher uma alocação que consiga manter numa queda de 40%, automatizar os reforços e olhar para a carteira muito menos do que te dá vontade.`
    }
  },
  {
    id: 'hedge-fund',
    group: 'investing',
    related: ['leverage', 'derivatives', 'mutual-fund'],
    es: {
      name: 'Hedge fund (fondo de inversión libre)',
      slug: 'hedge-fund-fondo-de-inversion-libre',
      aliases: ['hedge fund', 'hedge funds', 'fondo de inversión libre', 'fondos de inversión libre', 'IICIL'],
      short: 'Un fondo de gestión alternativa con muchas menos restricciones que un fondo tradicional: puede apalancarse, vender en corto, usar derivados y concentrar la cartera.',
      body: `Un hedge fund es un vehículo de inversión colectiva que renuncia a buena parte de las reglas que protegen al inversor minorista a cambio de libertad para el gestor. Puede endeudarse para invertir, apostar a la baja, usar derivados sin apenas límites y concentrar el capital en pocas posiciones. En España su forma regulada es la IICIL, la institución de inversión colectiva de inversión libre, supervisada por la CNMV y pensada sobre todo para inversores profesionales o con un importe mínimo elevado.

Su modelo de costes es el más reconocible: el clásico «2 y 20», un 2 % anual sobre el patrimonio más un 20 % de los beneficios por encima de un umbral. Con una rentabilidad bruta del 8 %, ese esquema puede dejar al inversor con menos del 5 % neto, y la diferencia se paga tanto en los años buenos como en los mediocres.

Para un ahorrador particular, la pregunta no es si existen gestores alternativos brillantes, que los hay, sino si puede identificarlos de antemano y aceptar la menor liquidez, la menor transparencia y las comisiones. En la mayoría de los casos, una cartera indexada y diversificada cumple el mismo objetivo con menos piezas que pueden fallar.`
    },
    en: {
      name: 'Hedge fund',
      slug: 'hedge-fund',
      aliases: ['hedge funds'],
      short: 'An alternative investment fund with far fewer restrictions than a conventional fund: it can borrow, sell short, use derivatives and concentrate its portfolio.',
      body: `A hedge fund is a pooled investment vehicle that gives up most of the rules protecting retail investors in exchange for freedom for the manager. It can borrow to invest, bet on prices falling, use derivatives with few limits and put most of its capital in a handful of positions. In most countries it is open only to professional or wealthy investors, precisely because those protections are missing.

Its fee model is the best-known part: the classic "2 and 20", 2% a year on assets plus 20% of profits above a threshold. On a gross return of 8%, that structure can leave the investor with less than 5% net, and the fixed part is charged in mediocre years as well as good ones.

For an individual saver the question is not whether brilliant alternative managers exist, because some do, but whether you can identify them in advance and accept the lower liquidity, lower transparency and higher fees. Most of the time a diversified index portfolio does the same job with fewer parts that can break.`
    },
    pt: {
      name: 'Hedge fund',
      slug: 'hedge-fund',
      aliases: ['hedge funds', 'fundo multimercado', 'fundos multimercado'],
      short: 'Um fundo de gestão alternativa com muito menos restrições do que um fundo tradicional: pode se alavancar, vender a descoberto, usar derivativos e concentrar a carteira.',
      body: `Um hedge fund é um veículo de investimento coletivo que abre mão de boa parte das regras que protegem o investidor comum em troca de liberdade para o gestor. Ele pode tomar dinheiro emprestado para investir, apostar na queda, usar derivativos com poucos limites e concentrar o capital em poucas posições. No Brasil, o parente mais próximo é o fundo multimercado, regulado pela CVM, e as versões mais livres costumam ser restritas a investidores qualificados ou profissionais.

O modelo de custos é a parte mais conhecida: o clássico "2 e 20", 2% ao ano sobre o patrimônio mais 20% do lucro acima de um referencial. Com uma rentabilidade bruta de 8%, esse esquema pode deixar o investidor com menos de 5% líquido, e a parte fixa é cobrada também nos anos medíocres.

Para quem investe por conta própria, a pergunta não é se existem gestores alternativos brilhantes, porque existem, mas se você consegue identificá-los antes e aceitar menos liquidez, menos transparência e taxas maiores. Na maioria dos casos, uma carteira diversificada e de baixo custo cumpre o mesmo objetivo com menos peças que podem falhar.`
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

In exchange, a REIT behaves like a share and not like an apartment: it is priced every day and can fall 40% in a year in which the rents it collects did not move at all. The liquidity it gains is paid for in visible volatility.

Because it is obliged to pay out nearly all of its profit, a REIT's dividend yield tends to be high and its growth from reinvestment low. It is a source of income rather than an engine of accumulation, which is worth remembering before comparing it with a stock index.`
    },
    pt: {
      name: 'Fundo imobiliário (FII)',
      slug: 'fundo-imobiliario-fii',
      aliases: ['FII', 'FIIs', 'fundos imobiliários', 'fundo de investimento imobiliário', 'fundos de investimento imobiliário', 'REIT', 'REITs'],
      short: 'Um fundo negociado na bolsa que possui imóveis ou títulos ligados a imóveis e distribui a maior parte do resultado aos cotistas, normalmente todo mês.',
      body: `Um fundo imobiliário permite ser dono de uma fração de uma carteira de imóveis sem comprar nenhum: as cotas são compradas e vendidas na B3, em segundos e por poucos reais. É a versão brasileira do que nos Estados Unidos se chama REIT.

Em troca, um FII se comporta como um ativo de bolsa e não como um apartamento: tem cotação todos os dias e pode cair 30% num ano em que os aluguéis que recebe não mudaram. A liquidez que você ganha é paga em volatilidade visível.

Como o fundo é obrigado a distribuir a maior parte do resultado, o dividend yield tende a ser alto e o crescimento por reinvestimento, baixo. Os rendimentos mensais podem ser isentos de imposto de renda para a pessoa física quando o fundo cumpre as regras de isenção, mas o lucro na venda das cotas é tributado. Vale lembrar as duas coisas antes de comparar um FII com um índice de ações.`
    }
  },
  {
    id: 'money-market-fund',
    group: 'investing',
    related: ['emergency-fund', 'liquidity', 'bond'],
    es: {
      name: 'Fondo monetario',
      slug: 'fondo-monetario',
      aliases: ['fondos monetarios', 'fondo del mercado monetario', 'fondos del mercado monetario', 'mercado monetario'],
      short: 'Un fondo que invierte solo en deuda de muy corto plazo y alta calidad, como letras del Tesoro y depósitos, para ofrecer estabilidad y liquidez con una rentabilidad cercana a los tipos de interés.',
      body: `Un fondo monetario compra deuda que vence en semanas o pocos meses: letras del Tesoro, pagarés de empresas solventes y depósitos bancarios. Como los préstamos son tan cortos, su valor apenas se mueve cuando cambian los tipos de interés, y su rentabilidad sigue de cerca al tipo del Banco Central Europeo menos la comisión.

Eso lo convierte en un buen aparcamiento para dinero que vas a necesitar pronto o que no quieres exponer a la bolsa. Con los tipos al 3 % y una comisión del 0,2 %, 10.000 € rinden unos 280 € al año, sin la volatilidad de la renta variable.

No es lo mismo que una cuenta garantizada: no está cubierto por el fondo de garantía de depósitos, y en episodios extremos puede perder algo de valor. Tampoco es una inversión a largo plazo: a veinte años, lo que gana apenas supera la inflación. Su función es la estabilidad, no el crecimiento.`
    },
    en: {
      name: 'Money market fund',
      slug: 'money-market-fund',
      aliases: ['money market funds', 'money market'],
      short: 'A fund that invests only in very short-term, high-quality debt such as Treasury bills and bank deposits, aiming for stability and liquidity with a return close to prevailing interest rates.',
      body: `A money market fund buys debt that matures in weeks or a few months: Treasury bills, commercial paper from solid companies and bank deposits. Because the loans are so short, their value barely moves when interest rates change, and the fund's return tracks the central bank's rate minus its fee.

That makes it a sensible place to park money you will need soon or do not want exposed to the stock market. With rates at 4% and a 0.2% fee, $10,000 earns around $380 a year without the swings of equities.

It is not the same as an insured bank account: it is not covered by deposit insurance, and in extreme episodes it can lose a little value. Nor is it a long-term investment: over twenty years its return barely beats inflation. Its job is stability, not growth.`
    },
    pt: {
      name: 'Fundo monetário (fundo DI)',
      slug: 'fundo-monetario-fundo-di',
      aliases: ['fundos monetários', 'fundo monetário', 'mercado monetário', 'fundo DI', 'fundos DI'],
      short: 'Um fundo que investe apenas em dívida de prazo muito curto e alta qualidade, como títulos públicos pós-fixados, para oferecer estabilidade e liquidez com uma rentabilidade próxima da taxa básica de juros.',
      body: `Um fundo monetário compra dívida de prazo muito curto ou que acompanha a taxa do dia: no Brasil, sobretudo títulos públicos pós-fixados e operações atreladas ao CDI, por isso esses fundos também são chamados de fundos DI. Como o rendimento acompanha os juros diários, o valor da cota quase não oscila.

Isso faz dele um bom estacionamento para o dinheiro que você vai precisar em breve ou que não quer expor à bolsa. O ponto de atenção é a taxa de administração: num fundo DI, uma taxa de 1% ao ano pode consumir uma parte grande do rendimento, e o Tesouro Selic direto faz quase o mesmo trabalho por menos.

Não é o mesmo que uma conta garantida: fundos não têm a cobertura do FGC, e o imposto de renda segue a tabela regressiva, com come-cotas semestral. Também não é um investimento de longo prazo para crescer: a função dele é estabilidade e liquidez, não crescimento.`
    }
  },
  {
    id: 'ucits',
    group: 'investing',
    related: ['mutual-fund', 'diversification', 'etf'],
    es: {
      name: 'UCITS',
      slug: 'ucits',
      aliases: ['fondo UCITS', 'fondos UCITS', 'directiva UCITS', 'normativa UCITS'],
      short: 'El marco europeo que regula los fondos de inversión vendidos al público minorista, con límites de diversificación, liquidez y custodia comunes en toda la Unión Europea.',
      body: `UCITS son las siglas en inglés de los Organismos de Inversión Colectiva en Valores Mobiliarios, la directiva europea que fija qué puede hacer un fondo para poder venderse a cualquier ahorrador de la Unión. Un fondo UCITS autorizado en un país puede comercializarse en los demás con un régimen común, y por eso la etiqueta aparece en casi todos los fondos y ETF que compra un inversor español.

Las reglas más conocidas son de diversificación: como norma general, no más del 10 % del fondo en un mismo emisor, y las posiciones que superan el 5 % no pueden sumar más del 40 % del total. A eso se añaden la obligación de ofrecer reembolsos frecuentes, de dejar los activos en manos de un depositario independiente y de publicar un documento de datos fundamentales.

UCITS no garantiza que un fondo sea bueno ni barato, ni protege contra caídas del mercado. Lo que garantiza es que el fondo no puede jugarse tu dinero en una sola empresa, que sus activos están separados de la gestora y que puedes salir con relativa rapidez.`
    },
    en: {
      name: 'UCITS',
      slug: 'ucits',
      aliases: ['UCITS fund', 'UCITS funds', 'UCITS directive'],
      short: 'The European framework that regulates investment funds sold to the public, with common limits on diversification, liquidity and custody across the European Union.',
      body: `UCITS stands for Undertakings for Collective Investment in Transferable Securities, the EU directive that sets what a fund may do if it is to be sold to any retail saver in the Union. A UCITS fund authorised in one country can be marketed in the others under a shared rulebook, which is why the label appears on almost every European fund and ETF.

The best-known rules are about diversification: as a general rule, no more than 10% of the fund in a single issuer, and the positions above 5% cannot add up to more than 40% of the total. On top of that come frequent redemptions, an independent depositary holding the assets, and a standard key information document.

UCITS does not promise that a fund is good or cheap, and it does not protect you from market falls. What it does guarantee is that the fund cannot bet your money on one company, that its assets are kept apart from the manager, and that you can get out reasonably quickly.`
    },
    pt: {
      name: 'UCITS',
      slug: 'ucits',
      aliases: ['fundo UCITS', 'fundos UCITS', 'diretiva UCITS'],
      short: 'O marco europeu que regula os fundos de investimento vendidos ao público, com limites comuns de diversificação, liquidez e custódia em toda a União Europeia.',
      body: `UCITS é a sigla em inglês dos Organismos de Investimento Coletivo em Valores Mobiliários, a diretiva europeia que define o que um fundo pode fazer para ser vendido a qualquer investidor comum da União Europeia. Para o investidor brasileiro, a etiqueta aparece sobretudo em ETFs e fundos domiciliados na Irlanda ou em Luxemburgo, acessados por corretoras no exterior.

As regras mais conhecidas são de diversificação: como regra geral, no máximo 10% do fundo num mesmo emissor, e as posições acima de 5% não podem somar mais de 40% do total. Somam-se a isso resgates frequentes, um custodiante independente que guarda os ativos e um documento padronizado de informações essenciais. No Brasil, o papel equivalente é cumprido pelas regras da CVM, hoje a Resolução CVM 175.

UCITS não garante que um fundo seja bom ou barato, nem protege contra quedas do mercado. O que garante é que o fundo não pode apostar o seu dinheiro numa única empresa, que os ativos ficam separados da gestora e que você consegue sair com relativa rapidez.`
    }
  },
  {
    id: 'mutual-fund',
    group: 'investing',
    related: ['nav', 'index-fund', 'ter'],
    es: {
      name: 'Fondo de inversión',
      slug: 'fondo-de-inversion',
      aliases: ['fondos de inversión', 'IIC', 'institución de inversión colectiva', 'instituciones de inversión colectiva'],
      short: 'Un patrimonio común formado por el dinero de muchos inversores, gestionado por una gestora profesional y repartido en participaciones cuyo valor se calcula cada día.',
      body: `Un fondo de inversión junta el dinero de miles de personas y lo invierte según una política definida: acciones, renta fija, una mezcla de ambas o un índice. Cada inversor posee participaciones, y el valor de cada una sube o baja con la cartera. Una gestora toma las decisiones, un depositario custodia los activos y, en España, la CNMV supervisa a ambos. Es la forma más común de las instituciones de inversión colectiva, o IIC.

Su gran ventaja es el acceso: con 100 € puedes tener una parte de cientos de empresas que nunca podrías comprar una a una. Su gran riesgo es el coste. Un fondo de gestión activa que cobra un 1,8 % anual frente a un indexado al 0,2 % se queda, en treinta años y con un 7 % bruto, con aproximadamente un tercio menos de patrimonio final.

En España tienen además una ventaja fiscal propia: puedes traspasar el dinero de un fondo a otro sin pagar impuestos hasta el reembolso final. Eso convierte al fondo en una herramienta de diferimiento fiscal, siempre que la elección de fondos y comisiones sea buena.`
    },
    en: {
      name: 'Mutual fund',
      slug: 'mutual-fund',
      aliases: ['mutual funds', 'collective investment scheme', 'collective investment schemes', 'investment fund', 'investment funds'],
      short: 'A pool of money from many investors, run by a professional manager and divided into units or shares whose value is calculated every day.',
      body: `A mutual fund pools money from thousands of people and invests it according to a stated policy: shares, bonds, a mix of the two, or an index. Each investor owns units, and the value of each unit rises and falls with the portfolio. A management company makes the decisions, a separate custodian holds the assets and a regulator supervises both. In Europe the same thing is usually called a collective investment scheme.

Its great advantage is access: with $100 you can own a slice of hundreds of companies you could never buy one by one. Its great risk is cost. An active fund charging 1.8% a year against an index fund at 0.2%, at a 7% gross return over thirty years, ends with roughly a third less money.

Unlike an ETF, a traditional mutual fund is bought and sold once a day at the net asset value calculated after the market closes, so you never know the exact price when you place the order. That is a feature of the structure, not a flaw, and it matters mostly to people who trade often, which is itself a habit worth avoiding.`
    },
    pt: {
      name: 'Fundo de investimento',
      slug: 'fundo-de-investimento',
      aliases: ['fundos de investimento', 'organismo de investimento coletivo', 'organismos de investimento coletivo'],
      short: 'Um patrimônio comum formado pelo dinheiro de muitos investidores, administrado por uma gestora profissional e dividido em cotas cujo valor é calculado todos os dias.',
      body: `Um fundo de investimento junta o dinheiro de milhares de pessoas e o aplica segundo uma política definida: ações, renda fixa, uma mistura das duas ou um índice. Cada investidor tem cotas, e o valor de cada cota sobe ou desce com a carteira. Uma gestora toma as decisões, um administrador e um custodiante cuidam dos ativos e da contabilidade, e a CVM supervisiona tudo, hoje pela Resolução CVM 175.

A grande vantagem é o acesso: com pouco dinheiro você tem uma parte de dezenas de ativos que nunca conseguiria comprar um a um. O grande risco é o custo. Um fundo que cobra 2% ao ano contra uma alternativa a 0,3%, com 7% de rentabilidade bruta em trinta anos, termina com mais de um terço a menos de patrimônio.

No Brasil, a tributação também pesa: fundos abertos de renda fixa e multimercado sofrem o come-cotas, uma antecipação semestral de imposto de renda em maio e novembro que reduz o efeito dos juros compostos. Comparar fundos pelo resultado líquido, depois de taxas e impostos, é o que separa uma boa escolha de uma propaganda bem feita.`
    }
  },
  {
    id: 'nav',
    group: 'investing',
    related: ['mutual-fund', 'etf', 'liquidity'],
    es: {
      name: 'Valor liquidativo',
      slug: 'valor-liquidativo',
      aliases: ['NAV', 'valor liquidativo de la participación'],
      short: 'El precio de una participación de un fondo: el valor de todo lo que posee menos lo que debe, dividido entre el número de participaciones.',
      body: `El valor liquidativo se calcula sumando el valor de mercado de todos los activos del fondo, restando sus deudas y gastos pendientes y dividiendo el resultado entre las participaciones en circulación. Un fondo con 101 millones de euros en activos, 1 millón en obligaciones y 4 millones de participaciones tiene un valor liquidativo de 25 €.

La gestora lo calcula una vez al día, con los precios de cierre. Por eso, cuando das una orden de suscripción o reembolso antes de la hora de corte, no sabes el precio exacto al que se ejecutará: lo sabrás al día siguiente. Es lo que se llama operar «a ciegas», y existe para que nadie pueda aprovecharse de precios ya conocidos a costa de los demás partícipes.

A diferencia de una acción, el valor liquidativo no depende de la oferta y la demanda del propio fondo: refleja lo que vale la cartera. Una subida del valor liquidativo no es una opinión del mercado sobre el fondo, sino el resultado de lo que ha pasado con lo que el fondo posee.`
    },
    en: {
      name: 'Net asset value (NAV)',
      slug: 'net-asset-value-nav',
      aliases: ['NAV', 'net asset value', 'NAV per share'],
      short: 'The price of one unit of a fund: the value of everything it owns minus what it owes, divided by the number of units.',
      body: `Net asset value is calculated by adding up the market value of every asset in the fund, subtracting its debts and accrued expenses, and dividing the result by the units in issue. A fund with $101 million of assets, $1 million of liabilities and 4 million units has a NAV of $25.

The manager calculates it once a day, using closing prices. That is why an order to buy or sell placed before the cut-off time does not tell you the exact price it will get: you find out the next day. This "forward pricing" exists so that nobody can trade on a price that is already known at the expense of the fund's other investors.

Unlike a share, a fund's NAV is not set by supply and demand for the fund itself: it reflects what the portfolio is worth. A rising NAV is not the market's opinion of the fund but the arithmetic result of what happened to the things it holds.`
    },
    pt: {
      name: 'Valor da cota',
      slug: 'valor-da-cota',
      aliases: ['NAV', 'valor patrimonial da cota', 'cota do fundo'],
      short: 'O preço de uma cota de um fundo: o valor de tudo o que ele possui menos o que deve, dividido pelo número de cotas.',
      body: `O valor da cota é calculado somando o valor de mercado de todos os ativos do fundo, subtraindo dívidas e despesas a pagar e dividindo o resultado pelo número de cotas emitidas. Um fundo com 101 milhões em ativos, 1 milhão em obrigações e 4 milhões de cotas tem uma cota de 25.

A administradora calcula esse valor uma vez por dia, com os preços de fechamento. Por isso, quando você faz uma aplicação ou um resgate antes do horário de corte, não sabe o preço exato que vai conseguir: só fica sabendo depois. É o que se chama de operar "às cegas", e existe para que ninguém aproveite um preço já conhecido à custa dos outros cotistas.

Diferente de uma ação, o valor da cota de um fundo aberto não depende da oferta e da demanda pelo próprio fundo: reflete o que a carteira vale. Uma alta na cota não é a opinião do mercado sobre o fundo, mas o resultado aritmético do que aconteceu com o que ele possui.`
    }
  },
  {
    id: 'bond',
    group: 'investing',
    related: ['asset-allocation', 'diversification', 'inflation'],
    es: {
      name: 'Bono',
      slug: 'bono',
      aliases: ['bonos', 'renta fija', 'obligaciones del Estado', 'letras del Tesoro'],
      short: 'Un préstamo que haces a un Estado o a una empresa a cambio de unos intereses fijos y de la devolución del capital en una fecha acordada.',
      body: `Cuando compras un bono, prestas dinero. El emisor, sea el Tesoro o una empresa, se compromete a pagarte un interés periódico, el cupón, y a devolverte el nominal al vencimiento. Un bono de 1.000 € al 3 % a diez años paga 30 € al año y devuelve los 1.000 € al final. Las letras del Tesoro son la versión a corto plazo: no pagan cupón, se compran por debajo de su valor y se cobran enteras al vencer.

El precio de un bono se mueve en sentido contrario a los tipos de interés. Si los tipos suben al 5 %, nadie pagará 1.000 € por tu bono al 3 %, y su precio de mercado cae; cuanto más lejos esté el vencimiento, más cae. Por eso los índices de renta fija «segura» perdieron entre un 13 % y un 17 % en 2022, cuando los tipos subieron de golpe.

En una cartera, los bonos de alta calidad cumplen una función distinta a la de las acciones: menos rentabilidad esperada a cambio de caídas más suaves y de ingresos previsibles. Son el amortiguador que permite mantener la parte de renta variable cuando la bolsa cae, y su peso es una de las decisiones centrales de la distribución de activos.`
    },
    en: {
      name: 'Bond',
      slug: 'bond',
      aliases: ['bonds', 'fixed income', 'government bonds', 'Treasury bills'],
      short: 'A loan you make to a government or a company in exchange for fixed interest payments and the return of your capital on an agreed date.',
      body: `When you buy a bond you are lending money. The issuer, whether a government or a company, promises to pay you regular interest, the coupon, and to repay the face value at maturity. A $1,000 ten-year bond at 3% pays $30 a year and returns the $1,000 at the end. Treasury bills are the short-term version: they pay no coupon, are bought below face value and repay the full amount when they mature.

A bond's price moves in the opposite direction to interest rates. If rates rise to 5%, nobody will pay $1,000 for your 3% bond, so its market price falls; the longer the time to maturity, the bigger the fall. That is why broad "safe" bond indexes lost between 13% and 17% in 2022, when rates rose sharply.

In a portfolio, high-quality bonds do a different job from shares: lower expected return in exchange for gentler falls and predictable income. They are the shock absorber that lets you keep holding the equity part when the market drops, and how much of them to own is one of the central asset allocation decisions.`
    },
    pt: {
      name: 'Título de renda fixa',
      slug: 'titulo-de-renda-fixa',
      aliases: ['títulos de renda fixa', 'renda fixa', 'títulos públicos', 'debêntures', 'bonds'],
      short: 'Um empréstimo que você faz a um governo, a um banco ou a uma empresa em troca de juros combinados e da devolução do capital numa data acertada.',
      body: `Quando você compra um título de renda fixa, está emprestando dinheiro. O emissor, seja o Tesouro Nacional, um banco num CDB ou uma empresa numa debênture, se compromete a pagar juros e a devolver o valor no vencimento. Os juros podem ser prefixados, atrelados à inflação, como no Tesouro IPCA+, ou pós-fixados, acompanhando a Selic ou o CDI.

O preço de um título prefixado ou atrelado à inflação se move no sentido contrário aos juros. Se a taxa de mercado sobe, ninguém paga o preço cheio por um título que rende menos, e o valor dele cai; quanto mais longo o vencimento, maior a queda. É por isso que um Tesouro IPCA+ longo pode mostrar perdas fortes antes do vencimento, mesmo sendo "seguro" se levado até o fim.

Numa carteira, a renda fixa de boa qualidade cumpre um papel diferente das ações: menos rentabilidade esperada em troca de quedas mais suaves e rendimentos previsíveis. É o amortecedor que permite manter a parte de renda variável quando a bolsa cai, e quanto ter dela é uma das decisões centrais da alocação de ativos.`
    }
  },
  {
    id: 'liquidity',
    group: 'investing',
    related: ['emergency-fund', 'money-market-fund', 'reit'],
    es: {
      name: 'Liquidez',
      slug: 'liquidez',
      aliases: ['ilíquido', 'ilíquida', 'ilíquidos', 'ilíquidas', 'iliquidez'],
      short: 'La facilidad con la que una inversión se convierte en dinero disponible, rápido y sin tener que aceptar un precio peor.',
      body: `Una inversión es líquida cuando puedes venderla en poco tiempo, con pocos costes y a un precio cercano a su valor. Un ETF sobre un gran índice se vende en segundos en horario de mercado; un fondo de inversión, en uno o dos días; un piso puede tardar meses y costar entre un 6 % y un 10 % entre impuestos, notaría y comisiones.

La liquidez tiene valor, y el mercado lo cobra. Los activos ilíquidos suelen prometer una rentabilidad algo mayor precisamente porque te obligan a renunciar al acceso a tu dinero. El problema llega cuando necesitas ese dinero en el peor momento: una venta urgente de algo ilíquido se hace siempre con descuento.

Por eso la regla práctica es separar el dinero por plazos. Lo que puedes necesitar en meses va en instrumentos líquidos y estables, como el fondo de emergencia; solo lo que no vas a tocar en muchos años puede permitirse estar en algo difícil de vender.`
    },
    en: {
      name: 'Liquidity',
      slug: 'liquidity',
      aliases: ['liquid', 'illiquid', 'illiquidity'],
      short: 'How easily an investment can be turned into spendable cash, quickly and without having to accept a worse price.',
      body: `An investment is liquid when you can sell it quickly, cheaply and at a price close to its value. An ETF on a major index sells in seconds during market hours; a mutual fund in a day or two; a house can take months and cost 6% to 10% in taxes, legal fees and agent commissions.

Liquidity has value, and the market charges for it. Illiquid assets tend to promise a somewhat higher return precisely because they ask you to give up access to your money. The problem comes when you need that money at the worst moment: an urgent sale of something illiquid always happens at a discount.

So the practical rule is to separate money by time horizon. What you might need within months belongs in liquid, stable instruments such as an emergency fund; only money you will not touch for many years can afford to sit in something hard to sell.`
    },
    pt: {
      name: 'Liquidez',
      slug: 'liquidez',
      aliases: ['ilíquido', 'ilíquida', 'ilíquidos', 'ilíquidas', 'iliquidez'],
      short: 'A facilidade com que um investimento se transforma em dinheiro disponível, rápido e sem precisar aceitar um preço pior.',
      body: `Um investimento é líquido quando você consegue vendê-lo em pouco tempo, com pouco custo e a um preço próximo do seu valor. Um ETF de um grande índice é vendido em segundos no pregão; um Tesouro Selic, em um dia útil; um imóvel pode levar meses e custar uma fatia relevante do valor entre ITBI, cartório e corretagem.

A liquidez tem valor, e o mercado cobra por ela. Ativos ilíquidos costumam prometer uma rentabilidade um pouco maior justamente porque pedem que você abra mão do acesso ao dinheiro. O problema aparece quando você precisa desse dinheiro no pior momento: uma venda urgente de algo ilíquido sempre sai com desconto.

Por isso a regra prática é separar o dinheiro por prazos. O que você pode precisar em meses vai para aplicações líquidas e estáveis, como a reserva de emergência; só o que não vai ser tocado por muitos anos pode ficar em algo difícil de vender.`
    }
  },
  {
    id: 'leverage',
    group: 'investing',
    related: ['volatility', 'drawdown', 'hedge-fund'],
    es: {
      name: 'Apalancamiento',
      slug: 'apalancamiento',
      aliases: ['apalancado', 'apalancada', 'apalancados', 'apalancadas', 'apalancarse'],
      short: 'Invertir con dinero prestado para multiplicar la exposición, lo que amplifica tanto las ganancias como las pérdidas.',
      body: `Apalancarse es invertir más dinero del que tienes. Si con 10.000 € propios y 10.000 € prestados compras 20.000 € de acciones, estás apalancado dos veces: una subida del 10 % te da un 20 % sobre tu capital, menos los intereses del préstamo. Una hipoteca es la forma de apalancamiento más común, aunque rara vez se llame así.

El problema es que el multiplicador funciona igual hacia abajo. Con un apalancamiento de dos veces, una caída del 10 % se convierte en una pérdida del 20 %, y una del 50 % se lleva todo tu capital. Peor aún, el prestamista puede obligarte a vender en mitad de la caída, convirtiendo una pérdida temporal en definitiva.

Por eso el apalancamiento no cambia la calidad de una inversión, solo su tamaño y su fragilidad. Usado por gestores profesionales con coberturas ya es un riesgo serio; en una cartera personal pensada para décadas, la pregunta útil es qué pasaría con él en la peor caída de la historia, no en un año normal.`
    },
    en: {
      name: 'Financial leverage',
      slug: 'financial-leverage',
      aliases: ['leveraged', 'levered', 'borrowing to invest', 'margin borrowing'],
      short: 'Investing with borrowed money to multiply your exposure, which amplifies gains and losses alike.',
      body: `Leverage means investing more money than you have. If you combine $10,000 of your own with $10,000 borrowed to buy $20,000 of shares, you are leveraged two times: a 10% rise gives you 20% on your capital, minus the interest on the loan. A mortgage is the most common form of leverage, even if it is rarely called that.

The trouble is that the multiplier works the same way on the way down. At two times leverage, a 10% fall becomes a 20% loss, and a 50% fall wipes out your capital entirely. Worse, the lender can force you to sell in the middle of the fall, turning a temporary loss into a permanent one.

So leverage does not change the quality of an investment, only its size and its fragility. In the hands of professional managers with hedges it is already a serious risk; in a personal portfolio meant to last decades, the useful question is what it would do in the worst crash on record, not in an ordinary year.`
    },
    pt: {
      name: 'Alavancagem',
      slug: 'alavancagem',
      aliases: ['alavancado', 'alavancada', 'alavancados', 'alavancadas', 'alavancar'],
      short: 'Investir com dinheiro emprestado para multiplicar a exposição, o que amplia tanto os ganhos quanto as perdas.',
      body: `Alavancar-se é investir mais dinheiro do que você tem. Se, com 10.000 próprios e 10.000 emprestados, você compra 20.000 em ações, está alavancado duas vezes: uma alta de 10% rende 20% sobre o seu capital, menos os juros do empréstimo. Um financiamento imobiliário é a forma mais comum de alavancagem, mesmo que quase nunca seja chamado assim.

O problema é que o multiplicador funciona igual para baixo. Com alavancagem de duas vezes, uma queda de 10% vira uma perda de 20%, e uma queda de 50% leva todo o seu capital. Pior: quem emprestou pode obrigar você a vender no meio da queda, transformando uma perda temporária em definitiva.

Por isso a alavancagem não muda a qualidade de um investimento, só o tamanho e a fragilidade dele. Nas mãos de gestores profissionais com proteções, já é um risco sério; numa carteira pessoal pensada para décadas, a pergunta útil é o que ela faria na pior queda da história, não num ano normal.`
    }
  },
  {
    id: 'derivatives',
    group: 'investing',
    related: ['leverage', 'hedge-fund', 'ucits'],
    es: {
      name: 'Derivado financiero',
      slug: 'derivado-financiero',
      aliases: ['derivados financieros', 'derivados', 'instrumentos derivados', 'productos derivados'],
      short: 'Un contrato cuyo valor depende del precio de otro activo, como una acción, un índice, un tipo de interés o una divisa.',
      body: `Un derivado no es una inversión en algo, sino un contrato sobre algo. Un futuro obliga a comprar o vender un activo a un precio fijado hoy para una fecha futura; una opción da el derecho, pero no la obligación, de hacerlo; un swap intercambia flujos de pago, por ejemplo un tipo fijo por uno variable. Su valor sube y baja con el activo del que «deriva».

Sirven para dos cosas opuestas. Para cubrirse, como una empresa que fija hoy el precio del combustible que usará el año que viene, o un fondo garantizado que compra opciones para asegurar el capital. Y para especular con poco dinero, porque muchos derivados llevan apalancamiento incorporado: un movimiento del 5 % en el subyacente puede suponer un 50 % en el contrato.

Por eso la normativa UCITS limita cuánto puede usar un fondo dirigido al público, y por eso los derivados están en el centro de casi todos los grandes accidentes financieros. Para un inversor particular, lo relevante suele ser saber si su fondo los usa y para qué, no usarlos directamente.`
    },
    en: {
      name: 'Derivative',
      slug: 'derivative',
      aliases: ['derivatives', 'derivative contracts', 'futures contracts', 'options contracts'],
      short: 'A contract whose value depends on the price of something else, such as a share, an index, an interest rate or a currency.',
      body: `A derivative is not an investment in something but a contract about something. A futures contract obliges you to buy or sell an asset at a price fixed today for a date in the future; an option gives you the right, but not the obligation, to do so; a swap exchanges streams of payments, such as a fixed rate for a floating one. Its value rises and falls with the asset it is "derived" from.

They are used for two opposite purposes. To hedge, like an airline locking in today the fuel price it will pay next year, or a guaranteed fund buying options to protect its capital. And to speculate with little money, because many derivatives come with leverage built in: a 5% move in the underlying asset can mean 50% on the contract.

That is why the UCITS rules cap how much a fund sold to the public can use them, and why derivatives sit at the centre of almost every major financial accident. For an individual investor the relevant question is usually whether your fund uses them and for what, not whether to use them yourself.`
    },
    pt: {
      name: 'Derivativo',
      slug: 'derivativo',
      aliases: ['derivativos', 'contratos futuros', 'contratos de opções'],
      short: 'Um contrato cujo valor depende do preço de outro ativo, como uma ação, um índice, uma taxa de juros ou uma moeda.',
      body: `Um derivativo não é um investimento em algo, mas um contrato sobre algo. Um contrato futuro obriga a comprar ou vender um ativo a um preço fixado hoje para uma data futura; uma opção dá o direito, mas não a obrigação, de fazer isso; um swap troca fluxos de pagamento, como uma taxa prefixada por uma pós-fixada. O valor dele sobe e desce com o ativo do qual "deriva".

Os derivativos servem para duas coisas opostas. Para se proteger, como uma empresa que fixa hoje o preço do dólar que vai pagar no ano que vem, ou um fundo de capital protegido que compra opções para garantir o principal. E para especular com pouco dinheiro, porque muitos derivativos já trazem alavancagem embutida: um movimento de 5% no ativo pode significar 50% no contrato.

É por isso que a regulação limita quanto um fundo vendido ao público pode usá-los, e é por isso que os derivativos estão no centro de quase todos os grandes acidentes financeiros. Para quem investe por conta própria, o relevante costuma ser saber se o seu fundo os usa e para quê, não operá-los diretamente.`
    }
  },
  {
    id: 'capital-gains',
    group: 'investing',
    related: ['tax-deferral', 'mutual-fund', 'real-return'],
    es: {
      name: 'Plusvalía',
      slug: 'plusvalia',
      aliases: ['plusvalías', 'ganancia patrimonial', 'ganancias patrimoniales', 'ganancia de capital', 'ganancias de capital'],
      short: 'La ganancia que obtienes al vender una inversión por más de lo que pagaste por ella; en España tributa en la base del ahorro.',
      body: `Si compras participaciones de un fondo por 10.000 € y las vendes por 15.000 €, la plusvalía es de 5.000 €. Mientras no vendes, la ganancia es solo latente: existe en el valor de tu cartera, pero Hacienda no la grava. Al vender se materializa y tributa como ganancia patrimonial en la base del ahorro, con tipos que suben por tramos según el importe.

Que el impuesto solo llegue con la venta es más valioso de lo que parece. El dinero que no pagas cada año sigue invirtiéndose y generando rendimientos, y la diferencia a lo largo de décadas es grande. En España, el traspaso entre fondos de inversión permite cambiar de fondo sin vender a efectos fiscales, lo que mantiene ese diferimiento intacto; con acciones o ETF, cada cambio es una venta.

Lo que no conviene hacer es dejar que el impuesto dirija la estrategia. Una plusvalía es la prueba de que algo salió bien; renunciar a rebalancear o a salir de una mala inversión solo para no pagarla suele costar más de lo que ahorra.`
    },
    en: {
      name: 'Capital gain',
      slug: 'capital-gain',
      aliases: ['capital gains', 'capital gains tax'],
      short: 'The profit you make when you sell an investment for more than you paid for it, usually taxed only when you sell.',
      body: `If you buy fund units for $10,000 and sell them for $15,000, your capital gain is $5,000. Until you sell, the gain is only unrealised: it exists in the value of your portfolio, but in most countries it is not taxed. When you sell it becomes realised and is taxed as a capital gain, often at a different rate from income.

The fact that the tax only arrives with the sale is worth more than it looks. Money you do not pay every year stays invested and keeps compounding, and the difference over decades is large. That is why holding a broad fund for a long time is usually more tax-efficient than trading in and out of positions, and why tax-advantaged accounts are worth filling first.

What you should not do is let the tax drive the strategy. A capital gain is proof that something worked; refusing to rebalance or to sell a bad investment just to avoid paying it usually costs more than it saves.`
    },
    pt: {
      name: 'Ganho de capital',
      slug: 'ganho-de-capital',
      aliases: ['ganhos de capital', 'lucro na venda'],
      short: 'O lucro que você obtém ao vender um investimento por mais do que pagou por ele; no Brasil, em geral tributado só na venda ou no resgate.',
      body: `Se você compra cotas de um ETF por 10.000 e as vende por 15.000, o ganho de capital é de 5.000. Enquanto você não vende, o ganho é apenas potencial: está no valor da carteira, mas não é tributado. Na venda ele se realiza, e o imposto de renda incide sobre o lucro, com regras diferentes para ações, ETFs, FIIs e renda fixa.

Que o imposto só chegue com a venda vale mais do que parece. O dinheiro que você não paga todo ano continua investido e rendendo juros sobre juros, e a diferença em décadas é grande. É por isso que o come-cotas dos fundos abertos pesa: ele antecipa parte do imposto duas vezes por ano e reduz esse efeito.

O que não convém é deixar o imposto dirigir a estratégia. Um ganho de capital é a prova de que algo deu certo; desistir de rebalancear ou de sair de um investimento ruim só para não pagar o imposto costuma custar mais do que economiza.`
    }
  },
  {
    id: 'dividend-yield',
    group: 'investing',
    related: ['passive-income', 'etf', 'real-return'],
    es: {
      name: 'Rentabilidad por dividendo',
      slug: 'rentabilidad-por-dividendo',
      aliases: ['dividend yield', 'rentabilidad del dividendo'],
      short: 'El dividendo anual que paga una acción o un fondo dividido entre su precio, expresado en porcentaje.',
      body: `La rentabilidad por dividendo se calcula dividiendo el dividendo pagado en un año entre el precio de la acción. Una acción a 20 € que reparte 1 € al año tiene una rentabilidad por dividendo del 5 %.

Es un cociente, y eso significa que sube cuando el numerador crece y también cuando el denominador cae. Una empresa cuyo precio se ha desplomado un 40 % aparece de golpe con una rentabilidad por dividendo altísima, y esa cifra no es una buena noticia: es el mercado diciendo que duda de que el dividendo se mantenga.

Para quien vive de su cartera, el dividendo es solo una de las dos formas de sacar dinero de ella; la otra es vender participaciones. Elegir acciones por su dividendo alto en lugar de por su rentabilidad total es una de las trampas más frecuentes al construir una cartera de ingresos.`
    },
    en: {
      name: 'Dividend yield',
      slug: 'dividend-yield',
      aliases: ['dividend yields'],
      short: 'The annual dividend a share or fund pays divided by its price, expressed as a percentage.',
      body: `Dividend yield is the dividend paid over a year divided by the share price. A share at $20 paying $1 a year yields 5%.

It is a ratio, which means it rises when the numerator grows and also when the denominator falls. A company whose price has collapsed by 40% suddenly shows a spectacular yield, and that number is not good news: it is the market saying it doubts the dividend will survive.

For somebody living off a portfolio, dividends are only one of the two ways of taking money out; the other is selling units. Picking shares for a high yield rather than for total return is one of the most common traps in building an income portfolio.`
    },
    pt: {
      name: 'Dividend yield',
      slug: 'dividend-yield',
      aliases: ['dividend yields', 'rendimento por dividendo', 'rentabilidade por dividendo'],
      short: 'O dividendo anual que uma ação ou um fundo paga dividido pelo seu preço, expresso em porcentagem.',
      body: `O dividend yield é calculado dividindo os dividendos pagos em doze meses pelo preço atual da ação ou da cota. Uma ação a 20 que distribui 1 por ano tem um dividend yield de 5%.

É uma divisão, e isso significa que ele sobe quando os dividendos crescem e também quando o preço cai. Uma empresa cuja ação despencou 40% aparece de repente com um dividend yield altíssimo, e esse número não é boa notícia: é o mercado dizendo que duvida que o dividendo vá se manter. Nos FIIs, um yield muito acima dos pares costuma vir de um problema que ainda não apareceu na distribuição.

Para quem vive da carteira, o dividendo é só uma das duas formas de tirar dinheiro dela; a outra é vender cotas. Escolher ações pelo dividend yield alto em vez da rentabilidade total é uma das armadilhas mais comuns ao montar uma carteira de renda.`
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
      name: 'Mercado em baixa (bear market)',
      slug: 'mercado-em-baixa',
      aliases: ['bear market', 'bear markets', 'mercado de baixa', 'mercados em baixa'],
      short: 'Um período em que um índice cai pelo menos 20% desde o seu máximo anterior e se mantém nesse patamar.',
      body: `O limite de 20% é uma convenção, não uma lei: serve para separar uma queda séria de uma correção comum, que é qualquer recuo de 10%.

Os mercados em baixa são frequentes e costumam ser mais curtos do que parecem enquanto acontecem. Na bolsa americana houve um a cada seis ou sete anos, em média, desde 1950, com duração típica inferior a dois anos e uma recuperação posterior que sempre superou o ponto de partida.

O que decide o seu resultado não é o mercado em baixa, mas o que você faz dentro dele. Vender no fundo transforma uma perda temporária em permanente, e é a única forma garantida de uma queda de 30% custar dinheiro de verdade.`
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
      name: 'Aporte único',
      slug: 'aporte-unico',
      aliases: ['lump sum', 'investimento de uma só vez', 'investir tudo de uma vez'],
      short: 'Investir um valor inteiro num único momento, em vez de dividi-lo em aportes periódicos.',
      body: `A alternativa ao aporte único é o aporte periódico: dividir o dinheiro em partes iguais e entrar ao longo de vários meses.

Estatisticamente, investir tudo de uma vez ganha em cerca de dois de cada três períodos históricos, simplesmente porque o mercado sobe mais vezes do que cai e estar investido compensa. O preço dessa vantagem é a possibilidade de entrar pouco antes de uma queda.

Por isso a decisão é mais psicológica do que matemática. Se uma queda de 20% na semana seguinte fizesse você vender, o aporte periódico é melhor: não porque renda mais, mas porque é o que você será capaz de manter.`
    }
  },
  {
    id: 'mortgage',
    group: 'money',
    related: ['apr', 'leverage', 'compound-debt'],
    es: {
      name: 'Hipoteca',
      slug: 'hipoteca',
      aliases: ['hipotecas', 'préstamo hipotecario', 'préstamos hipotecarios', 'crédito hipotecario'],
      short: 'Un préstamo a largo plazo para comprar una vivienda, en el que la propia vivienda queda como garantía si dejas de pagar.',
      body: `Una hipoteca es un préstamo de muchos años, normalmente entre 20 y 30, con la vivienda como garantía. Puede ser a tipo fijo, con la misma cuota toda la vida, o a tipo variable, en la que el interés se revisa cada año según el Euríbor más un diferencial. La comparación entre ofertas se hace por la TAE, no por el tipo nominal, porque la TAE incluye comisiones y productos vinculados.

El plazo es lo que más pesa. Un préstamo de 200.000 € al 3 % a 30 años tiene una cuota de unos 843 € al mes, y al final se habrán pagado cerca de 103.000 € solo en intereses. El mismo préstamo a 20 años sube la cuota a unos 1.109 €, pero los intereses totales bajan a unos 66.000 €.

Una hipoteca también es apalancamiento: con un 20 % de entrada, una caída del 10 % en el precio de la vivienda se come la mitad de tu aportación. Eso no la hace mala, pero sí explica por qué los bancos limitan la cuota a una parte de los ingresos y por qué conviene que la tuya quede por debajo de ese límite, no justo en él.`
    },
    en: {
      name: 'Mortgage',
      slug: 'mortgage',
      aliases: ['mortgages', 'home loan', 'home loans', 'mortgage loan'],
      short: 'A long-term loan to buy a home, in which the home itself is the security the lender can take if you stop paying.',
      body: `A mortgage is a loan over many years, usually 15 to 30, secured on the property. It can be fixed-rate, with the same payment for the whole term or a set period, or variable, with the interest reset periodically against a benchmark rate plus a margin. Offers should be compared on APR, not on the headline rate, because the APR includes fees.

The term is what weighs most. A $200,000 loan at 3% over 30 years costs about $843 a month, and by the end roughly $103,000 has gone on interest alone. The same loan over 20 years raises the payment to about $1,109, but cuts total interest to around $66,000.

A mortgage is also leverage: with a 20% deposit, a 10% fall in the price of the home wipes out half of your stake. That does not make it bad, but it does explain why lenders cap the payment at a share of income, and why it is wise for yours to sit comfortably below that limit rather than right at it.`
    },
    pt: {
      name: 'Financiamento imobiliário',
      slug: 'financiamento-imobiliario',
      aliases: ['financiamentos imobiliários', 'crédito imobiliário', 'hipoteca', 'hipotecas'],
      short: 'Um empréstimo de longo prazo para comprar um imóvel, em que o próprio imóvel fica como garantia caso você deixe de pagar.',
      body: `Um financiamento imobiliário é um empréstimo de muitos anos, muitas vezes de 20 a 35, com o imóvel como garantia, normalmente por alienação fiduciária. No Brasil, as duas tabelas mais comuns são a SAC, em que as parcelas começam mais altas e diminuem, e a Price, com parcelas iguais. Ofertas devem ser comparadas pelo CET, o Custo Efetivo Total, e não só pela taxa de juros, porque o CET inclui seguros e tarifas.

O prazo e a taxa são o que mais pesa. Um financiamento de 200.000 a 10% ao ano por 30 anos na tabela Price tem parcela de cerca de 1.700 por mês, e no fim os juros somam mais do que o dobro do valor emprestado. Encurtar o prazo ou amortizar antes reduz esse total de forma drástica.

Um financiamento também é alavancagem: com 20% de entrada, uma queda de 10% no preço do imóvel consome metade do que você colocou. Isso não o torna ruim, mas explica por que os bancos limitam a parcela a cerca de 30% da renda e por que convém que a sua fique bem abaixo desse limite, não encostada nele.`
    }
  },
  {
    id: 'apr',
    group: 'money',
    related: ['compound-debt', 'mortgage', 'debt-avalanche'],
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
      name: 'CET (Custo Efetivo Total)',
      slug: 'cet-custo-efetivo-total',
      aliases: ['CET', 'custo efetivo total', 'APR'],
      short: 'O custo real anual de um empréstimo ou financiamento, que inclui a taxa de juros mais tarifas, seguros e impostos obrigatórios.',
      body: `A taxa de juros nominal é só o juro; o CET soma tarifas, seguros obrigatórios, IOF e qualquer outro encargo, e os distribui ao longo do contrato. Os bancos são obrigados a informá-lo, e é o número que permite comparar duas propostas de verdade.

A diferença entre os dois não é cosmética. Um empréstimo com juros de 2% ao mês pode ter um CET bem acima disso quando se somam seguro prestamista e tarifas, sobretudo se o prazo for curto, porque esses custos são cobrados de uma vez no início.

Por isso, diante de qualquer crédito, a pergunta útil não é de quanto é a parcela, mas qual é o CET e quanto se paga no total. A parcela pode ficar pequena esticando o prazo; o total, não.`
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
      short: 'Uma forma de pagar dívidas que ataca primeiro a de juros mais altos, independentemente do saldo.',
      body: `Você paga o mínimo de todas e direciona o excedente para a dívida mais cara. Quando ela é quitada, passa para a seguinte pela taxa de juros, não pelo tamanho.

É a opção ótima em juros pagos e em tempo total. Com um cartão de crédito a 12% ao mês e um empréstimo consignado a 2% ao mês, cada real que vai para o cartão economiza seis vezes mais do que o mesmo real no consignado.

O ponto fraco é o ânimo: se a dívida mais cara também for a maior, podem passar meses sem que nenhuma desapareça. Quem precisa ver progresso para não desistir costuma terminar mais planos com o método bola de neve.`
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
      short: 'Uma forma de pagar dívidas que ataca primeiro o menor saldo, independentemente da taxa de juros.',
      body: `Você paga o mínimo de todas as dívidas e todo o dinheiro que sobra vai para a menor. Quando ela desaparece, a parcela que você pagava se soma ao ataque à seguinte, e o pagamento acelera sozinho.

Matematicamente não é o ideal: pagar primeiro a dívida mais cara economiza mais juros. O que a bola de neve ganha é a primeira dívida quitada cedo e, com ela, a prova de que o plano funciona.

Essa prova tem valor real. Nos estudos sobre planos de pagamento, quem começa pela dívida pequena desiste menos, e um plano pior que se termina vence um plano ótimo abandonado no meio.`
    }
  }
];
