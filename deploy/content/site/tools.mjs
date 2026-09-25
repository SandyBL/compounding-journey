/**
 * The four calculators, as data, in three languages.
 *
 * The first three already existed - inside content/home/index.html, as three
 * tabs of one widget on a 142 KB page. That is the worst possible place for
 * them: a search for "calculadora de interés compuesto" has to rank a home page
 * whose title is about something else, and a reader who arrives has to find the
 * right tab. Splitting them out gives each one a page whose URL, title, first
 * heading and structured data are all about that single calculation, which is
 * what a tool-shaped search intent actually matches.
 *
 * The tabs on the home page stay. They are a good showcase; they are just not a
 * good landing page, and the two jobs are different enough to be worth doing
 * twice.
 *
 * Shape of a tool:
 *   id       - stable key, also the name of the engine in assets/js/calculators.js.
 *   fields   - input structure, language-independent (type, bounds, default,
 *              and whether the value is money). Labels live per language, keyed
 *              by field id, so a translator never touches a `step` attribute.
 *   result   - which computed value is the headline and which are the rows
 *              underneath it. The engine returns an object with these keys.
 *   currency - whether the page offers the EUR/USD/BRL selector. The life-cost
 *              tool shows hours as its headline, but its hourly rate is money,
 *              so all three want it.
 *   <lang>   - name, slug, title, description, intro, labels, notes and FAQ.
 *              `title` is the <title> and is allowed to be longer and more
 *              search-shaped than `name`, which is the H1 and the breadcrumb.
 *              `faq` becomes both the visible accordion and the FAQPage schema,
 *              from the same source, so the two can never disagree - which is
 *              the thing Google penalises.
 *              `error` is optional and only exists where a combination of
 *              inputs has no answer rather than a wrong one - dividing by zero
 *              hours worked. The page renders the message instead of a result,
 *              so nothing has to invent a "0 hours" that reads as a finding.
 *
 *   Optional, used by negative-compounding and available to any later tool:
 *   chart    - true to draw the engine's `series` as a two-line chart; the
 *              labels live per language under `chart`.
 *   field.type 'select' with per-language `options[fieldId]`, each option
 *              optionally carrying a `note` card (tone, badge, timing,
 *              mechanics, effect, tip) shown while it is selected.
 *   field.group, with per-language `groups` titles, to split the form into
 *              titled fieldsets.
 *   result.detail - a second, titled list of results (`detailTitle`).
 *   <lang>.presets - one-click example values, with a `presetsLabel`.
 *   <lang>.aliases - other names the article auto-linker should catch.
 */
