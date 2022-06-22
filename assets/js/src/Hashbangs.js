/**
 * Simple hashbang handler.
 *
 * Listens for hashbang changes and goes to the correct location on the page.
 *
 * @author Ben Thomson <git@alfreido.com>
 * @copyright Winter CMS
 */
export default class Hashbangs extends Snowboard.Singleton {
    /**
     * Listeners.
     *
     * @returns {Object}
     */
    listens() {
        return {
            ready: 'ready',
        };
    }

    /**
     * Ready handler.
     *
     * Adds a hashbang listener and moves to the initial position if a hashbang is present on load.
     */
    ready() {
        this.addListener();
        if (window.location.hash) {
            this.scrollToLink();
        }
    }

    addListener() {
        window.addEventListener('hashchange', this.scrollToLink);
    }

    /**
     * Scrolls to position when the hashbang changes.
     */
    scrollToLink() {
        let hash = window.location.hash;
        if (!hash) {
            return;
        }

        if (hash.startsWith('#')) {
            hash = hash.replace(/^#/, '');
        }

        const link = document.getElementById(`content-${hash}`);

        if (link) {
            link.scrollIntoView({
                behavior: 'auto'
            });
        }
    }
}
