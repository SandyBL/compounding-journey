/**
 * The three legal documents, in three languages.
 *
 * A site that runs calculators about somebody's retirement, stores a display
 * name in a public leaderboard, takes messages through a contact form and
 * offers paid sessions needs these pages to exist, and needs them to describe
 * what actually happens rather than what a generic template assumes happens.
 * Everything stated here was checked against the code: the processing described
 * in the privacy policy is the processing the two Netlify functions perform, the
 * browser-storage section lists the four keys the scripts actually write, and
 * the claim that no third party is contacted when a page loads is enforced by
 * the `default-src 'self'` Content-Security-Policy in _headers - a page that
 * started calling an analytics endpoint would be blocked by the browser before
 * it could make this page untrue.
 *
 * The other reason these exist: the author is studying for a financial adviser
 * certification and does not hold one yet. Both the terms and the legal notice
 * say so in their own words, in every language, because "educational content,
 * not investment advice" has to be a statement a reader can find on the site's
 * own terms - not an aside in a FAQ answer. scripts/page-shell.mjs also puts
 * the short version of it on every calculator, simulator and template page,
 * linked back to the legal notice.
 *
 * Slugs and revision dates are not here: they live in the LEGAL_PAGES table in
 * scripts/site-routes.mjs, because the footer of every page has to build those
 * URLs too.
 *
 * `{{...}}` placeholders in the bodies are resolved per language by
 * scripts/generate-legal-pages.mjs - see RESOLVERS there for the list. Writing
 * "/es/sesiones/" by hand in nine documents is how three of them end up
 * pointing at a page that moved.
 *
 * This is a careful description of a small site written by somebody who read
 * the code, not a solicitor's work. Anyone charging for the sessions should
 * have it read by a Spanish lawyer, and should check whether their situation
 * requires publishing a postal address and tax number here.
 */
