---
title: "How Collective Investment Schemes Work: Inside the Machinery of Mutual Funds"
date: 2026-09-14
category: Investing
summary: Ever wondered what happens behind the scenes when you buy a fund?
  Discover how advisers, custodians, depositaries, and daily NAV calculations
  keep your money secure under SEC and FCA rules.
translation_key: how-collective-investment-schemes-work-inside-the-machinery-of-mutual-funds
author: Sandy Bradbury
---
When I first bought my very first index fund share, I remember hitting the "buy" button and then pausing. I had sent my hard-earned cash into a digital ledger, but I didn't actually know where the money went or who was holding it. Was my money sitting on the fund company's bank balance? What would happen if the investment firm went bankrupt?

It wasn't until I dug into the institutional mechanics of pooled funds—mutual funds and ETFs in the United States, OEICs and unit trusts in the United Kingdom—that I realized how brilliant the system really is. In the US, the framework is the Investment Company Act of 1940, policed by the **SEC**. In the UK, it is the FCA's Collective Investment Schemes sourcebook, known as **COLL**. Both were built for the same reason: to protect everyday investors from fraud, mismanagement, and conflicts of interest.

Whether you invest $50 a month, £50 a month, or manage a six-figure portfolio, understanding the operational engine under the hood of your funds gives you total confidence in your wealth-building journey. Let's break down how this financial machinery works, step by step.

> 💡 **The Core Foundation:**
> Funds don't hold your cash directly. Both the US and UK frameworks legally separate the firm that manages your assets from the institution that holds them, protecting your money even if the manager goes bankrupt.

---

## The Operational Triangle: Segregation of Functions

To protect investors, regulators on both sides of the Atlantic enforce a strict division of labor. A fund operates through three distinct, independent entities that monitor each other constantly:

                 ┌─────────────────────────────────────────┐
                 │                INVESTOR                 │
                 └────────────────────┬────────────────────┘
                                      │ ($ / £)
                                      ▼
                 ┌─────────────────────────────────────────┐
                 │              THE FUND ITSELF            │
                 └────────────┬───────────────┬────────────┘
                              │               │
       Services Rendered      │               │ Custody & Oversight
                              ▼               ▼
                 ┌─────────────────┐     ┌─────────────────┐
                 │ Adviser / ACD   │◄───►│ Custodian or    │
                 │                 │     │ Depositary      │
                 └─────────────────┘     └─────────────────┘
                             Mutual Oversight

### 1. The Investor (Shareholder or Unitholder)
You pool your money alongside thousands of other individuals to purchase shares (a US mutual fund, a UK OEIC) or units (a UK unit trust). You own a proportional claim on the underlying assets.

### 2. The Manager
In the US this is the **investment adviser**, registered with the SEC under the Advisers Act and hired by the fund's board of directors—a board on which independent directors must hold at least a majority of seats for most fund families. In the UK it is the **Authorised Corporate Director (ACD)** of an OEIC, or the manager of a unit trust, authorised by the FCA.

Either way, this entity hires the portfolio managers, quantitative analysts, and traders. Its sole focus is strategy: researching markets, making buying and selling decisions, and executing trades. Crucially, the manager **never** takes physical custody of your money.

### 3. The Custodian or Depositary
In the US, Section 17(f) of the 1940 Act requires fund assets to sit with a qualified custodian—typically a bank such as State Street, BNY, or Northern Trust—in accounts segregated from the adviser's own balance sheet. In the UK, the equivalent role is the **depositary**, and the FCA gives it a harder edge: the depositary is legally responsible for the safekeeping of fund property *and* for oversight of the ACD, with a duty to report breaches to the regulator.

This is why a fund manager going bust is an administrative inconvenience rather than a loss of your capital. The assets were never theirs to lose.

---

## Inside the Management Company: Front, Middle, and Back Office

Inside a fund manager, operations are segregated into three distinct departments to avoid conflicts of interest and prevent operational errors:

| Department | Primary Responsibilities | Daily Operational Role |
| :--- | :--- | :--- |
| **Front Office** | Portfolio Management & Analysis | Makes buy/sell decisions and interacts with markets |
| **Middle Office** | Compliance & Risk Control | Ensures trades match the fund's risk rules and legal limits |
| **Back Office** | Administration & Valuation | Settles trades, keeps books, and strikes the daily price |

