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
                forestgreen: '#1E4620',
                warmgold: '#C59B27',
                darkbark: '#2A241E',
                creamsoft: '#FAF6ED',
                creamborder: '#EFEAE0',
            },
            fontFamily: {
                sans: ['"Plus Jakarta Sans"', 'sans-serif'],
            },
        },
    },
};
