---
title: "Sequence-of-Returns Risk: Why the Order of Returns Decides Your
 Retirement"
date: 2026-09-03
category: Investing
summary: The same average return can leave one retiree comfortable and another
 broke. What decides it is the order the returns arrive in — and that is the
 one variable no average can show you.
translation_key: sequence-of-returns-risk
link_phrases: sequence of returns, sequence-of-returns risk, sequence risk, 4% rule, safe withdrawal rate, Monte Carlo simulation
author: Sandy Bradbury
---
Almost every retirement projection you will ever see is built on one number: an average annual return. You put in 7%, the spreadsheet grows your money by 7% every year, and it tells you your portfolio lasts forever.

The market has never once returned its average. It returns +22%, then −9%, then +4%, then −31%. The average of those four numbers is real, but no year looked like it.

While you are still saving, that hardly matters. Once you start withdrawing, it decides everything.

## The average that lies

Take a portfolio of €500,000. You withdraw €25,000 at the start of each year — 5% of the starting balance. Over the next three years the market returns −30%, −10% and +50%, in some order.

Two people retire with identical portfolios and live through the same three returns. The only difference is the order.

| | Bad years first | Good years first |
|---|---|---|
| Start | €500,000 | €500,000 |
| Year 1 return | −30% | +50% |
| End of year 1 | €332,500 | €712,500 |
| Year 2 return | −10% | −10% |
| End of year 2 | €276,750 | €618,750 |
| Year 3 return | +50% | −30% |
| **End of year 3** | **€377,625** | **€415,625** |

After three years, €38,000 of difference — nearly 8% of the original capital — created by nothing but sequence.

Now remove the withdrawals. Leave the money alone and both portfolios end at exactly €472,500, because multiplication does not care about order: 0.70 × 0.90 × 1.50 gives the same result read backwards.

> 💡 **The whole idea in one line:**
> The order of returns is irrelevant to a portfolio nobody touches, and decisive for one you are drawing from. Selling units in a fallen market converts a temporary loss into a permanent one, because those units are not there to recover.

That is sequence-of-returns risk. It is why a bad first decade of retirement is not something you make back later, and why two people who retire two years apart with the same plan can end up in different worlds.

## Where the 4% rule came from, and what it actually claimed

In 1994 the financial planner William Bengen went looking for the withdrawal rate that would have survived the worst moment in the historical record. He tested rolling 30-year retirements against actual US market history and found that 4% of the starting portfolio, increased each year with inflation, had never run out within 30 years. The Trinity study broadened the work a few years later and the number stuck.

Read the claim precisely, because it is narrower than the way it gets repeated:

- **US data.** A century of returns from the most successful stock market of that century.
- **30 years.** Not 45. Someone retiring at 45 is asking a different question.
- **A fixed, inflation-adjusted withdrawal.** The historical retiree in the model never once reacted to a crash.
- **Before costs and taxes.** Fees and tax come out of the same portfolio and are not in the number.
- **"Success" means one euro left on the last day.** A plan that ended with €12 counts as a win.

The 4% rule is a useful piece of history. It is not a law, and it was never a promise.

## What a Monte Carlo simulation adds

If order matters, then a single projection tells you about one ordering out of an enormous number of possible ones. A [Monte Carlo simulation](/en/simulators/monte-carlo-fire.html) generates thousands of them.

Each run draws a fresh sequence of yearly returns from a distribution you specify — an expected return, a volatility — and plays your plan through it: your withdrawals, your allocation, your horizon. One run is a story. Ten thousand runs are a distribution, and the answer stops being a number and becomes a shape.

What comes out is a **success rate**: the share of simulated futures in which the money outlasted you. It also shows you the failures, which are the more instructive half. You get to see *when* plans died and what the first five years looked like when they did.

## Reading a success probability honestly

A 90% success rate is not "you will be fine". It means one in ten of the futures the model generated ran out of money. Some things worth holding on to:

- **It is a model of a model.** Random draws from a smooth distribution are tidier than real markets, which have fat tails and long moods. Independent draws also lose the tendency of bad years to arrive in clusters.
- **The inputs dominate the output.** Change the expected return by one percentage point and the success rate moves more than any clever refinement.
- **Nobody behaves like the model retiree.** Real people cut spending in a crash. That single behaviour, absent from the simple version, is worth more than most portfolio changes.
- **Chasing 100% has a cost.** Certainty is bought with years of extra work and a smaller life. Somewhere around the high eighties, more precision stops being the useful question.

## The four levers that actually move it

When a plan looks fragile, only a handful of things change the picture, and they are not equally hard:

1. **Spending flexibility.** A rule agreed with yourself in advance — hold withdrawals flat after a down year, trim by 10% after a bad one — lifts survival more than almost anything else, because it stops the forced selling that does the damage.
2. **The first few years of cash.** One to three years of expenses held outside the market means the first bad year does not have to be paid for by selling into it.
3. **Allocation.** Enough growth to outrun inflation over 30 years, enough stability to survive the first five. Both failure modes are real; only one of them is loud.
4. **Any income at all.** Part-time work, a pension arriving later, one property. Small, boring income streams shorten the window the portfolio has to cover alone, and the effect is much larger than it feels.

## What none of this can tell you

A simulation cannot tell you what the market will do, what your health will do, or what you will want at 70. It is not a forecast and it is certainly not personal advice. What it can do is far more modest and far more useful: it shows you which assumptions your plan is leaning on, and how much has to go wrong before it breaks.

Run your own numbers through the [Monte Carlo FIRE simulator](/en/simulators/monte-carlo-fire.html), then change one input at a time and watch which one the answer actually cares about. That is the part a single average return can never show you.
