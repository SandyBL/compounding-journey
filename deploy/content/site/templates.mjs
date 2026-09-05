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
 *              page, and the generator has no way to open an xlsx.
 *   glossary - terms to offer in the sidebar.
 *   <lang>   - name, slug, download filename, and the page's copy. `slug` is
 *              also the name of the file under /assets/templates/<lang>/, and
 *              generate-template-pages.mjs fails the build if the file is not
 *              there, so a renamed workbook cannot ship a dead download button.
 *
 * `whatsInside` and `howToUse` are Markdown, rendered by scripts/markdown.mjs
 * and auto-linked to the glossary like any other prose on the site.
 */
export const TEMPLATES = [
  {
    id: 'monthly-analysis',
    step: 1,
    sheets: 3,
    glossary: ['net-worth', 'cash-flow', 'savings-rate'],
    es: {
      name: 'Análisis financiero personal mensual',
      slug: 'analisis-balance-mensual',
      download: 'Plantilla de Analisis del Balance Mensual.xlsx',
      title: 'Plantilla de análisis financiero mensual en Excel (gratis)',
      description: 'Plantilla de Excel gratuita para hacer el balance de tu mes: ingresos, gastos, activos y pasivos en una sola foto. Sin registro y sin dejar tu correo.',
      intro: 'Antes de presupuestar nada hace falta saber de dónde partes. Esta plantilla es el balance de tu economía: lo que entra, lo que sale, lo que tienes y lo que debes, en una sola hoja que puedes repetir cada mes.',
      whatsInside: `- Una hoja de **ingresos y gastos** del mes, separada por categorías, que termina en una única cifra: cuánto te has quedado.
- Una hoja de **activos y pasivos** —cuentas, inversiones, propiedades, deudas— que calcula tu patrimonio neto.
- Una hoja de **evolución** donde cada mes es una fila, para que la comparación entre meses la haga la hoja y no tu memoria.
- Fórmulas ya escritas: la tasa de ahorro del mes y el patrimonio neto se calculan solos.`,
      howToUse: `1. Elige un mes cerrado, no el que está en curso. Los meses a medias siempre parecen mejores de lo que son.
2. Rellena los ingresos con lo que **entró de verdad** en la cuenta, no con el bruto de la nómina.
3. Vuelca los gastos desde el extracto bancario, no de memoria. Si una categoría te da vergüenza, esa es exactamente la que hay que anotar.
4. Anota activos y pasivos a día de cierre. Un valor aproximado sirve; lo importante es usar el mismo criterio todos los meses.
5. Repítelo el mes siguiente en una fila nueva. Tres meses son suficientes para ver una tendencia; uno solo es una anécdota.`,
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
          a: 'Una vez al mes, el mismo día aproximadamente. La utilidad no está en la foto de un mes, sino en la serie: doce filas dicen mucho más que una, y la disciplina de una fecha fija es lo que hace que existan las doce.'
        }
      ]
    },
    en: {
      name: 'Monthly personal finances analysis',
      slug: 'monthly-balance-analysis',
      download: 'Monthly Balance Analysis Template.xlsx',
      title: 'Free monthly financial analysis Excel template',
      description: 'A free Excel template for taking stock of your month: income, spending, assets and liabilities in one picture. No signup, no email required.',
      intro: 'Before budgeting anything you need to know where you are starting from. This template is your balance sheet: what came in, what went out, what you own and what you owe, on one sheet you can repeat every month.',
      whatsInside: `- An **income and spending** sheet for the month, split by category, ending in a single figure: what you actually kept.
- An **assets and liabilities** sheet - accounts, investments, property, debts - that works out your net worth.
- A **history** sheet where each month is a row, so the comparison between months is done by the spreadsheet rather than by your memory.
- Formulas already written: the month's savings rate and your net worth calculate themselves.`,
      howToUse: `1. Pick a month that has already ended, not the one you are in. Half-finished months always look better than they are.
2. Fill in income with what **actually landed** in the account, not the gross figure on your payslip.
3. Copy spending from the bank statement, not from memory. If a category is embarrassing, that is precisely the one to write down.
4. Record assets and liabilities as at the closing date. An approximate value is fine; using the same basis every month is what matters.
5. Do it again next month in a new row. Three months is enough to see a trend; one month is an anecdote.`,
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
          a: 'Once a month, on roughly the same day. The value is not in one month’s snapshot but in the series: twelve rows say far more than one, and a fixed date is what makes the twelve happen.'
        }
      ]
    },
    pt: {
      name: 'Análise financeira pessoal mensal',
      slug: 'analise-balanco-mensal',
      download: 'Modelo de Analise do Balanco Mensal.xlsx',
      title: 'Modelo de análise financeira mensal em Excel (grátis)',
      description: 'Modelo de Excel gratuito para fazer o balanço do teu mês: rendimentos, despesas, ativos e passivos numa única fotografia. Sem registo e sem deixar o teu email.',
      intro: 'Antes de orçamentar qualquer coisa é preciso saber de onde partes. Este modelo é o balanço da tua economia: o que entra, o que sai, o que tens e o que deves, numa só folha que podes repetir todos os meses.',
      whatsInside: `- Uma folha de **rendimentos e despesas** do mês, separada por categorias, que termina num único valor: quanto te sobrou.
- Uma folha de **ativos e passivos** —contas, investimentos, imóveis, dívidas— que calcula o teu património líquido.
- Uma folha de **evolução** onde cada mês é uma linha, para que a comparação entre meses seja feita pela folha e não pela tua memória.
- Fórmulas já escritas: a taxa de poupança do mês e o património líquido calculam-se sozinhos.`,
      howToUse: `1. Escolhe um mês já fechado, não o que está a correr. Os meses a meio parecem sempre melhores do que são.
2. Preenche os rendimentos com o que **entrou de facto** na conta, não com o bruto do recibo de vencimento.
3. Passa as despesas do extrato bancário, não de memória. Se uma categoria te dá vergonha, é exatamente essa que tens de registar.
4. Registra ativos e passivos à data de fecho. Um valor aproximado serve; usar o mesmo critério todos os meses é o que importa.
5. Repete no mês seguinte numa linha nova. Três meses bastam para ver uma tendência; um mês é uma anedota.`,
      faq: [
        {
          q: 'Preciso de Excel para o usar?',
          a: 'Não necessariamente. O ficheiro é .xlsx e funciona no Excel, mas também abre no Google Sheets, no LibreOffice Calc e no Numbers. As fórmulas são somas, subtrações e percentagens: nada que dependa de uma função exclusiva da Microsoft.'
        },
        {
          q: 'Os meus dados são enviados para algum lado?',
          a: 'Não. É um ficheiro que descarregas e que fica no teu computador. Não há conta, não há sincronização e não há servidor pelo meio: o que escreveres na folha não sai do teu equipamento.'
        },
        {
          q: 'Com que frequência devo preenchê-lo?',
          a: 'Uma vez por mês, aproximadamente no mesmo dia. A utilidade não está na fotografia de um mês, mas na série: doze linhas dizem muito mais do que uma, e a disciplina de uma data fixa é o que faz com que existam as doze.'
        }
      ]
    }
  },
  {
    id: 'expense-management',
    step: 2,
    sheets: 2,
    glossary: ['cash-flow', 'lifestyle-creep', 'mental-accounting'],
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
4. Al terminar, mira sólo dos cosas: la categoría más grande y la suma de los impulsos.
5. Cambia **una** cosa. Una sola, la que más pese, y vuelve a medir el mes siguiente.`,
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
3. Do not correct your behaviour while you are logging. A month distorted by wanting it to look good tells you nothing.
4. When it is over, look at only two things: the biggest category, and the total of the impulses.
5. Change **one** thing. One, the heaviest, and measure again next month.`,
      faq: [
        {
          q: 'Is 15 days enough?',
          a: 'For daily habits, yes: small repeated expenses show up almost immediately. What 15 days will not capture is the irregular spending - the insurance, the car service, the birthday present - which is why this template is used alongside the monthly analysis one, which does pick those up.'
        },
        {
          q: 'Would a banking app not be easier?',
          a: 'It is more convenient, which is why it works less well. The app categorises for you, so the expense passes by without you having to look at it. Writing it by hand is deliberately slow: the friction is the mechanism, not a shortcoming of the template.'
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
      description: 'Modelo de Excel gratuito para registar todas as despesas durante 15 dias ou um mês e ver com dados para onde vai o teu dinheiro. Sem registo e sem deixar o teu email.',
      intro: 'Quase ninguém sabe em que gasta o dinheiro: sabe em que acredita que o gasta. Este modelo existe para fechar essa distância com um método incómodo e muito eficaz: registar tudo, sem exceções, durante um período curto.',
      whatsInside: `- Uma folha de **registo diário**: data, descrição, categoria e valor. Uma linha por despesa, café incluído.
- Categorias pré-carregadas e editáveis, com um **resumo automático** que ordena as tuas categorias da maior para a menor.
- Um contador de **despesa média diária**, que costuma surpreender mais do que o total.
- Espaço para marcar cada despesa como **necessária, útil ou impulsiva**, que é onde o registo deixa de ser contabilidade e passa a ser informação.`,
      howToUse: `1. Escolhe o período antes de começar: 15 dias se nunca o fizeste, um mês completo se já tentaste.
2. Registra no momento, não ao fim do dia. O que não se registra no momento esquece-se, e o que se esquece é precisamente o que procuravas.
3. Não corrijas o teu comportamento durante o registo. Um mês falseado pela vontade de que corra bem não serve para nada.
4. No fim, olha só para duas coisas: a categoria maior e a soma dos impulsos.
5. Muda **uma** coisa. Uma só, a que mais pesa, e volta a medir no mês seguinte.`,
      faq: [
        {
          q: 'Quinze dias são suficientes?',
          a: 'Para ver os hábitos diários, sim: as despesas pequenas e repetidas aparecem quase de imediato. O que quinze dias não captam são as despesas irregulares —o seguro, a revisão do carro, o presente de aniversário—, e é por isso que este modelo se usa em conjunto com o da análise mensal, que as recolhe.'
        },
        {
          q: 'Não é mais fácil usar uma app do banco?',
          a: 'É mais cómodo, e é por isso que funciona pior. A app categoriza sozinha, portanto a despesa passa à tua frente sem que tenhas de olhar para ela. Escrever à mão é lento de propósito: a fricção é o mecanismo, não um defeito do modelo.'
        },
        {
          q: 'O que faço com o resultado?',
          a: 'Nada durante uma semana. Lê-o, deixa que te incomode e não tomes decisões a quente. Depois escolhe uma única mudança e dá-lhe um mês. Os orçamentos refeitos de cima a baixo num dia costumam durar exatamente esse dia.'
        }
      ]
    }
  },
  {
    id: 'personal-budget',
    step: 3,
    sheets: 2,
    glossary: ['savings-rate', 'pay-yourself-first', 'opportunity-cost'],
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
4. Mira sólo las tres desviaciones mayores. El resto es ruido.
5. Revísalo una vez al mes, no una vez al año. Un presupuesto es un documento vivo o es un documento muerto.`,
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
      description: 'Modelo de Excel gratuito para comparar a distribuição real do teu dinheiro com o orçamento que queres ter. Sem registo e sem deixar o teu email.',
      intro: 'Um orçamento não é uma lista de proibições: é uma decisão tomada com antecedência sobre aquilo a que queres que o teu mês se pareça. Este modelo põe as duas colunas ao lado —o que fizeste e o que querias fazer— e calcula a distância.',
      whatsInside: `- Uma folha de **orçamento por categorias** com duas colunas, *real* e *objetivo*, e o desvio calculado entre ambas.
- Uma distribuição **percentual** automática, para poderes comparar o teu mês com regras conhecidas como a 50/30/20 sem teres de acreditar em nenhuma.
- Uma linha de **poupança como primeira rubrica**, no topo e não no fim, que é a única diferença estrutural entre um orçamento que poupa e um que não.
- Um resumo da **taxa de poupança** do mês.`,
      howToUse: `1. Preenche primeiro a coluna *real* com dados, não com intenções: tira-os do modelo de gestão de despesas ou do extrato.
2. Fixa a tua poupança como uma **rubrica fixa** no topo, antes de distribuir o resto. Se for o que sobra no fim, não poupas: poupas se a separares primeiro.
3. Preenche a coluna *objetivo* sem heroísmos. Um orçamento que exige um mês perfeito é abandonado na segunda semana.
4. Olha apenas para os três maiores desvios. O resto é ruído.
5. Revê-o uma vez por mês, não uma vez por ano. Um orçamento é um documento vivo ou é um documento morto.`,
      faq: [
        {
          q: 'A regra 50/30/20 serve?',
          a: 'Como ponto de partida, sim; como norma, não. É uma referência razoável para quem não tem nenhuma, e deixa de fazer sentido no momento em que a habitação consome 45 % do teu rendimento, ou quando a tua situação não se parece nada com a de quem inventou a regra. O modelo calcula as tuas percentagens reais para decidires com as tuas e não com as de outra pessoa.'
        },
        {
          q: 'Porque é que a poupança vai no topo?',
          a: 'Porque a poupança deixada para o fim é a que não acontece. Tratá-la como mais uma fatura —uma que se paga primeiro— é a única mudança do método que funciona por si só, sem exigir mais disciplina no resto do mês.'
        },
        {
          q: 'E se os meus rendimentos forem irregulares?',
          a: 'Orçamenta com base no teu mês mais fraco dos últimos doze, não na média. Os meses bons alimentam um colchão, e é do colchão que sai o salário dos meses fracos. Dá mais trabalho no início e evita o ciclo de excesso e corte que esvazia qualquer orçamento variável.'
        }
      ]
    }
  }
];
