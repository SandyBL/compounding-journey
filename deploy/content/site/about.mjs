/**
 * The about page: who is writing this, and how it is written.
 *
 * This lived as #biografia, an anchor two thirds of the way down the home page,
 * and that was the wrong shape for the job in three ways.
 *
 * A crawler could not treat it as a page. The Person node in the home page's
 * structured data pointed its `url` at an anchor, which tells a machine that
 * the canonical page about this person is a page about the site - so the
 * strongest entity signal the site had resolved to something else.
 *
 * A reader could not reach it. The person who wants to know whether the author
 * is worth trusting arrives at the bottom of an article, having just read
 * something they liked, and the nav strip they are looking at offered seven
 * destinations, none of which was "who wrote this". The only route was to go to
 * the home page and scroll.
 *
 * And there was nowhere to put the answer. Trust on a money site is not
 * established by a paragraph of biography; it is established by saying what
 * the author does not do, and how the material is made, in enough detail that
 * a sceptical reader can check. Three paragraphs beside a portrait have no room
 * for that. This page does have room, which is why most of it is method rather
 * than biography.
 *
 * Two rules held while writing it.
 *
 * Nothing here is a credential that has not already been claimed on the site.
 * There are no years of experience, no client counts, no qualifications and no
 * testimonials, because none of those are things this file can know. What the
 * page has instead is verifiable: every claim in `practice` below is something
 * a reader can confirm by opening another page on this site, and each one names
 * where.
 *
 * And the boundary is stated in the reader's own interest rather than in the
 * author's. "Not an accredited adviser" appears here in the same words as the
 * legal notice, on the page a reader reads before deciding to pay for an hour,
 * not only in the terms nobody opens.
 */

