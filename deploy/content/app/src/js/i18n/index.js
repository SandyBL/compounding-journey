// The three language dictionaries live in pt.js / es.js / en.js.
const I18N = { pt: I18N_PT, es: I18N_ES, en: I18N_EN };

    function t(key) {
      const lang = state.language || 'pt';
      const dict = I18N[lang] || I18N['pt'];
      return dict[key] || I18N['en'][key] || key;
    }

    // BUGFIX: "Espanha (EUR)" (the Portuguese spelling) was hardcoded everywhere
    // this app shows the fiscal-residence country name, so a Spanish-language
    // user saw Portuguese text regardless of their language choice. "Brasil"
    // and "Portugal" happen to be spelled identically in pt/es, so only Spain
    // actually differed — but this is written as a proper per-language map
    // rather than a one-off patch, so it doesn't quietly regress again if a
    // 4th country/language is added later.
    const COUNTRY_NAMES_BY_LANG = {
      pt: { BR: 'Brasil (BRL)', ES: 'Espanha (EUR)', GL: 'Global' },
      es: { BR: 'Brasil (BRL)', ES: 'España (EUR)', GL: 'Global' },
      en: { BR: 'Brazil (BRL)', ES: 'Spain (EUR)', GL: 'Global' }
    };
    // A member's role is shown translated. New members are stored with an empty role;
    // older profiles stored a Portuguese default ("Titular", "Adulto") and the example
    // profile stored "Titular 1/2". Those known defaults are translated on display;
    // anything the person typed themselves is shown exactly as typed.
    function displayRole(role) {
      const legacy = { 'Titular': 'prtMember', 'Adulto': 'prtMember', 'Titular 1': 'demoRole1', 'Titular 2': 'demoRole2' };
      const r = String(role || '').trim();
      if (!r) return t('prtMember');
      return legacy[r] ? t(legacy[r]) : r;
    }

    function getCountryDisplayName(code) {
      const lang = state.language || 'pt';
      const map = COUNTRY_NAMES_BY_LANG[lang] || COUNTRY_NAMES_BY_LANG.pt;
      // Global has no fixed currency: show the household's chosen base currency.
      if (code === 'GL') return `${map.GL} (${state.baseCurrency || 'USD'})`;
      return map[code] || code;
    }

    function makeTip(text, pos = '') {
      return `<span class="field-tip ${pos}">?<span class="field-tip-content">${text}</span></span>`;
    }

