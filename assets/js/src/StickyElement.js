/**
 * Sticky element.
 *
 * Enables support for a sticky element that follows the user down the page. This is different
 * from the "position: sticky" CSS value in that it can cross boundaries and is applied through
 * a data attribute. It leaves a placeholder element when the element is stickied to prevent
 * layout shifting.
 *
 * @author Ben Thomson <git@alfreido.com>
 * @copyright Winter CMS
 */
export default class StickyElement extends Snowboard.PluginBase {
    /**
     * Constructor.
     *
     * @param {HTMLElement} element
     */
    construct(element) {
        this.element = element;

        // Prevent double initialisation
        if (this.element.dataset.stickyInitialised) {
            this.destruct();
            return;
        }
        this.element.dataset.stickyInitialised = true;

        this.placeholder = null;
        this.stickied = false;
        this.boundaried = false;
        this.attached = false;
        this.observer = null;
        this.originalStyle = {};
        this.config = snowboard.dataConfig(this, element);
        this.events = {
            scroll: (event) => this.onScroll(event),
            resize: (event) => this.onWindowResize(event),
            mutation: (event) => this.onMutation(event),
        };

        this.attach();
    }

    /**
     * Default configuration.
     *
     * Values:
     *   - `offsetTop`: Specifies the gap from the top of the window, in pixels, before an element
     *        becomes sticky.
     *   - `offsetBottom`: Specifies the gap from the top of the container or boundary, in pixels,
     *        before an element becomes static.
     *   - `minWidth`: Allows a sticky element to only trigger at a certain viewport width.
     *   - `maxWidth`: Allows a sticky element to become non-sticky at a certain viewport width.
     *   - `zIndex`: The z-index to apply to the sticky element.
     *   - `container`: The element that the sticky element should be contained within. This should
     *        not be used if `boundary` is used.
     *   - `boundary`: The element that acts as the boundary for the element when scrolled to.
     *        Similar to a container, except this element could be considered a "hard stop" for the
     *        sticky element. This should not be used if `container` is used.
     *   - `noAutoHeight`: If `true`, the height of the element will not be adjusted on resize or if
     *        the contents change.
     *
     * @returns {Object}
     */
    defaults() {
        return {
            offsetTop: 0,
            offsetBottom: 0,
            minWidth: 1024,
            maxWidth: 0,
            zIndex: 30,
            container: null,
            boundary: null,
            noAutoHeight: false,
        };
    }

    /**
     * Attaches event listeners to resize and scroll events.
     */
    attach() {
        window.addEventListener('resize', this.events.resize);

        if (window.innerWidth >= this.config.get('minWidth')) {
            this.attached = true;
            document.addEventListener('scroll', this.events.scroll);

            window.requestAnimationFrame(() => {
                this.onScroll();
            });
        }
    }

    /**
     * Destructor.
     */
    destruct() {
        window.removeEventListener('resize', (event) => this.events.resize);
        document.removeEventListener('scroll', (event) => this.events.scroll);

        super.destruct();
    }

    /**
     * Tracks scrolling and applies the sticky element if required.
     */
    onScroll() {
        const bbox = this.element.getBoundingClientRect();

        if (bbox.top <= this.config.get('offsetTop') && !this.stickied) {
            if (this.getBoundary()) {
                const boundBbox = this.getBoundary().getBoundingClientRect();

                if (bbox.bottom >= (boundBbox.top - this.config.get('offsetBottom'))) {
                    return;
                }
            }

            this.beginStick();
            return;
        }
        if (this.stickied) {
            this.checkBoundary();
        }
    }

    /**
     * Tracks if the window is resized and enables or disables the sticky element if any size
     * thresholds are reached.
     */
    onWindowResize() {
        if (
            (
                (
                    this.config.get('minWidth') > 0
                    && window.innerWidth < this.config.get('minWidth')
                )
                ||
                (
                    this.config.get('maxWidth') > 0
                    && window.innerWidth > this.config.get('maxWidth')
                )
            )
            && this.attached
        ) {
            if (this.stickied) {
                this.clearStick();
            }

            document.removeEventListener('scroll', this.events.scroll);

            this.attached = false;
        } else if (
            (
                (
                    this.config.get('minWidth') > 0
                    && window.innerWidth >= this.config.get('minWidth')
                )
                ||
                (
                    this.config.get('maxWidth') > 0
                    && window.innerWidth <= this.config.get('maxWidth')
                )
            )
            && !this.attached
        ) {
            this.attached = true;

            document.addEventListener('scroll', this.events.scroll);

            window.requestAnimationFrame(() => {
                this.onScroll();
            });
        } else if (
            this.attached
            && this.stickied
        ) {
            this.clearStick();
            this.beginStick();
        }
    }

