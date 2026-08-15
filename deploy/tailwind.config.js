module.exports = {
    // index.html is generated output: it holds only the Spanish strings, so a
    // rebuild dropped every utility that appears exclusively in the English or
    // Portuguese branches of the template. Scan the trilingual source instead,
    // plus the pages that are authored by hand.
    content: [
        './content/home/index.html',
        './404.html',
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
