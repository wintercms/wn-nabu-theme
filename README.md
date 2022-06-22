# Nabu Theme for Winter CMS

![Nabu logo](https://github.com/wintercms/wn-nabu-theme/blob/main/assets/images/theme-preview.png?raw=true)

An elegant theme designed for documentation sites, using the powerful features of the Winter CMS [Docs](https://github.com/wintercms/wn-docs-plugin) and [Search](https://github.com/wintercms/wn-search-plugin) plugins to provide a streamlined documentation browsing experience.

## Requirements

- Winter CMS v1.2 or above, with the following plugins installed:
    - Winter.Docs
    - Winter.Search
- NodeJS v14.0 or above
- NPM v6.0 or above

## Features

- Full integration of the Docs and Search plugin functionality to navigate and display multiple instances of documentation.
- Supports both user and developer Markdown documentation, as well as API documentation generated from PHP projects.
- Displays a light or dark theme depending on the operating system theme, but can be overridden by the user.
- Built entirely with Tailwind, allowing full flexibility of the look and feel of the site.
- AJAX driven navigation and client-side caching ensures documentation loads quick and can be navigated to even quicker.

## Development

This theme has been built using Tailwind for the styling and [Snowboard](https://wintercms.com/docs/snowboard/introduction) for the JavaScript functionality, taking advantage of the [Mix asset compilation](https://wintercms.com/docs/console/asset-compilation) included in Winter CMS. To compile the theme, simply install the necessary libraries required for Mix:

```bash
php artisan mix:install
```

Then, you can compile the theme for production use:

```bash
php artisan mix:compile --production -p theme-nabu
```

You can also set up the theme to watch for changes, recompiling the theme each time a change is made to the stylesheets or templates:

```bash
php artisan mix:watch --production -p theme-nabu
```

By default, this theme is setup to not include the compiled assets in source control, as it is recommended that you include the compilation process above in a build or deployment script. However, if you wish to include the compiled assets in your source control, you may remove the following section from the `.gitignore` definition:

```
# Ignore compiled assets
assets/css/theme.css
assets/js/build/app.js
```
