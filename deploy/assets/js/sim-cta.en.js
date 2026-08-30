/**
 * The English copy for the result-aware call to action. Read by
 * assets/js/sim-cta.js, which holds the machinery and none of the prose.
 *
 * One file per language, hand-authored, rather than three columns of a string
 * table. Every entry here is written to be read at a specific moment - the
 * second a simulator tells somebody something about their own money - and the
 * Spanish reading of a retirement plan that fails is not a translation of the
 * English one.
 *
 * Each outcome follows the same four beats, in this order:
 *
 *   title   the visitor's own number, and what it means
 *   body    the honest reading of it, including what the tool cannot see
 *   lever   the one thing that would move it
 *   route   the single next step that follows from all three
 *
 * `{token}` placeholders are filled from the numbers the simulator hands over.
 * A token that is not supplied is left visible rather than blanked, so a
 * mismatch between a bucket here and the code that raises it shows up on the
 * page instead of reading as a finished sentence with a hole in it.
 *
 * `primaryRoute` picks the destination, and it is next to the sentence that
 * asks for it because the two are one decision:
 *
 *   financialSnapshot   income, expenses, assets, debts - the balance sheet
 *   investmentProfile   goals, horizon, experience, tolerance for a drawdown
 *   contact             the site's own form, for outcomes where a long
 *                       questionnaire is the wrong next thing to hand someone
 *   templates           the free spreadsheets
 *
 * The tone rule that matters most: an outcome that went badly gets warmth
 * first and the ask second, and never a number repeated back as a reprimand.
 * These tools are used by people who are worried about money, and a result
 * turned into leverage is the one thing that would cost more than it earns.
 */
