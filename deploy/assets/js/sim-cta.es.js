/**
 * El texto en español de la llamada a la acción que depende del resultado. Lo
 * lee assets/js/sim-cta.js, que contiene la maquinaria y ninguna frase.
 *
 * Un archivo por idioma, escrito a mano, y no tres columnas de una tabla de
 * cadenas. Todo lo que hay aquí está escrito para leerse en un momento muy
 * concreto - el segundo en que un simulador le dice algo a alguien sobre su
 * propio dinero - y la lectura en español de un plan de jubilación que fracasa
 * no es la traducción de la inglesa.
 *
 * Cada resultado sigue los mismos cuatro pasos, en este orden:
 *
 *   title   la cifra de quien juega, y qué significa
 *   body    la lectura honesta, incluido lo que la herramienta no puede ver
 *   lever   la única palanca que movería el resultado
 *   route   el siguiente paso que se deduce de los tres anteriores
 *
 * Los marcadores `{token}` se rellenan con las cifras que entrega el simulador.
 * Un token que no llegue se queda visible en lugar de vaciarse: así un desajuste
 * entre este archivo y el código que lo invoca aparece en la página, en vez de
 * leerse como una frase terminada con un hueco dentro.
 *
 * `primaryRoute` elige el destino, y está junto a la frase que lo pide porque
 * las dos cosas son una sola decisión:
 *
 *   financialSnapshot   ingresos, gastos, activos, deudas - el balance
 *   investmentProfile   objetivos, horizonte, experiencia, tolerancia a la caída
 *   contact             el formulario del sitio, para los resultados en los que
 *                       un cuestionario largo es lo último que necesita alguien
 *   templates           las plantillas gratuitas
 *
 * La regla de tono que más importa: un resultado que salió mal recibe primero
 * cercanía y después la propuesta, y nunca una cifra devuelta como reproche.
 * Estas herramientas las usa gente preocupada por su dinero, y convertir un
 * resultado en palanca de venta es lo único aquí que costaría más de lo que
 * puede dar.
 */
