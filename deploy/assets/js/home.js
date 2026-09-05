        const inputPlaceholders = {
            es: {
                name: "Ej. Carlos Mendoza",
                email: "carlos@empresa.com",
                message: "Cuéntame qué vida quieres construir y qué decisiones financieras te gustaría ordenar..."
            },
            en: {
                name: "e.g. Charles Smith",
                email: "charles@company.com",
                message: "Tell me about the life you want to build and the financial decisions you would like to organize..."
            },
            pt: {
                name: "Ex. Carlos Silva",
                email: "carlos@empresa.com",
                message: "Conta-me que vida queres construir e que decisões financeiras gostarias de organizar..."
            }
        };

        const pageTitles = {
            es: "Compounding Journey — El viaje del Crecimiento Compuesto",
            en: "Compounding Journey — Your Map to Freedom",
            pt: "Compounding Journey — A Jornada de Crescimento Composto"
        };

        const pageDescriptions = {
            es: "Compounding Journey — psicología del dinero, inversión con propósito y herramientas para construir libertad financiera según tus valores.",
            en: "Compounding Journey — money psychology, purposeful investing, and practical tools for building financial freedom around your values.",
            pt: "Compounding Journey — psicologia do dinheiro, investimento com propósito e ferramentas para construir liberdade financeira segundo os teus valores."
        };

        const openGraphLocales = {
            es: "es_ES",
            en: "en_US",
            pt: "pt_PT"
        };

        const supportedLanguages = ["en", "es", "pt"];
        const supportedCurrencies = ["EUR", "USD", "BRL"];
        const productionOrigin = "https://compoundingjourney.com";

        // generate-home-pages.mjs writes one single-language document per URL and
        // stamps the language onto <html data-page-language>. When that attribute
        // is present the markup, the canonical and the alternates are already
        // correct for the address that was requested, so the script must not
        // recompute any of them: doing so is what previously made every language
        // share one URL and one canonical.
        const pinnedLanguage = (document.documentElement.getAttribute("data-page-language") || "").toLowerCase();
        const isPrerenderedPage = supportedLanguages.includes(pinnedLanguage);
        let selectedCurrency = null;
        let hasExplicitCurrencyPreference = false;

        try {
            const savedCurrency = localStorage.getItem("preferredCalculatorCurrency")?.toUpperCase();
            if (supportedCurrencies.includes(savedCurrency)) {
                selectedCurrency = savedCurrency;
                hasExplicitCurrencyPreference = true;
            }
        } catch (error) {
            console.warn("Currency preference could not be read from localStorage.", error);
        }

        const newsletterLinks = {
            es: "https://preview.mailerlite.io/forms/2524111/193713027715958521/share",
            en: "https://compoundingjourney.substack.com/",
            pt: "https://preview.mailerlite.io/forms/2524111/193713995121690448/share"
        };

        // Where the nav's page items point, per language.
        //
        // scripts/site-routes.mjs decides these URLs; this is a copy, and it
        // exists because the language switcher rewrites every localized link in
        // the document at runtime and a page script cannot import a build
        // script. generate-home-pages.mjs reads this object back out, resolves
        // the same keys through site-routes and fails the build if the two
        // disagree - so the copy cannot drift into a set of 404s unnoticed.
        //
        // `simulators` used to be the one entry site-routes did not own, and it
        // pointed at /<lang>/simulator.html - the personal finance simulator -
        // because that page was the section's entry point before the section
        // had an index. It now points at the index, like every other entry
        // here, and site-routes owns all six.
        const sectionLinks = {
            es: {
                simulators: "/es/simulators/",
                tools: "/es/calculadoras/",
                templates: "/es/plantillas/",
                glossary: "/es/glosario/",
                data: "/es/datos/",
                sessions: "/es/sesiones/"
            },
            en: {
                simulators: "/en/simulators/",
                tools: "/en/calculators/",
                templates: "/en/templates/",
                glossary: "/en/glossary/",
                data: "/en/data/",
                sessions: "/en/sessions/"
            },
            pt: {
                simulators: "/pt/simulators/",
                tools: "/pt/calculadoras/",
                templates: "/pt/modelos/",
                glossary: "/pt/glossario/",
                data: "/pt/dados/",
                sessions: "/pt/sessoes/"
            }
        };

        const assessmentLinks = {
            en: {
                financialSnapshot: "https://forms.gle/krYTH3FLmy3mat2h7",
                riskRelationship: "https://forms.gle/RvyqqxLazobUWuM58"
            },
            es: {
                financialSnapshot: "https://forms.gle/JBNEUfAsCptJW8k47",
                riskRelationship: "https://forms.gle/W3pfmhuaSaAUufu76"
            },
            pt: {
                financialSnapshot: "https://forms.gle/KEb2jmZkK6y74DW68",
                riskRelationship: "https://forms.gle/ZCSbwwdoXVe8GU7j6"
            }
        };

        const templateDownloads = {
            en: {
                monthlyAnalysis: {
                    href: "/assets/templates/en/monthly-balance-analysis.xlsx",
                    filename: "Template Monthly Balance Analysis.xlsx"
                },
                expenseManagement: {
                    href: "/assets/templates/en/expense-management.xlsx",
                    filename: "Template Expense Management.xlsx"
                },
                personalBudget: {
                    href: "/assets/templates/en/personal-budget.xlsx",
                    filename: "Template Personal Budget.xlsx"
                }
            },
            es: {
                monthlyAnalysis: {
                    href: "/assets/templates/es/analisis-balance-mensual.xlsx",
                    filename: "Plantilla de Analisis del Balance Mensual.xlsx"
                },
                expenseManagement: {
                    href: "/assets/templates/es/gestion-de-gastos.xlsx",
                    filename: "Plantilla de Gestion de Gastos.xlsx"
                },
                personalBudget: {
                    href: "/assets/templates/es/presupuesto-personal.xlsx",
                    filename: "Plantilla de Presupuesto Personal.xlsx"
                }
            },
            pt: {
                monthlyAnalysis: {
                    href: "/assets/templates/pt/analise-balanco-mensal.xlsx",
                    filename: "Modelo de Analise Balanco Mensal.xlsx"
                },
                expenseManagement: {
                    href: "/assets/templates/pt/gestao-de-despesas.xlsx",
                    filename: "Modelo de Gestao de Despesas.xlsx"
                },
                personalBudget: {
                    href: "/assets/templates/pt/orcamento-pessoal.xlsx",
                    filename: "Modelo de Orcamento Pessoal.xlsx"
                }
            }
        };

        function getSiteOrigin() {
            return productionOrigin;
        }

        // Spanish keeps the apex URL, so the address the site has always been
        // linked from stays the canonical one. Every other language gets a real
        // directory that serves only that language.
        function languagePath(lang) {
            return lang === "es" ? "/" : `/${lang}/`;
        }

        // The cookie the language-preference edge function reads before deciding
        // whether to redirect someone who lands on the apex. localStorage is the
        // wrong place for it: the decision is made at the edge, before any script
        // on the page has run, so it has to be something that travels with the
        // request. The two stores answer different questions and both are kept -
        // localStorage is what this script restores a preference from, the cookie
        // is what stops the edge overruling a choice already made here.
        //
        // Its presence matters more than its value: once it is set, the edge
        // stops negotiating and serves the apex as published. So writing it is
        // how an explicit choice - including the choice to stay in Spanish - is
        // made to stick.
        function rememberLanguageAtEdge(lang) {
            try {
                const secure = window.location.protocol === "https:" ? "; Secure" : "";
                document.cookie = `lang=${encodeURIComponent(lang)}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
            } catch (error) {
                console.warn("Language preference could not be saved to a cookie.", error);
            }
        }

        function hasLanguageCookie() {
            return /(?:^|;\s*)lang=/.test(document.cookie || "");
        }

        // One deliberate choice, written to both stores at once. localStorage is
        // what this script restores a preference from; the cookie is what the
        // edge function reads before it decides whether to negotiate the apex at
        // all. Anything that lets a reader pick a language goes through here, so
        // that "explicit choice wins" is one rule rather than three copies of it.
        function rememberLanguage(lang) {
            try {
                localStorage.setItem("preferredLanguage", lang);
            } catch (error) {
                console.warn("Language preference could not be saved to localStorage.", error);
            }
            rememberLanguageAtEdge(lang);
        }

        // The section the reader is actually looking at, or "" for the top of the
        // page.
        //
        // location.hash answers it whenever they got there through the
        // navigation, which pushes "#section" as it scrolls. When they simply
        // scrolled the page themselves the hash is empty and the scroll spy is
        // the only thing that knows, so its aria-current marker is the fallback.
        function currentSectionId() {
            const fromHash = decodeURIComponent(window.location.hash.slice(1));
            if (fromHash && document.getElementById(fromHash)) return fromHash;

            const spied = document.querySelector('[data-section][aria-current="location"]');
            const spiedSection = spied?.dataset.section;
            return spiedSection && document.getElementById(spiedSection) ? spiedSection : "";
        }

        // Where a language switch should land. Changing language is a navigation
        // to a different document, so the reader's place in the page has to be
        // carried over deliberately or they are dropped back at the hero of the
        // translation and have to find their way down again.
        //
        // The three documents are generated from one template, so a section has
        // the same id in all of them and the fragment travels unchanged.
        function languageHref(lang) {
            const sectionId = currentSectionId();
            return sectionId ? `${languagePath(lang)}#${sectionId}` : languagePath(lang);
        }

        function getLanguageUrl(lang) {
            return `${getSiteOrigin()}${languagePath(lang)}`;
        }

        // Canonical URLs follow the address that was actually requested, never the
        // language the visitor's browser happens to prefer. Googlebot crawls with
        // its own locale, so deriving the canonical from detection made "/" point
        // at "/?lang=en" and dropped the primary URL out of the index.
        function getUrlLanguage() {
            if (isPrerenderedPage) return pinnedLanguage;
            const urlLanguage = new URLSearchParams(window.location.search).get("lang")?.toLowerCase();
            return supportedLanguages.includes(urlLanguage) ? urlLanguage : "es";
        }

        let canonicalLanguage = getUrlLanguage();

        function updateLanguageMetadata(lang) {
            // A pre-rendered page was built with the right head already in it.
            if (isPrerenderedPage) return;

            const localizedUrl = getLanguageUrl(canonicalLanguage);
            const baseUrl = `${getSiteOrigin()}/`;

            document.title = pageTitles[lang];
            document.getElementById("meta-description").content = pageDescriptions[lang];
            document.getElementById("canonical-link").href = localizedUrl;
            document.getElementById("og-title").content = pageTitles[lang];
            document.getElementById("og-description").content = pageDescriptions[lang];
            document.getElementById("og-url").content = localizedUrl;
            document.getElementById("og-locale").content = openGraphLocales[lang];
            document.getElementById("twitter-title").content = pageTitles[lang];
            document.getElementById("twitter-description").content = pageDescriptions[lang];

            supportedLanguages.forEach(language => {
                document.getElementById(`alternate-${language}`).href = getLanguageUrl(language);
            });
            document.getElementById("alternate-default").href = baseUrl;
        }

        function detectInitialLanguage() {
            if (isPrerenderedPage) return pinnedLanguage;

            const urlLanguage = new URLSearchParams(window.location.search).get("lang")?.toLowerCase();
            if (supportedLanguages.includes(urlLanguage)) {
                return urlLanguage;
            }

            try {
                const savedLanguage = localStorage.getItem("preferredLanguage")?.toLowerCase();
                if (supportedLanguages.includes(savedLanguage)) {
                    return savedLanguage;
                }
            } catch (error) {
                console.warn("Language preference could not be read from localStorage.", error);
            }

            const browserLanguage = (navigator.language || "").toLowerCase().split("-")[0];
            return supportedLanguages.includes(browserLanguage) ? browserLanguage : "es";
        }

        function setLanguage(lang, updateUrl = true) {
            const normalizedLanguage = supportedLanguages.includes(lang) ? lang : "es";

            // A pre-rendered page only contains its own language, so an explicit
            // switch is a navigation to that language's URL rather than a class
            // swap - and it keeps the reader's place in the page rather than
            // restarting them at the top of the translation.
            if (isPrerenderedPage && updateUrl && normalizedLanguage !== pinnedLanguage) {
                rememberLanguage(normalizedLanguage);
                window.location.href = languageHref(normalizedLanguage);
                return;
            }

            document.body.classList.remove(...supportedLanguages.map(language => `lang-${language}`));
            document.body.classList.add('lang-' + normalizedLanguage);
            document.documentElement.lang = normalizedLanguage;
            // Only an explicit switch changes the address, and therefore the canonical.
            if (updateUrl) canonicalLanguage = normalizedLanguage;
            updateLanguageMetadata(normalizedLanguage);

            try {
                localStorage.setItem("preferredLanguage", normalizedLanguage);
            } catch (error) {
                console.warn("Language preference could not be saved to localStorage.", error);
            }
            if (updateUrl) rememberLanguageAtEdge(normalizedLanguage);

            if (updateUrl && !isPrerenderedPage) {
                const url = new URL(window.location.href);
                if (normalizedLanguage === "es") {
                    url.searchParams.delete("lang");
                } else {
                    url.searchParams.set("lang", normalizedLanguage);
                }
                window.history.replaceState({ lang: normalizedLanguage }, "", url);
            }
            
            document.querySelectorAll('.lang-btn').forEach(btn => {
                btn.classList.remove('active');
                btn.removeAttribute('aria-current');
            });

            const activeBtn = document.getElementById('btn-' + normalizedLanguage);
            if (activeBtn) {
                activeBtn.classList.add('active');
                activeBtn.setAttribute('aria-current', 'page');
            }

            document.querySelectorAll('[data-newsletter-link]').forEach(link => {
                link.href = newsletterLinks[normalizedLanguage];
            });

            document.querySelectorAll('[data-blog-link]').forEach(link => {
                link.href = `/${normalizedLanguage}/blog/`;
            });

            // The nav items that are pages rather than sections of this one.
            // On a pre-rendered document this re-asserts the href the build
            // already wrote; it earns its keep when the template is opened
            // directly and on the ?lang= apex, where the language is switched
            // without a navigation.
            document.querySelectorAll('[data-section-link]').forEach(link => {
                const target = sectionLinks[normalizedLanguage][link.dataset.sectionLink];
                if (target) link.href = target;
            });

            document.querySelectorAll('[data-assessment-link]').forEach(link => {
                link.href = assessmentLinks[normalizedLanguage][link.dataset.assessmentLink];
            });

            document.querySelectorAll('[data-template-download]').forEach(link => {
                const template = templateDownloads[normalizedLanguage][link.dataset.templateDownload];
                link.href = template.href;
                if (template.filename) {
                    link.download = template.filename;
                } else {
                    link.removeAttribute('download');
                }
            });

            const navigationLabels = {
                es: { open: 'Abrir menú de navegación', close: 'Cerrar menú de navegación', mobile: 'Navegación móvil' },
                en: { open: 'Open navigation menu', close: 'Close navigation menu', mobile: 'Mobile navigation' },
                pt: { open: 'Abrir menu de navegação', close: 'Fechar menu de navegação', mobile: 'Navegação móvel' }
            }[normalizedLanguage];
            const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
            const mobileMenuDrawer = document.querySelector('.mobile-menu__drawer');
            const mobileMenuBackdrop = document.querySelector('[data-mobile-menu-close]');
            mobileMenuToggle?.setAttribute('aria-label', mobileMenuToggle.getAttribute('aria-expanded') === 'true' ? navigationLabels.close : navigationLabels.open);
            mobileMenuDrawer?.setAttribute('aria-label', navigationLabels.mobile);
            mobileMenuBackdrop?.setAttribute('aria-label', navigationLabels.close);

            if (!hasExplicitCurrencyPreference) {
                selectedCurrency = normalizedLanguage === "en" ? "USD" : "EUR";
            }

            const currencySelect = document.getElementById("calculator-currency");
            if (currencySelect) {
                currencySelect.value = selectedCurrency;
            }

            // Sync Placeholders
            const p = inputPlaceholders[normalizedLanguage];
            if (p) {
                const nameField = document.getElementById('form-name');
                const emailField = document.getElementById('form-email');
                const messageField = document.getElementById('form-message');
                if (nameField) nameField.placeholder = p.name;
                if (emailField) emailField.placeholder = p.email;
                if (messageField) messageField.placeholder = p.message;
            }

            // Submit button label. The three labels are lang-content spans, so a
            // pre-rendered page only contains its own: dereferencing the other
            // two threw here and killed every initializer that runs after
            // setLanguage — the calculator tabs, the navigation menus, the
            // external-link notices and the scroll spy all stayed unbound.
            const submitLabels = {
                es: document.getElementById('submit-text'),
                en: document.getElementById('submit-text-en'),
                pt: document.getElementById('submit-text-pt')
            };

            Object.entries(submitLabels).forEach(([code, label]) => {
                if (label) label.classList.toggle('hidden', code !== normalizedLanguage);
            });

            // Recalculate calculators to adapt currency visual formatting if necessary
            calculateCompoundInterest();
            calculateFreedom();
            calculateLifeCost();
        }

        function setCalculatorCurrency(currency) {
            if (!supportedCurrencies.includes(currency)) {
                return;
            }

            selectedCurrency = currency;
            hasExplicitCurrencyPreference = true;

            try {
                localStorage.setItem("preferredCalculatorCurrency", currency);
            } catch (error) {
                console.warn("Currency preference could not be saved to localStorage.", error);
            }

            calculateCompoundInterest();
            calculateFreedom();
            calculateLifeCost();
        }

        // TAB SWITCHER
        const calculatorTabs = ['compound', 'freedom', 'life-cost'];
        const calculatorRecalculators = {
            compound: () => calculateCompoundInterest(),
            freedom: () => calculateFreedom(),
            'life-cost': () => calculateLifeCost()
        };

        function switchTab(tabId, moveFocus = false) {
            if (!calculatorTabs.includes(tabId)) return;

            calculatorTabs.forEach(id => {
                const button = document.getElementById(`tab-btn-${id}`);
                const panel = document.getElementById(`panel-${id}`);
                const isSelected = id === tabId;

                button.classList.toggle('active', isSelected);
                // Roving tabindex: only the selected tab is in the tab order,
                // so Tab enters and leaves the tablist as one stop.
                button.setAttribute('aria-selected', isSelected ? 'true' : 'false');
                button.setAttribute('tabindex', isSelected ? '0' : '-1');
                panel.classList.toggle('hidden', !isSelected);
            });

            calculatorRecalculators[tabId]();

            if (moveFocus) document.getElementById(`tab-btn-${tabId}`).focus();
        }

        function initializeCalculatorTabs() {
            const tablist = document.querySelector('[role="tablist"][aria-labelledby="calculators-heading"]');
            if (!tablist) return;

            const tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));

            tabs.forEach((tab, index) => {
                tab.addEventListener('click', () => switchTab(tab.dataset.tab));

                tab.addEventListener('keydown', event => {
                    let nextIndex = null;
                    if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
                    else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
                    else if (event.key === 'Home') nextIndex = 0;
                    else if (event.key === 'End') nextIndex = tabs.length - 1;
                    if (nextIndex === null) return;

                    event.preventDefault();
                    switchTab(tabs[nextIndex].dataset.tab, true);
                });
            });
        }

        // COMPOUND INTEREST CALCULATOR ENGINE
        const yearsUnitLabels = {
            es: value => `${value} ${Number(value) === 1 ? 'año' : 'años'}`,
            en: value => `${value} ${Number(value) === 1 ? 'year' : 'years'}`,
            pt: value => `${value} ${Number(value) === 1 ? 'ano' : 'anos'}`
        };

        function syncYearsRangeToInput(val) {
            document.getElementById('calc-years-display').textContent = val;
            // A bare slider announces "25" with no unit. aria-valuetext supplies
            // the human reading (WCAG SC 1.3.1 / 4.1.2).
            const slider = document.getElementById('calc-years-range');
            if (slider) slider.setAttribute('aria-valuetext', yearsUnitLabels[currentLanguage()](val));
            calculateCompoundInterest();
        }

        function calculateCompoundInterest() {
            const initial = parseFloat(document.getElementById('calc-initial').value) || 0;
            const monthly = parseFloat(document.getElementById('calc-monthly').value) || 0;
            const years = parseInt(document.getElementById('calc-years-range').value) || 0;
            const rateVal = parseFloat(document.getElementById('calc-rate').value) || 0;

            const monthlyRate = (rateVal / 100) / 12;
            const totalMonths = years * 12;

            let totalInvested = initial + (monthly * totalMonths);
            let totalCompounded = initial;

            for (let i = 0; i < totalMonths; i++) {
                totalCompounded = (totalCompounded * (1 + monthlyRate)) + monthly;
            }

            const interestEarned = totalCompounded - totalInvested;

            document.getElementById('result-total').textContent = formatCurrency(totalCompounded);
            document.getElementById('result-invested').textContent = formatCurrency(totalInvested);
            document.getElementById('result-interest').textContent = formatCurrency(Math.max(0, interestEarned));

            const displayedInterest = Math.max(0, interestEarned);
            const ratioTotal = Math.max(0, totalInvested) + displayedInterest;
            const investedRatio = ratioTotal > 0 ? Math.max(0, totalInvested) / ratioTotal : 1;
            const earnedRatio = ratioTotal > 0 ? displayedInterest / ratioTotal : 0;
            const investedPercent = Math.round(investedRatio * 100);
            const earnedPercent = 100 - investedPercent;
            const ratioElement = document.getElementById('compound-ratio');

            ratioElement.style.setProperty('--invested-ratio', investedRatio.toFixed(4));
            ratioElement.style.setProperty('--earned-ratio', earnedRatio.toFixed(4));
            document.getElementById('ratio-invested-percent').textContent = `${investedPercent}%`;
            document.getElementById('ratio-earned-percent').textContent = `${earnedPercent}%`;

            const ratioLabels = document.body.classList.contains('lang-en')
                ? [`Total invested: ${investedPercent}%.`, `Compound earned: ${earnedPercent}%.`]
                : document.body.classList.contains('lang-pt')
                    ? [`Total guardado: ${investedPercent}%.`, `Juros gerados: ${earnedPercent}%.`]
                    : [`Total ahorrado: ${investedPercent}%.`, `Intereses generados: ${earnedPercent}%.`];

            ratioElement.setAttribute('aria-label', ratioLabels.join(' '));
        }

        // FINANCIAL FREEDOM CALCULATOR ENGINE
        function calculateFreedom() {
            const currentAge = parseInt(document.getElementById('freedom-current-age').value) || 0;
            const targetAge = parseInt(document.getElementById('freedom-target-age').value) || 0;
            const desiredIncome = parseFloat(document.getElementById('freedom-desired-income').value) || 0;

            // Years remaining to compound
            let yearsRemaining = targetAge - currentAge;
            if (yearsRemaining < 0) yearsRemaining = 0;

            // Target Fund based on the 4% Rule (Rule of 300)
            // Desired Monthly Pension * 12 / 0.04 = Desired Monthly Pension * 300
            const targetFund = desiredIncome * 300;

            // Monthly Saving estimate using a standard inflation-adjusted return of 8%
            // PMT = FV * r / ((1 + r)^n - 1)
            const annualRate = 0.08;
            const monthlyRate = annualRate / 12;
            const totalMonths = yearsRemaining * 12;
            
            let monthlySavingEstimate = 0;
            if (totalMonths > 0) {
                monthlySavingEstimate = (targetFund * monthlyRate) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
            } else {
                monthlySavingEstimate = targetFund; // Instant retirement needed!
            }

            const monthlySuffix = document.body.classList.contains('lang-en')
                ? "/month"
                : document.body.classList.contains('lang-pt') ? "/mês" : "/mes";

            document.getElementById('freedom-result-target').textContent = formatCurrency(targetFund);
            document.getElementById('freedom-result-years').textContent = yearsRemaining;
            document.getElementById('freedom-result-savings').textContent = formatCurrency(monthlySavingEstimate) + monthlySuffix;
        }

        // LIFE COST CALCULATOR ENGINE
        function calculateLifeCost() {
            const monthlySalary = parseFloat(document.getElementById('life-monthly-salary').value) || 0;
            const monthlyHours = parseFloat(document.getElementById('life-monthly-hours').value) || 0;
            const purchaseCost = Math.max(0, parseFloat(document.getElementById('life-purchase-cost').value) || 0);
            const hasValidRate = monthlySalary > 0 && monthlyHours > 0;
            const hourlyRate = hasValidRate ? monthlySalary / monthlyHours : 0;
            const lifeHours = hourlyRate > 0 ? purchaseCost / hourlyRate : 0;
            const language = document.body.classList.contains('lang-en')
                ? 'en'
                : document.body.classList.contains('lang-pt') ? 'pt' : 'es';
            const locale = language === 'en' ? 'en-US' : language === 'pt' ? 'pt-PT' : 'es-ES';

            document.getElementById('life-result-hourly-rate').textContent = formatCurrency(hourlyRate);
            document.getElementById('life-result-hours').textContent = lifeHours.toLocaleString(locale, {
                minimumFractionDigits: lifeHours > 0 && lifeHours < 10 ? 1 : 0,
                maximumFractionDigits: 1
            });
            document.getElementById('life-cost-warning').classList.toggle('hidden', hasValidRate);
        }

        function formatCurrency(amount) {
            const locale = document.body.classList.contains('lang-en')
                ? 'en-US'
                : document.body.classList.contains('lang-pt') ? 'pt-PT' : 'es-ES';

            return amount.toLocaleString(locale, {
                style: 'currency',
                currency: selectedCurrency || (locale === 'en-US' ? 'USD' : 'EUR')
            });
        }

        // NETLIFY FORMS AJAX SUBMISSION
        // Localized form copy. `subject` is also read at build time by
        // scripts/generate-home-pages.mjs, which stamps it into the hidden
        // Netlify Forms field so the notification email is not always Spanish.
        const formCopy = {
            es: {
                subject: "Nuevo contacto - Compounding Journey",
                nameRequired: "Escribe tu nombre completo.",
                emailRequired: "Escribe tu correo electrónico.",
                emailInvalid: "Ese correo electrónico no parece válido. Revisa el formato, por ejemplo nombre@dominio.com.",
                messageRequired: "Cuéntanos en qué te podemos ayudar.",
                sending: "Enviando tu mensaje…",
                sent: "Mensaje enviado correctamente.",
                failed: "Hubo un problema al enviar tu mensaje. Por favor, inténtalo de nuevo."
            },
            en: {
                subject: "New contact - Compounding Journey",
                nameRequired: "Enter your full name.",
                emailRequired: "Enter your email address.",
                emailInvalid: "That email address does not look valid. Check the format, for example name@domain.com.",
                messageRequired: "Tell us how we can help you.",
                sending: "Sending your message…",
                sent: "Message sent successfully.",
                failed: "There was a problem sending your message. Please try again."
            },
            pt: {
                subject: "Novo contacto - Compounding Journey",
                nameRequired: "Escreve o teu nome completo.",
                emailRequired: "Escreve o teu e-mail.",
                emailInvalid: "Esse e-mail não parece válido. Verifica o formato, por exemplo nome@dominio.com.",
                messageRequired: "Conta-nos como te podemos ajudar.",
                sending: "A enviar a tua mensagem…",
                sent: "Mensagem enviada com sucesso.",
                failed: "Ocorreu um problema ao enviar a tua mensagem. Por favor, tenta novamente."
            }
        };

        function currentLanguage() {
            if (document.body.classList.contains('lang-en')) return 'en';
            if (document.body.classList.contains('lang-pt')) return 'pt';
            return 'es';
        }

        /* ===================================================================
           THE HANDOFF FROM A SIMULATOR RESULT
           ===================================================================

           A simulator can route a visitor here instead of to one of the Google
           Forms - see assets/js/sim-cta.js, which does it for the outcomes where
           a long questionnaire is the wrong response to what just happened: a
           retirement plan that ran out of money, or one that only works if the
           visitor lives a life they would not choose.

           Somebody arriving that way has already read a paragraph about their
           own numbers. Asking them to summarise it again, from memory, into an
           empty textarea is how a warm moment becomes a blank page - so the
           result is carried across and the message arrives already written: what
           they ran, what it said, and that they would like to talk about it.
           Sending it untouched is a complete request.

           The numbers travel in sessionStorage rather than in the URL. They are
           a stranger's finances, and a link carrying them is a link that gets
           pasted into a chat window or logged by whatever sits in front of the
           site. `?from=simulator` is the only thing in the address bar, and it
           is removed once it has been acted on. */
        const simulatorHandoffCopy = {
            es: {
                subject: 'Resultado del simulador',
                intro: 'Acabo de hacer el simulador {simulator} y este es el resultado que me ha salido. Me gustaría comentarlo contigo.',
                introGeneric: 'Acabo de hacer uno de los simuladores de la web y este es el resultado que me ha salido. Me gustaría comentarlo contigo.',
                resultLabel: 'Mi resultado',
                names: {
                    'simulator-hub': 'Decisiones financieras',
                    'freedom-calendar': 'Calendario de la Libertad',
                    'market-time-machine': 'Máquina del Tiempo del Mercado',
                    'monte-carlo-fire': 'Vuelo de Supervivencia FIRE',
                    'passive-income-engine': 'Motor de Ingresos Pasivos'
                }
            },
            en: {
                subject: 'Simulator result',
                intro: 'I have just run the {simulator} simulator and this is the result I got. I would like to talk it through with you.',
                introGeneric: 'I have just run one of the simulators on the site and this is the result I got. I would like to talk it through with you.',
                resultLabel: 'My result',
                names: {
                    'simulator-hub': 'Financial Decisions',
                    'freedom-calendar': 'Freedom Calendar',
                    'market-time-machine': 'Market Time Machine',
                    'monte-carlo-fire': 'FIRE Survival Flight',
                    'passive-income-engine': 'Passive Income Engine'
                }
            },
            pt: {
                subject: 'Resultado do simulador',
                intro: 'Acabei de fazer o simulador {simulator} e este é o resultado que me saiu. Gostava de falar sobre isto contigo.',
                introGeneric: 'Acabei de fazer um dos simuladores do site e este é o resultado que me saiu. Gostava de falar sobre isto contigo.',
                resultLabel: 'O meu resultado',
                names: {
                    'simulator-hub': 'Decisões Financeiras',
                    'freedom-calendar': 'Calendário da Liberdade',
                    'market-time-machine': 'Máquina do Tempo do Mercado',
                    'monte-carlo-fire': 'Voo de Sobrevivência FIRE',
                    'passive-income-engine': 'Motor de Rendimento Passivo'
                }
            }
        };

        function readSimulatorContext() {
            try {
                const raw = sessionStorage.getItem('cj:simulator:context');
                if (!raw) return null;
                const context = JSON.parse(raw);
                // Anything could be under that key by the time this runs - a stale
                // entry from an older shape of the panel, or a tab somebody left
                // open across a deploy. A headline is the one field the message
                // cannot be written without.
                if (!context || typeof context.headline !== 'string' || !context.headline) return null;
                return context;
            } catch (error) {
                return null;
            }
        }

        function applySimulatorHandoff() {
            const url = new URL(window.location.href);
            if (url.searchParams.get('from') !== 'simulator') return;

            // Read before the prefill, and clear either way: the marker has been
            // acted on, and leaving it in the address bar means a reload or a
            // shared link rewrites a message the visitor may have since edited.
            const context = readSimulatorContext();
            url.searchParams.delete('from');
            window.history.replaceState(window.history.state, '', url);
            if (!context) return;

            const copy = simulatorHandoffCopy[currentLanguage()];
            const name = (copy.names[context.simulator] || context.simulator || '').trim();
            const messageField = document.getElementById('form-message');
            const subjectField = document.querySelector('#contact-form [name="subject"]');

            // Never overwrite something the visitor has already written. They may
            // have come back to this tab with a message half-typed.
            if (messageField && !messageField.value.trim()) {
                // Sendable as it stands, and that is the requirement. An earlier
                // version opened with "I have just finished the X simulator" and
                // closed with a bare "My question:" - a message that states no
                // reason for writing and then leaves a colon hanging, which asks
                // the visitor to compose the actual request themselves. The
                // opening line now says what happened and what they want, so
                // pressing send without touching it produces something whole.
                // Anything they do add continues from the end.
                const lines = [];
                lines.push(name ? copy.intro.replace('{simulator}', name) : copy.introGeneric);
                lines.push('');
                lines.push(copy.resultLabel + ': ' + context.headline);
                if (context.detail) {
                    lines.push('');
                    lines.push(context.detail);
                }
                messageField.value = lines.join('\n');

                // Cursor at the end rather than focus in the field: they may want
                // to keep writing, but they navigated here, they have not asked to
                // be put inside a textarea.
                messageField.setSelectionRange(messageField.value.length, messageField.value.length);
            }

            // The notification this produces is now distinguishable from a
            // general enquiry at a glance, which is the whole point of routing
            // these outcomes to a person rather than to a form.
            if (subjectField) {
                subjectField.value = copy.subject + (name ? ' - ' + name : '') +
                    (context.outcome ? ' (' + context.outcome + ')' : '');
            }
        }

        function setFieldError(fieldId, message) {
            const field = document.getElementById(fieldId);
            const error = document.getElementById(`${fieldId}-error`);
            if (!field || !error) return;

            if (message) {
                error.textContent = message;
                error.hidden = false;
                field.setAttribute('aria-invalid', 'true');
                field.classList.add('border-[#B3261E]');
                field.classList.remove('border-creamborder');
            } else {
                error.textContent = '';
                error.hidden = true;
                field.removeAttribute('aria-invalid');
                field.classList.remove('border-[#B3261E]');
                field.classList.add('border-creamborder');
            }
        }

        function validateContactForm() {
            const copy = formCopy[currentLanguage()];
            const values = {
                'form-name': document.getElementById('form-name').value.trim(),
                'form-email': document.getElementById('form-email').value.trim(),
                'form-message': document.getElementById('form-message').value.trim()
            };

            const errors = [];
            if (!values['form-name']) errors.push(['form-name', copy.nameRequired]);
            if (!values['form-email']) {
                errors.push(['form-email', copy.emailRequired]);
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values['form-email'])) {
                errors.push(['form-email', copy.emailInvalid]);
            }
            if (!values['form-message']) errors.push(['form-message', copy.messageRequired]);

            ['form-name', 'form-email', 'form-message'].forEach(id => setFieldError(id, null));
            errors.forEach(([id, message]) => setFieldError(id, message));

            const summary = document.getElementById('form-error-summary');
            const list = document.getElementById('form-error-list');
            list.textContent = '';

            if (errors.length === 0) {
                summary.classList.add('hidden');
                return true;
            }

            errors.forEach(([id, message]) => {
                const item = document.createElement('li');
                const link = document.createElement('a');
                link.href = `#${id}`;
                link.className = 'underline font-semibold';
                link.textContent = message;
                link.addEventListener('click', clickEvent => {
                    clickEvent.preventDefault();
                    document.getElementById(id).focus();
                });
                item.appendChild(link);
                list.appendChild(item);
            });

            summary.classList.remove('hidden');
            summary.focus();
            return false;
        }

        // Clear a field's error as soon as the reader fixes it, rather than
        // making them submit again to find out.
        ['form-name', 'form-email', 'form-message'].forEach(id => {
            const field = document.getElementById(id);
            if (!field) return;
            field.addEventListener('input', () => {
                if (field.getAttribute('aria-invalid') === 'true') setFieldError(id, null);
            });
        });

        let contactSubmitInFlight = false;

        async function handleFormSubmit(event) {
            event.preventDefault();
            if (contactSubmitInFlight) return;
            const form = event.target;
            const submitBtn = document.getElementById('submit-btn');
            const spinner = document.getElementById('submit-spinner');
            const successCard = document.getElementById('success-card');
            const status = document.getElementById('form-submit-status');
            const copy = formCopy[currentLanguage()];

            if (!validateContactForm()) return;

            // aria-disabled rather than `disabled`: a disabled control is removed
            // from the tab order mid-interaction, which loses the reader's place.
            contactSubmitInFlight = true;
            submitBtn.setAttribute('aria-disabled', 'true');
            submitBtn.setAttribute('aria-busy', 'true');
            spinner.classList.remove('hidden');
            status.textContent = copy.sending;

            const formData = new FormData(form);

            try {
                const response = await fetch("/", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded"
                    },
                    body: new URLSearchParams(formData).toString()
                });

                if (!response.ok) throw new Error("Netlify Forms submission failed");

                status.textContent = copy.sent;
                successCard.classList.remove('hidden');
                successCard.style.opacity = '1';
                form.reset();
                // The success panel covers the form; hide the form from AT and
                // the tab order while it does, then move focus into the panel.
                form.inert = true;
                form.setAttribute('aria-hidden', 'true');
                const heading = successCard.querySelector('h3');
                if (heading) {
                    heading.setAttribute('tabindex', '-1');
                    heading.focus();
                }
            } catch (err) {
                console.error(err);
                status.textContent = copy.failed;
                const summary = document.getElementById('form-error-summary');
                const list = document.getElementById('form-error-list');
                list.textContent = '';
                const item = document.createElement('li');
                item.textContent = copy.failed;
                list.appendChild(item);
                summary.classList.remove('hidden');
                summary.focus();
            } finally {
                contactSubmitInFlight = false;
                submitBtn.removeAttribute('aria-disabled');
                submitBtn.removeAttribute('aria-busy');
                spinner.classList.add('hidden');
            }
        }

        function resetFeedbackCard() {
            const successCard = document.getElementById('success-card');
            const form = document.getElementById('contact-form');
            successCard.classList.add('hidden');
            successCard.style.opacity = '0';
            if (form) {
                form.inert = false;
                form.removeAttribute('aria-hidden');
                const firstField = document.getElementById('form-name');
                if (firstField) firstField.focus();
            }
        }

        // The width at which the pill nav replaces the phone drawer. It is the
        // same number as the two nav media queries in this page's CSS, written
        // twice because a stylesheet breakpoint cannot be read back out of one;
        // the comment above `@media (min-width: 1100px)` is the other half of
        // this pair, and both say so.
        const DESKTOP_NAV_BREAKPOINT = 1100;

        // The apex shortcuts, mapped to the section each one lands on. Every
        // key here is a 301 in _redirects, and this map is what makes arriving
        // through one of them scroll to the right place rather than the top of
        // the page.
        //
        // The nav only links two of them now - /faq and /assessment - because
        // the tools and templates items point at their own pages instead. The
        // other four stay because the redirects stay: they are the URLs older
        // links and search results still use, and the sections they name are all
        // still on this page.
        const siteRoutes = {
            '/pillars': 'pilares',
            '/simulators': 'simulador',
            '/tools': 'herramientas',
            '/templates': 'plantillas',
            '/faq': 'preguntas-frecuentes',
            '/assessment': 'assessment'
        };

        function getActiveLanguage() {
            return supportedLanguages.find(language => document.body.classList.contains(`lang-${language}`)) || 'es';
        }

        // CSS `prefers-reduced-motion` cannot override the `behavior` option
        // passed to scrollIntoView, so the preference is read in script too.
        const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

        function motionBehavior(preferred = 'smooth') {
            return reducedMotionQuery.matches ? 'auto' : preferred;
        }

        function scrollToSiteSection(sectionId, behavior = 'smooth') {
            const section = document.getElementById(sectionId);
            if (!section) return;

            section.scrollIntoView({ behavior: motionBehavior(behavior), block: 'start' });

            // Scrolling alone moves the viewport but leaves keyboard and screen
            // reader focus at the top of the document, so the next Tab lands
            // back in the header. Move focus to the section as well.
            if (!section.hasAttribute('tabindex')) {
                section.setAttribute('tabindex', '-1');
            }
            section.focus({ preventScroll: true });
        }

        function closeDesktopResources() {
            const dropdown = document.querySelector('[data-resources-dropdown]');
            const toggle = dropdown?.querySelector('.desktop-resources-toggle');
            dropdown?.removeAttribute('data-open');
            toggle?.setAttribute('aria-expanded', 'false');
        }

        // The three flags in the header are ordinary links and they stay ordinary
        // links: crawlable, openable in a new tab, and working with no script at
        // all. This adds the two things a plain link cannot do for itself.
        //
        // It records the choice. The edge function negotiates the apex from
        // Accept-Language and stops as soon as it sees the lang cookie - but
        // nothing on a pre-rendered page ever wrote that cookie, because the
        // switcher is markup and setLanguage's explicit branch is only ever
        // reached from script. So a reader on an English browser who chose
        // Spanish arrived at "/", where the edge negotiated all over again and
        // sent them straight back to "/en/". A guess must not outrank a decision,
        // so the decision is written before the navigation starts.
        //
        // And it carries the reader's place in the page across, so changing
        // language reads on from the same section instead of restarting at the
        // hero.
        function initializeLanguageSwitcher() {
            const switchers = [...document.querySelectorAll('[data-lang-switch]')]
                .filter(link => supportedLanguages.includes(link.dataset.langSwitch));
            if (!switchers.length) return;

            // The fragment has to be on the href itself, not applied in a click
            // handler: a middle click, a "copy link address" or Enter on a focused
            // flag would otherwise carry the bare language path and lose the
            // position anyway. So the hrefs are refreshed on the first sign that
            // one of them is about to be used, rather than on every scroll - and
            // they are left exactly as generated until then, which is what a
            // crawler reads.
            const syncHrefs = () => switchers.forEach(link => {
                link.setAttribute('href', languageHref(link.dataset.langSwitch));
            });

            ['pointerdown', 'focusin', 'contextmenu'].forEach(type => {
                document.addEventListener(type, event => {
                    if (event.target?.closest?.('[data-lang-switch]')) syncHrefs();
                }, true);
            });
            window.addEventListener('hashchange', syncHrefs);
            window.addEventListener('popstate', syncHrefs);

            switchers.forEach(link => {
                link.addEventListener('click', () => rememberLanguage(link.dataset.langSwitch));
            });
        }

        function initializeNavigationMenus() {
            const dropdown = document.querySelector('[data-resources-dropdown]');
            const dropdownToggle = dropdown?.querySelector('.desktop-resources-toggle');
            const mobileMenu = document.getElementById('mobile-menu');
            const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
            const mobileResourcesToggle = document.querySelector('.mobile-resources-toggle');
            const mobileResourcesPanel = document.getElementById('mobile-resources-panel');
            let previousBodyOverflow = '';

            const getNavigationLabels = () => ({
                es: { open: 'Abrir menú de navegación', close: 'Cerrar menú de navegación' },
                en: { open: 'Open navigation menu', close: 'Close navigation menu' },
                pt: { open: 'Abrir menu de navegação', close: 'Fechar menu de navegação' }
            }[getActiveLanguage()]);

            const setDesktopResourcesOpen = open => {
                if (!dropdown || !dropdownToggle) return;
                dropdown.toggleAttribute('data-open', open);
                dropdownToggle.setAttribute('aria-expanded', String(open));
            };

            const setMobileResourcesOpen = open => {
                if (!mobileResourcesToggle || !mobileResourcesPanel) return;
                mobileResourcesToggle.setAttribute('aria-expanded', String(open));
                mobileResourcesPanel.hidden = !open;
            };

            // What is made inert while the drawer is open. The drawer declares
            // aria-modal, but that alone does not stop a screen reader's virtual
            // cursor or the Tab key from reaching the page behind it; `inert`
            // does both.
            //
            // The toggle is the one thing behind the drawer that must stay live.
            // It sits in the sticky header, the header paints above the drawer,
            // and its two bars rotate into an X when it is open - so it is the
            // close button, and on a phone it is the only way out of the drawer
            // that reads as one. This used to inert the whole header, which took
            // the toggle with it: the X was still drawn, still labelled "close",
            // and tapping it did nothing at all.
            //
            // So the header is inerted a level at a time instead. Walking from
            // the toggle up to the header and inerting every sibling on the way
            // covers the brand link, the section nav, the language switcher and
            // the publication links, and leaves the toggle and its own ancestors
            // interactive.
            const layersToInert = () => {
                const layers = [document.getElementById('main'), document.querySelector('footer')];
                const header = document.querySelector('header.site-header');

                if (header && mobileMenuToggle && header.contains(mobileMenuToggle)) {
                    for (let node = mobileMenuToggle; node !== header; node = node.parentElement) {
                        for (const sibling of node.parentElement.children) {
                            if (sibling !== node) layers.push(sibling);
                        }
                    }
                } else {
                    layers.push(header);
                }

                return layers.filter(Boolean);
            };

            // Remembered rather than recomputed on close, so exactly what was
            // made inert is what is released again.
            let inertedLayers = [];

            const closeMobileMenu = (restoreFocus = true) => {
                if (!mobileMenu || !mobileMenuToggle || mobileMenu.hidden) return;
                mobileMenu.hidden = true;
                mobileMenuToggle.setAttribute('aria-expanded', 'false');
                mobileMenuToggle.setAttribute('aria-label', getNavigationLabels().open);
                document.body.style.overflow = previousBodyOverflow;
                inertedLayers.forEach(layer => { layer.inert = false; });
                inertedLayers = [];
                setMobileResourcesOpen(false);
                if (restoreFocus) mobileMenuToggle.focus();
            };

            const openMobileMenu = () => {
                if (!mobileMenu || !mobileMenuToggle) return;
                previousBodyOverflow = document.body.style.overflow;
                mobileMenu.hidden = false;
                mobileMenuToggle.setAttribute('aria-expanded', 'true');
                mobileMenuToggle.setAttribute('aria-label', getNavigationLabels().close);
                document.body.style.overflow = 'hidden';
                inertedLayers = layersToInert();
                inertedLayers.forEach(layer => { layer.inert = true; });
                mobileMenu.querySelector('.mobile-nav-link, .mobile-resources-toggle')?.focus();
            };

            dropdownToggle?.addEventListener('click', event => {
                event.stopPropagation();
                setDesktopResourcesOpen(!dropdown.hasAttribute('data-open'));
            });

            dropdown?.addEventListener('pointerenter', () => setDesktopResourcesOpen(true));
            dropdown?.addEventListener('pointerleave', () => setDesktopResourcesOpen(false));
            dropdown?.addEventListener('focusin', () => setDesktopResourcesOpen(true));
            dropdown?.addEventListener('focusout', event => {
                if (!dropdown.contains(event.relatedTarget)) setDesktopResourcesOpen(false);
            });

            mobileMenuToggle?.addEventListener('click', () => {
                if (mobileMenu.hidden) openMobileMenu();
                else closeMobileMenu();
            });
            mobileResourcesToggle?.addEventListener('click', () => {
                setMobileResourcesOpen(mobileResourcesToggle.getAttribute('aria-expanded') !== 'true');
            });
            mobileMenu?.querySelector('[data-mobile-menu-close]')?.addEventListener('click', () => closeMobileMenu());

            document.addEventListener('click', event => {
                if (dropdown && !dropdown.contains(event.target)) closeDesktopResources();
            });

            document.addEventListener('keydown', event => {
                if (event.key === 'Escape') {
                    // Dismissing a menu must return focus to the control that
                    // opened it, or the reader is dropped at the top of the page.
                    if (dropdown?.hasAttribute('data-open') && dropdown.contains(document.activeElement)) {
                        closeDesktopResources();
                        dropdownToggle?.focus();
                        return;
                    }
                    closeDesktopResources();
                    closeMobileMenu();
                    return;
                }

                if (event.key !== 'Tab' || !mobileMenu || mobileMenu.hidden) return;
                // The toggle is part of the cycle, not something Tab escapes to.
                // It is the drawer's close button while the drawer is open, and it
                // sits before the drawer in the document, so it belongs at the
                // front of this list.
                const focusableItems = [mobileMenuToggle, ...mobileMenu.querySelectorAll('a[href], button:not([disabled])')]
                    .filter(element => element && !element.hidden && element.getClientRects().length);
                if (!focusableItems.length) return;
                const firstItem = focusableItems[0];
                const lastItem = focusableItems[focusableItems.length - 1];
                if (event.shiftKey && document.activeElement === firstItem) {
                    event.preventDefault();
                    lastItem.focus();
                } else if (!event.shiftKey && document.activeElement === lastItem) {
                    event.preventDefault();
                    firstItem.focus();
                }
            });

            // The nav used to href="/pillars" and push "/pillars?lang=en" into
            // history. Those paths are apex redirects, so an English reader who
            // middle-clicked the link opened the Spanish page, and every section
            // ended up reachable at two URLs that crawlers had to reconcile.
            // The links that still carry this attribute are plain same-page
            // anchors; this handler only adds the menu-closing and smooth-scroll
            // behaviour on top of them.
            //
            // Most of the nav no longer arrives here. Six of its items used to
            // be sections of this page and four of them are now pages of their
            // own, which are ordinary links: no attribute, no interception, and
            // deliberately so - a real URL should behave like one, including
            // under a middle click, a long press and a "copy link address".
            // What is left is FAQ, Contacto and the Freedom Compass button.
            document.querySelectorAll('[data-site-route]').forEach(link => {
                link.addEventListener('click', event => {
                    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                    const sectionId = link.dataset.section || siteRoutes[link.dataset.siteRoute];
                    if (!sectionId) return;

                    event.preventDefault();
                    window.history.pushState({ lang: getActiveLanguage(), sectionId }, '', `#${sectionId}`);
                    closeDesktopResources();
                    closeMobileMenu(false);
                    scrollToSiteSection(sectionId);
                });
            });

            // The other half of that split: the nav items that are real pages.
            // The click is left completely alone - no preventDefault, no history
            // entry of our own - but the menu it was made in still has to close.
            //
            // The drawer is the reason. While it is open it holds
            // body{overflow:hidden} and marks the rest of the document inert, so
            // a page link tapped inside it and left open means two things go
            // wrong: on a slow connection the reader taps and watches a screen
            // that has not changed, and coming back through bfcache restores the
            // page with the drawer still over it. Closing it first costs nothing
            // if the navigation is instant.
            //
            // Bound by attribute rather than by position in the nav, so the
            // handler also covers the same links in the header and the body,
            // where the menus are already shut and closing them is a no-op.
            document.querySelectorAll('[data-section-link], [data-blog-link]').forEach(link => {
                link.addEventListener('click', event => {
                    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                    closeDesktopResources();
                    closeMobileMenu(false);
                });
            });

            // In-page calls to action — "Contact me", "Open the inquiry form",
            // the contact path links and the footer links — were bare fragment
            // anchors that bypassed this layer entirely: no smooth scroll, no
            // focus move to the destination, and a history entry written by the
            // browser rather than one carrying the active language. Routing them
            // through the same handler makes every in-page link on the site
            // behave identically, whichever language document is being served.
            document.addEventListener('click', event => {
                if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

                const link = event.target.closest('a[href^="#"]');
                if (!link || link.hasAttribute('data-site-route') || link.classList.contains('skip-link')) return;

                const sectionId = decodeURIComponent(link.getAttribute('href').slice(1));
                if (!sectionId || !document.getElementById(sectionId)) return;

                event.preventDefault();
                window.history.pushState({ lang: getActiveLanguage(), sectionId }, '', `#${sectionId}`);
                closeDesktopResources();
                closeMobileMenu(false);
                scrollToSiteSection(sectionId);
            });

            window.addEventListener('resize', () => {
                if (window.innerWidth >= DESKTOP_NAV_BREAKPOINT) closeMobileMenu(false);
            });
        }

        function scrollToCurrentRoute(behavior = 'auto') {
            const sectionId = siteRoutes[window.location.pathname] || window.location.hash.slice(1);
            if (sectionId) scrollToSiteSection(sectionId, behavior);
        }

        function initializeDesktopScrollSpy() {
            const navigationLinks = [...document.querySelectorAll('[data-section]')];
            const sections = [...new Set(navigationLinks
                .map(link => document.getElementById(link.dataset.section))
                .filter(Boolean))];

            if (!navigationLinks.length || !sections.length || !('IntersectionObserver' in window)) {
                return;
            }

            const setActiveLink = sectionId => {
                navigationLinks.forEach(link => {
                    const isActive = link.dataset.section === sectionId;
                    link.classList.toggle('is-active', isActive);

                    if (isActive) {
                        link.setAttribute('aria-current', 'location');
                    } else {
                        link.removeAttribute('aria-current');
                    }
                });
            };

            const visibleSections = new Set();
            const observer = new IntersectionObserver(entries => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        visibleSections.add(entry.target);
                    } else {
                        visibleSections.delete(entry.target);
                    }
                });

                const activeSection = [...visibleSections]
                    .sort((first, second) => (
                        Math.abs(first.getBoundingClientRect().top - 80)
                        - Math.abs(second.getBoundingClientRect().top - 80)
                    ))[0];

                if (activeSection) {
                    setActiveLink(activeSection.id);
                }
            }, {
                rootMargin: '-80px 0px -55% 0px',
                threshold: [0, 0.1, 0.25]
            });

            sections.forEach(section => observer.observe(section));
        }

        window.addEventListener('popstate', function() {
            canonicalLanguage = getUrlLanguage();
            setLanguage(detectInitialLanguage(), false);
            scrollToCurrentRoute();
        });

        // "/" is the Spanish document, and it is also the site's x-default. It
        // used to redirect a visitor whose browser preferred another language,
        // which meant Googlebot — which renders with a US English locale — hit a
        // scripted location.replace() on the one URL that must stay put, and
        // every redirected reader paid for a full 230 KB document they were
        // about to leave. The header switcher already offers /en/ and /pt/ as
        // real crawlable links, so the page suggests rather than decides.
        const languageSuggestion = {
            en: {
                text: "This page is also available in English.",
                cta: "Read in English",
                dismiss: "Dismiss"
            },
            pt: {
                text: "Esta página também está disponível em português.",
                cta: "Ler em português",
                dismiss: "Fechar"
            }
        };

        function suggestPreferredLanguage() {
            if (!isPrerenderedPage || pinnedLanguage !== "es") return;

            // The edge function asks the same question one layer earlier, from
            // Accept-Language rather than navigator.language, and sets the cookie
            // when it has an answer. A visitor carrying that cookie has already
            // been offered their language - by a redirect, or by a choice they
            // made here - so offering it again in a bar is asking twice.
            //
            // The bar is not redundant, though. It is what a visitor sees when
            // the edge deliberately said nothing: no Accept-Language header, or a
            // header that named a language the site does not publish while
            // navigator.language names one it does.
            if (hasLanguageCookie()) return;

            let dismissed = null;
            try {
                dismissed = localStorage.getItem("languageSuggestionDismissed");
            } catch (error) {
                console.warn("Language suggestion state could not be read from localStorage.", error);
            }
            if (dismissed) return;

            const browserLanguage = (navigator.language || "").toLowerCase().split("-")[0];
            const copy = languageSuggestion[browserLanguage];
            if (!copy) return;

            const bar = document.createElement("div");
            bar.className = "language-suggestion";
            bar.setAttribute("role", "region");
            bar.setAttribute("aria-label", copy.text);
            bar.lang = browserLanguage;

            const message = document.createElement("p");
            message.className = "language-suggestion__text";
            message.textContent = copy.text;

            const cta = document.createElement("a");
            cta.className = "language-suggestion__cta";
            cta.hreflang = browserLanguage;
            cta.textContent = copy.cta;
            // Accepting the suggestion is as explicit a choice as using the
            // switcher, so it is recorded the same way and keeps the reader's
            // place in the page the same way. The href is set at the moment of
            // use, because the bar is built on load - before the reader has
            // scrolled anywhere.
            const followSuggestion = () => {
                cta.href = languageHref(browserLanguage);
            };
            cta.href = languagePath(browserLanguage);
            cta.addEventListener("pointerdown", followSuggestion);
            cta.addEventListener("focus", followSuggestion);
            cta.addEventListener("click", () => rememberLanguage(browserLanguage));

            const close = document.createElement("button");
            close.className = "language-suggestion__close";
            close.type = "button";
            close.textContent = copy.dismiss;
            close.addEventListener("click", () => {
                try {
                    localStorage.setItem("languageSuggestionDismissed", "1");
                } catch (error) {
                    console.warn("Language suggestion state could not be saved to localStorage.", error);
                }
                // Dismissing is a choice to stay in Spanish, so it is recorded the
                // same way any other choice is. Without this the bar stays gone but
                // the edge would still be free to redirect the next visit to the
                // apex - the reader would have said no here and been moved anyway.
                rememberLanguageAtEdge("es");
                bar.remove();
            });

            bar.append(message, cta, close);
            // Appended to the end of the body and positioned out of flow, so
            // nothing that has already painted moves.
            document.body.appendChild(bar);
        }

        // A visitor arriving from the retired /?lang=xx address is redirected to
        // this page with the now-meaningless query string still attached. Drop it
        // so the address bar matches the canonical.
        function stripLanguageQuery() {
            if (!isPrerenderedPage) return;
            const url = new URL(window.location.href);
            if (!url.searchParams.has("lang")) return;
            url.searchParams.delete("lang");
            window.history.replaceState(window.history.state, "", url);
        }

        // Links that open a new tab must say so, or the reader loses the Back
        // button with no warning (WCAG 3.2.5 / G201). Applied in script so a new
        // external link cannot ship without the notice.
        const newTabNotice = {
            es: 'se abre en una pestaña nueva',
            en: 'opens in a new tab',
            pt: 'abre num separador novo'
        };

        function annotateExternalLinks() {
            const notice = newTabNotice[currentLanguage()];

            document.querySelectorAll('a[target="_blank"]').forEach(link => {
                if (link.dataset.newTabAnnotated === 'true') return;
                link.dataset.newTabAnnotated = 'true';

                const label = link.getAttribute('aria-label');
                if (label) {
                    link.setAttribute('aria-label', `${label} (${notice})`);
                    return;
                }

                const hint = document.createElement('span');
                hint.className = 'sr-only';
                hint.textContent = ` (${notice})`;
                link.appendChild(hint);
            });
        }

        // --- event wiring ---------------------------------------------------
        //
        // These listeners replace thirteen inline on* attributes that used to sit
        // in the markup. They had to go for two reasons. An inline handler is a
        // script the browser executes from an attribute, so a Content-Security-
        // Policy strict enough to be worth setting has to allow 'unsafe-inline'
        // for as long as one of them exists. And this file is loaded from
        // /assets/js/, not written into the document, so the functions they named
        // are no longer globals the attributes could reach.
        //
        // Each entry is [selector, event, handler]. A missing element is skipped
        // rather than thrown on: the same script serves three generated pages and
        // is loaded with defer, so a section removed from one of them should not
        // take the rest of the page's behaviour down with it.
        function on(selector, event, handler) {
            const element = document.querySelector(selector);
            if (element) element.addEventListener(event, handler);
        }

        ['#calc-initial', '#calc-monthly', '#calc-rate'].forEach((selector) => {
            on(selector, 'input', calculateCompoundInterest);
        });
        on('#calc-years-range', 'input', (event) => syncYearsRangeToInput(event.target.value));
        ['#freedom-current-age', '#freedom-target-age', '#freedom-desired-income'].forEach((selector) => {
            on(selector, 'input', calculateFreedom);
        });
        ['#life-monthly-salary', '#life-monthly-hours', '#life-purchase-cost'].forEach((selector) => {
            on(selector, 'input', calculateLifeCost);
        });
        on('#calculator-currency', 'change', (event) => setCalculatorCurrency(event.target.value));
        on('#contact-form', 'submit', handleFormSubmit);
        on('#feedback-reset', 'click', resetFeedbackCard);

        // The advisor photograph sits on top of an illustrated card that stands in
        // for it. If the photograph never arrives, uncovering the card is the whole
        // fallback. This used to be an inline onerror that set a style property;
        // it is a class now, because a handler in this file cannot be attached
        // before the image starts loading, so it also has to cope with an error
        // that already happened by the time it runs.
        const portrait = document.querySelector('#advisor-portrait');
        if (portrait) {
            const hidePortrait = () => portrait.classList.add('portrait-unavailable');
            portrait.addEventListener('error', hidePortrait);
            if (portrait.complete && portrait.naturalWidth === 0) hidePortrait();
        }

        // Initialize language and calculator values as soon as the page markup is ready.
        // The URL is left untouched here: rewriting "/" to "/?lang=xx" on load would
        // make the canonical depend on the visitor's browser locale.
        stripLanguageQuery();
        setLanguage(detectInitialLanguage(), false);
        // After setLanguage, because the prefilled message has to be written in
        // the language the page has settled on rather than the one it loaded in.
        applySimulatorHandoff();
        initializeNavigationMenus();
        initializeLanguageSwitcher();
        initializeCalculatorTabs();
        annotateExternalLinks();
        initializeDesktopScrollSpy();
        suggestPreferredLanguage();
        requestAnimationFrame(() => scrollToCurrentRoute());
    