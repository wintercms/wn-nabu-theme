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
        this.lastPos = document.getElementById('content').scrollTop;
        this.smoothTimer = null;
    }

    listens() {
        return {
            ready: 'ready',
        };
    }

    ready() {
        const scrollY = document.getElementById('content').scrollTop;

        document.documentElement.dataset.scroll = Math.round(scrollY);
        document.documentElement.dataset.direction = (scrollY > 0) ? 'down' : 'up';

        document.getElementById('content').addEventListener('scroll', () => this.updateScroll(), { passive: true });
    }

    destruct() {
        document.getElementById('content').removeEventListener('scroll', () => this.updateScroll(), { passive: true });

        super.destruct();
    }

    updateScroll() {
        const scrollY = document.getElementById('content').scrollTop;

        if (this.smoothTimer && scrollY !== 0) {
            return;
        }

        document.documentElement.dataset.scroll = Math.round(scrollY);
        if (this.lastPos === 0 || scrollY > (this.lastPos + 40)) {
            document.documentElement.dataset.direction = 'down';
        } else if (scrollY < (this.lastPos - 40)) {
            document.documentElement.dataset.direction = 'up';
        }
        this.lastPos = scrollY;

        this.smoothTimer = setTimeout(() => {
            this.smoothTimer = null;
        }, 100);
    }
}
