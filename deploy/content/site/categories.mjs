/**
 * The journal's categories, keyed by a language-independent id.
 *
 * Every article already declares a `category` in its frontmatter, and until now
 * that value was display text: it appeared above the title and in the RSS feed
 * and led nowhere. A reader who finished a piece about habits and wanted the
 * other four had to go back to the journal index and read seven summaries.
 *
 * Making the categories navigable needs one thing the frontmatter cannot give:
 * a way to know that "Hábitos financieros", "Money habits" and "Hábitos
 * financeiros" are one category in three languages rather than three
 * categories. That is what the ids here are for - they are what lets the three
 * archive pages form an hreflang cluster instead of three unrelated pages.
 *
 * `name` must match the article frontmatter exactly. generate-category-pages.mjs
 * compares the two and fails the build on a category no table entry claims,
 * because the failure it prevents is silent: an article whose category is
 * misspelled by one accent simply never appears in any archive.
 *
 * `intro` exists so an archive page is not three links and a heading. An
 * archive with nothing on it but a list is the thinnest page a site can
 * publish, and it competes with the journal index for the same searches.
 */
export const CATEGORIES = [
  {
    id: 'money-habits',
    es: {
      name: 'Hábitos financieros',
      slug: 'habitos-financieros',
      intro: 'La parte de las finanzas personales que no se resuelve con una hoja de cálculo. Aquí están los artículos sobre lo que haces cada semana con tu dinero: cómo se forma un hábito, por qué se rompe y qué sistemas aguantan un mes malo.',
      description: 'Artículos sobre hábitos financieros: ahorro automático, control de gastos, salir de deudas y los sistemas que sobreviven a un mes malo.'
    },
    en: {
      name: 'Money habits',
      slug: 'money-habits',
      intro: 'The part of personal finance a spreadsheet does not solve. These are the articles about what you do with your money every week: how a habit forms, why it breaks, and which systems survive a bad month.',
      description: 'Articles on money habits: automatic saving, tracking spending, getting out of debt, and the systems that survive a bad month.'
    },
    pt: {
      name: 'Hábitos financeiros',
      slug: 'habitos-financeiros',
      intro: 'A parte das finanças pessoais que não se resolve com uma folha de cálculo. Aqui estão os artigos sobre o que fazes todas as semanas com o teu dinheiro: como se forma um hábito, por que se quebra e que sistemas aguentam um mês mau.',
      description: 'Artigos sobre hábitos financeiros: poupança automática, controlo de despesas, sair das dívidas e os sistemas que sobrevivem a um mês mau.'
    }
  },
  {
    id: 'investing',
    es: {
      name: 'Inversión',
      slug: 'inversion',
      intro: 'Cómo funciona poner el dinero a trabajar, sin recomendaciones de productos. Interés compuesto, horizonte, diversificación y los errores que cuestan más que las comisiones.',
      description: 'Artículos sobre inversión a largo plazo: interés compuesto, diversificación, horizonte temporal y los errores de comportamiento que cuestan más que las comisiones.'
    },
    en: {
      name: 'Investing',
      slug: 'investing',
      intro: 'How putting money to work actually works, without product recommendations. Compound interest, time horizon, diversification, and the mistakes that cost more than fees do.',
      description: 'Articles on long-term investing: compound interest, diversification, time horizon, and the behavioural mistakes that cost more than fees.'
    },
    pt: {
      name: 'Investimentos',
      slug: 'investimentos',
      intro: 'Como funciona pôr o dinheiro a trabalhar, sem recomendações de produtos. Juros compostos, horizonte, diversificação e os erros que custam mais do que as comissões.',
      description: 'Artigos sobre investimento a longo prazo: juros compostos, diversificação, horizonte temporal e os erros de comportamento que custam mais do que as comissões.'
    }
  },
  {
    id: 'life-design',
    es: {
      name: 'Diseño de vida',
      slug: 'diseno-de-vida',
      intro: 'El dinero como medio y no como objetivo. Artículos sobre para qué quieres el dinero, cuánto de tu vida cuesta cada compra y qué significa "suficiente" cuando se pone en números.',
      description: 'Artículos sobre el dinero como medio: propósito, coste en horas de vida, decidir qué es suficiente y gastar de acuerdo con lo que te importa.'
    },
    en: {
      name: 'Life design',
      slug: 'life-design',
      intro: 'Money as a means rather than a goal. Articles about what you want the money for, how much of your life each purchase costs, and what "enough" means once you put a number on it.',
      description: 'Articles on money as a means: purpose, the cost of a purchase in hours of your life, deciding what counts as enough, and spending in line with what matters.'
    },
    pt: {
      name: 'Design de vida',
      slug: 'design-de-vida',
      intro: 'O dinheiro como meio e não como objetivo. Artigos sobre para que queres o dinheiro, quanto da tua vida custa cada compra e o que significa "suficiente" quando se põe em números.',
      description: 'Artigos sobre o dinheiro como meio: propósito, custo em horas de vida, decidir o que é suficiente e gastar de acordo com o que te importa.'
    }
  }
];
