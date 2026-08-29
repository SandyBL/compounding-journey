/**
 * O texto em português da chamada à ação que depende do resultado. É lido por
 * assets/js/sim-cta.js, que contém a maquinaria e nenhuma frase.
 *
 * Um ficheiro por idioma, escrito à mão, e não três colunas de uma tabela de
 * cadeias. Tudo o que está aqui foi escrito para ser lido num momento muito
 * concreto - o segundo em que um simulador diz algo a alguém sobre o seu próprio
 * dinheiro - e a leitura em português de um plano de reforma que falha não é a
 * tradução da inglesa.
 *
 * Cada resultado segue os mesmos quatro passos, nesta ordem:
 *
 *   title   o número de quem jogou, e o que significa
 *   body    a leitura honesta, incluindo o que a ferramenta não consegue ver
 *   lever   a única alavanca que mudaria o resultado
 *   route   o passo seguinte que decorre dos três anteriores
 *
 * Os marcadores `{token}` são preenchidos com os números que o simulador
 * entrega. Um token que não chegue fica visível em vez de ser esvaziado: assim
 * um desencontro entre este ficheiro e o código que o invoca aparece na página,
 * em vez de se ler como uma frase acabada com um buraco lá dentro.
 *
 * `primaryRoute` escolhe o destino, e está ao lado da frase que o pede porque as
 * duas coisas são uma só decisão:
 *
 *   financialSnapshot   rendimentos, despesas, ativos, dívidas - o balanço
 *   investmentProfile   objetivos, horizonte, experiência, tolerância à queda
 *   contact             o formulário do site, para os resultados em que um
 *                       questionário longo é a última coisa de que alguém precisa
 *   templates           os modelos gratuitos
 *
 * A regra de tom que mais importa: um resultado que correu mal recebe primeiro
 * proximidade e só depois a proposta, e nunca um número devolvido como censura.
 * Estas ferramentas são usadas por pessoas preocupadas com o seu dinheiro, e
 * transformar um resultado em alavanca de venda é a única coisa aqui que
 * custaria mais do que pode dar.
 */
