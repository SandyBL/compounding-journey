---
title: "How Hedge Funds Work: Operating Structures, Strategies, and Risk Metrics"
date: 2026-09-22
category: Investing
summary: Uncover how hedge funds create market-independent alpha. Discover
  leveraged strategies, High-Water Mark fees, Fund of Hedge Funds structures,
  and advanced metrics like VaR.
translation_key: how-hedge-funds-work-operating-structures-strategies-risk-metrics
author: Sandy Bradbury
---
When I first encountered hedge funds, I used to think they were mysterious financial vehicles reserved exclusively for Wall Street insiders. I heard stories of high leverage, complex derivatives, and managers earning massive performance fees during market crashes. 

As I studied alternative investments, I realized that while hedge funds do operate under far more flexible rules than traditional mutual funds, their core objective is straightforward: generating absolute returns—what investors call **Alpha**—regardless of whether the broader stock or bond markets are going up or down.

In the US and UK, these vehicles escape the constraints of a retail fund not by exemption from all rules, but by restricting who is allowed in. A US hedge fund is a **private fund** relying on **Section 3(c)(1) or 3(c)(7)** of the Investment Company Act and selling under **Regulation D**, which is why it never has to comply with the 1940 Act's diversification, leverage or daily-liquidity rules. A UK hedge fund is an **Alternative Investment Fund** with an FCA-authorised manager under the UK AIFM regime. In both cases the freedom to use unlimited leverage, short selling and complex event-driven strategies is purchased with a closed door.

Understanding how these alternative structures operate behind the scenes—and how they measure risk—gives you a much clearer perspective on how institutional money navigates turbulent markets. Let's break down the operational blueprint of hedge funds.

> 💡 **The Core Foundation:**
> Traditional index funds sell you Beta—the natural rising and falling of the market. Hedge funds sell you Alpha—pure managerial skill designed to generate positive returns even when the stock market is crashing.

---

## Operating Framework: Hedge Funds vs. Funds of Hedge Funds

Unlike standard retail mutual funds, hedge funds are built for institutional clients and wealthy individuals, and each regulator defines that gate differently.

**In the US**, a 3(c)(1) fund admits up to 100 beneficial owners who are **accredited investors**—broadly $1 million of net worth excluding your primary residence, or $200,000 of annual income ($300,000 jointly), with the SEC's 2020 amendments adding certain professional credentials. A 3(c)(7) fund takes an unlimited number of **qualified purchasers**, meaning roughly $5 million in investments. Funds relying on Rule 506(b) may not advertise at all; those using 506(c) may advertise but must actively verify every investor's accredited status. Managers above the size thresholds register with the SEC as investment advisers and file **Form PF**.

**In the UK**, access runs through client categorisation: **professional clients** and **eligible counterparties**, or retail investors who qualify as **elective professional**, **certified high net worth** or **certified sophisticated** investors. A retail-facing hedge strategy must be either a **Qualified Investor Scheme (QIS)**, restricted to those categories, or a **Non-UCITS Retail Scheme (NURS)**, which accepts ordinary retail money but in exchange accepts real limits—including a 20% cap on unregulated collective schemes and a prohibition on unlimited borrowing. Anything else is a **non-mainstream pooled investment** and cannot be promoted to the general public.

Because these funds take on complex risks, the operating boundaries differ sharply between a direct fund and a fund of funds:

| Feature / Trait | Direct Hedge Funds | Fund of Hedge Funds (FoHF) |
| :--- | :--- | :--- |
| **Minimum Investment** | High entry barriers (commonly $100,000–$1,000,000, plus accredited or professional status) | Lower entry thresholds; a NURS fund of alternatives can accept ordinary retail money |
| **Diversification Level** | Concentrated in specific manager strategies | Diversified across 10+ underlying hedge fund managers |
| **Concentration Limits** | Unrestricted position sizing; no regulatory diversification test | Single-fund cap (often a maximum of 10–20% per underlying manager) |
| **Liquidity Terms** | Redemptions restricted (quarterly or semi-annually with lockups) | Matches underlying fund liquidity (quarterly/semi-annually) |
| **Leverage Limits** | No hard regulatory ceiling; limited only by prime broker margin and the fund's own documents | Aggregate leverage constrained by the wrapper's own rules |

Before money moves, both systems require a paper trail. A US investor signs a **subscription agreement** and an accredited-investor questionnaire and receives a private placement memorandum; a UK investor going in as elective professional must sign a written acknowledgement that they are **giving up retail protections**, which is not a formality—it removes access to the **Financial Ombudsman Service** and, in most circumstances, to **FSCS** compensation.

That is the point worth internalising. The thing you are buying is not only a strategy; it is a different legal status. The lock-up, the absence of diversification limits and the risk of losing capital are all disclosed, and the safety net that catches a retail investor is not there behind them.

