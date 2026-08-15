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
            es: "El viaje del Crecimiento Compuesto - Tu mapa hacia la libertad",
            en: "Compounding Journey - Your Map to Freedom",
            pt: "A Jornada de Crescimento Composto - O Teu Mapa para a Liberdade"
        };

        const pageDescriptions = {
            es: "Psicología del dinero, inversión con propósito y herramientas para construir libertad financiera según tus valores.",
            en: "Money psychology, purposeful investing, and practical tools for building financial freedom around your values.",
            pt: "Psicologia do dinheiro, investimento com propósito e ferramentas para construir liberdade financeira segundo os teus valores."
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
                    href: "https://pay.kiwify.com.br/1K9syUk"
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
                    href: "https://pay.kiwify.com.br/RyUPxbu"
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
                    href: "https://pay.kiwify.com.br/cIkE63K"
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
            // switch is a navigation to that language's URL rather than a class swap.
            if (isPrerenderedPage && updateUrl && normalizedLanguage !== pinnedLanguage) {
                try {
                    localStorage.setItem("preferredLanguage", normalizedLanguage);
                } catch (error) {
                    console.warn("Language preference could not be saved to localStorage.", error);
                }
                rememberLanguageAtEdge(normalizedLanguage);
                window.location.href = languagePath(normalizedLanguage);
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

            const backgroundLayers = () => [
                document.querySelector('header.site-header'),
                document.getElementById('main'),
                document.querySelector('footer')
            ].filter(Boolean);

            const closeMobileMenu = (restoreFocus = true) => {
                if (!mobileMenu || !mobileMenuToggle || mobileMenu.hidden) return;
                mobileMenu.hidden = true;
                mobileMenuToggle.setAttribute('aria-expanded', 'false');
                mobileMenuToggle.setAttribute('aria-label', getNavigationLabels().open);
                document.body.style.overflow = previousBodyOverflow;
                backgroundLayers().forEach(layer => { layer.inert = false; });
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
                // The drawer declares aria-modal, but that alone does not stop a
                // screen reader's virtual cursor or the Tab key from reaching the
                // page behind it. `inert` does both.
                backgroundLayers().forEach(layer => { layer.inert = true; });
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
                const focusableItems = [...mobileMenu.querySelectorAll('a[href], button:not([disabled])')]
                    .filter(element => !element.hidden && element.getClientRects().length);
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
            // The links are now plain same-page anchors; this handler only adds
            // the menu-closing and smooth-scroll behaviour on top of them.
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
                if (window.innerWidth >= 1024) closeMobileMenu(false);
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
            cta.href = languagePath(browserLanguage);
            cta.hreflang = browserLanguage;
            cta.textContent = copy.cta;

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
        initializeNavigationMenus();
        initializeCalculatorTabs();
        annotateExternalLinks();
        initializeDesktopScrollSpy();
        suggestPreferredLanguage();
        requestAnimationFrame(() => scrollToCurrentRoute());
    