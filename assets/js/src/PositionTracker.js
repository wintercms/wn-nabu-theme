/**
 * Position tracker.
 *
 * Tracks the position of the user in the documentation and updates the table of contents to
 * indicate position.
 *
 * @author Ben Thomson <git@alfreido.com>
 * @copyright Winter CMS
 */
export default class PositionTracker extends Snowboard.Singleton {
    /**
     * Constructor.
     */
    construct() {
        this.anchorPositions = {};
    }

    /**
     * Listeners.
     *
     * @returns {Object}
     */
    listens() {
        return {
            ready: 'ready',
            ajaxUpdateComplete: 'ajaxUpdateComplete',
        };
    }

    /**
     * Ready handler.
     */
    ready() {
        document.querySelector('#content').addEventListener('scroll', () => this.checkPosition(), {
            passive: true
        });
        this.checkPosition();
    }

    /**
     * AJAX Update Complete handler.
     *
     * Reset anchors and re-check position.
     */
    ajaxUpdateComplete() {
        this.anchorPositions = {};
        this.checkPosition();
    }

    /**
     * Determines anchor positions.
     *
     * This is the position where each anchor would be about 80px from the top of the screen.
     */
    getAnchorPositions() {
        document.querySelectorAll('#docs-toc ul li a').forEach((element) => {
            const anchorName = element.getAttribute('href').replace('#', '');
            const anchor = document.querySelector(`a[id="content-${anchorName}"]`);

            if (!anchor) {
                return;
            }

            this.anchorPositions[anchorName] = this.documentOffsetTop(anchor) + (window.innerHeight) - 80;
        });
    }

    /**
     * Checks the current scroll position and detects the closest anchor to highlight in the
     * table of contents.
     */
    checkPosition() {
        this.getAnchorPositions();

        const scrollTop = document.querySelector('#content').scrollTop;
        const scrollBottom = document.querySelector('#content').scrollTop + window.innerHeight;

        document.querySelectorAll('#docs-toc ul li a').forEach((element) => {
            element.parentElement.classList.remove('active')
        });

        if (scrollTop <= 80) {
            const firstAnchor = document.querySelector(`#docs-toc ul li a[href="#${this.getFirstAnchor()}"]`);
            firstAnchor.parentElement.classList.add('active');

            firstAnchor.scrollIntoView({
                behavior: 'auto',
                block: 'center',
            });

            return;
        }

        if (scrollBottom >= (document.querySelector('#content').scrollHeight - 80)) {
            const lastAnchor = document.querySelector(`#docs-toc ul li a[href="#${this.getLastAnchor()}"]`)
            lastAnchor.parentElement.classList.add('active');

            lastAnchor.scrollIntoView({
                behavior: 'auto',
                block: 'center',
            });
            return;
        }

        let currentAnchor = null;

        Object.entries(this.anchorPositions).forEach((entry) => {
            const [anchor, position] = entry;

            if (position <= scrollBottom) {
                currentAnchor = anchor;
            }
        });

        if (currentAnchor) {
            const thisAnchor = document.querySelector(`#docs-toc ul li a[href="#${currentAnchor}"]`)
            thisAnchor.parentElement.classList.add('active');

            thisAnchor.scrollIntoView({
                behavior: 'auto',
                block: 'center',
            });
        }
    }

    getFirstAnchor() {
        return Object.keys(this.anchorPositions)[0];
    }

    getLastAnchor() {
        const length = Object.keys(this.anchorPositions).length;
        return Object.keys(this.anchorPositions)[length - 1];
    }

    /**
     * Gets the element's position offset to the top of the complete page.
     */
    documentOffsetTop(element) {
        let top = 0;
        let currentElement = element;

        while (currentElement !== document.body) {
            currentElement = currentElement.offsetParent;
            top += currentElement.offsetTop;
        }

        return top;
    }
}
