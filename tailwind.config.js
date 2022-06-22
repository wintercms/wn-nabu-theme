const colors = require('tailwindcss/colors');

module.exports = {
    content: [
        './layouts/**/*.htm',
        './pages/**/*.htm',
        './partials/**/*.htm',
        './views/api-doc.htm',
        './content/static-pages/**/*.htm',
    ],
    darkMode: 'class',
    theme: {
        boxShadow: {
            cta: '0 20px 15px -15px rgba(16, 49, 65, 0.15)',
            button: '0 10px 20px -10px rgba(47, 46, 45, 0.25)',
        },
        colors: {
            transparent: 'transparent',
            current: 'currentColor',
            white: colors.white,
            grey: colors.slate,
            navy: {
                darker: '#051016',
                dark: '#081821',
                DEFAULT: '#103141',
                light: '#184962',
            },
            blue: {
                dark: '#227F96',
                DEFAULT: '#2DA7C7',
                light: '#48B9D5',
            },
            sky: {
                dark: '#88C9E7',
                DEFAULT: '#B1DBEF',
                light: '#DDF0F8',
            },
            orange: {
                dark: '#AB5421',
                DEFAULT: '#D66829',
                light: '#DE8754',
            },
            green: {
                dark: '#52A838',
                DEFAULT: '#6CC551',
                light: '#8BD175',
            }
        },
        container: {
            center: true,
        },
        fontSize: {
            base: ['15.5px', '26px'],
            'base-mobile': ['14.5px', '23px'],
            'top-nav': ['13px', '18px'],
            'main-nav': ['18px', '24px'],
            heading: ['56px', '62px'],
            h1: ['44px', '48px'],
            h2: ['36px', '40px'],
            h3: ['28px', '34px'],
            h4: ['22px', '26px'],
            h5: ['18px', '24px'],
            h6: ['16px', '22px'],
            caption: ['14px', '22px'],
            'caption-mobile': ['13px', '20px'],
            disclaimer: ['13px', '20px'],
            'disclaimer-mobile': ['12px', '18px'],
            code: ['16px', '24px'],
            'code-mobile': ['15px', '22px'],
        },
        fontFamily: {
            standard: ['Inter', 'sans-serif'],
            heading: ['Yantramanav', 'sans-serif'],
            code: ['Cousine', 'monospace'],
        },
        extend: {},
        letterSpacing: {
            tighter: '-.5px',
            tight: '-.25px',
            normal: '0',
            wide: '.25px',
            wider: '.5px',
        },
    },
    plugins: [
        require('tailwind-scrollbar'),
    ],
}