export const LEGAL = {
  privacy: {
    es: {
      title: 'Política de privacidad',
      description: 'Qué datos recoge Compounding Journey, para qué, durante cuánto tiempo y cómo ejercer tus derechos. Responsable: Sandy Bradbury (España).',
      heading: 'Política de privacidad',
      intro: 'Este sitio recoge muy pocos datos, y esta página explica exactamente cuáles, por qué y qué puedes hacer al respecto.',
      body: `
## Quién trata tus datos

El responsable del tratamiento es **Sandy Bradbury**, persona física con residencia en España, titular de compoundingjourney.com. Puedes escribir a **san.bradbury@gmail.com** para cualquier asunto relacionado con esta política, incluido el ejercicio de tus derechos.

No hay delegado de protección de datos: el sitio lo lleva una sola persona y ninguno de los tratamientos descritos aquí obliga a nombrar uno.

## Resumen de los tratamientos

| Qué se recoge | Para qué | Base jurídica | Conservación |
| --- | --- | --- | --- |
| Nombre, correo y mensaje del formulario de contacto | Responder a tu consulta | Tu consentimiento al enviar el formulario, y la relación precontractual que tú solicitas | 24 meses desde el último mensaje |
| Nombre visible y puntuación en las clasificaciones de los simuladores | Publicar la clasificación que tú decides enviar | Tu consentimiento al pulsar «enviar puntuación» | Hasta que pidas su retirada |
| Los ajustes y el resultado de una simulación (cifras, porcentajes y opciones elegidas) | Publicar medias y porcentajes agregados en la [página de datos]({{data}}) | Tu consentimiento al pulsar el botón de guardar la simulación | Indefinidamente, en forma agregada y sin nombre |
| Número de veces que se abre cada artículo | Decidir qué contenido destacar | Interés legítimo en saber qué se lee | Un contador agregado por artículo y mes, sin caducidad |
| Dirección IP y datos técnicos de la petición | Servir la página, limitar abusos y registrar incidencias | Interés legítimo en la seguridad del servicio | Registros del proveedor de alojamiento, días |

## El formulario de contacto

El formulario pide tu nombre, tu correo electrónico y tu mensaje. Se envía a Netlify Forms, donde queda almacenado, y se me reenvía por correo. No se usa para enviarte nada que no hayas pedido, no se cede a nadie y no alimenta ninguna lista de correo: si quieres recibir la newsletter tienes que apuntarte aparte.

## Los simuladores y los datos públicos

Tres de los simuladores tienen una clasificación pública. Si pulsas el botón de enviar tu puntuación, se guarda el nombre visible que has escrito, la puntuación, el idioma de la página, la fecha y los ajustes con los que hiciste esa simulación, y la fila de la clasificación la puede ver cualquiera. Nada de eso pasa hasta que lo pulsas: puedes usar los simuladores sin enviar nada.

Los otros dos —el Calendario de la Libertad y la Máquina del Tiempo del Mercado— no tienen clasificación, pero sí un botón para añadir tu simulación a los datos públicos. Ahí no se guarda ningún nombre: solo las cifras que introdujiste, las opciones que elegiste y el resultado que salió.

«Los ajustes de la simulación» son cosas como la tasa de retirada, el porcentaje de acciones y bonos de la cartera, la edad de inicio, el horizonte en años o qué hábitos recortaste. Son los números del modelo, no datos sobre ti: no hay dirección, ni profesión, ni patrimonio real, ni nada que se pida en un formulario. Lo que se publica de ellos son medias y porcentajes en la [página de datos]({{data}}), y ninguna medida aparece hasta tener muestra suficiente, precisamente para que ninguna cifra describa una sola simulación.

Las filas que se guardan sin nombre no llevan identificador alguno, así que tampoco se pueden localizar después: no hay forma de saber cuál era tuya, ni para mí ni para nadie. Eso es lo que las hace anónimas, y también significa que una fila concreta no se puede borrar a petición. La clasificación es distinta: ahí hay un nombre visible y se puede retirar.

**El nombre visible lo eliges tú, y lo sensato es que no sea tu nombre real.** Un apodo cumple exactamente la misma función. Si has enviado uno y quieres que desaparezca, escribe a san.bradbury@gmail.com indicando la puntuación y el simulador, y se borra.

## El recuento de lecturas

Cada vez que se abre un artículo se suma uno a un contador. Ese contador guarda un número por artículo y por mes, y nada más: no hay cookie, no hay identificador, no hay huella del navegador y no queda registro de quién ha leído qué. Es lo que decide qué artículo se destaca en la portada del diario.

## Almacenamiento en tu navegador, y por qué no hay aviso de cookies

Este sitio **no usa cookies**, ni propias ni de terceros, ni de analítica ni de publicidad. Por eso no verás un aviso pidiéndote permiso: no hay nada que consentir.

Sí se usan cuatro claves de almacenamiento local, que se quedan en tu navegador y no viajan a ningún servidor:

- \`preferredLanguage\` — el idioma que elegiste, para no volver a preguntártelo.
- \`languageSuggestionDismissed\` — que ya cerraste el aviso de idioma.
- \`preferredCalculatorCurrency\` — la moneda con la que quieres ver las calculadoras.
- \`cj:simulator:context\` y \`cj:leaderboard:mine:*\` — qué simulador venías usando y qué filas de la clasificación son tuyas, para poder señalarlas. Estas dos se borran al cerrar la pestaña.

Puedes borrarlas cuando quieras desde tu navegador. El sitio seguirá funcionando; solo dejará de recordar tus preferencias.

## Quién más ve tus datos

- **Netlify** (Netlify, Inc.) aloja el sitio, procesa el formulario y ejecuta la base de datos donde viven las simulaciones, las puntuaciones y los contadores. Actúa como encargado del tratamiento.
- **Nadie más.** Cuando cargas una página de este sitio, tu navegador no contacta con ningún tercero: las tipografías, los gráficos y los scripts se sirven desde este mismo dominio. No hay Google Analytics, no hay píxeles, no hay botones sociales que te sigan.

## La newsletter y los botones de compartir

La suscripción a la newsletter no se hace aquí: el enlace te lleva al formulario del proveedor (MailerLite para español y portugués, Substack para inglés), y desde ese momento son ellos quienes tratan tu correo, con su propia política. Este sitio no recibe tu dirección.

Los botones de compartir de los artículos son enlaces normales. No cargan nada de esas redes ni les cuentan que has estado aquí: solo se abren cuando los pulsas tú.

## Transferencias internacionales

Netlify, Inc. y Substack están en Estados Unidos, así que los datos que tratan pueden salir del Espacio Económico Europeo. Esas transferencias se amparan en el Marco de Privacidad de Datos UE-EEUU y en las cláusulas contractuales tipo de la Comisión Europea, según el proveedor.

## Tus derechos

Puedes pedirme en cualquier momento acceso a tus datos, su rectificación, su supresión, la limitación u oposición a su tratamiento, y su portabilidad, y puedes retirar tu consentimiento cuando quieras. Escribe a **san.bradbury@gmail.com** y te respondo en el plazo de un mes.

Si crees que no he respondido como debía, puedes reclamar ante la **Agencia Española de Protección de Datos** (www.aepd.es), C/ Jorge Juan 6, 28001 Madrid.

## Menores

Este sitio no va dirigido a menores de 14 años y no pide datos a sabiendas a nadie de esa edad. Si crees que ha ocurrido, escríbeme y lo borro.

## Cambios

Si cambia algo de lo anterior, cambia esta página y la fecha de revisión que figura arriba. Los cambios que afecten a un tratamiento basado en tu consentimiento no se aplican a lo ya recogido sin pedírtelo otra vez.
`
    },
    en: {
      title: 'Privacy policy',
      description: 'What data Compounding Journey collects, why, for how long, and how to exercise your rights. Controller: Sandy Bradbury (Spain).',
      heading: 'Privacy policy',
      intro: 'This site collects very little, and this page says exactly what, why, and what you can do about it.',
      body: `
## Who processes your data

The data controller is **Sandy Bradbury**, an individual resident in Spain and the owner of compoundingjourney.com. Write to **san.bradbury@gmail.com** about anything on this page, including to exercise your rights.

There is no data protection officer: one person runs this site, and none of the processing described here requires appointing one.

## What is processed, at a glance

| What is collected | What for | Legal basis | Kept for |
| --- | --- | --- | --- |
| Name, email and message from the contact form | Answering you | Your consent in sending the form, and the pre-contractual relationship you asked for | 24 months from the last message |
| Display name and score in the simulator leaderboards | Publishing the ranking you chose to submit | Your consent in pressing "submit score" | Until you ask for it to be removed |
| The settings and the result of a simulation (figures, percentages and options chosen) | Publishing aggregate averages and shares on the [data page]({{data}}) | Your consent in pressing the button that saves the simulation | Indefinitely, in aggregate and with no name |
| How many times each article is opened | Deciding what to feature | Legitimate interest in knowing what is read | One aggregate counter per article per month, indefinitely |
| IP address and technical request data | Serving the page, rate-limiting abuse, logging faults | Legitimate interest in keeping the service up | The hosting provider's logs, days |

## The contact form

The form asks for your name, your email address and your message. It is submitted to Netlify Forms, stored there, and forwarded to me by email. It is not used to send you anything you did not ask for, it is not shared, and it does not feed a mailing list: subscribing to the newsletter is a separate, deliberate act.

## The simulators and the public data

Three of the simulators keep a public leaderboard. If you press the button to submit your score, the display name you typed, the score, the page's language, the date and the settings you ran that simulation with are stored, and the leaderboard row is visible to everyone. None of this happens until you press it: the simulators work perfectly well without submitting anything.

The other two — the Freedom Calendar and the Market Time Machine — have no leaderboard, but they do have a button that adds your simulation to the public data. No name is stored there: only the figures you entered, the options you picked and the result that came out.

"The settings of the simulation" means things like the withdrawal rate, the share of stocks and bonds in the portfolio, the starting age, the horizon in years, or which habits you cut. They are the model's numbers, not data about you: no address, no occupation, no real net worth, nothing a form would ask for. What gets published from them is averages and shares on the [data page]({{data}}), and no measure appears until its sample is large enough - precisely so that no figure describes a single simulation.

The rows stored without a name carry no identifier at all, which means they cannot be found again afterwards: there is no way to tell which one was yours, for me or for anybody else. That is what makes them anonymous, and it also means a particular row cannot be deleted on request. The leaderboard is different: there is a display name there, and it can be removed.

**You choose the display name, and the sensible choice is not your real one.** A nickname does the same job. If you submitted one and want it gone, write to san.bradbury@gmail.com naming the score and the simulator, and it will be deleted.

## The reading counter

Opening an article adds one to a counter. That counter holds a number per article per month and nothing else: no cookie, no identifier, no browser fingerprint, no record of who read what. It is what decides which article the journal features.

## Storage in your browser, and why there is no cookie banner

This site **uses no cookies** — not its own, not anyone else's, none for analytics and none for advertising. That is why you are not asked to accept anything: there is nothing to consent to.

It does use four local-storage keys, which stay in your browser and are never sent anywhere:

- \`preferredLanguage\` — the language you chose, so you are not asked twice.
- \`languageSuggestionDismissed\` — that you already dismissed the language prompt.
- \`preferredCalculatorCurrency\` — the currency you want the calculators in.
- \`cj:simulator:context\` and \`cj:leaderboard:mine:*\` — which simulator you came from, and which leaderboard rows are yours so they can be marked. These two are cleared when you close the tab.

You can delete them from your browser whenever you like. The site keeps working; it just stops remembering your preferences.

## Who else sees your data

- **Netlify** (Netlify, Inc.) hosts the site, processes the form, and runs the database holding the simulations, the scores and the counters. It acts as a data processor.
- **Nobody else.** Loading a page here contacts no third party: the fonts, the charts and the scripts are all served from this domain. There is no Google Analytics, no pixel, and no social button that follows you.

## The newsletter and the share buttons

Newsletter sign-up does not happen here: the link takes you to the provider's own form (MailerLite for Spanish and Portuguese, Substack for English), and from that point they process your address under their own policy. This site never receives it.

The share buttons on the articles are ordinary links. They load nothing from those networks and tell them nothing about your visit: they only open when you press them.

## International transfers

Netlify, Inc. and Substack are in the United States, so data they process may leave the European Economic Area. Those transfers rely on the EU-US Data Privacy Framework and on the European Commission's standard contractual clauses, depending on the provider.

## Your rights

You can ask me at any time for access to your data, its correction or erasure, the restriction of or objection to its processing, and its portability, and you can withdraw your consent whenever you like. Write to **san.bradbury@gmail.com** and I will answer within one month.

If you think I handled that badly, you can complain to the **Spanish Data Protection Agency** (www.aepd.es), C/ Jorge Juan 6, 28001 Madrid, which is the supervisory authority for this site.

## Children

This site is not aimed at children under 14 and does not knowingly collect data from anyone that age. If you believe it has, write to me and it will be deleted.

## Changes

If any of the above changes, this page changes with it, along with the revision date at the top. Changes affecting processing based on your consent do not apply to what was already collected without asking you again.
`
    },
    pt: {
      title: 'Política de privacidade',
      description: 'Que dados o Compounding Journey recolhe, para quê, durante quanto tempo e como exercer os teus direitos. Responsável: Sandy Bradbury (Espanha).',
      heading: 'Política de privacidade',
      intro: 'Este site recolhe muito pouco, e esta página diz exatamente o quê, para quê e o que podes fazer quanto a isso.',
      body: `
## Quem trata os teus dados

O responsável pelo tratamento é **Sandy Bradbury**, pessoa singular residente em Espanha e titular de compoundingjourney.com. Escreve para **san.bradbury@gmail.com** sobre qualquer assunto desta página, incluindo o exercício dos teus direitos.

Não existe encarregado de proteção de dados: o site é gerido por uma só pessoa e nenhum dos tratamentos aqui descritos obriga a nomear um.

## Resumo dos tratamentos

| O que se recolhe | Para quê | Base jurídica | Conservação |
| --- | --- | --- | --- |
| Nome, email e mensagem do formulário de contacto | Responder-te | O teu consentimento ao enviar o formulário, e a relação pré-contratual que pediste | 24 meses desde a última mensagem |
| Nome visível e pontuação nas classificações dos simuladores | Publicar a classificação que decidiste enviar | O teu consentimento ao premir «enviar pontuação» | Até pedires a sua remoção |
| Os valores e o resultado de uma simulação (números, percentagens e opções escolhidas) | Publicar médias e percentagens agregadas na [página de dados]({{data}}) | O teu consentimento ao premir o botão que guarda a simulação | Indefinidamente, de forma agregada e sem nome |
| Número de vezes que cada artigo é aberto | Decidir o que destacar | Interesse legítimo em saber o que é lido | Um contador agregado por artigo e por mês, sem prazo |
| Endereço IP e dados técnicos do pedido | Servir a página, limitar abusos e registar falhas | Interesse legítimo na segurança do serviço | Registos do fornecedor de alojamento, dias |

## O formulário de contacto

O formulário pede o teu nome, o teu email e a tua mensagem. É enviado para o Netlify Forms, fica lá guardado e é-me reencaminhado por email. Não serve para te enviar nada que não tenhas pedido, não é cedido a ninguém e não alimenta nenhuma lista de correio: subscrever a newsletter é um passo separado.

## Os simuladores e os dados públicos

Três dos simuladores têm uma classificação pública. Se premires o botão para enviar a tua pontuação, guarda-se o nome visível que escreveste, a pontuação, o idioma da página, a data e os valores com que fizeste essa simulação, e a linha da classificação fica visível para todos. Nada disto acontece até premires: podes usar os simuladores sem enviar nada.

Os outros dois — o Calendário da Liberdade e a Máquina do Tempo do Mercado — não têm classificação, mas têm um botão para acrescentar a tua simulação aos dados públicos. Aí não se guarda nome nenhum: apenas os números que introduziste, as opções que escolheste e o resultado que saiu.

«Os valores da simulação» são coisas como a taxa de retirada, a percentagem de ações e obrigações da carteira, a idade inicial, o horizonte em anos ou que hábitos cortaste. São os números do modelo, não dados sobre ti: não há endereço, nem profissão, nem património real, nem nada que um formulário peça. O que se publica deles são médias e percentagens na [página de dados]({{data}}), e nenhuma medida aparece antes de ter amostra suficiente - precisamente para que nenhum número descreva uma única simulação.

As linhas guardadas sem nome não têm identificador algum, pelo que também não podem ser localizadas depois: não há forma de saber qual era a tua, nem para mim nem para ninguém. É isso que as torna anónimas, e significa também que uma linha concreta não pode ser apagada a pedido. A classificação é diferente: aí há um nome visível e pode ser retirado.

**O nome visível és tu que o escolhes, e o sensato é que não seja o teu nome verdadeiro.** Uma alcunha faz o mesmo trabalho. Se enviaste um e queres que desapareça, escreve para san.bradbury@gmail.com indicando a pontuação e o simulador, e será apagado.

## A contagem de leituras

Abrir um artigo soma um a um contador. Esse contador guarda um número por artigo e por mês, e mais nada: sem cookies, sem identificadores, sem impressão digital do navegador, sem registo de quem leu o quê. É o que decide qual o artigo destacado no diário.

## Armazenamento no teu navegador, e porque não há aviso de cookies

Este site **não usa cookies** — nem próprias, nem de terceiros, nem de análise, nem de publicidade. É por isso que não te pedimos para aceitar nada: não há nada a consentir.

Usa quatro chaves de armazenamento local, que ficam no teu navegador e nunca são enviadas para nenhum servidor:

- \`preferredLanguage\` — o idioma que escolheste, para não te perguntarmos outra vez.
- \`languageSuggestionDismissed\` — que já fechaste o aviso de idioma.
- \`preferredCalculatorCurrency\` — a moeda em que queres ver as calculadoras.
- \`cj:simulator:context\` e \`cj:leaderboard:mine:*\` — de que simulador vinhas e quais as linhas da classificação que são tuas, para as poder assinalar. Estas duas são apagadas ao fechar o separador.

Podes apagá-las quando quiseres a partir do navegador. O site continua a funcionar; apenas deixa de se lembrar das tuas preferências.

## Quem mais vê os teus dados

- **A Netlify** (Netlify, Inc.) aloja o site, processa o formulário e executa a base de dados onde vivem as simulações, as pontuações e os contadores. Atua como subcontratante.
- **Mais ninguém.** Carregar uma página aqui não contacta nenhum terceiro: as tipografias, os gráficos e os scripts são servidos deste mesmo domínio. Não há Google Analytics, não há pixels e não há botões sociais que te sigam.

## A newsletter e os botões de partilha

A subscrição da newsletter não acontece aqui: o link leva-te ao formulário do próprio fornecedor (MailerLite para espanhol e português, Substack para inglês) e, a partir daí, são eles que tratam o teu email, com a política deles. Este site nunca o recebe.

Os botões de partilha dos artigos são links normais. Não carregam nada dessas redes nem lhes contam que estiveste aqui: só abrem quando os premes.

## Transferências internacionais

A Netlify, Inc. e a Substack estão nos Estados Unidos, pelo que os dados que tratam podem sair do Espaço Económico Europeu. Essas transferências apoiam-se no Quadro de Privacidade de Dados UE-EUA e nas cláusulas contratuais-tipo da Comissão Europeia, conforme o fornecedor.

## Os teus direitos

Podes pedir-me em qualquer momento o acesso aos teus dados, a sua retificação ou apagamento, a limitação ou oposição ao seu tratamento e a sua portabilidade, e podes retirar o teu consentimento quando quiseres. Escreve para **san.bradbury@gmail.com** e respondo no prazo de um mês.

Se achares que respondi mal, podes reclamar junto da **Agencia Española de Protección de Datos** (www.aepd.es), C/ Jorge Juan 6, 28001 Madrid, que é a autoridade de controlo deste site, ou junto da CNPD em Portugal.

## Menores

Este site não se dirige a menores de 14 anos e não recolhe conscientemente dados de ninguém dessa idade. Se achares que aconteceu, escreve-me e será apagado.

## Alterações

Se algo do acima mudar, esta página muda com ele, e também a data de revisão no topo. Alterações que afetem um tratamento baseado no teu consentimento não se aplicam ao que já foi recolhido sem te perguntar de novo.
`
    }
  }
  ,
  terms: {
    es: {
      title: 'Términos de uso',
      description: 'Condiciones de uso de Compounding Journey: naturaleza educativa del contenido, uso de las calculadoras y plantillas, propiedad intelectual y responsabilidad.',
      heading: 'Términos de uso',
      intro: 'Las reglas de uso de este sitio, incluida la más importante: aquí encontrarás educación financiera, no asesoramiento.',
      body: `
## Qué aceptas al usar este sitio

Al navegar por compoundingjourney.com, usar sus calculadoras y simuladores o descargar sus plantillas, aceptas estos términos. Si no estás de acuerdo con ellos, lo coherente es no usar el sitio.

## Esto es educación financiera, no asesoramiento

Es la condición más importante de esta página, así que va sin rodeos:

**Sandy Bradbury es educador financiero. No es asesor financiero acreditado, no está registrado como empresa de servicios de inversión ni como agente ante la CNMV, y nada de lo que publica en este sitio constituye asesoramiento financiero, de inversión, fiscal o legal, ni una recomendación personalizada para comprar, vender o mantener ningún producto.**

Todo el contenido es información general de carácter educativo, escrita sin conocer tu situación, tus ingresos, tus deudas, tus obligaciones fiscales ni tu tolerancia al riesgo. Leerlo no crea entre tú y el autor ninguna relación de asesoramiento, fiduciaria o profesional. Antes de tomar una decisión que afecte a tu dinero, consulta a un profesional debidamente registrado en tu jurisdicción.

Las decisiones que tomes son tuyas, y sus consecuencias también.

## Las calculadoras y los simuladores

Las [calculadoras]({{tools}}) y los simuladores hacen aritmética con los números que tú introduces y con los supuestos que la propia página declara. Sus resultados son **estimaciones ilustrativas**, no previsiones: no incorporan inflación real, fiscalidad, comisiones futuras, crisis, cambios en tus ingresos ni el comportamiento de ningún mercado concreto. Una rentabilidad pasada no se repite porque una calculadora la extienda en línea recta.

Todo el cálculo ocurre en tu navegador y no se guarda nada, salvo las simulaciones que tú decidas guardar: una puntuación enviada a una clasificación, o un escenario añadido a los [datos públicos]({{data}}).

## Las plantillas

Las plantillas de hoja de cálculo se ofrecen gratis para tu uso personal. Puedes copiarlas, modificarlas y usarlas para lo que quieras en tu propia economía. No puedes revenderlas, redistribuirlas como producto propio ni presentarlas como material de otra persona. Se entregan tal cual, sin garantía: revisa las fórmulas antes de confiarle a una hoja de cálculo una decisión importante.

## Las clasificaciones y los datos públicos

Si envías una puntuación a la clasificación de un simulador, aceptas que el nombre visible y la puntuación sean públicos. No escribas ahí datos personales, de nadie. Se puede retirar cualquier entrada que contenga datos personales de terceros, insultos, publicidad o intentos de manipular la tabla, sin aviso previo.

Si guardas una simulación en los [datos públicos]({{data}}), aceptas que sus cifras y sus opciones se publiquen agregadas —medias, porcentajes y distribuciones—, sin nombre y sin identificador. Nunca se publica una simulación suelta, y ninguna medida se publica por debajo de su muestra mínima. Esos datos pueden usarse en artículos de este sitio y citarse con atribución.

## Las sesiones

Las [sesiones]({{sessions}}) son de educación y acompañamiento: revisar plantillas, entender conceptos, ordenar hábitos y fijar objetivos. **No incluyen recomendaciones de inversión, selección de productos, gestión de carteras ni planificación fiscal**, y no sustituyen a un asesor registrado. Cada sesión se contrata por separado y sus condiciones concretas se acuerdan por escrito antes de pagarla.

## Propiedad intelectual

Los textos, las plantillas, el código y el diseño de este sitio son obra de Sandy Bradbury y están protegidos por la normativa de propiedad intelectual. Puedes citar fragmentos breves con atribución y un enlace a la página original. No puedes republicar artículos completos, ni usar el contenido para entrenar modelos comerciales cerrados, ni reproducir el sitio.

## Enlaces a terceros

Algunos artículos enlazan a libros, herramientas o páginas de terceros. Esos enlaces son referencias, no avales, y no controlo lo que publican ni lo que hacen con tus datos.

## Disponibilidad y cambios

El sitio se ofrece «tal cual» y sin garantía de disponibilidad continua. Puedo cambiar, mover o retirar cualquier contenido; cuando una página cambie de dirección, procuraré que la antigua redirija a la nueva.

## Responsabilidad

En la medida que permita la ley, no asumo responsabilidad por pérdidas derivadas del uso de este sitio, de la interpretación de su contenido, de errores en un cálculo o una plantilla, ni de la indisponibilidad del servicio. Nada de lo anterior limita los derechos que la normativa de consumo te reconozca como consumidor.

## Ley aplicable

Estos términos se rigen por la legislación española. Si eres consumidor, conservas el derecho a acudir a los tribunales de tu lugar de residencia.

## Contacto

Cualquier duda sobre esta página: **san.bradbury@gmail.com**. Sobre datos personales, mira la [política de privacidad]({{privacy}}); sobre la titularidad del sitio, el [aviso legal]({{notice}}).
`
    },
    en: {
      title: 'Terms of use',
      description: 'Terms of use for Compounding Journey: the educational nature of the content, use of the calculators and templates, intellectual property and liability.',
      heading: 'Terms of use',
      intro: 'The rules for using this site, starting with the one that matters most: what you will find here is financial education, not advice.',
      body: `
## What you accept by using this site

By browsing compoundingjourney.com, using its calculators and simulators, or downloading its templates, you accept these terms. If you do not agree with them, the consistent thing to do is not to use the site.

## This is financial education, not advice

It is the most important clause on this page, so it is put plainly:

**Sandy Bradbury is a financial educator, not an accredited financial adviser, and is not registered as an investment firm or agent with the CNMV or any equivalent regulator, and nothing published on this site is financial, investment, tax or legal advice, or a personal recommendation to buy, sell or hold anything.**

All of the content is general educational information, written without knowing your situation, your income, your debts, your tax position or your tolerance for risk. Reading it creates no advisory, fiduciary or professional relationship between you and the author. Before making a decision about your money, consult a properly registered professional in your jurisdiction.

The decisions you make are yours, and so are their consequences.

## The calculators and simulators

The [calculators]({{tools}}) and simulators do arithmetic on the numbers you enter, under the assumptions each page states. Their results are **illustrative estimates, not forecasts**: they do not model real inflation, tax, future fees, crashes, changes in your income, or the behaviour of any actual market. A past return does not repeat because a calculator extended it in a straight line.

All of the calculation happens in your browser, and nothing is stored — except the simulations you choose to save: a score submitted to a leaderboard, or a scenario added to the [public data]({{data}}).

## The templates

The spreadsheet templates are free for your personal use. Copy them, change them, use them however you like on your own finances. You may not resell them, redistribute them as your own product, or present them as somebody else's material. They come as they are, with no warranty: check the formulas before trusting a spreadsheet with an important decision.

## The leaderboards and the public data

If you submit a score to a simulator leaderboard, you accept that the display name and the score are public. Do not put personal data there — yours or anybody else's. Any entry containing third-party personal data, abuse, advertising, or an attempt to game the table may be removed without notice.

If you save a simulation into the [public data]({{data}}), you accept that its figures and choices are published in aggregate — averages, shares and distributions — with no name and no identifier. A single simulation is never published on its own, and no measure is published below its minimum sample. That data may be used in articles on this site and quoted with attribution.

## The sessions

The [sessions]({{sessions}}) are education and coaching: going through templates, understanding concepts, tidying up habits, setting goals. **They do not include investment recommendations, product selection, portfolio management or tax planning**, and they are not a substitute for a registered adviser. Each session is engaged separately and its specific terms are agreed in writing before it is paid for.

## Intellectual property

The text, templates, code and design of this site are Sandy Bradbury's work and are protected by copyright. You may quote short passages with attribution and a link to the original page. You may not republish whole articles, use the content to train closed commercial models, or reproduce the site.

## Third-party links

Some articles link to books, tools or pages run by other people. Those links are references, not endorsements, and I control neither what they publish nor what they do with your data.

## Availability and changes

The site is provided as it is, with no guarantee of continuous availability. I may change, move or withdraw any content; when a page changes address, I will try to make the old one redirect to the new.

## Liability

To the extent the law allows, I accept no liability for losses arising from the use of this site, from the interpretation of its content, from an error in a calculation or a template, or from the service being unavailable. None of this limits any rights consumer law gives you as a consumer.

## Governing law

These terms are governed by Spanish law. If you are a consumer, you keep the right to bring proceedings in the courts of your place of residence.

## Contact

Any question about this page: **san.bradbury@gmail.com**. For personal data, see the [privacy policy]({{privacy}}); for who owns the site, the [legal notice]({{notice}}).
`
    },
    pt: {
      title: 'Termos de utilização',
      description: 'Termos de utilização do Compounding Journey: natureza educativa do conteúdo, uso das calculadoras e modelos, propriedade intelectual e responsabilidade.',
      heading: 'Termos de utilização',
      intro: 'As regras de utilização deste site, a começar pela mais importante: aqui encontras educação financeira, não consultoria.',
      body: `
## O que aceitas ao usar este site

Ao navegar em compoundingjourney.com, usar as suas calculadoras e simuladores ou descarregar os seus modelos, aceitas estes termos. Se não concordas com eles, o coerente é não usar o site.

## Isto é educação financeira, não consultoria

É a cláusula mais importante desta página, por isso vai sem rodeios:

**Sandy Bradbury é educador financeiro. Não é consultor financeiro acreditado, não está registado como empresa de investimento nem como agente junto da CMVM, da CNMV ou de qualquer regulador equivalente, e nada do que publica neste site constitui consultoria financeira, de investimento, fiscal ou jurídica, nem uma recomendação personalizada para comprar, vender ou manter qualquer produto.**

Todo o conteúdo é informação geral de carácter educativo, escrita sem conhecer a tua situação, os teus rendimentos, as tuas dívidas, a tua situação fiscal ou a tua tolerância ao risco. Ler não cria entre ti e o autor qualquer relação de consultoria, fiduciária ou profissional. Antes de tomares uma decisão sobre o teu dinheiro, consulta um profissional devidamente registado na tua jurisdição.

As decisões que tomas são tuas, e as consequências também.

## As calculadoras e os simuladores

As [calculadoras]({{tools}}) e os simuladores fazem aritmética com os números que introduzes e com os pressupostos que cada página declara. Os resultados são **estimativas ilustrativas, não previsões**: não modelam inflação real, impostos, comissões futuras, quedas de mercado, mudanças nos teus rendimentos nem o comportamento de nenhum mercado concreto. Uma rentabilidade passada não se repete só porque uma calculadora a prolongou em linha reta.

Todo o cálculo acontece no teu navegador e nada é guardado — exceto as simulações que escolhas guardar: uma pontuação enviada para uma classificação, ou um cenário acrescentado aos [dados públicos]({{data}}).

## Os modelos

Os modelos de folha de cálculo são gratuitos para uso pessoal. Copia-os, altera-os, usa-os como quiseres nas tuas próprias finanças. Não podes revendê-los, redistribuí-los como produto próprio nem apresentá-los como material de outra pessoa. São entregues como estão, sem garantia: verifica as fórmulas antes de confiar uma decisão importante a uma folha de cálculo.

## As classificações e os dados públicos

Se enviares uma pontuação para a classificação de um simulador, aceitas que o nome visível e a pontuação sejam públicos. Não escrevas lá dados pessoais — teus ou de terceiros. Qualquer entrada com dados pessoais de terceiros, insultos, publicidade ou tentativas de manipular a tabela pode ser removida sem aviso.

Se guardares uma simulação nos [dados públicos]({{data}}), aceitas que os seus números e escolhas sejam publicados de forma agregada — médias, percentagens e distribuições —, sem nome e sem identificador. Nunca se publica uma simulação isolada, e nenhuma medida é publicada abaixo da sua amostra mínima. Esses dados podem ser usados em artigos deste site e citados com atribuição.

## As sessões

As [sessões]({{sessions}}) são de educação e acompanhamento: rever modelos, compreender conceitos, organizar hábitos, definir objetivos. **Não incluem recomendações de investimento, seleção de produtos, gestão de carteiras nem planeamento fiscal**, e não substituem um consultor registado. Cada sessão é contratada em separado e as suas condições concretas são acordadas por escrito antes do pagamento.

## Propriedade intelectual

Os textos, os modelos, o código e o design deste site são obra de Sandy Bradbury e estão protegidos por direitos de autor. Podes citar passagens curtas com atribuição e um link para a página original. Não podes republicar artigos completos, usar o conteúdo para treinar modelos comerciais fechados nem reproduzir o site.

## Links para terceiros

Alguns artigos remetem para livros, ferramentas ou páginas de terceiros. Esses links são referências, não recomendações, e não controlo o que publicam nem o que fazem com os teus dados.

## Disponibilidade e alterações

O site é oferecido como está, sem garantia de disponibilidade contínua. Posso alterar, mover ou retirar qualquer conteúdo; quando uma página mudar de endereço, tentarei que a antiga redirecione para a nova.

## Responsabilidade

Na medida permitida pela lei, não assumo responsabilidade por perdas resultantes do uso deste site, da interpretação do seu conteúdo, de um erro num cálculo ou num modelo, ou da indisponibilidade do serviço. Nada disto limita os direitos que a lei do consumo te reconhece como consumidor.

## Lei aplicável

Estes termos regem-se pela lei espanhola. Se és consumidor, mantés o direito de recorrer aos tribunais do teu local de residência.

## Contacto

Qualquer dúvida sobre esta página: **san.bradbury@gmail.com**. Sobre dados pessoais, vê a [política de privacidade]({{privacy}}); sobre a titularidade do site, o [aviso legal]({{notice}}).
`
    }
  }
  ,
  notice: {
    es: {
      title: 'Aviso legal',
      description: 'Titularidad de compoundingjourney.com y aclaración sobre la naturaleza del contenido: Sandy Bradbury es educador financiero, no asesor financiero acreditado.',
      heading: 'Aviso legal',
      intro: 'Quién está detrás de este sitio, qué hace y, sobre todo, qué no hace.',
      body: `
## Titular del sitio

- **Titular:** Sandy Bradbury, persona física.
- **Residencia:** España.
- **Correo electrónico:** san.bradbury@gmail.com
- **Sitio web:** https://compoundingjourney.com

El domicilio completo y los datos fiscales están a disposición de cualquier persona con un interés legítimo, previa solicitud al correo anterior. Este sitio no realiza ventas online: las [sesiones]({{sessions}}) se contratan por correo, caso por caso.

## Qué es Compounding Journey

Un sitio de **educación financiera**: artículos, un glosario, calculadoras, simuladores y plantillas de hoja de cálculo sobre finanzas personales, inversión a largo plazo y psicología del dinero. Su propósito es explicar cómo funcionan las cosas para que quien lea pueda decidir mejor por su cuenta.

## Sandy Bradbury no es asesor financiero acreditado

Conviene decirlo aquí, en la página que existe precisamente para identificar al responsable del sitio:

**Sandy Bradbury se presenta como educador financiero. Está en proceso de obtener una certificación de asesoramiento financiero y, hasta que la obtenga, no ejerce ni se presenta como asesor financiero acreditado.**

En consecuencia:

- Este sitio **no presta servicios de inversión** de los reservados por la normativa española y europea (asesoramiento en materia de inversión, gestión de carteras, recepción y transmisión de órdenes o colocación de instrumentos financieros).
- **No está registrado ni supervisado por la Comisión Nacional del Mercado de Valores (CNMV)** ni por ninguna otra autoridad financiera, porque no realiza ninguna actividad que requiera ese registro.
- **No se ofrecen recomendaciones personalizadas.** Ningún contenido tiene en cuenta la situación particular de quien lo lee, y ninguna calculadora conoce tu caso.
- **No se gestiona ni se custodia dinero de nadie.** Este sitio nunca pedirá que le transfieras fondos para invertir. Si alguien lo hace en su nombre, es un fraude: escríbeme.

Si buscas asesoramiento financiero, busca un profesional o una entidad inscrita en los registros oficiales de la CNMV, que son públicos y consultables en www.cnmv.es.

## Propiedad intelectual e industrial

Los contenidos de este sitio —textos, plantillas, código, diseño, nombre y logotipo— pertenecen a Sandy Bradbury, salvo cuando se indique otra autoría. Su uso está sujeto a los [términos de uso]({{terms}}).

## Responsabilidad

El contenido se publica de buena fe y se revisa, pero puede contener errores o quedar desactualizado. No se garantiza que la información sea completa ni aplicable a un caso concreto, y no se asume responsabilidad por las decisiones que alguien tome a partir de ella, en los términos del apartado de responsabilidad de los [términos de uso]({{terms}}).

## Datos personales

El tratamiento de datos personales se describe en la [política de privacidad]({{privacy}}). En resumen: este sitio no usa cookies, no lleva analítica de terceros y no contacta con ningún tercero cuando cargas una página.

## Legislación aplicable

Este aviso se rige por la legislación española, en particular por la Ley 34/2002 de servicios de la sociedad de la información y de comercio electrónico.
`
    },
    en: {
      title: 'Legal notice',
      description: 'Who owns compoundingjourney.com, and a clear statement about the nature of the content: Sandy Bradbury is a financial educator, not an accredited financial adviser.',
      heading: 'Legal notice',
      intro: 'Who is behind this site, what it does, and above all what it does not do.',
      body: `
## Site owner

- **Owner:** Sandy Bradbury, acting as an individual.
- **Country of residence:** Spain.
- **Email:** san.bradbury@gmail.com
- **Website:** https://compoundingjourney.com

The full postal address and tax details are available to anyone with a legitimate interest, on request to the address above. This site sells nothing online: the [sessions]({{sessions}}) are arranged by email, case by case.

## What Compounding Journey is

A **financial education** site: articles, a glossary, calculators, simulators and spreadsheet templates about personal finance, long-term investing and the psychology of money. Its purpose is to explain how things work so that whoever reads it can decide better on their own.

## Sandy Bradbury is not an accredited financial adviser

This is the page that exists to identify who is responsible for the site, so it belongs here:

**Sandy Bradbury works as a financial educator, and is in the process of obtaining a financial advice certification. Until that certification is held, Sandy neither practises nor holds themselves out as an accredited financial adviser.**

It follows that:

- This site **does not provide regulated investment services** — no investment advice, portfolio management, order handling, or placing of financial instruments, in the sense Spanish and European law reserve those terms.
- It is **not registered with or supervised by the Spanish securities regulator (CNMV)** or any other financial authority, because it carries out no activity requiring that registration.
- **No personal recommendations are given.** No article takes account of the reader's own situation, and no calculator knows your case.
- **Nobody's money is managed or held here.** This site will never ask you to transfer funds for investment. If someone does so in its name, it is a fraud: write to me.

If you want financial advice, look for a professional or a firm listed in the CNMV's official registers, which are public and searchable at www.cnmv.es, or in the equivalent register in your country.

## Intellectual property

The contents of this site — text, templates, code, design, name and logo — belong to Sandy Bradbury, except where another author is credited. Their use is subject to the [terms of use]({{terms}}).

## Liability

The content is published in good faith and reviewed, but it may contain errors or fall out of date. No warranty is given that the information is complete or applicable to any particular case, and no liability is accepted for decisions taken on the basis of it, on the terms set out in the liability section of the [terms of use]({{terms}}).

## Personal data

How personal data is handled is described in the [privacy policy]({{privacy}}). In short: this site uses no cookies, runs no third-party analytics, and contacts no third party when you load a page.

## Governing law

This notice is governed by Spanish law, in particular Law 34/2002 on information society services and electronic commerce.
`
    },
    pt: {
      title: 'Aviso legal',
      description: 'Titularidade de compoundingjourney.com e esclarecimento sobre a natureza do conteúdo: Sandy Bradbury é educador financeiro, não consultor financeiro acreditado.',
      heading: 'Aviso legal',
      intro: 'Quem está por trás deste site, o que faz e, sobretudo, o que não faz.',
      body: `
## Titular do site

- **Titular:** Sandy Bradbury, pessoa singular.
- **País de residência:** Espanha.
- **Email:** san.bradbury@gmail.com
- **Site:** https://compoundingjourney.com

O endereço postal completo e os dados fiscais estão à disposição de quem tenha um interesse legítimo, a pedido para o email acima. Este site não vende nada online: as [sessões]({{sessions}}) são combinadas por email, caso a caso.

## O que é o Compounding Journey

Um site de **educação financeira**: artigos, um glossário, calculadoras, simuladores e modelos de folha de cálculo sobre finanças pessoais, investimento de longo prazo e psicologia do dinheiro. O propósito é explicar como as coisas funcionam para que quem lê possa decidir melhor por si.

## Sandy Bradbury não é consultor financeiro acreditado

Esta é a página que existe para identificar o responsável pelo site, por isso é aqui que isto se diz:

**Sandy Bradbury apresenta-se como educador financeiro. Está em processo de obtenção de uma certificação de consultoria financeira e, até a obter, não exerce nem se apresenta como consultor financeiro acreditado.**

Em consequência:

- Este site **não presta serviços de investimento** reservados pela legislação espanhola e europeia (consultoria para investimento, gestão de carteiras, receção e transmissão de ordens ou colocação de instrumentos financeiros).
- **Não está registado nem supervisionado pela CNMV, pela CMVM** ou por qualquer outra autoridade financeira, porque não desenvolve nenhuma atividade que exija esse registo.
- **Não são dadas recomendações personalizadas.** Nenhum conteúdo tem em conta a situação particular de quem o lê, e nenhuma calculadora conhece o teu caso.
- **Não se gere nem se guarda o dinheiro de ninguém.** Este site nunca te pedirá para transferir fundos para investir. Se alguém o fizer em seu nome, é fraude: escreve-me.

Se procuras consultoria financeira, procura um profissional ou uma entidade inscrita nos registos oficiais da CMVM (www.cmvm.pt) ou da CNMV (www.cnmv.es), que são públicos e consultáveis.

## Propriedade intelectual

Os conteúdos deste site — textos, modelos, código, design, nome e logótipo — pertencem a Sandy Bradbury, salvo quando outra autoria for indicada. A sua utilização está sujeita aos [termos de utilização]({{terms}}).

## Responsabilidade

O conteúdo é publicado de boa-fé e revisto, mas pode conter erros ou ficar desatualizado. Não se garante que a informação seja completa ou aplicável a um caso concreto, nem se assume responsabilidade pelas decisões tomadas com base nela, nos termos da secção de responsabilidade dos [termos de utilização]({{terms}}).

## Dados pessoais

O tratamento de dados pessoais está descrito na [política de privacidade]({{privacy}}). Em resumo: este site não usa cookies, não tem análise de terceiros e não contacta nenhum terceiro quando carregas uma página.

## Legislação aplicável

Este aviso rege-se pela lei espanhola, em particular pela Lei 34/2002 dos serviços da sociedade da informação e do comércio eletrónico.
`
    }
  }
};
