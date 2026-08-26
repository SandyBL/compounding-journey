// Number Highlighting Helper Function
        function highlightNumbers(text) {
            if (!text) return '';
            const pattern = /(\$\d+[\d,]*k?|\d+(\.\d+)?%|\d+\s*(hours|months|years|working weeks)|24-month|84-month|6-month|3x|AUM)/gi;
            return text.replace(pattern, '<span class="font-bold text-espresso-950 bg-amber-200/90 px-1.5 py-0.5 rounded font-mono text-[0.88em] border border-amber-300/80">$1</span>');
        }

        // INITIAL STATE
        const INITIAL_STATE = {
            netWorth: 10000,
            cashFlow: 500,
            happiness: 50, // Initial Happiness at 50%
            literacyScore: 50 // Initial Literacy IQ set to 50%
        };

        // 5 SCENARIO CATEGORIES
        const CATEGORIES = {
            INVESTING: "Investing & Asset Allocation",
            DEBT: "Debt & Leverage Management",
            SPENDING: "Conscious Spending & Habits",
            TAX: "Tax & Retirement Planning",
            RISK: "Risk & Protection Strategy"
        };

        let currentState = { ...INITIAL_STATE };
        let currentScenarioIndex = 0;
        let decisionHistory = [];
        let trajectoryData = [INITIAL_STATE.netWorth];

        // Category Scores (30 points max per question)
        let categoryScores = {
            [CATEGORIES.INVESTING]: { points: 0, max: 0 },
            [CATEGORIES.DEBT]: { points: 0, max: 0 },
            [CATEGORIES.SPENDING]: { points: 0, max: 0 },
            [CATEGORIES.TAX]: { points: 0, max: 0 },
            [CATEGORIES.RISK]: { points: 0, max: 0 }
        };

        // 15 SEQUENTIAL SCENARIOS WITH REVISED LITERACY DELTAS & HAPPINESS DELTAS
        const SCENARIOS = [
            {
                id: 1,
                category: CATEGORIES.INVESTING,
                title: "1. The Idle Cash Dilemma",
                description: "You receive a $5,000 work bonus. You do not need this liquid cash immediately. Annual inflation rate is 3.5%. How do you deploy this capital?",
                optionA: {
                    title: "Leave all $5,000 in a 0.01% standard checking account.",
                    desc: "Keeps 100% liquid cash in checking for emotional peace of mind.",
                    qualityScore: 10,
                    impact: { netWorthDelta: 5000, cashFlowDelta: 0, happinessDelta: 0, literacyDelta: -2.0, literacyDeltaText: "-2%" },
                    lesson: "Money left idle in checking feels safe, but silently shrinks in real purchasing power due to inflation."
                },
                optionB: {
                    title: "Put the $5,000 into a High-Yield Savings (HYSA) / Money Market Fund.",
                    desc: "Earns competitive short-term interest while remaining liquid.",
                    qualityScore: 30,
                    impact: { netWorthDelta: 5250, cashFlowDelta: 20, happinessDelta: 10, literacyDelta: 3.33, literacyDeltaText: "+3%" },
                    lesson: "High-yield savings or money market funds shield cash reserves against inflation and build risk-free yield without sacrificing short-term liquidity."
                },
                optionC: {
                    title: "Put 100% of the $5,000 into a volatile speculative memecoin.",
                    desc: "Chases ultra-high quick gains with extreme loss probability.",
                    qualityScore: 0,
                    impact: { netWorthDelta: -3000, cashFlowDelta: 0, happinessDelta: -15, literacyDelta: -8.0, literacyDeltaText: "-8%" },
                    lesson: "Speculation is not investing. Putting liquid funds into hype-driven volatile assets risks total drawdown and high financial stress."
                }
            },
            {
                id: 2,
                category: CATEGORIES.INVESTING,
                title: "2. Beach House: Buy vs. Rent vs. Core Assets",
                description: "You dream of spending summer months near the ocean. You have saved $60,000 for a down payment or investment.",
                optionA: {
                    title: "Buy a beach house with a heavy mortgage and high HOA/maintenance fees.",
                    desc: "Commits to high monthly debt service and localized coastal property risk.",
                    qualityScore: 10,
                    impact: { netWorthDelta: -4000, cashFlowDelta: -400, happinessDelta: 10, literacyDelta: -3.0, literacyDeltaText: "-3%" },
                    lesson: "Vacation properties are frequently lifestyle expenses masked as investments. Maintenance, insurance, and taxes can drain cash flow."
                },
                optionB: {
                    title: "Rent a beach house for 2-4 weeks each summer & invest the $60k in global index funds.",
                    desc: "Enjoys the beach lifestyle flexibly while keeping capital compounding in liquid assets.",
                    qualityScore: 30,
                    impact: { netWorthDelta: 4000, cashFlowDelta: 50, happinessDelta: 20, literacyDelta: 3.33, literacyDeltaText: "+3%" },
                    lesson: "Renting luxury assets while owning income-producing productive assets maximizes both personal happiness and compounding speed."
                },
                optionC: {
                    title: "Keep the $60,000 sitting in a 0% interest checking account indefinitely.",
                    desc: "Keeps capital uninvested out of fear of real estate or stock markets.",
                    qualityScore: 0,
                    impact: { netWorthDelta: 0, cashFlowDelta: 0, happinessDelta: -10, literacyDelta: -8.0, literacyDeltaText: "-8%" },
                    lesson: "Opportunity cost is massive. Hoarding uninvested capital starves your future self from long-term compound growth."
                }
            },
            {
                id: 3,
                category: CATEGORIES.TAX,
                title: "3. Choosing Financial Advice & Guidance",
                description: "You want a professional to help organize your investments and long-term financial roadmap.",
                optionA: {
                    title: "Hire a fee-only, fiduciary planner paying a transparent hourly rate.",
                    desc: "Receives conflict-free advice without recurring percentage drag.",
                    qualityScore: 30,
                    impact: { netWorthDelta: 3500, cashFlowDelta: 0, happinessDelta: 15, literacyDelta: 3.33, literacyDeltaText: "+3%" },
                    lesson: "Fee-only fiduciary planners charge for time or flat advice—not commissions—aligning their recommendations directly with your best interest."
                },
                optionB: {
                    title: "Use an advisor charging a 1.5% annual Asset Under Management (AUM) fee + product sales.",
                    desc: "Pays an ongoing percentage fee that compounds against your portfolio.",
                    qualityScore: 10,
                    impact: { netWorthDelta: -1500, cashFlowDelta: -50, happinessDelta: 0, literacyDelta: -2.0, literacyDeltaText: "-2%" },
                    lesson: "A 1.5% annual AUM fee sounds small, but over 30 years it can strip away over 30% of your net terminal portfolio growth."
                },
                optionC: {
                    title: "Follow financial advice exclusively from social media influencers & viral threads.",
                    desc: "Trades based on short-term hype, sponsored posts, and unverified credentials.",
                    qualityScore: 0,
                    impact: { netWorthDelta: -4000, cashFlowDelta: -100, happinessDelta: -15, literacyDelta: -8.0, literacyDeltaText: "-8%" },
                    lesson: "Social media trends incentivize sensationalism over sound financial planning. Tailored personal strategy requires fiduciary thinking."
                }
            },
            {
                id: 4,
                category: CATEGORIES.RISK,
                title: "4. Life Insurance Strategy for Dependents",
                description: "You have dependents relying on your income. You need to protect your family's future security.",
                optionA: {
                    title: "Buy an inexpensive Term Life policy and invest the cost difference in index funds.",
                    desc: "Separates pure insurance protection from investing for maximum efficiency.",
                    qualityScore: 30,
                    impact: { netWorthDelta: 4000, cashFlowDelta: -20, happinessDelta: 15, literacyDelta: 3.33, literacyDeltaText: "+3%" },
                    lesson: "'Buy term and invest the difference' provides high insurance coverage during working years while keeping investment returns flexible."
                },
                optionB: {
                    title: "Buy a complex Whole Life / Permanent policy with high commissions.",
                    desc: "Bundles insurance with low-yield internal cash value and high fee drag.",
                    qualityScore: 10,
                    impact: { netWorthDelta: -2500, cashFlowDelta: -200, happinessDelta: 5, literacyDelta: -2.0, literacyDeltaText: "-2%" },
                    lesson: "Permanent/Whole life insurance policies carry heavy upfront agent commissions and sub-optimal surrender values for average families."
                },
                optionC: {
                    title: "Buy zero life insurance despite having multiple young dependents.",
                    desc: "Exposes your family to catastrophic financial collapse if something happens.",
                    qualityScore: 0,
                    impact: { netWorthDelta: 0, cashFlowDelta: 0, happinessDelta: -20, literacyDelta: -10.0, literacyDeltaText: "-10%" },
                    lesson: "Skipping essential risk protection leaves your loved ones vulnerable to total financial devastation and ongoing anxiety."
                }
            },
            {
                id: 5,
                category: CATEGORIES.DEBT,
                title: "5. Managing Debt: Mortgage vs. Market Yields",
                description: "You have $20,000 extra cash. You have a fixed low-rate mortgage at 3.0%, while safe short-term bonds yield 5.2%.",
                optionA: {
                    title: "Rush to prepay the 3% fixed mortgage as fast as possible.",
                    desc: "Pours liquid cash into non-liquid home equity to eliminate low-rate debt.",
                    qualityScore: 15,
                    impact: { netWorthDelta: 1000, cashFlowDelta: 0, happinessDelta: 15, literacyDelta: 1.0, literacyDeltaText: "+1%" },
                    lesson: "Paying down low-interest debt guarantees a 3% return. While psychologically satisfying (+Happiness), it yields less than higher risk-free bond returns."
                },
                optionB: {
                    title: "Keep the 3% mortgage and invest $20k in high-grade short term yields/index funds.",
                    desc: "Arbitrages the interest spread (5.2% yield vs 3.0% mortgage cost).",
                    qualityScore: 30,
                    impact: { netWorthDelta: 3500, cashFlowDelta: 40, happinessDelta: 10, literacyDelta: 3.33, literacyDeltaText: "+3%" },
                    lesson: "Good debt is low-rate fixed leverage. When risk-free investment returns exceed your debt cost, maintaining low-rate debt builds wealth faster."
                },
                optionC: {
                    title: "Take out an additional high-interest personal loan for a luxury holiday.",
                    desc: "Piles on high-rate consumer debt for short-term gratification.",
                    qualityScore: 0,
                    impact: { netWorthDelta: -5000, cashFlowDelta: -250, happinessDelta: -10, literacyDelta: -8.0, literacyDeltaText: "-8%" },
                    lesson: "Taking high-interest debt for non-essential consumables drains future cash flow, causing stress once the holiday ends."
                }
            },
            {
                id: 6,
                category: CATEGORIES.SPENDING,
                title: "6. Conscious Spending & Value Alignment",
                description: "You earned a $300 monthly income raise. How do you integrate this into your lifestyle?",
                optionA: {
                    title: "Spend with purpose: Allocate $150 to meaningful passions & invest $150.",
                    desc: "Balances conscious enjoyment of today with compounding wealth for tomorrow.",
                    qualityScore: 30,
                    impact: { netWorthDelta: 2000, cashFlowDelta: 150, happinessDelta: 25, literacyDelta: 3.33, literacyDeltaText: "+3%" },
                    lesson: "Money is a tool for fulfillment. Spending intentionally on things you truly value while saving the rest maximizes long-term happiness."
                },
                optionB: {
                    title: "Unconscious lifestyle creep: Upgrade dining, apparel & status flexes immediately.",
                    desc: "Absorbs the entire raise in inflated baseline living expenses.",
                    qualityScore: 5,
                    impact: { netWorthDelta: -1500, cashFlowDelta: -100, happinessDelta: 5, literacyDelta: -3.0, literacyDeltaText: "-3%" },
                    lesson: "Lifestyle creep occurs when spending rises automatically with income, leaving your net savings rate stagnant."
                },
                optionC: {
                    title: "Extreme frugality: Save 100% and cut out all fun, socializing, and hobbies.",
                    desc: "Eliminates all personal joy in pursuit of numerical net worth metrics.",
                    qualityScore: 10,
                    impact: { netWorthDelta: 3000, cashFlowDelta: 300, happinessDelta: -20, literacyDelta: -2.0, literacyDeltaText: "-2%" },
                    lesson: "Extreme austerity often leads to burnout and unhappiness. Sustainable wealth requires balancing future freedom and current joy."
                }
            },
            {
                id: 7,
                category: CATEGORIES.SPENDING,
                title: "7. Thinking in 'Hours of Work'",
                description: "You are eyeing a new flagship $1,500 smartphone. You earn $25/hour post-tax.",
                optionA: {
                    title: "Calculate the time-cost (60 hours of work) and keep your current working phone.",
                    desc: "Realizes the purchase costs 1.5 full working weeks of labor.",
                    qualityScore: 30,
                    impact: { netWorthDelta: 1500, cashFlowDelta: 0, happinessDelta: 10, literacyDelta: 3.33, literacyDeltaText: "+3%" },
                    lesson: "Translating price tags into 'hours of life traded' exposes the true cost of purchases and curbs impulse spending."
                },
                optionB: {
                    title: "Buy the phone immediately on a 24-month high-interest installment plan.",
                    desc: "Masks the true price through small monthly debt payments.",
                    qualityScore: 0,
                    impact: { netWorthDelta: -2000, cashFlowDelta: -85, happinessDelta: -5, literacyDelta: -6.0, literacyDeltaText: "-6%" },
                    lesson: "Installment plans hide total costs and lock you into debt, reducing future peace of mind."
                },
                optionC: {
                    title: "Buy a reliable refurbished model for $400 and invest the $1,100 difference.",
                    desc: "Meets operational tech needs while saving major capital.",
                    qualityScore: 25,
                    impact: { netWorthDelta: 1100, cashFlowDelta: 0, happinessDelta: 15, literacyDelta: 2.5, literacyDeltaText: "+2.5%" },
                    lesson: "Seeking utility over status flexes provides tech functionality while preserving capital to build true wealth."
                }
            },
            {
                id: 8,
                category: CATEGORIES.TAX,
                title: "8. Tax-Advantaged Retirement & Pensions",
                description: "Your employer offers a pension/401k match (50% match up to 6% of salary).",
                optionA: {
                    title: "Contribute up to 6% to capture 100% of the free employer match and tax deduction.",
                    desc: "Claims instant 50% guaranteed return + tax-deferred growth.",
                    qualityScore: 30,
                    impact: { netWorthDelta: 4500, cashFlowDelta: 50, happinessDelta: 15, literacyDelta: 3.33, literacyDeltaText: "+3%" },
                    lesson: "An employer match is an immediate 50-100% return on investment. Tax-advantaged accounts eliminate annual tax drag."
                },
                optionB: {
                    title: "Ignore the pension plan and invest only in standard taxable brokerage accounts.",
                    desc: "Misses out on free match money and exposes dividends to annual tax drag.",
                    qualityScore: 10,
                    impact: { netWorthDelta: 1000, cashFlowDelta: 0, happinessDelta: 5, literacyDelta: -3.0, literacyDeltaText: "-3%" },
                    lesson: "Investing outside tax shelters exposes your returns to annual dividend taxes, slowing wealth accumulation."
                },
                optionC: {
                    title: "Opt out of pension/savings completely to maximize take-home pay for current spending.",
                    desc: "Leaves free money on the table to fund higher monthly consumption.",
                    qualityScore: 0,
                    impact: { netWorthDelta: -1000, cashFlowDelta: -100, happinessDelta: -15, literacyDelta: -8.0, literacyDeltaText: "-8%" },
                    lesson: "Leaving employer matches unclaimed is rejecting free compensation and forfeiting long-term financial security."
                }
            },
            {
                id: 9,
                category: CATEGORIES.DEBT,
                title: "9. Eliminating Toxic Credit Card Debt",
                description: "You have $4,000 in credit card debt charging 22% annual interest, and $4,000 in savings.",
                optionA: {
                    title: "Use savings to pay off the 22% credit card debt immediately.",
                    desc: "Eliminates a high-rate financial drain and secures a guaranteed 22% return.",
                    qualityScore: 30,
                    impact: { netWorthDelta: 3000, cashFlowDelta: 120, happinessDelta: 20, literacyDelta: 3.33, literacyDeltaText: "+3%" },
                    lesson: "Paying off 22% credit card debt is equivalent to earning a risk-free, tax-free 22% return while lifting monthly debt anxiety."
                },
                optionB: {
                    title: "Pay minimum monthly balance while investing $4,000 in stocks expected to yield 8%.",
                    desc: "Loses money mathematically by earning 8% while paying 22%.",
                    qualityScore: 5,
                    impact: { netWorthDelta: -2000, cashFlowDelta: -80, happinessDelta: -10, literacyDelta: -5.0, literacyDeltaText: "-5%" },
                    lesson: "Paying 22% interest to earn 8% returns destroys net worth and creates constant debt drag."
                },
                optionC: {
                    title: "Ignore the credit card balance and use available limit for new luxury purchases.",
                    desc: "Triggers compounding interest penalty cycles and credit score destruction.",
                    qualityScore: 0,
                    impact: { netWorthDelta: -5000, cashFlowDelta: -300, happinessDelta: -25, literacyDelta: -10.0, literacyDeltaText: "-10%" },
                    lesson: "Toxic high-interest debt compounds exponentially against you. It is a primary source of severe financial anxiety."
                }
            },
            {
                id: 10,
                category: CATEGORIES.SPENDING,
                title: "10. Assets vs. Consumables (Vehicle Choice)",
                description: "You need reliable transportation for work. You have cash flow to support options.",
                optionA: {
                    title: "Buy a reliable, slightly used vehicle with cash / low-rate loan and invest surplus.",
                    desc: "Minimizes depreciation losses and keeps cash flow free for assets.",
                    qualityScore: 30,
                    impact: { netWorthDelta: 3500, cashFlowDelta: 100, happinessDelta: 15, literacyDelta: 3.33, literacyDeltaText: "+3%" },
                    lesson: "Vehicles are depreciating tools. Keeping vehicle costs sensible unlocks capital for true wealth-generating assets."
                },
                optionB: {
                    title: "Lease a brand-new luxury automobile for $600/month.",
                    desc: "Pays peak depreciation cost with 0 equity retention.",
                    qualityScore: 5,
                    impact: { netWorthDelta: -4000, cashFlowDelta: -400, happinessDelta: 10, literacyDelta: -4.0, literacyDeltaText: "-4%" },
                    lesson: "Leasing brand new luxury cars means paying for peak depreciation, creating a permanent heavy drain on monthly cash flow."
                },
                optionC: {
                    title: "Take out an expensive 84-month auto loan for a top-spec sports truck.",
                    desc: "Locks into multi-year interest costs on a rapidly depreciating asset.",
                    qualityScore: 0,
                    impact: { netWorthDelta: -7000, cashFlowDelta: -600, happinessDelta: -10, literacyDelta: -8.0, literacyDeltaText: "-8%" },
                    lesson: "Long-term auto loans force you to pay interest on an asset losing value every single day."
                }
            },
            {
                id: 11,
                category: CATEGORIES.INVESTING,
                title: "11. Investment Style: Quality & Low-Cost Indexing",
                description: "You are selecting your core portfolio strategy for the next 20 years.",
                optionA: {
                    title: "Broad Total Market Index Fund (0.03% Fee) covering Quality, Growth & Value.",
                    desc: "Captures total stock market returns with near-zero fee drag.",
                    qualityScore: 30,
                    impact: { netWorthDelta: 6000, cashFlowDelta: 0, happinessDelta: 15, literacyDelta: 3.33, literacyDeltaText: "+3%" },
                    lesson: "Low-cost index funds guarantee you capture total market returns without the high risk of individual company failures."
                },
                optionB: {
                    title: "Actively pick 3 viral penny stocks recommended on internet forums.",
                    desc: "Takes unhedged concentration risk in unproven businesses.",
                    qualityScore: 5,
                    impact: { netWorthDelta: -3000, cashFlowDelta: 0, happinessDelta: -15, literacyDelta: -6.0, literacyDeltaText: "-6%" },
                    lesson: "Concentrated stock picking without research often results in severe losses compared to broad market indexing."
                },
                optionC: {
                    title: "Store 100% of long-term investments in physical cash under a mattress.",
                    desc: "Protects nominal value while guaranteeing loss to inflation.",
                    qualityScore: 0,
                    impact: { netWorthDelta: -1500, cashFlowDelta: 0, happinessDelta: -10, literacyDelta: -7.0, literacyDeltaText: "-7%" },
                    lesson: "Physical cash hoarding avoids market swings but guarantees loss of purchasing power over long horizons."
                }
            },
            {
                id: 12,
                category: CATEGORIES.INVESTING,
                title: "12. Asset Class Diversification",
                description: "You want to construct a resilient multi-asset portfolio.",
                optionA: {
                    title: "Balanced Asset Allocation: Stocks, Global Real Estate, Short Bonds & Gold.",
                    desc: "Diversifies across non-correlated asset classes for smooth growth.",
                    qualityScore: 30,
                    impact: { netWorthDelta: 4500, cashFlowDelta: 30, happinessDelta: 15, literacyDelta: 3.33, literacyDeltaText: "+3%" },
                    lesson: "True diversification across asset classes reduces portfolio volatility without sacrificing long-term growth potential."
                },
                optionB: {
                    title: "Put 100% of total liquid net worth into Bitcoin & altcoins.",
                    desc: "Exposes entire capital base to extreme regulatory & sentiment swings.",
                    qualityScore: 10,
                    impact: { netWorthDelta: -2000, cashFlowDelta: 0, happinessDelta: -15, literacyDelta: -5.0, literacyDeltaText: "-5%" },
                    lesson: "Crypto can be a small satellite asset, but putting 100% into speculative crypto creates extreme anxiety and risk."
                },
                optionC: {
                    title: "Keep 100% of wealth in traditional low-yielding bank CDs.",
                    desc: "Avoids stock market completely at the cost of slow wealth building.",
                    qualityScore: 15,
                    impact: { netWorthDelta: 1200, cashFlowDelta: 15, happinessDelta: 0, literacyDelta: -1.0, literacyDeltaText: "-1%" },
                    lesson: "Bank CDs offer principal safety, but lack the equity growth necessary to build long-term generational wealth."
                }
            },
            {
                id: 13,
                category: CATEGORIES.INVESTING,
                title: "13. Market Cap Focus: Blue Chips vs. Micro Caps",
                description: "You are choosing stock market exposure for long-term compound growth.",
                optionA: {
                    title: "Core allocation in Large-Cap Quality Blue Chips / S&P 500 with small Mid-Cap blend.",
                    desc: "Owns profitable market leaders with durable competitive moats.",
                    qualityScore: 30,
                    impact: { netWorthDelta: 5000, cashFlowDelta: 25, happinessDelta: 15, literacyDelta: 3.33, literacyDeltaText: "+3%" },
                    lesson: "Large-cap quality blue chip companies have battle-tested business models and strong dividend compounding abilities."
                },
                optionB: {
                    title: "Put 100% into unproven speculative Micro-Cap biotech startups.",
                    desc: "High risk of bankruptcy with occasional jackpot outcomes.",
                    qualityScore: 10,
                    impact: { netWorthDelta: -2500, cashFlowDelta: 0, happinessDelta: -10, literacyDelta: -4.0, literacyDeltaText: "-4%" },
                    lesson: "Micro-caps carry high failure rates. They belong in small satellite portions of a portfolio, not as your core foundation."
                },
                optionC: {
                    title: "Trade daily leveraged 3x ETFs attempting to market-time short term news.",
                    desc: "Suffer from volatility decay and emotional overtrading losses.",
                    qualityScore: 0,
                    impact: { netWorthDelta: -5000, cashFlowDelta: 0, happinessDelta: -20, literacyDelta: -8.0, literacyDeltaText: "-8%" },
                    lesson: "Leveraged ETFs suffer from daily resetting decay and are designed for short-term hedging, causing heavy emotional stress."
                }
            },
            {
                id: 14,
                category: CATEGORIES.RISK,
                title: "14. Emergency Reserves & Crisis Protection",
                description: "Economic uncertainty is rising. How do you structure your safety moat?",
                optionA: {
                    title: "Maintain a 6-month liquid Emergency Fund in HYSA before investing aggressively.",
                    desc: "Creates a defensive cash buffer so you never sell stocks during downturns.",
                    qualityScore: 30,
                    impact: { netWorthDelta: 3000, cashFlowDelta: 20, happinessDelta: 25, literacyDelta: 3.33, literacyDeltaText: "+3%" },
                    lesson: "An emergency buffer provides immense psychological peace of mind (+Happiness) and prevents forced liquidation of investments during crashes."
                },
                optionB: {
                    title: "Keep zero cash reserve; invest 100% of money into illiquid assets.",
                    desc: "Forces high stress and potential loss if sudden unexpected cash is needed.",
                    qualityScore: 10,
                    impact: { netWorthDelta: -1500, cashFlowDelta: 0, happinessDelta: -10, literacyDelta: -4.0, literacyDeltaText: "-4%" },
                    lesson: "Without cash reserves, minor unexpected expenses force you to sell investments at market bottoms or take high-interest debt."
                },
                optionC: {
                    title: "Rely on credit cards as your sole emergency safety net.",
                    desc: "Turns unexpected life events into high-interest debt traps.",
                    qualityScore: 0,
                    impact: { netWorthDelta: -3500, cashFlowDelta: -150, happinessDelta: -20, literacyDelta: -8.0, literacyDeltaText: "-8%" },
                    lesson: "Credit cards are not an emergency fund. Relying on high-interest debt during emergencies compounds financial distress."
                }
            },
            {
                id: 15,
                category: CATEGORIES.SPENDING,
                title: "15. Day-to-Day Habits: 'Pay Yourself First'",
                description: "Your monthly salary hits your account on the 1st of every month.",
                optionA: {
                    title: "Automate transfers to savings/investments on payday ('Pay Yourself First').",
                    desc: "Ensures wealth building happens automatically before lifestyle spending.",
                    qualityScore: 30,
                    impact: { netWorthDelta: 4000, cashFlowDelta: 50, happinessDelta: 20, literacyDelta: 3.33, literacyDeltaText: "+3%" },
                    lesson: "Paying yourself first automates discipline. You adapt your lifestyle stress-free to what remains after savings."
                },
                optionB: {
                    title: "Spend throughout the month and save whatever happens to be left over.",
                    desc: "Usually results in zero savings due to parkinson's law of spending.",
                    qualityScore: 10,
                    impact: { netWorthDelta: 500, cashFlowDelta: 0, happinessDelta: 0, literacyDelta: -2.0, literacyDeltaText: "-2%" },
                    lesson: "If you save only what is left after spending, you will rarely save anything. Expense expansion consumes unallocated balances."
                },
                optionC: {
                    title: "Constantly order food delivery and micro-subscriptions on impulse daily.",
                    desc: "Drains hundreds of dollars monthly on forgotten digital subscriptions and convenience fees.",
                    qualityScore: 0,
                    impact: { netWorthDelta: -2500, cashFlowDelta: -200, happinessDelta: -5, literacyDelta: -6.0, literacyDeltaText: "-6%" },
                    lesson: "Unmonitored micro-expenses quietly siphon away thousands in annual investment potential, producing little lasting satisfaction."
                }
            }
        ];

        // INIT STEPPER DOTS
        function initStepper() {
            const container = document.getElementById('stepperDotsContainer');
            if (!container) return;
            container.innerHTML = '';
            SCENARIOS.forEach((_, idx) => {
                const dot = document.createElement('div');
                dot.id = `stepDot_${idx}`;
                dot.className = 'h-2 flex-1 rounded-full bg-cream-300 transition-all duration-300';
                container.appendChild(dot);
            });
        }

        // UPDATE STEPPER DOTS
        function updateStepperDots() {
            SCENARIOS.forEach((_, idx) => {
                const dot = document.getElementById(`stepDot_${idx}`);
                if (!dot) return;
                if (idx < currentScenarioIndex) {
                    dot.className = 'h-2 flex-1 rounded-full bg-forest-800 transition-all duration-300';
                } else if (idx === currentScenarioIndex) {
                    dot.className = 'h-2 flex-1 rounded-full bg-gold-500 ring-2 ring-gold-500/30 transition-all duration-300';
                } else {
                    dot.className = 'h-2 flex-1 rounded-full bg-cream-300 transition-all duration-300';
                }
            });
        }

        // RENDER CURRENT SCENARIO
        function renderCurrentScenario() {
            if (currentScenarioIndex >= SCENARIOS.length) {
                showFinalResults();
                return;
            }

            const current = SCENARIOS[currentScenarioIndex];

            // Progress text
            document.getElementById('scenarioProgressText').innerText = `Phase ${currentScenarioIndex + 1} of ${SCENARIOS.length}`;
            document.getElementById('scenarioCategoryBadge').innerText = current.category;

            // Scenario text with number highlighting
            document.getElementById('scenarioTitle').innerHTML = current.title;
            document.getElementById('scenarioDescription').innerHTML = highlightNumbers(current.description);

            // Container for 3 choices
            const container = document.getElementById('optionsContainer');
            container.innerHTML = '';

            const options = [
                { key: 'optionA', label: 'Option A', data: current.optionA },
                { key: 'optionB', label: 'Option B', data: current.optionB },
                { key: 'optionC', label: 'Option C', data: current.optionC }
            ];

            options.forEach(opt => {
                const btn = document.createElement('button');
                btn.className = 'w-full text-left p-5 bg-cream-100 hover:bg-cream-200 border border-cream-300 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-forest-800 group custom-shadow hover:-translate-y-0.5';
                btn.onclick = () => selectOption(opt.data, current);

                btn.innerHTML = `
                    <div class="flex items-start gap-3">
                        <span class="px-2.5 py-1 bg-forest-800 text-white font-extrabold text-xs rounded-md uppercase tracking-wider group-hover:bg-forest-900 flex-shrink-0 mt-0.5">
                            ${opt.label}
                        </span>
                        <div>
                            <h3 class="text-base sm:text-lg font-bold text-espresso-950 group-hover:text-forest-800 mb-1">
                                ${opt.data.title}
                            </h3>
                            <p class="text-sm text-espresso-800/80 leading-relaxed">
                                ${highlightNumbers(opt.data.desc)}
                            </p>
                        </div>
                    </div>
                `;
                container.appendChild(btn);
            });

            // Ensure cards display correctly
            document.getElementById('scenarioCard').classList.remove('hidden');
            document.getElementById('debriefCard').classList.add('hidden');

            updateStepperDots();
        }

        // SELECT OPTION HANDLER
        function selectOption(option, scenario) {
            // Update Metrics
            currentState.netWorth += option.impact.netWorthDelta;
            currentState.cashFlow += option.impact.cashFlowDelta;
            
            // Update Happiness (Clamped 0% to 100%)
            currentState.happiness = Math.max(0, Math.min(100, currentState.happiness + (option.impact.happinessDelta || 0)));

            // Update Literacy IQ (Starts at 50%, capped at 100%, can drop into negative numbers)
            currentState.literacyScore = Math.min(100, currentState.literacyScore + option.impact.literacyDelta);

            // Update Quality Points & Category Score
            if (categoryScores[scenario.category]) {
                categoryScores[scenario.category].points += option.qualityScore;
                categoryScores[scenario.category].max += 30;
            }

            // Record trajectory & history
            trajectoryData.push(currentState.netWorth);
            decisionHistory.push({
                scenarioId: scenario.id,
                category: scenario.category,
                selectedTitle: option.title,
                qualityScore: option.qualityScore
            });

            // Update Header Display
            updateMetricsDisplay();

            // Show Debrief
            showDebrief(option);
        }

        // UPDATE HEADER METRICS
        function updateMetricsDisplay() {
            document.getElementById('netWorthDisplay').innerText = `$${currentState.netWorth.toLocaleString()}`;
            document.getElementById('cashFlowDisplay').innerText = `${currentState.cashFlow >= 0 ? '+' : ''}$${currentState.cashFlow}/mo`;
            document.getElementById('powerDisplay').innerText = `${Math.round(currentState.happiness)}%`;
            document.getElementById('literacyDisplay').innerText = `${Math.round(currentState.literacyScore)}%`;
        }

        // SHOW DEBRIEF
        function showDebrief(option) {
            document.getElementById('scenarioCard').classList.add('hidden');
            const debriefCard = document.getElementById('debriefCard');
            debriefCard.classList.remove('hidden');

            const hDelta = option.impact.happinessDelta || 0;

            // Construct impact tags
            const impactsDiv = document.getElementById('debriefImpacts');
            impactsDiv.innerHTML = `
                <span class="px-2.5 py-1 rounded-md text-xs font-bold font-mono ${option.impact.netWorthDelta >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">
                    Net Worth: ${option.impact.netWorthDelta >= 0 ? '+' : ''}$${option.impact.netWorthDelta.toLocaleString()}
                </span>
                <span class="px-2.5 py-1 rounded-md text-xs font-bold font-mono ${option.impact.cashFlowDelta >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">
                    Cash Flow: ${option.impact.cashFlowDelta >= 0 ? '+' : ''}$${option.impact.cashFlowDelta}/mo
                </span>
                <span class="px-2.5 py-1 rounded-md text-xs font-bold font-mono ${hDelta >= 0 ? 'bg-sky-100 text-sky-800' : 'bg-rose-100 text-rose-800'}">
                    Happiness: ${hDelta >= 0 ? '+' : ''}${hDelta}%
                </span>
                <span class="px-2.5 py-1 rounded-md text-xs font-bold font-mono bg-amber-100 text-amber-900">
                    IQ Impact: ${option.impact.literacyDeltaText}
                </span>
            `;

            // Debrief text lesson
            document.getElementById('debriefLesson').innerHTML = highlightNumbers(option.lesson);
        }

        // NEXT SCENARIO
        function nextScenario() {
            currentScenarioIndex++;
            renderCurrentScenario();
        }

        // SHOW FINAL RESULTS
        function showFinalResults() {
            document.getElementById('scenarioCard').classList.add('hidden');
            document.getElementById('debriefCard').classList.add('hidden');
            document.getElementById('resultsScreen').classList.remove('hidden');

            // Populate final stats
            document.getElementById('finalNetWorth').innerText = `$${currentState.netWorth.toLocaleString()}`;
            document.getElementById('finalCashFlow').innerText = `${currentState.cashFlow >= 0 ? '+' : ''}$${currentState.cashFlow}/mo`;
            document.getElementById('finalPower').innerText = `${Math.round(currentState.happiness)}%`;
            document.getElementById('finalLiteracy').innerText = `${Math.round(currentState.literacyScore)}%`;

            // ARCHETYPE & EVALUATION LOGIC
            const finalIQ = currentState.literacyScore;
            let archetype = "";
            let archetypeDescription = "";

            if (finalIQ >= 80) {
                archetype = "The Freedom Strategist";
                archetypeDescription = "Exemplary financial literacy! You systematically prioritize cash-generating assets, avoid high-fee traps, optimize leverage, and balance current happiness with future compounding.";
            } else if (finalIQ >= 50) {
                archetype = "The Conscious Accumulator";
                archetypeDescription = "Solid financial foundation! You understand key wealth concepts well, though minor leaks in investment fees, debt timing, or lifestyle spending could be refined.";
            } else if (finalIQ >= 20) {
                archetype = "The Wealth Apprentice";
                archetypeDescription = "You have basic financial awareness, but frequently expose your wealth to inflation drag, unhedged liabilities, or suboptimal debt decisions.";
            } else {
                archetype = "The Vulnerable Consumer";
                archetypeDescription = "High financial risk profile! Your decisions currently favor short-term consumption, high-interest liabilities, and idle cash reserves that erode your future wealth.";
            }

            document.getElementById('archetypeTitle').innerText = archetype;
            document.getElementById('archetypeDesc').innerText = archetypeDescription;

            // The scenario card the user was standing on is now hidden. Move focus to the
            // results heading so the outcome is announced and the next Tab starts here.
            const resultsHeading = document.getElementById('archetypeTitle');
            resultsHeading.setAttribute('tabindex', '-1');
            resultsHeading.focus({ preventScroll: true });

            // RENDER CATEGORY DIAGNOSTICS
            renderCategoryBreakdown();

            // RENDER CHART
            renderTrajectoryChart();

            // RENDER LEADERBOARD
            loadLeaderboard();
        }

        // RENDER CATEGORY BREAKDOWN
        function renderCategoryBreakdown() {
            const container = document.getElementById('categoryBreakdown');
            container.innerHTML = '';

            for (const [catName, score] of Object.entries(categoryScores)) {
                const pct = score.max > 0 ? Math.round((score.points / score.max) * 100) : 0;
                let statusColor = "bg-emerald-600";
                let statusText = "Strong Mastery";

                if (pct < 50) {
                    statusColor = "bg-rose-600";
                    statusText = "Needs Urgent Focus";
                } else if (pct < 75) {
                    statusColor = "bg-amber-500";
                    statusText = "Moderate Understanding";
                }

                const item = document.createElement('div');
                item.className = 'bg-cream-100 p-4 rounded-xl border border-cream-300';
                item.innerHTML = `
                    <div class="flex items-center justify-between mb-2">
                        <span class="font-bold text-espresso-900 text-sm sm:text-base">${catName}</span>
                        <span class="text-xs font-bold px-2.5 py-0.5 rounded-full text-white ${statusColor}">
                            ${statusText} (${pct}%)
                        </span>
                    </div>
                    <div class="w-full bg-cream-300 h-2.5 rounded-full overflow-hidden">
                        <div class="${statusColor} h-2.5 rounded-full transition-all duration-500" style="width: ${Math.max(0, pct)}%"></div>
                    </div>
                `;
                container.appendChild(item);
            }
        }

        // RENDER TRAJECTORY CHART
        function renderTrajectoryChart() {
            const ctx = document.getElementById('trajectoryChart');
            if (!ctx) return;

            // chart-4.4.1.umd.min.js is deferred and can fail to load. Every value
            // the chart plots is already on the page as text, so the graceful path
            // is to say so and stop; throwing here would take the rest of the
            // render down with it.
            if (typeof Chart === 'undefined') {
                if (!ctx.dataset.fallbackShown) {
                    ctx.dataset.fallbackShown = 'true';
                    // The canvas is a blank box once the chart cannot draw, and its container
                    // is height-constrained; hiding it lets the note take the same space.
                    ctx.hidden = true;
                    const note = document.createElement('p');
                    note.className = 'chart-unavailable';
                    note.textContent = 'The chart could not be drawn. Every figure it would show is also listed as text on this page.';
                    ctx.insertAdjacentElement('afterend', note);
                }
                return;
            }

            const labels = trajectoryData.map((_, i) => i === 0 ? 'Start' : `Phase ${i}`);

            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Net Worth ($)',
                        data: trajectoryData,
                        borderColor: '#2e6f40',
                        backgroundColor: 'rgba(46, 111, 64, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.3,
                        pointBackgroundColor: '#c3922e'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            ticks: {
                                callback: value => '$' + value.toLocaleString()
                            }
                        }
                    }
                }
            });
        }

        /* =================================================================
           GLOBAL LEADERBOARD (shared by every visitor, in every language)
           Read from and written to /api/simulator-leaderboard.
           ================================================================= */
        const LEADERBOARD_SIMULATOR = 'simulator-hub';

        // What the board is showing right now: 'loading' while the request is in
        // flight, 'error' when it failed, 'ready' otherwise. The three are kept
        // apart because an empty board and an unreachable one look identical if
        // both render as no rows, and they mean opposite things - one is an
        // invitation to be first, the other is a fault to report.
        let leaderboardEntries = [];
        let leaderboardState = 'loading';

        function loadLeaderboard() {
            leaderboardState = 'loading';
            renderLeaderboard();

            window.SimLeaderboard.load(LEADERBOARD_SIMULATOR, 'ALL')
                .then((entries) => {
                    leaderboardEntries = entries;
                    leaderboardState = 'ready';
                    renderLeaderboard();
                })
                .catch(() => {
                    leaderboardState = 'error';
                    renderLeaderboard();
                });
        }

        function leaderboardNotice(message) {
            return `<p class="py-4 text-sm text-espresso-800/70">${message}</p>`;
        }

        function renderLeaderboard() {
            const container = document.getElementById('leaderboardList');
            if (!container) return;

            if (leaderboardState === 'loading') {
                container.innerHTML = leaderboardNotice('Loading the global leaderboard…');
                return;
            }
            if (leaderboardState === 'error') {
                container.innerHTML = leaderboardNotice('The global leaderboard could not be reached. Your result is safe on this page — try saving it again in a moment.');
                return;
            }
            if (leaderboardEntries.length === 0) {
                container.innerHTML = leaderboardNotice('No results on the global leaderboard yet. Save yours and you will be the first.');
                return;
            }

            container.innerHTML = '';
            leaderboardEntries.slice(0, 5).forEach((entry, idx) => {
                const row = document.createElement('div');
                // The visitor's own line is marked rather than moved: the board is
                // a ranking, so the row stays where the score put it.
                const isMine = window.SimLeaderboard.isMine(LEADERBOARD_SIMULATOR, entry.id);
                row.className = isMine
                    ? 'py-3 flex items-center justify-between text-sm bg-forest-800/5 -mx-2 px-2 rounded-lg'
                    : 'py-3 flex items-center justify-between text-sm';
                row.innerHTML = `
                    <div class="flex items-center gap-3">
                        <span class="w-6 h-6 flex items-center justify-center font-bold font-mono rounded-full bg-cream-200 text-espresso-900 text-xs">
                            #${idx + 1}
                        </span>
                        <span class="font-bold text-espresso-950">${window.SimLeaderboard.escapeHtml(entry.name)}</span>
                        ${isMine ? '<span class="text-[10px] font-bold uppercase tracking-wide text-forest-800 bg-forest-800/10 px-2 py-0.5 rounded-full">You</span>' : ''}
                    </div>
                    <div class="flex items-center gap-4 font-mono text-xs sm:text-sm">
                        <span class="text-amber-700 font-bold">IQ: ${entry.score}%</span>
                        <span class="text-forest-800 font-bold">$${entry.tiebreak.toLocaleString()}</span>
                    </div>
                `;
                container.appendChild(row);
            });
        }

        function saveScoreToLeaderboard() {
            const input = document.getElementById('playerNameInput');
            const button = document.getElementById('saveScoreButton');
            const name = input ? input.value.trim() : '';
            if (!name) {
                alert("Please enter a name or initials — it is what other visitors will see on the leaderboard.");
                return;
            }

            // Disabled for the duration of the request. The button posts a row to
            // a table everybody reads, and a second click while the first was in
            // flight used to be free; now it is a duplicate entry.
            if (button) button.disabled = true;

            window.SimLeaderboard.submit({
                simulator: LEADERBOARD_SIMULATOR,
                board: 'ALL',
                name: name,
                score: Math.round(currentState.literacyScore),
                tiebreak: Math.round(currentState.netWorth)
            })
                .then((result) => {
                    leaderboardEntries = result.entries;
                    leaderboardState = 'ready';
                    renderLeaderboard();
                    if (input) input.value = '';
                    alert("Saved. Your result is now on the global leaderboard for every visitor to see.");
                })
                .catch(() => {
                    alert("Your result could not be sent to the global leaderboard. Check your connection and try again.");
                })
                .finally(() => {
                    if (button) button.disabled = false;
                });
        }

        // RESET GAME
        function resetGame() {
            currentState = { ...INITIAL_STATE };
            currentScenarioIndex = 0;
            decisionHistory = [];
            trajectoryData = [INITIAL_STATE.netWorth];

            categoryScores = {
                [CATEGORIES.INVESTING]: { points: 0, max: 0 },
                [CATEGORIES.DEBT]: { points: 0, max: 0 },
                [CATEGORIES.SPENDING]: { points: 0, max: 0 },
                [CATEGORIES.TAX]: { points: 0, max: 0 },
                [CATEGORIES.RISK]: { points: 0, max: 0 }
            };

            // Reset visibility of screens
            document.getElementById('resultsScreen').classList.add('hidden');
            document.getElementById('debriefCard').classList.add('hidden');
            document.getElementById('scenarioCard').classList.remove('hidden');

            updateMetricsDisplay();
            initStepper();
            renderCurrentScenario();
        }

        // INITIALIZE ON LOAD
        window.onload = function() {
            updateMetricsDisplay();
            initStepper();
            renderCurrentScenario();
        };
