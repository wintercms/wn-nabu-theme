/**
 * Dark mode handler.
 *
 * This handler will allow control over whether to display the documentation in "dark" mode. This
 * can be determined either by a user choice, or through the operating system's "dark mode"
 * preference.
 *
 * @author Ben Thomson <git@alfreido.com>
 * @copyright Winter CMS
 */
export default class DarkMode extends Snowboard.Singleton
{
    /**
     * Constructor.
     */
    construct() {
        this.userOverridden = this.isDarkModeSaved();
        this.dark = (this.userOverridden)
            ? this.getUserDarkMode()
            : null;
    }

    /**
     * Event listeners.
     *
     * @returns {Object}
     */
    listens() {
        return {
            ready: 'ready',
        };
    }

    /**
     * Ready event handler.
     */
    ready() {
        this.addOsThemeListener();
        this.applyClass();
        this.attachThemeToggles();
    }

    /**
     * Detects if the current OS theme prefers a dark theme.
     *
     * @returns {bool}
     */
    detectOsDarkTheme() {
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return true;
        }

        return false;
    }

    /**
     * Listens to changes from the OS, for systems that have different themes depending on the time of day.
     */
    addOsThemeListener() {
        this.listener = window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
            if (!this.userOverridden) {
                this.dark = event.matches;
                this.applyClass();
            }
        });
    }

    /**
     * Attaches click events to the theme toggles in the settings, and makes the current one active.
     */
    attachThemeToggles() {
        document.querySelectorAll('a[data-theme]').forEach((element) => {
            const theme = element.dataset.theme;

            element.addEventListener('click', (event) => {
                event.preventDefault();
                const toggle = event.target.closest('a[data-theme]');
                const theme = toggle.dataset.theme;

                // Set all theme toggles to inactive
                document.querySelectorAll('a[data-theme]').forEach((element) => {
                    element.classList.add('opacity-30')
                });

                toggle.classList.remove('opacity-30');

                switch (theme) {
                    case 'dark':
                        this.dark = true;
                        localStorage.setItem('darkMode', true);
                        break;
                    case 'light':
                        this.dark = false;
                        localStorage.setItem('darkMode', false);
                        break;
                    case 'system':
                        this.dark = null;
                        localStorage.removeItem('darkMode');
                        break;
                }

                this.applyClass();
            });

            if (
                (this.dark === true && theme === 'dark')
                || (this.dark === false && theme === 'light')
                || (this.dark === null && theme === 'system')
            ) {
                element.classList.remove('opacity-30');
            }
        });
    }

    /**
     * Detects if the user has overridden the dark mode with their own preference.
     *
     * @returns {bool}
     */
    isDarkModeSaved() {
        const value = localStorage.getItem('darkMode');
        return (value !== null);
    }

    /**
     * Returns if we're in dark mode.
     *
     * @returns {bool}
     */
    isDark() {
        return (this.dark === true || (this.dark === null && this.detectOsDarkTheme() === true));
    }

    /**
     * Returns the user dark mode preference.
     *
     * @returns {bool}
     */
     getUserDarkMode() {
        return String(localStorage.getItem('darkMode')) === 'true';
    }

    /**
     * Applies the "dark" class to the <html> element.
     *
     * This method is triggered when dark mode preferences are changed, and will fire off an event
     * to signal a change in mode.
     */
    applyClass() {
        if (this.dark === true) {
            document.documentElement.classList.add('dark');
            this.snowboard.globalEvent('darkMode', true);
        } else if (this.dark === false) {
            document.documentElement.classList.remove('dark');
            this.snowboard.globalEvent('darkMode', false);
        } else if (this.detectOsDarkTheme() === true) {
            document.documentElement.classList.add('dark');
            this.snowboard.globalEvent('darkMode', true);
        } else {
            document.documentElement.classList.remove('dark');
            this.snowboard.globalEvent('darkMode', false);
        }
    }
}
