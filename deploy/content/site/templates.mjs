/**
 * The three Excel templates, as data, in three languages.
 *
 * The files themselves are not new - they have been downloadable from the home
 * page since the site launched, from three cards inside a 142 KB document. What
 * they never had is a page. "plantilla presupuesto personal excel gratis" is a
 * search with obvious intent and a specific expectation, and the only thing the
 * site could offer it was a home page about something else with the download
 * three screens down.
 *
 * So each template gets a page that explains what is inside the workbook, how
 * to fill it in, what it will and will not tell you, and where to go next -
 * plus the download itself, above everything else, because that is what the
 * reader came for. The home page cards stay exactly as they are and now link
 * here as well as to the file.
 *
 * Shape of a template:
 *   id       - stable key, and the order the three appear in.
 *   step     - where the template sits in the sequence. The three are designed
 *              to be used in order (observe, then track, then decide) and each
 *              page says so, because a reader who starts with the budget has
 *              nothing to budget from.
 *   sheets   - number of sheets in the workbook, shown as a fact. Checked
 *              against nothing: a wrong number here is a wrong number on the
 *              page, and the generator has no way to open an xlsx. All three
 *              workbooks hold exactly one sheet - read out of xl/workbook.xml
 *              on 2026-09-13, after the pages had been claiming three and two.
 *   glossary - terms to offer in the sidebar.
 *   nextRoutes - where the panel that the download reveals sends the reader:
 *              `primary` continues the sequence, `secondary` is something to
 *              try rather than something to read. Both are route keys resolved
 *              by generate-template-pages.mjs, which throws on one it does not
 *              recognise.
 *
 *              The routes sit here, in the table all three languages share,
 *              while the sentences that offer them sit in the language blocks
 *              below. A destination is a property of the template and has to be
 *              identical in every language; the sentence pointing at it is prose
 *              and cannot be. Splitting them this way is what stops one
 *              language's panel quietly routing somewhere the other two do not.
 *   <lang>   - name, slug, download filename, and the page's copy. `slug` is
 *              also the name of the file under /assets/templates/<lang>/, and
 *              generate-template-pages.mjs fails the build if the file is not
 *              there, so a renamed workbook cannot ship a dead download button.
 *              `next` is the panel the download reveals - one title, one
 *              paragraph and the two labels for the routes above. It is
 *              rendered into the page at build time rather than written in by
 *              script, so the panel's links carry real anchor text and are
 *              followed by a crawler; assets/js/template-next.js only unhides
 *              what is already there.
 *
 * `whatsInside` and `howToUse` are Markdown, rendered by scripts/markdown.mjs
 * and auto-linked to the glossary like any other prose on the site.
 */