In the US, the middle office answers to a Chief Compliance Officer whose appointment is required by SEC Rule 38a-1 and who reports directly to the board. In the UK, the equivalent accountability runs through the SMCR senior manager regime, which attaches named individual responsibility to each of these functions.

If you want a deeper, story-driven look at how operational bottlenecks and systems optimization work in practice, I highly recommend reading *The Goal* and *It's Not Luck* by Eliyahu Goldratt. Although written around industrial manufacturing, their lessons on workflow management apply directly to financial operations.

---

## Net Asset Value (NAV): How Funds Are Priced Every Day

Unlike individual stocks that trade continuously every second, open-ended funds calculate their value once per day. This price is called the **Net Asset Value (NAV)**.

The NAV is calculated using a straightforward formula:

$$\text{NAV} = \frac{\text{Total Fund Assets} - \text{Total Fund Liabilities}}{\text{Total Shares Outstanding}}$$

The timing is where the two markets differ in detail but agree in principle. US funds operate under **forward pricing** (SEC Rule 22c-1): orders received before the fund's cutoff—almost always 4:00 p.m. Eastern, when the NYSE closes—are filled at that day's NAV, and orders received a minute later are filled at tomorrow's. UK funds publish a **valuation point** in the prospectus, typically noon or 3:00 p.m. London time, and work the same way. In neither market can you know the price at which your order will execute when you place it.

To keep pricing fair for investors buying or selling on any given day, accounting rules require **daily accrual of expenses**. Annual costs—management fees, custody, audit, and administration—are divided into tiny daily bites and deducted automatically before the NAV is struck. You never receive an invoice; the fees are already inside the daily price. In the US this total is disclosed as the **expense ratio** in the prospectus fee table; in the UK the same idea is published as the **ongoing charges figure (OCF)** in the fund's Key Investor Information.

### The Mandatory Liquidity Buffer
To ensure that investors can redeem for cash without forcing the fund to panic-sell, both regimes police liquidity directly. SEC Rule 22e-4 requires US funds to run a formal liquidity risk management program, classify every holding into liquidity buckets, and cap illiquid investments at **15% of net assets**. The FCA imposes comparable liquidity rules in COLL, and, after the suspension of several UK property funds, added specific requirements for funds holding inherently illiquid assets. Most funds in both markets also keep a small pure cash cushion for day-to-day redemption flow.

---

## Capping Costs: Fee Limits and the High-Water Mark

Neither regulator sets a single universal price cap. Both instead make somebody legally accountable for whether the price is defensible:

* **Management Fees:** Charged as a percentage of assets under management. In the US, Section 15(c) of the 1940 Act requires the fund board to review and approve the advisory contract annually, and Section 36(b) gives shareholders the right to sue over a fee that is disproportionate to the service delivered. In the UK, COLL 6.6.20 requires the ACD to conduct an annual **Assessment of Value** on every fund and publish the conclusion—including, where the answer is no, an admission that the fund does not offer value for money.
* **Performance Fees:** Charged only when the fund beats a stated benchmark. These are rare in US mutual funds, where the Advisers Act effectively restricts registered funds to symmetrical "fulcrum" fees that fall as well as rise. They are more common in UK authorised funds and standard in private structures.

Where performance fees exist, they must follow the **High-Water Mark** principle. A manager can only collect one when the NAV exceeds its highest historical peak. If the fund loses value, the manager must recover all past losses before earning another performance bonus—otherwise investors would pay twice for the same gains.

---

## What Actually Protects You If Something Fails

It is worth being precise here, because this is the question everybody really asks:

* **If the manager fails:** your assets sit with the custodian or depositary and are unaffected. The fund is transferred to a new manager or wound up and the proceeds returned.
* **If your broker or platform fails:** in the US, **SIPC** covers up to $500,000 per customer, including a $250,000 cash limit. In the UK, the **FSCS** covers up to **£85,000** per person per failed firm.
* **What is never covered:** market losses. No regulator, in either country, insures you against a fund falling in value. The protections above are against failure of the institution, not failure of the investment.

---

---

### Ready to Take the Next Step?

Understanding how financial institutions protect your money is a major milestone in taking full ownership of your wealth. Take our habit assessment to evaluate your current portfolio structure, review your fund fees, and build a streamlined investment strategy for long-term growth.

[Take the Financial Habits Assessment →](https://compoundingjourney.com/en/#assessment)
