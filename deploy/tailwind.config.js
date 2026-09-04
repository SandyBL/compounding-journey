module.exports = {
    // index.html is generated output: it holds only the Spanish strings, so
    // scanning it alone would drop every utility that appears exclusively in the
    // English or Portuguese branches of the template. The trilingual source is
    // the authoritative entry; the generated pages are listed after it so a
    // hand-edit to one of them is still covered. The simulator templates are
    // listed for the same reason: their per-language text lives in .i18n.json
    // sidecars, and a class name can appear inside a translated string.
    content: [
        './content/home/index.html',
        './content/simulators/*.html',
        './content/simulators/*.i18n.json',
        './404.html',
        './index.html',
        './{en,es,pt}/**/*.html',
        './assets/js/**/*.js',
    ],
    theme: {
        extend: {
            colors: {
                // The five names the home page and the journal are built from.
                forestgreen: '#1E4620',
                warmgold: '#C59B27',
                darkbark: '#2A241E',
                creamsoft: '#FAF6ED',
                creamborder: '#EFEAE0',

                // The scales the simulators use, named here so that the value of
                // a token exists in one place.
                //
                // These were not invented for this config. Each of the four
                // precompiled simulator bundles carried its own copy of them,
                // and the copies disagreed: `cream-100` compiled to
                // rgb(248 244 237) in two bundles and rgb(247 244 238) in the
                // other two, `espresso-800` to rgb(58 39 25) and rgb(66 44 29),
                // `gold-400` to #E5B84C and #E5B842. Nobody chose any of those
                // pairs - they are what four separately-authored configs
                // happened to contain. The values below are the ones that agree
                // with the brand tokens above: cream-100 IS creamsoft,
                // cream-300 IS creamborder, forest-800 IS forestgreen,
                // gold-500 IS warmgold, espresso-900 IS darkbark.
                //
                // assets/css/sim-system.css restates them as custom properties
                // and redefines the utilities the bundles compiled, which is
                // what actually collapses the drift on the published pages. It
                // is the same list; this is where it is decided.
                cream: {
                    50: '#FFFDF8',
                    100: '#FAF6ED',
                    200: '#F4EFE4',
                    300: '#EFEAE0',
                    400: '#DED7C9',
                },
                espresso: {
                    800: '#574838',
                    900: '#2A241E',
                    950: '#1F1913',
                },
                forest: {
                    700: '#28563C',
                    800: '#1E4620',
                    900: '#173719',
                },
                // Gold is a fill, a border and an icon colour. #C59B27 is 2.4:1
                // on cream, so it is not a text colour; gold-700 is the cut that
                // is, and is the same value a11y.css calls --gold-text.
                gold: {
                    400: '#E0B95C',
                    500: '#C59B27',
                    600: '#B08A22',
                    700: '#7A5F12',
                },
            },
            fontFamily: {
                // One typeface. The simulators used to add Inter, Playfair
                // Display, Merriweather and Orbitron between them, so `serif`
                // resolves here too rather than to a stack no page wants.
                sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
                serif: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
            },
        },
    },
};
