const mix = require('laravel-mix');

mix.setPublicPath(__dirname);
mix.options({
    terser: {
        extractComments: false,
    },
});

mix
    // Render Tailwind style
    .postCss('assets/css/src/base.css', 'assets/css/theme.css', [
        require('postcss-import'),
        require('tailwindcss/nesting'),
        require('tailwindcss'),
        require('autoprefixer')
    ])

    // Render JavaScript
    .js([
        'assets/js/vendor/prism.js',
        'assets/js/vendor/prism-treeview.js',
        'assets/js/app.js',
    ], 'assets/js/build/app.js');