    /**
     * Tracks mutations within the sticky element and re-calculates the height and position
     * of the sticky element.
     */
    onMutation() {
        if (this.stickied && !this.config.get('noAutoHeight')) {
            // Re-calculate height of sticky element
            let height = 0;

            const children = Array.from(this.element.children);
            children.forEach((element) => {
                height += element.getBoundingClientRect().height;
                height += Number(getComputedStyle(element).marginTop.replace('px', ''));
                height += Number(getComputedStyle(element).marginBottom.replace('px', ''));
            });
            height += Number(getComputedStyle(this.element).borderTopWidth.replace('px', ''));
            height += Number(getComputedStyle(this.element).borderBottomWidth.replace('px', ''));

            this.element.style.height = `${height}px`;
        }

        this.onScroll();
    }

    /**
     * Makes the element sticky.
     *
     * This will create an invisible placeholder of equal width and height in place of the sticky
     * element, and makes the element fixed on the page until it hits the end of the container, or
     * the top of the boundary element.
     */
    beginStick() {
        this.stickied = true;

        const bbox = this.element.getBoundingClientRect();

        // Create an invisible placeholder that will take up the original space for the element
        this.placeholder = this.element.cloneNode();
        this.placeholder.removeAttribute('id');
        this.placeholder.style.width = `${bbox.width}px`;
        this.placeholder.style.height = `${bbox.height}px`;
        this.placeholder.style.visibility = 'hidden';
        this.element.before(this.placeholder);

        // Make the current element stickied
        this.originalStyle = {
            position: this.element.style.position,
            top: this.element.style.top,
            left: this.element.style.left,
            width: this.element.style.width,
            height: this.element.style.height,
            zIndex: this.element.style.zIndex,
        };

        this.element.style.position = 'fixed';
        this.element.style.top = `${this.config.get('offsetTop')}px`;
        this.element.style.left = `${bbox.left}px`;
        this.element.style.width = `${bbox.width}px`;
        this.element.style.height = `${bbox.height}px`;
        this.element.style.zIndex = this.config.get('zIndex');
        this.element.classList.add('stickied');

        // Create mutation observer on element
        this.observer = new MutationObserver(this.events.mutation);
        this.observer.observe(this.element, {
            attributes: false,
            childList: true,
            subtree: true,
        });
    }

    /**
     * Makes the element static.
     *
     * This is fired if the element reaches its original position. It clears the placeholder and
     * destroys the mutation observer.
     */
    clearStick() {
        this.stickied = false;
        this.placeholder.remove();

        // Reset element styling
        Object.entries(this.originalStyle).forEach((entry) => {
            const [key, value] = entry;
            this.element.style[key] = value;
        });
        this.element.classList.remove('stickied');

        // Destroy observer
        this.observer.disconnect();
        this.observer = null;
    }

    /**
     * Returns the boundary element, if one is provided.
     *
     * @returns {HTMLElement}
     */
    getBoundary() {
        if (!this.config.get('boundary')) {
            return null;
        }

        const boundary = document.querySelector(this.config.get('boundary'));

        if (!boundary) {
            return null;
        }

        return boundary;
    }

    /**
     * Checks collision with the boundary element.
     *
     * If the sticky element is in sticky mode, and hits the boundary element, this freezes the
     * element in place so that it follows the scroll once more.
     */
    checkBoundary() {
        const bbox = this.element.getBoundingClientRect();
        const phBbox = this.placeholder.getBoundingClientRect();

        if (phBbox.top > bbox.top && this.stickied) {
            this.clearStick();
            return;
        }
        if (this.getBoundary()) {
            const boundBbox = this.getBoundary().getBoundingClientRect();

            if (bbox.bottom >= (boundBbox.top - this.config.get('offsetBottom')) && this.stickied && !this.boundaried) {
                const stopPoint = this.getBoundary().offsetTop - this.config.get('offsetBottom');
                const elementTop = stopPoint - bbox.height - this.documentOffsetTop(this.placeholder);

                this.boundaried = true;

                this.element.style.position = 'absolute';
                this.element.classList.remove('stickied');
                this.element.style.top = `${elementTop}px`;
            } else if (bbox.top > this.config.get('offsetTop') && this.stickied && this.boundaried) {
                this.element.style.position = 'fixed';
                this.element.classList.add('stickied');
                this.element.style.top = `${this.config.get('offsetTop')}px`;

                this.boundaried = false;
            }
        }
    }

    /**
     * Tracks the top offset of the given element, relative to the root of the page.
     *
     * @param {HTMLElement} element
     * @returns {Number}
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
