/**
 * Scroll position handler.
 *
 * Tracks the position and direction of the user scroll in the browser. These details are added to
 * the <html> tag as follows:
 *  - `data-scroll`: The position of the scroll, in pixels.
 *  - `data-direction`: Whether the user is scrolling up or down.
 *
 * @author Ben Thomson <git@alfreido.com>
 * @copyright Winter CMS
 */
export default class ScrollPosition extends Snowboard.Singleton {
    construct() {
        this.lastPos = window.scrollY;
        this.smoothTimer = null;
    }

    listens() {
        return {
            ready: 'ready',
        };
    }

    ready() {
        document.documentElement.dataset.scroll = Math.round(window.scrollY);
        document.documentElement.dataset.direction = (window.scrollY > 0) ? 'down' : 'up';

        document.addEventListener('scroll', () => this.updateScroll(), { passive: true });
    }

    destruct() {
        document.removeEventListener('scroll', () => this.updateScroll(), { passive: true });

        super.destruct();
    }

    updateScroll() {
        if (this.smoothTimer && window.scrollY !== 0) {
            return;
        }

        document.documentElement.dataset.scroll = Math.round(window.scrollY);
        if (this.lastPos === 0 || window.scrollY > (this.lastPos + 40)) {
            document.documentElement.dataset.direction = 'down';
        } else if (window.scrollY < (this.lastPos - 40)) {
            document.documentElement.dataset.direction = 'up';
        }
        this.lastPos = window.scrollY;

        this.smoothTimer = setTimeout(() => {
            this.smoothTimer = null;
        }, 100);
    }
}