---

## Decomposing Returns: Understanding Alpha vs. Beta

To evaluate whether a hedge fund manager deserves their fees, institutional investors split total returns into two distinct components: **Beta** and **Alpha**.

$$\text{Total Portfolio Return} = \text{Alpha } (\alpha) + \beta \cdot \text{Market Return } (R_m)$$

* **Beta ($\beta$):** The portion of performance driven by general market movements. If the S&P 500 or the FTSE All-Share rises 10% and your fund rises 10% purely because it holds large-cap stocks, you earned market Beta and paid alternative fees for it.
* **Alpha ($\alpha$):** The pure value added by the manager's skill. This comes from superior stock picking, precise market timing, or exploiting short-term market inefficiencies.

[ Market Exposure ] ➔ Beta (Passive Benchmark Return)
[ Manager Skill ]   ➔ Alpha (Absolute Performance Independent of Market)

---

## The 3 Main Hedge Fund Strategy Families

Hedge fund managers deploy capital across three primary strategy classifications:

### 1. Market Neutral (Equity Long/Short)
Managers hold paired long and short positions simultaneously to keep the portfolio's net market exposure ($\text{Delta}$) close to zero. They profit from the relative price divergence between two assets regardless of whether the overall market goes up or down.

### 2. Event-Driven
Positions are built around specific corporate catalysts—such as pending mergers, acquisitions, corporate debt restructuring, spinoffs, or bankruptcy proceedings. Managers profit when the market pricing inefficiency closes upon event completion.

### 3. Global Macro & Directional
Managers take highly leveraged, directional bets across global currencies, interest rate futures, commodities, and stock indices based on global macroeconomic imbalances and central bank policy shifts.

---

## Performance Fees and the High-Water Mark (HWM)

Hedge fund fee structures traditionally follow a performance-heavy model—the "2 and 20": a 2% management fee and a 20% performance fee on gains, though competition has compressed both. To protect investors from paying performance fees on recovered losses, managers abide by the **High-Water Mark (HWM)** principle:

```
NAV
 ▲
 │ HWM 2 ························───
 │                              ╱
 │ HWM 1 ·───╲·················╱····
 │       ╱    ╲               ╱
 │      ╱      ╲             ╱
 │     ╱        ╲           ╱
 │    ╱          ╲         ╱
 │   ╱            ╲       ╱
 │  ╱              ──────╱
 │ ╱
 │╱
 └───────────┴─────────────────┴─────► Time
      fee     │     no fee      │ fee
    charged   │ (below HWM 1)   │ charged
```

A manager can only calculate and collect a performance fee on capital gains that push the fund's Net Asset Value strictly above its highest historical peak. If a fund loses 15% of its value, the manager must earn back that entire 15% loss before taking another dollar in performance fees.

The tax treatment of that fee is one of the sharper differences between the two jurisdictions. In the US, performance allocations from a fund holding assets for more than three years can reach the manager as **carried interest** taxed at long-term capital gains rates, a provision that has survived repeated attempts at repeal. In the UK, the **disguised investment management fees** rules and the 2015 carried interest changes mean most performance fees reach the manager as income, with genuine carry taxed at a dedicated 28% rate subject to an average holding period test. For you as the investor it changes nothing about the fee you pay—but it explains a great deal about where funds choose to be managed.

---

## Advanced Risk Metrics for Alternative Investments

Because hedge funds use options, short positions, and leverage, their monthly returns do not follow a normal bell-curve distribution. They suffer from "fat tails"—infrequent but extreme market shocks. As a result, managers track three advanced risk metrics:

* **Value at Risk (VaR):** Estimates the maximum expected loss, in dollars or sterling, over a given time horizon (e.g., 30 days) at a specific confidence level (e.g., 95% or 99%). Its weakness is the one that matters: it tells you the threshold you'd breach, not how far past it you'd go.
* **Maximum Drawdown (MDD):** Measures the largest percentage drop in portfolio value from its historical peak to its lowest trough during a specific period.
* **Time Under Water (TUW):** Measures the duration (in months or days) required for the fund to recover from a drawdown and break through its previous High-Water Mark.

One more number belongs on that list for anyone comparing an alternative fund against a simple index fund: the **hurdle rate**. A performance fee charged from zero pays the manager for returns you could have collected from Treasury bills or gilts. A fee charged only above the Fed Funds rate or SONIA pays for skill. The paperwork will tell you which one you have signed up for.

---

---

### Ready to Take the Next Step?

Understanding how institutional alternative investments manage risk and hunt for returns is a major milestone in taking control of your financial education. Take our habit assessment to evaluate your current portfolio structure, review your risk exposure, and build a tailored plan for long-term compound growth.

[Take the Financial Habits Assessment →](https://compoundingjourney.com/en/#assessment)
