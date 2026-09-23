---
title: "Why Mutual Funds Operate Blind: The Mechanics of Subscriptions,
  Redemptions, and NAV"
date: 2026-09-16
category: Investing
summary: Ever wondered why you can't see the exact price when buying a mutual
  fund? Discover how the forward-pricing mechanism and daily NAV math keep
  trading fair for all investors.
translation_key: why-mutual-funds-operate-blind-mechanics-of-subscriptions-redemptions-and-nav
author: Sandy Bradbury
---
When I first placed an order to buy shares in a mutual fund, I searched everywhere on my screen for an execution button with a live ticker price. I was used to stocks, where you see the exact price move every second and execute your order instantly. But with mutual funds, I had to place my order completely blindly, trusting a price that wouldn't even be calculated until after the market closed.

At first, trading without seeing the exact price felt unnerving. But as I learned how collective investment vehicles work behind the scenes, I realized that this "forward pricing" rule isn't a limitation at all. It is actually a vital protection mechanism designed to keep day traders from exploiting long-term investors.

Whether you invest $50 or $5,000 every month, understanding the operational rhythm of fund pricing, daily expense accruals, and cash settlement timelines gives you complete clarity over how your money moves. Let's break down why funds operate blind and how the daily machinery functions step by step.

> 💡 **The Core Foundation:**
> You don't trade mutual fund shares on an open exchange with another buyer or seller. The fund management company creates new shares when you invest and destroys shares when you withdraw, executing every transaction at the exact end-of-day Net Asset Value.

---

## The Principle of Unknown Price: Why You Trade Blind

When you trade an individual stock, you buy it from another investor on an exchange at whatever market price exists at that second. Mutual funds don't work that way. There is no secondary market exchange floor for traditional index or mutual fund shares.

Instead, the fund's adviser and its transfer agent mint new shares when money enters (a **subscription**, or in UK language a *creation*) and cancel existing shares when money leaves (a **redemption**). In the US that machinery sits under the Investment Company Act of 1940; in the UK it sits under the FCA's Collective Investment Schemes sourcebook (COLL), with the Authorised Corporate Director running the book of orders.

Because portfolio managers need to buy or sell the underlying stocks and bonds at official closing prices, regulators on both sides of the Atlantic enforce **forward pricing**: you deal at the next price to be calculated, never the last one published.

**In the US** this is **SEC Rule 22c-1**, and it has a hard clock attached. Orders received by your fund or intermediary before the fund's cutoff—almost always **4:00 p.m. Eastern**, when the NYSE closes—get that day's NAV. Orders one minute later get tomorrow's. This is not a formality: the 2003 late-trading scandals, in which favoured clients were allowed to buy at stale prices after the close, produced enforcement actions and settlements precisely because the rule was being circumvented.

**In the UK** the equivalent is the fund's **valuation point**, disclosed in the prospectus and typically noon or 3:00 p.m. UK time. Orders placed before it are priced at that day's valuation; orders after it roll to the next one. British funds may also be **dual-priced**, quoting a separate offer and bid price with a spread between them, which is something the single-priced American market does not have an equivalent for.

[ Order Submitted Blind ] ➔ [ 4:00 p.m. ET Cutoff / UK Valuation Point ] ➔ [ NAV Struck ] ➔ [ Settlement ]

This prevents high-frequency arbitragers from seeing late-breaking market news and trading fund shares at outdated prices at the expense of existing shareholders.

---

## How the Net Asset Value ($NAV$) Is Calculated Every Day

The **Net Asset Value ($NAV$)** represents the exact unit price of a single fund share. It serves as the accounting anchor for every dollar—or pound—entering or leaving the fund.

$$\text{NAV} = \frac{\text{Fund Total Net Assets}}{\text{Total Shares Outstanding}}$$

To calculate the numerator (Total Net Assets), the fund manager adds up the market value of all stocks, bonds, and cash held in the portfolio at market close, then subtracts all accumulated liabilities and fee obligations.

### Fair Pricing: Daily Accrual of Fund Expenses