window.SIM_CTA_COPY = {
  ui: {
    disclaimer: "These simulators are illustrations built on simplified assumptions. This is a reading of your result, not financial advice."
  },

  buckets: {
    /* =============================================================
       FREEDOM CALENDAR — habits, and what they cost in years
       ============================================================= */
    "freedom-calendar": {
      stalled: {
        eyebrow: "What your result says",
        title: "On these numbers, trimming habits alone never gets you there.",
        body: "Even with every habit cut to zero, the model doesn’t reach financial independence inside its horizon. That almost always means the gap is structural rather than behavioural — and it is worth knowing that early, because no amount of discipline closes a gap of this shape. What moves it is income, the cost of any debt you carry, and where your savings are actually held.",
        lever: "The first thing to establish is what you have and what you owe — not what you could cut.",
        primaryLabel: "Talk it through with me",
        primaryRoute: "contact",
        secondaryLabel: "Or start with the free templates",
        secondaryRoute: "templates"
      },
      modest: {
        eyebrow: "What your result says",
        title: "You moved your freedom date forward {years} years — from {baselineAge} to {age}.",
        body: "{monthly} a month is {workDays} working days a year you no longer have to sell. That is a real result, and it came entirely from the habits this tool can see. The larger levers — what you earn, what you owe, and what your savings are invested in — are the ones it can’t.",
        lever: "Your largest single saving here is {topHabit}, at {topHabitMonthly} a month. Worth checking whether that is genuinely your biggest leak, or just the easiest slider to move.",
        primaryLabel: "Map your real numbers",
        primaryRoute: "financialSnapshot",
        secondaryLabel: "Or just ask me a question",
        secondaryRoute: "contact"
      },
      strong: {
        eyebrow: "What your result says",
        title: "{years} years earlier — age {age} instead of {baselineAge}.",
        body: "You found {monthly} a month, which compounds to {wealth} over thirty years and buys back {workDays} working days every year. The catch is in the assumption underneath it: the model expects you to hold this for three decades, and almost nobody sustains a change this size on willpower. They sustain it on structure.",
        lever: "Turning {monthly} a month into a standing instruction, before it reaches your current account, is what makes a result like this hold.",
        primaryLabel: "Build it around your real numbers",
        primaryRoute: "financialSnapshot",
        secondaryLabel: "Or download the free budget template",
        secondaryRoute: "templates"
      },
      major: {
        eyebrow: "What your result says",
        title: "You just moved your freedom date {years} years — to age {age}.",
        body: "{monthly} a month, {workDays} working days a year, {wealth} over thirty years. A result this large usually means one of two things: the habit set you started from was genuinely expensive, or you have cut to a level you would not actually live at. Which of the two it is changes everything about what to do next.",
        lever: "The question isn’t whether the arithmetic works — it does. It’s which of these cuts you would still be making in year five.",
        primaryLabel: "Pressure-test it with your real numbers",
        primaryRoute: "financialSnapshot",
        secondaryLabel: "Or talk it through with me",
        secondaryRoute: "contact"
      }
    },

    /* =============================================================
       MARKET TIME MACHINE — allocation, against a century of history
       ============================================================= */
    "market-time-machine": {
      beat: {
        eyebrow: "What your result says",
        title: "Your mix ended at {customVal} — {diff} ahead of plain 60/40.",
        body: "{customCagr}% a year against {classicCagr}%, across {years} years from {startYear} to {endYear}. On the numbers, you won. What the chart cannot tell you is whether you would have held it: the same allocation that produced this went through stretches where it lost a third of its value, and the return only ever belonged to whoever was still holding on the other side.",
        lever: "The useful question is not which allocation wins the backtest. It’s which one you would stay in through the worst three years of it.",
        primaryLabel: "Find out what you’d actually hold",
        primaryRoute: "investmentProfile",
        secondaryLabel: "Or ask me about your own allocation",
        secondaryRoute: "contact"
      },
      lagged: {
        eyebrow: "What your result says",
        title: "Your mix ended at {customVal} — {diff} behind plain 60/40.",
        body: "{customCagr}% a year against {classicCagr}%, across {years} years. This is the most common outcome in the tool, and it is not a mistake. It is what happens when an allocation is arrived at by instinct rather than decided in advance — the dull benchmark is hard to beat precisely because it never changes its mind.",
        lever: "An allocation is worth deciding once, in writing, before a bad year makes the decision for you.",
        primaryLabel: "Decide yours properly",
        primaryRoute: "investmentProfile",
        secondaryLabel: "Or talk it through with me",
        secondaryRoute: "contact"
      },
      inflationExposed: {
        eyebrow: "What your result says",
        title: "You held {cashGold}% in cash and gold, and ended at {customVal}.",
        body: "Across {years} years that was the calmest mix to live with from one year to the next, and it finished {diff} behind plain 60/40. Cash and gold protect you against the losses you can see happening. Inflation is the one that never announces itself, and over a horizon this long it is the one that compounds against you.",
        lever: "Safety over one year and safety over thirty are different problems, and they have different answers.",
        primaryLabel: "Work out which one you’re solving",
        primaryRoute: "investmentProfile",
        secondaryLabel: "Or ask me directly",
        secondaryRoute: "contact"
      }
    },

    /* =============================================================
       MONTE CARLO FIRE — whether a retirement plan survives
       ============================================================= */
    "monte-carlo-fire": {
      crashed: {
        eyebrow: "Your flight debrief",
        title: "The portfolio ran out at age {age}.",
        body: "You flew {years} years on {nestEgg}, drawing {spending} a year — about {swr}% — and the money reached zero before the flight ended. Worth saying plainly: this is the most common failure in the model, and it is a sequencing problem rather than a discipline problem. The same plan often survives with a different order of returns, a slightly lower draw in the early years, or cash set aside for the first bad stretch.",
        lever: "The number that changes this outcome most is not the return you assume. It’s what you draw in the first five years.",
        primaryLabel: "Talk it through with me",
        primaryRoute: "contact",
        secondaryLabel: "Or check your risk profile first",
        secondaryRoute: "investmentProfile"
      },
      fragile: {
        eyebrow: "Your flight debrief",
        title: "You landed — after {crashYears} years at zero altitude.",
        body: "The plan survived to {age} and finished with {finalBalance}. But it spent {crashYears} years scraping the floor, and that is the part a survival probability doesn’t capture: a plan that works on paper and frightens you in year twelve is not a plan you are still following in year thirteen. Almost every abandoned retirement plan was abandoned during a stretch exactly like that one.",
        lever: "What matters is not whether the plan can survive that stretch. It’s whether you can.",
        primaryLabel: "Find out what you’d hold through",
        primaryRoute: "investmentProfile",
        secondaryLabel: "Or talk it through with me",
        secondaryRoute: "contact"
      },
      comfortable: {
        eyebrow: "Your flight debrief",
        title: "You finished with {finalBalance} — around {multiple}× what you started with.",
        body: "The plan did not merely survive to {age}; it ended with far more than it began. That reads as a win, and it is one — but it also means the plan is over-funded. On these numbers you could have stopped earlier, drawn more than {spending} a year, or taken less risk to arrive in the same place. A large surplus at the end is a cost too. It is just a quieter one.",
        lever: "The question this run raises isn’t whether you’ll have enough. It’s how much of your life you’re spending to over-fund it.",
        primaryLabel: "See what you could safely change",
        primaryRoute: "investmentProfile",
        secondaryLabel: "Or talk it through with me",
        secondaryRoute: "contact"
      },
      landed: {
        eyebrow: "Your flight debrief",
        title: "You landed at {age} with {finalBalance} still in the tank.",
        body: "A {swr}% draw on {nestEgg}, held for {years} years. That is a plan that works — in one sequence of returns, which is one of the thousands it could have drawn. The difference between a plan that survives a kind sequence and one that survives a cruel one is usually the first five years, and what you have set aside to get through them.",
        lever: "One successful flight is a result. What matters is how the plan behaves in the runs where it fails.",
        primaryLabel: "Test it against your real profile",
        primaryRoute: "investmentProfile",
        secondaryLabel: "Or ask me a question",
        secondaryRoute: "contact"
      }
    },

    /* =============================================================
       PASSIVE INCOME ENGINE — income against expenses, and the life
       you would be living while you wait
       ============================================================= */
    "passive-income-engine": {
      crossoverJoyful: {
        eyebrow: "What your result says",
        title: "Crossover in {years} years — {passive} a month against {expenses}.",
        body: "You reached it with a joy score of {joy} out of 100, which is the harder half of this game: freedom, and a life you would actually want to be living on the way to it. What the tool skips is everything that makes real assets messy — tax, vacancy, transaction costs, and the years when the income simply doesn’t arrive.",
        lever: "The mix that works in the simulator is the easy version. The real question is what it looks like after tax, where you actually live.",
        primaryLabel: "Map it onto your real numbers",
        primaryRoute: "financialSnapshot",
        secondaryLabel: "Or talk it through with me",
        secondaryRoute: "contact"
      },
      crossoverBalanced: {
        eyebrow: "What your result says",
        title: "You crossed over in {years} years — {passive} a month now covers {expenses}.",
        body: "Net worth {netWorth}, joy score {joy} out of 100. The arithmetic works, and passive income overtaking expenses is the one definition of independence that doesn’t rest on a projection. Real portfolios get there more slowly than this one, mostly because of tax and because income-producing assets rarely pay what their headline yield suggests.",
        lever: "The number to establish first is your real monthly expenses. Everything else in this model is a multiple of it.",
        primaryLabel: "Get your real numbers down",
        primaryRoute: "financialSnapshot",
        secondaryLabel: "Or download the free expense template",
        secondaryRoute: "templates"
      },
      crossoverAscetic: {
        eyebrow: "What your result says",
        title: "You bought freedom in {years} years — with a joy score of {joy} out of 100.",
        body: "{passive} a month against {expenses}, reached by cutting almost everything that makes a life feel like one. It is the fastest route in the tool and the one hardly anyone completes. The honest question isn’t whether the arithmetic works — it’s whether you would still be living this way in year eight, with no way to know how the story ends.",
        lever: "A plan you would abandon halfway is slower than a longer plan you would finish.",
        primaryLabel: "Talk through a version you’d actually live",
        primaryRoute: "contact",
        secondaryLabel: "Or start with your real numbers",
        secondaryRoute: "financialSnapshot"
      },
      close: {
        eyebrow: "What your result says",
        title: "You’re {gap} a month from covering your costs — {coverage}% of the way there.",
        body: "After {years} years, {passive} a month against {expenses}. From here it is arithmetic rather than strategy: the last stretch closes either by adding income-producing assets or by moving the expense line down, and which of the two is cheaper depends entirely on numbers this tool invented on your behalf.",
        lever: "{gap} a month is the whole of what’s left. It’s worth knowing what that figure is in your real life.",
        primaryLabel: "Find out your real gap",
        primaryRoute: "financialSnapshot",
        secondaryLabel: "Or download the free budget template",
        secondaryRoute: "templates"
      },
      far: {
        eyebrow: "What your result says",
        title: "{coverage}% covered after {years} years — {passive} against {expenses} a month.",
        body: "That is slower than the tool’s optimists manage, and it is also the most realistic outcome in it. The thing worth noticing is which lever actually moved the number: passive income compounds late and slowly, while the expense line moves the day you change it. Nearly everybody starting out underestimates the second.",
        lever: "Before choosing assets, find out what your costs actually are. It’s the one input every other number here depends on.",
        primaryLabel: "Start with the snapshot",
        primaryRoute: "financialSnapshot",
        secondaryLabel: "Or download the free expense template",
        secondaryRoute: "templates"
      }
    },

    /* =============================================================
       SIMULATOR HUB — fifteen decisions, and which group they leaked
       from. The bucket is the weakest of the five categories, which is
       also what decides which of the two forms is the right one.
       ============================================================= */
    "simulator-hub": {
      investing: {
        eyebrow: "Your diagnosis",
        title: "{archetype} — {score}% literacy, weakest in {weakest} at {weakestPct}%.",
        body: "{strongest} came out well, at {strongestPct}%. {weakest} is where this run cost you, and it is the most expensive group to leave alone: those decisions compound, so an error in them keeps charging you for as long as it stays in place. You finished with a net worth of {netWorth} and {cashFlow} a month of cash flow.",
        lever: "Allocation and fees are worth deciding once, deliberately, instead of being decided by whatever you happened to buy first.",
        primaryLabel: "Set your investment profile",
        primaryRoute: "investmentProfile",
        secondaryLabel: "Or ask me about a specific decision",
        secondaryRoute: "contact"
      },
      debt: {
        eyebrow: "Your diagnosis",
        title: "{archetype} — {score}% literacy, weakest in {weakest} at {weakestPct}%.",
        body: "{strongest} was solid, at {strongestPct}%. {weakest} is where the run leaked. Leverage is the least forgiving group here because the cost is contractual and the benefit is only ever a forecast — the interest arrives whatever the market does. You finished with a net worth of {netWorth} and {cashFlow} a month of cash flow.",
        lever: "Every debt decision is a comparison, and you cannot make it without seeing the whole balance sheet at once.",
        primaryLabel: "Lay out your balance sheet",
        primaryRoute: "financialSnapshot",
        secondaryLabel: "Or talk it through with me",
        secondaryRoute: "contact"
      },
      spending: {
        eyebrow: "Your diagnosis",
        title: "{archetype} — {score}% literacy, weakest in {weakest} at {weakestPct}%.",
        body: "{strongest} came out strong, at {strongestPct}%. {weakest} is the gap — and it is the one people are least often shown honestly, because it is the only one that requires looking at what actually left the account rather than what was meant to. You finished with a net worth of {netWorth} and {cashFlow} a month of cash flow.",
        lever: "Fifteen days of recording every expense will tell you more about this than any projection can.",
        primaryLabel: "Get the free expense template",
        primaryRoute: "templates",
        secondaryLabel: "Then map the whole picture",
        secondaryRoute: "financialSnapshot"
      },
      tax: {
        eyebrow: "Your diagnosis",
        title: "{archetype} — {score}% literacy, weakest in {weakest} at {weakestPct}%.",
        body: "{strongest} was strong, at {strongestPct}%. {weakest} is where this run gave money away. It is the only group here where the gain is guaranteed rather than expected, which makes leaving it unclaimed the most expensive habit in the set. You finished with a net worth of {netWorth}.",
        lever: "Tax-advantaged capacity is use-it-or-lose-it in most years, which makes it the first thing to check rather than the last.",
        primaryLabel: "Set your profile and horizon",
        primaryRoute: "investmentProfile",
        secondaryLabel: "Or ask me directly",
        secondaryRoute: "contact"
      },
      risk: {
        eyebrow: "Your diagnosis",
        title: "{archetype} — {score}% literacy, weakest in {weakest} at {weakestPct}%.",
        body: "{strongest} came out well, at {strongestPct}%. {weakest} is the exposure. Protection decisions cost a little every year and matter exactly once, which is precisely the shape of decision that gets deferred indefinitely. You finished with a net worth of {netWorth}.",
        lever: "The gap worth closing first is the one where a single bad year would undo a decade of everything else.",
        primaryLabel: "Set your risk profile",
        primaryRoute: "investmentProfile",
        secondaryLabel: "Or talk it through with me",
        secondaryRoute: "contact"
      },
      allStrong: {
        eyebrow: "Your diagnosis",
        title: "{archetype} — {score}% literacy, and no weak category in the set.",
        body: "Your lowest area was {weakest}, at {weakestPct}%, which is a strong run on any reading. Fifteen scenarios answered this cleanly usually means knowledge is not the constraint. What is left is the harder part: doing it consistently with real money, real tax, and a real life attached to it.",
        lever: "When the knowledge is already there, the returns come from structure — and from not changing your mind at the wrong moment.",
        primaryLabel: "Set your investment profile",
        primaryRoute: "investmentProfile",
        secondaryLabel: "Or bring me a specific decision",
        secondaryRoute: "contact"
      }
    }
  }
};
