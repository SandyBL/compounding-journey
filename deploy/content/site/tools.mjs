/**
 * The three calculators, as data, in three languages.
 *
 * These calculators already existed - inside content/home/index.html, as three
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
      intro: 'Introduce lo que tienes hoy, lo que puedes aportar cada mes y los años que le vas a dar. La calculadora te muestra cuánto habrás puesto tú y cuánto habrá puesto el tiempo.',
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
- No incluye **comisiones ni impuestos**. Restar el coste de tu fondo de la rentabilidad que introduces es la forma rápida de aproximarlo.
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
          q: '¿Guardáis los datos que introduzco?',
          a: 'No. El cálculo entero ocurre en tu navegador con JavaScript; nada se envía a ningún servidor y nada se almacena. Puedes comprobarlo desactivando la red y usando la calculadora igualmente.'
        }
      ]
    },
    en: {
      name: 'Compound interest calculator',
      slug: 'compound-interest',
      title: 'Compound interest calculator',
      description: 'Work out how much your money will grow with monthly contributions and an annual return. Free, no sign-up, and the maths runs in your own browser.',
      intro: 'Enter what you have today, what you can add each month, and how many years you will give it. The calculator shows how much you put in and how much time put in.',
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
      howItWorks: `The calculator compounds month by month. Each month it multiplies the balance by the monthly return — the annual figure divided by twelve — and then adds your contribution:

\`\`\`
balance = balance × (1 + annual return / 12) + contribution
\`\`\`

Repeated once for every month in your horizon. The figure shown as "generated by compounding" is simply the final value minus everything you put in, and it is the part you would not have had by leaving the money still.`,
      assumptions: `- The return is applied **constantly**. In reality there are +25% years and −18% years, and the order they arrive in matters.
- The figures are **nominal**: they do not subtract inflation. At 2.5% inflation, $100,000 in thirty years buys what about $48,000 buys today.
- It excludes **fees and tax**. Subtracting your fund's cost from the return you enter is the quick way to approximate them.
- It assumes you **withdraw nothing** over the whole period. A withdrawal partway through breaks the effect being measured.`,
      faq: [
        {
          q: 'What annual return should I use?',
          a: 'It depends what you invest in, and nobody can know it in advance. As a historical reference, a global equity portfolio has run around 7–8% nominal a year over very long periods, and a mixed portfolio with bonds considerably less. The useful move is not guessing the right figure but trying three — pessimistic, middling and optimistic — and checking whether your plan still stands up under the pessimistic one.'
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
      description: 'Calcula quanto o teu dinheiro vai crescer com reforços mensais e uma rentabilidade anual. Grátis, sem registo e com o cálculo no teu próprio navegador.',
      intro: 'Introduz o que tens hoje, o que consegues reforçar cada mês e os anos que lhe vais dar. A calculadora mostra quanto puseste tu e quanto pôs o tempo.',
      labels: {
        initial: 'Capital inicial',
        monthly: 'Reforço mensal',
        years: 'Anos de investimento',
        rate: 'Rentabilidade anual estimada (%)'
      },
      hints: {
        initial: 'O que já tens poupado para investir. Pode ser zero.',
        monthly: 'O valor que consegues reforçar todos os meses sem falhar.',
        years: 'O horizonte. É a variável mais poderosa das quatro.',
        rate: 'Uma carteira global diversificada rondou os 7 % ao ano no longo prazo, antes de inflação e comissões.'
      },
      results: {
        total: 'Valor final estimado',
        invested: 'Total que reforçaste',
        interest: 'Gerado pelos juros compostos'
      },
      resultNote: 'Uma estimativa, não uma previsão: os mercados não entregam a mesma rentabilidade todos os anos.',
      action: 'Calcular',
      howItWorks: `A calculadora capitaliza mês a mês. Cada mês multiplica o saldo pela rentabilidade mensal — a anual dividida por doze — e depois soma o teu reforço:

\`\`\`
saldo = saldo × (1 + rentabilidade anual / 12) + reforço
\`\`\`

Repetido tantas vezes quantos meses tiver o teu horizonte. O número que aparece como "gerado pelos juros compostos" é simplesmente o valor final menos tudo o que puseste tu, e é a parte que não terias deixando o dinheiro parado.`,
      assumptions: `- A rentabilidade é aplicada de forma **constante**. Na realidade há anos de +25 % e anos de −18 %, e a ordem em que chegam importa.
- Os valores são **nominais**: não descontam a inflação. Com inflação de 2,5 %, 100.000 a trinta anos compram o que hoje compram cerca de 48.000.
- Não inclui **comissões nem impostos**. Subtrair o custo do teu fundo à rentabilidade que introduzes é a forma rápida de os aproximar.
- Pressupõe que **não retiras nada** durante todo o período. Uma retirada pelo meio quebra o efeito que se está a medir.`,
      faq: [
        {
          q: 'Que rentabilidade anual devo usar?',
          a: 'Depende de onde investes, e ninguém o pode saber de antemão. Como referência histórica, uma carteira global de ações rondou os 7-8 % nominais por ano em períodos muito longos, e uma carteira mista com obrigações bastante menos. O mais útil não é acertar no número, mas testar três: um pessimista, um médio e um otimista, e ver se o teu plano continua de pé com o pessimista.'
        },
        {
          q: 'Porque é que o resultado muda tanto quando acrescento cinco anos?',
          a: 'Porque o crescimento não é linear. Os últimos anos trabalham sobre o saldo maior, pelo que contribuem muito mais do que os primeiros. É por isso que começar mais cedo vale mais do que reforçar mais: um ano de atraso não te tira o primeiro ano, tira-te o último.'
        },
        {
          q: 'Os resultados descontam a inflação?',
          a: 'Não. São valores nominais. Para pensar em poder de compra de hoje, subtrai a tua expectativa de inflação à rentabilidade que introduzes: 7 % com inflação de 2,5 % equivale a cerca de 4,5 % real. O resultado fica então já em euros de hoje.'
        },
        {
          q: 'Guardam os dados que introduzo?',
          a: 'Não. Todo o cálculo acontece no teu navegador em JavaScript; nada é enviado para um servidor e nada é armazenado. Podes confirmá-lo desligando a rede e usando a calculadora de igual modo.'
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
      intro: 'Dinos a qué edad quieres tener la opción de dejar de trabajar y con qué ingreso mensual. Te devolvemos el número y lo que costaría al mes llegar hasta él.',
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
      intro: 'Tell us the age you want the option to stop working, and the monthly income you would need. We give you the number and what reaching it costs per month.',
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
          a: 'Probably not — it is telling you something real. There are three levers and all of them work. Moving the target age by a few years changes the result a lot, because it adds years of compounding. Lowering the desired income lowers the target proportionally. And if you already hold assets, the real figure is lower than the one shown, because this calculation starts from zero.'
        },
        {
          q: 'Does it account for a state pension?',
          a: 'No, which makes the number conservative if you expect to receive one. A simple way to fold it in is to subtract your estimated monthly pension from the desired income before entering it — bearing in mind a state pension arrives at the statutory age, not at your target age.'
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
      description: 'Descobre quanto património precisas para viver dos teus investimentos e quanto terias de poupar por mês para chegar a esse valor.',
      intro: 'Diz-nos com que idade queres ter a opção de deixar de trabalhar e com que rendimento mensal. Devolvemos-te o número e quanto custaria por mês chegar até ele.',
      labels: {
        currentAge: 'A tua idade atual',
        targetAge: 'Idade objetivo',
        desiredIncome: 'Rendimento mensal desejado'
      },
      hints: {
        currentAge: 'O ponto de partida. Define quantos anos os juros compostos têm para trabalhar.',
        targetAge: 'A idade a partir da qual trabalhar passa a ser opcional e não obrigatório.',
        desiredIncome: 'O que precisarias por mês, em euros de hoje, para cobrir a tua vida.'
      },
      results: {
        target: 'Património objetivo',
        years: 'Anos que te restam',
        savings: 'Reforço mensal necessário'
      },
      resultNote: 'Calculado com a regra dos 4 % e uma rentabilidade real de 8 % ao ano. Mudar esses pressupostos muda muito o número: os limites estão explicados abaixo.',
      action: 'Calcular',
      howItWorks: `São dois passos. O primeiro dimensiona o objetivo com a regra dos 4 %, que invertida é a "regra dos 300": se podes retirar 4 % por ano, precisas de 300 vezes a tua despesa mensal.

\`\`\`
património objetivo = rendimento mensal desejado × 300
\`\`\`

O segundo calcula o reforço mensal que chega a esse valor nos anos que te restam, com uma rentabilidade anual de 8 %, usando a fórmula padrão de pagamento periódico:

\`\`\`
reforço = objetivo × r / ((1 + r)^n − 1)      r = 0,08 / 12    n = anos × 12
\`\`\`

Note-se o que **não** faz: não conta o que já tens poupado. O valor devolvido é o reforço necessário partindo de zero, pelo que se já tens património o teu reforço real é menor.`,
      assumptions: `- Usa a **regra dos 4 %**, que vem de um estudo sobre trinta anos de mercados americanos do século XX. Para uma reforma de cinquenta anos, ou com comissões altas, a taxa segura é menor e o património necessário maior.
- Pressupõe uma rentabilidade de **8 % ao ano constante**. É otimista para uma carteira mista e não contempla o risco de sequência: uma fase má precisamente quando começas a retirar muda o resultado por completo.
- **Não inclui o teu património atual**, nem pensão pública, nem heranças, nem rendimentos futuros distintos do trabalho.
- Tudo está em **euros de hoje**: não ajusta nem o objetivo nem o reforço pela inflação ao longo do caminho.
- Ignora **impostos**, que na fase de retirada podem ser uma parte relevante da despesa real.`,
      faq: [
        {
          q: 'Porque é que multiplica por 300?',
          a: 'Porque 300 é o inverso mensal dos 4 % anuais: se retiras 4 % do teu património por ano, isso são doze mensalidades, e 12 / 0,04 = 300. É a forma rápida de converter uma despesa mensal no património que a sustenta.'
        },
        {
          q: 'O reforço mensal sai altíssimo. Está errado?',
          a: 'Provavelmente não: está a dizer-te algo real. Há três alavancas e todas funcionam. Mover a idade objetivo alguns anos muda muito o resultado, porque acrescenta anos de capitalização. Baixar o rendimento desejado baixa o objetivo de forma proporcional. E se já tens património, o valor real é menor do que o que vês, porque este cálculo parte de zero.'
        },
        {
          q: 'Conta com a minha pensão pública?',
          a: 'Não, e isso torna o número conservador se esperas recebê-la. Uma forma simples de a incorporar é subtrair a pensão mensal estimada ao rendimento desejado antes de o introduzir, tendo em conta que a pensão chega à idade legal e não à tua idade objetivo.'
        },
        {
          q: 'Isto é uma recomendação sobre quanto devo poupar?',
          a: 'Não. É uma calculadora educativa que aplica duas fórmulas públicas aos números que lhe dás. Não conhece a tua situação, a tua estabilidade laboral, as tuas dívidas nem a tua tolerância ao risco, e não pode recomendar-te nenhum produto nem nenhuma estratégia. Para isso é necessário um profissional registado que analise o teu caso.'
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
      intro: 'El dinero es tiempo intercambiado. Introduce tu sueldo, tus horas reales de trabajo y el precio de algo que estés considerando, y verás lo que cuesta en la única moneda que no se recupera.',
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
      resultNote: 'Ninguna de las dos cifras es más verdadera que la otra. Sólo una está en la unidad en la que se paga de verdad.',
      error: 'Introduce un salario y unas horas mayores que cero: sin esos dos números no hay tarifa por hora que convertir.',
      action: 'Calcular',
      howItWorks: `Dos divisiones, y ahí está toda la idea:

\`\`\`
tarifa real por hora = sueldo neto mensual / horas de trabajo al mes
horas de vida        = precio / tarifa real por hora
\`\`\`

La parte interesante es la segunda entrada. Si cuentas sólo las horas de contrato, tu tarifa sale alta y todo parece barato. Si cuentas el desplazamiento, la formación, la ropa de trabajo y las dos horas del domingo por la noche que tardas en dejar de pensar en el lunes, la tarifa baja y las cifras cambian de sentido. La segunda es la real.`,
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
      description: 'Convert the price of any purchase into the hours of work it costs. A different — and more honest — way to look at spending.',
      intro: 'Money is traded time. Enter your pay, your real working hours and the price of something you are considering, and see what it costs in the one currency you cannot get back.',
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
      description: 'Converte o preço de qualquer compra nas horas de trabalho que custa. Uma forma diferente — e mais honesta — de olhar para uma despesa.',
      intro: 'O dinheiro é tempo trocado. Introduz o teu salário, as tuas horas reais de trabalho e o preço de algo que estejas a considerar, e vê o que custa na única moeda que não se recupera.',
      labels: {
        monthlySalary: 'Salário líquido mensal',
        monthlyHours: 'Horas de trabalho por mês',
        purchaseCost: 'Preço da compra'
      },
      hints: {
        monthlySalary: 'O que te chega à conta, não o que diz o contrato.',
        monthlyHours: 'Inclui deslocações, formação e o tempo que levas a desligar. 168 são cerca de 40 horas por semana.',
        purchaseCost: 'O preço total, incluindo o custo do financiamento se houver.'
      },
      results: {
        hours: 'Horas de vida que custa',
        hourly: 'A tua tarifa real por hora'
      },
      resultNote: 'Nenhum dos dois valores é mais verdadeiro do que o outro. Só um está na unidade em que se paga de facto.',
      error: 'Introduz um salário e um número de horas acima de zero: sem os dois não há taxa horária para converter.',
      action: 'Calcular',
      howItWorks: `Duas divisões, e é aí que está toda a ideia:

\`\`\`
tarifa real por hora = salário líquido mensal / horas de trabalho por mês
horas de vida        = preço / tarifa real por hora
\`\`\`

A parte interessante é a segunda entrada. Se contares só as horas de contrato, a tua tarifa sai alta e tudo parece barato. Se contares a deslocação, a formação, a roupa de trabalho e as duas horas de domingo à noite que levas a deixar de pensar na segunda-feira, a tarifa desce e os números mudam de sentido. A segunda é a real.`,
      assumptions: `- É uma **conversão**, não uma previsão: não há pressupostos de mercado nem de inflação que possam falhar.
- A tarifa por hora usa o teu salário **líquido**, pelo que os impostos já estão descontados. Não inclui custos indiretos do emprego como transporte ou cuidado de crianças.
- Não inclui o **custo de oportunidade** da compra, que é uma segunda camada: 900 investidos a 7 % durante vinte anos teriam sido cerca de 3.480. Para ver essa parte, usa a calculadora de juros compostos.
- Não pretende dizer-te que **não** compres. Muitas compras continuam a valer a pena expressas em horas, e saber quais é exatamente o objetivo.`,
      faq: [
        {
          q: 'Quantas horas por mês devo introduzir?',
          a: 'As que realmente dás ao trabalho. Uma semana de 40 horas são cerca de 168 por mês, mas se te deslocas uma hora por dia são 190, e se levas trabalho para casa, mais. Quanto mais honesto for esse número, mais útil é o resultado, porque é ele que converte o preço em tempo da tua vida.'
        },
        {
          q: 'Isto não é uma forma de nos sentirmos culpados por gastar?',
          a: 'Não é o objetivo, e usada assim funciona mal. A ideia original, de "Your Money or Your Life", é tornar visível uma troca normalmente invisível, para se poder escolhê-la. Uma compra de setenta e cinco horas que te importa é uma boa compra. Uma de setenta e cinco horas que esqueces num mês é a que este cálculo estava a procurar.'
        },
        {
          q: 'E as compras que poupam tempo?',
          a: 'Aí o cálculo inverte-se e vale bem a pena fazê-lo. Um eletrodoméstico de 400 que te devolve duas horas por semana paga-se em horas bastante depressa. É o mesmo raciocínio aplicado ao outro lado, e é por isso que esta calculadora não é um argumento para gastar menos, mas para gastar noutra coisa.'
        },
        {
          q: 'O que introduzo fica guardado?',
          a: 'Não. O cálculo acontece inteiramente no teu navegador e nada é enviado para nenhum servidor. O teu salário não sai do teu ecrã.'
        }
      ]
    }
  }
];