Throughout the year, a fund incurs routine operational costs: management fees, custody fees, audit costs, legal fees, transfer agency costs and regulatory levies. Summed and expressed as a percentage, these are what your fact sheet calls the **expense ratio** in the US and the **ongoing charges figure (OCF)** in the UK—the same arithmetic under two names.

If the fund paid these bills all at once when an invoice arrived, it would create an unfair distortion. Investors who redeemed their shares the day before the invoice hit would avoid the cost, while investors holding shares on payment day would take an artificial loss.

To preserve absolute fairness among all shareholders, accounting standards require **daily expense accrual**. A tiny, proportional slice of the fund's total annual operational expenses is calculated and subtracted from the asset pool every single day before the daily $NAV$ is published.

> 💡 **A Simple Analogy:**
> Daily expense accrual is like splitting an apartment utility bill day by day among roommates. If you move out halfway through the month, you pay your exact daily share up to the afternoon you leave, rather than dodging the bill or paying for weeks you weren't there.

---

## The 3-Step Lifecycle of a Fund Transaction

When you submit an investment or withdrawal request, your trade moves through a structured timeline to guarantee accounting precision:

| Stage | Timeline | Internal Technical Process | Impact on Your Account |
| :--- | :--- | :--- | :--- |
| **Order Submission** | **Trade date (T)** | Your order is logged before the cutoff or valuation point. | You place the trade blindly, referencing yesterday's published price. |
| **$NAV$ Calculation** | **Evening of T** | Portfolio assets are valued at official closing prices to strike the $NAV$. | Your account is allocated its exact, final number of shares. |
| **Cash Settlement** | **T+1 (US) / T+2 to T+4 (UK)** | Cash moves between the fund and your account. | Money leaves or arrives in your bank account. |

A practical note on that last row: the US securities market moved to **T+1 settlement in May 2024**, and most US mutual fund redemptions now pay out within one business day, with the 1940 Act requiring payment within seven days at the outside. UK funds commonly quote **T+3 or T+4** for redemption proceeds, so a British investor waiting on money to complete a house purchase should plan for a longer gap than an American one.

*Note: Subscriptions and redemptions do not alter the $NAV$ itself. When you deposit $1,000, the fund's total net asset pool grows by $1,000 and the number of shares grows by the exact equivalent amount, keeping the price per share completely unchanged. The same is true of £1,000.*

---

## Protecting Liquidity: The Mandatory 1% Cash Cushion

What happens when thousands of investors request cash redemptions on the same day? Neither the US nor the UK sets a single fixed cash percentage. Both instead require the manager to *prove* it can meet redemptions, and both give it tools that shift the cost of a large withdrawal onto the person making it.

**The US approach: a liquidity risk management program.** Under **SEC Rule 22e-4**, every open-end fund must classify each holding by how quickly it could be sold without moving the price, set and monitor a **highly liquid investment minimum**, and keep no more than **15% of net assets in illiquid investments**. Breaching that 15% ceiling triggers board notification and a confidential filing with the SEC. Funds also hold cash and overnight repos backed by Treasuries, but as a management choice rather than a quota.

**The UK approach: pricing the exit.** FCA rules let a fund charge the cost of dealing to the investors who caused it, through a **dilution levy** or by **swing pricing**—moving the whole day's NAV in the direction of net flows so that continuing holders aren't diluted by the trading costs of those leaving. In extreme cases the ACD may **suspend dealing**, which is exactly what happened across UK open-ended property funds in March 2020 and again in 2023, when the assets simply could not be valued or sold at the speed the daily dealing promise implied.

That last episode is the practical lesson for both markets: a fund can only be as liquid as the things it owns. Daily dealing on an illiquid portfolio is a promise made by the wrapper, not by the assets.

---

---

### Ready to Take the Next Step?

Understanding the hidden machinery behind fund pricing and execution gives you the confidence to navigate the markets with peace of mind. Take our habit assessment to evaluate your current investment portfolio, check your fund execution structures, and build an automated strategy for long-term compound growth.

[Take the Financial Habits Assessment →](https://compoundingjourney.com/en/#assessment)