export const TEMPLATES = [
  {
    id: 'monthly-analysis',
    step: 1,
    sheets: 1,
    glossary: ['net-worth', 'cash-flow', 'savings-rate'],
    // The balance sheet is step one, so the sequence is the obvious primary.
    // The Compass is the secondary because it reads back the same four figures
    // this workbook produces - income, outgoings, assets, debts.
    nextRoutes: { primary: 'expense-management', secondary: 'assessment' },
    es: {
      name: 'Análisis financiero personal mensual',
      slug: 'analisis-balance-mensual',
      download: 'Plantilla de Analisis del Balance Mensual.xlsx',
      title: 'Plantilla de análisis financiero mensual en Excel (gratis)',
      description: 'Plantilla de Excel gratuita para hacer el balance de tu mes: ingresos, gastos, activos y pasivos en una sola foto. Sin registro y sin dejar tu correo.',
      intro: 'Antes de presupuestar nada hace falta saber de dónde partes. Esta plantilla es el balance de tu economía: lo que entra, lo que sale, lo que tienes y lo que debes, en una sola hoja que rellenas una vez, con la forma de un mes normal, y que no vuelves a tocar hasta que algo cambie de verdad.',
      whatsInside: `- Un bloque de **patrimonio neto** arriba: activos, inversiones y ahorros menos lo que debes, en una sola cifra.
- El mes entero debajo, en la misma hoja: el ingreso neto de todas las fuentes, quince líneas de costes fijos, el gasto sin culpa, la inversión y las metas de ahorro.
- Una **banda de referencia** en cada bloque —50-60% de costes fijos, 20-35% de gasto sin culpa, 10% invertido, 5-10% a metas— y una columna de **porcentaje** que pone el tuyo al lado, que es la única comparación que viaja de una persona a otra.
- Fórmulas ya escritas: el patrimonio neto, el saldo que queda después de cada bloque y una línea final de **sobrante** que debería salir cerca de cero, porque la hoja está pensada para que todo el dinero de un mes normal tenga un sitio. La línea de misceláneos añade sola un 15% para lo que olvidaste.`,
      howToUse: `1. Rellénala con un mes **normal**, no con el último. En cada línea quieres la cifra más cercana a tu media: un mes con vacaciones o con una avería dentro describe un suceso, no tu economía.
2. Pon en los ingresos lo que **entra de verdad** en la cuenta, no el bruto de la nómina, y cuenta a todos los miembros de la casa y todas las fuentes.
3. Sé honesto con los costes fijos y no toques la línea de misceláneos: añade un 15% por encima para lo que olvidaste, y algo olvidaste.
4. Anota activos, inversiones, ahorros y deudas a valor de hoy. Un valor aproximado sirve: un patrimonio neto con un 2% de error te dice lo mismo.
5. Y ya está: **no se rellena otra vez el mes que viene**. Esto no es un registro mensual, es la foto de un mes normal, y sigue siendo verdad hasta que deje de serlo. Vuelves a ella cuando cambia algo de fondo: una subida de sueldo, una nueva fuente de ingresos, una inversión nueva, una herencia, un coste fijo nuevo, una compra grande que ya has decidido.`,
      // The panel the download reveals. See `nextRoutes` above for where
      // its two links go; these are only the words on them.
      next: {
        title: '¿Quieres la siguiente? En el paso 2 el gasto deja de ser una estimación.',
        body: 'Ya tienes la forma de un mes normal: lo que entra, lo que sale, lo que tienes y lo que debes. Lo que esa hoja no puede decirte es si el mes normal que acabas de describir es el que vives de verdad; para eso hace falta un mes real, anotado mientras ocurre, y de eso se encarga la plantilla de gestión de gastos. Y si te quedas un momento, el Freedom Compass te devuelve esas mismas cuatro cifras y te dice qué implican.',
        primaryLabel: 'Descargar el paso 2: Gestión de gastos',
        secondaryLabel: 'O hacer el Freedom Compass'
      },
      faq: [
        {
          q: '¿Necesito Excel para usarla?',
          a: 'No necesariamente. El archivo es .xlsx y funciona en Excel, pero también se abre en Google Sheets, en LibreOffice Calc y en Numbers. Las fórmulas son sumas, restas y porcentajes: nada que dependa de una función exclusiva de Microsoft.'
        },
        {
          q: '¿Se envían mis datos a algún sitio?',
          a: 'No. Es un archivo que descargas y que se queda en tu ordenador. No hay cuenta, no hay sincronización y no hay ningún servidor por medio: lo que escribas en la hoja no sale de tu equipo.'
        },
        {
          q: '¿Cada cuánto debería rellenarla?',
          a: 'Una vez, y después solo cuando algo cambie. Es la foto de un mes normal, no el registro de cada mes: la rellenas con tu media y sigue siendo válida hasta que una de sus cifras deja de serlo —una subida de sueldo, un coste fijo nuevo, otra fuente de ingresos, una compra grande que ya has decidido, una herencia—. Si no ha pasado nada de eso, rellenarla otra vez solo reproduce la misma hoja. Seguir un mes concreto mientras ocurre es lo que hace la plantilla de gestión de gastos.'
        }
      ]
    },
    en: {
      name: 'Monthly personal finances analysis',
      slug: 'monthly-balance-analysis',
      download: 'Monthly Balance Analysis Template.xlsx',
      title: 'Free monthly financial analysis Excel template',
      description: 'A free Excel template for taking stock of your month: income, spending, assets and liabilities in one picture. No signup, no email required.',
      intro: 'Before budgeting anything you need to know where you are starting from. This template is your balance sheet: what comes in, what goes out, what you own and what you owe, on a single sheet you fill in once for a normal month and then leave alone until something actually changes.',
      whatsInside: `- A **net worth** block at the top: assets, investments and savings minus what you owe, in one figure.
- The whole month underneath it, on the same sheet: net income from every source, fifteen fixed-cost lines, guilt-free spending, investing and savings goals.
- A **reference band** on each block - 50-60% fixed costs, 20-35% guilt-free, 10% invested, 5-10% to goals - and a **percentage** column that puts yours next to it, which is the only comparison that travels from one person to another.
- Formulas already written: net worth, the balance left after each block, and a final **left over** line that should come out near zero, because the sheet is built so that all of a normal month's money has somewhere to be. The miscellaneous line adds 15% by itself for whatever you forgot.`,
      howToUse: `1. Fill it in for a **normal** month, not for last month. The figure you want on each line is the one closest to your average: a month with a holiday or a broken boiler in it describes an event, not your finances.
2. Put in the income that **actually lands** in the account, not the gross figure on your payslip, and count every member of the household and every stream.
3. Be honest about the fixed costs, and leave the miscellaneous line alone: it adds 15% on top for what you forgot, and you did forget something.
4. Record assets, investments, savings and debts at today's value. An approximate figure is fine: a net worth that is 2% out tells you the same thing.
5. Then you are done - **you do not fill it in again next month**. This is not a monthly log, it is the picture of a normal month, and it stays true until it stops being true. You come back to it when something underneath it changes: a pay rise, a new income stream, a new investment, an inheritance, a new fixed cost, a big purchase you have already decided on.`,
      // The panel the download reveals. See `nextRoutes` above for where
      // its two links go; these are only the words on them.
      next: {
        title: 'Want the next one? Step 2 is where the spending stops being an estimate.',
        body: 'You now have the shape of a normal month: what comes in, what goes out, what you own and what you owe. What the sheet cannot tell you is whether the normal month you just described is the one you actually live — that takes a real month, recorded as it happens, and that is what the expense management template does. While you\'re here, the Freedom Compass reads those same four figures back and tells you what they imply.',
        primaryLabel: 'Get step 2: Expense management',
        secondaryLabel: 'Or take the Freedom Compass'
      },
      faq: [
        {
          q: 'Do I need Excel to use it?',
          a: 'Not necessarily. The file is an .xlsx and works in Excel, but it also opens in Google Sheets, LibreOffice Calc and Numbers. The formulas are sums, subtractions and percentages - nothing that depends on a Microsoft-only function.'
        },
        {
          q: 'Is my data sent anywhere?',
          a: 'No. It is a file you download and it stays on your computer. There is no account, no sync and no server involved: whatever you type into the sheet never leaves your machine.'
        },
        {
          q: 'How often should I fill it in?',
          a: 'Once, and after that only when something changes. It is the picture of a normal month rather than a log of each one: you fill it in with your average and it holds until one of its figures stops being true - a pay rise, a new fixed cost, another income stream, a big purchase you have committed to, an inheritance. If none of that has happened, filling it in again only reproduces the same sheet. Following one particular month as it happens is what the expense management template is for.'
        }
      ]
    },
    pt: {
      name: 'Análise financeira pessoal mensal',
      slug: 'analise-balanco-mensal',
      download: 'Modelo de Analise do Balanco Mensal.xlsx',
      title: 'Modelo de análise financeira mensal em Excel (grátis)',
      description: 'Modelo de Excel gratuito para fazer o balanço do seu mês: rendimentos, despesas, ativos e passivos numa única fotografia. Sem registro e sem deixar o seu e-mail.',
      intro: 'Antes de orçamentar qualquer coisa é preciso saber de onde você parte. Este modelo é o balanço da sua economia: o que entra, o que sai, o que você tem e o que você deve, em uma só planilha que você preenche uma vez, com o formato de um mês normal, e não volta a mexer até que algo mude de verdade.',
      whatsInside: `- Um bloco de **patrimônio líquido** no topo: ativos, investimentos e poupança menos o que você deve, em um único valor.
- O mês inteiro embaixo, na mesma planilha: a renda líquida de todas as fontes, quinze linhas de custos fixos, os gastos sem culpa, os investimentos e as metas de poupança.
- Uma **faixa de referência** em cada bloco —50-60% de custos fixos, 20-35% de gastos sem culpa, 10% investido, 5-10% para metas— e uma coluna de **porcentagem** que coloca a sua ao lado, que é a única comparação que viaja de uma pessoa para outra.
- Fórmulas já escritas: o patrimônio líquido, o saldo que sobra depois de cada bloco e uma linha final de **sobra** que deveria ficar perto de zero, porque a planilha foi feita para que todo o dinheiro de um mês normal tenha um lugar. A linha de diversos acrescenta sozinha 15% para o que você esqueceu.`,
      howToUse: `1. Preencha com um mês **normal**, não com o último. Em cada linha você quer o valor mais próximo da sua média: um mês com férias ou com um conserto dentro descreve um acontecimento, não a sua economia.
2. Coloque nos rendimentos o que **entra de fato** na conta, não o bruto do holerite, e conte todos os membros da casa e todas as fontes.
3. Seja honesto com os custos fixos e não mexa na linha de diversos: ela acrescenta 15% por cima para o que você esqueceu, e você esqueceu algo.
4. Registre ativos, investimentos, poupança e dívidas a valor de hoje. Um valor aproximado serve: um patrimônio líquido com 2% de erro diz a mesma coisa.
5. E pronto: **não se preenche de novo no mês seguinte**. Isto não é um registro mensal, é a fotografia de um mês normal, e continua verdadeiro até deixar de ser. Você volta a ela quando algo de fundo muda: um aumento, uma nova fonte de renda, um investimento novo, uma herança, um custo fixo novo, uma compra grande que você já decidiu.`,
      // The panel the download reveals. See `nextRoutes` above for where
      // its two links go; these are only the words on them.
      next: {
        title: 'Quer o próximo? No passo 2 a despesa deixa de ser uma estimativa.',
        body: 'Você já tem o formato de um mês normal: o que entra, o que sai, o que você tem e o que você deve. O que essa planilha não pode dizer é se o mês normal que você acabou de descrever é o que você vive de fato; para isso é preciso um mês real, anotado enquanto acontece, e disso cuida o modelo de gestão de despesas. E, se ficar um instante, o Freedom Compass devolve esses mesmos quatro números e diz o que eles implicam.',
        primaryLabel: 'Baixar o passo 2: Gestão de despesas',
        secondaryLabel: 'Ou fazer o Freedom Compass'
      },
      faq: [
        {
          q: 'Preciso do Excel para usar?',
          a: 'Não necessariamente. O arquivo é .xlsx e funciona no Excel, mas também abre no Google Sheets, no LibreOffice Calc e no Numbers. As fórmulas são soma, subtrações e porcentagens: nada que dependa de uma função exclusiva da Microsoft.'
        },
        {
          q: 'Os meus dados são enviados para algum lado?',
          a: 'Não. É um arquivo que você baixa e que fica no seu computador. Não há conta, não há sincronização e não há servidor pelo meio: o que você escrever na planilha não sai do seu computador.'
        },
        {
          q: 'Com que frequência devo preenchê-lo?',
          a: 'Uma vez, e depois só quando algo mudar. É a fotografia de um mês normal, não o registro de cada mês: você a preenche com a sua média e ela continua válida até que um dos seus números deixe de ser verdade — um aumento, um custo fixo novo, outra fonte de renda, uma compra grande que você já decidiu, uma herança. Se nada disso aconteceu, preencher de novo só reproduz a mesma planilha. Acompanhar um mês específico enquanto ele acontece é o que o modelo de gestão de despesas faz.'
        }
      ]
    }
  },
  {
    id: 'expense-management',
    step: 2,
    sheets: 1,
    glossary: ['cash-flow', 'lifestyle-creep', 'mental-accounting'],
    // Tracking leads to budgeting, and the Financial Decisions simulator is the
    // one that prices ordinary spending choices - which is what somebody who has
    // just categorised a month of them is thinking about.
    nextRoutes: { primary: 'personal-budget', secondary: 'simulator-hub' },
    es: {
      name: 'Gestión de gastos',
      slug: 'gestion-de-gastos',
      download: 'Plantilla de Gestion de Gastos.xlsx',
      title: 'Plantilla de Excel para controlar gastos (gratis)',
      description: 'Plantilla de Excel gratuita para registrar cada gasto durante 15 días o un mes y ver con datos adónde se va tu dinero. Sin registro y sin dejar tu correo.',
      intro: 'Casi nadie sabe en qué se gasta el dinero: sabe en qué cree que se lo gasta. Esta plantilla existe para cerrar esa distancia con un método incómodo y muy eficaz: anotarlo todo, sin excepciones, durante un periodo corto.',
      whatsInside: `- Una hoja de **registro diario**: fecha, concepto, categoría e importe. Una línea por gasto, incluido el café.
- Categorías precargadas y editables, con un **resumen automático** que ordena tus categorías de mayor a menor.
- Un contador de **gasto medio diario**, que es la cifra que suele sorprender más que el total.
- Espacio para marcar cada gasto como **necesario, útil o impulsivo**, que es donde el registro deja de ser contabilidad y empieza a ser información.`,
      howToUse: `1. Elige el periodo antes de empezar: 15 días si nunca lo has hecho, un mes completo si ya lo has intentado.
2. Anota en el momento, no al final del día. Lo que no se anota en el momento se olvida, y lo que se olvida es justo lo que buscabas.
3. No corrijas tu comportamiento durante el registro. Un mes falseado por las ganas de que salga bien no sirve para nada.
4. Al terminar, mira solo dos cosas: la categoría más grande y la suma de los impulsos.
5. Cambia **una** cosa. Una sola, la que más pese, y vuelve a medir el mes siguiente.`,
      // The panel the download reveals. See `nextRoutes` above for where
      // its two links go; these are only the words on them.
      next: {
        title: '¿Quieres la siguiente? El paso 3 convierte lo que anotas en una decisión.',
        body: 'Anotar te dice adónde fue el dinero. No te dice adónde debería ir, y eso es otro ejercicio con otra hoja: la plantilla de presupuesto personal es donde se fija la cifra antes del mes en lugar de después. Y si te quedas un momento, el simulador de Decisiones financieras te pone delante quince elecciones normales y te enseña lo que cuesta cada una en diez años, que es justo lo que una hoja del mes pasado no puede enseñarte.',
        primaryLabel: 'Descargar el paso 3: Presupuesto personal',
        secondaryLabel: 'O jugar al simulador de Decisiones financieras'
      },
      faq: [
        {
          q: '¿Quince días son suficientes?',
          a: 'Para ver los hábitos diarios, sí: los gastos pequeños y repetidos aparecen enseguida. Lo que quince días no capturan son los gastos irregulares —el seguro, la revisión del coche, el regalo de cumpleaños—, y por eso esta plantilla se usa junto con la de análisis mensual, que sí los recoge.'
        },
        {
          q: '¿No es más fácil usar una app del banco?',
          a: 'Es más cómodo, y por eso funciona peor. La app categoriza sola, así que el gasto pasa por delante de ti sin que tengas que mirarlo. Escribirlo a mano es lento a propósito: la fricción es el mecanismo, no un defecto de la plantilla.'
        },
        {
          q: '¿Qué hago con el resultado?',
          a: 'Nada durante una semana. Léelo, deja que te moleste y no tomes decisiones en caliente. Después elige un único cambio y dale un mes. Los presupuestos que se rehacen de arriba abajo en un día suelen durar exactamente ese día.'
        }
      ]
    },
    en: {
      name: 'Expense management',
      slug: 'expense-management',
      download: 'Expense Management Template.xlsx',
      title: 'Free expense tracking Excel template',
      description: 'A free Excel template for recording every expense for 15 days or a month, so you can see where your money actually goes. No signup, no email required.',
      intro: 'Almost nobody knows what they spend their money on: they know what they think they spend it on. This template exists to close that gap with an uncomfortable and very effective method - writing everything down, no exceptions, for a short period.',
      whatsInside: `- A **daily log**: date, description, category, amount. One line per expense, coffee included.
- Preloaded, editable categories with an **automatic summary** that ranks your categories from largest to smallest.
- An **average daily spend** counter, which is usually the figure that surprises people more than the total does.
- A column for marking each expense **necessary, useful or impulsive** - which is where the log stops being bookkeeping and starts being information.`,
      howToUse: `1. Choose the period before you start: 15 days if you have never done this, a full month if you have.
2. Log it at the time, not at the end of the day. What is not written down at the time is forgotten, and what is forgotten is exactly what you were looking for.
3. Do not correct your behavior while you are logging. A month distorted by wanting it to look good tells you nothing.
4. When it is over, look at only two things: the biggest category, and the total of the impulses.
5. Change **one** thing. One, the heaviest, and measure again next month.`,
      // The panel the download reveals. See `nextRoutes` above for where
      // its two links go; these are only the words on them.
      next: {
        title: 'Want the next one? Step 3 turns what you tracked into a decision.',
        body: 'Tracking tells you where the money went. It does not tell you where it should go instead, and that is a different exercise with a different workbook: the personal budget template is where the number is set before the month rather than after it. While you\'re here, the Financial Decisions simulator puts fifteen ordinary choices in front of you and shows what each one costs over a decade — which is exactly what a spreadsheet of last month cannot show.',
        primaryLabel: 'Get step 3: Personal budget',
        secondaryLabel: 'Or play the Financial Decisions simulator'
      },
      faq: [
        {
          q: 'Is 15 days enough?',
          a: 'For daily habits, yes: small repeated expenses show up almost immediately. What 15 days will not capture is the irregular spending - the insurance, the car repair, the birthday present - which is why this template is used alongside the monthly analysis one, which does pick those up.'
        },
        {
          q: 'Would a banking app not be easier?',
          a: 'It is more convenient, which is why it works less well. The app categorizes for you, so the expense passes by without you having to look at it. Writing it by hand is deliberately slow: the friction is the mechanism, not a shortcoming of the template.'
        },
        {
          q: 'What do I do with the result?',
          a: 'Nothing for a week. Read it, let it annoy you, and make no decisions while it stings. Then pick a single change and give it a month. Budgets rebuilt from scratch in one day tend to last exactly that day.'
        }
      ]
    },
    pt: {
      name: 'Gestão de despesas',
      slug: 'gestao-de-despesas',
      download: 'Modelo de Gestao de Despesas.xlsx',
      title: 'Modelo de Excel para controlar despesas (grátis)',
      description: 'Modelo de Excel gratuito para registrar todas as despesas durante 15 dias ou um mês e ver com dados para onde vai o seu dinheiro. Sem registro e sem deixar o seu e-mail.',
      intro: 'Quase ninguém sabe em que gasta o dinheiro: sabe em que acredita que o gasta. Este modelo existe para fechar essa distância com um método incômodo e muito eficaz: registrar tudo, sem exceções, durante um período curto.',
      whatsInside: `- Uma planilha de **registro diário**: data, descrição, categoria e valor. Uma linha por despesa, café incluído.
- Categorias pré-carregadas e editáveis, com um **resumo automático** que ordena as suas categorias da maior para a menor.
- Um contador de **despesa média diária**, que costuma surpreender mais do que o total.
- Espaço para marcar cada despesa como **necessária, útil ou impulsiva**, que é onde o registro deixa de ser contabilidade e passa a ser informação.`,
      howToUse: `1. Escolha o período antes de começar: 15 dias se você nunca fez isso, um mês completo se já tentou.
2. Registre no momento, não no fim do dia. O que não se registra na hora acaba esquecido, e o que se esquece é exatamente o que você procurava.
3. Não corrija o seu comportamento durante o registro. Um mês falseado pela vontade de que corra bem não serve para nada.
4. No fim, olhe só para duas coisas: a categoria maior e a soma dos impulsos.
5. Mude **uma** coisa. Uma só, a que mais pesa, e volte a medir no mês seguinte.`,
      // The panel the download reveals. See `nextRoutes` above for where
      // its two links go; these are only the words on them.
      next: {
        title: 'Quer o próximo? O passo 3 transforma o que você anota numa decisão.',
        body: 'Anotar diz para onde o dinheiro foi. Não diz para onde ele deveria ir, e isso é outro exercício com outra planilha: o modelo de orçamento pessoal é onde o número é definido antes do mês, e não depois. E, se ficar um instante, o simulador de Decisões Financeiras coloca quinze escolhas comuns na sua frente e mostra quanto cada uma custa em dez anos — exatamente o que uma planilha do mês passado não consegue mostrar.',
        primaryLabel: 'Baixar o passo 3: Orçamento pessoal',
        secondaryLabel: 'Ou jogar o simulador de Decisões Financeiras'
      },
      faq: [
        {
          q: 'Quinze dias são suficientes?',
          a: 'Para ver os hábitos diários, sim: as despesas pequenas e repetidas aparecem quase de imediato. O que quinze dias não captam são as despesas irregulares —o seguro, a revisão do carro, o presente de aniversário—, e é por isso que este modelo se usa junto com o da análise mensal, que as captura.'
        },
        {
          q: 'Não é mais fácil usar um app do banco?',
          a: 'É mais cômodo, e é por isso que funciona pior. O app categoriza sozinho, então a despesa passa na sua frente sem que você tenha de olhar para ela. Escrever à mão é lento de propósito: a fricção é o mecanismo, não um defeito do modelo.'
        },
        {
          q: 'O que faço com o resultado?',
          a: 'Nada durante uma semana. Leia, deixe que incomode e não tome decisões a quente. Depois escolha uma única mudança e dê a ela um mês. Os orçamentos refeitos de cima a baixo num dia costumam durar exatamente esse dia.'
        }
      ]
    }
  },
  {
    id: 'personal-budget',
    step: 3,
    sheets: 1,
    glossary: ['savings-rate', 'pay-yourself-first', 'opportunity-cost'],
    // The last workbook, so there is no next one to offer. The Freedom Calendar
    // takes over instead: the sequence ends with a savings rate, and a savings
    // rate is only interesting once it has been turned into a date.
    nextRoutes: { primary: 'freedom-calendar', secondary: 'assessment' },
    es: {
      name: 'Presupuesto personal',
      slug: 'presupuesto-personal',
      download: 'Plantilla de Presupuesto Personal.xlsx',
      title: 'Plantilla de presupuesto personal en Excel (gratis)',
      description: 'Plantilla de Excel gratuita para comparar la distribución real de tu dinero con el presupuesto que quieres tener. Sin registro y sin dejar tu correo.',
      intro: 'Un presupuesto no es una lista de prohibiciones: es una decisión tomada con antelación sobre a qué quieres que se parezca tu mes. Esta plantilla pone las dos columnas al lado —lo que hiciste y lo que querías hacer— y calcula la distancia.',
      whatsInside: `- Una hoja de **presupuesto por categorías** con dos columnas, *real* y *objetivo*, y la desviación calculada entre ambas.
- Un reparto **porcentual** automático, para que puedas comparar tu mes con reglas conocidas como el 50/30/20 sin tener que creerte ninguna.
- Una línea de **ahorro como primera partida**, arriba y no al final, que es la única diferencia estructural entre un presupuesto que ahorra y uno que no.
- Un resumen de **tasa de ahorro** del mes.`,
      howToUse: `1. Rellena primero la columna *real* con datos, no con intenciones: sácalos de la plantilla de gestión de gastos o del extracto.
2. Fija tu ahorro como una **partida fija** en la parte de arriba, antes de repartir el resto. Si sobra al final, no ahorras: ahorras si lo apartas primero.
3. Rellena la columna *objetivo* sin heroísmos. Un presupuesto que exige un mes perfecto se abandona en la segunda semana.
4. Mira solo las tres desviaciones mayores. El resto es ruido.
5. Revísalo una vez al mes, no una vez al año. Un presupuesto es un documento vivo o es un documento muerto.`,
      // The panel the download reveals. See `nextRoutes` above for where
      // its two links go; these are only the words on them.
      next: {
        title: 'Ya tienes las tres. Ahora mira a cuánto suman.',
        body: 'Observar, anotar, decidir: las tres plantillas son una secuencia y esta es el final. Lo que ninguna de ellas puede contarte es lo único que de verdad quieres saber: cuándo esto deja de ser un presupuesto y se convierte en no necesitar la nómina. Eso es una pregunta sobre el tiempo, y para eso está el Calendario de la Libertad: convierte una tasa de ahorro en una fecha, y te enseña qué le hace a esa fecha mover la tasa.',
        primaryLabel: 'Abrir el Calendario de la Libertad',
        secondaryLabel: 'O hacer el Freedom Compass'
      },
      faq: [
        {
          q: '¿Vale la regla 50/30/20?',
          a: 'Como punto de partida, sí; como norma, no. Es una referencia razonable para quien no tiene ninguna, y deja de tener sentido en cuanto tu vivienda se come el 45 % de tus ingresos o cuando tu situación no se parece a la de quien inventó la regla. La plantilla calcula tus porcentajes reales para que decidas con los tuyos, no con los de nadie más.'
        },
        {
          q: '¿Por qué el ahorro va arriba?',
          a: 'Porque el ahorro que se deja para el final es el que no ocurre. Tratarlo como una factura más —una que se paga la primera— es el único cambio del método que funciona por sí solo, sin necesidad de más disciplina el resto del mes.'
        },
        {
          q: '¿Y si mis ingresos son irregulares?',
          a: 'Presupuesta sobre tu mes más flojo de los últimos doce, no sobre la media. Los meses buenos van a un colchón, y del colchón sale la nómina de los flojos. Es más trabajo al principio y evita el ciclo de exceso y recorte que vacía cualquier presupuesto variable.'
        }
      ]
    },
    en: {
      name: 'Personal budget',
      slug: 'personal-budget',
      download: 'Personal Budget Template.xlsx',
      title: 'Free personal budget Excel template',
      description: 'A free Excel template for comparing where your money actually goes with the budget you want to have. No signup, no email required.',
      intro: 'A budget is not a list of prohibitions: it is a decision made in advance about what you want your month to look like. This template puts the two columns side by side - what you did and what you meant to do - and works out the distance.',
      whatsInside: `- A **category budget** sheet with two columns, *actual* and *target*, and the variance between them calculated for you.
- An automatic **percentage** split, so you can compare your month against well-known rules like 50/30/20 without having to believe any of them.
- A **savings-first** line at the top rather than at the bottom, which is the only structural difference between a budget that saves and one that does not.
- A monthly **savings rate** summary.`,
      howToUse: `1. Fill in the *actual* column first, with data rather than intentions: take it from the expense tracking template or from your statement.
2. Set your saving as a **fixed line** at the top, before allocating anything else. If it is whatever is left over, you are not saving; you save by moving it first.
3. Fill in the *target* column without heroics. A budget that requires a perfect month gets abandoned in week two.
4. Look at only the three largest variances. The rest is noise.
5. Review it monthly, not annually. A budget is either a living document or a dead one.`,
      // The panel the download reveals. See `nextRoutes` above for where
      // its two links go; these are only the words on them.
      next: {
        title: 'That\'s all three. Now see what they add up to.',
        body: 'Observe, track, decide — the three workbooks are a sequence and this is the end of it. What none of them can tell you is the only thing you really want to know: when this stops being a budget and becomes not needing the salary. That is a question about time, and the Freedom Calendar is the tool for it — it turns a savings rate into a date, and shows what moving the rate does to the date.',
        primaryLabel: 'Open the Freedom Calendar',
        secondaryLabel: 'Or take the Freedom Compass'
      },
      faq: [
        {
          q: 'Is the 50/30/20 rule any good?',
          a: 'As a starting point, yes; as a rule, no. It is a reasonable reference for somebody who has none, and it stops making sense the moment housing takes 45% of your income, or when your situation looks nothing like that of the person who coined it. The template works out your real percentages so you can decide using yours rather than somebody else’s.'
        },
        {
          q: 'Why does saving go at the top?',
          a: 'Because saving left until the end is the saving that does not happen. Treating it as one more bill - one that gets paid first - is the single change in the method that works on its own, without requiring more discipline for the rest of the month.'
        },
        {
          q: 'What if my income is irregular?',
          a: 'Budget on your weakest month of the last twelve, not on the average. Good months feed a buffer, and the buffer pays the salary in the weak ones. It is more work upfront and it avoids the boom-and-cut cycle that empties every variable-income budget.'
        }
      ]
    },
    pt: {
      name: 'Orçamento pessoal',
      slug: 'orcamento-pessoal',
      download: 'Modelo de Orcamento Pessoal.xlsx',
      title: 'Modelo de orçamento pessoal em Excel (grátis)',
      description: 'Modelo de Excel gratuito para comparar a distribuição real do seu dinheiro com o orçamento que quer ter. Sem registro e sem deixar o seu e-mail.',
      intro: 'Um orçamento não é uma lista de proibições: é uma decisão tomada com antecedência sobre com o que você quer que o seu mês se pareça. Este modelo põe as duas colunas lado a lado —o que você fez e o que queria fazer— e calcula a distância.',
      whatsInside: `- Uma planilha de **orçamento por categorias** com duas colunas, *real* e *objetivo*, e o desvio calculado entre ambas.
- Uma distribuição **percentual** automática, para você comparar o seu mês com regras conhecidas como a 50/30/20 sem ter de acreditar em nenhuma.
- Uma linha de **poupança como primeiro item**, no topo e não no fim, que é a única diferença estrutural entre um orçamento que poupa e um que não.
- Um resumo da **taxa de poupança** do mês.`,
      howToUse: `1. Preencha primeiro a coluna *real* com dados, não com intenções: tire-os do modelo de gestão de despesas ou do extrato.
2. Fixe a sua poupança como um **item fixo** no topo, antes de distribuir o resto. Se ela for o que sobra no fim, você não poupa: você poupa se separá-la primeiro.
3. Preencha a coluna *objetivo* sem heroísmos. Um orçamento que exige um mês perfeito é abandonado na segunda semana.
4. Olhe apenas para os três maiores desvios. O resto é ruído.
5. Revise-o uma vez por mês, não uma vez por ano. Um orçamento é um documento vivo ou é um documento morto.`,
      // The panel the download reveals. See `nextRoutes` above for where
      // its two links go; these are only the words on them.
      next: {
        title: 'Você já tem os três. Agora veja quanto eles somam.',
        body: 'Observar, anotar, decidir: os três modelos são uma sequência e este é o fim dela. O que nenhum deles consegue contar é a única coisa que você realmente quer saber: quando isto deixa de ser um orçamento e passa a ser não precisar do salário. Essa é uma pergunta sobre tempo, e é para isso que existe o Calendário da Liberdade — ele transforma uma taxa de poupança numa data, e mostra o que mexer na taxa faz com a data.',
        primaryLabel: 'Abrir o Calendário da Liberdade',
        secondaryLabel: 'Ou fazer o Freedom Compass'
      },
      faq: [
        {
          q: 'A regra 50/30/20 serve?',
          a: 'Como ponto de partida, sim; como norma, não. É uma referência razoável para quem não tem nenhuma, e deixa de fazer sentido no momento em que a moradia consome 45% da sua renda, ou quando a sua situação não se parece nada com a de quem inventou a regra. O modelo calcula as suas porcentagens reais para você decidir com as suas e não com as de outra pessoa.'
        },
        {
          q: 'Por que a poupança vai no topo?',
          a: 'Porque a poupança deixada para o fim é a que não acontece. Tratá-la como mais uma fatura —uma que se paga primeiro— é a única mudança do método que funciona por si só, sem exigir mais disciplina no resto do mês.'
        },
        {
          q: 'E se os meus rendimentos forem irregulares?',
          a: 'Faça o orçamento com base no seu mês mais fraco dos últimos doze, não na média. Os meses bons alimentam um colchão, e é do colchão que sai o salário dos meses fracos. Dá mais trabalho no início e evita o ciclo de excesso e corte que esvazia qualquer orçamento variável.'
        }
      ]
    }
  }
];
