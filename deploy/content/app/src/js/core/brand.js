// Brand identity (single source of truth for names and chart colors).
// The stylesheet palette lives in src/styles/tailwind.config.js.
const BRAND = {
  name: 'Family Wealth Compass',
  parent: 'Compounding Journey',
  url: 'https://compoundingjourney.com',
  green: '#1E4620',        // Compounding Journey forest green
  greenLight: '#6DB274',   // readable green on dark backgrounds
  gold: '#C59B27',         // Compounding Journey gold
  goldLight: '#E1C05C',
  orange: '#FB923C',       // warnings / target lines
  // "Monte Carlo FIRE" simulator on compoundingjourney.com, one page per language.
  // The /es/ address is taken from the site itself; /pt/ and /en/ follow the same
  // path pattern (the site uses the same English slugs under every language prefix).
  simulatorUrl: {
    es: 'https://compoundingjourney.com/es/simulators/monte-carlo-fire',
    pt: 'https://compoundingjourney.com/pt/simulators/monte-carlo-fire',
    en: 'https://compoundingjourney.com/en/simulators/monte-carlo-fire'
  },
  // "Market Time Machine": custom portfolio vs. 5 benchmark models (60/40, All-Weather,
  // Permanent Portfolio, 100% Stocks, Conservative) through real market history since 1920.
  marketTimeMachineUrl: {
    es: 'https://compoundingjourney.com/es/simulators/market-time-machine',
    pt: 'https://compoundingjourney.com/pt/simulators/market-time-machine',
    en: 'https://compoundingjourney.com/en/simulators/market-time-machine'
  }
};
