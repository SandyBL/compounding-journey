/**
 * The financial glossary: one entry per concept, in three languages.
 *
 * This file is content rather than machinery, and it is the input to two very
 * different things:
 *
 *   1. scripts/generate-glossary.mjs publishes an index and one page per term
 *      per language, which is what makes a definitional search land on this
 *      site instead of on somebody else's.
 *   2. scripts/glossary-links.mjs uses `name` and `aliases` to find the first
 *      mention of a term in an article body and link it to that term's page,
 *      automatically, at build time. That is why the aliases matter: an article
 *      that says "fondo indexado" and an article that says "fondos indexados"
 *      should both link to the same entry, and neither author should have to
 *      remember to write the link.
 *
 * Shape of an entry:
 *   id       - language-independent key. Used for `related` and for nothing the
 *              reader ever sees, so it never changes even if a slug does.
 *   group    - which pillar the term belongs to: investing, money, or mind.
 *              The index groups by it.
 *   related  - other entry ids. Rendered as links on the term's own page, and
 *              deliberately not symmetric: "ETF" is worth reaching from "index
 *              fund" more than the reverse.
 *   <lang>   - { name, slug, aliases, short, body }
 *              `name`    is the heading and the DefinedTerm name.
 *              `slug`    is the URL segment, localized.
 *              `aliases` are the other spellings the auto-linker should catch,
 *                        including plurals and the abbreviation, and must NOT
 *                        include `name` (the linker adds it).
 *              `short`   is one sentence. It is the index card, the meta
 *                        description and the DefinedTerm description, so it has
 *                        to stand alone with no heading above it.
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

This is why time horizon is the most powerful variable — and the only one you cannot buy later. A year of delay does not cost you one year of return; it costs the most valuable year, which is the last one.`
    },
    pt: {
      name: 'Juros compostos',
      slug: 'juros-compostos',
      aliases: ['capitalização composta', 'crescimento composto', 'juro composto'],
      short: 'O efeito pelo qual os rendimentos do teu dinheiro começam a gerar os seus próprios rendimentos, fazendo o capital crescer de forma exponencial e não linear.',
      body: `Os juros compostos aparecem quando **não retiras** o que o teu dinheiro rendeu. Juros, dividendos ou mais-valias são reinvestidos e passam a fazer parte do capital que gera o rendimento seguinte.

A diferença face aos juros simples é pequena no primeiro ano e enorme aos trinta. Com uma rentabilidade média de 7 % ao ano, 10.000 tornam-se cerca de 19.700 aos dez anos, 38.700 aos vinte e 76.100 aos trinta. Nada muda na contribuição: o que muda é o tempo que a deixaste trabalhar.

É por isso que o horizonte temporal é a variável mais poderosa — e a única que não se pode comprar mais tarde. Um ano de atraso não custa um ano de rentabilidade: custa o ano mais valioso, que é o último.`
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
      body: `A inflação não te tira dinheiro da conta: tira-te capacidade de compra. Se os preços sobem 3 % por ano, os 100 que tens hoje compram o equivalente a 97 no ano seguinte, ainda que o saldo continue a dizer 100.

É por isso que a poupança em dinheiro não é neutra, mas uma perda lenta. Uma conta que não paga nada, com inflação de 3 %, perde cerca de um quarto do seu poder de compra em dez anos.

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
      body: `A portfolio that rises 8% in a year with 3% inflation has not made you 8% richer. It has made you roughly 5% richer. That figure — the **real** return — is the only one you can compare against your future spending, because your future spending also rises with inflation.

Nominal return is what appears on statements and in headlines. Real return is what decides whether you can maintain your standard of living.

If you are projecting long term, pick one of the two coherent methods: project in nominal terms and inflate future spending, or project in real terms and leave spending in today's money. Mixing them is the single most common error in any retirement spreadsheet.`
    },
    pt: {
      name: 'Rentabilidade real',
      slug: 'rentabilidade-real',
      aliases: ['retorno real', 'rentabilidade ajustada à inflação'],
      short: 'A rentabilidade que sobra depois de descontar a inflação: aquilo que o teu poder de compra cresceu de facto, e não o teu saldo.',
      body: `Uma carteira que sobe 8 % num ano com inflação de 3 % não te tornou 8 % mais rico. Tornou-te cerca de 5 % mais rico. Esse número — a rentabilidade **real** — é o único que se pode comparar com as tuas despesas futuras, porque as tuas despesas futuras também sobem com a inflação.

A rentabilidade nominal é a que aparece nos extratos e nos títulos de jornal. A real é a que decide se conseguirás manter o teu nível de vida.

Se fizeres projeções de longo prazo, escolhe uma das duas formas coerentes: projeta em termos nominais e ajusta a despesa futura pela inflação, ou projeta em termos reais e deixa a despesa em euros de hoje. Misturá-las é o erro mais comum em qualquer folha de cálculo de reforma.`
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
      body: `An index fund buys every company in an index — the S&P 500, the MSCI World — in the weights that index specifies, and makes no further decisions. There is no manager selecting stocks, which is why the cost is a fraction of an active fund's.

The reason this works is not that indexing is clever but that it is **arithmetically hard to beat**. All investors together *are* the market; the average return before costs is the market's, and after costs it is the market's minus fees. A product charging 0.20% starts with a structural advantage over one charging 1.50%, and that advantage compounds year after year.

What an index fund does **not** do is protect you from falls: if the index drops 35%, your fund drops 35%. Its edge is cost and breadth, not stability.`
    },
    pt: {
      name: 'Fundo de índice',
      slug: 'fundo-de-indice',
      aliases: ['fundos de índice', 'fundo indexado', 'gestão passiva', 'indexação'],
      short: 'Um fundo que não tenta escolher as melhores empresas, mas replicar um índice completo ao menor custo possível.',
      body: `Um fundo de índice compra todas as empresas de um índice — o S&P 500, o MSCI World — na proporção que esse índice define, e não toma mais nenhuma decisão. Não há gestor a escolher ações, e por isso o custo é uma fração do de um fundo ativo.

A razão pela qual isto funciona não é a indexação ser inteligente, mas ser **aritmeticamente difícil de bater**. Todos os investidores juntos *são* o mercado; o rendimento médio antes de custos é o do mercado, e depois de custos é o do mercado menos as comissões. Um produto que cobra 0,20 % parte com uma vantagem estrutural sobre um que cobra 1,50 %, e essa vantagem compõe-se ano após ano.

O que um fundo de índice **não** faz é proteger-te das quedas: se o índice cai 35 %, o teu fundo cai 35 %. A sua vantagem é o custo e a amplitude, não a estabilidade.`
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

A maioria dos ETF são indexados, mas as duas coisas não são sinónimos: existem ETF de gestão ativa, alavancados, setoriais ou temáticos, e alguns são produtos caros e concentrados com um rótulo popular. O facto de algo ser um ETF não diz nada sobre ser uma boa ideia; o que importa é **o que** replica, **quanto** custa e **como** replica.

O domicílio e a estrutura também afetam o imposto que pagas sobre dividendos, e isso depende de onde vives. É uma das poucas decisões deste terreno em que a fiscalidade local pesa mais do que o produto, e vale a pena confirmá-la com um profissional registado.`
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
      body: `The TER — total expense ratio — is a fund's annual cost as a percentage of assets. It is never invoiced: it is quietly subtracted from the unit price, every day, which makes it the easiest expense in a financial lifetime to ignore.

The gap between 0.20% and 1.50% looks trivial. On $100,000 over thirty years at 7%, it is roughly $200,000 of difference in the final balance. The cost is not subtracted from your return: it is subtracted from **all the compounding that return would have produced**.

It is also the only variable in a portfolio you know with certainty in advance. Future return is an estimate; the fee is a fact.`
    },
    pt: {
      name: 'TER (custo total)',
      slug: 'ter-custo-total',
      aliases: ['total expense ratio', 'comissão de gestão', 'encargos correntes', 'taxa de despesas'],
      short: 'A percentagem anual que um fundo cobra sobre o dinheiro investido, descontada tanto num bom ano como num ano mau.',
      body: `O TER — *total expense ratio* — é o custo anual do fundo expresso como percentagem do património. Não é faturado: é subtraído silenciosamente do valor da unidade, todos os dias, o que o torna a despesa mais fácil de ignorar de toda uma vida financeira.

A diferença entre 0,20 % e 1,50 % parece trivial. Sobre 100.000 durante trinta anos a 7 %, são cerca de 200.000 de diferença no património final. O custo não se subtrai à rentabilidade: subtrai-se a **todos os juros compostos que essa rentabilidade teria gerado**.

É também a única variável de uma carteira que conheces com certeza de antemão. A rentabilidade futura é uma estimativa; a comissão é um dado.`
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

Its main virtue, though, is not mathematical but **behavioural**: it converts a hard, repeated decision — is this a good moment? — into an automatic transfer that requires no decision at all. It removes the part of the process where most money is lost.

One honest caveat: if you already hold a large cash sum, history says investing it at once usually beats spreading it out, simply because markets rise more often than they fall. Spreading it out is worse on average and far better if the realistic alternative was never investing.`
    },
    pt: {
      name: 'Investimento periódico (DCA)',
      slug: 'investimento-periodico-dca',
      aliases: ['dollar cost averaging', 'DCA', 'custo médio', 'reforços periódicos'],
      short: 'Investir um valor fixo em intervalos regulares, em vez de tentar acertar no momento de entrada.',
      body: `O investimento periódico consiste em investir o mesmo valor todos os meses, aconteça o que acontecer. Quando o mercado desce, esse valor compra mais unidades; quando sobe, compra menos. O preço médio pago acaba por ser mais baixo do que a média dos preços.

A sua principal virtude, no entanto, não é matemática, mas **comportamental**: transforma uma decisão difícil e repetida — é boa altura? — numa transferência automática que não exige decisão nenhuma. Remove a parte do processo onde se perde mais dinheiro.

Uma ressalva honesta: se já tens um montante grande em dinheiro, a história diz que investi-lo de uma vez costuma bater o faseamento, simplesmente porque os mercados sobem mais vezes do que descem. Fasear é pior em média e muito melhor se a alternativa realista era nunca investir.`
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

A diversificação não aumenta a rentabilidade esperada. O que faz é reduzir a probabilidade de um resultado catastrófico, e isso importa porque uma perda de 100 % numa posição não se recupera com um ganho de 100 % noutra. É um seguro contra estar errado, e todos estamos alguma vez.

O caso extremo é o risco de concentração que quase ninguém conta: se o teu salário, as tuas ações e o teu plano de pensões dependem da mesma empresa, tens uma carteira de um só ativo com três nomes diferentes.`
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
      short: 'How a portfolio is divided between asset types — equities, bonds, cash — and the decision that explains most of its behaviour.',
      body: `Asset allocation is the answer to "what percentage in stocks and what percentage in bonds?". Classic studies attribute most of the variability in a portfolio's results over time to that decision: far more than the choice of individual holdings.

An 80/20 portfolio and a 40/60 portfolio are not more and less ambitious versions of the same thing. They are two different experiences: the first can fall 35% in a bad year, the second around 18%. Both figures are normal, and the relevant question is not which returns more but which you can hold without selling.

That is why the right percentage depends more on your **horizon** and your actual tolerance — not your stated one — than on any market forecast.`
    },
    pt: {
      name: 'Alocação de ativos',
      slug: 'alocacao-de-ativos',
      aliases: ['asset allocation', 'distribuição de ativos', 'composição da carteira'],
      short: 'Como se reparte uma carteira entre tipos de ativo — ações, obrigações, liquidez — e a decisão que mais explica o seu comportamento.',
      body: `A alocação de ativos é a resposta a "que percentagem em ações e que percentagem em obrigações?". Os estudos clássicos atribuem a essa decisão a maior parte da variabilidade dos resultados de uma carteira ao longo do tempo: muito mais do que a escolha de títulos concretos.

Uma carteira 80/20 e uma 40/60 não são versões mais ou menos ambiciosas da mesma coisa. São duas experiências diferentes: a primeira pode cair 35 % num ano mau, a segunda cerca de 18 %. Ambos os números são normais, e a pergunta relevante não é qual rende mais, mas qual consegues manter sem vender.

É por isso que a percentagem correta depende mais do teu **horizonte** e da tua tolerância real — não a declarada — do que de qualquer previsão de mercado.`
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

It is also the most psychologically uncomfortable operation in investing, because it forces you to sell what is working and buy what is not. That is why it works better as a mechanical rule — once a year, or whenever a position drifts more than five points — than as a discretionary call.`
    },
    pt: {
      name: 'Rebalanceamento',
      slug: 'rebalanceamento',
      aliases: ['rebalancear', 'reequilíbrio da carteira', 'rebalanceamento de carteira'],
      short: 'Devolver a carteira aos seus pesos-alvo vendendo o que subiu e comprando o que desceu.',
      body: `Com o tempo, uma carteira 70/30 deixa de o ser: se as ações sobem muito, transforma-se num 80/20 sem que tenhas decidido nada. Rebalancear é vender a parte que se excedeu e comprar a que ficou curta, até voltar aos pesos que escolheste.

A sua função principal é **controlo de risco**, não rentabilidade: evita que a carteira se torne mais agressiva logo depois de uma boa fase, que é quando isso mais parece boa ideia e menos o é.

É também a operação psicologicamente mais desconfortável do investimento, porque obriga a vender o que está a correr bem e comprar o que está a correr mal. Por isso funciona melhor como regra mecânica — uma vez por ano, ou quando uma posição se desvia mais de cinco pontos — do que como decisão discricionária.`
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

Conviene separarla del **riesgo**. El riesgo, para alguien que ahorra a treinta años, es no alcanzar su objetivo; la volatilidad es sólo el precio de admisión que cobran los activos que históricamente lo hacen posible. Un depósito no tiene volatilidad y sí tiene un riesgo enorme para ese objetivo: la certeza de perder poder de compra frente a la inflación.

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
      body: `A volatilidade mede quanto um preço se move em torno da sua média. Um fundo com volatilidade anual de 18 % terá anos de +25 % e anos de −15 % sem que nada de extraordinário tenha acontecido.

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
      body: `Se uma carteira chega a 100.000 e desce para 62.000 antes de voltar a subir, a sua queda máxima foi de 38 %. É o número que descreve o que um investidor **viveu**, e por isso é mais útil do que a volatilidade para decidir quanto risco se tolera.

As ações globais tiveram quedas superiores a 40 % várias vezes no último século, e praticamente todas recuperaram. Mas recuperaram para quem se manteve investido.

Um exercício honesto antes de escolher uma carteira: pega no teu património atual, subtrai 40 % e olha para o número resultante. Se continuas a chamar-lhe "uma fase má", a tua alocação é suportável. Se lhe chamas "uma emergência", é demasiado agressiva, diga o que disser qualquer questionário.`
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
      name: 'Regra dos 4 %',
      slug: 'regra-dos-4-por-cento',
      aliases: ['regra dos 4%', 'regra dos quatro por cento', 'estudo Trinity'],
      short: 'A regra aproximada segundo a qual podes retirar 4 % da tua carteira no primeiro ano, ajustar esse valor pela inflação e esperar que dure trinta anos.',
      body: `Vem do *estudo Trinity* de 1998, que testou carteiras de ações e obrigações contra a história dos mercados dos EUA e concluiu que uma retirada inicial de 4 %, ajustada anualmente pela inflação, sobreviveu trinta anos na grande maioria dos períodos analisados.

A sua utilidade real é como **regra de dimensionamento**: invertida, diz que precisas de cerca de 25 vezes a tua despesa anual. É o número que transforma "quero ser independente" numa cifra concreta, e é por isso que a regra ficou famosa.

Os seus limites são igualmente importantes: pressupõe trinta anos (não cinquenta), mercados americanos do século XX, uma despesa que nunca se ajusta em baixa e zero comissões. Com custos de 1 %, horizontes mais longos ou avaliações iniciais altas, a percentagem segura é menor. Não é uma lei física: é um ponto de partida para fazeres as tuas próprias contas.`
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
      short: 'A percentagem de uma carteira que se pode gastar por ano com uma probabilidade alta de o dinheiro não acabar antes de ti.',
      body: `A taxa segura de retirada responde à pergunta inversa da acumulação: já não "quanto preciso", mas "quanto posso retirar sem ficar sem nada". Expressa-se como percentagem do valor inicial da carteira, não do valor de cada ano.

Depende de quatro coisas: o **horizonte** (trinta anos admite mais do que cinquenta), a **alocação de ativos** (demasiadas obrigações reduzem a taxa tanto como demasiada volatilidade), os **custos** (cada ponto de comissão sai diretamente daqui) e a **flexibilidade** (poder cortar a despesa 10 % num ano mau muda a aritmética por completo).

Uma taxa "segura" não é uma garantia, mas uma probabilidade. Qualquer número que vejas vem acompanhado de uma taxa de sucesso implícita, e vale a pena perguntar qual é antes de construir uma vida sobre ele.`
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
      body: `FIRE son las siglas de *Financial Independence, Retire Early*. La parte más útil del concepto es la primera: la independencia financiera es un estado —tus activos cubren tus gastos— y la jubilación anticipada es sólo una de las cosas que puedes hacer con ella.

La aritmética es sorprendentemente simple y bastante brutal: lo que determina el tiempo hasta la independencia no es tu sueldo, sino tu **tasa de ahorro**. Alguien que ahorra el 10 % necesita décadas; alguien que ahorra el 50 % necesita algo más de quince años, porque cada euro ahorrado sube el numerador y baja el denominador a la vez.

El error más frecuente del movimiento no es matemático sino de propósito: optimizar durante quince años para llegar a un destino sin haber decidido qué se hace allí. La independencia financiera compra opciones, no significado.`
    },
    en: {
      name: 'FIRE (financial independence)',
      slug: 'fire-financial-independence',
      aliases: ['financial independence', 'financial independence retire early', 'FIRE movement', 'retire early'],
      short: 'The point at which your assets generate enough to cover your expenses, so that working becomes a choice rather than an obligation.',
      body: `FIRE stands for *Financial Independence, Retire Early*. The more useful half of the concept is the first: financial independence is a state — your assets cover your costs — and early retirement is only one of the things you can do with it.

The arithmetic is surprisingly simple and fairly brutal: what determines time to independence is not your salary but your **savings rate**. Someone saving 10% needs decades; someone saving 50% needs a little over fifteen years, because every unit saved raises the numerator and lowers the denominator at once.

The movement's most common mistake is not mathematical but about purpose: optimising for fifteen years to reach a destination without having decided what happens there. Financial independence buys options, not meaning.`
    },
    pt: {
      name: 'FIRE (independência financeira)',
      slug: 'fire-independencia-financeira',
      aliases: ['independência financeira', 'financial independence retire early', 'movimento FIRE', 'liberdade financeira'],
      short: 'O ponto em que os teus ativos geram o suficiente para cobrir as tuas despesas, tornando o trabalho numa escolha e não numa obrigação.',
      body: `FIRE são as iniciais de *Financial Independence, Retire Early*. A parte mais útil do conceito é a primeira: a independência financeira é um estado — os teus ativos cobrem os teus custos — e a reforma antecipada é apenas uma das coisas que podes fazer com ela.

A aritmética é surpreendentemente simples e bastante brutal: o que determina o tempo até à independência não é o teu salário, mas a tua **taxa de poupança**. Quem poupa 10 % precisa de décadas; quem poupa 50 % precisa de pouco mais de quinze anos, porque cada euro poupado sobe o numerador e baixa o denominador ao mesmo tempo.

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

The usual defences are holding two or three years of spending in stable assets, accepting spending cuts in bad years, and not starting withdrawals with the most aggressive portfolio of your life.`
    },
    pt: {
      name: 'Risco de sequência de rentabilidades',
      slug: 'risco-de-sequencia-de-rentabilidades',
      aliases: ['sequence of returns risk', 'risco de sequência', 'ordem das rentabilidades'],
      short: 'O risco de as más rentabilidades chegarem no início da fase de retiradas, quando ainda há muito capital a perder.',
      body: `Dois reformados com a **mesma rentabilidade média** ao longo de trinta anos podem acabar em situações opostas se a ordem desses anos foi diferente. Quem sofre uma queda de 30 % no ano dois, enquanto retira dinheiro, vende unidades a preços baixos e reduz permanentemente o capital que pode recuperar. Quem a sofre no ano vinte e cinco quase não nota.

É por isso que a fase de retiradas não é simplesmente a acumulação ao contrário. Na acumulação, uma queda precoce é uma oportunidade: compras mais barato. Nas retiradas, é um dano irreversível.

As defesas habituais são ter dois ou três anos de despesa em ativos estáveis, aceitar cortar a despesa nos anos maus, e não começar a retirar precisamente com a carteira mais agressiva da tua vida.`
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

Su límite obvio: la simulación sólo sabe lo que le has dicho. Si las rentabilidades y volatilidades que introduces son optimistas, obtendrás mil futuros optimistas. Es una herramienta para explorar la sensibilidad de un plan, no un oráculo.`
    },
    en: {
      name: 'Monte Carlo simulation',
      slug: 'monte-carlo-simulation',
      aliases: ['Monte Carlo', 'Monte Carlo simulations', 'Monte Carlo method'],
      short: 'A method that projects thousands of possible futures with randomised returns, to estimate the probability of an outcome rather than a single figure.',
      body: `A spreadsheet with a fixed 7% produces one number, and that number is almost certainly wrong: no market delivers 7% every year. A Monte Carlo simulation draws thousands of plausible return sequences and counts how many of them end well.

The output is not "you will have $480,000" but something far more useful: "in 85% of scenarios the money lasted thirty years; in 15% it ran out early". That turns a forecast into a **probability**, which is the right way to think about a financial future.

Its obvious limit: the simulation only knows what you told it. If the returns and volatilities you feed in are optimistic, you get a thousand optimistic futures. It is a tool for exploring how sensitive a plan is, not an oracle.`
    },
    pt: {
      name: 'Simulação de Monte Carlo',
      slug: 'simulacao-de-monte-carlo',
      aliases: ['Monte Carlo', 'simulações de Monte Carlo', 'método de Monte Carlo'],
      short: 'Um método que projeta milhares de futuros possíveis com rentabilidades aleatórias, para estimar a probabilidade de um resultado em vez de um único número.',
      body: `Uma folha de cálculo com 7 % fixos produz um único número, e esse número é quase certamente falso: nenhum mercado entrega 7 % todos os anos. Uma simulação de Monte Carlo sorteia milhares de sequências de rentabilidades plausíveis e vê quantas delas terminam bem.

O resultado não é "vais ter 480.000", mas algo muito mais útil: "em 85 % dos cenários o dinheiro durou trinta anos; em 15 % acabou antes". Isso transforma uma previsão numa **probabilidade**, que é a forma correta de pensar sobre o futuro financeiro.

O seu limite óbvio: a simulação só sabe aquilo que lhe disseste. Se as rentabilidades e volatilidades que introduzes são otimistas, obténs mil futuros otimistas. É uma ferramenta para explorar a sensibilidade de um plano, não um oráculo.`
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
      short: 'Dinheiro líquido e aborrecido reservado para imprevistos, cuja função não é crescer mas evitar que tenhas de vender investimentos ou endividar-te.',
      body: `O fundo de emergência é a única parte das tuas finanças em que a rentabilidade é irrelevante. A sua função é **disponibilidade**: estar intacto, acessível em 24 horas e não depender do estado do mercado no dia em que a caldeira avaria ou um contrato termina.

A referência habitual é de três a seis meses de despesas, mas o que realmente a determina é a estabilidade dos teus rendimentos. Quem tem dois salários estáveis em casa pode viver com três meses; um trabalhador independente com um cliente principal deveria pensar em nove ou doze.

O seu maior benefício não aparece em nenhuma folha de cálculo: é o que permite que o resto da carteira se comporte como uma carteira de longo prazo. Sem almofada, uma avaria de 2.000 transforma-se numa venda forçada ou numa dívida a 20 %, e é aí que se perde dinheiro a sério.`
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
      short: 'Everything you own minus everything you owe: the one figure that summarises your financial position in a single number.',
      body: `Net worth = assets − liabilities. Add up accounts, investments, pensions and the market value of your home; subtract mortgage, loans and card balances. The result can be negative, and for many young people with a recent mortgage it is.

It is the metric that corrects the illusion of salary. Two people on the same income can have opposite net worths, because salary measures the flow coming in and net worth measures what stayed.

The way to use it well is as a **time series**, not a snapshot: record it once a quarter, always on the same basis, and watch the slope. The absolute value depends on your age, your country and your luck. The slope depends on your decisions.`
    },
    pt: {
      name: 'Património líquido',
      slug: 'patrimonio-liquido',
      aliases: ['património', 'net worth', 'balanço pessoal'],
      short: 'Tudo o que possuis menos tudo o que deves: o único número que resume a tua situação financeira.',
      body: `Património líquido = ativos − passivos. Soma contas, investimentos, planos de poupança e o valor de mercado da casa; subtrai crédito habitação, empréstimos e saldos de cartão. O resultado pode ser negativo, e para muita gente jovem com crédito recente é.

É a métrica que corrige a ilusão do salário. Duas pessoas com o mesmo rendimento podem ter patrimónios opostos, porque o salário mede o caudal que entra e o património mede o que ficou.

A forma de o usar bem é como **série temporal**, não como fotografia: registá-lo uma vez por trimestre, sempre com o mesmo critério, e olhar para a inclinação. O valor absoluto depende da tua idade, do teu país e da tua sorte. A inclinação depende das tuas decisões.`
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
      aliases: ['rácio de poupança', 'savings rate', 'percentagem poupada'],
      short: 'A proporção dos teus rendimentos que não gastas, e a variável que mais determina quanto tempo levarás a ser financeiramente independente.',
      body: `Taxa de poupança = (rendimentos − despesas) / rendimentos. Se ganhas 2.500 e gastas 2.000, poupas 20 %.

É mais poderosa do que a rentabilidade porque atua pelos dois lados ao mesmo tempo: aumentá-la eleva o que acumulas **e** reduz o património de que precisas, porque o objetivo calcula-se a partir da tua despesa. Passar de 15 % para 30 % não divide o prazo por dois; corta-o mais.

É também mais controlável. Não podes decidir a rentabilidade dos mercados no próximo ano, mas podes decidir o custo da tua habitação, do teu carro e das tuas subscrições. A rentabilidade é uma esperança; a taxa de poupança é uma decisão.`
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
      short: 'O dinheiro que entra e sai cada mês, e a diferença entre os dois: o mecanismo real que faz crescer ou encolher o teu património.',
      body: `O fluxo de caixa é o filme de que o património líquido é a fotografia. Entradas: salários, faturas recebidas, dividendos. Saídas: fixas (habitação, seguros, empréstimos), variáveis (comida, lazer) e as anuais que quase ninguém reparte (IRS, seguros, revisões do carro).

O erro clássico não é gastar demasiado, mas esquecer as despesas irregulares. Um orçamento mensal que ignora os 1.800 que chegam uma vez por ano está desequilibrado em 150 por mês e não o sabe.

Registar o fluxo real durante três meses é o exercício com maior retorno de todas as finanças pessoais: quase sempre revela uma ou duas categorias de despesa significativas que ninguém teria adivinhado.`
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

It runs in both directions, and this half gets told less often. Deferring every expense has an opportunity cost too: the years in which you can travel with small children or look after your parents cannot be reinvested. A whole life of optimised decisions is an enormous opportunity cost, paid in the one currency you cannot get back.

Its practical value is not to make you spend less but to make the trade visible. A $300 purchase chosen in full knowledge that it costs $1,160 of future money is a good decision, if you made it with that information in front of you.`
    },
    pt: {
      name: 'Custo de oportunidade',
      slug: 'custo-de-oportunidade',
      aliases: ['custos de oportunidade', 'opportunity cost'],
      short: 'O valor da melhor alternativa que abandonas ao escolher uma opção: o que cada decisão custa além do seu preço.',
      body: `Quando gastas 300 em algo, o preço é 300, mas o custo é 300 **mais** aquilo em que esse dinheiro se teria tornado. A 7 % durante vinte anos, são cerca de 1.160. Esse é o custo de oportunidade, e é invisível porque nunca aparece num extrato.

Funciona nos dois sentidos, e esta metade conta-se menos. Adiar cada despesa também tem custo de oportunidade: os anos em que podes viajar com os teus filhos pequenos ou cuidar dos teus pais não se podem reinvestir. Uma vida inteira de decisões otimizadas é um custo de oportunidade enorme, pago na única moeda irrecuperável.

O seu valor prático não é fazer-te gastar menos, mas tornar a troca visível. Uma compra de 300 escolhida sabendo que custa 1.160 futuros é uma boa decisão, se a fizeres com essa informação à frente.`
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

Its consequences in investing are almost all expensive. It explains why good investments get sold in downturns — the one action that turns a temporary loss into a permanent one — why losing positions are held for years waiting to "get back to even", and why many people with a forty-year horizon hold a portfolio that is far too conservative.

The defence is not to feel it less, because you cannot. It is to design the system so the emotion has no buttons to press: automatic contributions, infrequent reviews, and a rebalancing rule written down before the fall arrives.`
    },
    pt: {
      name: 'Aversão à perda',
      slug: 'aversao-a-perda',
      aliases: ['loss aversion', 'aversão às perdas'],
      short: 'A tendência para sentir uma perda com uma intensidade cerca de duas vezes maior do que um ganho do mesmo tamanho.',
      body: `Kahneman e Tversky mediram-no: perder 100 dói cerca do dobro do que agrada ganhar 100. Não é fraqueza de carácter, é como o cérebro humano avalia resultados por defeito.

As suas consequências no investimento são quase todas caras. Explica por que se vendem os bons investimentos nas quedas — a única ação que transforma uma perda temporária em definitiva —, por que se mantêm durante anos posições perdedoras à espera de "voltar ao zero", e por que muita gente com quarenta anos de horizonte mantém uma carteira demasiado conservadora.

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

Ahí está el doble coste. No sólo no ahorraste el aumento: has subido el patrimonio que necesitarás para ser independiente, porque ese objetivo se calcula sobre tu gasto anual. Cada 100 € de gasto mensual permanente añaden unos 30.000 € al número.

El antídoto no es austeridad, es **asignación anticipada**: decidir el reparto de la próxima subida antes de recibirla —por ejemplo, la mitad al ahorro automático y la mitad a vivir mejor—. Elegido de antemano, es una decisión. Elegido después, ya lo eligió la costumbre.`
    },
    en: {
      name: 'Lifestyle creep',
      slug: 'lifestyle-creep',
      aliases: ['lifestyle inflation', 'lifestyle drift'],
      short: 'The process by which spending rises automatically with every pay increase, leaving the savings rate exactly where it was.',
      body: `After a 20% pay rise, spending almost always rises 20%. The car improves, the flat improves, the holidays improve, and two years later the sense of comfort is precisely what it was before — with one important difference: the standard of living now requires more money to sustain.

That is the double cost. Not only did you not save the raise: you have raised the wealth you will need to be independent, because that target is calculated from your annual spending. Every $100 of permanent monthly spending adds roughly $30,000 to the number.

The antidote is not austerity but **pre-allocation**: deciding how the next raise gets split before it arrives — half to automatic saving and half to living better, say. Chosen in advance, it is a decision. Chosen afterwards, habit already decided it.`
    },
    pt: {
      name: 'Inflação do estilo de vida',
      slug: 'inflacao-do-estilo-de-vida',
      aliases: ['lifestyle creep', 'lifestyle inflation'],
      short: 'O processo pelo qual a despesa sobe automaticamente com cada aumento de rendimento, deixando a taxa de poupança exatamente onde estava.',
      body: `Depois de um aumento de 20 %, a despesa sobe quase sempre 20 %. O carro melhora, a casa melhora, as férias melhoram, e dois anos depois a sensação de folga é exatamente a de antes, com uma diferença importante: agora o nível de vida exige mais dinheiro para se sustentar.

Está aí o duplo custo. Não só não poupaste o aumento: subiste o património de que vais precisar para ser independente, porque esse objetivo calcula-se a partir da tua despesa anual. Cada 100 de despesa mensal permanente acrescentam cerca de 30.000 ao número.

O antídoto não é austeridade, é **alocação antecipada**: decidir a distribuição do próximo aumento antes de o receber — por exemplo, metade para poupança automática e metade para viver melhor. Escolhido de antemão, é uma decisão. Escolhido depois, já foi o hábito a escolher.`
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

Not all of it is bias, though. Labelling money is also a tool: an emergency fund works **because** it is mentally sealed. The useful distinction is whether the label protects you from an impulse or hides an arithmetic comparison from you.`
    },
    pt: {
      name: 'Contabilidade mental',
      slug: 'contabilidade-mental',
      aliases: ['mental accounting', 'contas mentais'],
      short: 'A tendência para tratar o dinheiro de forma diferente segundo a sua origem ou o rótulo que lhe demos, ainda que seja perfeitamente intercambiável.',
      body: `Richard Thaler descreveu o fenómeno: mantemos "contas" separadas na cabeça e aplicamos regras diferentes a cada uma. Um prémio de 1.000 gasta-se com alegria; 1.000 do salário administram-se com cuidado. É o mesmo dinheiro.

A versão mais cara é guardar 8.000 numa conta poupança a 0,5 % enquanto se mantém uma dívida de cartão de 4.000 a 19 %. Contabilisticamente é um erro grave; mentalmente são duas contas diferentes, e a de "poupança" parece intocável.

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
      short: 'A tendência para dar demasiado peso ao que aconteceu há pouco tempo e projetá-lo para o futuro como se fosse a norma.',
      body: `Depois de três anos bons, 12 % ao ano parece razoável. Depois de um ano mau, as ações parecem um erro estrutural. Os dados de fundo não mudaram em nenhum dos casos: o que mudou é o que temos mais fresco na memória.

É o que faz o dinheiro entrar nos fundos logo depois das melhores fases e sair logo depois das piores, e explica boa parte da diferença entre a rentabilidade de um fundo e a rentabilidade que os seus participantes obtêm.

O corretivo é aborrecido e funciona: olhar para séries longas em vez dos últimos doze meses, e escrever os teus pressupostos de rentabilidade **uma vez** em vez de os revisares por causa do que o mercado fez no trimestre passado.`
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

Es la pieza que convierte un presupuesto en una decisión sobre la vida y no sólo sobre el dinero. La pregunta útil ante un gasto grande no es "¿puedo permitírmelo?", sino "¿esto seguirá importándome en dos años?".`
    },
    en: {
      name: 'Hedonic adaptation',
      slug: 'hedonic-adaptation',
      aliases: ['hedonic treadmill', 'hedonic adjustment'],
      short: 'The human tendency to return to a habitual level of satisfaction shortly after a material improvement.',
      body: `The new car is exciting for six weeks. The bigger flat, a few months. After that, satisfaction returns roughly to where it was, and the improvement simply becomes the new floor against which everything next is compared.

This does not mean spending is pointless: it means **some spending adapts and some does not**. The research is fairly consistent that purchases which become invisible routine (square metres, objects, product tier) adapt quickly, while those buying time, health, relationships or experiences with a story adapt far more slowly.

This is the piece that turns a budget into a decision about a life rather than only about money. The useful question before a large purchase is not "can I afford it?" but "will this still matter to me in two years?".`
    },
    pt: {
      name: 'Adaptação hedónica',
      slug: 'adaptacao-hedonica',
      aliases: ['hedonic adaptation', 'roda hedónica', 'hedonic treadmill'],
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

Applied to money, it is the engine behind almost every decision later regretted: buying on instalments, deferring the first contribution, "I'll start investing next year". And it is especially expensive with compound interest, because the year postponed is the one that would have worked hardest.

Since willpower does not fix it, **architecture** does: automate the transfer on payday, raise the percentage when a raise arrives, and put friction where the impulse is. A decision made once beats a decision made every month.`
    },
    pt: {
      name: 'Viés do presente',
      slug: 'vies-do-presente',
      aliases: ['present bias', 'desconto temporal', 'gratificação imediata'],
      short: 'A tendência para sobrevalorizar uma recompensa imediata face a uma maior mas futura, mesmo quando a segunda é claramente melhor.',
      body: `Quase todos preferem 100 hoje a 110 dentro de um mês, e ao mesmo tempo preferem 110 dentro de treze meses a 100 dentro de doze. A preferência inverte-se com a distância, o que significa que não é uma preferência coerente: é um desconto desproporcionado aplicado ao futuro.

Aplicado ao dinheiro, é o motor de quase todas as decisões que depois se lamentam: a compra a prestações, o adiamento do primeiro reforço, o "começo a investir no próximo ano". E é especialmente caro com juros compostos, porque o ano adiado é o que mais teria trabalhado.

Como não se corrige com força de vontade, corrige-se com **arquitetura**: automatizar a transferência no dia do salário, subir a percentagem quando chega um aumento e colocar atrito onde está o impulso. Uma decisão tomada uma vez vence uma decisão tomada todos os meses.`
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
      name: 'Paga-te a ti primeiro',
      slug: 'paga-te-a-ti-primeiro',
      aliases: ['pay yourself first', 'poupança automática'],
      short: 'Tratar a poupança como a primeira fatura do mês em vez do que sobra no fim, normalmente através de uma transferência automática.',
      body: `O orçamento habitual funciona assim: recebes, gastas, e poupas o que sobra. Como o que sobra é uma variável residual, quase sempre sobra pouco. Pagares-te a ti primeiro inverte a ordem: a transferência para a poupança sai no próprio dia do salário, e vives com o resto.

Funciona por duas razões e nenhuma é aritmética. A primeira é que elimina a decisão repetida, que é onde o viés do presente faz o seu trabalho. A segunda é que a despesa se ajusta ao dinheiro disponível quase por si só, um fenómeno bastante robusto: a maioria de quem automatiza 10 % não sente a falta ao fim de três meses.

A versão avançada é escaloná-la: subir a percentagem automática de cada vez que os rendimentos sobem, antes de o hábito reclamar o aumento.`
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
      short: 'Income that does not require your continuous active work — dividends, interest, rent — and almost always requires capital or prior work instead.',
      body: `The phrase gets used with a looseness worth unpicking. Honest passive income is basically two things: what **capital** produces (dividends, interest, coupons, net rent) and what a **previously built asset** produces (a book, a product, a licence), which is also rarely as passive as advertised.

The arithmetic is unforgiving in the first case: $1,000 a month of passive income at a 4% withdrawal rate requires roughly $300,000 of capital. There is no shortcut, and any offer promising that income on far less is promising a risk it is not mentioning.

The useful framing is not "I want passive income" but "I want my assets to cover a growing share of my fixed costs". Same idea, measurable, and it does not depend on anyone selling you a method.`
    },
    pt: {
      name: 'Rendimento passivo',
      slug: 'rendimento-passivo',
      aliases: ['rendimentos passivos', 'passive income', 'renda passiva'],
      short: 'Rendimento que não exige o teu trabalho ativo contínuo — dividendos, juros, rendas — e que quase sempre exige capital ou trabalho anterior.',
      body: `A expressão usa-se com uma leveza que convém desfazer. O rendimento passivo honesto é basicamente duas coisas: o que o **capital** produz (dividendos, juros, cupões, rendas líquidas) e o que produz um **ativo construído antes** (um livro, um produto, uma licença), que além disso raramente é tão passivo como se anuncia.

A aritmética é implacável no primeiro caso: um rendimento passivo de 1.000 por mês com uma taxa de retirada de 4 % exige cerca de 300.000 de capital. Não há atalho, e qualquer oferta que prometa essa renda com muito menos está a prometer um risco que não menciona.

A formulação útil não é "quero rendimento passivo", mas "quero que os meus ativos cubram uma parte crescente das minhas despesas fixas". É a mesma ideia, mensurável, e não depende de alguém te vender um método.`
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

Con esa cifra, un móvil de 900 € deja de costar 900 € y empieza a costar, por ejemplo, setenta y cinco horas. Casi dos semanas de trabajo. Ninguna de las dos cifras es más verdadera que la otra, pero sólo una está en la unidad en la que se paga de verdad.

No es una técnica para gastar menos, sino para gastar **con la información completa**. Muchas compras siguen valiendo la pena expresadas en horas; algunas dejan de tener sentido inmediatamente, y eso es exactamente lo que se quería averiguar.`
    },
    en: {
      name: 'Life cost (cost in hours)',
      slug: 'life-cost-in-hours',
      aliases: ['cost in hours', 'life energy cost', 'cost in life hours'],
      short: 'The price of a purchase expressed in the hours of work needed to pay for it, rather than in money.',
      body: `The idea comes from *Your Money or Your Life*, by Vicki Robin and Joe Dominguez: money is life energy exchanged for hours. Divide your take-home pay by the hours you genuinely give to work — including commuting, training and the time it takes to switch off — and you get your real hourly rate.

With that figure, a $900 phone stops costing $900 and starts costing, say, seventy-five hours. Almost two weeks of work. Neither number is truer than the other, but only one is in the unit you actually pay in.

It is not a technique for spending less but for spending **with the full information**. Plenty of purchases still make sense expressed in hours; some stop making sense immediately, and that is precisely what the exercise was for.`
    },
    pt: {
      name: 'Custo em horas de vida',
      slug: 'custo-em-horas-de-vida',
      aliases: ['custo em vida', 'preço em horas de vida', 'custo em tempo'],
      short: 'O preço de uma compra expresso nas horas de trabalho necessárias para a pagar, em vez de em dinheiro.',
      body: `A ideia aparece em *Your Money or Your Life*, de Vicki Robin e Joe Dominguez: o dinheiro é energia vital trocada por horas. Divide o teu salário líquido pelas horas que realmente dedicas ao trabalho — incluindo deslocações, formação e o tempo que levas a desligar — e obténs a tua tarifa real por hora.

Com esse número, um telemóvel de 900 deixa de custar 900 e começa a custar, por exemplo, setenta e cinco horas. Quase duas semanas de trabalho. Nenhum dos dois números é mais verdadeiro do que o outro, mas só um está na unidade em que se paga de facto.

Não é uma técnica para gastar menos, mas para gastar **com a informação completa**. Muitas compras continuam a valer a pena expressas em horas; algumas deixam de fazer sentido imediatamente, e era exatamente isso que se queria descobrir.`
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
      aliases: ['revolving debt', 'credit card interest', 'debt compounding', 'capitalised interest'],
      short: 'The same mechanism that grows an investment, running against you when unpaid interest is added to the principal.',
      body: `A revolving card at 20% APR is not "a bit worse" than a 6% loan. It is a compound interest machine pointed the other way: the interest you do not pay is added to the balance and generates more interest, exactly as in a portfolio, but against you.

Hence the practical hierarchy that almost no calculation contradicts: clearing a 20% debt is a guaranteed 20% return, free of tax and free of volatility. No investment offers that. Above roughly 8–10% interest, paying down debt beats investing in nearly any reasonable scenario.

The minimum payment is where the mechanism hides: it is calculated to cover little more than the interest, so that the debt lasts a long time. Paying the minimum is not going slowly, it is not moving.`
    },
    pt: {
      name: 'Juros compostos da dívida',
      slug: 'juros-compostos-da-divida',
      aliases: ['dívida revolving', 'juros do cartão', 'capitalização de juros'],
      short: 'O mesmo mecanismo que faz crescer um investimento, a funcionar contra ti quando os juros não pagos se somam ao capital.',
      body: `Um cartão revolving a 20 % TAEG não é "um pouco pior" do que um empréstimo a 6 %. É uma máquina de juros compostos apontada para o outro lado: os juros que não pagas juntam-se ao capital e geram mais juros, exatamente como numa carteira, mas contra ti.

Daí a hierarquia prática que quase nenhum cálculo desmente: liquidar uma dívida a 20 % é uma rentabilidade garantida de 20 %, isenta de imposto e de volatilidade. Nenhum investimento oferece isso. Acima de cerca de 8-10 % de juro, amortizar dívida ganha a investir em quase qualquer cenário razoável.

O pagamento mínimo é onde o mecanismo se esconde: está calculado para cobrir pouco mais do que os juros, de modo a que a dívida dure muito tempo. Pagar o mínimo não é ir devagar, é não avançar.`
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
      body: `The popular summary — "time in the market beats timing the market" — has a simple arithmetic backing: the best trading days are concentrated into very few sessions, and those sessions usually land **inside** the panics rather than after them. Anyone who steps out to "wait for things to calm down" frequently misses precisely the days that explain the decade's return.

This is not an argument for ignoring risk. It is an argument about which lever is realistic: nobody has demonstrated a sustained ability to know when to exit and re-enter, and being invested for twenty years has demonstrably worked across almost every historical window.

The practical consequence is boring, which is why it works: choose an allocation you can hold through a 40% fall, automate the contributions, and look at the portfolio far less often than you want to.`
    },
    pt: {
      name: 'Tempo no mercado',
      slug: 'tempo-no-mercado',
      aliases: ['time in the market', 'market timing', 'timing de mercado'],
      short: 'A ideia de que permanecer investido ao longo do tempo importa mais do que tentar acertar no momento de entrar e sair.',
      body: `O resumo popular — "time in the market beats timing the market" — tem um suporte aritmético simples: as melhores sessões de bolsa estão concentradas em muito poucos dias, e esses dias caem normalmente **dentro** dos períodos de pânico, não depois. Quem sai para "esperar que acalme" perde com frequência precisamente as sessões que explicam a rentabilidade da década.

Isto não é um argumento para ignorar o risco. É um argumento sobre qual alavanca é realista: ninguém demonstrou de forma sustentada saber quando sair e voltar, e está demonstrado que estar dentro durante vinte anos funcionou em quase todas as janelas históricas.

A consequência prática é aborrecida e por isso funciona: escolher uma alocação que consigas manter numa queda de 40 %, automatizar os reforços e olhar para a carteira muito menos do que te apetece.`
    }
  }
];
