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
        document.addEventListener('scroll', () => this.checkPosition(), {
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

        const scrollTop = window.scrollY;
        const scrollBottom = window.scrollY + window.innerHeight;

        document.querySelectorAll('#docs-toc ul li a').forEach((element) => {
            element.parentElement.classList.remove('active')
        });

        if (scrollTop <= 80) {
            document.querySelector(`#docs-toc ul li a[href="#${this.getFirstAnchor()}"]`).parentElement
                .classList.add('active');
            this.updateHash(this.getFirstAnchor());
            return;
        }

        if (scrollBottom >= document.body.scrollHeight) {
            document.querySelector(`#docs-toc ul li a[href="#${this.getLastAnchor()}"]`).parentElement
                .classList.add('active');
                this.updateHash(this.getLastAnchor());
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
            document.querySelector(`#docs-toc ul li a[href="#${currentAnchor}"]`).parentElement
                .classList.add('active');
            this.updateHash(currentAnchor);
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

    /**
     * Updates the current hashbang and history as the user scrolls through the documentation.
     *
     * @param {String} anchor
     */
    updateHash(anchor) {
        const currentHash = window.location.hash.replace('#', '');
        if (currentHash === anchor) {
            return;
        }

        // Recreate URL with hash change
        const newUrl = window.location.pathname + window.location.search + '#' + anchor;

        history.replaceState(history.state, '', newUrl);
    }
}