export const ABOUT_PAGE = {
  es: {
    title: 'Sobre mí',
    description:
      'Quién escribe Compounding Journey: Sandy Bradbury, educador financiero. Qué hago, qué no hago, y cómo se hace este sitio: con fuentes citadas, datos con su muestra y lo gratis antes que lo pagado.',
    heading: 'Sobre mí',
    eyebrow: 'Quién escribe esto',
    intro:
      'Si acabas de leer algo aquí y te has preguntado quién lo ha escrito y por qué deberías creerle, esta es la página que responde a eso. Empieza por lo que no soy, porque es lo que más te conviene saber.',

    storyTitle: 'Quién soy',
    story: [
      'Me llamo Sandy Bradbury y soy educador financiero. Escribo sobre lo que casi nunca se enseña en la escuela y creo que debería enseñarse: cómo funciona el dinero, cómo trabaja el interés compuesto y por qué saber la aritmética no basta para cambiar lo que hace una persona con su sueldo.',
      'Compounding Journey no habla solo de rentabilidad. El interés compuesto sirve para comprar tiempo, reducir dependencias y sostener una vida elegida, y esa es la parte que me interesa. La estrategia pone el mapa, la disciplina mantiene el rumbo y tus valores deciden el destino: el orden importa, y casi siempre se cuenta al revés.',
      'Vivo en España y escribo en español, inglés y portugués. Todo lo que hay aquí — los artículos, las calculadoras, las plantillas, el glosario y los simuladores — está hecho por mí.'
    ],

    boundaryTitle: 'Lo que no soy',
    boundaryIntro:
      'Esto no es letra pequeña. Es la primera cosa que deberías saber sobre cualquiera que escriba sobre dinero en internet, y sobre mí es esto:',
    boundary: [
      'No soy asesor financiero acreditado ni entidad registrada ante la CNMV.',
      'No hago recomendaciones personalizadas de inversión: no te voy a decir qué fondo, acción, cripto o plan de pensiones comprar o vender.',
      'No gestiono, custodio ni muevo el dinero de nadie. Nunca vas a transferirme fondos para invertir.',
      'No vendo productos financieros y no cobro comisión de nadie por mencionarlos.',
      'No te prometo una rentabilidad, una fecha de libertad financiera ni un resultado.'
    ],
    boundaryNote:
      'Lo que sí hago es educación: explicar los conceptos, ordenar tus propios números contigo y ayudarte a preparar las preguntas que le vas a hacer a un profesional registrado.',

    practiceTitle: 'Cómo se hace este sitio',
    practiceIntro:
      'Cualquiera puede decir que es de fiar. Estas son las seis reglas con las que está hecho lo que lees aquí, y cada una se puede comprobar abriendo otra página de este sitio.',
    practice: [
      {
        title: 'Lo que se afirma, se cita',
        body: 'Cada artículo termina con sus fuentes, y cada fuente dice qué afirmación concreta sostiene. Cuando digo que la regla del 4 % sale de un estudio de un mercado en un periodo, ahí está el estudio.'
      },
      {
        title: 'Los datos se publican con su muestra',
        body: 'La página de datos dice de cuántas simulaciones sale cada número, y ninguna medida se publica antes de tener muestra suficiente. Una media de tres simulaciones describiría la tarde de tres personas, no un patrón.'
      },
      {
        title: 'Lo gratis va primero',
        body: 'Las calculadoras, las plantillas, el glosario y los simuladores son gratis, sin registro y sin dejar tu correo. Casi todo lo que hago en una sesión de pago se puede hacer solo con ellos, y la página de sesiones lo dice antes de pedirte dinero.'
      },
      {
        title: 'Sin afiliados y sin patrocinios',
        body: 'No hay un solo enlace de afiliado en este sitio, ni contenido patrocinado, ni comisión por recomendar un banco, un bróker o una app. Los únicos enlaces externos de los artículos son las fuentes.'
      },
      {
        title: 'Sin rastrearte',
        body: 'Este sitio cuenta cuántas veces se abre cada artículo y nada más: sin cookies, sin identificadores y sin registro de quién leyó qué. Los cálculos de las calculadoras ocurren en tu navegador y no salen de ahí.'
      },
      {
        title: 'Tres idiomas escritos, no traducidos automáticamente',
        body: 'El español, el inglés y el portugués se escriben por separado. Es la razón por la que hay bastante menos contenido del que habría con un traductor automático, y la razón por la que se puede leer.'
      }
    ],

    languagesTitle: 'Por qué en tres idiomas',
    languages: [
      'En inglés hay una biblioteca entera sobre estos temas. En español y en portugués hay mucho menos, y una buena parte de lo que hay es una traducción literal de material pensado para el sistema fiscal y de pensiones de otro país, o un anuncio disfrazado de artículo.',
      'Así que este sitio se escribe en los tres, no se traduce a los tres. Cambia el ejemplo, cambia la moneda, cambia el organismo que publica la inflación que te importa. Un lector en Brasil necesita el IPCA, no el HICP de la zona euro, y merece leerlo en su idioma sin que suene a traducción.'
    ],

    workTitle: 'Si quieres que lo miremos juntos',
    work: [
      'Empieza por el material gratis: es lo mismo que usaríamos en una sesión, y mucha gente no necesita nada más. Si después de eso quieres que alguien mire tus números contigo, las sesiones son eso y solo eso, con la tarifa de partida publicada y sin cobro hasta que confirmes.',
      'Para cualquier cosa, incluido decirme que algo de aquí está mal, escríbeme por el formulario de contacto. Es la única vía: no publico ninguna dirección de correo en el sitio.'
    ]
  },

  en: {
    title: 'About',
    description:
      'Who writes Compounding Journey: Sandy Bradbury, financial educator. What I do, what I do not do, and how this site is made: sources cited, data published with its sample, and the free material before the paid.',
    heading: 'About',
    eyebrow: 'Who writes this',
    intro:
      'If you have just read something here and wondered who wrote it and why you should believe them, this is the page that answers that. It starts with what I am not, because that is the part you most need to know.',

    storyTitle: 'Who I am',
    story: [
      'My name is Sandy Bradbury and I am a financial educator. I write about what school almost never teaches and I believe it should: how money works, how compound growth works, and why knowing the arithmetic is not enough to change what somebody actually does with their salary.',
      'Compounding Journey is not only about returns. Compound growth is useful because it buys time, reduces dependency and sustains a life you chose, and that is the part that interests me. Strategy provides the map, discipline keeps you moving, and your values choose the destination: the order matters, and it is almost always told backwards.',
      'I live in Spain and I write in Spanish, English and Portuguese. Everything here — the articles, the calculators, the templates, the glossary and the simulators — is made by me.'
    ],

    boundaryTitle: 'What I am not',
    boundaryIntro:
      'This is not small print. It is the first thing you should know about anybody writing about money on the internet, and about me it is this:',
    boundary: [
      'I am not an accredited financial adviser or a regulated firm.',
      'I make no personal investment recommendations: I will not tell you which fund, stock, crypto or pension to buy or sell.',
      'I do not manage, hold or move anybody’s money. You will never transfer funds to me to invest.',
      'I do not sell financial products and I take no commission from anybody for mentioning one.',
      'I do not promise you a return, a date of financial freedom or an outcome.'
    ],
    boundaryNote:
      'What I do is education: explaining the concepts, putting your own numbers in order with you, and helping you prepare the questions you are going to ask a registered professional.',

    practiceTitle: 'How this site is made',
    practiceIntro:
      'Anybody can say they are trustworthy. These are the six rules the material here is made under, and every one of them can be checked by opening another page on this site.',
    practice: [
      {
        title: 'What is claimed is cited',
        body: 'Every article ends with its sources, and each source says which specific claim it supports. When I say the 4 % rule comes from a study of one market over one period, the study is there.'
      },
      {
        title: 'Data is published with its sample',
        body: 'The data page states how many simulations each number comes from, and no measure is published before the sample is large enough. An average of three simulations would describe three people’s afternoon, not a pattern.'
      },
      {
        title: 'The free material goes first',
        body: 'The calculators, templates, glossary and simulators are free, with no sign-up and without leaving your email. Almost everything I do in a paid session can be done alone with them, and the sessions page says so before it asks you for money.'
      },
      {
        title: 'No affiliates and no sponsorship',
        body: 'There is not one affiliate link on this site, no sponsored content, and no commission for recommending a bank, a broker or an app. The only external links in the articles are the sources.'
      },
      {
        title: 'No tracking',
        body: 'This site counts how many times each article is opened and nothing else: no cookies, no identifiers, no record of who read what. The calculators do their arithmetic in your browser, and it does not leave it.'
      },
      {
        title: 'Three languages written, not machine-translated',
        body: 'Spanish, English and Portuguese are written separately. That is why there is considerably less material here than a translation plugin would produce, and why it reads like something a person wrote.'
      }
    ],

    languagesTitle: 'Why three languages',
    languages: [
      'In English there is an entire library on these subjects. In Spanish and Portuguese there is far less, and a good part of what exists is a literal translation of material written for another country’s tax and pension system, or an advertisement dressed as an article.',
      'So this site is written in all three rather than translated into all three. The example changes, the currency changes, and so does the institution that publishes the inflation figure that matters to you. A reader in Brazil needs the IPCA, not euro-area HICP, and deserves to read it in their own language without it sounding translated.'
    ],

    workTitle: 'If you want a second pair of eyes',
    work: [
      'Start with the free material: it is the same material we would use in a session, and plenty of people need nothing more. If after that you want somebody to look at your numbers with you, the sessions are that and only that, with the starting rate published and nothing charged until you confirm.',
      'For anything at all, including telling me something here is wrong, write through the contact form. It is the only way: no email address is published anywhere on this site.'
    ]
  },

  pt: {
    title: 'Sobre mim',
    description:
      'Quem escreve o Compounding Journey: Sandy Bradbury, educador financeiro. O que eu faço, o que eu não faço e como este site é feito: com fontes citadas, dados com a amostra declarada e o material gratuito antes do pago.',
    heading: 'Sobre mim',
    eyebrow: 'Quem escreve isto',
    intro:
      'Se você acabou de ler algo aqui e se perguntou quem escreveu e por que deveria acreditar, esta é a página que responde a isso. Ela começa pelo que eu não sou, porque é a parte que mais lhe interessa saber.',

    storyTitle: 'Quem eu sou',
    story: [
      'Meu nome é Sandy Bradbury e sou educador financeiro. Escrevo sobre o que a escola quase nunca ensina e que eu acredito que deveria ensinar: como o dinheiro funciona, como funcionam os juros compostos e por que saber a aritmética não é suficiente para mudar o que uma pessoa de fato faz com o seu salário.',
      'O Compounding Journey não fala só de rentabilidade. Os juros compostos servem para comprar tempo, reduzir dependências e sustentar uma vida escolhida, e essa é a parte que me interessa. A estratégia oferece o mapa, a disciplina mantém o rumo e os seus valores escolhem o destino: a ordem importa, e quase sempre é contada ao contrário.',
      'Moro na Espanha e escrevo em espanhol, inglês e português. Tudo o que existe aqui — os artigos, as calculadoras, os modelos, o glossário e os simuladores — é feito por mim.'
    ],

    boundaryTitle: 'O que eu não sou',
    boundaryIntro:
      'Isto não é letra miúda. É a primeira coisa que você deveria saber sobre qualquer pessoa que escreva sobre dinheiro na internet, e sobre mim é isto:',
    boundary: [
      'Não sou consultor financeiro credenciado nem entidade registrada.',
      'Não faço recomendações personalizadas de investimento: não vou dizer qual fundo, ação, cripto ou plano de previdência comprar ou vender.',
      'Não administro, guardo nem movimento o dinheiro de ninguém. Você nunca vai me transferir fundos para investir.',
      'Não vendo produtos financeiros e não recebo comissão de ninguém por mencionar algum.',
      'Não prometo rentabilidade, data de liberdade financeira nem resultado.'
    ],
    boundaryNote:
      'O que eu faço é educação: explicar os conceitos, organizar os seus próprios números junto com você e ajudar a preparar as perguntas que você vai fazer a um profissional registrado.',

    practiceTitle: 'Como este site é feito',
    practiceIntro:
      'Qualquer pessoa pode dizer que é confiável. Estas são as seis regras com que o material daqui é feito, e cada uma delas pode ser verificada abrindo outra página deste site.',
    practice: [
      {
        title: 'O que se afirma, se cita',
        body: 'Cada artigo termina com as suas fontes, e cada fonte diz qual afirmação concreta ela sustenta. Quando eu digo que a regra dos 4 % vem de um estudo de um mercado em um período, o estudo está ali.'
      },
      {
        title: 'Os dados são publicados com a amostra',
        body: 'A página de dados diz de quantas simulações vem cada número, e nenhuma medida é publicada antes de haver amostra suficiente. Uma média de três simulações descreveria a tarde de três pessoas, não um padrão.'
      },
      {
        title: 'O gratuito vem primeiro',
        body: 'As calculadoras, os modelos, o glossário e os simuladores são gratuitos, sem cadastro e sem deixar o seu e-mail. Quase tudo o que eu faço em uma sessão paga pode ser feito sozinho com eles, e a página de sessões diz isso antes de pedir dinheiro.'
      },
      {
        title: 'Sem afiliados e sem patrocínio',
        body: 'Não existe um único link de afiliado neste site, nem conteúdo patrocinado, nem comissão por recomendar um banco, uma corretora ou um aplicativo. Os únicos links externos dos artigos são as fontes.'
      },
      {
        title: 'Sem rastrear você',
        body: 'Este site conta quantas vezes cada artigo é aberto e mais nada: sem cookies, sem identificadores e sem registro de quem leu o quê. As calculadoras fazem a conta no seu navegador, e ela não sai de lá.'
      },
      {
        title: 'Três idiomas escritos, não traduzidos automaticamente',
        body: 'O espanhol, o inglês e o português são escritos separadamente. É por isso que há bem menos material aqui do que um tradutor automático produziria, e é por isso que dá para ler.'
      }
    ],

    languagesTitle: 'Por que em três idiomas',
    languages: [
      'Em inglês existe uma biblioteca inteira sobre estes assuntos. Em espanhol e em português existe muito menos, e boa parte do que existe é tradução literal de material pensado para o sistema tributário e previdenciário de outro país, ou anúncio disfarçado de artigo.',
      'Então este site é escrito nos três, e não traduzido para os três. O exemplo muda, a moeda muda, e muda também o órgão que publica a inflação que importa para você. Um leitor no Brasil precisa do IPCA, não do HICP da zona do euro, e merece ler isso no seu idioma sem que soe a tradução.'
    ],

    workTitle: 'Se você quiser um segundo par de olhos',
    work: [
      'Comece pelo material gratuito: é o mesmo que usaríamos em uma sessão, e muita gente não precisa de mais nada. Se depois disso você quiser que alguém olhe os seus números com você, as sessões são isso e só isso, com a tarifa de partida publicada e sem cobrança até você confirmar.',
      'Para qualquer coisa, inclusive para me dizer que algo aqui está errado, escreva pelo formulário de contato. É a única via: não há nenhum endereço de e-mail publicado neste site.'
    ]
  }
};

/**
 * The author's profiles elsewhere, as the Person node's `sameAs`.
 *
 * Only accounts this site already links from its own pages. `sameAs` is how a
 * search engine reconciles "Sandy Bradbury" here with the same person
 * elsewhere, which makes it exactly the wrong field to pad: one profile that
 * turns out to belong to somebody else, or to nobody, and the reconciliation it
 * was supposed to help with fails instead.
 */
export const SAME_AS = [
  'https://www.linkedin.com/in/sandy-bradbury',
  'https://compoundingjourney.substack.com/',
  'https://www.instagram.com/compounding.journey_sb/'
];