window.SIM_CTA_COPY = {
  ui: {
    formHeading: "Queres que te devolva o teu resultado por escrito?",
    formLabel: "Correio eletrónico",
    formPlaceholder: "tu@exemplo.com",
    formSubmit: "Envia-me o meu resultado",
    formSubmitting: "A enviar…",
    formNote: "Deixa-me o teu email e envio-te o teu resultado com o que dele se conclui — escrito por mim, não automatizado. Nada mais, e sem te inscrever em nenhuma lista a não ser que peças.",
    formSuccessTitle: "Recebido — obrigado.",
    formSuccessBody: "O teu resultado já me chegou e respondo-te pessoalmente. Se preferires não esperar, o passo que tens abaixo é o mesmo que eu te indicaria.",
    formErrorInvalid: "Isso não parece um endereço de email — podes verificar?",
    formErrorFailed: "Não foi possível enviar. Tenta outra vez ou usa o formulário de contacto da página inicial.",
    formSubject: "Resultado do simulador",
    disclaimer: "Estes simuladores são ilustrações construídas sobre pressupostos simplificados. Isto é uma leitura do teu resultado, não aconselhamento financeiro."
  },

  buckets: {
    /* =============================================================
       CALENDÁRIO DA LIBERDADE — hábitos, e o que custam em anos
       ============================================================= */
    "freedom-calendar": {
      stalled: {
        eyebrow: "O que diz o teu resultado",
        title: "Com estes números, cortar hábitos não chega para lá chegar.",
        body: "Mesmo eliminando todos os hábitos, o modelo não alcança a independência financeira dentro do seu horizonte. Isso quase sempre significa que a diferença é estrutural e não comportamental — e vale a pena sabê-lo cedo, porque nenhuma dose de disciplina fecha uma diferença com esta forma. O que a move são os rendimentos, o custo da dívida que carregues e onde está realmente colocada a tua poupança.",
        lever: "O primeiro passo é estabelecer o que tens e o que deves, não o que poderias cortar.",
        primaryLabel: "Vamos falar diretamente",
        primaryRoute: "contact",
        secondaryLabel: "Ou começa pelos modelos gratuitos",
        secondaryRoute: "templates"
      },
      modest: {
        eyebrow: "O que diz o teu resultado",
        title: "Antecipaste a tua data de liberdade {years} anos — dos {baselineAge} para os {age}.",
        body: "{monthly} por mês são {workDays} dias de trabalho por ano que já não tens de vender. É um resultado real e vem inteiro dos hábitos que esta ferramenta consegue ver. As alavancas grandes — o que ganhas, o que deves e em que está investida a tua poupança — são justamente as que ela não vê.",
        lever: "A tua maior poupança aqui é {topHabit}, com {topHabitMonthly} por mês. Vale a pena confirmar se é de facto a tua maior fuga ou apenas o controlo mais fácil de mexer.",
        primaryLabel: "Põe os teus números reais em cima da mesa",
        primaryRoute: "financialSnapshot",
        secondaryLabel: "Ou faz-me só uma pergunta",
        secondaryRoute: "contact"
      },
      strong: {
        eyebrow: "O que diz o teu resultado",
        title: "{years} anos mais cedo — aos {age} em vez dos {baselineAge}.",
        body: "Encontraste {monthly} por mês, que compostos dão {wealth} em trinta anos e te devolvem {workDays} dias de trabalho todos os anos. A armadilha está no pressuposto que vem por baixo: o modelo espera que aguentes isto durante três décadas, e quase ninguém sustenta uma mudança deste tamanho à base de força de vontade. Sustenta-se com estrutura.",
        lever: "Transformar esses {monthly} por mês numa transferência automática, antes de o dinheiro chegar à conta à ordem, é o que faz um resultado assim aguentar-se.",
        primaryLabel: "Constrói isto sobre os teus números reais",
        primaryRoute: "financialSnapshot",
        secondaryLabel: "Ou descarrega o modelo de orçamento gratuito",
        secondaryRoute: "templates"
      },
      major: {
        eyebrow: "O que diz o teu resultado",
        title: "Acabaste de mover a tua data de liberdade {years} anos — para os {age}.",
        body: "{monthly} por mês, {workDays} dias de trabalho por ano, {wealth} em trinta anos. Um resultado tão grande costuma significar uma de duas coisas: que o ponto de partida era genuinamente caro, ou que cortaste até um nível em que, na verdade, não viverias. Saber qual das duas é muda por completo o que há para fazer a seguir.",
        lever: "A questão não é se a aritmética funciona — funciona. É quais destes cortes ainda estarias a fazer no quinto ano.",
        primaryLabel: "Testa-o com os teus números reais",
        primaryRoute: "financialSnapshot",
        secondaryLabel: "Ou vamos falar diretamente",
        secondaryRoute: "contact"
      }
    },

    /* =============================================================
       MÁQUINA DO TEMPO — a carteira contra um século de história
       ============================================================= */
    "market-time-machine": {
      beat: {
        eyebrow: "O que diz o teu resultado",
        title: "A tua carteira terminou em {customVal} — {diff} à frente de um 60/40 comum.",
        body: "{customCagr}% por ano contra {classicCagr}%, ao longo de {years} anos, de {startYear} a {endYear}. Nos números, ganhaste. O que o gráfico não te consegue dizer é se a terias aguentado: essa mesma carteira passou por períodos em que perdeu um terço do seu valor, e o retorno só pertenceu a quem ainda estava dentro do outro lado.",
        lever: "A pergunta útil não é qual carteira ganha o backtest. É em qual ficarias durante os seus três piores anos.",
        primaryLabel: "Descobre o que aguentarias de facto",
        primaryRoute: "investmentProfile",
        secondaryLabel: "Ou pergunta-me sobre a tua própria carteira",
        secondaryRoute: "contact"
      },
      lagged: {
        eyebrow: "O que diz o teu resultado",
        title: "A tua carteira terminou em {customVal} — {diff} atrás de um 60/40 comum.",
        body: "{customCagr}% por ano contra {classicCagr}%, ao longo de {years} anos. É o resultado mais frequente desta ferramenta e não é um erro: é o que acontece quando a carteira se escolhe por instinto em vez de ser decidida de antemão. O índice aborrecido é difícil de bater precisamente porque nunca muda de opinião.",
        lever: "Uma carteira vale a pena ser decidida uma vez, por escrito, antes de um ano mau decidir por ti.",
        primaryLabel: "Decide a tua como deve ser",
        primaryRoute: "investmentProfile",
        secondaryLabel: "Ou vamos falar diretamente",
        secondaryRoute: "contact"
      },
      inflationExposed: {
        eyebrow: "O que diz o teu resultado",
        title: "Tinhas {cashGold}% em liquidez e ouro, e terminaste em {customVal}.",
        body: "Em {years} anos foi a carteira mais tranquila de levar de um ano para o outro, e acabou {diff} atrás de um 60/40 comum. A liquidez e o ouro protegem-te das perdas que consegues ver a acontecer. A inflação é a que nunca se anuncia, e num horizonte tão longo é a que compõe contra ti.",
        lever: "Estar seguro um ano e estar seguro trinta são problemas diferentes, e têm respostas diferentes.",
        primaryLabel: "Esclarece qual dos dois estás a resolver",
        primaryRoute: "investmentProfile",
        secondaryLabel: "Ou pergunta-me diretamente",
        secondaryRoute: "contact"
      }
    },

    /* =============================================================
       MONTE CARLO FIRE — se um plano de reforma sobrevive
       ============================================================= */
    "monte-carlo-fire": {
      crashed: {
        eyebrow: "O teu relatório de voo",
        title: "A carteira esgotou-se aos {age} anos.",
        body: "Voaste {years} anos com {nestEgg} a retirar {spending} por ano — cerca de {swr}% — e o dinheiro chegou a zero antes de o voo terminar. Vale dizê-lo com clareza: é a falha mais comum do modelo e é um problema de sequência, não de disciplina. O mesmo plano sobrevive muitas vezes com outra ordem de retornos, com uma retirada ligeiramente menor nos primeiros anos, ou com liquidez reservada para o primeiro período mau.",
        lever: "O número que mais muda este final não é o retorno que assumes. É quanto retiras nos primeiros cinco anos.",
        primaryLabel: "Vamos falar diretamente",
        primaryRoute: "contact",
        secondaryLabel: "Ou vê primeiro o teu perfil de risco",
        secondaryRoute: "investmentProfile"
      },
      fragile: {
        eyebrow: "O teu relatório de voo",
        title: "Aterraste — depois de {crashYears} anos a altitude zero.",
        body: "O plano chegou aos {age} e terminou com {finalBalance}. Mas passou {crashYears} anos a raspar o chão, e é isso que uma probabilidade de sobrevivência não capta: um plano que funciona no papel e te assusta no ano doze não é um plano que ainda estejas a seguir no ano treze. Quase todos os planos de reforma abandonados foram abandonados num período exatamente assim.",
        lever: "O que importa não é se o plano consegue sobreviver a esse período. É se tu consegues.",
        primaryLabel: "Descobre o que aguentarias",
        primaryRoute: "investmentProfile",
        secondaryLabel: "Ou vamos falar diretamente",
        secondaryRoute: "contact"
      },
      comfortable: {
        eyebrow: "O teu relatório de voo",
        title: "Terminaste com {finalBalance} — cerca de {multiple}× o que tinhas ao começar.",
        body: "O plano não se limitou a sobreviver até aos {age}: acabou com muito mais do que começou. Isso lê-se como uma vitória, e é — mas também significa que o plano está sobrefinanciado. Com estes números podias ter parado mais cedo, retirado mais de {spending} por ano, ou assumido menos risco para chegar ao mesmo sítio. Um excedente grande no fim também é um custo. Apenas mais silencioso.",
        lever: "O que esta partida levanta não é se vais ter o suficiente. É quanta vida estás a gastar a ter a mais.",
        primaryLabel: "Vê o que podias mudar sem risco",
        primaryRoute: "investmentProfile",
        secondaryLabel: "Ou vamos falar diretamente",
        secondaryRoute: "contact"
      },
      landed: {
        eyebrow: "O teu relatório de voo",
        title: "Aterraste aos {age} com {finalBalance} no depósito.",
        body: "Uma retirada de {swr}% sobre {nestEgg}, sustentada {years} anos. É um plano que funciona — numa sequência de retornos, que é uma das milhares que podiam ter saído. A diferença entre um plano que sobrevive a uma sequência amável e um que sobrevive a uma cruel está quase sempre nos primeiros cinco anos, e no que tenhas reservado para os atravessar.",
        lever: "Um voo bom é um resultado. O que importa é como o plano se comporta nas partidas em que falha.",
        primaryLabel: "Testa-o contra o teu perfil real",
        primaryRoute: "investmentProfile",
        secondaryLabel: "Ou faz-me uma pergunta",
        secondaryRoute: "contact"
      }
    },

    /* =============================================================
       MOTOR DE RENDIMENTO PASSIVO — rendimento contra despesas, e a
       vida que levas enquanto esperas
       ============================================================= */
    "passive-income-engine": {
      crossoverJoyful: {
        eyebrow: "O que diz o teu resultado",
        title: "Cruzamento em {years} anos — {passive} por mês contra {expenses}.",
        body: "E chegaste com um índice de satisfação de {joy} em 100, que é a metade difícil deste jogo: liberdade, e uma vida que quisesses de facto estar a viver pelo caminho. O que a ferramenta salta é tudo o que torna os ativos reais desarrumados — impostos, meses vazios, custos de transação e os anos em que o rendimento simplesmente não chega.",
        lever: "A combinação que funciona no simulador é a versão fácil. A pergunta real é como fica depois de impostos, onde tu vives.",
        primaryLabel: "Transfere isto para os teus números reais",
        primaryRoute: "financialSnapshot",
        secondaryLabel: "Ou vamos falar diretamente",
        secondaryRoute: "contact"
      },
      crossoverBalanced: {
        eyebrow: "O que diz o teu resultado",
        title: "Cruzaste em {years} anos — {passive} por mês já cobrem {expenses}.",
        body: "Património {netWorth}, índice de satisfação {joy} em 100. A aritmética funciona, e o rendimento passivo ultrapassar as despesas é a única definição de independência que não assenta numa projeção. As carteiras reais demoram mais do que esta, sobretudo por causa dos impostos e porque os ativos que distribuem rendimento raramente pagam o que a sua taxa nominal sugere.",
        lever: "O número a fixar primeiro é a tua despesa mensal real. Tudo o resto neste modelo é um múltiplo dela.",
        primaryLabel: "Põe os teus números reais por escrito",
        primaryRoute: "financialSnapshot",
        secondaryLabel: "Ou descarrega o modelo de despesas gratuito",
        secondaryRoute: "templates"
      },
      crossoverAscetic: {
        eyebrow: "O que diz o teu resultado",
        title: "Compraste a tua liberdade em {years} anos — com um índice de satisfação de {joy} em 100.",
        body: "{passive} por mês contra {expenses}, e chegaste lá cortando quase tudo o que faz uma vida parecer-se com uma vida. É a rota mais rápida da ferramenta e a que quase ninguém termina. A pergunta honesta não é se a aritmética funciona, mas se ainda estarias a viver assim no ano oito, sem forma de saber como a história acaba.",
        lever: "Um plano que abandonarias a meio é mais lento do que um plano mais longo que terminarias.",
        primaryLabel: "Vamos falar de uma versão que viverias",
        primaryRoute: "contact",
        secondaryLabel: "Ou começa pelos teus números reais",
        secondaryRoute: "financialSnapshot"
      },
      close: {
        eyebrow: "O que diz o teu resultado",
        title: "Faltam-te {gap} por mês para cobrir as tuas despesas — já fizeste {coverage}% do caminho.",
        body: "Depois de {years} anos, {passive} por mês contra {expenses}. Daqui para a frente é aritmética e não estratégia: o último trecho fecha-se somando ativos que gerem rendimento ou baixando a linha das despesas, e qual das duas sai mais barata depende inteiramente de números que esta ferramenta inventou por ti.",
        lever: "Esses {gap} por mês são tudo o que falta. Vale a pena saber quanto é esse número na tua vida real.",
        primaryLabel: "Descobre qual é a tua diferença real",
        primaryRoute: "financialSnapshot",
        secondaryLabel: "Ou descarrega o modelo de orçamento gratuito",
        secondaryRoute: "templates"
      },
      far: {
        eyebrow: "O que diz o teu resultado",
        title: "{coverage}% coberto depois de {years} anos — {passive} contra {expenses} por mês.",
        body: "É mais lento do que aquilo que os otimistas da ferramenta conseguem, e é também o seu resultado mais realista. O que vale a pena notar é qual alavanca mexeu de facto no número: o rendimento passivo compõe tarde e devagar, enquanto a linha das despesas mexe-se no dia em que a mudas. Quase todos, no início, subestimam a segunda.",
        lever: "Antes de escolher ativos, descobre quais são os teus custos reais. É o único dado de que todos os outros números dependem.",
        primaryLabel: "Começa pelo retrato financeiro",
        primaryRoute: "financialSnapshot",
        secondaryLabel: "Ou descarrega o modelo de despesas gratuito",
        secondaryRoute: "templates"
      }
    },

    /* =============================================================
       SIMULADOR PRINCIPAL — quinze decisões, e por que grupo se
       escaparam. O resultado é a categoria mais fraca, que é também
       o que decide qual dos dois formulários faz sentido.
       ============================================================= */
    "simulator-hub": {
      investing: {
        eyebrow: "O teu diagnóstico",
        title: "{archetype} — {score}% de literacia, e o teu ponto fraco em {weakest} com {weakestPct}%.",
        body: "Em {strongest} saíste-te bem, com {strongestPct}%. {weakest} é onde esta partida te custou, e é o grupo mais caro de deixar como está: essas decisões compõem, portanto um erro ali continua a cobrar-te durante todo o tempo em que se mantiver. Acabaste com um património de {netWorth} e {cashFlow} por mês de fluxo de caixa.",
        lever: "A carteira e as comissões merecem ser decididas uma vez, de propósito, em vez de ficarem decididas pela primeira coisa que compraste.",
        primaryLabel: "Define o teu perfil de investimento",
        primaryRoute: "investmentProfile",
        secondaryLabel: "Ou pergunta-me sobre uma decisão concreta",
        secondaryRoute: "contact"
      },
      debt: {
        eyebrow: "O teu diagnóstico",
        title: "{archetype} — {score}% de literacia, e o teu ponto fraco em {weakest} com {weakestPct}%.",
        body: "Em {strongest} estiveste sólido, com {strongestPct}%. {weakest} foi por onde a partida se escapou. A alavancagem é o grupo menos indulgente de todos porque o custo é contratual e o benefício é apenas uma previsão: os juros chegam faça o mercado o que fizer. Acabaste com um património de {netWorth} e {cashFlow} por mês de fluxo de caixa.",
        lever: "Toda a decisão de dívida é uma comparação, e não se consegue fazer sem ver o balanço completo de uma só vez.",
        primaryLabel: "Põe o teu balanço por escrito",
        primaryRoute: "financialSnapshot",
        secondaryLabel: "Ou vamos falar diretamente",
        secondaryRoute: "contact"
      },
      spending: {
        eyebrow: "O teu diagnóstico",
        title: "{archetype} — {score}% de literacia, e o teu ponto fraco em {weakest} com {weakestPct}%.",
        body: "Em {strongest} saíste-te forte, com {strongestPct}%. {weakest} é a lacuna — e é a que menos vezes é mostrada a alguém com honestidade, porque é a única que obriga a olhar para o que saiu de facto da conta e não para o que estava previsto sair. Acabaste com um património de {netWorth} e {cashFlow} por mês de fluxo de caixa.",
        lever: "Quinze dias a registar cada despesa dizem-te mais sobre isto do que qualquer projeção.",
        primaryLabel: "Descarrega o modelo de despesas gratuito",
        primaryRoute: "templates",
        secondaryLabel: "E depois traça o quadro completo",
        secondaryRoute: "financialSnapshot"
      },
      tax: {
        eyebrow: "O teu diagnóstico",
        title: "{archetype} — {score}% de literacia, e o teu ponto fraco em {weakest} com {weakestPct}%.",
        body: "Em {strongest} estiveste forte, com {strongestPct}%. {weakest} é onde esta partida deu dinheiro. É o único grupo em que o ganho está garantido e não apenas esperado, o que torna o não o reclamar no hábito mais caro do conjunto. Acabaste com um património de {netWorth}.",
        lever: "A margem fiscal, na maioria dos anos, usa-se ou perde-se. Isso torna-a na primeira coisa a verificar, não na última.",
        primaryLabel: "Define o teu perfil e o teu horizonte",
        primaryRoute: "investmentProfile",
        secondaryLabel: "Ou pergunta-me diretamente",
        secondaryRoute: "contact"
      },
      risk: {
        eyebrow: "O teu diagnóstico",
        title: "{archetype} — {score}% de literacia, e o teu ponto fraco em {weakest} com {weakestPct}%.",
        body: "Em {strongest} saíste-te bem, com {strongestPct}%. {weakest} é a exposição. As decisões de proteção custam um pouco todos os anos e importam exatamente uma vez, que é precisamente a forma que têm as decisões adiadas para sempre. Acabaste com um património de {netWorth}.",
        lever: "A lacuna que vale a pena fechar primeiro é aquela em que um único ano mau desfaria uma década de todo o resto.",
        primaryLabel: "Define o teu perfil de risco",
        primaryRoute: "investmentProfile",
        secondaryLabel: "Ou vamos falar diretamente",
        secondaryRoute: "contact"
      },
      allStrong: {
        eyebrow: "O teu diagnóstico",
        title: "{archetype} — {score}% de literacia, e nenhuma categoria fraca.",
        body: "A tua área mais baixa foi {weakest}, com {weakestPct}%, o que é uma partida forte por qualquer leitura. Resolver quinze cenários assim de forma tão limpa costuma significar que o conhecimento não é a limitação. O que sobra é a parte difícil: fazê-lo de forma constante com dinheiro real, impostos reais e uma vida real à volta.",
        lever: "Quando o conhecimento já lá está, o retorno vem da estrutura — e de não mudar de ideias no momento errado.",
        primaryLabel: "Define o teu perfil de investimento",
        primaryRoute: "investmentProfile",
        secondaryLabel: "Ou traz-me uma decisão concreta",
        secondaryRoute: "contact"
      }
    }
  }
};