window.SIM_CTA_COPY = {
  ui: {
    formHeading: "¿Quieres que te devuelva tu resultado por escrito?",
    formLabel: "Correo electrónico",
    formPlaceholder: "tu@ejemplo.com",
    formSubmit: "Envíame mi resultado",
    formSubmitting: "Enviando…",
    formNote: "Déjame tu correo y te mando tu resultado con lo que se deduce de él — escrito por mí, no automatizado. Nada más, y sin suscribirte a ninguna lista salvo que me lo pidas.",
    formSuccessTitle: "Recibido — gracias.",
    formSuccessBody: "Tu resultado ya me ha llegado y te contesto personalmente. Si prefieres no esperar, el paso que tienes abajo es el mismo que te indicaría yo.",
    formErrorInvalid: "Eso no parece un correo electrónico, ¿lo revisas?",
    formErrorFailed: "No se ha podido enviar. Inténtalo otra vez o usa el formulario de contacto de la página principal.",
    formSubject: "Resultado del simulador",
    disclaimer: "Estos simuladores son ilustraciones construidas sobre supuestos simplificados. Esto es una lectura de tu resultado, no asesoramiento financiero."
  },

  buckets: {
    /* =============================================================
       CALENDARIO DE LIBERTAD — hábitos, y lo que cuestan en años
       ============================================================= */
    "freedom-calendar": {
      stalled: {
        eyebrow: "Lo que dice tu resultado",
        title: "Con estas cifras, recortar hábitos no basta para llegar.",
        body: "Incluso eliminando todos los hábitos, el modelo no alcanza la independencia financiera dentro de su horizonte. Eso casi siempre significa que la brecha es estructural y no de comportamiento — y conviene saberlo pronto, porque ninguna cantidad de disciplina cierra una brecha con esta forma. Lo que la mueve son los ingresos, el coste de la deuda que arrastres y dónde está realmente colocado tu ahorro.",
        lever: "Lo primero es establecer qué tienes y qué debes, no qué podrías recortar.",
        primaryLabel: "Hablémoslo directamente",
        primaryRoute: "contact",
        secondaryLabel: "O empieza por las plantillas gratuitas",
        secondaryRoute: "templates"
      },
      modest: {
        eyebrow: "Lo que dice tu resultado",
        title: "Adelantaste tu fecha de libertad {years} años — de los {baselineAge} a los {age}.",
        body: "{monthly} al mes son {workDays} días de trabajo al año que ya no tienes que vender. Es un resultado real y viene entero de los hábitos que esta herramienta puede ver. Las palancas grandes — lo que ganas, lo que debes y en qué está invertido tu ahorro — son justamente las que no ve.",
        lever: "Tu mayor ahorro aquí es {topHabit}, con {topHabitMonthly} al mes. Merece la pena comprobar si de verdad es tu fuga más grande o simplemente el control más fácil de mover.",
        primaryLabel: "Pon tus cifras reales sobre la mesa",
        primaryRoute: "financialSnapshot",
        secondaryLabel: "O hazme una pregunta y ya está",
        secondaryRoute: "contact"
      },
      strong: {
        eyebrow: "Lo que dice tu resultado",
        title: "{years} años antes — a los {age} en lugar de los {baselineAge}.",
        body: "Has encontrado {monthly} al mes, que compuestos son {wealth} en treinta años y te devuelven {workDays} días de trabajo cada año. La trampa está en el supuesto de debajo: el modelo espera que lo mantengas tres décadas, y casi nadie sostiene un cambio de este tamaño a base de voluntad. Se sostiene con estructura.",
        lever: "Convertir esos {monthly} al mes en una orden automática, antes de que el dinero llegue a tu cuenta corriente, es lo que hace que un resultado así aguante.",
        primaryLabel: "Constrúyelo sobre tus cifras reales",
        primaryRoute: "financialSnapshot",
        secondaryLabel: "O descarga la plantilla de presupuesto gratuita",
        secondaryRoute: "templates"
      },
      major: {
        eyebrow: "Lo que dice tu resultado",
        title: "Acabas de mover tu fecha de libertad {years} años — a los {age}.",
        body: "{monthly} al mes, {workDays} días de trabajo al año, {wealth} en treinta años. Un resultado tan grande suele significar una de dos cosas: que el punto de partida era genuinamente caro, o que has recortado hasta un nivel en el que en realidad no vivirías. Saber cuál de las dos es cambia por completo lo que hay que hacer después.",
        lever: "La pregunta no es si la aritmética funciona — funciona. Es cuáles de estos recortes seguirías haciendo en el quinto año.",
        primaryLabel: "Ponlo a prueba con tus cifras reales",
        primaryRoute: "financialSnapshot",
        secondaryLabel: "O hablémoslo directamente",
        secondaryRoute: "contact"
      }
    },

    /* =============================================================
       MÁQUINA DEL TIEMPO — la cartera frente a un siglo de historia
       ============================================================= */
    "market-time-machine": {
      beat: {
        eyebrow: "Lo que dice tu resultado",
        title: "Tu cartera terminó en {customVal} — {diff} por delante de un 60/40 corriente.",
        body: "{customCagr}% anual frente a {classicCagr}%, a lo largo de {years} años, de {startYear} a {endYear}. En las cifras, ganaste. Lo que el gráfico no puede decirte es si la habrías aguantado: esa misma cartera pasó por tramos en los que perdió un tercio de su valor, y la rentabilidad solo fue de quien seguía dentro al otro lado.",
        lever: "La pregunta útil no es qué cartera gana el backtest. Es en cuál te habrías quedado durante sus tres peores años.",
        primaryLabel: "Averigua qué aguantarías de verdad",
        primaryRoute: "investmentProfile",
        secondaryLabel: "O pregúntame por tu propia cartera",
        secondaryRoute: "contact"
      },
      lagged: {
        eyebrow: "Lo que dice tu resultado",
        title: "Tu cartera terminó en {customVal} — {diff} por detrás de un 60/40 corriente.",
        body: "{customCagr}% anual frente a {classicCagr}%, a lo largo de {years} años. Es el resultado más frecuente de esta herramienta y no es un error: es lo que pasa cuando la cartera se elige por intuición en lugar de decidirse de antemano. Al índice aburrido es difícil ganarle precisamente porque nunca cambia de opinión.",
        lever: "Una cartera merece decidirse una vez, por escrito, antes de que un mal año decida por ti.",
        primaryLabel: "Decide la tuya como se debe",
        primaryRoute: "investmentProfile",
        secondaryLabel: "O hablémoslo directamente",
        secondaryRoute: "contact"
      },
      inflationExposed: {
        eyebrow: "Lo que dice tu resultado",
        title: "Llevabas un {cashGold}% en liquidez y oro, y terminaste en {customVal}.",
        body: "En {years} años fue la cartera más tranquila de llevar de un año para otro, y acabó {diff} por detrás de un 60/40 corriente. La liquidez y el oro te protegen de las pérdidas que puedes ver ocurrir. La inflación es la que nunca se anuncia, y en un horizonte tan largo es la que compone en tu contra.",
        lever: "Estar seguro un año y estar seguro treinta son problemas distintos, y tienen respuestas distintas.",
        primaryLabel: "Aclara cuál de los dos estás resolviendo",
        primaryRoute: "investmentProfile",
        secondaryLabel: "O pregúntame directamente",
        secondaryRoute: "contact"
      }
    },

    /* =============================================================
       MONTE CARLO FIRE — si un plan de jubilación sobrevive
       ============================================================= */
    "monte-carlo-fire": {
      crashed: {
        eyebrow: "Tu informe de vuelo",
        title: "La cartera se agotó a los {age} años.",
        body: "Volaste {years} años con {nestEgg} retirando {spending} al año — alrededor del {swr}% — y el dinero llegó a cero antes de que terminase el vuelo. Vale decirlo claro: es el fallo más común del modelo y es un problema de secuencia, no de disciplina. El mismo plan sobrevive a menudo con otro orden de rentabilidades, con una retirada algo menor en los primeros años, o con liquidez apartada para el primer tramo malo.",
        lever: "La cifra que más cambia este final no es la rentabilidad que supongas. Es cuánto retiras en los cinco primeros años.",
        primaryLabel: "Hablémoslo directamente",
        primaryRoute: "contact",
        secondaryLabel: "O revisa antes tu perfil de riesgo",
        secondaryRoute: "investmentProfile"
      },
      fragile: {
        eyebrow: "Tu informe de vuelo",
        title: "Aterrizaste — después de {crashYears} años a altitud cero.",
        body: "El plan llegó a los {age} y terminó con {finalBalance}. Pero pasó {crashYears} años rozando el suelo, y eso es justo lo que una probabilidad de supervivencia no recoge: un plan que funciona sobre el papel y te da miedo en el año doce no es un plan que sigas en el año trece. Casi todos los planes de jubilación abandonados se abandonaron en un tramo exactamente así.",
        lever: "Lo importante no es si el plan puede sobrevivir a ese tramo. Es si puedes tú.",
        primaryLabel: "Averigua qué aguantarías",
        primaryRoute: "investmentProfile",
        secondaryLabel: "O hablémoslo directamente",
        secondaryRoute: "contact"
      },
      comfortable: {
        eyebrow: "Tu informe de vuelo",
        title: "Terminaste con {finalBalance} — unas {multiple}× lo que tenías al empezar.",
        body: "El plan no solo sobrevivió hasta los {age}: acabó con mucho más de lo que empezó. Eso se lee como una victoria, y lo es — pero también significa que el plan está sobrefinanciado. Con estas cifras podrías haber parado antes, retirado más de {spending} al año, o asumido menos riesgo para llegar al mismo sitio. Un excedente grande al final también es un coste. Solo que es un coste más silencioso.",
        lever: "Lo que plantea esta partida no es si tendrás suficiente. Es cuánta vida estás gastando en tener de más.",
        primaryLabel: "Mira qué podrías cambiar sin riesgo",
        primaryRoute: "investmentProfile",
        secondaryLabel: "O hablémoslo directamente",
        secondaryRoute: "contact"
      },
      landed: {
        eyebrow: "Tu informe de vuelo",
        title: "Aterrizaste a los {age} con {finalBalance} en el depósito.",
        body: "Una retirada del {swr}% sobre {nestEgg}, sostenida {years} años. Es un plan que funciona — en una secuencia de rentabilidades, que es una de las miles que podía haber salido. La diferencia entre un plan que sobrevive a una secuencia amable y uno que sobrevive a una cruel está casi siempre en los cinco primeros años, y en lo que tengas apartado para atravesarlos.",
        lever: "Un vuelo bueno es un resultado. Lo que importa es cómo se comporta el plan en las partidas en las que fracasa.",
        primaryLabel: "Pruébalo contra tu perfil real",
        primaryRoute: "investmentProfile",
        secondaryLabel: "O hazme una pregunta",
        secondaryRoute: "contact"
      }
    },

    /* =============================================================
       MOTOR DE INGRESOS PASIVOS — ingresos frente a gastos, y la vida
       que llevas mientras esperas
       ============================================================= */
    "passive-income-engine": {
      crossoverJoyful: {
        eyebrow: "Lo que dice tu resultado",
        title: "Cruce en {years} años — {passive} al mes frente a {expenses}.",
        body: "Y llegaste con un índice de disfrute de {joy} sobre 100, que es la mitad difícil de este juego: libertad, y una vida que de verdad querrías estar viviendo por el camino. Lo que la herramienta se salta es todo lo que hace desordenados a los activos reales — impuestos, meses vacíos, costes de transacción y los años en que la renta simplemente no llega.",
        lever: "La combinación que funciona en el simulador es la versión fácil. La pregunta real es cómo queda después de impuestos, donde vives tú.",
        primaryLabel: "Trasládalo a tus cifras reales",
        primaryRoute: "financialSnapshot",
        secondaryLabel: "O hablémoslo directamente",
        secondaryRoute: "contact"
      },
      crossoverBalanced: {
        eyebrow: "Lo que dice tu resultado",
        title: "Cruzaste en {years} años — {passive} al mes ya cubren {expenses}.",
        body: "Patrimonio {netWorth}, índice de disfrute {joy} sobre 100. La aritmética funciona, y que los ingresos pasivos superen a los gastos es la única definición de independencia que no depende de una proyección. Las carteras reales tardan más que esta, sobre todo por los impuestos y porque los activos que reparten renta rara vez pagan lo que promete su rentabilidad nominal.",
        lever: "La cifra que hay que fijar primero es tu gasto mensual real. Todo lo demás en este modelo es un múltiplo de ella.",
        primaryLabel: "Pon tus cifras reales por escrito",
        primaryRoute: "financialSnapshot",
        secondaryLabel: "O descarga la plantilla de gastos gratuita",
        secondaryRoute: "templates"
      },
      crossoverAscetic: {
        eyebrow: "Lo que dice tu resultado",
        title: "Compraste tu libertad en {years} años — con un índice de disfrute de {joy} sobre 100.",
        body: "{passive} al mes frente a {expenses}, y llegaste recortando casi todo lo que hace que una vida se parezca a una vida. Es la ruta más rápida de la herramienta y la que casi nadie termina. La pregunta honesta no es si la aritmética funciona, sino si seguirías viviendo así en el año ocho, sin manera de saber cómo acaba la historia.",
        lever: "Un plan que abandonarías a mitad es más lento que un plan más largo que sí terminarías.",
        primaryLabel: "Hablemos de una versión que sí vivirías",
        primaryRoute: "contact",
        secondaryLabel: "O empieza por tus cifras reales",
        secondaryRoute: "financialSnapshot"
      },
      close: {
        eyebrow: "Lo que dice tu resultado",
        title: "Te faltan {gap} al mes para cubrir tus gastos — llevas el {coverage}% del camino.",
        body: "Después de {years} años, {passive} al mes frente a {expenses}. De aquí en adelante es aritmética y no estrategia: el último tramo se cierra sumando activos que generen renta o bajando la línea de gastos, y cuál de las dos sale más barata depende por completo de unas cifras que esta herramienta se inventó por ti.",
        lever: "Esos {gap} al mes son todo lo que queda. Merece la pena saber cuánto es esa cifra en tu vida real.",
        primaryLabel: "Averigua cuál es tu brecha real",
        primaryRoute: "financialSnapshot",
        secondaryLabel: "O descarga la plantilla de presupuesto gratuita",
        secondaryRoute: "templates"
      },
      far: {
        eyebrow: "Lo que dice tu resultado",
        title: "{coverage}% cubierto después de {years} años — {passive} frente a {expenses} al mes.",
        body: "Es más lento de lo que consiguen los optimistas de la herramienta, y es también su resultado más realista. Lo interesante es ver qué palanca movió de verdad la cifra: los ingresos pasivos componen tarde y despacio, mientras que la línea de gastos se mueve el día que la cambias. Casi todo el mundo, al empezar, subestima la segunda.",
        lever: "Antes de elegir activos, averigua cuáles son tus costes reales. Es el único dato del que dependen todas las demás cifras.",
        primaryLabel: "Empieza por la radiografía financiera",
        primaryRoute: "financialSnapshot",
        secondaryLabel: "O descarga la plantilla de gastos gratuita",
        secondaryRoute: "templates"
      }
    },

    /* =============================================================
       SIMULADOR PRINCIPAL — quince decisiones, y por qué grupo se
       escaparon. El resultado es la categoría más débil, que es
       también lo que decide cuál de los dos formularios toca.
       ============================================================= */
    "simulator-hub": {
      investing: {
        eyebrow: "Tu diagnóstico",
        title: "{archetype} — {score}% de alfabetización, y tu punto flojo en {weakest} con un {weakestPct}%.",
        body: "En {strongest} saliste bien, con un {strongestPct}%. {weakest} es donde te costó esta partida, y es el grupo más caro de dejar como está: esas decisiones componen, así que un error ahí te sigue cobrando todo el tiempo que lo mantengas. Acabaste con un patrimonio de {netWorth} y {cashFlow} al mes de flujo de caja.",
        lever: "La cartera y las comisiones merecen decidirse una vez, a propósito, en lugar de quedar decididas por lo primero que compraste.",
        primaryLabel: "Define tu perfil de inversión",
        primaryRoute: "investmentProfile",
        secondaryLabel: "O pregúntame por una decisión concreta",
        secondaryRoute: "contact"
      },
      debt: {
        eyebrow: "Tu diagnóstico",
        title: "{archetype} — {score}% de alfabetización, y tu punto flojo en {weakest} con un {weakestPct}%.",
        body: "En {strongest} estuviste sólido, con un {strongestPct}%. {weakest} es por donde se fue la partida. El apalancamiento es el grupo menos indulgente de todos porque el coste es contractual y el beneficio es solo un pronóstico: los intereses llegan haga lo que haga el mercado. Acabaste con un patrimonio de {netWorth} y {cashFlow} al mes de flujo de caja.",
        lever: "Toda decisión de deuda es una comparación, y no se puede hacer sin ver el balance completo de una vez.",
        primaryLabel: "Pon tu balance por escrito",
        primaryRoute: "financialSnapshot",
        secondaryLabel: "O hablémoslo directamente",
        secondaryRoute: "contact"
      },
      spending: {
        eyebrow: "Tu diagnóstico",
        title: "{archetype} — {score}% de alfabetización, y tu punto flojo en {weakest} con un {weakestPct}%.",
        body: "En {strongest} saliste fuerte, con un {strongestPct}%. {weakest} es la brecha — y es la que menos veces se le muestra a alguien con honestidad, porque es la única que obliga a mirar lo que salió de verdad de la cuenta y no lo que estaba previsto que saliera. Acabaste con un patrimonio de {netWorth} y {cashFlow} al mes de flujo de caja.",
        lever: "Quince días apuntando cada gasto te dirán más sobre esto que cualquier proyección.",
        primaryLabel: "Descarga la plantilla de gastos gratuita",
        primaryRoute: "templates",
        secondaryLabel: "Y después traza el cuadro completo",
        secondaryRoute: "financialSnapshot"
      },
      tax: {
        eyebrow: "Tu diagnóstico",
        title: "{archetype} — {score}% de alfabetización, y tu punto flojo en {weakest} con un {weakestPct}%.",
        body: "En {strongest} estuviste fuerte, con un {strongestPct}%. {weakest} es donde esta partida regaló dinero. Es el único grupo en el que la ganancia está garantizada y no solo esperada, lo que convierte el no reclamarla en el hábito más caro del conjunto. Acabaste con un patrimonio de {netWorth}.",
        lever: "El margen fiscal, en la mayoría de los años, se usa o se pierde. Eso lo convierte en lo primero que hay que revisar, no en lo último.",
        primaryLabel: "Define tu perfil y tu horizonte",
        primaryRoute: "investmentProfile",
        secondaryLabel: "O pregúntame directamente",
        secondaryRoute: "contact"
      },
      risk: {
        eyebrow: "Tu diagnóstico",
        title: "{archetype} — {score}% de alfabetización, y tu punto flojo en {weakest} con un {weakestPct}%.",
        body: "En {strongest} saliste bien, con un {strongestPct}%. {weakest} es la exposición. Las decisiones de protección cuestan un poco cada año e importan exactamente una vez, que es justo la forma que tienen las decisiones que se aplazan para siempre. Acabaste con un patrimonio de {netWorth}.",
        lever: "La brecha que conviene cerrar primero es la que, con un solo año malo, desharía una década de todo lo demás.",
        primaryLabel: "Define tu perfil de riesgo",
        primaryRoute: "investmentProfile",
        secondaryLabel: "O hablémoslo directamente",
        secondaryRoute: "contact"
      },
      allStrong: {
        eyebrow: "Tu diagnóstico",
        title: "{archetype} — {score}% de alfabetización, y ninguna categoría débil.",
        body: "Tu área más baja fue {weakest}, con un {weakestPct}%, que es una partida fuerte se mire como se mire. Resolver quince escenarios así de limpio suele significar que el conocimiento no es la limitación. Lo que queda es la parte difícil: hacerlo de forma constante con dinero real, impuestos reales y una vida real alrededor.",
        lever: "Cuando el conocimiento ya está, la rentabilidad viene de la estructura — y de no cambiar de opinión en el momento equivocado.",
        primaryLabel: "Define tu perfil de inversión",
        primaryRoute: "investmentProfile",
        secondaryLabel: "O tráeme una decisión concreta",
        secondaryRoute: "contact"
      }
    }
  }
};