export const TOOLS = [
  {
    id: 'compound-interest',
    currency: true,
    glossary: ['compound-interest', 'real-return', 'ter', 'dca'],
    fields: [
      { id: 'initial', type: 'number', min: 0, step: 100, value: 1000, money: true },
      { id: 'monthly', type: 'number', min: 0, step: 25, value: 200, money: true },
      { id: 'years', type: 'number', min: 1, max: 60, step: 1, value: 25 },
      { id: 'rate', type: 'number', min: 0, max: 20, step: 0.1, value: 7 }
    ],
    result: { primary: 'total', rows: ['invested', 'interest'] },
    es: {
      name: 'Calculadora de interés compuesto',
      slug: 'interes-compuesto',
      title: 'Calculadora de interés compuesto',
      description: 'Calcula cuánto crecerá tu dinero con aportaciones mensuales y una rentabilidad anual. Gratis, sin registro y con el cálculo en tu propio navegador.',
      intro: 'Introduce lo que tienes hoy, lo que puedes aportar cada mes y los años que le vas a dar. Al final verás dos cifras separadas: cuánto has puesto tú y cuánto ha puesto el tiempo.',
      labels: {
        initial: 'Capital inicial',
        monthly: 'Aportación mensual',
        years: 'Años de inversión',
        rate: 'Rentabilidad anual estimada (%)'
      },
      hints: {
        initial: 'Lo que ya tienes ahorrado para invertir. Puede ser cero.',
        monthly: 'La cantidad que puedes aportar todos los meses sin fallar.',
        years: 'El horizonte. Es la variable más poderosa de las cuatro.',
        rate: 'Una cartera global diversificada ha rondado el 7 % anual a largo plazo, antes de inflación y comisiones.'
      },
      results: {
        total: 'Valor final estimado',
        invested: 'Total aportado por ti',
        interest: 'Generado por el interés compuesto'
      },
      resultNote: 'Una estimación, no una previsión: los mercados no entregan la misma rentabilidad todos los años.',
      action: 'Calcular',
      howItWorks: `La calculadora capitaliza mes a mes. Cada mes multiplica el saldo por la rentabilidad mensual —la anual dividida entre doce— y después suma tu aportación:

\`\`\`
saldo = saldo × (1 + rentabilidad anual / 12) + aportación
\`\`\`

Repetido tantas veces como meses tenga tu horizonte. La cifra que aparece como "generado por el interés compuesto" es simplemente el valor final menos todo lo que has puesto tú, y es la parte que no habrías tenido dejando el dinero quieto.`,
      assumptions: `- La rentabilidad se aplica de forma **constante**. En la realidad hay años de +25 % y años de −18 %, y el orden en que llegan importa.
- Las cifras son **nominales**: no descuentan la inflación. Con una inflación del 2,5 %, 100.000 € a treinta años compran lo que hoy compran unos 48.000 €.
- No incluye **comisiones ni impuestos**. Restar el coste de tu fondo de la rentabilidad que introduces es la forma rápida de aproximarlo; la [calculadora de interés compuesto negativo](/es/calculadoras/interes-compuesto-negativo/) los calcula con detalle.
- Supone que **no retiras nada** durante todo el periodo. Una retirada intermedia rompe el efecto que se está midiendo.`,
      faq: [
        {
          q: '¿Qué rentabilidad anual debería poner?',
          a: 'Depende de en qué inviertas, y nadie puede saberlo de antemano. Como referencia histórica, una cartera global de renta variable ha rondado el 7-8 % anual nominal a muy largo plazo, y una cartera mixta con renta fija bastante menos. Lo más útil no es acertar la cifra, sino probar tres: una pesimista, una media y una optimista, y ver si tu plan sigue en pie con la pesimista.'
        },
        {
          q: '¿Por qué el resultado cambia tanto al añadir cinco años?',
          a: 'Porque el crecimiento no es lineal. Los últimos años son los que trabajan sobre el saldo más grande, así que aportan mucho más que los primeros. Es la razón por la que empezar antes vale más que aportar más: un año de retraso no te quita el primer año, te quita el último.'
        },
        {
          q: '¿Los resultados descuentan la inflación?',
          a: 'No. Son cifras nominales. Si quieres pensar en poder de compra de hoy, resta tu expectativa de inflación de la rentabilidad que introduces: un 7 % con una inflación del 2,5 % equivale aproximadamente a un 4,5 % real. El resultado entonces ya está en euros de hoy.'
        },
        {
          q: '¿Se guardan los datos que introduzco?',
          a: 'No. El cálculo entero ocurre en tu navegador con JavaScript; nada se envía a ningún servidor y nada se almacena. Puedes comprobarlo desactivando la red y usando la calculadora igualmente.'
        }
      ]
    },
    en: {
      name: 'Compound interest calculator',
      slug: 'compound-interest',
      title: 'Compound interest calculator',
      description: 'Work out how much your money will grow with monthly contributions and an annual return. Free, no sign-up, and the math runs in your own browser.',
      intro: 'Enter what you have today, what you can add each month, and how many years you are willing to give it. You get two figures back, kept separate: how much you put in, and how much time put in.',
      labels: {
        initial: 'Starting amount',
        monthly: 'Monthly contribution',
        years: 'Years invested',
        rate: 'Estimated annual return (%)'
      },
      hints: {
        initial: 'What you already have set aside to invest. Zero is fine.',
        monthly: 'The amount you can add every month without fail.',
        years: 'Your horizon. The most powerful of the four variables.',
        rate: 'A diversified global portfolio has run around 7% a year over the long term, before inflation and fees.'
      },
      results: {
        total: 'Estimated final value',
        invested: 'Total you contributed',
        interest: 'Generated by compounding'
      },
      resultNote: 'An estimate, not a forecast: markets do not deliver the same return every year.',
      action: 'Calculate',
      howItWorks: `The calculator compounds month by month. Each month it multiplies the balance by the monthly return (the annual figure divided by twelve) and then adds your contribution:

\`\`\`
balance = balance × (1 + annual return / 12) + contribution
\`\`\`

Repeated once for every month in your horizon. The figure shown as "generated by compounding" is simply the final value minus everything you put in, and it is the part you would not have had by leaving the money still.`,
      assumptions: `- The return is applied **constantly**. In reality there are +25% years and −18% years, and the order they arrive in matters.
- The figures are **nominal**: they do not subtract inflation. At 2.5% inflation, $100,000 in thirty years buys what about $48,000 buys today.
- It excludes **fees and tax**. Subtracting your fund's cost from the return you enter is the quick way to approximate them; the [negative compounding calculator](/en/calculators/negative-compounding/) works them out in full.
- It assumes you **withdraw nothing** over the whole period. A withdrawal partway through breaks the effect being measured.`,
      faq: [
        {
          q: 'What annual return should I use?',
          a: 'It depends what you invest in, and nobody can know it in advance. As a historical reference, a global equity portfolio has run around 7–8% nominal a year over very long periods, and a mixed portfolio with bonds considerably less. The useful move is not guessing the right figure but trying three of them, pessimistic, middling and optimistic, and checking whether your plan still stands up under the pessimistic one.'
        },
        {
          q: 'Why does the result change so much when I add five years?',
          a: 'Because growth is not linear. The last years work on the largest balance, so they contribute far more than the first ones. This is why starting earlier is worth more than contributing more: a year of delay does not remove your first year, it removes your last.'
        },
        {
          q: 'Do the results account for inflation?',
          a: 'No. They are nominal. To think in today’s purchasing power, subtract your inflation expectation from the return you enter: 7% with 2.5% inflation is roughly 4.5% real. The result is then already in today’s money.'
        },
        {
          q: 'Do you store what I enter?',
          a: 'No. The whole calculation runs in your browser in JavaScript; nothing is sent to a server and nothing is stored. You can verify it by turning off your network and using the calculator anyway.'
        }
      ]
    },
    pt: {
      name: 'Calculadora de juros compostos',
      slug: 'juros-compostos',
      title: 'Calculadora de juros compostos',
      description: 'Calcula quanto o seu dinheiro vai crescer com aportes mensais e uma rentabilidade anual. Grátis, sem cadastro e com o cálculo no seu próprio navegador.',
      intro: 'Informe o que você tem hoje, quanto consegue aportar por mês e quantos anos está disposto a dar ao dinheiro. No fim aparecem dois números separados: quanto você colocou e quanto o tempo colocou.',
      labels: {
        initial: 'Capital inicial',
        monthly: 'Aporte mensal',
        years: 'Anos de investimento',
        rate: 'Rentabilidade anual estimada (%)'
      },
      hints: {
        initial: 'O que você já tem poupado para investir. Pode ser zero.',
        monthly: 'O valor que você consegue aportar todos os meses sem falhar.',
        years: 'O horizonte. É a variável mais poderosa das quatro.',
        rate: 'Uma carteira global diversificada rondou os 7% ao ano no longo prazo, antes de inflação e comissões.'
      },
      results: {
        total: 'Valor final estimado',
        invested: 'Total aportado',
        interest: 'Gerado pelos juros compostos'
      },
      resultNote: 'Uma estimativa, não uma previsão: os mercados não entregam a mesma rentabilidade todos os anos.',
      action: 'Calcular',
      howItWorks: `A calculadora capitaliza mês a mês. Cada mês multiplica o saldo pela rentabilidade mensal (a anual dividida por doze) e depois soma o seu aporte:

\`\`\`
saldo = saldo × (1 + rentabilidade anual / 12) + aporte
\`\`\`

Repetido tantas vezes quantos meses tiver o seu horizonte. O número que aparece como "gerado pelos juros compostos" é simplesmente o valor final menos tudo o que você pôs, e é a parte que não existiria se o dinheiro tivesse ficado parado.`,
      assumptions: `- A rentabilidade é aplicada de forma **constante**. Na realidade há anos de +25% e anos de −18%, e a ordem em que chegam importa.
- Os valores são **nominais**: não descontam a inflação. Com inflação de 2,5%, 100.000 a trinta anos compram o que hoje compram cerca de 48.000.
- Não inclui **comissões nem impostos**. Subtrair o custo do seu fundo da rentabilidade que você informa é a forma rápida de aproximá-los; a [calculadora de juros compostos negativos](/pt/calculadoras/juros-compostos-negativos/) calcula os dois em detalhe.
- Pressupõe que **você não retira nada** durante todo o período. Uma retirada pelo meio quebra o efeito que está sendo medido.`,
      faq: [
        {
          q: 'Que rentabilidade anual devo usar?',
          a: 'Depende de onde você investe, e ninguém pode saber de antemão. Como referência histórica, uma carteira global de ações rondou os 7-8% nominais por ano em períodos muito longos, e uma carteira mista com títulos bastante menos. O mais útil não é acertar no número, mas testar três: um pessimista, um médio e um otimista, e ver se o seu plano continua de pé com o pessimista.'
        },
        {
          q: 'Por que o resultado muda tanto quando acrescento cinco anos?',
          a: 'Porque o crescimento não é linear. Os últimos anos trabalham sobre o saldo maior, então contribuem muito mais do que os primeiros. É por isso que começar mais cedo vale mais do que aportar mais: um ano de atraso não tira o seu primeiro ano, tira o último.'
        },
        {
          q: 'Os resultados descontam a inflação?',
          a: 'Não. São valores nominais. Para pensar em poder de compra de hoje, subtraia a sua expectativa de inflação da rentabilidade que informa: 7% com inflação de 2,5% equivale a cerca de 4,5% real. O resultado fica então já em reais de hoje.'
        },
        {
          q: 'Os dados que eu digito ficam guardados em algum lugar?',
          a: 'Não. Todo o cálculo acontece no seu navegador em JavaScript; nada é enviado para um servidor e nada é armazenado. Você pode confirmar isso desligando a rede e usando a calculadora do mesmo jeito.'
        }
      ]
    }
  },
{
    id: 'negative-compounding',
    currency: true,
    chart: true,
    glossary: ['compound-interest', 'ter', 'tax-deferral', 'opportunity-cost'],
    // The first four fields, their bounds and defaults are the compound
    // interest calculator's, so the "no friction" figure here is the figure a
    // reader just saw on that page. Only the defaults for the amounts are
    // larger, because a fee on 1,000 is too small to see.
    fields: [
      { id: 'initial', type: 'number', min: 0, step: 100, value: 10000, money: true, group: 'plan' },
      { id: 'monthly', type: 'number', min: 0, step: 25, value: 300, money: true, group: 'plan' },
      { id: 'years', type: 'number', min: 1, max: 60, step: 1, value: 30, group: 'plan' },
      { id: 'rate', type: 'number', min: 0, max: 20, step: 0.1, value: 7, group: 'plan' },
      { id: 'fee', type: 'number', min: 0, max: 5, step: 0.05, value: 1.5, group: 'friction' },
      // The options are per language because tax is per country: the Spanish
      // page offers Spanish regimes, the English page US ones and the
      // Portuguese page Brazilian ones - the readership each language actually
      // has. The ids are the keys of REGIMES in assets/js/calculators.js, where
      // the rates live.
      { id: 'regime', type: 'select', group: 'friction' }
    ],
    result: {
      primary: 'gap',
      rows: ['ideal', 'net', 'erosion'],
      detail: ['invested', 'fees', 'periodicTax', 'exitTax', 'lostGrowth', 'yearsLost']
    },
    es: {
      name: 'Calculadora de interés compuesto negativo',
      slug: 'interes-compuesto-negativo',
      title: 'Calculadora de interés compuesto negativo: comisiones e impuestos',
      description: 'Calcula cuánto patrimonio te quitan las comisiones y los impuestos a lo largo de los años, y cuánto crecimiento se pierde por el camino. Gratis, sin registro y en tu navegador.',
      aliases: ['interés compuesto negativo'],
      intro: 'El interés compuesto trabaja en las dos direcciones. Lo que ganas genera nuevas ganancias, y lo que pagas cada año en comisiones e impuestos deja de generarlas para siempre. Introduce tu plan, lo que cuesta tu producto y cómo tributa, y compara el resultado ideal con el que de verdad acaba en tu cuenta.',
      groups: {
        plan: 'Tu plan de inversión',
        friction: 'Costes y fiscalidad'
      },
      labels: {
        initial: 'Capital inicial',
        monthly: 'Aportación mensual',
        years: 'Años de inversión',
        rate: 'Rentabilidad anual bruta estimada (%)',
        fee: 'Comisión anual / TER (%)',
        regime: 'Cómo tributa (España)'
      },
      hints: {
        initial: 'Lo que ya tienes ahorrado para invertir. Puede ser cero.',
        monthly: 'La cantidad que puedes aportar todos los meses sin fallar.',
        years: 'El horizonte. Cuantos más años, más pesa cada fricción.',
        rate: 'Antes de comisiones e impuestos. Una cartera global diversificada ha rondado el 7 % anual a largo plazo.',
        fee: 'Se cobra cada año sobre todo el patrimonio, no sobre la ganancia. Un fondo indexado ronda el 0,1-0,3 %; un fondo bancario de gestión activa, el 1,5-2 %.',
        regime: 'Con la escala actual del IRPF del ahorro (del 19 % al 30 %). Cada opción explica cuándo se paga y por qué importa.'
      },
      presetsLabel: 'Ejemplos rápidos',
      presets: [
        { label: 'Fondo bancario (TER 1,8 %)', values: { fee: 1.8, regime: 'ES_TRASPASO' } },
        { label: 'Fondo indexado (TER 0,2 %)', values: { fee: 0.2, regime: 'ES_TRASPASO' } },
        { label: 'ETF de distribución (0,2 %)', values: { fee: 0.2, regime: 'ES_REPARTO' } },
        { label: 'Plan de pensiones (1,3 %)', values: { fee: 1.3, regime: 'ES_PENSIONES' } }
      ],
      noteLabels: {
        timing: 'Cuándo se paga',
        mechanics: 'Cómo funciona',
        effect: 'Efecto sobre el interés compuesto',
        tip: 'A tener en cuenta'
      },
      options: {
        regime: [
          {
            id: 'ES_REPARTO',
            name: 'Dividendos o ETF de distribución',
            note: {
              tone: 'high',
              badge: 'Fricción fiscal alta',
              timing: 'Cada año, con cada dividendo, y otra vez al vender.',
              mechanics: 'Los dividendos tributan en el IRPF del ahorro el año en que se cobran, aunque los reinviertas. Al vender pagas, además, por la plusvalía que quede. La calculadora supone un dividendo del 3 % anual.',
              effect: 'Cada año sale de la cartera una parte de la rentabilidad antes de haber podido componerse. Es el ejemplo más claro de interés compuesto negativo.',
              tip: 'En la fase de acumulación, un fondo o un ETF de acumulación aplaza ese impuesto sin cambiar nada más.'
            }
          },
          {
            id: 'ES_TRASPASO',
            name: 'Fondo de acumulación (traspasos sin tributar)',
            note: {
              tone: 'low',
              badge: 'Diferimiento fiscal',
              timing: 'Solo al reembolsar definitivamente.',
              mechanics: 'El fondo no reparte: la ganancia se queda dentro. Y en España puedes traspasar de un fondo a otro sin pasar por Hacienda. Pagas IRPF del ahorro sobre toda la plusvalía únicamente cuando reembolsas.',
              effect: 'El dinero que algún día será impuesto sigue trabajando para ti hasta el último día. La única fricción anual que queda es la comisión.',
              tip: 'Los ETF no tienen este régimen de traspasos en España; los fondos indexados, sí.'
            }
          },
          {
            id: 'ES_PENSIONES',
            name: 'Plan de pensiones (rescate en forma de capital)',
            note: {
              tone: 'high',
              badge: 'Cuidado en el rescate',
              timing: 'En el rescate, sobre todo lo acumulado.',
              mechanics: 'Las aportaciones reducen tu base imponible cuando las haces, pero el rescate tributa como rendimiento del trabajo, en la base general, sobre el total: aportaciones y ganancias. La calculadora aplica un 30 % medio a un rescate de una sola vez.',
              effect: 'El impuesto final puede llevarse una parte grande del patrimonio, y la comisión, a menudo alta, se cobra cada año durante décadas.',
              tip: 'No cuenta el ahorro fiscal de las aportaciones: si reinviertes esa devolución cada año, el resultado real mejora. Rescatar a lo largo de varios años también reduce el tipo.'
            }
          }
        ]
      },
      results: {
        gap: 'Lo que te cuestan comisiones e impuestos',
        ideal: 'Valor final sin fricciones',
        net: 'Valor neto tras costes e impuestos',
        erosion: 'Parte del patrimonio que se pierde',
        invested: 'Total aportado por ti',
        fees: 'Comisiones pagadas',
        periodicTax: 'Impuestos pagados por el camino',
        exitTax: 'Impuestos en el rescate final',
        lostGrowth: 'Crecimiento que ese dinero ya no generó',
        yearsLost: 'Equivale a tus aportaciones de'
      },
      detailTitle: 'De dónde sale la diferencia',
      resultNote: 'Una estimación con una fiscalidad simplificada, no una previsión ni un cálculo de tu declaración. Los supuestos están más abajo.',
      error: 'Introduce un capital inicial o una aportación mensual mayor que cero: sin dinero invertido no hay nada que erosionar.',
      action: 'Calcular',
      chart: {
        ideal: 'Sin fricciones',
        net: 'Con comisiones e impuestos',
        year: 'Año',
        exit: 'Rescate',
        caption: 'Evolución del patrimonio año a año con y sin fricciones. El último punto es el rescate, después de impuestos.'
      },
      howItWorks: `La calculadora lleva dos carteras en paralelo, mes a mes, con los mismos datos.

La primera es la ideal, sin costes de ningún tipo. Es exactamente el cálculo de la [calculadora de interés compuesto](/es/calculadoras/interes-compuesto/), así que con los mismos datos da la misma cifra:

\`\`\`
ideal = ideal × (1 + rentabilidad / 12) + aportación
\`\`\`

La segunda es la real. Cada mes crece igual, pero después paga la comisión sobre todo el saldo y, en las fechas en que tu régimen fiscal cobra algo, ese impuesto:

\`\`\`
real = real × (1 + rentabilidad / 12)
real = real − real × comisión / 12 + aportación
real = real − impuesto del periodo (si toca)
\`\`\`

Al final se aplica el impuesto del rescate sobre la ganancia que aún no ha tributado. La diferencia entre las dos carteras es el coste total, y tiene dos partes: lo que pagaste directamente, en comisiones e impuestos, y el crecimiento que ese dinero habría generado si se hubiera quedado dentro. Esa segunda parte es el interés compuesto negativo, y con comisiones altas y plazos largos suele ser la más grande de las dos.`,
      assumptions: `- La rentabilidad es **constante y bruta**: la comisión se descuenta aparte. En la realidad hay años buenos y malos, y el orden en que llegan importa.
- La fiscalidad está **simplificada**: escala actual del ahorro, sin compensar pérdidas, sin retenciones a cuenta, sin deducciones y sin cambios legislativos futuros, que los habrá.
- Los dividendos del régimen de reparto se suponen del **3 % anual**. El plan de pensiones se calcula con un **30 % medio** sobre todo el rescate y **sin** contar el ahorro fiscal de las aportaciones: es la opción más sensible a tu situación personal.
- Las cifras son **nominales**: no descuentan la inflación.
- No es asesoramiento fiscal. Para decidir un rescate o un cambio de producto, lo prudente es revisar tu caso concreto con un profesional.`,
      faq: [
        {
          q: '¿Qué es exactamente el interés compuesto negativo?',
          a: 'Es el mismo mecanismo que el interés compuesto, visto desde el otro lado. Cada euro que sale de tu cartera antes de tiempo, en una comisión o en un impuesto, no solo se pierde: se pierde todo lo que ese euro habría generado durante los años que quedaban. Por eso el coste real de una fricción no es lo que pagas, sino lo que pagas más el crecimiento que dejas de tener.'
        },
        {
          q: '¿Por qué una comisión del 1,5 % se lleva mucho más que un 1,5 %?',
          a: 'Porque se cobra cada año sobre todo el patrimonio, no sobre la ganancia. Con una rentabilidad bruta del 7 %, una comisión del 1,5 % se queda con más de una quinta parte de la rentabilidad de cada año, y ese pellizco se compone. Sobre una cantidad invertida de una vez durante treinta años, reduce el valor final en más de un tercio.'
        },
        {
          q: '¿Por qué no es lo mismo pagar impuestos cada año que al final?',
          a: 'Porque el dinero que se paga al final ha estado rindiendo hasta el último día. Con el mismo tipo y la misma rentabilidad, tributar al vender deja bastante más patrimonio que tributar cada año por el camino. Es lo que se llama diferimiento fiscal, y la razón por la que en España los fondos de acumulación con traspasos sin tributar son tan eficientes para el largo plazo.'
        },
        {
          q: '¿Y si no tributo en España?',
          a: 'Esta versión de la calculadora usa las reglas españolas. Puedes aproximar otro país con la opción cuya forma se parezca más a la tuya: impuesto solo al vender, impuesto anual sobre lo que se reparte o impuesto sobre todo el rescate. Las versiones en inglés y portugués de esta misma página usan las reglas de Estados Unidos y de Brasil.'
        },
        {
          q: '¿Se guardan los datos que introduzco?',
          a: 'No. El cálculo entero ocurre en tu navegador con JavaScript; nada se envía a ningún servidor y nada se almacena, salvo la moneda que elijas, si la cambias.'
        }
      ]
    },
    en: {
      name: 'Negative compounding calculator',
      slug: 'negative-compounding',
      title: 'Negative compounding calculator: what fees and taxes really cost',
      description: 'Work out how much of your wealth fees and taxes take over the years, and how much growth is lost along the way. Free, no sign-up, and the math runs in your own browser.',
      aliases: ['negative compounding'],
      intro: 'Compounding works in both directions. What you earn goes on to earn more, and what you pay every year in fees and taxes stops earning for good. Enter your plan, what your product costs and how it is taxed, and compare the ideal result with the one that actually reaches your account.',
      groups: {
        plan: 'Your investing plan',
        friction: 'Costs and tax'
      },
      labels: {
        initial: 'Starting amount',
        monthly: 'Monthly contribution',
        years: 'Years invested',
        rate: 'Estimated gross annual return (%)',
        fee: 'Annual fee / expense ratio (%)',
        regime: 'How it is taxed (US)'
      },
      hints: {
        initial: 'What you already have set aside to invest. Zero is fine.',
        monthly: 'The amount you can add every month without fail.',
        years: 'Your horizon. The longer it is, the more every friction weighs.',
        rate: 'Before fees and tax. A diversified global portfolio has run around 7% a year over the long term.',
        fee: 'Charged every year on your whole balance, not on the gain. An index fund runs around 0.03–0.2%; an active fund with an advisor on top, 1.5% or more.',
        regime: 'Simplified federal rates; state tax is left out. Each option explains when the tax falls and why it matters.'
      },
      presetsLabel: 'Quick examples',
      presets: [
        { label: 'Active mutual fund (1%)', values: { fee: 1, regime: 'US_TURNOVER' } },
        { label: 'Advisor + funds (1.5%)', values: { fee: 1.5, regime: 'US_ETF' } },
        { label: 'Index ETF (0.05%)', values: { fee: 0.05, regime: 'US_ETF' } },
        { label: 'Index fund in a Roth IRA', values: { fee: 0.05, regime: 'US_ROTH' } }
      ],
      noteLabels: {
        timing: 'When it is paid',
        mechanics: 'How it works',
        effect: 'Effect on compounding',
        tip: 'Worth knowing'
      },
      options: {
        regime: [
          {
            id: 'US_TURNOVER',
            name: 'Actively managed fund, taxable account',
            note: {
              tone: 'high',
              badge: 'High tax drag',
              timing: 'Every year (Form 1099-DIV), and again when you sell.',
              mechanics: 'Active funds trade often and pass dividends and realized gains on to you, taxable in the year they are paid even if you reinvest them. The calculator assumes 3% of the balance is distributed each year and taxed at 15%, with 15% long-term capital gains tax on what is left when you sell.',
              effect: 'Tax leaves the portfolio every single year, so that money never gets to compound.',
              tip: 'If you hold one, a tax-advantaged account such as a 401(k) or an IRA is the place for it.'
            }
          },
          {
            id: 'US_ETF',
            name: 'Index ETF, taxable account',
            note: {
              tone: 'low',
              badge: 'Mostly deferred',
              timing: 'A little every year on dividends; the rest only when you sell.',
              mechanics: 'Index ETFs rarely distribute capital gains, because of the way their shares are created and redeemed. You pay tax on the dividends each year (assumed 1.5% of the balance, taxed at 15%) and 15% long-term capital gains tax on the rest of the gain when you sell.',
              effect: 'Most of the return compounds untouched for decades, which is why the gap to the ideal comes mainly from the final sale.',
              tip: 'The long-term rate needs the shares to be held more than a year; selling sooner is taxed as ordinary income.'
            }
          },
          {
            id: 'US_HIGH',
            name: 'Index ETF, top tax bracket',
            note: {
              tone: 'mid',
              badge: 'Heavy exit tax',
              timing: 'A little every year on dividends; the rest when you sell.',
              mechanics: 'The same ETF, for a high earner: dividends and the final gain are taxed at the top 20% long-term rate plus the 3.8% Net Investment Income Tax, 23.8% in total.',
              effect: 'Accumulation is still efficient, but the final sale takes a noticeably larger bite.',
              tip: 'Spreading sales over several years, harvesting losses and giving appreciated shares are the usual ways to soften it.'
            }
          },
          {
            id: 'US_ROTH',
            name: 'Roth IRA or Roth 401(k)',
            note: {
              tone: 'low',
              badge: 'Tax-free',
              timing: 'Never, on qualified withdrawals.',
              mechanics: 'Money goes in after tax, grows without any tax on dividends or gains, and qualified withdrawals in retirement are tax-free.',
              effect: 'The only friction left is the fee, which is as close to the ideal as compounding gets.',
              tip: 'Annual contribution limits apply. A traditional 401(k) or IRA works the other way round: a deduction now, income tax on the withdrawal.'
            }
          }
        ]
      },
      results: {
        gap: 'What fees and tax cost you',
        ideal: 'Final value with no friction',
        net: 'Net value after costs and tax',
        erosion: 'Share of wealth lost',
        invested: 'Total you contributed',
        fees: 'Fees paid',
        periodicTax: 'Tax paid along the way',
        exitTax: 'Tax on the final sale',
        lostGrowth: 'Growth that money never earned',
        yearsLost: 'Worth your contributions for'
      },
      detailTitle: 'Where the difference comes from',
      resultNote: 'An estimate with simplified tax rules, not a forecast or a tax return. The assumptions are set out below.',
      error: 'Enter a starting amount or a monthly contribution above zero: with nothing invested, there is nothing to erode.',
      action: 'Calculate',
      chart: {
        ideal: 'No friction',
        net: 'With fees and tax',
        year: 'Year',
        exit: 'Sale',
        caption: 'Your balance year by year with and without friction. The last point is the final sale, after tax.'
      },
      howItWorks: `The calculator runs two portfolios side by side, month by month, from the same inputs.

The first is the ideal one, with no costs of any kind. It is exactly the [compound interest calculator](/en/calculators/compound-interest/), so the same inputs give the same figure:

\`\`\`
ideal = ideal × (1 + annual return / 12) + contribution
\`\`\`

The second is the real one. Each month it grows the same way, then pays the fee on the whole balance and, on the dates your tax regime charges something, that tax:

\`\`\`
real = real × (1 + annual return / 12)
real = real − real × fee / 12 + contribution
real = real − tax for the period (when due)
\`\`\`

At the end it pays the exit tax on the gain not yet taxed. The difference between the two portfolios is the total cost, and it has two parts: what you paid directly, in fees and tax, and the growth that money would have produced had it stayed invested. That second part is negative compounding, and with high fees and long horizons it is usually the larger of the two.`,
      assumptions: `- The return is **constant and gross**: the fee is taken separately. In reality there are good years and bad ones, and the order they arrive in matters.
- Tax is **simplified**: federal rates only, no state tax, no loss harvesting, no withholding, and no future changes to the law, which there will be.
- Distributions are assumed at **3% a year** for an active fund and **1.5%** for an index ETF, all taxed at the long-term rate. Short-term gains taxed as ordinary income would make the active fund look worse, not better.
- The figures are **nominal**: they do not subtract inflation.
- This is not tax advice. Before choosing an account or selling a large position, it is worth going through your own case with a qualified professional.`,
      faq: [
        {
          q: 'What exactly is negative compounding?',
          a: 'It is the same mechanism as compound interest, seen from the other side. Every dollar that leaves your portfolio early, as a fee or a tax, is not just lost: everything that dollar would have earned in the years left is lost with it. That is why the real cost of a friction is not what you pay but what you pay plus the growth you no longer get.'
        },
        {
          q: 'Why does a 1.5% fee take so much more than 1.5%?',
          a: 'Because it is charged every year on your whole balance, not on your gain. At a 7% gross return, a 1.5% fee takes more than a fifth of each year’s return, and that slice compounds. On a single sum invested for thirty years, it cuts the final value by more than a third.'
        },
        {
          q: 'Why is paying tax every year different from paying it at the end?',
          a: 'Because money paid at the end has been earning until the last day. At the same rate and the same return, being taxed when you sell leaves noticeably more wealth than being taxed every year along the way. It is called tax deferral, and it is why low-turnover index funds and tax-advantaged accounts are so effective over decades.'
        },
        {
          q: 'What if I am not taxed in the US?',
          a: 'This version of the calculator uses US rules. You can approximate another country with the option whose shape is closest to yours: tax only on sale, tax every year on what is distributed, or no tax at all inside a sheltered account. The Spanish and Portuguese versions of this page use the rules of Spain and Brazil.'
        },
        {
          q: 'Do you store what I enter?',
          a: 'No. The whole calculation runs in your browser in JavaScript; nothing is sent to a server and nothing is stored, apart from your currency choice if you change it.'
        }
      ]
    },
    pt: {
      name: 'Calculadora de juros compostos negativos',
      slug: 'juros-compostos-negativos',
      title: 'Calculadora de juros compostos negativos: taxas e impostos',
      description: 'Calcule quanto do seu patrimônio as taxas e os impostos levam ao longo dos anos, e quanto crescimento se perde pelo caminho. Grátis, sem cadastro e com o cálculo no seu navegador.',
      aliases: ['juros compostos negativos', 'compounding negativo'],
      intro: 'Os juros compostos trabalham nas duas direções. O que você ganha gera novos ganhos, e o que você paga todo ano em taxas e impostos deixa de render para sempre. Informe o seu plano, quanto custa o seu produto e como ele é tributado, e compare o resultado ideal com o que de fato chega à sua conta.',
      groups: {
        plan: 'O seu plano de investimento',
        friction: 'Custos e impostos'
      },
      labels: {
        initial: 'Capital inicial',
        monthly: 'Aporte mensal',
        years: 'Anos de investimento',
        rate: 'Rentabilidade anual bruta estimada (%)',
        fee: 'Taxa de administração anual (%)',
        regime: 'Como é tributado (Brasil)'
      },
      hints: {
        initial: 'O que você já tem poupado para investir. Pode ser zero.',
        monthly: 'O valor que você consegue aportar todos os meses sem falhar.',
        years: 'O horizonte. Quanto mais anos, mais pesa cada atrito.',
        rate: 'Antes de taxas e impostos. Com os juros brasileiros, a renda fixa pode render bem mais do que 7% nominais; ajuste ao seu caso.',
        fee: 'Cobrada todo ano sobre todo o patrimônio, não sobre o lucro. Um ETF ou o Tesouro Direto ficam perto de 0,2-0,3%; um fundo de banco, 1,5-2% ou mais.',
        regime: 'Regras de imposto de renda para pessoa física, simplificadas. Cada opção explica quando se paga e por que isso importa.'
      },
      presetsLabel: 'Exemplos rápidos',
      presets: [
        { label: 'Fundo de banco (taxa 2%)', values: { fee: 2, regime: 'BR_COMECOTAS' } },
        { label: 'Tesouro Direto (0,2%)', values: { fee: 0.2, regime: 'BR_REGRESSIVA' } },
        { label: 'ETF de ações (0,3%)', values: { fee: 0.3, regime: 'BR_ACOES' } },
        { label: 'LCI / LCA isenta', values: { fee: 0, regime: 'BR_ISENTO' } }
      ],
      noteLabels: {
        timing: 'Quando se paga',
        mechanics: 'Como funciona',
        effect: 'Efeito nos juros compostos',
        tip: 'Vale saber'
      },
      options: {
        regime: [
          {
            id: 'BR_COMECOTAS',
            name: 'Fundo de renda fixa ou multimercado (come-cotas)',
            note: {
              tone: 'high',
              badge: 'Atrito fiscal alto',
              timing: 'Todo maio e novembro, e de novo no resgate se faltar algo.',
              mechanics: 'O come-cotas antecipa o imposto de renda: a cada seis meses, 15% do rendimento do período é recolhido reduzindo a quantidade de cotas, mesmo que você não resgate nada. No resgate, paga-se a diferença até a alíquota da tabela regressiva.',
              effect: 'O imposto sai da carteira duas vezes por ano, e esse dinheiro deixa de render para sempre.',
              tip: 'Para prazos longos, compare com um título que só é tributado no resgate.'
            }
          },
          {
            id: 'BR_REGRESSIVA',
            name: 'CDB ou Tesouro Direto (tabela regressiva)',
            note: {
              tone: 'mid',
              badge: 'Diferimento fiscal',
              timing: 'Só no resgate ou no vencimento.',
              mechanics: 'Alíquota sobre o rendimento de 22,5% até 6 meses, 20% até 1 ano, 17,5% até 2 anos e 15% depois disso. A calculadora usa a alíquota do prazo que você informou.',
              effect: 'O dinheiro do imposto continua rendendo até o fim: é diferimento fiscal na prática.',
              tip: 'Títulos com juros semestrais são tributados a cada cupom. Para o longo prazo, a versão sem cupom adia mais o imposto.'
            }
          },
          {
            id: 'BR_ACOES',
            name: 'Ações, ETFs ou fundos de ações',
            note: {
              tone: 'low',
              badge: 'Imposto só na venda',
              timing: 'Só quando você vende.',
              mechanics: '15% sobre o lucro no momento da venda. Enquanto você não vende, nada é recolhido e todo o ganho continua investido.',
              effect: 'O efeito bola de neve funciona sem interrupções do fisco durante toda a acumulação.',
              tip: 'A calculadora ignora os dividendos e a isenção de vendas de ações até R$ 20 mil por mês, que não vale para ETFs.'
            }
          },
          {
            id: 'BR_ISENTO',
            name: 'LCI, LCA, CRI ou CRA (isentos para pessoa física)',
            note: {
              tone: 'low',
              badge: 'Sem imposto de renda',
              timing: 'Nunca, pelas regras atuais.',
              mechanics: 'Isentos de imposto de renda para pessoa física, durante o período e no resgate.',
              effect: 'O cenário mais próximo do ideal: a única fricção que resta é a taxa, se houver.',
              tip: 'Compare sempre pela rentabilidade líquida: um isento pode render menos do que um CDB tributado. E as regras de isenção estão em discussão; confirme as vigentes.'
            }
          }
        ]
      },
      results: {
        gap: 'O que taxas e impostos custam a você',
        ideal: 'Valor final sem atritos',
        net: 'Valor líquido após custos e impostos',
        erosion: 'Parte do patrimônio perdida',
        invested: 'Total aportado',
        fees: 'Taxas pagas',
        periodicTax: 'Impostos pagos pelo caminho',
        exitTax: 'Imposto no resgate final',
        lostGrowth: 'Crescimento que esse dinheiro não gerou',
        yearsLost: 'Equivale aos seus aportes de'
      },
      detailTitle: 'De onde vem a diferença',
      resultNote: 'Uma estimativa com regras de imposto simplificadas, não uma previsão nem um cálculo da sua declaração. Os pressupostos estão mais abaixo.',
      error: 'Informe um capital inicial ou um aporte mensal acima de zero: sem dinheiro investido não há nada a corroer.',
      action: 'Calcular',
      chart: {
        ideal: 'Sem atritos',
        net: 'Com taxas e impostos',
        year: 'Ano',
        exit: 'Resgate',
        caption: 'Evolução do patrimônio ano a ano com e sem atritos. O último ponto é o resgate, depois do imposto.'
      },
      howItWorks: `A calculadora acompanha duas carteiras lado a lado, mês a mês, com os mesmos dados.

A primeira é a ideal, sem custo nenhum. É exatamente a conta da [calculadora de juros compostos](/pt/calculadoras/juros-compostos/), então com os mesmos dados dá o mesmo número:

\`\`\`
ideal = ideal × (1 + rentabilidade anual / 12) + aporte
\`\`\`

A segunda é a real. Todo mês cresce do mesmo jeito, mas depois paga a taxa sobre todo o saldo e, nas datas em que o seu regime de imposto cobra algo, esse imposto:

\`\`\`
real = real × (1 + rentabilidade anual / 12)
real = real − real × taxa / 12 + aporte
real = real − imposto do período (quando houver)
\`\`\`

No fim, aplica-se o imposto do resgate sobre o ganho que ainda não foi tributado. A diferença entre as duas carteiras é o custo total, e ela tem duas partes: o que você pagou diretamente, em taxas e impostos, e o crescimento que esse dinheiro teria gerado se tivesse ficado investido. Essa segunda parte são os juros compostos negativos, e com taxas altas e prazos longos costuma ser a maior das duas.`,
      assumptions: `- A rentabilidade é **constante e bruta**: a taxa é descontada à parte. Na realidade há anos bons e ruins, e a ordem em que chegam importa.
- Os impostos estão **simplificados**: regras atuais para pessoa física, sem compensação de prejuízos, sem IOF, sem dividendos e sem mudanças futuras na lei, que vão acontecer.
- O come-cotas é calculado a **15%**, a alíquota dos fundos de longo prazo; fundos de curto prazo recolhem 20%. A tabela regressiva usa a alíquota do prazo total, embora na prática cada aporte tenha o seu próprio prazo.
- Os valores são **nominais**: não descontam a inflação, que no Brasil pesa bastante.
- Não é assessoria tributária. Para decidir um resgate ou uma troca de produto, o prudente é analisar o seu caso concreto com um profissional.`,
      faq: [
        {
          q: 'O que são exatamente juros compostos negativos?',
          a: 'É o mesmo mecanismo dos juros compostos, visto do outro lado. Cada real que sai da sua carteira antes da hora, numa taxa ou num imposto, não se perde sozinho: perde-se tudo o que esse real teria rendido nos anos que faltavam. Por isso o custo real de um atrito não é o que você paga, mas o que paga mais o crescimento que deixa de ter.'
        },
        {
          q: 'Por que uma taxa de 1,5% leva muito mais do que 1,5%?',
          a: 'Porque é cobrada todo ano sobre todo o patrimônio, não sobre o lucro. Com uma rentabilidade bruta de 7%, uma taxa de 1,5% fica com mais de um quinto do rendimento de cada ano, e essa mordida se compõe. Sobre um valor investido de uma vez durante trinta anos, reduz o valor final em mais de um terço.'
        },
        {
          q: 'Por que pagar imposto todo ano é diferente de pagar no fim?',
          a: 'Porque o dinheiro pago no fim rendeu até o último dia. Com a mesma alíquota e a mesma rentabilidade, ser tributado só no resgate deixa bem mais patrimônio do que o come-cotas semestral. É o que se chama diferimento fiscal, e é por isso que a forma do produto importa tanto quanto a taxa.'
        },
        {
          q: 'E se eu não pago imposto no Brasil?',
          a: 'Esta versão da calculadora usa as regras brasileiras. Você pode aproximar outro país com a opção cuja forma se pareça mais com a sua: imposto só na venda, imposto periódico ou isenção. As versões em espanhol e inglês desta mesma página usam as regras da Espanha e dos Estados Unidos.'
        },
        {
          q: 'Os dados que eu digito ficam guardados?',
          a: 'Não. Todo o cálculo acontece no seu navegador em JavaScript; nada é enviado para um servidor e nada é armazenado, exceto a moeda que você escolher, se a mudar.'
        }
      ]
    }
  },

{
    id: 'financial-freedom',
    currency: true,
    glossary: ['fire', 'four-percent-rule', 'safe-withdrawal-rate', 'savings-rate'],
    fields: [
      { id: 'currentAge', type: 'number', min: 16, max: 90, step: 1, value: 35 },
      { id: 'targetAge', type: 'number', min: 20, max: 95, step: 1, value: 60 },
      { id: 'desiredIncome', type: 'number', min: 0, step: 100, value: 2000, money: true }
    ],
    result: { primary: 'target', rows: ['years', 'savings'] },
    es: {
      name: 'Calculadora de libertad financiera',
      slug: 'libertad-financiera',
      title: 'Calculadora de libertad financiera',
      description: 'Descubre cuánto patrimonio necesitas para vivir de tus inversiones y cuánto tendrías que ahorrar cada mes para llegar a esa cifra.',
      intro: 'Elige a qué edad quieres tener la opción de dejar de trabajar y con qué ingreso mensual. La calculadora te da el número que hace falta y lo que costaría al mes llegar hasta ahí.',
      labels: {
        currentAge: 'Tu edad actual',
        targetAge: 'Edad objetivo',
        desiredIncome: 'Ingreso mensual deseado'
      },
      hints: {
        currentAge: 'El punto de partida. Determina cuántos años tiene para trabajar el interés compuesto.',
        targetAge: 'La edad a la que quieres que trabajar sea opcional, no obligatorio.',
        desiredIncome: 'Lo que necesitarías al mes, en euros de hoy, para cubrir tu vida.'
      },
      results: {
        target: 'Patrimonio objetivo',
        years: 'Años que te quedan',
        savings: 'Aportación mensual necesaria'
      },
      resultNote: 'Calculado con la regla del 4 % y una rentabilidad real del 8 % anual. Cambia esos supuestos y el número cambia mucho: lee los límites más abajo.',
      action: 'Calcular',
      howItWorks: `Son dos pasos. El primero dimensiona el objetivo con la regla del 4 %, que invertida es la "regla de 300": si puedes retirar el 4 % anual, necesitas 300 veces tu gasto mensual.

\`\`\`
patrimonio objetivo = ingreso mensual deseado × 300
\`\`\`

El segundo calcula la aportación mensual que llega a esa cifra en los años que te quedan, con una rentabilidad anual del 8 %, usando la fórmula estándar de pago periódico:

\`\`\`
aportación = objetivo × r / ((1 + r)^n − 1)      r = 0,08 / 12    n = años × 12
\`\`\`

Nótese lo que **no** hace: no cuenta lo que ya tienes ahorrado. La cifra que devuelve es la aportación necesaria partiendo de cero, así que si ya tienes patrimonio, tu aportación real es menor.`,
      assumptions: `- Usa la **regla del 4 %**, que viene de un estudio sobre treinta años de mercados estadounidenses del siglo XX. Para una jubilación de cincuenta años, o con comisiones altas, la tasa segura es menor y el patrimonio necesario mayor.
- Supone una rentabilidad del **8 % anual constante**. Es optimista frente a una cartera mixta y no contempla el riesgo de secuencia: una mala racha justo al empezar a retirar cambia el resultado por completo.
- **No incluye tu patrimonio actual**, ni pensión pública, ni herencias, ni ingresos futuros distintos del trabajo.
- Todo está en **euros de hoy**: no ajusta ni el objetivo ni la aportación por inflación a lo largo del camino.
- Ignora **impuestos**, que en la fase de retirada pueden ser una parte relevante del gasto real.`,
      faq: [
        {
          q: '¿Por qué multiplica por 300?',
          a: 'Porque 300 es el inverso mensual del 4 % anual: si retiras el 4 % de tu patrimonio al año, eso son doce mensualidades, y 12 / 0,04 = 300. Es la forma rápida de convertir un gasto mensual en el patrimonio que lo sostiene.'
        },
        {
          q: 'La aportación mensual me sale altísima. ¿Está mal?',
          a: 'Probablemente no: está diciendo algo real. Hay tres palancas y todas funcionan. Mover la edad objetivo unos años cambia el resultado mucho, porque añade años de capitalización. Bajar el ingreso deseado baja el objetivo de forma proporcional. Y si ya tienes patrimonio, la cifra real es menor que la que ves, porque este cálculo parte de cero.'
        },
        {
          q: '¿Cuenta con mi pensión pública?',
          a: 'No, y eso hace que el número sea conservador si esperas cobrarla. Una forma sencilla de incorporarla es restar la pensión mensual estimada de tu ingreso deseado antes de introducirlo, aunque conviene recordar que la pensión llega a la edad legal y no a tu edad objetivo.'
        },
        {
          q: '¿Es esto una recomendación de cuánto debo ahorrar?',
          a: 'No. Es una calculadora educativa que aplica dos fórmulas públicas a los datos que le das. No conoce tu situación, tu estabilidad laboral, tus deudas ni tu tolerancia al riesgo, y no puede recomendarte ningún producto ni ninguna estrategia. Para eso hace falta un profesional registrado que analice tu caso.'
        }
      ]
    },
    en: {
      name: 'Financial freedom calculator',
      slug: 'financial-freedom',
      title: 'Financial freedom calculator',
      description: 'Find out how much wealth you need to live off your investments, and how much you would have to save each month to get there.',
      intro: 'Pick the age you want the option to stop working, and the monthly income you would need. The calculator gives you the figure it takes and what reaching it costs per month.',
      labels: {
        currentAge: 'Your current age',
        targetAge: 'Target age',
        desiredIncome: 'Desired monthly income'
      },
      hints: {
        currentAge: 'The starting point. It sets how many years compounding has to work.',
        targetAge: 'The age at which working becomes optional rather than required.',
        desiredIncome: 'What you would need per month, in today’s money, to cover your life.'
      },
      results: {
        target: 'Target wealth',
        years: 'Years remaining',
        savings: 'Monthly contribution needed'
      },
      resultNote: 'Calculated with the 4% rule and an 8% annual real return. Change those assumptions and the number moves a lot: the limits are set out below.',
      action: 'Calculate',
      howItWorks: `Two steps. The first sizes the target using the 4% rule, which inverted is the "rule of 300": if you can withdraw 4% a year, you need 300 times your monthly spending.

\`\`\`
target wealth = desired monthly income × 300
\`\`\`

The second works out the monthly contribution that reaches that figure in the years you have left, at an 8% annual return, using the standard payment formula:

\`\`\`
contribution = target × r / ((1 + r)^n − 1)      r = 0.08 / 12    n = years × 12
\`\`\`

Note what it does **not** do: it does not count what you have already saved. The figure it returns is the contribution needed starting from zero, so if you already hold assets your real contribution is lower.`,
      assumptions: `- It uses the **4% rule**, which comes from a study of thirty years of twentieth-century US markets. For a fifty-year retirement, or with high fees, the safe rate is lower and the wealth needed higher.
- It assumes a **constant 8% annual return**. That is optimistic for a mixed portfolio and ignores sequence risk: a bad run right as withdrawals begin changes the outcome entirely.
- It **excludes your current wealth**, any state pension, inheritances, and any future income other than work.
- Everything is in **today's money**: neither the target nor the contribution is inflated along the way.
- It ignores **tax**, which in the withdrawal phase can be a meaningful share of real spending.`,
      faq: [
        {
          q: 'Why does it multiply by 300?',
          a: 'Because 300 is the monthly inverse of 4% a year: if you withdraw 4% of your wealth annually, that is twelve monthly payments, and 12 / 0.04 = 300. It is the quick way to turn monthly spending into the wealth that sustains it.'
        },
        {
          q: 'The monthly contribution looks enormous. Is it wrong?',
          a: 'Probably not. It is telling you something real, and there are three levers you can pull. Moving the target age by a few years changes the result a lot, because it adds years of compounding. Lowering the desired income lowers the target proportionally. And if you already hold assets, the real figure is lower than the one shown, because this calculation starts from zero.'
        },
        {
          q: 'Does it account for a state pension?',
          a: 'No, which makes the number conservative if you expect to receive one. A simple way to fold it in is to subtract your estimated monthly pension from the desired income before entering it, bearing in mind a state pension arrives at the statutory age, not at your target age.'
        },
        {
          q: 'Is this a recommendation about how much I should save?',
          a: 'No. It is an educational calculator applying two published formulas to the numbers you give it. It does not know your situation, your job security, your debts or your risk tolerance, and it cannot recommend any product or strategy. That needs a registered professional who looks at your actual case.'
        }
      ]
    },
    pt: {
      name: 'Calculadora de liberdade financeira',
      slug: 'liberdade-financeira',
      title: 'Calculadora de liberdade financeira',
      description: 'Descubra quanto patrimônio você precisa para viver dos seus investimentos e quanto teria de poupar por mês para chegar a esse valor.',
      intro: 'Escolha com que idade você quer ter a opção de parar de trabalhar e com que renda mensal. A calculadora dá o número necessário e quanto custaria por mês chegar até ele.',
      labels: {
        currentAge: 'A sua idade atual',
        targetAge: 'Idade objetivo',
        desiredIncome: 'Renda mensal desejada'
      },
      hints: {
        currentAge: 'O ponto de partida. Define quantos anos os juros compostos têm para trabalhar.',
        targetAge: 'A idade a partir da qual trabalhar passa a ser opcional e não obrigatório.',
        desiredIncome: 'O que você precisaria por mês, em reais de hoje, para cobrir a sua vida.'
      },
      results: {
        target: 'Patrimônio objetivo',
        years: 'Anos que faltam',
        savings: 'Aporte mensal necessário'
      },
      resultNote: 'Calculado com a regra dos 4% e uma rentabilidade real de 8% ao ano. Mudar esses pressupostos muda muito o número: os limites estão explicados abaixo.',
      action: 'Calcular',
      howItWorks: `São dois passos. O primeiro dimensiona o objetivo com a regra dos 4%, que invertida é a "regra dos 300": se você pode retirar 4% por ano, precisa de 300 vezes a sua despesa mensal.

\`\`\`
patrimônio objetivo = renda mensal desejada × 300
\`\`\`

O segundo calcula o aporte mensal que chega a esse valor nos anos que faltam, com uma rentabilidade anual de 8%, usando a fórmula padrão de pagamento periódico:

\`\`\`
aporte  = objetivo × r / ((1 + r)^n − 1)      r = 0,08 / 12    n = anos × 12
\`\`\`

Note-se o que ela **não** faz: não conta o que você já tem poupado. O valor devolvido é o aporte necessário partindo de zero, então, se você já tem patrimônio, o seu aporte real é menor.`,
      assumptions: `- Usa a **regra dos 4%**, que vem de um estudo sobre trinta anos de mercados americanos do século XX. Para uma aposentadoria de cinquenta anos, ou com comissões altas, a taxa segura é menor e o patrimônio necessário maior.
- Pressupõe uma rentabilidade de **8% ao ano constante**. É otimista para uma carteira mista e não contempla o risco de sequência: uma fase ruim justamente quando você começa a retirar muda o resultado por completo.
- **Não inclui o seu patrimônio atual**, nem pensão pública, nem heranças, nem rendimentos futuros distintos do trabalho.
- Tudo está em **reais de hoje**: não ajusta nem o objetivo nem o aporte pela inflação ao longo do caminho.
- Ignora **impostos**, que na fase de retirada podem ser uma parte relevante da despesa real.`,
      faq: [
        {
          q: 'Por que multiplicar por 300?',
          a: 'Porque 300 é o inverso mensal dos 4% anuais: se você retira 4% do seu patrimônio por ano, isso são doze mensalidades, e 12 / 0,04 = 300. É a forma rápida de converter uma despesa mensal no patrimônio que a sustenta.'
        },
        {
          q: 'O aporte mensal sai altíssimo. Está errado?',
          a: 'Provavelmente não: ele está dizendo algo real. Há três alavancas e todas funcionam. Mover a idade objetivo alguns anos muda muito o resultado, porque acrescenta anos de capitalização. Baixar a renda desejada baixa o objetivo de forma proporcional. E se você já tem patrimônio, o valor real é menor do que o que aparece, porque este cálculo parte de zero.'
        },
        {
          q: 'Conta com a minha pensão pública?',
          a: 'Não, e isso torna o número conservador se você espera recebê-la. Uma forma simples de incorporá-la é subtrair a pensão mensal estimada da renda desejada antes de informá-la, levando em conta que a pensão chega na idade legal e não na sua idade objetivo.'
        },
        {
          q: 'Isto é uma recomendação sobre quanto devo poupar?',
          a: 'Não. É uma calculadora educativa que aplica duas fórmulas públicas aos números que você informa. Ela não conhece a sua situação, a sua estabilidade no emprego, as suas dívidas nem a sua tolerância ao risco, e não pode recomendar nenhum produto nem nenhuma estratégia. Para isso é necessário um profissional registrado que analise o seu caso.'
        }
      ]
    }
  },
{
    id: 'life-cost',
    currency: true,
    glossary: ['life-cost', 'opportunity-cost', 'hedonic-adaptation', 'lifestyle-creep'],
    fields: [
      { id: 'monthlySalary', type: 'number', min: 0, step: 100, value: 2200, money: true },
      { id: 'monthlyHours', type: 'number', min: 1, max: 400, step: 1, value: 168 },
      { id: 'purchaseCost', type: 'number', min: 0, step: 10, value: 900, money: true }
    ],
    result: { primary: 'hours', rows: ['hourly'] },
    es: {
      name: 'Calculadora del coste en horas de vida',
      slug: 'coste-en-horas-de-vida',
      title: 'Calculadora del coste en horas de vida',
      description: 'Convierte el precio de cualquier compra en las horas de trabajo que cuesta. Una forma distinta —y más honesta— de mirar un gasto.',
      intro: 'El dinero es tiempo intercambiado. Introduce tu sueldo, tus horas reales de trabajo y el precio de algo que estés pensando comprar, y lo verás en la única moneda que no se recupera nunca.',
      labels: {
        monthlySalary: 'Sueldo neto mensual',
        monthlyHours: 'Horas de trabajo al mes',
        purchaseCost: 'Precio de la compra'
      },
      hints: {
        monthlySalary: 'Lo que te llega a la cuenta, no lo que dice el contrato.',
        monthlyHours: 'Incluye desplazamientos, formación y el tiempo que tardas en desconectar. 168 son unas 40 horas semanales.',
        purchaseCost: 'El precio total, financiación incluida si la hay.'
      },
      results: {
        hours: 'Horas de vida que cuesta',
        hourly: 'Tu tarifa real por hora'
      },
      resultNote: 'Ninguna de las dos cifras es más verdadera que la otra. Solo una está en la unidad en la que se paga de verdad.',
      error: 'Introduce un salario y unas horas mayores que cero: sin esos dos números no hay tarifa por hora que convertir.',
      action: 'Calcular',
      howItWorks: `Dos divisiones, y ahí está toda la idea:

\`\`\`
tarifa real por hora = sueldo neto mensual / horas de trabajo al mes
horas de vida        = precio / tarifa real por hora
\`\`\`

La parte interesante es la segunda entrada. Si cuentas solo las horas de contrato, tu tarifa sale alta y todo parece barato. Si cuentas el desplazamiento, la formación, la ropa de trabajo y las dos horas del domingo por la noche que tardas en dejar de pensar en el lunes, la tarifa baja y las cifras cambian de sentido. La segunda es la real.`,
      assumptions: `- Es una **conversión**, no una predicción: no hay supuestos de mercado ni de inflación que puedan fallar.
- La tarifa por hora usa tu sueldo **neto**, así que los impuestos ya están descontados. No incluye costes indirectos del empleo como el transporte o el cuidado de menores.
- No incluye el **coste de oportunidad** de la compra, que es una segunda capa: esos 900 € invertidos a un 7 % durante veinte años habrían sido unos 3.480 €. Para ver esa parte, usa la calculadora de interés compuesto.
- No pretende decirte que **no** compres. Muchas compras siguen valiendo la pena expresadas en horas, y saberlo es exactamente el objetivo.`,
      faq: [
        {
          q: '¿Cuántas horas al mes debería poner?',
          a: 'Las que realmente le das al trabajo. Una jornada de 40 horas semanales son unas 168 al mes, pero si te desplazas una hora al día son 190, y si te llevas trabajo a casa, más. Cuanto más honesta sea esa cifra, más útil es el resultado, porque es la que convierte el precio en tiempo de tu vida.'
        },
        {
          q: '¿Esto no es una forma de sentirse culpable por gastar?',
          a: 'No es el objetivo, y usada así funciona mal. La idea original, de "Your Money or Your Life", es hacer visible un intercambio que normalmente es invisible, para poder elegirlo. Una compra de setenta y cinco horas que te importa es una buena compra. Una de setenta y cinco horas que se te olvida en un mes es la que este cálculo estaba buscando.'
        },
        {
          q: '¿Y las compras que ahorran tiempo?',
          a: 'Ahí el cálculo se invierte y merece la pena hacerlo. Un electrodoméstico de 400 € que te devuelve dos horas por semana se paga en horas bastante rápido. Es el mismo razonamiento aplicado al otro lado, y es la razón por la que esta calculadora no es un argumento para gastar menos, sino para gastar en otra cosa.'
        },
        {
          q: '¿Se guarda lo que introduzco?',
          a: 'No. El cálculo ocurre entero en tu navegador y nada se envía a ningún servidor. Tu sueldo no sale de tu pantalla.'
        }
      ]
    },
    en: {
      name: 'Life cost calculator',
      slug: 'life-cost-in-hours',
      title: 'Life cost calculator: what a purchase costs in hours',
      description: 'Convert the price of any purchase into the hours of work it costs. A different, and more honest, way to look at spending.',
      intro: 'Money is traded time. Enter your pay, your real working hours and the price of something you are thinking of buying, and you will see it in the one currency you never get back.',
      labels: {
        monthlySalary: 'Monthly take-home pay',
        monthlyHours: 'Working hours per month',
        purchaseCost: 'Purchase price'
      },
      hints: {
        monthlySalary: 'What lands in your account, not what the contract says.',
        monthlyHours: 'Include commuting, training and the time it takes to switch off. 168 is roughly a 40-hour week.',
        purchaseCost: 'The total price, including finance charges if there are any.'
      },
      results: {
        hours: 'Life hours it costs',
        hourly: 'Your real hourly rate'
      },
      resultNote: 'Neither figure is truer than the other. Only one is in the unit you actually pay in.',
      error: 'Enter a salary and a number of hours above zero: without both, there is no hourly rate to convert.',
      action: 'Calculate',
      howItWorks: `Two divisions, and that is the whole idea:

\`\`\`
real hourly rate = monthly take-home pay / working hours per month
life hours       = price / real hourly rate
\`\`\`

The interesting part is the second input. Count only contracted hours and your rate comes out high, so everything looks cheap. Count the commute, the training, the work clothes and the two Sunday-evening hours it takes to stop thinking about Monday, and the rate falls and the numbers change meaning. The second one is the real one.`,
      assumptions: `- This is a **conversion**, not a prediction: there are no market or inflation assumptions that could be wrong.
- The hourly rate uses your **take-home** pay, so tax is already out. It does not include indirect costs of employment such as transport or childcare.
- It excludes the purchase's **opportunity cost**, which is a second layer: $900 invested at 7% for twenty years would have been about $3,480. To see that part, use the compound interest calculator.
- It is not trying to tell you **not** to buy. Plenty of purchases still make sense expressed in hours, and knowing which is exactly the point.`,
      faq: [
        {
          q: 'How many hours a month should I enter?',
          a: 'The ones you genuinely give to work. A 40-hour week is about 168 a month, but if you commute an hour a day it is 190, and if you take work home, more. The more honest that figure is, the more useful the result, because that is what turns a price into time out of your life.'
        },
        {
          q: 'Isn’t this just a way to feel guilty about spending?',
          a: 'That is not the goal, and used that way it works badly. The original idea, from "Your Money or Your Life", is to make an ordinarily invisible trade visible so it can be chosen. A seventy-five-hour purchase you care about is a good purchase. A seventy-five-hour one you forget in a month is the one this calculation was looking for.'
        },
        {
          q: 'What about purchases that save time?',
          a: 'There the calculation runs in reverse and is well worth doing. A $400 appliance that gives you back two hours a week pays for itself in hours fairly quickly. It is the same reasoning applied to the other side, and it is why this calculator is not an argument for spending less but for spending on something else.'
        },
        {
          q: 'Is what I enter stored anywhere?',
          a: 'No. The calculation runs entirely in your browser and nothing is sent to any server. Your salary never leaves your screen.'
        }
      ]
    },
    pt: {
      name: 'Calculadora do custo em horas de vida',
      slug: 'custo-em-horas-de-vida',
      title: 'Calculadora do custo em horas de vida',
      description: 'Converte o preço de qualquer compra nas horas de trabalho que custa. Uma forma diferente —e mais honesta— de olhar para uma despesa.',
      intro: 'O dinheiro é tempo trocado. Informe o seu salário, as suas horas reais de trabalho e o preço de algo que você esteja pensando em comprar, e você vai vê-lo na única moeda que nunca volta.',
      labels: {
        monthlySalary: 'Salário líquido mensal',
        monthlyHours: 'Horas de trabalho por mês',
        purchaseCost: 'Preço da compra'
      },
      hints: {
        monthlySalary: 'O que chega à sua conta, não o que diz o contrato.',
        monthlyHours: 'Inclui deslocamentos, formação e o tempo que você leva para desligar. 168 são cerca de 40 horas por semana.',
        purchaseCost: 'O preço total, incluindo o custo do financiamento se houver.'
      },
      results: {
        hours: 'Horas de vida que custa',
        hourly: 'A sua tarifa real por hora'
      },
      resultNote: 'Nenhum dos dois valores é mais verdadeiro do que o outro. Só um está na unidade em que ela se paga de fato.',
      error: 'Informe um salário e um número de horas acima de zero: sem os dois não há taxa horária para converter.',
      action: 'Calcular',
      howItWorks: `Duas divisões, e é aí que está toda a ideia:

\`\`\`
tarifa real por hora = salário líquido mensal / horas de trabalho por mês
horas de vida        = preço / tarifa real por hora
\`\`\`

A parte interessante é a segunda entrada. Se você contar só as horas de contrato, a sua tarifa sai alta e tudo parece barato. Se contar o deslocamento, a formação, a roupa de trabalho e as duas horas de domingo à noite que você leva para deixar de pensar na segunda-feira, a tarifa cai e os números mudam de sentido. A segunda é a real.`,
      assumptions: `- É uma **conversão**, não uma previsão: não há pressupostos de mercado nem de inflação que possam falhar.
- A tarifa por hora usa o seu salário **líquido**, pelo que os impostos já estão descontados. Não inclui custos indiretos do emprego como transporte ou cuidado de crianças.
- Não inclui o **custo de oportunidade** da compra, que é uma segunda camada: 900 investidos a 7% durante vinte anos teriam sido cerca de 3.480. Para ver essa parte, use a calculadora de juros compostos.
- Não pretende dizer que você **não** deve comprar. Muitas compras continuam valendo a pena expressas em horas, e saber quais é exatamente o objetivo.`,
      faq: [
        {
          q: 'Quantas horas por mês devo informar?',
          a: 'As que você realmente dá ao trabalho. Uma semana de 40 horas são cerca de 168 por mês, mas se você se desloca uma hora por dia são 190, e se leva trabalho para casa, mais. Quanto mais honesto for esse número, mais útil é o resultado, porque é ele que converte o preço em tempo da sua vida.'
        },
        {
          q: 'Isto não é uma forma de nos sentirmos culpados por gastar?',
          a: 'Não é o objetivo, e usada assim funciona mal. A ideia original, de "Your Money or Your Life", é tornar visível uma troca normalmente invisível, para se poder escolhê-la. Uma compra de setenta e cinco horas que importa para você é uma boa compra. Uma de setenta e cinco horas que você esquece em um mês é a que este cálculo estava procurando.'
        },
        {
          q: 'E as compras que poupam tempo?',
          a: 'Aí o cálculo se inverte e vale bem a pena fazê-lo. Um eletrodoméstico de 400 que devolve duas horas por semana se paga em horas bem rápido. É o mesmo raciocínio aplicado ao outro lado, e é por isso que esta calculadora não é um argumento para gastar menos, mas para gastar em outra coisa.'
        },
        {
          q: 'O que introduzo fica guardado?',
          a: 'Não. O cálculo acontece inteiramente no seu navegador e nada é enviado para nenhum servidor. O seu salário não sai da sua tela.'
        }
      ]
    }
  }
];
