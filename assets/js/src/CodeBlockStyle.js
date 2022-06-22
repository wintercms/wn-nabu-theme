/**
 * Sets code block styles.
 *
 * @author Ben Thomson <git@alfreido.com>
 * @copyright Winter CMS
 */
export default class CodeBlockStyle extends Snowboard.Singleton
{
    /**
     * Event listeners.
     *
     * @returns {Object}
     */
    listens() {
        return {
            ready: 'ready',
            darkMode: 'darkModeChanged',
        };
    }

    /**
     * Dependencies.
     *
     * @returns {Array}
     */
     dependencies() {
        return [
            'assetLoader',
            'darkMode',
        ];
    }

    /**
     * Ready handler.
     */
    ready() {
        this.loadStyles();
    }

    /**
     * Switch styles depending on dark mode being changed.
     */
    darkModeChanged() {
        this.loadStyles();
    }

    /**
     * Load styles depending on whether dark mode is enabled or not.
     */
    loadStyles() {
        // Remove previous assets
        document.querySelectorAll('link[rel="stylesheet"]').forEach((element) => {
            if (element.href.endsWith('prism.css') || element.href.endsWith('prism-light.css')) {
                element.remove();
            }
        });

        const assets = {
            css: [
                (this.snowboard.darkMode().isDark())
                    ? this.snowboard.url().to('themes/nabu/assets/css/vendor/prism.css')
                    : this.snowboard.url().to('themes/nabu/assets/css/vendor/prism-light.css')
            ]
        };

        this.snowboard.assetLoader().load(assets);
    }
}
